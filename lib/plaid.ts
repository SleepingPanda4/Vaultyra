import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const environment = process.env.PLAID_ENV ?? "sandbox";
const basePath = environment === "production" ? PlaidEnvironments.production : environment === "development" ? PlaidEnvironments.development : PlaidEnvironments.sandbox;

export function plaidConfigured() {
  return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET && process.env.DATA_ENCRYPTION_KEY);
}

export const plaid = new PlaidApi(new Configuration({
  basePath,
  baseOptions: { headers: { "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID, "PLAID-SECRET": process.env.PLAID_SECRET } },
}));
