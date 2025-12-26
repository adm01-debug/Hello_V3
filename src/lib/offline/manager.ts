export class OfflineManager {
  private queue: Array<{action: string; data: any}> = [];

  async sync() {
    if (!navigator.onLine) return;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      await this.processAction(item!);
    }
  }

  queueAction(action: string, data: any) {
    this.queue.push({ action, data });
    localStorage.setItem('offline-queue', JSON.stringify(this.queue));
  }

  private async processAction(item: any) {
    await fetch(`/api/${item.action}`, {
      method: 'POST',
      body: JSON.stringify(item.data)
    });
  }
}
