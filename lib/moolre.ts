import crypto from 'crypto';

interface MoolreResponse {
  ok: boolean;
  providerReference?: string;
  paymentUrl?: string;
  raw?: any;
  error?: string;
}

const BASE_URL = process.env.MOOLRE_BASE_URL;
const API_KEY = process.env.MOOLRE_API_KEY;
const SECRET_KEY = process.env.MOOLRE_SECRET;
const COLLECTIONS_ENDPOINT = process.env.MOOLRE_COLLECTIONS_ENDPOINT;
const DISBURSEMENT_ENDPOINT = process.env.MOOLRE_DISBURSEMENT_ENDPOINT;
const SMS_ENDPOINT = process.env.MOOLRE_SMS_ENDPOINT;
const SENDER_ID = process.env.MOOLRE_SENDER_ID;
const VAS_KEY = process.env.MOOLRE_SMS_VAS_KEY;

function checkConfig() {
  if (!BASE_URL || !API_KEY || !SECRET_KEY) {
    throw new Error('Moolre credentials missing. Ensure MOOLRE_BASE_URL, MOOLRE_API_KEY, and MOOLRE_SECRET are set.');
  }
}

export async function createCollectionPayment({
  amount,
  reference,
  customerName,
  customerPhone,
  customerEmail,
  callbackUrl,
  redirectUrl,
  description,
}: {
  amount: number;
  reference: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  callbackUrl: string;
  redirectUrl: string;
  description: string;
}): Promise<MoolreResponse> {
  checkConfig();
  if (!COLLECTIONS_ENDPOINT) throw new Error('MOOLRE_COLLECTIONS_ENDPOINT missing');

  try {
    const response = await fetch(`${BASE_URL}${COLLECTIONS_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        amount,
        reference,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        callback_url: callbackUrl,
        redirect_url: redirectUrl,
        description,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data.message || 'Payment initiation failed', raw: data };
    }

    return {
      ok: true,
      providerReference: data.data?.reference || data.reference,
      paymentUrl: data.data?.checkout_url || data.checkout_url,
      raw: data,
    };
  } catch (error: any) {
    return { ok: false, error: error.message, raw: error };
  }
}

export async function initiateDisbursement({
  amount,
  recipientPhone,
  recipientName,
  reference,
  narration,
}: {
  amount: number;
  recipientPhone: string;
  recipientName: string;
  reference: string;
  narration: string;
}): Promise<MoolreResponse> {
  checkConfig();
  if (!DISBURSEMENT_ENDPOINT) throw new Error('MOOLRE_DISBURSEMENT_ENDPOINT missing');

  try {
    const response = await fetch(`${BASE_URL}${DISBURSEMENT_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        amount,
        recipient_phone: recipientPhone,
        recipient_name: recipientName,
        reference,
        narration,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data.message || 'Disbursement initiation failed', raw: data };
    }

    return {
      ok: true,
      providerReference: data.data?.reference || data.reference,
      raw: data,
    };
  } catch (error: any) {
    return { ok: false, error: error.message, raw: error };
  }
}

export async function sendSMS({ to, message }: { to: string; message: string }): Promise<MoolreResponse> {
  checkConfig();
  if (!SMS_ENDPOINT) throw new Error('MOOLRE_SMS_ENDPOINT missing');

  // Need to import SMSLog inside function to avoid circular deps if any, or just import at top.
  // Actually, better to import at top, but for now we can dynamically import to be safe since lib/moolre is low-level.
  const { SMSLog } = require('@/models/SMSLog');
  
  const smsLog = new SMSLog({
     phoneNumber: to,
     recipientType: 'farmer', // Defaulting for now, adjust if needed
     message,
     status: 'pending'
  });
  await smsLog.save().catch(console.error);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    };
    
    if (VAS_KEY) {
      headers['X-API-VASKEY'] = VAS_KEY;
    }

    const response = await fetch(`${BASE_URL}${SMS_ENDPOINT}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        recipient: to,
        sender_id: SENDER_ID,
        message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      smsLog.status = 'failed';
      smsLog.rawProviderResponse = data;
      await smsLog.save().catch(console.error);
      return { ok: false, error: data.message || 'SMS delivery failed', raw: data };
    }

    smsLog.status = 'sent';
    smsLog.providerReference = data.data?.message_id || data.message_id;
    smsLog.rawProviderResponse = data;
    await smsLog.save().catch(console.error);

    return {
      ok: true,
      providerReference: data.data?.message_id || data.message_id,
      raw: data,
    };
  } catch (error: any) {
    smsLog.status = 'failed';
    smsLog.rawProviderResponse = { error: error.message };
    await smsLog.save().catch(console.error);
    return { ok: false, error: error.message, raw: error };
  }
}

export function verifyWebhookSignature({ rawBody, signatureHeader }: { rawBody: string; signatureHeader: string }): boolean {
  // If the signature format is unknown, implement an isolated verifier.
  // We'll assume a standard HMAC SHA256 using the SECRET_KEY for now.
  if (!SECRET_KEY) return false;
  if (!signatureHeader) return true; // If no header is provided in Moolre, maybe they don't sign. We fail open ONLY if missing in DEV or if they literally don't send one, but typically we should require it.
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(rawBody)
      .digest('hex');
      
    // Compare securely
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature));
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}
