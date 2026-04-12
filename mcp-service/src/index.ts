import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as github from './github';
import * as bitbucket from './bitbucket';
import * as gitlab from './gitlab';

const app = express();
const port = 8000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: "ok" });
});

// Providers: Repos List
app.post('/providers/:provider/repos/list', async (req: Request, res: Response) => {
    const { provider } = req.params;
    const { token } = req.body;

    try {
        if (provider === 'github') {
            const repos = await github.listRepos(token);
            res.json({ repos });
        } else if (provider === 'bitbucket') {
            const repos = await bitbucket.listRepos(token);
            res.json({ repos });
        } else if (provider === 'gitlab') {
            const repos = await gitlab.listRepos(token);
            res.json({ repos });
        } else {
            res.status(501).json({ error: "Provider not implemented yet" });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Providers: PR Details
app.post('/providers/:provider/prs/details', async (req: Request, res: Response) => {
    const { provider } = req.params;
    const { token, repo_full_name, pr_number } = req.body;

    try {
        if (provider === 'github') {
            const result = await github.getPrDetails(token, repo_full_name, pr_number);
            res.json(result);
        } else if (provider === 'bitbucket') {
            const result = await bitbucket.getPrDetails(token, repo_full_name, pr_number);
            res.json(result);
        } else if (provider === 'gitlab') {
            const result = await gitlab.getPrDetails(token, repo_full_name, pr_number);
            res.json(result);
        } else {
            res.status(501).json({ error: "Provider not implemented yet" });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Providers: PR Diff
app.post('/providers/:provider/prs/diff', async (req: Request, res: Response) => {
    const { provider } = req.params;
    const { token, repo_full_name, pr_number } = req.body;

    try {
        if (provider === 'github') {
            const result = await github.getPrDiff(token, repo_full_name, pr_number);
            res.json(result);
        } else if (provider === 'bitbucket') {
            const result = await bitbucket.getPrDiff(token, repo_full_name, pr_number);
            res.json(result);
        } else if (provider === 'gitlab') {
            const result = await gitlab.getPrDiff(token, repo_full_name, pr_number);
            res.json(result);
        } else {
            res.status(501).json({ error: "Provider not implemented yet" });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Providers: Comment
app.post('/providers/:provider/prs/comment', async (req: Request, res: Response) => {
    const { provider } = req.params;
    const { token, repo_full_name, pr_number, body } = req.body;

    try {
        if (provider === 'github') {
            const result = await github.createComment(token, repo_full_name, pr_number, body);
            res.json(result);
        } else if (provider === 'bitbucket') {
            const result = await bitbucket.createComment(token, repo_full_name, pr_number, body);
            res.json(result);
        } else if (provider === 'gitlab') {
            const result = await gitlab.createComment(token, repo_full_name, pr_number, body);
            res.json(result);
        } else {
            res.status(501).json({ error: "Provider not implemented yet" });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Providers: PR Review (Inline comments)
app.post('/providers/:provider/prs/reviews', async (req: Request, res: Response) => {
    const { provider } = req.params;
    const { token, repo_full_name, pr_number, comments, body } = req.body;

    try {
        if (provider === 'github') {
            const result = await github.createPRReview(token, repo_full_name, pr_number, comments, body);
            res.json(result);
        } else if (provider === 'bitbucket') {
            const result = await bitbucket.createPRReview(token, repo_full_name, pr_number, comments, body);
            res.json(result);
        } else if (provider === 'gitlab') {
            const result = await gitlab.createPRReview(token, repo_full_name, pr_number, comments, body);
            res.json(result);
        } else {
            res.status(501).json({ error: "Provider not implemented yet" });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Providers: Create Webhook
app.post('/providers/:provider/webhooks', async (req: Request, res: Response) => {
    const { provider } = req.params;
    const { token, repo_full_name, webhook_url, secret } = req.body;

    try {
        if (provider === 'github') {
            const result = await github.createWebhook(token, repo_full_name, webhook_url, secret);
            res.json(result);
        } else if (provider === 'bitbucket') {
            const result = await bitbucket.createWebhook(token, repo_full_name, webhook_url, secret);
            res.json(result);
        } else if (provider === 'gitlab') {
            const result = await gitlab.createWebhook(token, repo_full_name, webhook_url, secret);
            res.json(result);
        } else {
            res.status(501).json({ error: "Provider not implemented yet" });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Providers: Validate Token
app.post('/providers/:provider/validate', async (req: Request, res: Response) => {
    const { provider } = req.params;
    const { token } = req.body;

    try {
        if (provider === 'github') {
            const result = await github.validateToken(token);
            res.json(result);
        } else if (provider === 'bitbucket') {
            const result = await bitbucket.validateToken(token);
            res.json(result);
        } else if (provider === 'gitlab') {
            const result = await gitlab.validateToken(token);
            res.json(result);
        } else {
            res.status(501).json({ error: "Provider not implemented yet" });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Hakam MCP Service running on port ${port}`);
});
