import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * API v1 Routes
 * 
 * Features:
 * - RESTful endpoints
 * - Basic validation
 * - Error handling
 * - Response format: { data, error }
 */

/**
 * Middleware: UUID validation
 */
const validateUUID = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(id)) {
    return res.status(400).json({
      error: 'Invalid ID format. Expected UUID.',
      code: 'INVALID_ID',
    });
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
    
    res.json({
      data: {
        id: req.params.id,
        version: 'v1',
        message: 'User endpoint - replace with actual controller',
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /users - Create user
 */
router.post('/users', async (req: Request, res: Response) => {
  try {
    // Validate request body
    if (!req.body.email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'MISSING_EMAIL',
      });
    }

    // TODO: Replace with actual controller
    // const user = await userController.create(req.body);

    res.status(201).json({
      data: {
        version: 'v1',
        message: 'User created - replace with actual controller',
        input: req.body,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * PATCH /users/:id - Update user
 */
router.patch('/users/:id', validateUUID, async (req: Request, res: Response) => {
  try {
    // TODO: Replace with actual controller
    // const user = await userController.update(req.params.id, req.body);

    res.json({
      data: {
        id: req.params.id,
        version: 'v1',
        message: 'User updated - replace with actual controller',
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
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
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 404 handler
 */
router.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    version: 'v1',
  });
});

export default router;
