import { KafkaJS } from '@confluentinc/kafka-javascript';
import { mock, mockReset } from 'vitest-mock-extended';

export const createKafkaMock = () => {
  const kafkaProducerMock = mock<KafkaJS.Producer>();
  const kafkaConsumerMock = mock<KafkaJS.Consumer>();
  const kafkaAdminMock = mock<KafkaJS.Admin>();
  const kafkaMock = mock<KafkaJS.Kafka>({
    admin: () => kafkaAdminMock,
    producer: () => kafkaProducerMock,
    consumer: () => kafkaConsumerMock,
  });

  return {
    kafkaMock,
    kafkaProducerMock,
    kafkaConsumerMock,
    kafkaAdminMock,
    resetKafkaMock: () => mockReset(kafkaMock),
    resetKafkaProducerMock: () => mockReset(kafkaProducerMock),
    resetKafkaConsumerMock: () => mockReset(kafkaConsumerMock),
    resetKafkaAdminMock: () => mockReset(kafkaAdminMock),
    resetKafka: () => {
      mockReset(kafkaMock);
      mockReset(kafkaProducerMock);
      mockReset(kafkaConsumerMock);
      mockReset(kafkaAdminMock);
    },
  };
};
