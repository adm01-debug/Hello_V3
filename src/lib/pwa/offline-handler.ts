export class OfflineHandler {
  static async cache(urls: string[]) {
    const cache = await caches.open('v1')
    await cache.addAll(urls)
  }
}
