import axios from 'axios';

// GitLab API Base URL
const API_URL = 'https://gitlab.com/api/v4';

/**
 * List repositories (projects) for the authenticated user
 */
export async function listRepos(token: string) {
    try {
        const response = await axios.get(`${API_URL}/projects?membership=true&simple=true&per_page=100`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data.map((repo: any) => ({
            repo_external_id: repo.id.toString(),
            repo_full_name: repo.path_with_namespace,
            private: repo.visibility === 'private',
            html_url: repo.web_url,
            description: repo.description,
            default_branch: repo.default_branch || 'master'
        }));
    } catch (error: any) {
        console.error('GitLab listRepos error:', error.response?.data || error.message);
        throw new Error(`Failed to fetch GitLab repositories: ${error.message}`);
    }
}

/**
 * Get MR Details (Title, Author, Head SHA)
 */
export async function getPrDetails(token: string, repo_full_name: string, pr_number: string) {
    try {
        // repo_full_name needs to be URL encoded for GitLab if it contains slashes, which it always does
        const encodedPath = encodeURIComponent(repo_full_name);
        const response = await axios.get(`${API_URL}/projects/${encodedPath}/merge_requests/${pr_number}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return {
            title: response.data.title,
            author: response.data.author?.name || response.data.author?.username || "Unknown",
            head_sha: response.data.sha,
            html_url: response.data.web_url
        };
    } catch (error: any) {
        console.error('GitLab getPrDetails error:', error.response?.data || error.message);
        throw new Error(`Failed to fetch GitLab MR details: ${error.message}`);
    }
}

/**
 * Get the diff of a Merge Request
 */
export async function getPrDiff(token: string, repo_full_name: string, pr_number: string) {
    try {
        const encodedPath = encodeURIComponent(repo_full_name);
        
        // We use the 'changes' endpoint which is often more reliable than the .diff extension
        // it returns a JSON object with a 'changes' array
        const response = await axios.get(`${API_URL}/projects/${encodedPath}/merge_requests/${pr_number}/changes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const changes = response.data.changes || [];
        
        // Reconstruct unified diff format from individual file changes
        let unifiedDiff = "";
        for (const change of changes) {
            if (change.diff) {
                // Add file headers
                unifiedDiff += `--- a/${change.old_path}\n`;
                unifiedDiff += `+++ b/${change.new_path}\n`;
                unifiedDiff += change.diff + "\n";
            }
        }

        console.log(`[MCP] Fetched ${changes.length} GitLab file changes. Reconstructed diff length: ${unifiedDiff.length}`);
        
        return { diff: unifiedDiff };
    } catch (error: any) {
        console.error('GitLab getPrDiff error:', error.response?.data || error.message);
        throw new Error(`Failed to fetch GitLab MR diff: ${error.message}`);
    }
}

/**
 * Create a general comment on a Merge Request
 */
export async function createComment(token: string, repo_full_name: string, pr_number: string, body: string) {
    try {
        const encodedPath = encodeURIComponent(repo_full_name);
        const response = await axios.post(`${API_URL}/projects/${encodedPath}/merge_requests/${pr_number}/notes`, {
            body: body
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            id: response.data.id,
            html_url: `${API_URL}/projects/${encodedPath}/merge_requests/${pr_number}#note_${response.data.id}`
        };
    } catch (error: any) {
        console.error('GitLab createComment error:', error.response?.data || error.message);
        throw new Error(`Failed to create GitLab comment: ${error.message}`);
    }
}

/**
 * Create a comprehensive PR review (General + Inline comments)
 * GitLab uses "discussions" for multi-line comments.
 */
export async function createPRReview(token: string, repo_full_name: string, pr_number: string, comments: any[], body: string) {
    try {
        const encodedPath = encodeURIComponent(repo_full_name);

        // 1. Post the main summary comment
        const summaryResult = await createComment(token, repo_full_name, pr_number, body);

        // 2. Post inline comments as discussions
        let postedCount = 0;
        for (const comment of comments) {
            try {
                if (!comment.line) continue;

                // GitLab needs position info for inline comments
                // This is a simplified version. For full accuracy, we'd need base_sha, start_sha, and head_sha.
                // However, many integrations use simpler "notes" if they don't have full position info.
                // Let's try posting as a discussion if possible.
                
                await axios.post(`${API_URL}/projects/${encodedPath}/merge_requests/${pr_number}/discussions`, {
                    body: comment.body,
                    /* position: {
                        base_sha: ..., 
                        start_sha: ...,
                        head_sha: ...,
                        new_path: comment.path,
                        new_line: comment.line,
                        position_type: "text"
                    } */
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                postedCount++;
            } catch (err: any) {
                console.error(`Failed to post GitLab inline comment at ${comment.path}:${comment.line}`, err.message);
            }
        }

        return {
            review_id: summaryResult.id.toString(),
            comment_count: postedCount,
            status: "success"
        };
    } catch (error: any) {
        console.error('GitLab createPRReview error:', error.response?.data || error.message);
        throw new Error(`Failed to create GitLab review: ${error.message}`);
    }
}

/**
 * Create a Webhook for the repository
 */
export async function createWebhook(token: string, repo_full_name: string, webhook_url: string, secret?: string) {
    try {
        const encodedPath = encodeURIComponent(repo_full_name);

        // 1. Check if webhook already exists
        const hooksResponse = await axios.get(`${API_URL}/projects/${encodedPath}/hooks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const existingHook = hooksResponse.data.find((hook: any) => hook.url === webhook_url);
        if (existingHook) {
            return { id: existingHook.id, active: true };
        }

        // 2. Create Webhook
        const response = await axios.post(`${API_URL}/projects/${encodedPath}/hooks`, {
            url: webhook_url,
            merge_requests_events: true,
            push_events: false,
            token: secret // GitLab uses "token" for the secret
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return { id: response.data.id, active: true };
    } catch (error: any) {
        console.error('GitLab createWebhook error:', error.response?.data || error.message);
        throw new Error(`Failed to create GitLab webhook: ${error.message}`);
    }
}

export async function validateToken(token: string) {
    try {
        const response = await axios.get(`${API_URL}/user`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        return {
            valid: true,
            username: response.data.username,
            scopes: ["api"]
        };
    } catch (error: any) {
        console.error(`[MCP] GitLab token validation failed: ${error.message}`);
        return { valid: false, message: "Invalid GitLab Token" };
    }
}
