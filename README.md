# Coldyy

A full-stack authentication platform with a complete DevOps pipeline — containerized with Docker, deployed on AWS EKS via Terraform, and managed with GitOps using ArgoCD.

---

## What It Does

Coldyy is a production-ready auth service providing:

- User registration with email OTP verification
- Secure login with 2FA OTP via email
- JWT access + refresh token sessions
- Forgot password / reset password flow
- Change password for authenticated users
- Session management and token revocation
- Prometheus metrics endpoint at `/metrics`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub                                   │
│                                                                  │
│  push to main                                                    │
│       ↓                                                          │
│  GitHub Actions CI                                               │
│  ├── build frontend image  ──→  DockerHub                        │
│  ├── build backend image   ──→  DockerHub                        │
│  └── update image tags in ops/k8s/ → commit back to main        │
└──────────────────────┬──────────────────────────────────────────┘
                       │ ArgoCD polls
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                          AWS                                     │
│                                                                  │
│  VPC (10.0.0.0/16)                                               │
│  ├── subnet us-east-1a                                           │
│  ├── subnet us-east-1b                                           │
│  └── subnet us-east-1c                                           │
│           │                                                      │
│  EKS Cluster (coldyy)                                            │
│  │                                                               │
│  ├── Namespace: argocd                                           │
│  │   └── ArgoCD  ──watches──▶ ops/k8s/ in GitHub                │
│  │                                                               │
│  └── Namespace: coldyy                                           │
│      │                                                           │
│      ├── ALB Ingress (public)                                    │
│      │   ├── /api  ──▶ backend:8000                              │
│      │   └── /     ──▶ frontend:80                               │
│      │                                                           │
│      ├── frontend  (nginx, pods: 2-4, HPA)                       │
│      ├── backend   (FastAPI, pods: 2-6, HPA)                     │
│      └── db        (PostgreSQL, pod: 1, PVC: 5Gi)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router |
| Backend | FastAPI, Prisma (Python client), bcrypt, PyJWT |
| Database | PostgreSQL 15 |
| Email | Gmail SMTP via aiosmtplib |
| Containerization | Docker, Docker Compose |
| CI Pipeline | GitHub Actions |
| Image Registry | DockerHub |
| Infrastructure | Terraform (AWS VPC, EKS) |
| GitOps | ArgoCD |
| Orchestration | Kubernetes (AWS EKS) |
| Autoscaling | Kubernetes HPA |
| Ingress | AWS Load Balancer Controller (ALB) |
| Monitoring | Prometheus (FastAPI Instrumentator) |

---

## Project Structure

```
coldyy/
├── frontend/                   # React + Vite app
│   ├── src/
│   │   ├── pages/              # Register, Login, OTP, Reset flows
│   │   ├── api.js              # All API calls to backend
│   │   └── App.jsx             # Routes + auth guards
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                    # FastAPI app
│   ├── main.py                 # All API routes
│   ├── models.py               # Pydantic request models
│   ├── email_utils.py          # SMTP email sender
│   ├── prisma/
│   │   └── schema.prisma       # DB schema (User, Session, VerificationToken)
│   ├── entrypoint.sh           # prisma db push + uvicorn start
│   └── Dockerfile
│
├── docker-compose.yml          # Local development
│
└── ops/
    ├── infra/                  # Terraform
    │   └── modules/
    │       ├── vpc/            # VPC, subnets, IGW, route tables
    │       ├── eks/            # EKS cluster, node group, IAM, security groups
    │       └── argocd/         # ArgoCD + AWS Load Balancer Controller via Helm
    │
    ├── k8s/                    # Kubernetes manifests
    │   ├── namespace.yml
    │   ├── secrets.yml         # DB URL, JWT secret, SMTP password
    │   ├── config.yml          # SMTP config, API URL
    │   ├── pvc.yml             # 5Gi postgres volume
    │   ├── db.yml              # Postgres deployment + service
    │   ├── backend.yml         # FastAPI deployment + service
    │   ├── frontend.yml        # nginx deployment + service
    │   ├── ingress.yml         # ALB ingress (HTTP + HTTPS)
    │   └── hpa.yml             # Autoscaling for frontend + backend
    │
    └── argocd/
        └── application.yml     # ArgoCD Application pointing to ops/k8s/
```

---

## Database Schema

```
User
├── userid          (PK, autoincrement)
├── firstname
├── lastname
├── email           (unique)
├── passwordhash
├── isEmailVerified
├── createdAt
├── updatedAt
├── sessions[]      → Session
└── tokens[]        → VerificationToken

Session
├── sessionid
├── userid          → User
├── token           (unique JWT)
├── createdAt
└── expiresAt

VerificationToken
├── tokenid
├── userid          → User
├── token           (unique OTP)
├── createdAt
└── expiresAt
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/register` | Register + send verification OTP |
| POST | `/verify-account` | Verify email with OTP |
| POST | `/resend-verification` | Resend verification OTP |
| POST | `/login` | Login + send 2FA OTP |
| POST | `/verify-login-otp` | Verify 2FA OTP → returns JWT tokens |
| POST | `/forgot-password` | Send password reset OTP |
| POST | `/verify-reset-otp` | Verify reset OTP |
| POST | `/reset-password` | Set new password |
| POST | `/change-password` | Change password (authenticated) |
| POST | `/refresh-token` | Refresh access token |
| POST | `/logout` | Invalidate session |
| POST | `/revoke-token` | Revoke specific token |
| GET | `/sessions` | List active sessions |
| GET | `/metrics` | Prometheus metrics |

---

## Running Locally

**Prerequisites:** Docker Desktop

```bash
# Clone
git clone https://github.com/shahryar908/coldyy.git
cd coldyy

# Copy and fill in backend env
cp backend/.env.example backend/.env

# Start everything
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Metrics | http://localhost:8000/metrics |

---

## Deploying to AWS

### Prerequisites
- AWS CLI configured (`aws configure`)
- Terraform >= 1.4
- kubectl
- Helm

### 1. Create `ops/infra/terraform.tfvars`

```hcl
aws_region           = "us-east-1"
cluster_name         = "coldyy"
cluster_version      = "1.29"
vpc_cidr_block       = "10.0.0.0/16"
subnet_cidr_blocks   = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
argocd_chart_version = "6.7.3"
```

### 2. Apply Terraform

```bash
cd ops/infra
terraform init
terraform plan
terraform apply     # takes ~15-20 mins
```

### 3. Connect kubectl

```bash
aws eks update-kubeconfig --region us-east-1 --name coldyy
kubectl get nodes   # 2 nodes in Ready state
```

### 4. Apply ArgoCD Application

```bash
kubectl apply -f ops/argocd/application.yml
```

ArgoCD syncs `ops/k8s/` automatically and deploys all manifests.

### 5. Get the public URL

```bash
kubectl get ingress -n coldyy
# Copy EXTERNAL-IP — this is your ALB DNS name
```

### 6. Access ArgoCD UI

```bash
# Get the URL
kubectl get svc -n argocd argocd-server

# Get the admin password
kubectl get secret -n argocd argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Login: admin / <password above>
```

---

## CI/CD Flow

```
git push to main
      ↓
GitHub Actions
      ├── builds coldyy-backend:sha  → DockerHub
      ├── builds coldyy-frontend:sha → DockerHub
      └── updates image tags in ops/k8s/backend.yml
                               and ops/k8s/frontend.yml
                               → commits back to main
                                       ↓
                              ArgoCD detects new commit
                                       ↓
                              kubectl applies updated manifests
                                       ↓
                              rolling update on EKS (zero downtime)
```

### GitHub Secrets Required

Go to **Settings → Secrets → Actions** and add:

| Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Your DockerHub username |
| `DOCKERHUB_TOKEN` | DockerHub access token (not password) |
| `VITE_API_URL` | Backend public URL e.g. `https://api.coldyy.com` |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret — change in production |
| `SMTP_HOST` | SMTP server e.g. `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port e.g. `587` |
| `SMTP_USER` | Gmail address |
| `SMTP_PASS` | Gmail App Password |
| `FROM_NAME` | Display name for emails |

---

## Roadmap

- [ ] HTTPS — add ACM certificate ARN to `ops/k8s/ingress.yml`
- [ ] Terraform remote state — S3 backend + DynamoDB lock table
- [ ] Prometheus + Grafana — metrics dashboards
- [ ] Centralized logging — Loki or CloudWatch
- [ ] Network policies — restrict pod-to-pod traffic
- [ ] Secrets manager — move secrets out of Git into AWS Secrets Manager
- [ ] Staging environment — separate namespace with manual promotion to prod
