import sharp from 'sharp';
import { S3 } from 'aws-sdk';
import path from 'path';

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'hello-images';

export interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export class ImageOptimizer {
  static async optimize(
    imageBuffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<Buffer> {
    const {
      quality = 80,
      format = 'webp',
      width,
      height,
      fit = 'cover',
    } = options;

    let pipeline = sharp(imageBuffer);

    // Resize if dimensions provided
    if (width || height) {
      pipeline = pipeline.resize(width, height, { fit });
    }

    // Convert format and optimize
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive: true });
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9 });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality });
        break;
    }

    return pipeline.toBuffer();
  }

  static async generateResponsiveImages(
    imageBuffer: Buffer,
    sizes: number[] = [320, 640, 1024, 1920]
  ): Promise<Map<number, Buffer>> {
    const results = new Map<number, Buffer>();

    for (const size of sizes) {
      const optimized = await this.optimize(imageBuffer, {
        width: size,
        format: 'webp',
      });
      results.set(size, optimized);
    }

    return results;
  }

  static async uploadToS3(
    buffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<string> {
    const key = `images/${Date.now()}-${filename}`;

    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
      })
      .promise();

    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
  }

  static async processAndUpload(
    file: Express.Multer.File
  ): Promise<{ original: string; responsive: Record<number, string> }> {
    const fileBuffer = file.buffer;

    // Upload original (optimized)
    const optimized = await this.optimize(fileBuffer, {
      quality: 85,
      format: 'webp',
    });
    const originalUrl = await this.uploadToS3(
      optimized,
      `original-${file.originalname}`,
      'image/webp'
    );

    // Generate and upload responsive images
    const responsive: Record<number, string> = {};
    const responsiveImages = await this.generateResponsiveImages(fileBuffer);

    for (const [size, buffer] of responsiveImages) {
      const url = await this.uploadToS3(
        buffer,
        `${size}w-${file.originalname}`,
        'image/webp'
      );
      responsive[size] = url;
    }

    return { original: originalUrl, responsive };
  }

  static generateSrcSet(responsive: Record<number, string>): string {
    return Object.entries(responsive)
      .map(([size, url]) => `${url} ${size}w`)
      .join(', ');
  }
}

// Middleware for automatic image optimization
export function imageOptimizationMiddleware(
  req: any,
  res: any,
  next: any
) {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }

  ImageOptimizer.processAndUpload(req.file)
    .then((result) => {
      req.optimizedImages = result;
      next();
    })
    .catch(next);
}
