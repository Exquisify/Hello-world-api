const getAllowedOrigins = (): string[] => {
  const env = process.env.NODE_ENV;
  if (env === "production") {
    return (process.env.CORS_ALLOWED_ORIGINS_PROD || "").split(",").map(o => o.trim());
  }
  if (env === "staging") {
    return (process.env.CORS_ALLOWED_ORIGINS_STAGING || "").split(",").map(o => o.trim());
  }
  // Default to dev
  return (process.env.CORS_ALLOWED_ORIGINS_DEV || "http://localhost:3000").split(",").map(o => o.trim());
};

export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return false;
  const allowed = getAllowedOrigins();
  return allowed.includes(origin);
};

export const buildCORSHeaders = (origin: string | undefined) => {
  if (!origin || !isOriginAllowed(origin)) {
    return {
      "Access-Control-Allow-Origin": "null",
      "Vary": "Origin",
    };
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Vary": "Origin",
  };
};