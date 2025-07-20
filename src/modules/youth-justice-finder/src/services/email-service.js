import pino from 'pino';

const logger = pino({ name: 'email-service' });

// Mock email service for now
export async function sendEmail({ to, subject, body }) {
  logger.info({ to, subject }, 'Would send email');
  
  // In production, integrate with SendGrid, AWS SES, etc.
  console.log(`
=== EMAIL NOTIFICATION ===
To: ${to}
Subject: ${subject}
Body:
${body}
========================
  `);
  
  return { success: true };
}