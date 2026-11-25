# VaultEdge — Environment Variables Reference

> **Purpose**: This guide documents every required environment variable for **VaultEdge**, distinguishes developer-provided credentials from locally generated cryptographic secrets and safe development defaults, and provides exact local commands to generate secrets securely.

---

## 1. Environment Variable Classification Summary

| Variable Name | Category | Required | Server / Client | Description |
| :--- | :--- | :---: | :---: | :--- |
| **`DATABASE_URL`** | **Developer Must Provide** | Yes | Server-Only | PostgreSQL connection string for Prisma ORM (`vaultedge` database on `localhost:5432`). |
| **`JWT_ACCESS_SECRET`** | **Generated Locally** | Yes | Server-Only | 256-bit+ cryptographic secret key used to sign and verify short-lived JWT access tokens. |
| **`JWT_REFRESH_SECRET`** | **Generated Locally** | Yes | Server-Only | Distinct 256-bit+ cryptographic secret key used to sign and verify long-lived JWT refresh tokens. |
| **`JWT_ACCESS_EXPIRES_IN`** | **Safe Development Default** | Yes | Server-Only | Access token lifetime duration (default: `"15m"`). |
| **`JWT_REFRESH_EXPIRES_IN`** | **Safe Development Default** | Yes | Server-Only | Refresh token lifetime duration (default: `"7d"`). |
| **`APP_URL`** | **Safe Development Default** | Yes | Server & API | Canonical base URL of the running VaultEdge application (default: `"http://localhost:3000"`). |
| **`NODE_ENV`** | **Safe Development Default** | Yes | Server & Client | Node.js execution mode (`"development"`, `"test"`, or `"production"`). |

> **Security Note**: None of these variables use the `NEXT_PUBLIC_` prefix. All database credentials and JWT secrets remain strictly isolated to the Node.js server runtime and are never bundled into client JavaScript.

---

## 2. Detailed Variable Specifications

### 2.1 Values the Developer Must Provide

#### `DATABASE_URL`
- **Purpose**: Connects Prisma ORM to your local or hosted PostgreSQL instance.
- **Target Database Parameters**:
  - **Engine**: PostgreSQL
  - **Host**: `localhost`
  - **Port**: `5432`
  - **Username**: `postgres`
  - **Database Name**: `vaultedge`
  - **Schema**: `public`
- **Template Format**:
  ```env
  DATABASE_URL="postgresql://postgres:<YOUR_LOCAL_PASSWORD>@localhost:5432/vaultedge?schema=public"
  ```
- **Where to Obtain**:
  - Replace `<YOUR_LOCAL_PASSWORD>` with the password configured for your local `postgres` superuser (or dedicated database user) in your local PostgreSQL installation (pgAdmin / psql).
  - If your password contains special URL characters (such as `@`, `#`, `:`, `/`, `%`), URL-encode them in the connection string.

---

### 2.2 Values Generated Locally (Cryptographic Secrets)

#### `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`
- **Purpose**:
  - `JWT_ACCESS_SECRET` signs short-lived access tokens carrying `{ userId, role, status }`.
  - `JWT_REFRESH_SECRET` signs long-lived refresh tokens stored in `HttpOnly` cookies and tracked via hashed entries in the `RefreshToken` table.
- **Security Requirement**:
  - Both secrets **must** be high-entropy random strings (at least 32–64 bytes) and **must be different from each other**.
  - Never commit generated values to Git, `.env.example`, or documentation.
- **How to Generate Locally**:
  Run either of the following commands in your terminal twice (once for `JWT_ACCESS_SECRET`, once for `JWT_REFRESH_SECRET`) and paste the output directly into your local `.env` file:

  **Option A — Using Node.js (Cross-Platform, Recommended):**
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

  **Option B — Using OpenSSL:**
  ```bash
  openssl rand -hex 64
  ```

---

### 2.3 Values with Safe Development Defaults

#### `JWT_ACCESS_EXPIRES_IN`
- **Default Value**: `"15m"` (15 minutes)
- **Purpose**: Keeps access tokens short-lived so role or account status changes take effect rapidly.

#### `JWT_REFRESH_EXPIRES_IN`
- **Default Value**: `"7d"` (7 days)
- **Purpose**: Controls how long a session remains valid before requiring re-authentication, subject to immediate server-side revocation in the `RefreshToken` table.

#### `APP_URL`
- **Default Value**: `"http://localhost:3000"`
- **Purpose**: Used by server Route Handlers for origin validation, cookie domain/security rules, and receipt/statement metadata in development. Update to your production domain when deploying to Vercel or Netlify.

#### `NODE_ENV`
- **Default Value**: `"development"`
- **Purpose**: Controls Prisma client singleton caching, secure cookie flags (`Secure` enabled automatically in `"production"`), and error verbosity.

---

## 3. Local `.env` Setup Workflow (For Phase 5)
1. Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```
2. Replace `<YOUR_LOCAL_PASSWORD>` in `DATABASE_URL` with your local PostgreSQL password.
3. Run the Node.js crypto command twice to generate unique values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
4. Verify that `.env` is ignored by Git (`git status` should list `.env.example` as tracked and never list `.env`).
