import { Router } from 'express';
import { HealthController } from './health-controller';

const router = Router();
const controller = new HealthController();

router.get('/health', (req, res) => controller.healthCheck(req, res));
router.get('/health/readiness', (req, res) => controller.readiness(req, res));
router.get('/health/liveness', (req, res) => controller.liveness(req, res));

export default router;
