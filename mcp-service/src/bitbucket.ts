import axios from 'axios';

// Bitbucket API Base URL
const API_URL = 'https://api.bitbucket.org/2.0';

/**
 * Helper to determine Auth header type.
 * Supports:
 * 1. App Passwords (username:password) -> Basic Auth
 * 2. OAuth Tokens -> Bearer Auth
 */
function getAuthHeader(token: string): string {
    if (token.includes(':')) {
        const encoded = Buffer.from(token).toString('base64');
        return `Basic ${encoded}`;
    }
    return `Bearer ${token}`;
}

/**
 * List repositories for the authenticated user
 */
export async function listRepos(token: string) {
    try {
        const authHeader = getAuthHeader(token);
        // Fetch repos where role is member
        // Bitbucket pagination is next-page based, simplified here to fetch first page
        const response = await axios.get(`${API_URL}/repositories?role=member&pagelen=100`, {
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json'
            }
        });

        // Use the values array
        return response.data.values.map((repo: any) => ({
            repo_external_id: repo.uuid,
            repo_full_name: repo.full_name, // Bitbucket uses repo_slug usually, but full_name is owner/slug
            private: repo.is_private,
            html_url: repo.links.html.href,
            description: repo.description,
            default_branch: repo.mainbranch ? repo.mainbranch.name : 'master'
        }));
    } catch (error: any) {
        console.error('Bitbucket listRepos error:', error.response?.data || error.message);
        throw new Error(`Failed to fetch Bitbucket repositories: ${error.message}`);
    }
}

/**
 * Get PR Details (Title, Author, Head SHA)
 */
export async function getPrDetails(token: string, repo_full_name: string, pr_number: string) {
    try {
        const authHeader = getAuthHeader(token);
        const response = await axios.get(`${API_URL}/repositories/${repo_full_name}/pullrequests/${pr_number}`, {
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json'
            }
        });

        console.log(`[MCP] Bitbucket PR Author Payload for ${repo_full_name} #${pr_number}:`, JSON.stringify(response.data.author, null, 2));

        return {
            title: response.data.title,
            author: response.data.author?.display_name || response.data.author?.nickname || "Unknown",
            head_sha: response.data.source?.commit?.hash,
            html_url: response.data.links?.html?.href
        };
    } catch (error: any) {
        console.error('Bitbucket getPrDetails error:', error.response?.data || error.message);
        throw new Error(`Failed to fetch Bitbucket PR details: ${error.message}`);
    }
}

/**
 * Get the diff of a Pull Request
 */
export async function getPrDiff(token: string, repo_full_name: string, pr_number: string) {
    try {
        const authHeader = getAuthHeader(token);
        // Bitbucket diff endpoint: /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/diff
        const response = await axios.get(`${API_URL}/repositories/${repo_full_name}/pullrequests/${pr_number}/diff`, {
            headers: {
                'Authorization': authHeader,
                // Bitbucket returns raw diff text
            },
            responseType: 'text'
        });

        return { diff: response.data };
    } catch (error: any) {
        console.error('Bitbucket getPrDiff error:', error.response?.data || error.message);
        throw new Error(`Failed to fetch Bitbucket PR diff: ${error.message}`);
    }
}

/**
 * Create a general comment on a Pull Request
 */
export async function createComment(token: string, repo_full_name: string, pr_number: string, body: string) {
    try {
        const authHeader = getAuthHeader(token);
        const response = await axios.post(`${API_URL}/repositories/${repo_full_name}/pullrequests/${pr_number}/comments`, {
            content: {
                raw: body
            }
        }, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        return {
            id: response.data.id,
            html_url: response.data.links?.html?.href
        };
    } catch (error: any) {
        console.error('Bitbucket createComment error:', error.response?.data || error.message);
        throw new Error(`Failed to create Bitbucket comment: ${error.message}`);
    }
}

/**
 * Create a comprehensive PR review (General + Inline comments)
 * Bitbucket doesn't have a specific "Review" object like GitHub (which groups comments).
 * We simulate this by posting the summary comment first, then iterating to post inline comments.
 */
export async function createPRReview(token: string, repo_full_name: string, pr_number: string, comments: any[], body: string) {
    try {
        const authHeader = getAuthHeader(token);

        // 1. Post the main summary comment
        const summaryResult = await createComment(token, repo_full_name, pr_number, body);

        // 2. Post inline comments sequentially (to avoid rate limits)
        let postedCount = 0;
        for (const comment of comments) {
            try {
                // Bitbucket requires 'to' for added lines, 'from' for removed lines.
                // Assuming we are commenting on the NEW code (added/modified), so we use 'to'.
                // If line is null/undefined, it becomes a file-level comment if not handled, but we skip if no line
                if (!comment.line) continue;

                await axios.post(`${API_URL}/repositories/${repo_full_name}/pullrequests/${pr_number}/comments`, {
                    content: {
                        raw: comment.body
                    },
                    inline: {
                        path: comment.path,
                        to: comment.line
                    }
                }, {
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    }
                });
                postedCount++;
            } catch (err: any) {
                console.error(`Failed to post inline comment at ${comment.path}:${comment.line}`, err.message);
                // Continue to next comment even if one fails
            }
        }

        return {
            review_id: summaryResult.id.toString(), // Use summary comment ID as the "review ID"
            comment_count: postedCount,
            status: "success"
        };

    } catch (error: any) {
        console.error('Bitbucket createPRReview error:', error.response?.data || error.message);
        throw new Error(`Failed to create Bitbucket PR review: ${error.message}`);
    }
}
