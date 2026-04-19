import net from 'net';

interface ProdottoFiscale {
  nome: string;
  quantita: number;
  prezzo: number;
}

interface ComandoFiscale {
  tipo: 'scontrino' | 'z_report' | 'apri_cassetto';
  prodotti?: ProdottoFiscale[];
  metodo_pagamento?: 'contanti' | 'carta' | 'satispay';
  importo_totale?: number;
}

function buildScontrinoEscPos(prodotti: ProdottoFiscale[], metodo: string, totale: number): Buffer {
  const ESC = 0x1b;
  const LF = 0x0a;
  const GS = 0x1d;

  const chunks: Buffer[] = [];

  // Init stampante
  chunks.push(Buffer.from([ESC, 0x40]));
  // Align center
  chunks.push(Buffer.from([ESC, 0x61, 0x01]));
  chunks.push(Buffer.from('BAR TPV\n', 'ascii'));
  chunks.push(Buffer.from('============================\n', 'ascii'));
  // Align left
  chunks.push(Buffer.from([ESC, 0x61, 0x00]));

  const now = new Date();
  const dataStr = `${now.toLocaleDateString('it-IT')} ${now.toLocaleTimeString('it-IT')}`;
  chunks.push(Buffer.from(`Data: ${dataStr}\n`, 'ascii'));
  chunks.push(Buffer.from('----------------------------\n', 'ascii'));

  for (const p of prodotti) {
    const riga = `${p.quantita}x ${p.nome.slice(0, 20).padEnd(20)} ${(p.prezzo * p.quantita).toFixed(2)}`;
    chunks.push(Buffer.from(riga + '\n', 'ascii'));
    if (p.quantita > 1) {
      chunks.push(Buffer.from(`   @ ${p.prezzo.toFixed(2)} cad.\n`, 'ascii'));
    }
  }

  chunks.push(Buffer.from('============================\n', 'ascii'));
  // Bold on
  chunks.push(Buffer.from([ESC, 0x45, 0x01]));
  chunks.push(Buffer.from(`TOTALE: EUR ${totale.toFixed(2)}\n`, 'ascii'));
  // Bold off
  chunks.push(Buffer.from([ESC, 0x45, 0x00]));
  chunks.push(Buffer.from(`Pagamento: ${metodo.toUpperCase()}\n`, 'ascii'));
  chunks.push(Buffer.from('============================\n', 'ascii'));

  // Cut parziale
  chunks.push(Buffer.from([GS, 0x56, 0x01]));

  return Buffer.concat(chunks);
}

function buildComanda(tavolo: string | undefined, prodotti: { nome: string; quantita: number; nota?: string }[]): Buffer {
  const ESC = 0x1b;
  const chunks: Buffer[] = [];

  chunks.push(Buffer.from([ESC, 0x40]));
  chunks.push(Buffer.from([ESC, 0x45, 0x01]));
  chunks.push(Buffer.from(`COMANDA${tavolo ? ` - TAVOLO ${tavolo}` : ''}\n`, 'ascii'));
  chunks.push(Buffer.from([ESC, 0x45, 0x00]));

  const now = new Date();
  chunks.push(Buffer.from(`${now.toLocaleTimeString('it-IT')}\n`, 'ascii'));
  chunks.push(Buffer.from('----------------------------\n', 'ascii'));

  for (const p of prodotti) {
    chunks.push(Buffer.from([ESC, 0x45, 0x01]));
    chunks.push(Buffer.from(`${p.quantita}x ${p.nome}\n`, 'ascii'));
    chunks.push(Buffer.from([ESC, 0x45, 0x00]));
    if (p.nota) {
      chunks.push(Buffer.from(`  >> ${p.nota}\n`, 'ascii'));
    }
  }

  chunks.push(Buffer.from('\n\n\n', 'ascii'));
  chunks.push(Buffer.from([0x1d, 0x56, 0x01]));

  return Buffer.concat(chunks);
}

async function inviaBytesStampante(ip: string, porta: number, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Timeout connessione a ${ip}:${porta}`));
    }, 5000);

    socket.connect(porta, ip, () => {
      socket.write(data, (err) => {
        clearTimeout(timeout);
        socket.end();
        if (err) reject(err);
        else resolve();
      });
    });

    socket.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export async function stampaScontrino(
  ip: string,
  porta: number,
  prodotti: ProdottoFiscale[],
  metodo: string,
  totale: number
): Promise<void> {
  const data = buildScontrinoEscPos(prodotti, metodo, totale);
  await inviaBytesStampante(ip, porta, data);
}

export async function stampaComanda(
  ip: string,
  porta: number,
  prodotti: { nome: string; quantita: number; nota?: string }[],
  tavolo?: string
): Promise<void> {
  const data = buildComanda(tavolo, prodotti);
  await inviaBytesStampante(ip, porta, data);
}

export async function apriCassetto(ip: string, porta: number): Promise<void> {
  // Comando ESC/POS apertura cassetto
  const data = Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);
  await inviaBytesStampante(ip, porta, data);
}

export async function zReport(ip: string, porta: number): Promise<void> {
  // Comando Z-Report per Epson FP-81 (fiscal close day)
  const data = Buffer.from([0x1b, 0x7a, 0x01]);
  await inviaBytesStampante(ip, porta, data);
}

export async function testConnessione(ip: string, porta: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 3000);

    socket.connect(porta, ip, () => {
      clearTimeout(timeout);
      socket.end();
      resolve(true);
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}
