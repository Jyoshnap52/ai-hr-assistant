import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const AUDIT_LOG_DIR = path.join(process.cwd(), 'logs');
const AUDIT_LOG_FILE = path.join(AUDIT_LOG_DIR, 'audit_security.jsonl');

// Ensure audit log directory exists
if (!fs.existsSync(AUDIT_LOG_DIR)) {
  fs.mkdirSync(AUDIT_LOG_DIR, { recursive: true });
}

/**
 * Record an immutable internal security audit log entry.
 */
export function logSecurityAudit({ userId, userEmail, userRole, action, resource, status, details = {} }) {
  const timestamp = new Date().toISOString();
  
  // Hash user email for zero-knowledge audit privacy if needed
  const emailHash = crypto.createHash('sha256').update(userEmail || 'anonymous').digest('hex').slice(0, 16);

  const entry = {
    timestamp,
    eventId: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userId: userId || 'anonymous',
    userRole: userRole || 'Employee',
    emailHash,
    action,       // e.g., 'RAG_QUERY', 'DOCUMENT_UPLOAD', 'RESUME_SCREEN', 'LOGIN'
    resource,     // e.g., '/api/ai/chat', 'Employee_Handbook.pdf'
    status,       // 'SUCCESS', 'DENIED', 'RATE_LIMITED'
    details
  };

  const line = JSON.stringify(entry) + '\n';
  fs.appendFile(AUDIT_LOG_FILE, line, (err) => {
    if (err) console.error('Audit Log Write Warning:', err.message);
  });
}
