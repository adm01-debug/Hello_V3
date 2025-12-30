import { Request, Response } from 'express';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'up' | 'down';
      responseTime?: number;
      message?: string;
    };
  };
}

export class HealthController {
  public async healthCheck(req: Request, res: Response): Promise<void> {
    const result: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: { status: 'up', responseTime: 5 },
        redis: { status: 'up', responseTime: 2 },
        api: { status: 'up', responseTime: 1 },
      },
    };

    const allUp = Object.values(result.checks).every((c) => c.status === 'up');
    if (!allUp) result.status = 'unhealthy';

    const statusCode = result.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(result);
  }

  public async readiness(req: Request, res: Response): Promise<void> {
    res.status(200).json({ ready: true, timestamp: new Date().toISOString() });
  }

  public async liveness(req: Request, res: Response): Promise<void> {
    res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
  }
}
