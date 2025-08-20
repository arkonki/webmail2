import { Queue } from 'bullmq';
import redis from '../lib/redis';

const defaultQueueOptions = {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
};

export const mailSyncQueue = new Queue('mail-sync', defaultQueueOptions);
export const sendEmailQueue = new Queue('send-email', defaultQueueOptions);
export const ruleProcessingQueue = new Queue('rule-processing', defaultQueueOptions);
export const autoresponderQueue = new Queue('autoresponder', defaultQueueOptions);
export const messageUpdateQueue = new Queue('message-update', defaultQueueOptions);

console.log('BullMQ queues initialized.');