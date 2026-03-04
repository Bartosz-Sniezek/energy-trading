import { mock, mockReset } from 'vitest-mock-extended';
import { UsersOutboxConsumer } from './users-outbox.consumer';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { AppConfig } from '@technical/app-config/app-config';
import { UsersOutboxMessageHandler } from './users-outbox-message.handler';
import { ConsumerFactory } from '@modules/kafka/consumer.factory';
import { EachMessagePayload } from '@confluentinc/kafka-javascript/types/kafkajs';
import { loggerMock } from 'test/helpers/logger.mock';
import { GROUP_ID } from './constants';

describe(UsersOutboxConsumer.name, () => {
  const appConfig = mock<AppConfig>({
    values: {
      KAFKA_LOG_LEVEL: 0,
    },
  });
  appConfig.values.KAFKA_USERS_OUTBOX_TOPIC = 'random';
  const messageHandler = mock<UsersOutboxMessageHandler>();

  beforeEach(() => {
    mockReset(messageHandler);
    mockReset(appConfig);
  });

  describe('inits', () => {
    const kafkaConsumer = mock<KafkaJS.Consumer>();
    const consumerFactory = mock<ConsumerFactory>();
    const service = new UsersOutboxConsumer(
      consumerFactory,
      appConfig,
      messageHandler,
      loggerMock,
    );

    beforeEach(() => {
      mockReset(consumerFactory);
      consumerFactory.create.mockResolvedValue(kafkaConsumer);
    });

    describe(UsersOutboxConsumer.prototype.onModuleInit.name, () => {
      it('should create consumer', async () => {
        await service.onModuleInit();
        expect(consumerFactory.create).toHaveBeenCalledTimes(1);
      });

      it('should create consumer with create topics options for non production env', async () => {
        appConfig.isProduction.mockReturnValue(false);

        await service.onModuleInit();

        expect(consumerFactory.create).toHaveBeenCalledTimes(1);
        expect(consumerFactory.create).toHaveBeenCalledWith({
          config: {
            'group.id': GROUP_ID,
            'session.timeout.ms': 30000,
            'heartbeat.interval.ms': 3000,
            'auto.offset.reset': 'beginning',
            'enable.auto.commit': false,
            log_level: 0,
          },
          topics: {
            topics: [appConfig.values.KAFKA_USERS_OUTBOX_TOPIC],
          },
          createTopics: [
            {
              topic: appConfig.values.KAFKA_USERS_OUTBOX_TOPIC,
              numPartitions: 1,
              replicationFactor: 1,
            },
          ],
          messageHandler: expect.toBeFunction(),
        });
      });

      it('should create consumer without create topics for production env', async () => {
        appConfig.isProduction.mockReturnValue(true);

        await service.onModuleInit();

        expect(consumerFactory.create).toHaveBeenCalledTimes(1);
        expect(consumerFactory.create).toHaveBeenCalledWith({
          config: {
            'group.id': GROUP_ID,
            'session.timeout.ms': 30000,
            'heartbeat.interval.ms': 3000,
            'auto.offset.reset': 'beginning',
            'enable.auto.commit': false,
            log_level: 0,
          },
          topics: {
            topics: [appConfig.values.KAFKA_USERS_OUTBOX_TOPIC],
          },
          createTopics: undefined,
          messageHandler: expect.toBeFunction(),
        });
      });
    });

    describe(UsersOutboxConsumer.prototype.onModuleDestroy.name, () => {
      it('should disconnect', async () => {
        await service.onModuleDestroy();
        expect(kafkaConsumer.disconnect).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Message handler', () => {
    const kafkaMock = mock<KafkaJS.Kafka>();
    const kafkaConsumerMock = mock<KafkaJS.Consumer>();
    const kafkaAdmin = mock<KafkaJS.Admin>();
    const consumerFactory = new ConsumerFactory(kafkaMock);
    let consumer: UsersOutboxConsumer;

    beforeEach(() => {
      mockReset(kafkaMock);
      mockReset(kafkaConsumerMock);
      mockReset(kafkaAdmin);
      kafkaMock.consumer.mockReturnValue(kafkaConsumerMock);
      kafkaMock.admin.mockReturnValue(kafkaAdmin);
      appConfig.isProduction.mockReturnValue(true);
      consumer = new UsersOutboxConsumer(
        consumerFactory,
        appConfig,
        messageHandler,
        loggerMock,
      );
    });

    it('should call message handler and commit offset when eachMessage is invoked', async () => {
      appConfig.isProduction.mockReturnValue(true);
      await consumer.onModuleInit();
      const runCallArg = kafkaConsumerMock.run.mock.calls[0][0];
      const messageMock = mock<EachMessagePayload>({
        message: {
          offset: '12',
        },
        topic: 'some-topic',
        partition: 2,
      });

      await runCallArg?.eachMessage?.(messageMock);

      expect(messageHandler.handleMessage).toHaveBeenCalledWith(messageMock);
      expect(messageHandler.handleMessage).toHaveBeenCalledTimes(1);
      expect(kafkaConsumerMock.commitOffsets).toHaveBeenCalledWith([
        {
          topic: 'some-topic',
          partition: 2,
          offset: '13',
        },
      ]);
    });

    it('should not commit offset when message handler failed', async () => {
      await consumer.onModuleInit();
      const runCallArg = kafkaConsumerMock.run.mock.calls[0][0];
      const messageMock = mock<EachMessagePayload>({
        message: {
          offset: '12',
        },
        topic: 'some-topic',
        partition: 2,
      });
      messageHandler.handleMessage.mockRejectedValue(new Error('Some error'));

      await expect(runCallArg?.eachMessage?.(messageMock)).rejects.toThrow();

      expect(messageHandler.handleMessage).toHaveBeenCalledWith(messageMock);
      expect(messageHandler.handleMessage).toHaveBeenCalledTimes(1);
      expect(kafkaConsumerMock.commitOffsets).toHaveBeenCalledTimes(0);
    });
  });
});
