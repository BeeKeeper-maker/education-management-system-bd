import express, { Express } from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import path from 'path';
import { config } from './config';
import { pool, testConnection } from './db';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Express = express();
const PgSession = connectPgSimple(session);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'sessions',
      createTableIfMissing: true,
    }),
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: config.session.maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Static files (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), config.upload.dir)));

// API routes
app.use('/api', routes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), 'dist/client')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist/client', 'index.html'));
  });
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Create uploads directory if it doesn't exist
    const fs = await import('fs');
    const uploadsDir = path.join(process.cwd(), config.upload.dir);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Uploads directory created');
    }

    // Start listening
    app.listen(config.port, () => {
      console.log('\n🚀 EduPro Server Started');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 Server: http://localhost:${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`📊 Database: Connected`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;