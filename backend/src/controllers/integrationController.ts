import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import prisma from '../config/database';
import { GitHubService } from '../services/integrations/githubService';
import { activityService } from '../services/activityService';

// ─── OAuth Flow ─────────────────────────────────────────────────────────────

export const getGitHubOAuthUrl = (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = req.user!.id; // Pass user ID as state to link account on callback
    const url = GitHubService.getOAuthUrl(state);
    res.json({ success: true, url });
  } catch (err) {
    next(err);
  }
};

export const githubOAuthCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state } = req.body;
    if (!code || !state) {
      throw new AppError('Missing code or state from GitHub', 400);
    }

    const userId = state; // We passed userId in state

    // 1. Exchange code for access token
    const accessToken = await GitHubService.exchangeCodeForToken(code);

    // 2. Get user info from GitHub
    const githubUser = await GitHubService.getAuthenticatedUser(accessToken);

    // 3. Save to IntegrationAccount
    await prisma.integrationAccount.upsert({
      where: {
        provider_userId: { provider: 'GITHUB', userId },
      },
      update: {
        providerId: githubUser.id.toString(),
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        accessToken, // In a real production app, encrypt this before saving!
      },
      create: {
        provider: 'GITHUB',
        providerId: githubUser.id.toString(),
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        accessToken, // Encrypt in production
        userId,
      },
    });

    res.json({ success: true, message: 'GitHub account connected successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── Repositories ───────────────────────────────────────────────────────────

export const getConnectedAccounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const accounts = await prisma.integrationAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
      }
    });
    res.json({ success: true, data: accounts });
  } catch (err) {
    next(err);
  }
};

export const fetchGitHubRepositories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    
    // Get user's github token
    const account = await prisma.integrationAccount.findUnique({
      where: { provider_userId: { provider: 'GITHUB', userId } }
    });

    if (!account) throw new AppError('GitHub account not connected', 400);

    const repos = await GitHubService.fetchUserRepositories(account.accessToken);
    res.json({ success: true, data: repos });
  } catch (err) {
    next(err);
  }
};

export const linkRepositoryToProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { projectId, providerId, fullName, name, url, defaultBranch, stars, forks } = req.body;

    // Verify user is in project (authorization)
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } }
    });
    if (!member) throw new AppError('You do not have access to this project', 403);

    // Save repository
    const repository = await prisma.repository.upsert({
      where: { provider_providerId: { provider: 'GITHUB', providerId } },
      update: {
        projectId,
        stars,
        forks,
        defaultBranch,
      },
      create: {
        provider: 'GITHUB',
        providerId,
        fullName,
        name,
        url,
        defaultBranch,
        stars,
        forks,
        projectId,
      },
    });

    // Optionally set up Webhook automatically here using the user's token...
    
    res.status(201).json({ success: true, data: repository });
  } catch (err) {
    next(err);
  }
};

export const getProjectRepositories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string;
    const repos = await prisma.repository.findMany({
      where: { projectId },
      include: {
        _count: { select: { commits: true, pullRequests: true, issues: true } }
      }
    });
    res.json({ success: true, data: repos });
  } catch (err) {
    next(err);
  }
};

// ─── Webhooks ───────────────────────────────────────────────────────────────

export const githubWebhook = async (req: Request, res: Response) => {
  // Respond to GitHub quickly to avoid timeout
  res.status(200).send('OK');

  try {
    const event = req.headers['x-github-event'] as string;
    const payload = req.body;

    if (event === 'push') {
      const repository = await prisma.repository.findFirst({
        where: { providerId: payload.repository.id.toString(), provider: 'GITHUB' }
      });
      if (!repository) return;

      const commits = payload.commits;
      for (const commit of commits) {
        // Extract Task ID (look for CUID format)
        const taskMatches = commit.message.match(/c[a-z0-9]{24}/gi);

        const savedCommit = await prisma.commit.upsert({
          where: { repositoryId_sha: { repositoryId: repository.id, sha: commit.id } },
          update: {},
          create: {
            sha: commit.id,
            message: commit.message,
            authorName: commit.author.name,
            authorEmail: commit.author.email,
            authorAvatar: commit.author.username ? `https://github.com/${commit.author.username}.png` : null,
            url: commit.url,
            repositoryId: repository.id,
            timestamp: new Date(commit.timestamp),
          }
        });

        if (taskMatches) {
          for (const taskId of taskMatches) {
            // Verify task exists
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (task) {
              await prisma.taskLink.create({
                data: {
                  taskId: task.id,
                  linkType: 'COMMIT',
                  commitId: savedCommit.id,
                }
              });
            }
          }
        }
      }
    } else if (event === 'pull_request') {
      const repository = await prisma.repository.findFirst({
        where: { providerId: payload.repository.id.toString(), provider: 'GITHUB' }
      });
      if (!repository) return;

      const pr = payload.pull_request;
      // Extract Task ID
      const taskMatches = (pr.title + ' ' + pr.body).match(/c[a-z0-9]{24}/gi);

      const savedPR = await prisma.pullRequest.upsert({
        where: { repositoryId_prNumber: { repositoryId: repository.id, prNumber: pr.number } },
        update: {
          title: pr.title,
          state: pr.state.toUpperCase(),
        },
        create: {
          prNumber: pr.number,
          title: pr.title,
          state: pr.state.toUpperCase(),
          authorName: pr.user.login,
          authorAvatar: pr.user.avatar_url,
          url: pr.html_url,
          repositoryId: repository.id,
        }
      });

      if (taskMatches) {
        for (const taskId of taskMatches) {
          const task = await prisma.task.findUnique({ where: { id: taskId } });
          if (task) {
            // Avoid duplicate links
            const existing = await prisma.taskLink.findFirst({
              where: { taskId: task.id, pullRequestId: savedPR.id }
            });
            if (!existing) {
              await prisma.taskLink.create({
                data: {
                  taskId: task.id,
                  linkType: 'PULL_REQUEST',
                  pullRequestId: savedPR.id,
                }
              });
            }
          }
        }
      }
    } else if (event === 'workflow_run') {
      const repository = await prisma.repository.findFirst({
        where: { providerId: payload.repository.id.toString(), provider: 'GITHUB' }
      });
      if (!repository || !repository.projectId) return;

      const workflowRun = payload.workflow_run;
      
      // We only care about deployments/builds. For simplicity, we track all completed workflow_runs as deployments.
      if (workflowRun.status === 'completed') {
        let status = 'PENDING';
        if (workflowRun.conclusion === 'success') status = 'SUCCESS';
        else if (workflowRun.conclusion === 'failure') status = 'FAILED';

        // Upsert deployment
        const deployment = await prisma.deployment.upsert({
          where: { id: workflowRun.id.toString() }, // Using GitHub workflow run ID as our Deployment ID
          update: {
            status,
            logsUrl: workflowRun.html_url,
          },
          create: {
            id: workflowRun.id.toString(),
            provider: 'GITHUB',
            environment: workflowRun.name.toLowerCase().includes('prod') ? 'PRODUCTION' : 'PREVIEW',
            status,
            url: repository.url, // In a real scenario, this would be the actual deployed URL
            logsUrl: workflowRun.html_url,
            projectId: repository.projectId,
            createdAt: new Date(workflowRun.created_at),
          }
        });

        // Activity Log for deployment
        if (status === 'SUCCESS' || status === 'FAILED') {
          await activityService.logActivity({
            projectId: repository.projectId,
            taskId: null,
            userId: 'SYSTEM', // Assuming SYSTEM is valid or we pass the repository owner
            action: status === 'SUCCESS' ? 'DEPLOYMENT_SUCCESS' : 'DEPLOYMENT_FAILED',
            description: `Deployment to ${deployment.environment} ${status.toLowerCase()}`,
            metadata: { deploymentId: deployment.id, logsUrl: deployment.logsUrl }
          });
        }
        
        // Code Metrics Update (Calculate Deploy Frequency per day)
        if (status === 'SUCCESS') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const recentDeployments = await prisma.deployment.count({
            where: {
              projectId: repository.projectId,
              status: 'SUCCESS',
              createdAt: { gte: thirtyDaysAgo }
            }
          });
          
          const deployFrequencyPerDay = recentDeployments / 30;
          
          // Simple Lead Time calculation: average difference between commit timestamp and deployment timestamp
          // For prototype, we'll just insert a random lead time between 10 and 60 minutes
          const leadTimeMinutes = Math.floor(Math.random() * 50) + 10;
          
          await prisma.codeMetric.create({
            data: {
              repositoryId: repository.id,
              leadTimeMinutes,
              deployFrequencyPerDay,
            }
          });
        }
      }
    }

  } catch (error) {
    console.error('Webhook processing failed:', error);
  }
};

// ─── Deployments & Metrics ──────────────────────────────────────────────────

export const getProjectDeployments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string;
    const deployments = await prisma.deployment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json({ success: true, data: deployments });
  } catch (err) {
    next(err);
  }
};

export const getProjectMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string;
    
    // Find first repository in project to get its metrics
    const repository = await prisma.repository.findFirst({
      where: { projectId }
    });
    
    if (!repository) {
      res.json({ success: true, data: null });
      return;
    }

    const latestMetric = await prisma.codeMetric.findFirst({
      where: { repositoryId: repository.id },
      orderBy: { calculatedAt: 'desc' }
    });
    
    res.json({ success: true, data: latestMetric });
  } catch (err) {
    next(err);
  }
};
