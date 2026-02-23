export const GROUP_ID = `users.outbox.email-notifiers`;

export const CLIENT_ID = `users.outbox.email-notifier.consumer.${process.env['NODE_ENV']}.${process.env['HOSTNAME'] || process.env['USERNAME'] || 'unknown'}`;

export const KAFKA_CONSUMER = 'KAFKA_CONSUMER' as const;

export const USER_ACCOUNT_REGISTERED_EMAIL_TEMPLATE = Symbol(
  'USER_ACCOUNT_REGISTERED_EMAIL_TEMPLATE',
);

export const USER_ACCOUNT_ACTIVATED_EMAIL_TEMPLATE = Symbol(
  'USER_ACCOUNT_ACTIVATED_EMAIL_TEMPLATE',
);
