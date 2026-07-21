import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { pool } from "./database";

export const auth = betterAuth({
  appName: "Vaultyra",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: pool,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
  },
  session: {
    expiresIn: 60 * 60 * 12,
    updateAge: 60 * 60,
  },
  advanced: {
    useSecureCookies: process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
  plugins: [
    twoFactor({
      issuer: "Vaultyra",
      backupCodeOptions: { amount: 10, length: 12 },
    }),
  ],
});
