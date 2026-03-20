import os
import time
import jwt
import requests
from fastapi import HTTPException

# Load environment variables
GITHUB_APP_ID = os.getenv("GITHUB_APP_ID")
GITHUB_APP_PRIVATE_KEY = os.getenv("GITHUB_APP_PRIVATE_KEY")

def get_jwt():
    """
    Generates a JWT for the GitHub App.
    """
    if not GITHUB_APP_ID or not GITHUB_APP_PRIVATE_KEY:
        raise HTTPException(status_code=500, detail="GitHub App credentials not configured")

    payload = {
        # Issued at time
        "iat": int(time.time()),
        # JWT expiration time (10 minutes maximum)
        "exp": int(time.time()) + 600,
        # GitHub App's identifier
        "iss": GITHUB_APP_ID
    }

    # Encode the JWT with the private key
    encoded_jwt = jwt.encode(payload, GITHUB_APP_PRIVATE_KEY, algorithm="RS256")
    return encoded_jwt

def get_installation_token(installation_id: str):
    """
    Exchanges the JWT for an installation access token.
    """
    jwt_token = get_jwt()
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    url = f"https://api.github.com/app/installations/{installation_id}/access_tokens"
    response = requests.post(url, headers=headers)

    if response.status_code != 201:
         print(f"Failed to get installation token: {response.text}")
         raise HTTPException(status_code=response.status_code, detail="Failed to authenticate with GitHub App")

    return response.json().get("token")

def validate_installation(installation_id: str):
    """
    Validates if the installation ID is valid and accessible by the App.
    """
    try:
        token = get_installation_token(installation_id)
        return True, token
    except Exception as e:
        return False, str(e)
