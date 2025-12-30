import { Router, Request, Response, NextFunction } from 'express';
import { HealthController } from './health-controller';

const router = Router();

/**
 * Initialize health controller
 * TODO: Inject dependencies via DI container
 */
const controller = new HealthController();

/**
 * Cache middleware for health checks
 * Prevents excessive health check calls
 */
const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Bypass cache if ?refresh=true
  if (req.query.refresh === 'true') {
    return next();
  }

  // Set cache headers
  res.setHeader('Cache-Control', 'public, max-age=10');
  res.setHeader('X-Cache-Hit', 'true');
  
  next();
};

/**
 * Error handler middleware
 */
const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Health check error:', err);
  
  res.status(500).json({
    status: 'error',
    message: 'Health check failed',
    timestamp: new Date().toISOString(),
  });
};

/**
 * GET /health - Main health check endpoint
 * 
 * Returns overall system health status
 * Used by monitoring systems
 */
router.get(
  '/health',
  cacheMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller.healthCheck(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /health/readiness - Kubernetes readiness probe
 * 
 * Indicates if the service is ready to accept traffic
 * Returns 200 if ready, 503 if not ready
 */
router.get(
  '/health/readiness',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller.readiness(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /health/liveness - Kubernetes liveness probe
 * 
 * Indicates if the service is alive and responsive
 * Returns 200 if alive, 503 if dead (should be restarted)
 */
router.get(
  '/health/liveness',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller.liveness(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /health/startup - Kubernetes startup probe
 * 
 * Indicates if the service has started successfully
 * Prevents liveness/readiness checks during long startup
 */
router.get(
  '/health/startup',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Simple startup check - just return 200 if we can respond
      res.status(200).json({
        startup: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /health/metrics - Prometheus-style metrics
 * 
 * Returns basic metrics in plain text format
 */
router.get(
  '/health/metrics',
  (req: Request, res: Response) => {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    res.setHeader('Content-Type', 'text/plain');
    res.send(`
# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${uptime}

# HELP process_memory_heap_used_bytes Heap memory used
# TYPE process_memory_heap_used_bytes gauge
process_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP process_memory_heap_total_bytes Total heap memory
# TYPE process_memory_heap_total_bytes gauge
process_memory_heap_total_bytes ${memUsage.heapTotal}

# HELP process_memory_rss_bytes Resident set size
# TYPE process_memory_rss_bytes gauge
process_memory_rss_bytes ${memUsage.rss}
    `.trim());
  }
);

// Apply error handler
router.use(errorHandler);

export default router;
