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

        console.log(`[MCP] Successfully fetched diff.`);
        return {
            title: prResponse.data.title,
            author: prResponse.data.user.login,
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
