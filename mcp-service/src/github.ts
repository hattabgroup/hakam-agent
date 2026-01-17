import axios from 'axios';

const GITHUB_API_URL = 'https://api.github.com';

export async function listRepos(token: string) {
    console.log(`[MCP] Listing repos...`);
    try {
        const response = await axios.get(`${GITHUB_API_URL}/user/repos?per_page=100&sort=created&direction=desc&visibility=all`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`[MCP] Found ${response.data.length} repos.`);
        return response.data.map((repo: any) => ({
            repo_external_id: repo.id.toString(),
            repo_full_name: repo.full_name
        }));
    } catch (error: any) {
        console.error(`[MCP] Error listing repos: ${error.response?.data?.message || error.message}`);
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
    }
}

async function getUserName(token: string, username: string): Promise<string> {
    try {
        const response = await axios.get(`${GITHUB_API_URL}/users/${username}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.name || username;
    } catch (e) {
        console.warn(`[MCP] Failed to fetch user name for ${username}, falling back to login.`);
        return username;
    }
}

export async function getPrDetails(token: string, repo_full_name: string, pr_number: number) {
    console.log(`[MCP] Fetching details for ${repo_full_name} PR #${pr_number}...`);
    try {
        const prResponse = await axios.get(`${GITHUB_API_URL}/repos/${repo_full_name}/pulls/${pr_number}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const authorName = await getUserName(token, prResponse.data.user.login);

        return {
            title: prResponse.data.title,
            author: authorName,
            head_sha: prResponse.data.head.sha,
            html_url: prResponse.data.html_url
        };
    } catch (error: any) {
        console.error(`[MCP] Error fetching PR details: ${error.response?.data?.message || error.message}`);
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
    }
}

export async function getPrDiff(token: string, repo_full_name: string, pr_number: number) {
    console.log(`[MCP] Fetching diff for ${repo_full_name} PR #${pr_number}...`);
    try {
        // Get PR details for author/title
        const prResponse = await axios.get(`${GITHUB_API_URL}/repos/${repo_full_name}/pulls/${pr_number}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Get Diff
        const diffResponse = await axios.get(`${GITHUB_API_URL}/repos/${repo_full_name}/pulls/${pr_number}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3.diff'
            }
        });

        const authorName = await getUserName(token, prResponse.data.user.login);

        console.log(`[MCP] Successfully fetched diff.`);
        return {
            title: prResponse.data.title,
            author: authorName,
            head_sha: prResponse.data.head.sha,
            diff: diffResponse.data
        };
    } catch (error: any) {
        console.error(`[MCP] Error fetching diff: ${error.response?.data?.message || error.message}`);
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
    }
}

export async function createPRReview(token: string, repo_full_name: string, pr_number: number, comments: any[], body?: string) {
    console.log(`[MCP] Creating PR Review on ${repo_full_name} PR #${pr_number}...`);
    console.log(`[MCP] Comments: ${JSON.stringify(comments, null, 2)}`);
    try {
        const response = await axios.post(`${GITHUB_API_URL}/repos/${repo_full_name}/pulls/${pr_number}/reviews`,
            {
                body,
                comments,
                event: 'COMMENT'
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            });
        console.log(`[MCP] PR Review created: ${response.data.id}`);
        return { review_id: response.data.id.toString() };
    } catch (error: any) {
        console.error(`[MCP] Error creating PR review: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.errors) {
            console.error(`[MCP] Validation Errors:`, JSON.stringify(error.response.data.errors));
        }
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
    }
}

export async function createComment(token: string, repo_full_name: string, pr_number: number, body: string) {
    console.log(`[MCP] Creating comment on ${repo_full_name} PR #${pr_number}...`);
    try {
        const response = await axios.post(`${GITHUB_API_URL}/repos/${repo_full_name}/issues/${pr_number}/comments`,
            { body },
            {
                headers: { Authorization: `Bearer ${token}` }
            });
        console.log(`[MCP] Comment created: ${response.data.id}`);
        return { comment_id: response.data.id.toString() };
    } catch (error: any) {
        console.error(`[MCP] Error creating comment: ${error.response?.data?.message || error.message}`);
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
    }
}

export async function createWebhook(token: string, repo_full_name: string, webhook_url: string, secret: string) {
    console.log(`[MCP] Creating Webhook on ${repo_full_name}...`);
    try {
        // 1. Check if webhook already exists
        const hooksResponse = await axios.get(`${GITHUB_API_URL}/repos/${repo_full_name}/hooks`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const existingHook = hooksResponse.data.find((hook: any) => hook.config.url === webhook_url);
        if (existingHook) {
            console.log(`[MCP] Webhook already exists: ${existingHook.id}`);
            return { id: existingHook.id.toString(), active: existingHook.active };
        }

        // 2. Create Webhook
        const response = await axios.post(`${GITHUB_API_URL}/repos/${repo_full_name}/hooks`,
            {
                name: "web",
                active: true,
                events: ["pull_request"],
                config: {
                    url: webhook_url,
                    content_type: "json",
                    secret: secret,
                    insecure_ssl: "0"
                }
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            });

        console.log(`[MCP] Webhook created: ${response.data.id}`);
        return { id: response.data.id.toString(), active: response.data.active };
    } catch (error: any) {
        console.error(`[MCP] Error creating webhook: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.errors) {
            console.error(`[MCP] Validation Errors:`, JSON.stringify(error.response.data.errors));
        }
        throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
    }
}
