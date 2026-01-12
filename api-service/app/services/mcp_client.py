import os
import requests
from fastapi import HTTPException

MCP_SERVICE_URL = os.getenv("MCP_SERVICE_URL", "http://mcp-service:8000")

class MCPClient:
    def __init__(self):
        self.base_url = MCP_SERVICE_URL

    def list_repos(self, provider: str, token: str):
        try:
            response = requests.post(f"{self.base_url}/providers/{provider}/repos/list", 
                                   json={"token": token})
            response.raise_for_status()
            return response.json().get("repos", [])
        except requests.RequestException as e:
            status_code = 502
            detail = "MCP Service Error"
            if hasattr(e, 'response') and e.response:
                status_code = e.response.status_code
                try:
                    detail = e.response.json().get("error", detail)
                except:
                    pass
            raise HTTPException(status_code=status_code, detail=f"Failed to fetch repos from MCP: {detail}")

    def get_pr_diff(self, provider: str, token: str, repo_full_name: str, pr_number: str):
        try:
            response = requests.post(f"{self.base_url}/providers/{provider}/prs/diff", 
                                   json={"token": token, "repo_full_name": repo_full_name, "pr_number": pr_number})
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            status_code = 502
            detail = f"Failed to fetch diff from MCP: {e}"
            if hasattr(e, 'response') and e.response:
                status_code = e.response.status_code
                try:
                    detail = e.response.json().get("error", detail)
                except:
                    pass
            raise HTTPException(status_code=status_code, detail=detail)

    def create_comment(self, provider: str, token: str, repo_full_name: str, pr_number: str, body: str):
        print(f"[API] Calling MCP to create comment for {repo_full_name} PR #{pr_number}")
        try:
            url = f"{self.base_url}/providers/{provider}/prs/comment"
            print(f"[API] MCP URL: {url}")
            response = requests.post(url, 
                                   json={"token": token, "repo_full_name": repo_full_name, "pr_number": pr_number, "body": body})
            print(f"[API] MCP Response Status: {response.status_code}")
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"[API] MCP Error: {e}")
            status_code = 502
            detail = f"Failed to create comment via MCP: {e}"
            if hasattr(e, 'response') and e.response:
                status_code = e.response.status_code
                try:
                    detail = e.response.json().get("error", detail)
                except:
                    pass
            raise HTTPException(status_code=status_code, detail=detail)

    def get_pr_details(self, provider: str, token: str, repo_full_name: str, pr_number: str):
        try:
            response = requests.post(f"{self.base_url}/providers/{provider}/prs/details", 
                                   json={"token": token, "repo_full_name": repo_full_name, "pr_number": pr_number})
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            status_code = 502
            detail = f"Failed to fetch PR details from MCP: {e}"
            if hasattr(e, 'response') and e.response:
                status_code = e.response.status_code
                try:
                    detail = e.response.json().get("error", detail)
                except:
                    pass
            # Don't raise, just log or return None since metadata is optional but nice to have
            print(f"[API] Warning: Could not fetch PR details: {detail}")
            return {}

    def create_review(self, provider: str, token: str, repo_full_name: str, pr_number: str, comments: list, body: str = None):
        print(f"[API] Calling MCP to create PR Review for {repo_full_name} PR #{pr_number}")
        try:
            url = f"{self.base_url}/providers/{provider}/prs/reviews"
            print(f"[API] MCP URL: {url}")
            response = requests.post(url, 
                                   json={
                                       "token": token, 
                                       "repo_full_name": repo_full_name, 
                                       "pr_number": pr_number, 
                                       "comments": comments,
                                       "body": body
                                   })
            print(f"[API] MCP Response Status: {response.status_code}")
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"[API] MCP Error: {e}")
            status_code = 502
            detail = f"Failed to create PR review via MCP: {e}"
            if hasattr(e, 'response') and e.response:
                status_code = e.response.status_code
                try:
                    detail = e.response.json().get("error", detail)
                except:
                    pass
            raise HTTPException(status_code=status_code, detail=detail)

mcp_client = MCPClient()
