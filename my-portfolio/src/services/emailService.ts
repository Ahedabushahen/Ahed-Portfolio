import emailjs from '@emailjs/browser';
import {
  EMAIL_SERVICE_ID,
  EMAIL_TEMPLATE_THANKYOU,
  EMAIL_TEMPLATE_ADMIN,
  EMAIL_PUBLIC_KEY,
} from '../config/email';

export async function sendThankYouEmail(name: string, email: string): Promise<void> {
  await emailjs.send(
    EMAIL_SERVICE_ID,
    EMAIL_TEMPLATE_THANKYOU,
    { name, email },
    EMAIL_PUBLIC_KEY
  );
}

export async function sendAdminNotification(messageData: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<void> {
  await emailjs.send(
    EMAIL_SERVICE_ID,
    EMAIL_TEMPLATE_ADMIN,
    {
      name: messageData.name,
      email: messageData.email,
      subject: messageData.subject ?? '(no subject)',
      message: messageData.message,
    },
    EMAIL_PUBLIC_KEY
  );
}

