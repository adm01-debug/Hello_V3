import { getCORSConfig, isOriginAllowed } from '../../../src/lib/security/cors-config.ts';

export const applyEdgeCORS = (req: Request, res: Response): Response => {
  const config = getCORSConfig();
  const origin = req.headers.get('origin') || '';
  const headers = new Headers(res.headers);
  
  if (origin && isOriginAllowed(origin, config)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  
  headers.set('Access-Control-Allow-Methods', config.methods.join(', '));
  headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
  
  if (config.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
};

export const handlePreflight = (req: Request): Response | null => {
  if (req.method === 'OPTIONS') {
    const config = getCORSConfig();
    const origin = req.headers.get('origin') || '';
    
    const headers = new Headers({
      'Access-Control-Allow-Methods': config.methods.join(', '),
      'Access-Control-Allow-Headers': config.allowedHeaders.join(', '),
      'Access-Control-Max-Age': config.maxAge.toString(),
    });
    
    if (origin && isOriginAllowed(origin, config)) {
      headers.set('Access-Control-Allow-Origin', origin);
    }
    
    return new Response(null, { status: config.optionsSuccessStatus, headers });
  }
  
  return null;
};

export const withCORS = (handler: (req: Request) => Promise<Response>) => {
  return async (req: Request): Promise<Response> => {
    const preflightResponse = handlePreflight(req);
    if (preflightResponse) return preflightResponse;
    const response = await handler(req);
    return applyEdgeCORS(req, response);
  };
};
