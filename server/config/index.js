require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtCookieName: process.env.JWT_COOKIE_NAME || 'snarenet_token',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
};

function validateConfig() {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { config, validateConfig };