import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import s3Routes from './routes/s3Routes.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: false
  })
);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.get('/health', (_req, res) => res.json({ success: true, message: 'OK' }));
app.use('/api/s3', s3Routes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Backend listening on port ${env.PORT}`);
});
