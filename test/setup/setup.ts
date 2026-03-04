import { execSync } from 'child_process';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import { KafkaContainer } from '@testcontainers/kafka';
import { Network, GenericContainer, Wait } from 'testcontainers';
import data from '../../.docker/debezium/user-outbox-connector.json';

export default async function setup() {
  const network = await new Network().start();
  const [pgContainer, redisContainer, kafkaContainer] = await Promise.all([
    new PostgreSqlContainer(`postgres:18.1`)
      .withNetwork(network)
      .withNetworkAliases('postgres')
      .withCommand([
        'postgres',
        '-c',
        'wal_level=logical',
        '-c',
        'max_wal_senders=4',
        '-c',
        'max_replication_slots=4',
      ])
      .withHealthCheck({
        test: ['CMD-SHELL', 'pg_isready -U postgres'],
        interval: 2000,
        timeout: 5000,
        retries: 5,
      })
      .withWaitStrategy(Wait.forHealthCheck())
      .start(),
    new RedisContainer('redis:7.4-alpine').start(),
    new KafkaContainer('confluentinc/cp-kafka:8.2.0')
      .withNetwork(network)
      .withNetworkAliases('kafka')
      .withExposedPorts(9092)
      .withEnvironment({
        KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true',
        KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: '1',
        KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: '1',
        KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: '1',
      })
      .withKraft()
      .withHealthCheck({
        test: [
          'CMD',
          'kafka-broker-api-versions',
          '--bootstrap-server',
          'localhost:9092',
        ],
        interval: 2000,
        timeout: 5000,
        retries: 5,
      })
      .withWaitStrategy(Wait.forHealthCheck())
      .start(),
  ]);

  process.env.DATABASE_URL = pgContainer.getConnectionUri();
  execSync('tsx db/reset-database.ts', {
    stdio: 'inherit',
  });

  const kafkaBootstrapServer = `${kafkaContainer.getHost()}:${kafkaContainer.getMappedPort(9093)}`;
  const kafkaInternalBootstrap = `kafka:9092`;
  const kafkaConnectContainer = await new GenericContainer(
    'debezium/connect:3.0.0.Final',
  )
    .withNetwork(network)
    .withNetworkAliases('kafka-connect')
    .withExposedPorts(8083)
    .withEnvironment({
      BOOTSTRAP_SERVERS: kafkaInternalBootstrap,
      GROUP_ID: '1',
      CONFIG_STORAGE_TOPIC: 'connect_configs',
      OFFSET_STORAGE_TOPIC: 'connect_offsets',
      STATUS_STORAGE_TOPIC: 'connect_statuses',
      CONFIG_STORAGE_REPLICATION_FACTOR: '1',
      OFFSET_STORAGE_REPLICATION_FACTOR: '1',
      STATUS_STORAGE_REPLICATION_FACTOR: '1',
      CONNECT_BOOTSTRAP_SERVERS: kafkaInternalBootstrap,
      CONNECT_REST_ADVERTISED_HOST_NAME: 'kafka-connect',
      CONNECT_REST_PORT: '8083',
      CONNECT_GROUP_ID: 'connect-cluster',
      CONNECT_CONFIG_STORAGE_TOPIC: 'connect-configs',
      CONNECT_OFFSET_STORAGE_TOPIC: 'connect-offsets',
      CONNECT_STATUS_STORAGE_TOPIC: 'connect-status',
      CONNECT_KEY_CONVERTER: 'org.apache.kafka.connect.json.JsonConverter',
      CONNECT_VALUE_CONVERTER: 'org.apache.kafka.connect.json.JsonConverter',
      CONNECT_INTERNAL_KEY_CONVERTER:
        'org.apache.kafka.connect.json.JsonConverter',
      CONNECT_INTERNAL_VALUE_CONVERTER:
        'org.apache.kafka.connect.json.JsonConverter',
      CONNECT_LOG4J_ROOT_LOGLEVEL: 'INFO',
      CONNECT_LOG4J_LOGGERS:
        'org.apache.kafka.connect.runtime.rest=WARN,org.reflections=ERROR',
      CONNECT_PLUGIN_PATH: '/kafka/connect',
    })
    .withHealthCheck({
      test: ['CMD', 'curl', '-f', 'http://localhost:8083/'],
      interval: 2000,
      timeout: 5000,
      retries: 5,
    })
    .withWaitStrategy(Wait.forHealthCheck())
    .start();

  const connectHost = kafkaConnectContainer.getHost();
  const connectPort = kafkaConnectContainer.getMappedPort(8083);
  const connectUrl = `http://${connectHost}:${connectPort}`;

  const response = await fetch(`${connectUrl}/connectors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      ...data,
      config: {
        ...data.config,
        'database.hostname': 'postgres',
        'database.port': 5432,
        'database.user': pgContainer.getUsername(),
        'database.password': pgContainer.getPassword(),
        'database.dbname': pgContainer.getDatabase(),
        'topic.creation.default.replication.factor': 1,
        'topic.creation.default.partitions': 1,
        'topic.creation.schemahistory.replication.factor': 1,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to register connector: ${await response.text()}`);
  }

  process.env.REDIS_URL = redisContainer.getConnectionUrl();
  process.env.KAFKA_BROKER = kafkaBootstrapServer;

  return function teardown() {
    console.log('Vitest setup teardown');
    pgContainer.stop().then(() => console.log('PostgreSqlContainer stopped'));
    redisContainer.stop().then(() => console.log('RedisContainer stopped'));
    kafkaContainer.stop().then(() => console.log('KafkaContainer stopped'));
    kafkaConnectContainer
      .stop()
      .then(() => console.log('Debezium kafka connect stopped'));
  };
}
