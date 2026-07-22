import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  getAutomations,
  getAutomation,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  getExecutions,
  generateAutomation
} from '../controllers/automationController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Routes
// Depending on the exact RBAC setup, we check project access before allowing operations
router.get('/', getAutomations);
router.post('/', createAutomation);

router.get('/:id', getAutomation);
router.put('/:id', updateAutomation);
router.delete('/:id', deleteAutomation);

router.get('/:id/executions', getExecutions);
router.post('/generate', generateAutomation);

export default router;
