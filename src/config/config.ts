// Default Google user
const defaultGoogleUser = {
  sub: "1234567890123456789012",
  email: "test@example.com",
  email_verified: true,
  name: "Yamada Taro",
  given_name: "Taro",
  family_name: "Yamada",
  picture: "https://example.com/image.png",
  locale: "ja",
};

// Default LINE user
const defaultLineUser = {
  userId: "U12345678901234567890123456789012",
  displayName: "Yamada Taro",
  pictureUrl: "https://example.com/image.png",
  statusMessage: "Hello, LINE!",
};

// Load custom Google user if available, otherwise use default
let googleUser = defaultGoogleUser;
try {
  const customGoogleUser = require("../../google.json");
  googleUser = { ...defaultGoogleUser, ...customGoogleUser };
} catch {
  // Use default if file doesn't exist
}

// Load custom LINE user if available, otherwise use default
let lineUser = defaultLineUser;
try {
  const customLineUser = require("../../line.json");
  lineUser = { ...defaultLineUser, ...customLineUser };
} catch {
  // Use default if file doesn't exist
}

export const config = {
  // Server configuration
  host: process.env.HOST ?? "0.0.0.0",
  googlePort: parseInt(process.env.GOOGLE_PORT ?? "3001", 10),
  linePort: parseInt(process.env.LINE_PORT ?? "3002", 10),

  // Mock user data
  mockUser: googleUser,
  mockLineUser: lineUser,

  // Token configuration
  tokenExpiry: parseInt(process.env.TOKEN_EXPIRY ?? "3600", 10),
  tokenPrefix: process.env.TOKEN_PREFIX ?? "mock_access_token_",
  refreshTokenPrefix: process.env.REFRESH_TOKEN_PREFIX ?? "mock_refresh_token_",
  authCodePrefix: process.env.AUTH_CODE_PREFIX ?? "mock_auth_code_",

  // Provider configuration
  enableGoogle: process.env.ENABLE_GOOGLE !== "false",
  enableLine: process.env.ENABLE_LINE !== "false",

  // Provider enablement from ENABLE environment variable
  enabledProviders: ((): string[] => {
    const enableEnv = process.env.ENABLE;
    if (!enableEnv) {
      return []; // Default: no providers enabled
    }
    return enableEnv.split(",").map(p => p.trim().toLowerCase());
  })(),

  // Environment
  nodeEnv: process.env.NODE_ENV ?? "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  // Logging
  logLevel: process.env.LOG_LEVEL ?? "info",
  enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== "false",
};
