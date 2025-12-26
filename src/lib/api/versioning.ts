export type APIVersion = 'v1' | 'v2';

export interface VersionedRequest {
  version: APIVersion;
  path: string;
  method: string;
}

// Version mapping
const VERSION_MAPPING: Record<string, APIVersion> = {
  '1': 'v1',
  '2': 'v2',
  'v1': 'v1',
  'v2': 'v2',
};

// Extract version from request
export function extractVersion(req: any): APIVersion {
  // Check URL path
  const pathMatch = req.path.match(/^\/api\/(v\d+)\//);
  if (pathMatch) {
    return VERSION_MAPPING[pathMatch[1]] || 'v1';
  }
  
  // Check Accept header
  const acceptHeader = req.headers['accept'];
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/application\/vnd\.hello\.(v\d+)\+json/);
    if (versionMatch) {
      return VERSION_MAPPING[versionMatch[1]] || 'v1';
    }
  }
  
  // Check custom header
  const versionHeader = req.headers['api-version'];
  if (versionHeader) {
    return VERSION_MAPPING[versionHeader] || 'v1';
  }
  
  // Default to v1
  return 'v1';
}

// Route versioning middleware
export function versioningMiddleware(req: any, res: any, next: any) {
  const version = extractVersion(req);
  req.apiVersion = version;
  
  // Set response headers
  res.setHeader('API-Version', version);
  res.setHeader('Vary', 'Accept, API-Version');
  
  next();
}

// Version deprecation warnings
const DEPRECATED_VERSIONS: Record<APIVersion, { deprecated: boolean; sunset?: string }> = {
  v1: {
    deprecated: true,
    sunset: '2026-06-01',
  },
  v2: {
    deprecated: false,
  },
};

export function deprecationWarningMiddleware(req: any, res: any, next: any) {
  const version = req.apiVersion || 'v1';
  const deprecation = DEPRECATED_VERSIONS[version];
  
  if (deprecation?.deprecated) {
    res.setHeader('Deprecation', 'true');
    if (deprecation.sunset) {
      res.setHeader('Sunset', deprecation.sunset);
    }
    res.setHeader('Link', '<https://docs.hello.app/api/migration>; rel="help"');
  }
  
  next();
}

// Version-specific handlers
export class VersionedAPIHandler {
  private handlers: Map<APIVersion, any> = new Map();
  
  register(version: APIVersion, handler: any) {
    this.handlers.set(version, handler);
  }
  
  handle(req: any, res: any) {
    const version = req.apiVersion || 'v1';
    const handler = this.handlers.get(version);
    
    if (!handler) {
      return res.status(400).json({
        error: 'Unsupported API version',
        version,
        supportedVersions: Array.from(this.handlers.keys()),
      });
    }
    
    return handler(req, res);
  }
}

// Example usage
export const callsHandler = new VersionedAPIHandler();

// V1 implementation
callsHandler.register('v1', async (req: any, res: any) => {
  // Legacy response format
  const calls = await getCalls(req.user.id);
  res.json({
    success: true,
    data: calls,
  });
});

// V2 implementation
callsHandler.register('v2', async (req: any, res: any) => {
  // New response format with pagination
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  const calls = await getCalls(req.user.id, { limit, offset });
  const total = await getCallsCount(req.user.id);
  
  res.json({
    data: calls,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
    links: {
      self: `/api/v2/calls?page=${page}&limit=${limit}`,
      next: page * limit < total ? `/api/v2/calls?page=${page + 1}&limit=${limit}` : null,
      prev: page > 1 ? `/api/v2/calls?page=${page - 1}&limit=${limit}` : null,
    },
  });
});

// Stub functions (implement with actual DB calls)
async function getCalls(userId: string, options?: any) {
  return [];
}

async function getCallsCount(userId: string) {
  return 0;
}
