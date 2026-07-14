# Deployment Runbook

Deployment is intentionally deferred until cleanup has passed verification.

Before connecting a public host, confirm the app builds successfully, required environment variables are known, retired routes return `410 Gone`, removed APIs return `404`, and no public navigation exposes backend links.
