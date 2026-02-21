export const rabbitmqConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://admin:password@localhost:5672',
  queues: {
    registration: 'vc-registration-queue',
    audit: 'vc-audit-queue',
    dlq: 'vc-dlq',
  },
  prefetchCount: 10,
  maxRetries: 3,
  retryDelays: [1000, 2000, 4000],
};
export const retryConfig = {
  maxRetries: 5,
  retryDelay: 1000,
  backoffMultiplier: 2,
};
