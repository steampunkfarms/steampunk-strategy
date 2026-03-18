import twilio from 'twilio';

let client: twilio.Twilio | null = null;

export function getTwilioClient(): twilio.Twilio {
  if (!client) {
    const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const token = process.env.TWILIO_AUTH_TOKEN?.trim();
    if (!sid || !token) throw new Error('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set');
    client = twilio(sid, token);
  }
  return client;
}

export function getFromNumber(): string {
  const num = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!num) throw new Error('TWILIO_FROM_NUMBER not set');
  return num;
}

export function getAlertSmsTo(): string {
  const num = process.env.ALERT_SMS_TO?.trim();
  if (!num) throw new Error('ALERT_SMS_TO not set');
  return num;
}
