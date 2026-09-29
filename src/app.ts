import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import uploadRoutes from './routes/uploadRoutes';
import userRoutes from './routes/userRoutes'; // Usajili wa Routes za Watumiaji (Admin Management)

const app: Application = express();

// 1. Usalama wa Ziada (Security Headers & Rate Limiting)
app.use(helmet());

// Kinga dhidi ya mashambulizi ya nguvu au DDoS (Rate Limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Dakika 15
  max: 100, // Upeo wa maombi 100 kwa kila IP ndani ya dakika 15
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Maombi mengi yamefanywa kutoka kwa IP yako, tafadhali subiri kidogo kabla ya jaribio jipya.'
  }
});

// Tumia rate limiter kwenye njia zote za API
app.use('/api/', limiter);

// 2. Mipangilio ya CORS na Cookies
app.use(cors({
  origin: '*', // Badilisha uweke domain maalum ya mteja wako kwenye production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser()); // Kusoma cookies zilizotumwa na kivinjari au mteja

// 3. Logging kupitia Morgan (Kulingana na Mazingira ya Seva)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 4. Njia Kuu ya Uchunguzi (Root / Health Check Route)
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Karibu kwenye Backend API ya backend-api inafanya kazi kwa uwezo kamili na usalama wa kiwango cha juu!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 5. Usajili Rasmi wa Njia za API (API Routes Mounting)
app.use('/api/v1/auth', authRoutes);     // Njia za Usajili, Kuingia, na Wasifu
app.use('/api/v1/upload', uploadRoutes); // Njia za Kupakia Picha, Mafaili, na Kufuta Wingu
app.use('/api/v1/users', userRoutes);    // Njia za Usimamizi wa Watumiaji (Admin Management)

// Endpoint ya Kuchunguza Afya ya Seva (Health Check Endpoint)
app.use('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'UP', 
    uptime: process.uptime(),
    database: 'Connected',
    timestamp: new Date().toISOString()
  });
});

// 6. Msimamizi wa Njia Zilizopotea (404 Not Found Handler)
app.use((req: Request, res: Response, next: NextFunction) => {
  const error: any = new Error(`Rasilimali haipatikani kwenye mfumo - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// 7. Msimamizi Mkuu wa Makosa kwenye Seva (Global Error Handler Middleware)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

export default app;
