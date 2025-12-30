import { Router, Request, Response, NextFunction } from 'express';
import v1Router from './v1/routes';
import v2Router from './v2/routes';

declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
    }
  }
}

/**
 * Supported API versions
 */
const SUPPORTED_VERSIONS = ['v1', 'v2'] as const;
type ApiVersion = typeof SUPPORTED_VERSIONS[number];

/**
 * VersionRouter - Manages API versioning with validation and logging
 * 
 * Features:
 * - Version detection via URL, header, or query parameter
 * - Input validation and sanitization
 * - Request logging
 * - Error handling
 * - Backward compatibility (defaults to v1)
 * 
 * @class VersionRouter
 */
export class VersionRouter {
  private router: Router;
  private readonly logger = console; // Replace with proper logger

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Setup routing and middleware
   * @private
   */
  private setupRoutes(): void {
    // Version detection middleware
    this.router.use(this.versionMiddleware.bind(this));

    // Version-specific routes
    this.router.use('/v1', v1Router);
    this.router.use('/v2', v2Router);

    // Default fallback to v1 for backward compatibility
    this.router.use('/', this.defaultVersionMiddleware.bind(this));

    // 404 handler for invalid routes
    this.router.use(this.notFoundHandler.bind(this));
  }

  /**
   * Version detection and validation middleware
   * @private
   */
  private versionMiddleware(req: Request, res: Response, next: NextFunction): void {
    try {
      const version = this.detectVersion(req);
      const validatedVersion = this.validateVersion(version);
      
      req.apiVersion = validatedVersion;
      res.setHeader('API-Version', validatedVersion);
      
      // Log version usage
      this.logVersionUsage(req, validatedVersion);
      
      next();
    } catch (error) {
      this.handleVersionError(error, res);
    }
  }

  /**
   * Default version middleware (v1 fallback)
   * @private
   */
  private defaultVersionMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (!req.path.startsWith('/v1') && !req.path.startsWith('/v2')) {
      req.url = `/v1${req.url}`;
    }
    next();
  }

  /**
   * Detect API version from request
   * Priority: URL path > Header > Query parameter > Default (v1)
   * @private
   */
  private detectVersion(req: Request): string {
    // 1. Check URL path (highest priority)
    if (req.path.startsWith('/v2')) return 'v2';
    if (req.path.startsWith('/v1')) return 'v1';

    // 2. Check header
    const headerVersion = this.sanitizeVersion(req.headers['api-version'] as string);
    if (headerVersion) return headerVersion;

    // 3. Check query parameter
    const queryVersion = this.sanitizeVersion(req.query.version as string);
    if (queryVersion) return queryVersion;

    // 4. Default to v1
    return 'v1';
  }

  /**
   * Validate API version
   * @private
   * @throws {Error} If version is invalid
   */
  private validateVersion(version: string): ApiVersion {
    const sanitized = this.sanitizeVersion(version);
    
    if (!SUPPORTED_VERSIONS.includes(sanitized as ApiVersion)) {
      throw new Error(
        `Invalid API version: ${version}. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`
      );
    }
    
    return sanitized as ApiVersion;
  }

  /**
   * Sanitize version string to prevent injection
   * @private
   */
  private sanitizeVersion(version: string | undefined): string {
    if (!version) return '';
    
    // Remove any non-alphanumeric characters except 'v' and numbers
    const sanitized = version.toString().toLowerCase().replace(/[^v0-9]/g, '');
    
    // Ensure format is 'vX'
    if (!/^v[0-9]$/.test(sanitized)) return '';
    
    return sanitized;
  }

  /**
   * Log version usage for analytics
   * @private
   */
  private logVersionUsage(req: Request, version: string): void {
    this.logger.log({
      timestamp: new Date().toISOString(),
      event: 'api_version_usage',
      version,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  /**
   * Handle version-related errors
   * @private
   */
  private handleVersionError(error: unknown, res: Response): void {
    const message = error instanceof Error ? error.message : 'Invalid API version';
    
    this.logger.error({
      timestamp: new Date().toISOString(),
      event: 'api_version_error',
      error: message,
    });

    res.status(400).json({
      error: 'Invalid API Version',
      message,
      supportedVersions: SUPPORTED_VERSIONS,
      hint: 'Use URL path (/v1, /v2), header (API-Version), or query param (?version=v1)',
    });
  }

  /**
   * 404 handler for routes not found in any version
   * @private
   */
  private notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found in API ${req.apiVersion}`,
      apiVersion: req.apiVersion || 'unknown',
    });
  }

  /**
   * Get configured router
   * @public
   */
  public getRouter(): Router {
    return this.router;
  }
}

export const versionRouter = new VersionRouter();
