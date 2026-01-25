# Cloudflare Origin Certificate Setup

To enable **Full (Strict)** SSL mode in Cloudflare, you must install a Cloudflare Origin Certificate on your server.

1.  Go to the **Cloudflare Dashboard** > **SSL/TLS** > **Origin Server**.
2.  Click **Create Certificate**.
3.  Keep the defaults (RSA 2048, likely) and click **Create**.
4.  You will see two text blocks:
    *   **Origin Certificate**: Copy this content and paste it into a file named `cert.pem` in this directory.
    *   **Private Key**: Copy this content and paste it into a file named `key.pem` in this directory.

## File Structure

The `infra/certs` directory should look like this:

```
infra/certs/
├── cert.pem  <-- Paste Certificate Here
├── key.pem   <-- Paste Private Key Here
└── README.md <-- This file
```

## Security Note
Do **NOT** commit `cert.pem` or `key.pem` to your git repository. They are private secrets.
Add `infra/certs/*.pem` to your `.gitignore` immediately.
