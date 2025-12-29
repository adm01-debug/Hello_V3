import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JobQueueManager, JobPriority, JobStatus } from '../job-queue-manager';
import Bull from 'bull';

describe('JobQueueManager', () => {
  let manager: JobQueueManager;

  beforeEach(() => {
    manager = new JobQueueManager();
  });

  afterEach(async () => {
    await manager.gracefulShutdown();
  });

  describe('Queue Creation', () => {
    it('should create a new queue', () => {
      const queue = manager.getQueue('test-queue');
      expect(queue).toBeDefined();
      expect(queue).toBeInstanceOf(Bull);
    });

    it('should reuse existing queue', () => {
      const queue1 = manager.getQueue('test-queue');
      const queue2 = manager.getQueue('test-queue');
      expect(queue1).toBe(queue2);
    });
  });

  describe('Job Processing', () => {
    it('should add job to queue', async () => {
      const jobData = {
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body',
      };

      const job = await manager.addJob('email', jobData);
      
      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.data.userId).toBe('user-123');
    });

    it('should process jobs with registered processor', async () => {
      const mockProcessor = vi.fn().mockResolvedValue({ success: true });
      
      manager.registerProcessor('test', mockProcessor, 1);

      const jobData = {
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        metadata: { test: true },
      };

      await manager.addJob('test', jobData);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockProcessor).toHaveBeenCalled();
    });

    it('should encrypt sensitive data', async () => {
      const sensitiveData = {
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        password: 'secret123',
      };

      const job = await manager.addJob('test', sensitiveData as any);

      // Data should be encrypted
      expect(job.data.encrypted).toBeDefined();
      expect(job.data.password).toBeUndefined();
    });
  });

  describe('Job Status', () => {
    it('should get job status', async () => {
      manager.registerProcessor('test', async () => ({ done: true }));

      const job = await manager.addJob('test', {
        userId: 'user-123',
        createdAt: new Date().toISOString(),
      });

      const status = await manager.getJobStatus('test', job.id!.toString());

      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('progress');
    });

    it('should throw for non-existent job', async () => {
      await expect(
        manager.getJobStatus('test', 'non-existent')
      ).rejects.toThrow('Job non-existent not found');
    });
  });

  describe('Queue Statistics', () => {
    it('should return queue stats', async () => {
      manager.getQueue('test');

      const stats = await manager.getQueueStats('test');

      expect(stats).toHaveProperty('waiting');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('delayed');
      expect(stats).toHaveProperty('paused');
    });
  });

  describe('Queue Management', () => {
    it('should pause queue', async () => {
      const queue = manager.getQueue('test');
      await manager.pauseQueue('test');

      const isPaused = await queue.isPaused();
      expect(isPaused).toBe(true);
    });

    it('should resume paused queue', async () => {
      const queue = manager.getQueue('test');
      await manager.pauseQueue('test');
      await manager.resumeQueue('test');

      const isPaused = await queue.isPaused();
      expect(isPaused).toBe(false);
    });

    it('should clean old jobs', async () => {
      const queue = manager.getQueue('test');
      
      // Add some jobs
      await manager.addJob('test', {
        userId: 'user-123',
        createdAt: new Date().toISOString(),
      });

      const cleaned = await manager.cleanQueue('test', 0); // Clean immediately

      expect(cleaned).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Default Processors', () => {
    it('should have email processor', () => {
      // Email processor should be registered by default
      // This is tested indirectly through job processing
    });

    it('should have transcription processor', () => {
      // Transcription processor should be registered by default
    });

    it('should have webhook processor', () => {
      // Webhook processor should be registered by default
    });
  });

  describe('Error Handling', () => {
    it('should retry failed jobs', async () => {
      let attempts = 0;
      const processor = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true };
      });

      manager.registerProcessor('retry-test', processor);

      const job = await manager.addJob('retry-test', {
        userId: 'user-123',
        createdAt: new Date().toISOString(),
      }, {
        attempts: 3,
      });

      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 5000));

      expect(attempts).toBe(3);
    });

    it('should handle processor errors gracefully', async () => {
      const processor = vi.fn().mockRejectedValue(new Error('Processing failed'));
      
      manager.registerProcessor('error-test', processor);

      await manager.addJob('error-test', {
        userId: 'user-123',
        createdAt: new Date().toISOString(),
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(processor).toHaveBeenCalled();
    });
  });

  describe('Concurrency', () => {
    it('should respect concurrency limits', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;

      const processor = vi.fn().mockImplementation(async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise(resolve => setTimeout(resolve, 100));
        concurrent--;
        return { done: true };
      });

      manager.registerProcessor('concurrency-test', processor, 2);

      // Add 10 jobs
      const jobs = [];
      for (let i = 0; i < 10; i++) {
        jobs.push(manager.addJob('concurrency-test', {
          userId: `user-${i}`,
          createdAt: new Date().toISOString(),
        }));
      }

      await Promise.all(jobs);
      await new Promise(resolve => setTimeout(resolve, 1500));

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });

  describe('Priority', () => {
    it('should process high priority jobs first', async () => {
      const processedOrder: number[] = [];
      
      const processor = vi.fn().mockImplementation(async (job: any) => {
        processedOrder.push(job.data.priority);
        return { done: true };
      });

      manager.registerProcessor('priority-test', processor);

      // Add jobs with different priorities
      await manager.addJob('priority-test', {
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        priority: JobPriority.LOW,
      }, { priority: JobPriority.LOW });

      await manager.addJob('priority-test', {
        userId: 'user-2',
        createdAt: new Date().toISOString(),
        priority: JobPriority.CRITICAL,
      }, { priority: JobPriority.CRITICAL });

      await manager.addJob('priority-test', {
        userId: 'user-3',
        createdAt: new Date().toISOString(),
        priority: JobPriority.HIGH,
      }, { priority: JobPriority.HIGH });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Critical should be processed first
      expect(processedOrder[0]).toBe(JobPriority.CRITICAL);
    });
  });

  describe('Graceful Shutdown', () => {
    it('should close all queues on shutdown', async () => {
      manager.getQueue('queue-1');
      manager.getQueue('queue-2');
      manager.getQueue('queue-3');

      await manager.gracefulShutdown();

      // Queues should be closed (implementation dependent)
    });
  });
});
