import { mock, mockFn, mockReset } from 'vitest-mock-extended';
import { KafkaJS } from '@confluentinc/kafka-javascript';
import { AppConfig } from '@technical/app-config/app-config';
import { ConsumerFactory } from './consumer.factory';
import {
  EachMessageHandler,
  EachMessagePayload,
} from '@confluentinc/kafka-javascript/types/kafkajs';

describe(ConsumerFactory.name, () => {
  const kafkaConsumer = mock<KafkaJS.Consumer>();
  const kafka = mock<KafkaJS.Kafka>();
  kafka.consumer.mockReturnValue(kafkaConsumer);
  const appConfig = mock<AppConfig>();
  appConfig.values.KAFKA_USERS_OUTBOX_TOPIC = 'random';
  const messageHandler = mockFn<EachMessageHandler>();
  const consumerCfg: KafkaJS.ConsumerConstructorConfig = {
    'group.id': 'random-group-d',
    'max.poll.interval.ms': 200,
  };
  const topicsCfg: KafkaJS.ConsumerSubscribeTopics = {
    topics: ['random-cfg'],
  };

  const factory = new ConsumerFactory(kafka);

  beforeEach(() => {
    mockReset(kafkaConsumer);
    mockReset(messageHandler);
  });

  describe(ConsumerFactory.prototype.create.name, () => {
    it('should return kafka consumer instance', async () => {
      const createdConsumer = await factory.create({
        config: consumerCfg,
        topics: topicsCfg,
        messageHandler,
      });

      expect(kafka.consumer).toHaveBeenCalledWith(consumerCfg);
      expect(createdConsumer).toBe(kafkaConsumer);
    });

    it('should connect kafka consumer', async () => {
      await factory.create({
        config: consumerCfg,
        topics: topicsCfg,
        messageHandler,
      });

      expect(kafkaConsumer.connect).toHaveBeenCalledTimes(1);
    });

    it('should subscribe to topic', async () => {
      await factory.create({
        config: consumerCfg,
        topics: topicsCfg,
        messageHandler,
      });

      expect(kafkaConsumer.subscribe).toHaveBeenCalledWith(topicsCfg);
    });

    it('should call run with eachMessage callback', async () => {
      await factory.create({
        config: consumerCfg,
        topics: topicsCfg,
        messageHandler,
      });
      expect(kafkaConsumer.run).toHaveBeenCalledWith(
        expect.objectContaining({
          eachMessage: expect.any(Function),
        }),
      );
    });

    it('should call messageHandler when eachMessage is invoked', async () => {
      await factory.create({
        config: consumerCfg,
        topics: topicsCfg,
        messageHandler,
      });

      const runCallArg = kafkaConsumer.run.mock.calls[0][0];
      const mockMessage = mock<EachMessagePayload>();

      await runCallArg?.eachMessage?.(mockMessage);

      expect(messageHandler).toHaveBeenCalledWith(mockMessage);
    });
  });
});
