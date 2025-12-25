/**
 * File Upload Validator
 * Validates file uploads for security and compliance
 */

export interface FileValidationConfig {
  allowedTypes?: string[]
  allowedExtensions?: string[]
  maxSize?: number // in bytes
  minSize?: number // in bytes
  checkMimeType?: boolean
  checkExtension?: boolean
  scanVirus?: boolean
}

export interface FileValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  file: {
    name: string
    size: number
    type: string
    extension: string
  }
}

const DEFAULT_CONFIG: FileValidationConfig = {
  allowedTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
  ],
  allowedExtensions: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.pdf',
    '.txt',
    '.csv',
  ],
  maxSize: 10 * 1024 * 1024, // 10MB
  minSize: 1, // 1 byte
  checkMimeType: true,
  checkExtension: true,
  scanVirus: false, // Enable when antivirus is set up
}

/**
 * File Validator Class
 */
export class FileValidator {
  /**
   * Validate file upload
   */
  static validate(
    file: File,
    config: Partial<FileValidationConfig> = {}
  ): FileValidationResult {
    const opts = { ...DEFAULT_CONFIG, ...config }
    const errors: string[] = []
    const warnings: string[] = []

    // Get file info
    const name = file.name
    const size = file.size
    const type = file.type
    const extension = this.getExtension(name)

    // Check if file exists
    if (!file) {
      errors.push('Nenhum arquivo foi selecionado')
      return { valid: false, errors, warnings, file: { name: '', size: 0, type: '', extension: '' } }
    }

    // Check file name
    if (!name || name.trim().length === 0) {
      errors.push('Nome do arquivo inválido')
    }

    // Check for dangerous characters in filename
    if (this.hasDangerousChars(name)) {
      errors.push('Nome do arquivo contém caracteres inválidos')
    }

    // Check extension
    if (opts.checkExtension && opts.allowedExtensions) {
      if (!opts.allowedExtensions.includes(extension.toLowerCase())) {
        errors.push(
          `Tipo de arquivo não permitido. Extensões permitidas: ${opts.allowedExtensions.join(', ')}`
        )
      }
    }

    // Check MIME type
    if (opts.checkMimeType && opts.allowedTypes) {
      if (!opts.allowedTypes.includes(type)) {
        errors.push(
          `Tipo MIME não permitido. Tipos permitidos: ${opts.allowedTypes.join(', ')}`
        )
      }
    }

    // Check mime/extension mismatch
    if (opts.checkMimeType && opts.checkExtension) {
      if (!this.mimeMatchesExtension(type, extension)) {
        warnings.push('Tipo de arquivo não corresponde à extensão')
      }
    }

    // Check file size
    if (size > opts.maxSize!) {
      errors.push(
        `Arquivo muito grande. Tamanho máximo: ${this.formatFileSize(opts.maxSize!)}`
      )
    }

    if (size < opts.minSize!) {
      errors.push('Arquivo está vazio ou corrompido')
    }

    // Check for potential zip bombs (compressed files that are suspiciously small)
    if (this.isCompressed(extension) && size < 100) {
      warnings.push('Arquivo comprimido suspeito')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      file: { name, size, type, extension },
    }
  }

  /**
   * Get file extension
   */
  private static getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    return lastDot === -1 ? '' : filename.substring(lastDot).toLowerCase()
  }

  /**
   * Check for dangerous characters in filename
   */
  private static hasDangerousChars(filename: string): boolean {
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/
    return dangerousChars.test(filename)
  }

  /**
   * Check if MIME type matches extension
   */
  private static mimeMatchesExtension(mime: string, ext: string): boolean {
    const mimeMap: Record<string, string[]> = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    }

    const expectedExtensions = mimeMap[mime]
    return expectedExtensions ? expectedExtensions.includes(ext) : true
  }

  /**
   * Check if file is compressed
   */
  private static isCompressed(ext: string): boolean {
    const compressedExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2']
    return compressedExts.includes(ext)
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Validate multiple files
   */
  static validateMultiple(
    files: FileList | File[],
    config: Partial<FileValidationConfig> = {}
  ): FileValidationResult[] {
    const fileArray = Array.from(files)
    return fileArray.map((file) => this.validate(file, config))
  }

  /**
   * Check if all files are valid
   */
  static areAllValid(results: FileValidationResult[]): boolean {
    return results.every((result) => result.valid)
  }
}
