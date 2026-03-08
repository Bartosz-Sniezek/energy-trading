import { mock, mockReset } from 'vitest-mock-extended';
import { UsersOutboxConsumer } from './users-outbox.consumer';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { AppConfig } from '@technical/app-config/app-config';
import { UsersOutboxMessageHandler } from './users-outbox-message.handler';
import { EachMessagePayload } from '@confluentinc/kafka-javascript/types/kafkajs';
import { loggerMock } from 'test/helpers/logger.mock';
import { PermanentError } from '@common/kafka/permanent.error';
import { TransientError } from '@common/kafka/transient.error';

describe(UsersOutboxConsumer.name, () => {
  const appConfig = mock<AppConfig>({
    values: {
      KAFKA_LOG_LEVEL: 0,
      EMAIL_NOTIFIER_CONSUMER_GROUP_ID: 'consumer-group',
      KAFKA_USERS_OUTBOX_TOPIC: 'outbox-topic',
      KAFKA_USERS_OUTBOX_TOPIC_DLQ: 'outbox-topic.dlq',
      EMAIL_NOTIFIER_CONSUMER_MAX_RETRIES: 2,
      EMAIL_NOTIFIER_CONSUMER_RETRY_BASE_DELAY: 50,
    },
  });
  appConfig.values.KAFKA_USERS_OUTBOX_TOPIC = 'random';
  const messageHandler = mock<UsersOutboxMessageHandler>();
  const kafkaAdmin = mock<KafkaJS.Admin>();
  const kafkaConsumer = mock<KafkaJS.Consumer>();
  const kafkaService = mock<KafkaJS.Kafka>();
  const kafkaDlqProducer = mock<KafkaJS.Producer>();

  beforeEach(() => {
    mockReset(messageHandler);
    mockReset(appConfig);
    mockReset(kafkaConsumer);
    mockReset(kafkaDlqProducer);
    mockReset(kafkaAdmin);
    mockReset(kafkaService);
    kafkaService.consumer.mockReturnValue(kafkaConsumer);
    kafkaService.producer.mockReturnValue(kafkaDlqProducer);
    kafkaService.admin.mockReturnValue(kafkaAdmin);
  });

  describe('inits', () => {
    describe(UsersOutboxConsumer.prototype.onModuleInit.name, () => {
      it('should create consumer', async () => {
        const service = new UsersOutboxConsumer(
          kafkaService,
          appConfig,
          messageHandler,
          loggerMock,
        );
        await service.onModuleInit();
        expect(kafkaService.consumer).toHaveBeenCalledTimes(1);
      });

      it('should create consumer and create topic for non production env', async () => {
        appConfig.isProduction.mockReturnValue(false);

        const service = new UsersOutboxConsumer(
          kafkaService,
          appConfig,
          messageHandler,
          loggerMock,
        );

        await service.onModuleInit();

        expect(kafkaService.consumer).toHaveBeenCalledTimes(1);
        expect(kafkaService.consumer).toHaveBeenCalledWith({
          'group.id': appConfig.values.EMAIL_NOTIFIER_CONSUMER_GROUP_ID,
          'session.timeout.ms': 10000,
          'max.poll.interval.ms': 10000,
          'heartbeat.interval.ms': 7000,
          'auto.offset.reset': 'beginning',
          'enable.auto.commit': false,
          log_level: 0,
        });
        expect(kafkaConsumer.subscribe).toHaveBeenCalledWith({
          topic: appConfig.values.KAFKA_USERS_OUTBOX_TOPIC,
        });
        expect(kafkaConsumer.run).toHaveBeenCalledWith({
          eachMessage: expect.toBeFunction(),
        });
        expect(kafkaService.admin).toHaveBeenCalledOnce();
        expect(kafkaAdmin.connect).toHaveBeenCalledOnce();
        expect(kafkaAdmin.createTopics).toHaveBeenCalledWith({
          topics: [
            {
              topic: appConfig.values.KAFKA_USERS_OUTBOX_TOPIC,
            },
          ],
        });
        expect(kafkaAdmin.disconnect).toHaveBeenCalledOnce();
      });

      it('should create consumer without create topics for production env', async () => {
        appConfig.isProduction.mockReturnValue(true);

        const service = new UsersOutboxConsumer(
          kafkaService,
          appConfig,
          messageHandler,
          loggerMock,
        );

        await service.onModuleInit();

        expect(kafkaService.consumer).toHaveBeenCalledTimes(1);
        expect(kafkaService.consumer).toHaveBeenCalledWith({
          'group.id': appConfig.values.EMAIL_NOTIFIER_CONSUMER_GROUP_ID,
          'session.timeout.ms': 10000,
          'max.poll.interval.ms': 10000,
          'heartbeat.interval.ms': 7000,
          'auto.offset.reset': 'beginning',
          'enable.auto.commit': false,
          log_level: 0,
        });
        expect(kafkaConsumer.subscribe).toHaveBeenCalledWith({
          topic: appConfig.values.KAFKA_USERS_OUTBOX_TOPIC,
        });
        expect(kafkaConsumer.run).toHaveBeenCalledWith({
          eachMessage: expect.toBeFunction(),
        });
        expect(kafkaService.admin).not.toHaveBeenCalled();
        expect(kafkaAdmin.connect).not.toHaveBeenCalled();
        expect(kafkaAdmin.createTopics).not.toHaveBeenCalled();
        expect(kafkaAdmin.disconnect).not.toHaveBeenCalledOnce();
      });
    });

    describe(UsersOutboxConsumer.prototype.onModuleDestroy.name, () => {
      it('should disconnect', async () => {
        const service = new UsersOutboxConsumer(
          kafkaService,
          appConfig,
          messageHandler,
          loggerMock,
        );
        await service.onModuleInit();

        await service.onModuleDestroy();
        expect(kafkaConsumer.disconnect).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Message handler', () => {
    const messageMock: EachMessagePayload = {
      message: {
        key: Buffer.from('some-key'),
        headers: {
          'org-header': Buffer.from('value'),
        },
        value: Buffer.from(JSON.stringify({ foo: 'bar' })),
        offset: '12',
        timestamp: '123',
        attributes: 1,
      },
      topic: appConfig.values.KAFKA_USERS_OUTBOX_TOPIC,
      partition: 2,
      heartbeat: () => Promise.resolve(),
      pause: () => () => {},
    };

    beforeEach(() => {
      appConfig.isProduction.mockReturnValue(true);
    });

    it('should call message handler and commit offset when eachMessage is invoked', async () => {
      const service = new UsersOutboxConsumer(
        kafkaService,
        appConfig,
        messageHandler,
        loggerMock,
      );

      await service.onModuleInit();
      const runCallArg = kafkaConsumer.run.mock.calls[0][0];
      const messageMock = mock<EachMessagePayload>({
        message: {
          offset: '12',
        },
        topic: appConfig.values.KAFKA_USERS_OUTBOX_TOPIC,
        partition: 2,
      });

      await runCallArg?.eachMessage?.(messageMock);

      expect(messageHandler.handleMessage).toHaveBeenCalledWith(messageMock);
      expect(messageHandler.handleMessage).toHaveBeenCalledTimes(1);
      expect(kafkaConsumer.commitOffsets).toHaveBeenCalledWith([
        {
          topic: appConfig.values.KAFKA_USERS_OUTBOX_TOPIC,
          partition: 2,
          offset: '13',
        },
      ]);
    });

    it('should send to DLQ and commit offset when message handler max attempt reached', async () => {
      const handler = mock<UsersOutboxMessageHandler>();
      const service = new UsersOutboxConsumer(
        kafkaService,
        appConfig,
        handler,
        loggerMock,
      );
      await service.onModuleInit();

      const runCallArg = kafkaConsumer.run.mock.calls[0][0];

      const error = new Error(`Message handler error`);
      handler.handleMessage.mockImplementation(() => {
        throw error;
      });

      await runCallArg?.eachMessage?.(messageMock);

      expect(handler.handleMessage).toHaveBeenCalledWith(messageMock);
      expect(handler.handleMessage).toHaveBeenCalledTimes(
        appConfig.values.EMAIL_NOTIFIER_CONSUMER_MAX_RETRIES,
      );
      expect(kafkaDlqProducer.send).toHaveBeenCalledWith({
        topic: appConfig.values.KAFKA_USERS_OUTBOX_TOPIC_DLQ,
        messages: [
          {
            key: messageMock.message.key,
            value: messageMock.message.value,
            headers: {
              ...messageMock.message.headers,
              'x-error-name': Buffer.from(error.name),
              'x-error-message': Buffer.from(error.message),
              'x-error-stack': Buffer.from(error.stack || ''),
              'x-original-topic': Buffer.from(messageMock.topic),
              'x-original-partition': Buffer.from(
                messageMock.partition.toString(),
              ),
              'x-original-offset': Buffer.from(messageMock.message.offset),
              'x-original-timestamp': Buffer.from(
                messageMock.message.timestamp,
              ),
              'x-consumer-group-id': Buffer.from(
                appConfig.values.EMAIL_NOTIFIER_CONSUMER_GROUP_ID,
              ),
            },
          },
        ],
      });
      expect(kafkaConsumer.commitOffsets).toHaveBeenCalledTimes(1);
    });

    it('should send to DLQ and commit offset, retry with max Attempts when handler throws TransientError', async () => {
      const handler = mock<UsersOutboxMessageHandler>();
      const service = new UsersOutboxConsumer(
        kafkaService,
        appConfig,
        handler,
        loggerMock,
      );
      await service.onModuleInit();

      const runCallArg = kafkaConsumer.run.mock.calls[0][0];

      class CustomTransientError extends TransientError {}

      const error = new CustomTransientError(`Message handler error`);
      handler.handleMessage.mockImplementation(() => {
        throw error;
      });

      await runCallArg?.eachMessage?.(messageMock);

      expect(handler.handleMessage).toHaveBeenCalledWith(messageMock);
      expect(handler.handleMessage).toHaveBeenCalledTimes(
        appConfig.values.EMAIL_NOTIFIER_CONSUMER_MAX_RETRIES,
      );
      expect(kafkaDlqProducer.send).toHaveBeenCalledWith({
        topic: appConfig.values.KAFKA_USERS_OUTBOX_TOPIC_DLQ,
        messages: [
          {
            key: messageMock.message.key,
            value: messageMock.message.value,
            headers: {
              ...messageMock.message.headers,
              'x-error-name': Buffer.from(error.name),
              'x-error-message': Buffer.from(error.message),
              'x-error-stack': Buffer.from(error.stack || ''),
              'x-original-topic': Buffer.from(messageMock.topic),
              'x-original-partition': Buffer.from(
                messageMock.partition.toString(),
              ),
              'x-original-offset': Buffer.from(messageMock.message.offset),
              'x-original-timestamp': Buffer.from(
                messageMock.message.timestamp,
              ),
              'x-consumer-group-id': Buffer.from(
                appConfig.values.EMAIL_NOTIFIER_CONSUMER_GROUP_ID,
              ),
            },
          },
        ],
      });
      expect(kafkaConsumer.commitOffsets).toHaveBeenCalledTimes(1);
    });

    it('should send to DLQ instantly on Permanent error and commit offset', async () => {
      const handler = mock<UsersOutboxMessageHandler>();
      const service = new UsersOutboxConsumer(
        kafkaService,
        appConfig,
        handler,
        loggerMock,
      );
      await service.onModuleInit();

      const runCallArg = kafkaConsumer.run.mock.calls[0][0];

      class CustomPermanentError extends PermanentError {}

      const error = new CustomPermanentError(`Message handler error`);
      handler.handleMessage.mockImplementation(() => {
        throw error;
      });

      await runCallArg?.eachMessage?.(messageMock);

      expect(handler.handleMessage).toHaveBeenCalledWith(messageMock);
      expect(handler.handleMessage).toHaveBeenCalledTimes(1);
      expect(kafkaDlqProducer.send).toHaveBeenCalledWith({
        topic: appConfig.values.KAFKA_USERS_OUTBOX_TOPIC_DLQ,
        messages: [
          {
            key: messageMock.message.key,
            value: messageMock.message.value,
            headers: {
              ...messageMock.message.headers,
              'x-error-name': Buffer.from(error.name),
              'x-error-message': Buffer.from(error.message),
              'x-error-stack': Buffer.from(error.stack || ''),
              'x-original-topic': Buffer.from(messageMock.topic),
              'x-original-partition': Buffer.from(
                messageMock.partition.toString(),
              ),
              'x-original-offset': Buffer.from(messageMock.message.offset),
              'x-original-timestamp': Buffer.from(
                messageMock.message.timestamp,
              ),
              'x-consumer-group-id': Buffer.from(
                appConfig.values.EMAIL_NOTIFIER_CONSUMER_GROUP_ID,
              ),
            },
          },
        ],
      });
      expect(kafkaConsumer.commitOffsets).toHaveBeenCalledTimes(1);
    });
  });
});
