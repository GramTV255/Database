import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app: Application = express();

// 1. Usalama na Mipangilio ya Awali (Security & Middleware)
app.use(helmet());
app.use(cors({
  origin: '*', // Unaweza kubadilisha baadaye kuruhusu baadhi ya domain tu
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' })); // Kuruhusu ujazo mkubwa wa data (JSON)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 2. Logging kupitia Morgan
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 3. Njia Kuu ya Uchunguzi (Root / Health Check Route)
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Karibu kwenye Backend API ya backend-api inafanya kazi kwa uwezo kamili!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 4. Sehemu ya Njia za API (API Routes Placeholder - hapa ndipo tutaweka auth na routes nyingine baadaye)
app.use('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', uptime: process.uptime() });
});

// 5. Msimamizi wa Njia Zilizopotea (404 Not Found Handler)
app.use((req: Request, res: Response, next: NextFunction) => {
  const error: any = new Error(`Haipatikani - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// 6. Msimamizi Mkuu wa Makosa kwenye Seva (Global Error Handler Middleware)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

export default app;
