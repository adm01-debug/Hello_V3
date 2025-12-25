export interface WorkerTask<T = any, R = any> {
  id: string;
  type: string;
  data: T;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
}

export class WebWorkerPool {
  private workers: Worker[] = [];
  private queue: WorkerTask[] = [];
  private activeWorkers: Set<number> = new Set();

  constructor(private workerScript: string, private poolSize: number = 4) {
    this.initializeWorkers();
  }

  private initializeWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerScript);
      worker.onmessage = (e) => this.handleWorkerMessage(i, e);
      worker.onerror = (e) => this.handleWorkerError(i, e);
      this.workers.push(worker);
    }
  }

  private handleWorkerMessage(workerId: number, event: MessageEvent) {
    const { id, result, error } = event.data;
    const task = this.queue.find(t => t.id === id);
    
    if (task) {
      if (error) {
        task.reject(new Error(error));
      } else {
        task.resolve(result);
      }
      this.queue = this.queue.filter(t => t.id !== id);
    }

    this.activeWorkers.delete(workerId);
    this.processQueue();
  }

  private handleWorkerError(workerId: number, error: ErrorEvent) {
    console.error(`Worker ${workerId} error:`, error);
    this.activeWorkers.delete(workerId);
    this.processQueue();
  }

  private processQueue() {
    if (this.queue.length === 0) return;

    for (let i = 0; i < this.workers.length; i++) {
      if (!this.activeWorkers.has(i) && this.queue.length > 0) {
        const task = this.queue.shift();
        if (task) {
          this.activeWorkers.add(i);
          this.workers[i].postMessage({
            id: task.id,
            type: task.type,
            data: task.data,
          });
        }
      }
    }
  }

  execute<T, R>(type: string, data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask<T, R> = {
        id: `task_${Date.now()}_${Math.random()}`,
        type,
        data,
        resolve,
        reject,
      };
      
      this.queue.push(task);
      this.processQueue();
    });
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.activeWorkers.clear();
    this.queue = [];
  }
}

export const workerPool = new WebWorkerPool('/worker.js', navigator.hardwareConcurrency || 4);
