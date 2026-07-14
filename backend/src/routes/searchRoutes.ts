import { Router } from 'express';
import { searchController } from '../controllers/searchController';
import { authenticate } from '../middleware/authMiddleware';

const searchRoutes = Router();

searchRoutes.use(authenticate);

searchRoutes.get('/', searchController.search);

export { searchRoutes };
