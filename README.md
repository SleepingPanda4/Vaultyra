# Vaultyra

Vaultyra is a private, self-hosted financial command center. This first product slice includes a responsive dashboard, account management, manual balances, spreadsheet intake, historical and user-driven forecasts, and security UX.

## Run with Docker

```bash
docker compose up --build
```

Open `http://localhost:3000`.

## Product boundary

The current build is a polished interactive prototype. Before storing real financial data, add a server-side database, audited authentication, mandatory WebAuthn/TOTP 2FA, encrypted provider credentials, CSRF protection, rate limiting, backups, and provider-specific read-only OAuth/API integrations. Never expose Fidelity, Coinbase, Pionex, or bank secrets in browser code.

## Recommended implementation sequence

1. PostgreSQL plus tenant-scoped data models and encrypted fields.
2. OIDC authentication, passkeys/TOTP, recovery codes, and session revocation.
3. CSV/XLSX mapping and idempotent transaction imports.
4. Bank aggregation through an approved provider; read-only Coinbase, Fidelity-supported, and Pionex adapters.
5. Background sync jobs, audit events, backups, and restore drills.
6. Package the same API and UI as a signed desktop application.
