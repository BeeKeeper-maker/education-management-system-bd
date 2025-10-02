import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  },
  
  institution: {
    name: process.env.INSTITUTION_NAME || 'EduPro Institute',
    logo: process.env.INSTITUTION_LOGO || '/logo.png',
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
  },
};

// Validate critical environment variables
if (!process.env.DATABASE_URL) {
  throw new Error(`Missing required environment variable: DATABASE_URL`);
}