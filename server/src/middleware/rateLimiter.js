import { logSecurityAudit } from '../services/audit/auditLogger.js';

// In-memory token bucket store for rate limiting
const requestCounts = new Map();

/**
 * Enterprise Internal Rate Limiting & Anti-Scraping Middleware
 * Prevents automated bulk data exfiltration or API flooding.
 */
export function rateLimiter({ windowMs = 60000, maxRequests = 30, message = 'Rate limit exceeded.' }) {
  return (req, res, next) => {
    const clientKey = req.user?.id || req.ip || 'anonymous';
    const currentTime = Date.now();

    if (!requestCounts.has(clientKey)) {
      requestCounts.set(clientKey, { count: 1, startTime: currentTime });
      return next();
    }

    const record = requestCounts.get(clientKey);

    if (currentTime - record.startTime > windowMs) {
      // Reset window
      record.count = 1;
      record.startTime = currentTime;
      return next();
    }

    record.count += 1;

    if (record.count > maxRequests) {
      // Log security audit entry for rate limit violation
      logSecurityAudit({
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action: 'RATE_LIMIT_EXCEEDED',
        resource: req.originalUrl,
        status: 'DENIED',
        details: { count: record.count, limit: maxRequests }
      });

      return res.status(429).json({
        error: message,
        retryAfterSeconds: Math.ceil((windowMs - (currentTime - record.startTime)) / 1000)
      });
    }

    next();
  };
}
