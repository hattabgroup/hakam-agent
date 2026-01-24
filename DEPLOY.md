# Hakam Deployment Guide

This project is configured for two distinct environments: **Development** and **Production**.

## 1. Development (Local)
Use this mode for active development. Features:
- Hot Module Replacement (HMR) active.
- Source code mounted into containers (changes reflect immediately).
- Running on default ports (Frontend: 3000, API: 8000).

**Command:**
```bash
# Run from repository root
cd infra
docker-compose up
```

---

## 2. Production (Server)
Use this mode for live deployment. Features:
- **NGINX** acts as the ingress (Port 80).
- **HMR Disabled** (prevents WebSocket errors and reloading).
- **Optimized Builds** (`npm start` instead of `npm run dev`).
- **No Source Mounts** (uses the built Docker image artifacts).
- `restart: always` policy enabled.

**Command:**
```bash
# Run from repository root
cd infra
docker-compose -f docker-compose.prod.yml up --build -d
```
*Note: The `--build` flag ensures the latest code is compiled into the images.*

### Key Differences
| Feature | Development | Production |
| :--- | :--- | :--- |
| **Config File** | `docker-compose.yml` | `docker-compose.prod.yml` |
| **Frontend** | `npm run dev` | `npm start` |
| **Reverse Proxy** | None (direct port access) | NGINX (Port 80) |
| **Source Code** | Mounted (Editable) | Isolated (Immutable) |
| **Restart Policy**| No | Always |

### Troubleshooting Production
If you need to restart NGINX or check logs:
```bash
# Restart NGINX
docker-compose -f docker-compose.prod.yml restart nginx

# Check Logs
docker logs hakam-router
docker logs hakam-frontend
```
