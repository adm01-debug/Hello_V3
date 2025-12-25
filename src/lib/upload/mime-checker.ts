/**
 * MIME Type Checker
 * Validates actual file content against declared MIME type
 * Prevents MIME type spoofing attacks
 */

export interface MIMECheckResult {
  valid: boolean
  declaredType: string
  actualType: string | null
  match: boolean
}

/**
 * MIME Type Checker Class
 */
export class MIMEChecker {
  /**
   * File signatures (magic bytes) for common file types
   */
  private static readonly FILE_SIGNATURES: Record<
    string,
    { signature: number[]; offset: number }[]
  > = {
    // Images
    'image/jpeg': [{ signature: [0xff, 0xd8, 0xff], offset: 0 }],
    'image/png': [{ signature: [0x89, 0x50, 0x4e, 0x47], offset: 0 }],
    'image/gif': [
      { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], offset: 0 }, // GIF87a
      { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], offset: 0 }, // GIF89a
    ],
    'image/webp': [{ signature: [0x52, 0x49, 0x46, 0x46], offset: 0 }],
    'image/bmp': [{ signature: [0x42, 0x4d], offset: 0 }],

    // Documents
    'application/pdf': [{ signature: [0x25, 0x50, 0x44, 0x46], offset: 0 }], // %PDF

    // Archives
    'application/zip': [
      { signature: [0x50, 0x4b, 0x03, 0x04], offset: 0 },
      { signature: [0x50, 0x4b, 0x05, 0x06], offset: 0 },
    ],
    'application/x-rar': [{ signature: [0x52, 0x61, 0x72, 0x21], offset: 0 }],

    // Office documents
    'application/vnd.openxmlformats-officedocument': [
      { signature: [0x50, 0x4b, 0x03, 0x04], offset: 0 },
    ],
  }

  /**
   * Check if file content matches declared MIME type
   */
  static async checkMIME(file: File): Promise<MIMECheckResult> {
    const declaredType = file.type
    const actualType = await this.detectMIMEType(file)

    return {
      valid: actualType !== null && actualType === declaredType,
      declaredType,
      actualType,
      match: actualType === declaredType,
    }
  }

  /**
   * Detect actual MIME type from file content
   */
  static async detectMIMEType(file: File): Promise<string | null> {
    try {
      // Read first 512 bytes
      const buffer = await this.readFileBytes(file, 0, 512)

      // Check against known signatures
      for (const [mimeType, signatures] of Object.entries(
        this.FILE_SIGNATURES
      )) {
        for (const { signature, offset } of signatures) {
          if (this.matchesSignature(buffer, signature, offset)) {
            return mimeType
          }
        }
      }

      // If no signature matches, try to detect from extension
      return this.getMIMEFromExtension(file.name)
    } catch (error) {
      console.error('Error detecting MIME type:', error)
      return null
    }
  }

  /**
   * Read bytes from file
   */
  private static readFileBytes(
    file: File,
    start: number,
    length: number
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer
        resolve(new Uint8Array(arrayBuffer))
      }

      reader.onerror = () => {
        reject(reader.error)
      }

      const blob = file.slice(start, start + length)
      reader.readAsArrayBuffer(blob)
    })
  }

  /**
   * Check if bytes match signature
   */
  private static matchesSignature(
    bytes: Uint8Array,
    signature: number[],
    offset: number
  ): boolean {
    for (let i = 0; i < signature.length; i++) {
      if (bytes[offset + i] !== signature[i]) {
        return false
      }
    }
    return true
  }

  /**
   * Get MIME type from file extension
   */
  private static getMIMEFromExtension(filename: string): string | null {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase()

    const extensionMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar',
    }

    return extensionMap[ext] || null
  }

  /**
   * Validate that file content matches expected type
   */
  static async validateFileContent(
    file: File,
    expectedType: string
  ): Promise<boolean> {
    const result = await this.checkMIME(file)
    return result.actualType === expectedType
  }

  /**
   * Detect if file is potentially malicious
   */
  static async isFileSuspicious(file: File): Promise<boolean> {
    const result = await this.checkMIME(file)

    // File is suspicious if:
    // 1. MIME type doesn't match content
    // 2. Cannot detect actual type
    // 3. Declared type is executable but content doesn't match

    if (!result.match) {
      return true
    }

    if (result.actualType === null && file.size > 0) {
      return true
    }

    const dangerousMIMEs = [
      'application/x-executable',
      'application/x-sh',
      'application/x-bat',
      'text/x-script',
    ]

    if (dangerousMIMEs.includes(result.declaredType)) {
      return true
    }

    return false
  }
}
