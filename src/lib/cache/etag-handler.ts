import crypto from 'crypto'

export class ETagHandler {
  static generate(data: any): string {
    const content = JSON.stringify(data)
    return crypto.createHash('md5').update(content).digest('hex')
  }

  static matches(etag: string, requestEtag?: string): boolean {
    return etag === requestEtag
  }
}
