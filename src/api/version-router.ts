import { Router, Request, Response, NextFunction } from 'express';
import v1Router from './v1/routes';
import v2Router from './v2/routes';

export class VersionRouter {
  private router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.use((req: Request, res: Response, next: NextFunction) => {
      const version = this.detectVersion(req);
      req.apiVersion = version;
      res.setHeader('API-Version', version);
      next();
    });

    this.router.use('/v1', v1Router);
    this.router.use('/v2', v2Router);

    this.router.use('/', (req, res, next) => {
      if (!req.path.startsWith('/v1') && !req.path.startsWith('/v2')) {
        req.url = `/v1${req.url}`;
      }
      next();
    });
  }

  private detectVersion(req: Request): string {
    if (req.path.startsWith('/v2')) return 'v2';
    if (req.path.startsWith('/v1')) return 'v1';
    const headerVersion = req.headers['api-version'] as string;
    if (headerVersion) return headerVersion;
    return 'v1';
  }

  public getRouter(): Router {
    return this.router;
  }
}

export const versionRouter = new VersionRouter();
