import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import * as integrationController from '../controllers/integrationController';

const router = Router();

// OAuth routes
router.get('/github/url', authenticate, integrationController.getGitHubOAuthUrl);
router.post('/github/callback', authenticate, integrationController.githubOAuthCallback);
router.post('/github/webhook', integrationController.githubWebhook);

// Fallback GET for misconfigured OAuth callback
router.get('/github/callback', (req, res) => {
  const { code, state } = req.query;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3001';
  res.redirect(`${clientUrl}/dashboard/integrations/github/callback?code=${code}&state=${state}`);
});

// Account management
router.get('/accounts', authenticate, integrationController.getConnectedAccounts);

// GitHub specific API
router.get('/github/repos', authenticate, integrationController.fetchGitHubRepositories);
router.post('/github/link-repo', authenticate, integrationController.linkRepositoryToProject);

// Project repositories
router.get('/projects/:projectId/repos', authenticate, integrationController.getProjectRepositories);
router.get('/projects/:projectId/deployments', authenticate, integrationController.getProjectDeployments);
router.get('/projects/:projectId/metrics', authenticate, integrationController.getProjectMetrics);

export default router;
