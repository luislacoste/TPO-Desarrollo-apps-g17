import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { setupWebSocket } from './ws';

const app = express();

// Middlewares globales
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// Rutas versionadas
app.use('/v1', routes);

// 404 y manejador de errores (deben ir últimos)
app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  // Creamos un http.Server explícito para poder enchufar el WebSocket
  // al mismo puerto.
  const server = http.createServer(app);
  setupWebSocket(server);

  server.listen(env.port, () => {
    console.log(`[server] SubastAR API escuchando en http://localhost:${env.port}/v1`);
    console.log(`[server] WS:   ws://localhost:${env.port}/ws/auction/:auctionId`);
    console.log(`[server] entorno: ${env.nodeEnv}`);
  });
}

export default app;
