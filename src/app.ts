import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import requestIp from 'request-ip';
import { rateLimit } from 'express-rate-limit';
import appRoute from './routes/index';
import { errorHandler } from './middlewares/error.middleware';
import morganMiddleware from './logger/morgan.logger';
import cors from 'cors';
import router from './routes/v1';
import ApiResponse from './utils/ApiResponse';

const app = express();
app.use(express.json());

// Use Helmet to help secure Express apps with various HTTP headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false, // Disable CSP in development
}));


// logger
app.use(morganMiddleware)

app.use(requestIp.mw());

// Enable CORS
app.use(cors({
  origin: '*', // Allow only this domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
  credentials: true, // Enable cookies and credentials if needed
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: true,
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  keyGenerator: (req: Request, res: Response) => req.clientIp || 'default-ip',
  handler: (req: Request, res: Response, next: NextFunction) => {

    res.status(429).send('Too Many Requests');
  }
});

// @ts-ignore
app.get('/isAppOnline', (req: Request, res: Response) => {
  return res.status(200).json({
    isAppOnline: true, // or false, based on your requirement
  });
});


// app.use(limiter);


// Define routes
app.use('/', appRoute);

// Error handling middleware
app.use(errorHandler);

export default app;