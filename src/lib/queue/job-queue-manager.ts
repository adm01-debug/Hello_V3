/**
 * JOB QUEUE SYSTEM
 * 
 * PROCESSO MAPEADO (BPM):
 * ========================
 * 
 * OBJETIVO: Processar tarefas assíncronas de forma confiável e escalável
 * 
 * FLUXO PRINCIPAL:
 * ┌─────────────────────────────────────────────────┐
 * │ Início: Aplicação envia job para fila          │
 * └───────────────────┬─────────────────────────────┘
 *                     ▼
 * ┌─────────────────────────────────────────────────┐
 * │ Etapa 1: Job entra na fila (Redis)            │
 * │ - Validar dados do job                         │
 * │ - Atribuir prioridade                          │
 * │ - Registrar timestamp                          │
 * └───────────────────┬─────────────────────────────┘
 *                     ▼
 * ┌─────────────────────────────────────────────────┐
 * │ Decisão: Há workers disponíveis?              │
 * └─────┬─────────────────────────────┬─────────────┘
 *       │ Sim                          │ Não
 *       ▼                              ▼
 * ┌──────────────┐           ┌─────────────────────┐
 * │ Processamento│           │ Aguardar na fila    │
 * │ imediato     │           │ (até 24h)           │
 * └──────┬───────┘           └─────────┬───────────┘
 *        │                             │
 *        └──────────┬──────────────────┘
 *                   ▼
 * ┌─────────────────────────────────────────────────┐
 * │ Etapa 2: Worker processa job                   │
 * │ - Executar lógica de negócio                   │
 * │ - Atualizar progresso                          │
 * │ - Registrar logs                               │
 * └───────────────────┬─────────────────────────────┘
 *                     ▼
 * ┌─────────────────────────────────────────────────┐
 * │ Decisão: Processamento bem-sucedido?          │
 * └─────┬─────────────────────────────┬─────────────┘
 *       │ Sim                          │ Não
 *       ▼                              ▼
 * ┌──────────────┐           ┌─────────────────────┐
 * │ Marcar como  │           │ Decisão: Retry?     │
 * │ completado   │           └─────┬───────────┬───┘
 * └──────┬───────┘                 │ Sim       │ Não
 *        │                         ▼           ▼
 *        │                   ┌────────┐  ┌─────────┐
 *        │                   │ Retentar│ │ Falhou  │
 *        │                   │ (max 3x)│ │ definitiv│
 *        │                   └────┬───┘  └────┬────┘
 *        │                        │           │
 *        └────────────────────────┴───────────┘
 *                               ▼
 * ┌─────────────────────────────────────────────────┐
 * │ Etapa 3: Notificar resultado                   │
 * │ - Webhook (se configurado)                     │
 * │ - Email (se configurado)                       │
 * │ - Log de auditoria                             │
 * └───────────────────┬─────────────────────────────┘
 *                     ▼
 * ┌─────────────────────────────────────────────────┐
 * │ Fim: Job processado e notificado               │
 * └─────────────────────────────────────────────────┘
 * 
 * REGRAS DE NEGÓCIO:
 * 1. Timeout máximo: 5 minutos por job
 * 2. Máximo de tentativas: 3
 * 3. Backoff exponencial: 2^tentativa minutos
 * 4. Prioridade: critical > high > normal > low
 * 5. Retenção de logs: 30 dias
 * 
 * PONTOS DE ATENÇÃO (RISCOS):
 * ⚠️ Job pode ficar travado se worker morrer
 * ⚠️ Fila pode acumular se processamento for lento
 * ⚠️ Dados sensíveis precisam ser criptografados
 * ⚠️ Retry infinito pode consumir recursos
 * 
 * OPORTUNIDADES DE AUTOMAÇÃO:
 * 🤖 Auto-scaling de workers baseado no tamanho da fila
 * 🤖 Alertas automáticos quando fila > 1000 jobs
 * 🤖 Limpeza automática de jobs antigos
 * 🤖 Dashboard com métricas em tempo real
 * 
 * KPIs/SLAs:
 * - Tempo médio de processamento: < 30s
 * - Taxa de sucesso: > 95%
 * - Jobs processados/hora: > 1000
 * - Uptime do sistema: > 99.9%
 */

import Bull, { Queue, Job, JobOptions } from 'bull';
import { redis } from '../cache/redis-client';
import { auditLogger } from '../security/audit-logger';

// ============================================
// CAMADA 1-3: TIPOS E CONFIGURAÇÃO ✅
// ============================================

export enum JobPriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
}

export interface BaseJobData {
  userId: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface EmailJobData extends BaseJobData {
  to: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export interface TranscriptionJobData extends BaseJobData {
  callId: string;
  audioUrl: string;
  language: string;
}

export interface WebhookJobData extends BaseJobData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

type JobData = EmailJobData | TranscriptionJobData | WebhookJobData;

// ============================================
// CAMADA 4-5: PERFORMANCE + INTEGRAÇÕES ✅
// ============================================

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_JOB_DB || '1'),
  maxRetriesPerRequest: null, // Bull handles retries
};

const DEFAULT_JOB_OPTIONS: JobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 60000, // 1 min
  },
  timeout: 300000, // 5 min
  removeOnComplete: {
    age: 86400, // 24 hours
    count: 1000,
  },
  removeOnFail: {
    age: 2592000, // 30 days
    count: 5000,
  },
};

// ============================================
// CAMADA 6: SEGURANÇA ✅
// ============================================

class JobEncryption {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const secret = process.env.JOB_ENCRYPTION_KEY;
    if (!secret) {
      throw new Error('JOB_ENCRYPTION_KEY environment variable is not set');
    }
    // Derive 32-byte key from secret
    this.key = Buffer.from(secret.padEnd(32, '0').substring(0, 32));
  }

  encrypt(data: any): string {
    const crypto = require('crypto');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    const text = JSON.stringify(data);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted.toString('hex'),
      tag: authTag.toString('hex'),
    });
  }

  decrypt(encrypted: string): any {
    const crypto = require('crypto');
    const { iv, data, tag } = JSON.parse(encrypted);
    
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(data, 'hex')),
      decipher.final(),
    ]);
    
    return JSON.parse(decrypted.toString('utf8'));
  }
}

const encryption = new JobEncryption();

// ============================================
// CAMADA 7-8: ARQUITETURA + TESTES ✅
// ============================================

export class JobQueueManager {
  private queues: Map<string, Queue> = new Map();
  private processors: Map<string, (job: Job) => Promise<any>> = new Map();

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  // Create or get queue
  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Bull(name, {
        redis: REDIS_CONFIG,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      });

      // Event handlers
      queue.on('error', (error) => {
        console.error(`Queue ${name} error:`, error);
      });

      queue.on('waiting', (jobId) => {
        console.log(`Job ${jobId} is waiting in queue ${name}`);
      });

      queue.on('active', (job) => {
        console.log(`Job ${job.id} is now active in queue ${name}`);
        this.updateJobMetrics(name, 'active', 1);
      });

      queue.on('completed', (job, result) => {
        console.log(`Job ${job.id} completed in queue ${name}`);
        this.updateJobMetrics(name, 'completed', 1);
        this.notifyJobCompletion(job, result, 'completed');
      });

      queue.on('failed', (job, error) => {
        console.error(`Job ${job.id} failed in queue ${name}:`, error);
        this.updateJobMetrics(name, 'failed', 1);
        this.notifyJobCompletion(job, error, 'failed');
      });

      queue.on('stalled', (job) => {
        console.warn(`Job ${job.id} stalled in queue ${name}`);
      });

      this.queues.set(name, queue);
    }

    return this.queues.get(name)!;
  }

  // Register processor
  registerProcessor(
    queueName: string,
    processor: (job: Job) => Promise<any>,
    concurrency: number = 1
  ): void {
    const queue = this.getQueue(queueName);
    this.processors.set(queueName, processor);

    queue.process(concurrency, async (job: Job) => {
      try {
        // Decrypt sensitive data
        const decryptedData = job.data.encrypted
          ? encryption.decrypt(job.data.encrypted)
          : job.data;

        // Audit log
        auditLogger.logAccess(
          decryptedData.userId,
          `queue:${queueName}`,
          job.id?.toString(),
          {
            action: 'process_job',
            attemptsMade: job.attemptsMade,
          }
        );

        // Execute processor
        const result = await processor({
          ...job,
          data: decryptedData,
        });

        return result;
      } catch (error) {
        console.error(`Processor error in ${queueName}:`, error);
        throw error;
      }
    });
  }

  // Add job to queue
  async addJob<T extends JobData>(
    queueName: string,
    data: T,
    options?: JobOptions
  ): Promise<Job> {
    const queue = this.getQueue(queueName);

    // Encrypt sensitive data
    const encryptedData = {
      encrypted: encryption.encrypt(data),
      userId: data.userId, // Keep for filtering
      createdAt: data.createdAt,
    };

    const job = await queue.add(encryptedData, {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    });

    // Update metrics
    this.updateJobMetrics(queueName, 'added', 1);

    return job;
  }

  // Get job status
  async getJobStatus(queueName: string, jobId: string): Promise<{
    status: JobStatus;
    progress: number;
    result?: any;
    error?: string;
  }> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      status: state as JobStatus,
      progress: typeof progress === 'number' ? progress : 0,
      result: await job.finished().catch(() => undefined),
      error: job.failedReason,
    };
  }

  // Get queue stats
  async getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }> {
    const queue = this.getQueue(queueName);

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: await queue.isPaused(),
    };
  }

  // Clean old jobs
  async cleanQueue(
    queueName: string,
    grace: number = 86400000 // 24h in ms
  ): Promise<number> {
    const queue = this.getQueue(queueName);
    
    const [completed, failed] = await Promise.all([
      queue.clean(grace, 'completed'),
      queue.clean(grace * 30, 'failed'), // Keep failed jobs for 30 days
    ]);

    return completed.length + failed.length;
  }

  // Pause/resume queue
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
  }

  // Private helper methods
  private async updateJobMetrics(
    queueName: string,
    metric: string,
    value: number
  ): Promise<void> {
    const key = `metrics:queue:${queueName}:${metric}`;
    await redis.incr(key);
  }

  private async notifyJobCompletion(
    job: Job,
    resultOrError: any,
    status: 'completed' | 'failed'
  ): void {
    // Implement webhook notifications if configured
    const webhookUrl = job.data.webhookUrl;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            queueName: job.queue.name,
            status,
            result: status === 'completed' ? resultOrError : undefined,
            error: status === 'failed' ? resultOrError.message : undefined,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error('Failed to send webhook notification:', error);
      }
    }
  }

  // Graceful shutdown
  async gracefulShutdown(): Promise<void> {
    console.log('Shutting down job queues...');

    for (const [name, queue] of this.queues) {
      console.log(`Closing queue: ${name}`);
      await queue.close();
    }

    console.log('All queues closed');
    process.exit(0);
  }
}

// Singleton instance
export const jobQueueManager = new JobQueueManager();

// Example processors
export const registerDefaultProcessors = () => {
  // Email processor
  jobQueueManager.registerProcessor(
    'email',
    async (job: Job<EmailJobData>) => {
      const { to, subject, body } = job.data;
      console.log(`Sending email to ${to}: ${subject}`);
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { sent: true, to, subject };
    },
    5 // 5 concurrent email jobs
  );

  // Transcription processor
  jobQueueManager.registerProcessor(
    'transcription',
    async (job: Job<TranscriptionJobData>) => {
      const { callId, audioUrl, language } = job.data;
      console.log(`Transcribing call ${callId} from ${audioUrl}`);
      
      // Simulate transcription (would call OpenAI Whisper API)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      return {
        callId,
        transcription: 'Mock transcription text',
        confidence: 0.95,
        language,
      };
    },
    2 // 2 concurrent transcription jobs
  );

  // Webhook processor
  jobQueueManager.registerProcessor(
    'webhook',
    async (job: Job<WebhookJobData>) => {
      const { url, method, headers, body } = job.data;
      console.log(`Calling webhook ${method} ${url}`);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      return {
        status: response.status,
        statusText: response.statusText,
        data: await response.json().catch(() => null),
      };
    },
    10 // 10 concurrent webhook jobs
  );
};

export default jobQueueManager;
