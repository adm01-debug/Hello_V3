import { Router } from 'express';
import { HealthController } from './health-controller';

const router = Router();
const controller = new HealthController();

router.get('/health', controller.healthCheck.bind(controller));
router.get('/health/readiness', controller.readiness.bind(controller));
router.get('/health/liveness', controller.liveness.bind(controller));

export default router;
