import crypto from 'crypto';
import { detectGhanaNetworkChannel } from './phone';

interface MoolreResponse {
  ok: boolean;
  providerReference?: string;
  paymentUrl?: string;
  raw?: any;
  error?: string;
}

const BASE_URL = process.env.MOOLRE_BASE_URL;
const API_USER = process.env.MOOLRE_API_USER;
const API_KEY = process.env.MOOLRE_API_KEY; // Private key for transfers
const API_PUBKEY = process.env.MOOLRE_API_PUBKEY; // Public key for collections
const SECRET_KEY = process.env.MOOLRE_SECRET;
const ACCOUNT_NUMBER = process.env.MOOLRE_ACCOUNT_NUMBER;

const COLLECTIONS_ENDPOINT = process.env.MOOLRE_COLLECTIONS_ENDPOINT || '/embed/link';
const DISBURSEMENT_ENDPOINT = process.env.MOOLRE_DISBURSEMENT_ENDPOINT || '/open/transact/transfer';
const SMS_ENDPOINT = process.env.MOOLRE_SMS_ENDPOINT || '/open/sms/send';
const SMS_STATUS_ENDPOINT = process.env.MOOLRE_SMS_STATUS_ENDPOINT || '/open/sms/status';
const SENDER_ID = process.env.MOOLRE_SENDER_ID || 'YieldPay';
const VAS_KEY = process.env.MOOLRE_SMS_VAS_KEY;

export async function createCollectionPayment({
  amount,
  reference,
  customerEmail,
  callbackUrl,
  redirectUrl,
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
  if (!BASE_URL || !API_USER || !API_PUBKEY) {
    return { ok: false, error: 'Moolre collection credentials missing.' };
  }

  try {
    const response = await fetch(`${BASE_URL}${COLLECTIONS_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-USER': API_USER,
        'X-API-PUBKEY': API_PUBKEY,
      },
      body: JSON.stringify({
        type: 1,
        amount: amount.toString(),
        email: customerEmail || 'demo@yieldpay.ai',
        externalref: reference,
        callback: callbackUrl,
        redirect: redirectUrl,
        reusable: "0",
        currency: "GHS",
        accountnumber: ACCOUNT_NUMBER || '',
      }),
    });

    const data = await response.json();

    if (!response.ok || (data.status !== 1 && data.status !== '1')) {
      return { ok: false, error: data.message || 'Payment initiation failed', raw: data };
    }

    return {
      ok: true,
      providerReference: data.reference || data.data?.reference,
      paymentUrl: data.authorization_url || data.checkout_url || data.data?.checkout_url,
      raw: data,
    };
  } catch (error: any) {
    return { ok: false, error: error.message, raw: error };
  }
}

export async function initiateDisbursement({
  amount,
  recipientPhone,
  reference,
}: {
  amount: number;
  recipientPhone: string;
  recipientName: string;
  reference: string;
  narration: string;
}): Promise<MoolreResponse> {
  if (!BASE_URL || !API_USER || !API_KEY) {
    return { ok: false, error: 'Moolre disbursement credentials missing.' };
  }

  const channel = detectGhanaNetworkChannel(recipientPhone) || '1'; // Default to MTN if unknown

  try {
    const response = await fetch(`${BASE_URL}${DISBURSEMENT_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-USER': API_USER,
        'X-API-KEY': API_KEY,
      },
      body: JSON.stringify({
        type: 1,
        channel: channel,
        currency: "GHS",
        amount: amount.toString(),
        receiver: recipientPhone,
        externalref: reference,
        reference: reference,
        accountnumber: ACCOUNT_NUMBER || '',
      }),
    });

    const data = await response.json();

    if (!response.ok || (data.status !== 1 && data.status !== '1')) {
      return { ok: false, error: data.message || 'Disbursement initiation failed', raw: data };
    }

    return {
      ok: true,
      providerReference: data.reference || data.data?.reference,
      raw: data,
    };
  } catch (error: any) {
    return { ok: false, error: error.message, raw: error };
  }
}

export async function initiateBulkDisbursements(payouts: Array<{
  amount: number;
  recipientPhone: string;
  recipientName: string;
  reference: string;
  narration: string;
}>): Promise<{ successful: number; failed: number; results: any[] }> {
  // Moolre doesn't have an explicit array-based /bulk endpoint in the basic docs,
  // so we process payouts in parallel using the verified transfer endpoint.
  
  const results = await Promise.allSettled(
    payouts.map(payout => initiateDisbursement(payout))
  );

  let successful = 0;
  let failed = 0;

  const formattedResults = results.map((res, index) => {
    const payout = payouts[index];
    if (res.status === 'fulfilled' && res.value.ok) {
      successful++;
      return { success: true, reference: payout.reference, providerReference: res.value.providerReference };
    } else {
      failed++;
      return { success: false, reference: payout.reference, error: res.status === 'fulfilled' ? res.value.error : res.reason };
    }
  });

  return { successful, failed, results: formattedResults };
}

export async function sendSMS({ to, message }: { to: string; message: string }): Promise<MoolreResponse> {
  if (!BASE_URL || !VAS_KEY) {
    console.warn('Moolre SMS credentials missing (VAS_KEY), skipping SMS.');
    return { ok: false, error: 'VAS_KEY missing' };
  }

  const { SMSLog } = require('@/models/SMSLog');
  
  const smsLog = new SMSLog({
     phoneNumber: to,
     recipientType: 'farmer',
     message,
     status: 'pending'
  });
  await smsLog.save().catch(console.error);

  try {
    const response = await fetch(`${BASE_URL}${SMS_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-VASKEY': VAS_KEY,
      },
      body: JSON.stringify({
        type: 1,
        senderid: SENDER_ID,
        messages: [{
          recipient: to,
          message: message,
          ref: `SMS-${Date.now()}`
        }]
      }),
    });

    const data = await response.json();

    if (!response.ok || (data.status !== 1 && data.status !== '1')) {
      smsLog.status = 'failed';
      smsLog.rawProviderResponse = data;
      await smsLog.save().catch(console.error);
      return { ok: false, error: data.message || 'SMS delivery failed', raw: data };
    }

    smsLog.status = 'sent';
    smsLog.providerReference = data.data?.message_id || data.message_id || 'success';
    smsLog.rawProviderResponse = data;
    await smsLog.save().catch(console.error);

    return {
      ok: true,
      providerReference: smsLog.providerReference,
      raw: data,
    };
  } catch (error: any) {
    smsLog.status = 'failed';
    smsLog.rawProviderResponse = { error: error.message };
    await smsLog.save().catch(console.error);
    return { ok: false, error: error.message, raw: error };
  }
}

export async function checkSMSStatus(refs: string[]): Promise<MoolreResponse> {
  if (!BASE_URL || !VAS_KEY) {
    return { ok: false, error: 'VAS_KEY missing' };
  }

  try {
    const response = await fetch(`${BASE_URL}${SMS_STATUS_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-VASKEY': VAS_KEY,
      },
      body: JSON.stringify({
        type: 5,
        ref: refs
      }),
    });

    const data = await response.json();

    if (!response.ok || (data.status !== 1 && data.status !== '1')) {
      return { ok: false, error: data.message || 'SMS status check failed', raw: data };
    }

    return {
      ok: true,
      raw: data,
    };
  } catch (error: any) {
    return { ok: false, error: error.message, raw: error };
  }
}

export function verifyWebhookSignature({ rawBody, signatureHeader }: { rawBody: string; signatureHeader: string }): boolean {
  if (process.env.MOOLRE_WEBHOOK_REQUIRE_SIGNATURE !== 'true') {
    // Audit Note: If signature verification exists, make it optional unless official signing details are present.
    // If not strictly required by ENV, we accept it (for hackathon demo reliability).
    return true; 
  }

  if (!SECRET_KEY) return false;
  if (!signatureHeader) return false; 
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(rawBody)
      .digest('hex');
      
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature));
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}
