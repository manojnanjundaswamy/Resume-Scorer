# ResumeScore AI — Spring Boot Backend

Production-grade Java 21 / Spring Boot 3.3 API powering the ResumeScore AI app.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Java 21, Spring Boot 3.3 |
| Database | PostgreSQL 16, Flyway migrations |
| ORM | Spring Data JPA + Hibernate |
| Security | Spring Security, JJWT 0.12, Google/Apple token verification |
| AI | Pluggable: Claude (Anthropic), Gemini, OpenAI, OpenRouter |
| File storage | AWS S3 (SDK v2) |
| HTTP client | OkHttp 4 |
| Build | Maven 3, Docker |

---

## Quick Start (Docker)

```bash
# 1. Copy env template and fill in your keys
cp .env.example .env

# 2. Start Postgres + API
docker compose up --build

# 3. API is live at http://localhost:8080
curl http://localhost:8080/api/health
```

---

## Quick Start (Local / IDE)

### Prerequisites
- Java 21 (e.g. Eclipse Temurin)
- Maven 3.9+
- PostgreSQL 16 running locally

### 1. Create database

```sql
CREATE DATABASE resumescorer;
CREATE USER resumescorer WITH PASSWORD 'resumescorer_dev';
GRANT ALL PRIVILEGES ON DATABASE resumescorer TO resumescorer;
```

### 2. Configure environment

Set these environment variables (or add them to your IDE run config):

```
DATABASE_URL=jdbc:postgresql://localhost:5432/resumescorer
DATABASE_USERNAME=resumescorer
DATABASE_PASSWORD=resumescorer_dev

ACTIVE_AI_PROVIDER=CLAUDE
ANTHROPIC_API_KEY=your-anthropic-api-key

JWT_SECRET=at_least_32_random_characters_here

GOOGLE_CLIENT_ID=your-google-oauth-client-id

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=resumescorer-uploads
```

### 3. Run

```bash
mvn spring-boot:run
```

Flyway runs migrations automatically on startup. The API is ready at `http://localhost:8080`.

---

## Switching AI Providers

Set `ACTIVE_AI_PROVIDER` to any of:

| Value | Provider | Required key |
|---|---|---|
| `CLAUDE` | Anthropic Claude | `ANTHROPIC_API_KEY` |
| `GEMINI` | Google Gemini | `GEMINI_API_KEY` |
| `OPENAI` | OpenAI | `OPENAI_API_KEY` |
| `OPENROUTER` | OpenRouter | `OPENROUTER_API_KEY` |

No other code changes needed — the factory wires the correct provider automatically.

---

## API Reference

### Auth

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/api/auth/google` | `{ "idToken": "..." }` | Sign in with Google |
| POST | `/api/auth/apple` | `{ "identityToken": "..." }` | Sign in with Apple |

Both return `{ "token": "<JWT>", "user": { ... } }`.

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | Bearer JWT | Get profile + credit balance |

### Analysis

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/api/analyze` | Bearer JWT | multipart: `file` (PDF/DOCX), optional `jobDescription` | Run 3-pass AI analysis |
| GET | `/api/results/{id}` | Bearer JWT | — | Fetch a single analysis |
| GET | `/api/history` | Bearer JWT | — | List user's past analyses |
| POST | `/api/credits/topup` | Bearer JWT | `{ "amount": 5 }` | Add credits (post-payment hook) |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Unauthenticated liveness check |
| GET | `/actuator/health` | Spring Actuator health |

---

## Project Structure

```
src/main/java/com/resumescorer/
├── config/              # SecurityConfig, AwsConfig
├── controller/          # REST controllers
├── exception/           # Custom exceptions + GlobalExceptionHandler
├── model/
│   ├── dto/             # AnalysisResult (response POJO)
│   └── entity/          # JPA entities (User, Resume, Analysis, CreditTransaction)
├── repository/          # Spring Data JPA interfaces
├── security/            # JWT filter/provider, Google/Apple verifiers, @CurrentUser
└── service/
    ├── ai/
    │   ├── pipeline/    # AnalysisPipeline (3-pass orchestration)
    │   └── providers/   # Claude, Gemini, OpenAI, OpenRouter implementations
    ├── storage/         # S3 upload/delete
    ├── AnalysisService  # Main orchestration service
    ├── CreditService    # Credit grant/deduct/topup
    └── ResumeParserService  # PDF/DOCX text extraction

src/main/resources/
├── application.properties
└── db/migration/        # Flyway SQL migrations (V1–V4)
```

---

## Deployment

### Railway (Phase 1 — simplest)

1. Push to GitHub
2. Create Railway project → Deploy from GitHub
3. Add PostgreSQL plugin
4. Set environment variables in Railway dashboard
5. Railway auto-builds the Docker image and deploys

### AWS ECS (Phase 2)

1. Push image to ECR: `docker build -t resumescorer-api . && docker push`
2. Create ECS task definition with the image + env vars
3. Set up Application Load Balancer → ECS service
4. Use RDS PostgreSQL for the database
5. S3 bucket with IAM role attached to ECS task (no static keys needed)

See the Notion planner for the full deployment runbook.
