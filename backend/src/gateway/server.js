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
// CORS configuration - allow all origins for development and production
const corsOptions = {
  origin: function (origin, callback) {
    // #region agent log
    logger.info('CORS origin check', { origin, hasOrigin: !!origin });
    // #endregion
    // Allow all origins (for development and production)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Explicitly handle OPTIONS requests for CORS preflight
app.options('*', (req, res) => {
  // #region agent log
  logger.info('OPTIONS preflight request', { 
    origin: req.headers.origin,
    method: req.method,
    url: req.url 
  });
  // #endregion
  cors(corsOptions)(req, res, () => {
    res.sendStatus(204);
  });
});

// Don't parse JSON in gateway - let target services parse it
// This allows the proxy to forward the raw body stream
app.use(requestLogger);
app.use(apiLimiter);

// Debug middleware to log ALL incoming requests
app.use((req, res, next) => {
  // #region agent log
  logger.info('Gateway incoming request', { 
    method: req.method,
    originalUrl: req.originalUrl,
    url: req.url,
    path: req.path,
    baseUrl: req.baseUrl,
    headers: { host: req.headers.host }
  });
  // #endregion
  next();
});

// Health check with dependencies
app.get('/health', healthCheck);
app.get('/api/v1/health', healthCheck);

// API versioning - v1 routes
const v1Router = express.Router();

// Debug middleware to log all requests to v1Router
v1Router.use((req, res, next) => {
  // #region agent log
  logger.info('v1Router request', { 
    method: req.method,
    originalUrl: req.originalUrl,
    url: req.url,
    path: req.path,
    baseUrl: req.baseUrl
  });
  // #endregion
  next();
});

// Proxy to Issuer Service
v1Router.use('/issuer', createProxyMiddleware({
  target: `http://localhost:${config.ports.issuer}`,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    // #region agent log
    logger.info('Path rewrite (Issuer) - INPUT', { 
      pathParam: path, 
      originalUrl: req.originalUrl,
      url: req.url,
      path: req.path,
      baseUrl: req.baseUrl
    });
    // #endregion
    
    // The path parameter from http-proxy-middleware might contain the full path
    // We need to remove '/issuer' prefix from whatever source has it
    let sourcePath = path;
    
    // Check if path parameter has /issuer prefix
    if (path && path.includes('/issuer')) {
      sourcePath = path;
    }
    // Check if req.path has /issuer (shouldn't happen with Express Router, but be safe)
    else if (req.path && req.path.includes('/issuer')) {
      sourcePath = req.path;
    }
    // Check if req.url has /issuer
    else if (req.url && req.url.includes('/issuer')) {
      sourcePath = req.url.split('?')[0]; // Remove query string
    }
    // Use req.path if available (Express Router should have stripped /issuer)
    else if (req.path) {
      sourcePath = req.path;
    }
    
    // Remove /issuer prefix from the beginning
    let rewritten = sourcePath.replace(/^\/issuer/, '').replace(/^\/api\/v1\/issuer/, '');
    
    // Ensure path starts with /
    if (!rewritten.startsWith('/')) {
      rewritten = '/' + rewritten;
    }
    
    // #region agent log
    logger.info('Path rewrite (Issuer) - OUTPUT', { 
      originalPath: path,
      sourcePath,
      rewritten,
      reqPath: req.path,
      reqUrl: req.url
    });
    // #endregion
    
    return rewritten;
  },
  onProxyReq: (proxyReq, req, res) => {
    // #region agent log
    logger.info('Proxy request (Issuer)', { 
      originalUrl: req.originalUrl,
      proxyPath: proxyReq.path,
      method: req.method 
    });
    // #endregion
  },
  onError: (err, req, res) => {
    logger.error('Proxy error (Issuer)', { error: err.message, url: req.url });
    res.status(503).json({ success: false, error: { message: 'Issuer service unavailable' } });
  },
}));

// Proxy to User Service
v1Router.use('/user', createProxyMiddleware({
  target: `http://localhost:${config.ports.user}`,
  changeOrigin: true,
  pathRewrite: (path, req) => req.path || path.replace(/^\/user/, ''),
  onError: (err, req, res) => {
    logger.error('Proxy error (User)', { error: err.message, url: req.url });
    res.status(503).json({ success: false, error: { message: 'User service unavailable' } });
  },
}));

// Proxy to Protocol Service
v1Router.use('/protocol', createProxyMiddleware({
  target: `http://localhost:${config.ports.protocol}`,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    // #region agent log
    logger.info('Path rewrite (Protocol)', { 
      originalPath: path, 
      originalUrl: req.originalUrl,
      url: req.url,
      path: req.path,
      baseUrl: req.baseUrl
    });
    // #endregion
    // Express Router strips '/protocol' from req.path before middleware runs
    // Use req.path directly (already stripped) instead of the path parameter
    const rewritten = req.path || path.replace(/^\/protocol/, '');
    // #region agent log
    logger.info('Path rewrite result (Protocol)', { original: path, rewritten, reqPath: req.path });
    // #endregion
    return rewritten;
  },
  onProxyReq: (proxyReq, req, res) => {
    // #region agent log
    logger.info('Proxy request (Protocol)', { 
      originalUrl: req.originalUrl,
      proxyPath: proxyReq.path,
      method: req.method 
    });
    // #endregion
  },
  onError: (err, req, res) => {
    logger.error('Proxy error (Protocol)', { error: err.message, url: req.url });
    res.status(503).json({ success: false, error: { message: 'Protocol service unavailable' } });
  },
}));

// Proxy to Proof Service
v1Router.use('/proof', createProxyMiddleware({
  target: `http://localhost:${config.ports.proof}`,
  changeOrigin: true,
  pathRewrite: (path, req) => req.path || path.replace(/^\/proof/, ''),
  onError: (err, req, res) => {
    logger.error('Proxy error (Proof)', { error: err.message, url: req.url });
    res.status(503).json({ success: false, error: { message: 'Proof service unavailable' } });
  },
}));

// Mount v1Router with /api/v1 prefix
app.use('/api/v1', v1Router);

// Also mount v1Router without prefix for requests that come without /api/v1
// This handles cases where the frontend baseURL might not include /api/v1
const v1RouterNoPrefix = express.Router();

// Debug middleware for no-prefix router
v1RouterNoPrefix.use((req, res, next) => {
  // #region agent log
  logger.info('v1RouterNoPrefix request', { 
    method: req.method,
    originalUrl: req.originalUrl,
    url: req.url,
    path: req.path,
    baseUrl: req.baseUrl
  });
  // #endregion
  next();
});

v1RouterNoPrefix.use('/issuer', createProxyMiddleware({
  target: `http://localhost:${config.ports.issuer}`,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    // #region agent log
    logger.info('Path rewrite (Issuer - no prefix) - INPUT', { 
      pathParam: path,
      originalPath: path, 
      reqPath: req.path,
      reqUrl: req.url,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl
    });
    // #endregion
    
    // Express Router strips '/issuer' from req.path before middleware runs
    // Use req.path directly (already stripped) instead of the path parameter
    let rewritten = req.path;
    
    // Fallback: if req.path doesn't exist or still has /issuer, try path parameter
    if (!rewritten || rewritten.startsWith('/issuer')) {
      rewritten = path.replace(/^\/issuer/, '');
    }
    
    // Ensure path starts with /
    if (rewritten && !rewritten.startsWith('/')) {
      rewritten = '/' + rewritten;
    }
    
    // #region agent log
    logger.info('Path rewrite (Issuer - no prefix) - OUTPUT', { 
      originalPath: path, 
      reqPath: req.path, 
      rewritten 
    });
    // #endregion
    
    return rewritten || '/';
  },
  onProxyReq: (proxyReq, req, res) => {
    // #region agent log
    logger.info('Proxy request (Issuer - no prefix)', { 
      originalUrl: req.originalUrl,
      proxyPath: proxyReq.path,
      method: req.method 
    });
    // #endregion
  },
}));
v1RouterNoPrefix.use('/user', createProxyMiddleware({
  target: `http://localhost:${config.ports.user}`,
  changeOrigin: true,
  pathRewrite: (path, req) => req.path || path.replace(/^\/user/, ''),
}));
v1RouterNoPrefix.use('/protocol', createProxyMiddleware({
  target: `http://localhost:${config.ports.protocol}`,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    // #region agent log
    logger.info('Path rewrite (Protocol - no prefix) - INPUT', { 
      pathParam: path,
      originalPath: path, 
      reqPath: req.path,
      reqUrl: req.url,
      originalUrl: req.originalUrl
    });
    // #endregion
    
    // Express Router strips '/protocol' from req.path before middleware runs
    let rewritten = req.path;
    
    // Fallback: if req.path doesn't exist or still has /protocol, try path parameter
    if (!rewritten || rewritten.startsWith('/protocol')) {
      rewritten = path.replace(/^\/protocol/, '');
    }
    
    // Ensure path starts with /
    if (rewritten && !rewritten.startsWith('/')) {
      rewritten = '/' + rewritten;
    }
    
    // #region agent log
    logger.info('Path rewrite (Protocol - no prefix) - OUTPUT', { 
      originalPath: path, 
      reqPath: req.path, 
      rewritten 
    });
    // #endregion
    
    return rewritten || '/';
  },
  onProxyReq: (proxyReq, req, res) => {
    // #region agent log
    logger.info('Proxy request (Protocol - no prefix)', { 
      originalUrl: req.originalUrl,
      proxyPath: proxyReq.path,
      method: req.method 
    });
    // #endregion
  },
}));
v1RouterNoPrefix.use('/proof', createProxyMiddleware({
  target: `http://localhost:${config.ports.proof}`,
  changeOrigin: true,
  pathRewrite: (path, req) => req.path || path.replace(/^\/proof/, ''),
}));
app.use(v1RouterNoPrefix);

// Debug: Log requests that don't match any route before 404
app.use((req, res, next) => {
  // #region agent log
  if (!req.path.startsWith('/api/v1') && 
      !req.path.startsWith('/health') && 
      !req.path.startsWith('/issuer') && 
      !req.path.startsWith('/user') && 
      !req.path.startsWith('/protocol') && 
      !req.path.startsWith('/proof')) {
    logger.warn('Request not matching any route - will 404', {
      method: req.method,
      originalUrl: req.originalUrl,
      url: req.url,
      path: req.path,
      baseUrl: req.baseUrl
    });
  }
  // #endregion
  next();
});

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

