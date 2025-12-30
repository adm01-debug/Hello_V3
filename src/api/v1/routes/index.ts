import { Router } from 'express';

const router = Router();

router.get('/users/:id', (req, res) => {
  res.json({ version: 'v1', message: 'Get user' });
});

router.post('/users', (req, res) => {
  res.status(201).json({ version: 'v1', message: 'Create user' });
});

export default router;
