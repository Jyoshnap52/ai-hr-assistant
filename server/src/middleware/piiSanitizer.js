/**
 * Enterprise Internal PII Masking & Data Privacy Sanitizer
 * Automatically redacts sensitive PII (SSN, Bank Details, Passports, Credit Cards)
 * to protect private company data before vector storage or AI processing.
 */

// Regex patterns for sensitive PII detection
const PII_PATTERNS = [
  // SSN / Government Tax IDs (e.g., 123-45-6789)
  { name: 'SSN', regex: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, replacement: '[REDACTED_GOVT_ID]' },
  
  // Credit Card Numbers (e.g., 4532 1234 5678 9012)
  { name: 'CREDIT_CARD', regex: /\b(?:\d[ -]*?){13,16}\b/g, replacement: '[REDACTED_PAYMENT_CARD]' },
  
  // Bank IBAN / Account Numbers
  { name: 'BANK_ACCOUNT', regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g, replacement: '[REDACTED_BANK_ACCOUNT]' },
  
  // Passport Numbers (e.g., A1234567)
  { name: 'PASSPORT', regex: /\b[A-Z]{1,2}\d{6,8}\b/g, replacement: '[REDACTED_PASSPORT_ID]' },
  
  // Personal Email Addresses (masking non-company domains)
  { name: 'PERSONAL_EMAIL', regex: /\b[A-Za-z0-9._%+-]+@(gmail|yahoo|hotmail|outlook|icloud)\.[A-Za-z]{2,}\b/gi, replacement: '[REDACTED_PERSONAL_EMAIL]' }
];

/**
 * Sanitize a string by replacing PII patterns with redacted placeholders.
 */
export function sanitizePII(text) {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;
  PII_PATTERNS.forEach(({ regex, replacement }) => {
    sanitized = sanitized.replace(regex, replacement);
  });

  return sanitized;
}

/**
 * Express middleware to automatically sanitize req.body text inputs.
 */
export function piiSanitizerMiddleware(req, res, next) {
  if (req.body) {
    if (typeof req.body.question === 'string') {
      req.body.question = sanitizePII(req.body.question);
    }
    if (typeof req.body.query === 'string') {
      req.body.query = sanitizePII(req.body.query);
    }
    if (typeof req.body.message === 'string') {
      req.body.message = sanitizePII(req.body.message);
    }
    if (typeof req.body.jobDescription === 'string') {
      req.body.jobDescription = sanitizePII(req.body.jobDescription);
    }
  }
  next();
}
