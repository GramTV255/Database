import dotenv from 'dotenv';
import path from 'path';

// Kusoma vigezo kutoka kwenye faili la .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpire: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
}

const getEnvVariables = (): Config => {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  const nodeEnv = process.env.NODE_ENV || 'development';
  const mongoUri = process.env.MONGO_URI;
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpire = process.env.JWT_EXPIRE || '30d';
  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

  // Uhakiki wa usalama: Hakikisha vigezo vya msingi vya siri vipo
  if (!mongoUri) {
    throw new Error('Kosa: MONGO_URI haijapatikana kwenye faili la .env');
  }

  if (!jwtSecret) {
    throw new Error('Kosa: JWT_SECRET haijapatikana kwenye faili la .env');
  }

  return {
    port,
    nodeEnv,
    mongoUri,
    jwtSecret,
    jwtExpire,
    cloudinaryCloudName: cloudinaryCloudName || 'backend-api-storage',
    cloudinaryApiKey: cloudinaryApiKey || '',
    cloudinaryApiSecret: cloudinaryApiSecret || '',
  };
};

export const config = getEnvVariables();
