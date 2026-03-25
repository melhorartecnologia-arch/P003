import { Queue } from 'bullmq';
import { redis } from '../../config/redis';

export const processingQueue = new Queue('document-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
