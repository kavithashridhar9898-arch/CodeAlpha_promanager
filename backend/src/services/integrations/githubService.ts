import axios from 'axios';
import { AppError } from '../../utils/AppError';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_OAUTH_URL = 'https://github.com/login/oauth';

export class GitHubService {
  // ─── OAuth Flow ─────────────────────────────────────────────────────────────

  static getOAuthUrl(state: string) {
    if (!GITHUB_CLIENT_ID) throw new AppError('GitHub integration is not configured', 500);
    const scope = 'repo read:user user:email admin:repo_hook';
    return `${GITHUB_OAUTH_URL}/authorize?client_id=${GITHUB_CLIENT_ID}&scope=${encodeURIComponent(scope)}&state=${state}`;
  }

  static async exchangeCodeForToken(code: string) {
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      throw new AppError('GitHub integration is not configured', 500);
    }

    try {
      const response = await axios.post(
        `${GITHUB_OAUTH_URL}/access_token`,
        {
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        },
        {
          headers: { Accept: 'application/json' },
        }
      );

      if (response.data.error) {
        throw new AppError(response.data.error_description || 'OAuth failed', 400);
      }

      return response.data.access_token;
    } catch (error: any) {
      throw new AppError('Failed to exchange code for token: ' + error.message, 500);
    }
  }

  // ─── API Interactions ───────────────────────────────────────────────────────

  static async getAuthenticatedUser(accessToken: string) {
    try {
      const response = await axios.get(`${GITHUB_API_URL}/user`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error: any) {
      throw new AppError('Failed to fetch GitHub user: ' + error.message, 500);
    }
  }

  static async fetchUserRepositories(accessToken: string) {
    try {
      // Fetch repositories the user has access to (public and private)
      const response = await axios.get(`${GITHUB_API_URL}/user/repos?per_page=100&sort=updated`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      return response.data.map((repo: any) => ({
        providerId: repo.id.toString(),
        fullName: repo.full_name,
        name: repo.name,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
      }));
    } catch (error: any) {
      throw new AppError('Failed to fetch repositories: ' + error.message, 500);
    }
  }

  // ─── Webhooks ───────────────────────────────────────────────────────────────

  static async createRepositoryWebhook(accessToken: string, repoFullName: string, webhookUrl: string, secret: string) {
    try {
      const response = await axios.post(
        `${GITHUB_API_URL}/repos/${repoFullName}/hooks`,
        {
          name: 'web',
          active: true,
          events: ['push', 'pull_request', 'issues', 'release'],
          config: {
            url: webhookUrl,
            content_type: 'json',
            insecure_ssl: '0',
            secret,
          },
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to create webhook:', error.response?.data || error.message);
      // We don't throw heavily here because if they already have one, it's fine.
      return null;
    }
  }
}
