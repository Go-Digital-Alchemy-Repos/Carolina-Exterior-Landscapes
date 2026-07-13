# Operations

The retained operational surface covers health checks, readiness checks, application metrics, logging, media storage, email delivery, and backups.

Logger categories are `http`, `email`, `backup`, `auth`, `app`, `db`, `cms`, and `metrics`.

Public retired URLs are served as `410 Gone` by the server before the app-shell fallback. Removed retired API modules should return normal `404` responses.
