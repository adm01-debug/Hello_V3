import { compress, decompress } from 'compress-json';

export type CompressionType = 'gzip' | 'brotli' | 'deflate';

export interface CompressionConfig {
  type: CompressionType;
  level: number;
  threshold: number;
}

export const DEFAULT_COMPRESSION: CompressionConfig = {
  type: 'gzip',
  level: 6,
  threshold: 1024,
};

export class CompressionMiddleware {
  constructor(private config: CompressionConfig = DEFAULT_COMPRESSION) {}

  shouldCompress(body: any, headers: Headers): boolean {
    const contentType = headers.get('content-type') || '';
    const contentLength = parseInt(headers.get('content-length') || '0');

    if (contentLength < this.config.threshold) return false;

    const compressibleTypes = [
      'text/',
      'application/json',
      'application/javascript',
      'application/xml',
    ];

    return compressibleTypes.some(type => contentType.includes(type));
  }

  async compress(data: string | ArrayBuffer): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const input = typeof data === 'string' ? encoder.encode(data) : new Uint8Array(data);

    const stream = new CompressionStream(this.config.type);
    const writer = stream.writable.getWriter();
    writer.write(input);
    writer.close();

    const reader = stream.readable.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result.buffer;
  }

  async decompress(data: ArrayBuffer): Promise<string> {
    const stream = new DecompressionStream(this.config.type);
    const writer = stream.writable.getWriter();
    writer.write(new Uint8Array(data));
    writer.close();

    const reader = stream.readable.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(chunks.flatMap(c => Array.from(c))));
  }

  middleware() {
    return async (req: Request, res: Response, next: Function) => {
      const originalSend = res.send;
      
      res.send = async function(body: any) {
        if (this.shouldCompress(body, res.headers)) {
          const compressed = await this.compress(body);
          res.setHeader('Content-Encoding', this.config.type);
          res.setHeader('Content-Length', compressed.byteLength.toString());
          return originalSend.call(res, compressed);
        }
        
        return originalSend.call(res, body);
      }.bind(this);

      next();
    };
  }
}

export const compressionMiddleware = new CompressionMiddleware();
