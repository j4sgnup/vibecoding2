
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const recipientPhoneNumber = process.env.RECIPIENT_PHONE_NUMBER; // Hardcoded recipient

const client = twilio(accountSid, authToken);

/**
 * Sends a WhatsApp message using Twilio to a hardcoded recipient.
 * @param body - The text of the message to send.
 */
export async function sendWhatsAppMessage(body: string): Promise<void> {
  if (!accountSid || !authToken || !twilioPhoneNumber || !recipientPhoneNumber) {
    console.error('Twilio credentials or recipient phone number are not configured in .env file.');
    throw new Error('Twilio is not configured.');
  }

  try {
    await client.messages.create({
      from: `whatsapp:${twilioPhoneNumber}`,
      to: recipientPhoneNumber, // Always send to the hardcoded number
      body: body,
    });
    console.log(`WhatsApp message sent to ${recipientPhoneNumber}`);
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
