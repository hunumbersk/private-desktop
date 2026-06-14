import "dotenv/config";

function required(name: string, optional = false): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production" && !optional) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appId: required("APP_ID", true),
  appSecret: required("APP_SECRET", true),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: required("KIMI_AUTH_URL", true),
  kimiOpenUrl: required("KIMI_OPEN_URL", true),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
};
