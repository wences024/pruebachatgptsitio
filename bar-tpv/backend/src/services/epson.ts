import net from 'node:net';
import { env } from './config/env.js';
import type { MetodoPagamento } from '@bar-tpv/shared';

export interface ComandoFiscale {
  tipo: 'scontrino' | 'z_report' | 'apri_cassetto';
  prodotti?: { nome: string; quantita: number; prezzo: number }[];
  metodo_pagamento?: MetodoPagamento;
  importo_totale?: number;
}

export async function apriCassetto() {
  const payload = Buffer.from('\x1B\x70\x00\x19\xFA', 'binary');
  return inviaTcp(env.epsonIp, env.epsonPort, payload);
}

export async function stampaFiscale(comando: ComandoFiscale) {
  // Stub pronto per integrazione con SDK reale Epson.
  return {
    esito: 'ok',
    stampante: `${env.epsonIp}:${env.epsonPort}`,
    comando
  };
}

export async function inviaComanda(destinazione: 'cucina' | 'bar', contenuto: string) {
  const host = destinazione === 'cucina' ? env.cucinaPrinterIp : env.barPrinterIp;
  return inviaTcp(host, 9100, Buffer.from(contenuto, 'utf8'));
}

function inviaTcp(host: string, port: number, payload: Buffer) {
  return new Promise<{ esito: string; host: string; port: number }>((resolve, reject) => {
    const client = new net.Socket();
    client.setTimeout(2500);
    client.connect(port, host, () => {
      client.write(payload);
      client.end();
      resolve({ esito: 'ok', host, port });
    });
    client.on('error', reject);
    client.on('timeout', () => reject(new Error('Timeout stampante')));
  });
}
