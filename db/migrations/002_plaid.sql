CREATE TABLE IF NOT EXISTS plaid_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  item_id text NOT NULL UNIQUE,
  access_token_encrypted text NOT NULL,
  institution_name text NOT NULL,
  cursor text,
  status text NOT NULL DEFAULT 'active',
  error_code text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plaid_items_user_idx ON plaid_items(user_id);

ALTER TABLE financial_accounts ADD COLUMN IF NOT EXISTS plaid_item_id uuid REFERENCES plaid_items(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS financial_accounts_plaid_item_idx ON financial_accounts(plaid_item_id);
