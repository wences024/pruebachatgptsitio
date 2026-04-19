import crypto from 'crypto';
import https from 'https';
import QRCode from 'qrcode';

const BASE_URL = process.env.SATISPAY_ENV === 'production'
  ? 'https://authservices.satispay.com'
  : 'https://staging.authservices.satispay.com';

interface SatispayPayment {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELED';
  redirect_url?: string;
}

function signRequest(
  keyId: string,
  privateKey: string,
  method: string,
  path: string,
  body: string,
  date: string
): string {
  const digest = `SHA-256=${crypto.createHash('sha256').update(body).digest('base64')}`;
  const signatureString = `(request-target): ${method.toLowerCase()} ${path}\nhost: ${new URL(BASE_URL).host}\ndate: ${date}\ndigest: ${digest}`;
  const signature = crypto.sign('sha256', Buffer.from(signatureString), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PADDING,
  }).toString('base64');

  return `Signature keyId="${keyId}",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="${signature}"`;
}

async function satispayRequest(method: string, path: string, body?: object): Promise<unknown> {
  const keyId = process.env.SATISPAY_KEY_ID;
  const privateKey = process.env.SATISPAY_PRIVATE_KEY;

  if (!keyId || !privateKey) {
    throw new Error('Credenziali Satispay non configurate');
  }

  const bodyStr = body ? JSON.stringify(body) : '';
  const date = new Date().toUTCString();
  const authorization = signRequest(keyId, privateKey, method, path, bodyStr, date);
  const digest = `SHA-256=${crypto.createHash('sha256').update(bodyStr).digest('base64')}`;

  const url = new URL(BASE_URL + path);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'Date': date,
        'Digest': digest,
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

export async function creaPagamento(importo: number, descrizione: string): Promise<{ payment_id: string; qr_code: string }> {
  const body = {
    flow: 'MATCH_CODE',
    amount_unit: Math.round(importo * 100),
    currency: 'EUR',
    description: descrizione,
    expiration_date: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };

  const response = await satispayRequest('POST', '/g_business/v1/payments', body) as { id: string };
  const payment_id = response.id;

  const qrData = `https://pos.satispay.com/payment/${payment_id}`;
  const qr_code = await QRCode.toDataURL(qrData);

  return { payment_id, qr_code };
}

export async function verificaPagamento(payment_id: string): Promise<SatispayPayment> {
  const response = await satispayRequest('GET', `/g_business/v1/payments/${payment_id}`) as SatispayPayment;
  return response;
}

export async function rimborsaPagamento(payment_id: string, importo: number): Promise<unknown> {
  const body = {
    flow: 'REFUND',
    amount_unit: Math.round(importo * 100),
    currency: 'EUR',
    parent_payment_uid: payment_id,
  };
  return satispayRequest('POST', '/g_business/v1/payments', body);
}
