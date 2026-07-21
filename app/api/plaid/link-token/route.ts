import { CountryCode, Products } from "plaid";
import { NextResponse } from "next/server";
import { requireUser } from "../../../../lib/session";
import { plaid, plaidConfigured } from "../../../../lib/plaid";

export async function POST() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!plaidConfigured()) return NextResponse.json({ error: "Bank connections are not configured by the server administrator." }, { status: 503 });
  const webhook = process.env.PLAID_WEBHOOK_URL;
  const redirectUri = process.env.PLAID_REDIRECT_URI;
  const customization = process.env.PLAID_LINK_CUSTOMIZATION;
  const response = await plaid.linkTokenCreate({
    user: { client_user_id: user.id }, client_name: "Vaultyra", language: "en",
    products: [Products.Transactions], country_codes: [CountryCode.Us],
    transactions: { days_requested: 730 }, ...(webhook ? { webhook } : {}),
    ...(redirectUri ? { redirect_uri: redirectUri } : {}),
    ...(customization ? { link_customization_name: customization } : {}),
  });
  return NextResponse.json({ linkToken: response.data.link_token });
}
