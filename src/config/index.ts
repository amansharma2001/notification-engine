import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/notifications',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'aman-dev-secret-2025',
  },
};