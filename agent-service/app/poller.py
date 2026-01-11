import time
import requests
import os
from .evaluator import evaluate_diff

API_URL = os.getenv("API_URL", "http://api-service:8000")
INTERNAL_SECRET = os.getenv("INTERNAL_WORKER_SECRET", "internal_secret_for_agent_worker")

def fetch_diff(provider, token, repo_full_name, pr_number):
    # Agent calls API service to get diff (Or MCP directly? Plan says via API usually, but let's stick to API handling it or Agent calling MCP directly if needed. 
    # Plan prompt: "api-service fetches diff via mcp-service OR agent calls api-service endpoint to get diff"
    # Actually, let's have the agent call MCP directly for simplicity if it has the token, 
    # OR better: agent asks MCP. But wait, Agent doesn't have MCP URL in env by default in my docker-compose.
    # Let's check docker-compose. agent-service depends on api-service.
    # Actually, the internal claim returns the token. So Agent can call MCP if it knows MCP URL.
    # But simpler: API service proxy?
    # Let's assume Agent calls MCP directly. I need to add MCP_URL to Agent env.
    pass

# For Phase 2, let's make API service fetch the diff? 
# The claim response has `token`.
# Let's assume Agent calls MCP. I will add MCP_URL to agent env in docker-compose later if missed.
# For now, I'll implement a helper to call MCP.

MCP_URL = "http://mcp-service:8000" # Hardcoded internal docker DNS

def run_worker():
    print("Starting Agent Worker...")
    while True:
        try:
            # 1. Claim
            response = requests.post(f"{API_URL}/internal/reviews/claim", headers={"X-Internal-Secret": INTERNAL_SECRET})
            data = response.json()
            
            if data.get("status") == "job_claimed":
                job = data["job"]
                print(f"Claimed job: {job['review_id']}")
                
                try:
                    # 2. Fetch Diff (Directly from MCP for now, using the token we got)
                    diff_response = requests.post(f"{MCP_URL}/providers/{job['provider']}/prs/diff", json={
                        "token": job["token"],
                        "repo_full_name": job["repo_full_name"],
                        "pr_number": job["pr_number"]
                    })
                    diff_response.raise_for_status()
                    diff_data = diff_response.json()
                    diff_content = diff_data.get("diff") or "" # Raw diff string

                    # 3. Evaluate
                    policies = job["policies"]
                    violations = evaluate_diff(diff_content, policies)
                    
                    # 4. Submit
                    result = {
                        "status": "done",
                        "summary": f"Analyzed PR. Found {len(violations)} potential issues.",
                        "violations": violations
                    }
                    requests.post(f"{API_URL}/internal/reviews/{job['review_id']}/result", 
                                  json=result,
                                  headers={"X-Internal-Secret": INTERNAL_SECRET})
                    print(f"Submitted result for job {job['review_id']}")
                    
                except Exception as e:
                    print(f"Error processing job {job['review_id']}: {e}")
                    # Submit failed
                    requests.post(f"{API_URL}/internal/reviews/{job['review_id']}/result", 
                                  json={"status": "failed", "summary": str(e), "violations": []},
                                  headers={"X-Internal-Secret": INTERNAL_SECRET})
            
            else:
                # No job, sleep
                time.sleep(5)
                
        except Exception as e:
            print(f"Worker Loop Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    run_worker()
