import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? [
          process.env.FRONTEND_URL || 'https://optiplatform-backend.onrender.com', // Your production frontend URL
          'http://localhost:5173', // Keep for local testing
        ]
      : [
          'http://localhost:5173', // Vite dev server default port
          'http://localhost:5174', // Alternative Vite port
          'http://localhost:3000', // React dev server default port
          'http://127.0.0.1:5173',
          'http://127.0.0.1:5174',
          'tauri://localhost', // Tauri app
          'http://tauri.localhost',
        ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies and auth headers
  });

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3001);
  
  console.log('🚀 Server running on http://localhost:3001');
  console.log('📊 GraphQL Playground: http://localhost:3001/graphql');
}
bootstrap();
