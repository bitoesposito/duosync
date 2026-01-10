/**
 * Environment variables with default values
 * The app always starts, even without .env file
 */
const isProduction = process.env.NODE_ENV === "production";

// Helper function to build EMAIL_SERVER from SMTP config
function buildEmailServer(): string {
  // If EMAIL_SERVER is set directly, use it
  if (process.env.EMAIL_SERVER) {
    return process.env.EMAIL_SERVER;
  }

  // In development, use Mailpit if SMTP config is not provided
  if (!isProduction && !process.env.SMTP_HOST) {
    return "smtp://mailpit:1025";
  }

  // Build EMAIL_SERVER from SMTP config
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = process.env.SMTP_PORT || "587";
    const user = encodeURIComponent(process.env.SMTP_USER);
    const pass = encodeURIComponent(process.env.SMTP_PASS);
    return `smtp://${user}:${pass}@${process.env.SMTP_HOST}:${port}`;
  }

  // No email server configured
  return "";
}

// Helper function to get EMAIL_FROM
function getEmailFrom(): string {
  return (
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    (isProduction ? "" : "noreply@localhost")
  );
}

const emailServer = buildEmailServer();
const emailFrom = getEmailFrom();

export const env = {
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/duosync?sslmode=disable",

  // Use a fixed secret in development, or require it in production
  NEXTAUTH_SECRET:
    process.env.NEXTAUTH_SECRET ||
    (isProduction
      ? undefined
      : "dev-secret-change-in-production-please-use-a-real-secret"),

  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",

  // Email configuration
  // In development, uses Mailpit automatically if SMTP config is not provided
  // Format: smtp://username:password@host:port
  EMAIL_SERVER: emailServer,
  EMAIL_FROM: emailFrom,

  // SMTP configuration (alternative to EMAIL_SERVER URL format)
  // These are used to build EMAIL_SERVER if EMAIL_SERVER is not set directly
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: process.env.SMTP_PORT || "587",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "",

  NODE_ENV: process.env.NODE_ENV || "development",

  WEBAUTHN_RP_ID: process.env.WEBAUTHN_RP_ID || "localhost",
} as const;

// Warnings in production
if (isProduction) {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error(
      "⚠️  ERROR: NEXTAUTH_SECRET must be set in production environment!"
    );
  }
  if (env.DATABASE_URL.includes("localhost")) {
    console.warn("⚠️  WARNING: Using default DATABASE_URL in production!");
  }
}

// Email server status messages
if (isProduction) {
  if (!env.EMAIL_SERVER) {
    console.warn("⚠️  WARNING: EMAIL_SERVER not set - Magic link disabled in production!");
  } else {
    console.info("ℹ️  Magic link enabled with SMTP server");
  }
}
