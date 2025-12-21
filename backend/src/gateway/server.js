import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config/env.js';
import { requestLogger, logger } from '../utils/logger.js';
import { errorHandler, notFoundHandler } from '../middleware/error-handler.js';
import { apiLimiter } from '../middleware/rate-limiter.js';
import { healthCheck } from '../middleware/health-check.js';

const app = express();
const PORT = config.ports.gateway;

// Middleware
app.use(cors());
// Don't parse JSON in gateway - let target services parse it
// This allows the proxy to forward the raw body stream
app.use(requestLogger);
app.use(apiLimiter);

// Health check with dependencies
app.get('/health', healthCheck);
app.get('/api/v1/health', healthCheck);

// API versioning - v1 routes
const v1Router = express.Router();

// Proxy to Issuer Service
v1Router.use('/issuer', createProxyMiddleware({
  target: `http://localhost:${config.ports.issuer}`,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/issuer': '' },
  onError: (err, req, res) => {
    logger.error('Proxy error (Issuer)', { error: err.message, url: req.url });
    res.status(503).json({ success: false, error: { message: 'Issuer service unavailable' } });
  },
}));

// Proxy to User Service
v1Router.use('/user', createProxyMiddleware({
  target: `http://localhost:${config.ports.user}`,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/user': '' },
  onError: (err, req, res) => {
    logger.error('Proxy error (User)', { error: err.message, url: req.url });
    res.status(503).json({ success: false, error: { message: 'User service unavailable' } });
  },
}));

// Proxy to Protocol Service
v1Router.use('/protocol', createProxyMiddleware({
  target: `http://localhost:${config.ports.protocol}`,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/protocol': '' },
  onError: (err, req, res) => {
    logger.error('Proxy error (Protocol)', { error: err.message, url: req.url });
    res.status(503).json({ success: false, error: { message: 'Protocol service unavailable' } });
  },
}));

// Proxy to Proof Service
v1Router.use('/proof', createProxyMiddleware({
  target: `http://localhost:${config.ports.proof}`,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/proof': '' },
  onError: (err, req, res) => {
    logger.error('Proxy error (Proof)', { error: err.message, url: req.url });
    res.status(503).json({ success: false, error: { message: 'Proof service unavailable' } });
  },
}));

app.use('/api/v1', v1Router);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info('API Gateway started', {
    port: PORT,
    environment: config.logging.env,
  });
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 Routes:`);
  console.log(`   - /api/v1/issuer/* → Issuer Service (${config.ports.issuer})`);
  console.log(`   - /api/v1/user/* → User Service (${config.ports.user})`);
  console.log(`   - /api/v1/protocol/* → Protocol Service (${config.ports.protocol})`);
  console.log(`   - /api/v1/proof/* → Proof Service (${config.ports.proof})`);
  console.log(`   - /health → Health check with dependencies`);
});

