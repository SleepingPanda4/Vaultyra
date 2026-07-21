# Vaultyra

Vaultyra is a private, self-hosted financial command center. This first product slice includes a responsive dashboard, account management, manual balances, spreadsheet intake, historical and user-driven forecasts, and security UX.

## Run with Docker

```bash
docker compose up --build
```

Open `http://localhost:12450`.

## Install inside a Debian or Ubuntu LXC

Vaultyra listens on TCP port `12450`. The following assumes the LXC has working networking and Docker-compatible nesting enabled by its host administrator.

### 1. Prepare the LXC host settings

For a Proxmox LXC, shut down the container, open **Options → Features**, and enable **Nesting** and **Keyctl**. Start the LXC again. Prefer an unprivileged LXC and do not expose Docker's management socket to the internet.

### 2. Install Docker in the LXC

Run these commands inside a Debian LXC as `root` or with `sudo`:

```bash
apt update
apt install -y ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

cat >/etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
docker run --rm hello-world
```

For Ubuntu, use Docker's Ubuntu repository instructions instead of substituting the Debian repository.

### 3. Download and start Vaultyra

```bash
mkdir -p /opt/vaultyra
git clone https://github.com/SleepingPanda4/Vaultyra.git /opt/vaultyra
cd /opt/vaultyra
docker compose up -d --build
docker compose ps
```

Open `http://LXC-IP-ADDRESS:12450`. Allow TCP port `12450` through the Proxmox, LXC, and network firewalls only for the networks that should reach Vaultyra.

### 4. Update or inspect the service

```bash
cd /opt/vaultyra
git pull --ff-only
docker compose up -d --build
docker compose logs -f --tail=100
```

For internet access, place Vaultyra behind a trusted HTTPS reverse proxy and do not expose port `12450` directly.

## Product boundary

The current build is a polished interactive prototype. Before storing real financial data, add a server-side database, audited authentication, mandatory WebAuthn/TOTP 2FA, encrypted provider credentials, CSRF protection, rate limiting, backups, and provider-specific read-only OAuth/API integrations. Never expose Fidelity, Coinbase, Pionex, or bank secrets in browser code.

## Recommended implementation sequence

1. PostgreSQL plus tenant-scoped data models and encrypted fields.
2. OIDC authentication, passkeys/TOTP, recovery codes, and session revocation.
3. CSV/XLSX mapping and idempotent transaction imports.
4. Bank aggregation through an approved provider; read-only Coinbase, Fidelity-supported, and Pionex adapters.
5. Background sync jobs, audit events, backups, and restore drills.
6. Package the same API and UI as a signed desktop application.
