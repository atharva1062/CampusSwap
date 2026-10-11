const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
let transporter = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER || process.env.EMAIL_USER || '';
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';

    if (user && pass) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
  }
  return transporter;
}

/**
 * Send an email notification
 * @param {string|string[]} to - Recipient email(s)
 * @param {string} subject - Email subject
 * @param {string} html - HTML body content
 */
async function sendEmailNotification(to, subject, html) {
  const mailer = getTransporter();
  if (!mailer) {
    console.log('[Email Simulation] SMTP credentials not set. Simulated sending to:', to, subject);
    return false;
  }

  try {
    const sender = process.env.SMTP_FROM || `"DIT CampusSwap" <${process.env.SMTP_USER || 'no-reply@campusswap.edu'}>`;
    await mailer.sendMail({
      from: sender,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('Failed to send email notification:', err.message);
    return false;
  }
}

module.exports = {
  sendEmailNotification,
};
