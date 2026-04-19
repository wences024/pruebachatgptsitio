export async function creaPagamentoSatispay(importo: number) {
  return {
    payment_id: `demo_${Date.now()}`,
    qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=satispay:${importo}`,
    stato: 'PENDING'
  };
}

export async function gestisciWebhookSatispay(payload: unknown) {
  return { ricevuto: true, payload };
}
