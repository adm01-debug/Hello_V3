import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * API v2 Routes
 * 
 * Improvements over v1:
 * - Consistent response envelope (data + meta)
 * - Better error format
 * - Deprecation warnings
 * - PUT instead of PATCH
 */

/**
 * Response envelope helper
 */
const envelope = <T>(data: T, meta?: Record<string, unknown>) => ({
  data,
  meta: {
    version: 'v2',
    timestamp: new Date().toISOString(),
    ...meta,
  },
});

/**
 * Error envelope helper
 */
const errorEnvelope = (message: string, code: string, status: number = 400) => ({
  error: {
    message,
    code,
    status,
  },
  meta: {
    version: 'v2',
    timestamp: new Date().toISOString(),
  },
});

/**
 * Middleware: UUID validation
 */
const validateUUID = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(id)) {
    return res.status(400).json(errorEnvelope('Invalid UUID v4 format', 'INVALID_ID'));
  }
  
  next();
};

/**
 * GET /users/:id - Get user by ID
 */
router.get('/users/:id', validateUUID, async (req: Request, res: Response) => {
  try {
    // TODO: Replace with actual controller
    // const user = await userController.getById(req.params.id);
    
    res.json(envelope({
      id: req.params.id,
      message: 'User endpoint - replace with actual controller',
    }));
  } catch (error) {
    res.status(500).json(
      errorEnvelope(error instanceof Error ? error.message : 'Internal server error', 'INTERNAL_ERROR', 500)
    );
  }
});

/**
 * POST /users - Create user
 */
router.post('/users', async (req: Request, res: Response) => {
  try {
    // Validate request body
    if (!req.body.email) {
      return res.status(400).json(errorEnvelope('Email is required', 'VALIDATION_ERROR'));
    }

    // TODO: Replace with actual controller
    // const user = await userController.create(req.body);

    res.status(201).json(envelope({
      message: 'User created - replace with actual controller',
      input: req.body,
    }));
  } catch (error) {
    res.status(500).json(
      errorEnvelope(error instanceof Error ? error.message : 'Internal server error', 'INTERNAL_ERROR', 500)
    );
  }
});

/**
 * PUT /users/:id - Replace user (v2 uses PUT instead of PATCH)
 */
router.put('/users/:id', validateUUID, async (req: Request, res: Response) => {
  try {
    // TODO: Replace with actual controller
    // const user = await userController.replace(req.params.id, req.body);

    res.json(envelope({
      id: req.params.id,
      message: 'User replaced - replace with actual controller',
    }));
  } catch (error) {
    res.status(500).json(
      errorEnvelope(error instanceof Error ? error.message : 'Internal server error', 'INTERNAL_ERROR', 500)
    );
  }
});

/**
 * DELETE /users/:id - Delete user
 */
router.delete('/users/:id', validateUUID, async (req: Request, res: Response) => {
  try {
    // TODO: Replace with actual controller
    // await userController.delete(req.params.id);

    res.status(204).send();
  } catch (error) {
    res.status(500).json(
      errorEnvelope(error instanceof Error ? error.message : 'Internal server error', 'INTERNAL_ERROR', 500)
    );
  }
});

/**
 * 404 handler
 */
router.use((req: Request, res: Response) => {
  res.status(404).json(errorEnvelope('Route not found', 'NOT_FOUND', 404));
});

export default router;
