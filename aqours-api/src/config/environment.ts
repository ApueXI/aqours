import path from "node:path";
export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL,
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  production: process.env.NODE_ENV === "production",
  sessionDays: Number(process.env.SESSION_DAYS ?? 7),
  geocodeKey: process.env.GEOAPIFY_API_KEY,
  geocodeSecret: process.env.GEOCODE_SIGNING_SECRET,
  geocodeBias: process.env.GEOAPIFY_BIAS ?? "countrycode:ph",
  geocodeFilter: process.env.GEOAPIFY_FILTER ?? "countrycode:ph",
  geocodeTimeoutMs: Number(process.env.GEOAPIFY_TIMEOUT_MS ?? 5000),
  attachmentDir: path.resolve(
    process.env.ATTACHMENT_DIR ??
      path.resolve(import.meta.dirname, "../../storage/attachments"),
  ),
  projectRoot: path.resolve(import.meta.dirname, "../../.."),
};
if (config.production && !config.webOrigin.startsWith("https://"))
  throw new Error("Production WEB_ORIGIN must use HTTPS");
if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)
  throw new Error("Invalid PORT");
if (
  !Number.isFinite(config.sessionDays) ||
  config.sessionDays <= 0 ||
  config.sessionDays > 30
)
  throw new Error("Invalid SESSION_DAYS");
if (
  !Number.isInteger(config.geocodeTimeoutMs) ||
  config.geocodeTimeoutMs < 100 ||
  config.geocodeTimeoutMs > 30000
)
  throw new Error("Invalid GEOAPIFY_TIMEOUT_MS");

if (!config.attachmentDir.startsWith(config.projectRoot + path.sep))
  throw new Error("ATTACHMENT_DIR must be inside the project");
