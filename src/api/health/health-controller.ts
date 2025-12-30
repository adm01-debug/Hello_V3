import { Request, Response } from 'express';

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version?: string;
  checks: {
    [key: string]: CheckResult;
  };
}

/**
 * Individual check result
 */
export interface CheckResult {
  status: 'up' | 'down';
  responseTime?: number;
  message?: string;
  lastChecked?: string;
}

/**
 * Health check function type
 */
type HealthCheckFunction = () => Promise<CheckResult>;

/**
 * HealthController - Production-ready health check endpoints
 * 
 * Features:
 * - Configurable health checks
 * - Timeout protection
 * - Graceful degradation
 * - Response caching
 * - Proper error handling
 * - Kubernetes probes support
 * 
 * @class HealthController
 */
export class HealthController {
  private readonly checks: Map<string, HealthCheckFunction>;
  private readonly checkTimeout: number;
  private readonly cacheTimeout: number;
  private cachedResult: HealthCheckResult | null = null;
  private lastCheckTime: number = 0;

  constructor(
    checks: Map<string, HealthCheckFunction> = new Map(),
    options: {
      checkTimeout?: number;
      cacheTimeout?: number;
    } = {}
  ) {
    this.checks = checks;
    this.checkTimeout = options.checkTimeout || 5000; // 5s default
    this.cacheTimeout = options.cacheTimeout || 10000; // 10s default
    
    // Register default checks if none provided
    if (this.checks.size === 0) {
      this.registerDefaultChecks();
    }
  }

  /**
   * Register default health checks
   * @private
   */
  private registerDefaultChecks(): void {
    this.checks.set('process', this.checkProcess.bind(this));
    this.checks.set('memory', this.checkMemory.bind(this));
  }

  /**
   * Main health check endpoint
   * @public
   */
  public async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const result = await this.getHealthStatus(forceRefresh);
      
      const statusCode = result.status === 'healthy' ? 200 : 
                        result.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(result);
    } catch (error) {
      this.handleHealthCheckError(error, res);
    }
  }

  /**
   * Kubernetes readiness probe
   * @public
   */
  public async readiness(req: Request, res: Response): Promise<void> {
    try {
      const ready = await this.isReady();
      
      if (ready) {
        res.status(200).json({
          ready: true,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          ready: false,
          timestamp: new Date().toISOString(),
          message: 'Service not ready',
        });
      }
    } catch (error) {
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Kubernetes liveness probe
   * @public
   */
  public async liveness(req: Request, res: Response): Promise<void> {
    // Liveness should be simple - just check if process is responsive
    res.status(200).json({
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  /**
   * Get health status with caching
   * @private
   */
  private async getHealthStatus(forceRefresh: boolean = false): Promise<HealthCheckResult> {
    const now = Date.now();
    
    // Return cached result if valid
    if (
      !forceRefresh &&
      this.cachedResult &&
      (now - this.lastCheckTime) < this.cacheTimeout
    ) {
      return this.cachedResult;
    }

    // Perform health checks
    const result = await this.performHealthChecks();
    
    // Update cache
    this.cachedResult = result;
    this.lastCheckTime = now;
    
    return result;
  }

  /**
   * Perform all health checks
   * @private
   */
  private async performHealthChecks(): Promise<HealthCheckResult> {
    const checkResults: { [key: string]: CheckResult } = {};
    const checkPromises: Promise<void>[] = [];

    // Run all checks in parallel with timeout
    for (const [name, checkFn] of this.checks.entries()) {
      const promise = this.runCheckWithTimeout(name, checkFn)
        .then(result => {
          checkResults[name] = result;
        })
        .catch(error => {
          checkResults[name] = {
            status: 'down',
            message: error instanceof Error ? error.message : 'Check failed',
            lastChecked: new Date().toISOString(),
          };
        });
      
      checkPromises.push(promise);
    }

    await Promise.allSettled(checkPromises);

    // Determine overall status
    const status = this.determineOverallStatus(checkResults);

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version,
      checks: checkResults,
    };
  }

  /**
   * Run health check with timeout
   * @private
   */
  private async runCheckWithTimeout(
    name: string,
    checkFn: HealthCheckFunction
  ): Promise<CheckResult> {
    const startTime = Date.now();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), this.checkTimeout);
    });

    try {
      const result = await Promise.race([checkFn(), timeoutPromise]);
      const responseTime = Date.now() - startTime;
      
      return {
        ...result,
        responseTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`${name} check failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Determine overall health status from individual checks
   * @private
   */
  private determineOverallStatus(
    checks: { [key: string]: CheckResult }
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const results = Object.values(checks);
    
    if (results.length === 0) return 'unhealthy';
    
    const allUp = results.every(c => c.status === 'up');
    const allDown = results.every(c => c.status === 'down');
    
    if (allUp) return 'healthy';
    if (allDown) return 'unhealthy';
    return 'degraded';
  }

  /**
   * Check if service is ready
   * @private
   */
  private async isReady(): Promise<boolean> {
    try {
      const result = await this.performHealthChecks();
      return result.status !== 'unhealthy';
    } catch {
      return false;
    }
  }

  /**
   * Default process health check
   * @private
   */
  private async checkProcess(): Promise<CheckResult> {
    return {
      status: 'up',
      message: 'Process running normally',
    };
  }

  /**
   * Default memory health check
   * @private
   */
  private async checkMemory(): Promise<CheckResult> {
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
    
    if (heapUsedPercent > 90) {
      return {
        status: 'down',
        message: `High memory usage: ${heapUsedPercent.toFixed(2)}%`,
      };
    }
    
    return {
      status: 'up',
      message: `Memory usage: ${heapUsedPercent.toFixed(2)}%`,
    };
  }

  /**
   * Handle health check errors
   * @private
   */
  private handleHealthCheckError(error: unknown, res: Response): void {
    console.error('Health check error:', error);
    
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }

  /**
   * Register a custom health check
   * @public
   */
  public registerCheck(name: string, checkFn: HealthCheckFunction): void {
    this.checks.set(name, checkFn);
    this.invalidateCache();
  }

  /**
   * Invalidate cached health status
   * @public
   */
  public invalidateCache(): void {
    this.cachedResult = null;
    this.lastCheckTime = 0;
  }
}
