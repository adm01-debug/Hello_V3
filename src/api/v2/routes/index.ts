import { Router } from 'express';

const router = Router();

router.get('/users/:id', (req, res) => {
  res.json({
    data: { version: 'v2', message: 'Get user endpoint' },
    meta: { version: 'v2', timestamp: new Date().toISOString() }
  });
});

router.put('/users/:id', (req, res) => {
  res.json({
    data: { version: 'v2', message: 'Update user endpoint (PUT)' },
    meta: { version: 'v2', timestamp: new Date().toISOString() }
  });
});

export default router;
