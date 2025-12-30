import { Router } from 'express';

const router = Router();

router.get('/users/:id', (req, res) => {
  res.json({ 
    data: { version: 'v2', message: 'Get user' },
    meta: { version: 'v2', timestamp: new Date().toISOString() }
  });
});

router.post('/users', (req, res) => {
  res.status(201).json({ 
    data: { version: 'v2', message: 'Create user' },
    meta: { version: 'v2', timestamp: new Date().toISOString() }
  });
});

export default router;
