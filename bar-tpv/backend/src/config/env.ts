import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'supersegreto',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh-supersegreto',
  epsonIp: process.env.EPSON_FP81_IP ?? '127.0.0.1',
  epsonPort: Number(process.env.EPSON_FP81_PORT ?? 9100),
  cucinaPrinterIp: process.env.CUCINA_PRINTER_IP ?? '127.0.0.1',
  barPrinterIp: process.env.BAR_PRINTER_IP ?? '127.0.0.1'
};
