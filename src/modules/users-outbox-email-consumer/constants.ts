export const GROUP_ID = `users.outbox.email-notifiers`;

export const CLIENT_ID = `users.outbox.email-notifier.consumer.${process.env['NODE_ENV']}.${process.env['HOSTNAME'] || process.env['USERNAME'] || 'unknown'}`;

export const KAFKA_CONSUMER = 'KAFKA_CONSUMER' as const;
