/**
 * API Authentication Middleware
 * Validates API tokens and enforces authentication
 */

import { getJWT } from './jwt-handler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function validateAPIToken(token: string): Promise<boolean> {
  try {
    const jwt = getJWT();
    const payload = await jwt.verifyAccessToken(token);
    return payload !== null;
  } catch {
    return false;
  }
}

export async function extractUserFromToken(token: string): Promise<any> {
  try {
    const jwt = getJWT();
    return await jwt.verifyAccessToken(token);
  } catch {
    return null;
  }
}

export const apiAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
) => {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized - No token provided' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return new Response(JSON.stringify({ error: 'Unauthorized - Invalid token format' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = parts[1];
  const user = await extractUserFromToken(token);

  if (!user) {
    return new Response(JSON.stringify({ error: 'Forbidden - Invalid or expired token' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  req.user = user;
  return next();
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
) => {
  const authHeader = req.headers.get('authorization');
  
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const user = await extractUserFromToken(token);
      if (user) {
        req.user = user;
      }
    }
  }

  return next();
};

export const requireRole = (allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: Function) => {
    if (!req.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return next();
  };
};
