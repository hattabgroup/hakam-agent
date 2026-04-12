import os
import requests
from fastapi import HTTPException

GITLAB_CLIENT_ID = os.getenv("GITLAB_CLIENT_ID")
GITLAB_CLIENT_SECRET = os.getenv("GITLAB_CLIENT_SECRET")
GITLAB_REDIRECT_URI = os.getenv("GITLAB_REDIRECT_URI")

def get_authorize_url():
    if not GITLAB_CLIENT_ID or not GITLAB_REDIRECT_URI:
        raise HTTPException(status_code=500, detail="GitLab OAuth credentials not configured")
    
    return f"https://gitlab.com/oauth/authorize?client_id={GITLAB_CLIENT_ID}&redirect_uri={GITLAB_REDIRECT_URI}&response_type=code&scope=api"

def exchange_code_for_token(code: str):
    if not GITLAB_CLIENT_ID or not GITLAB_CLIENT_SECRET or not GITLAB_REDIRECT_URI:
        raise HTTPException(status_code=500, detail="GitLab OAuth credentials not configured")

    url = "https://gitlab.com/oauth/token"
    payload = {
        "client_id": GITLAB_CLIENT_ID,
        "client_secret": GITLAB_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": GITLAB_REDIRECT_URI
    }

    response = requests.post(url, data=payload)
    if response.status_code != 200:
        print(f"Failed to exchange GitLab code: {response.text}")
        raise HTTPException(status_code=response.status_code, detail="Failed to authenticate with GitLab")

    return response.json().get("access_token")
