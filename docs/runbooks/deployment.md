# Deployment Runbook

Deployment is intentionally deferred until cleanup has passed verification.

Before connecting a public host, confirm the app builds successfully, required environment variables are known, retired routes return `410 Gone`, removed APIs return `404`, and no public navigation exposes backend links.

## Required production security configuration

- Set `APP_URL` to the single canonical HTTPS origin. Password and activation links use this value, and state-changing browser requests are accepted only from this origin or an explicitly configured `TRUSTED_ORIGINS` entry.
- Set a strong, unique `SESSION_SECRET` and rotate any development or previously exposed value.
- Production database connections always verify TLS certificates. Set `DATABASE_SSL_CA` when the database uses a private certificate authority. If a private provider's certificate identity intentionally differs from its connection hostname, set `DATABASE_SSL_EXPECTED_NAME` to the certificate's verified DNS identity; Railway's current private PostgreSQL certificate uses `localhost`. `DATABASE_SSL_REJECT_UNAUTHORIZED=false` is intentionally rejected in production.
- Backups default to `.private/system-backups`, outside the public uploads tree. Set `BACKUP_STORAGE_DIR` to a durable private volume when needed; the server refuses any path under `uploads`.
- Apply startup migrations before accepting traffic. Migration `0026_security_session_version.sql` revokes all pre-deployment JWTs by requiring a current session version.

After the first hardened deployment, verify that `/uploads/system-backups/<any-key>` returns `404`, confirm legacy backup files have moved to private storage, and test login, suspension, password change, password reset, and administrator activation in the deployed environment.
