CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "image" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "twoFactorEnabled" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "session_user_idx" ON "session"("userId");

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "account_user_idx" ON "account"("userId");

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "twoFactor" (
  "id" text PRIMARY KEY,
  "secret" text NOT NULL,
  "backupCodes" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "verified" boolean NOT NULL DEFAULT false,
  "failedVerificationCount" integer NOT NULL DEFAULT 0,
  "lockedUntil" timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS "two_factor_user_idx" ON "twoFactor"("userId");

CREATE TABLE IF NOT EXISTS financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  name text NOT NULL,
  institution text NOT NULL DEFAULT 'Manual',
  account_type text NOT NULL,
  balance_cents bigint NOT NULL DEFAULT 0,
  currency char(3) NOT NULL DEFAULT 'USD',
  color text NOT NULL DEFAULT '#48e6bd',
  provider text NOT NULL DEFAULT 'manual',
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider, external_id)
);
CREATE INDEX IF NOT EXISTS financial_accounts_user_idx ON financial_accounts(user_id);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  occurred_on date NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'Uncategorized',
  amount_cents bigint NOT NULL,
  external_id text,
  import_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, account_id, external_id)
);
CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON transactions(user_id, occurred_on DESC);
CREATE UNIQUE INDEX IF NOT EXISTS transactions_import_hash_idx ON transactions(user_id, account_id, import_hash) WHERE import_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS forecast_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  name text NOT NULL,
  monthly_income_cents bigint NOT NULL DEFAULT 0,
  monthly_expenses_cents bigint NOT NULL DEFAULT 0,
  annual_return_bps integer NOT NULL DEFAULT 500,
  months integer NOT NULL DEFAULT 12 CHECK (months BETWEEN 1 AND 600),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id bigserial PRIMARY KEY,
  user_id text REFERENCES "user"("id") ON DELETE SET NULL,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
