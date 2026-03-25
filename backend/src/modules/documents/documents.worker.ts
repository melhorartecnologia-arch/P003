import { Worker, Job } from 'bullmq';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { redis } from '../../config/redis';
import { query } from '../../config/database';
import { logger } from '../../config/logger';

interface ProcessJobData {
  documentoId: string;
  filePath: string;
  formato: 'PDF' | 'DOCX' | 'XLSX';
}

async function extractText(filePath: string, formato: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);

  switch (formato) {
    case 'PDF': {
      const pdfData = await pdfParse(buffer);
      return pdfData.text;
    }
    case 'DOCX': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case 'XLSX': {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const texts: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        texts.push(`[${sheetName}]\n${csv}`);
      }
      return texts.join('\n\n');
    }
    default:
      throw new Error(`Formato não suportado: ${formato}`);
  }
}

async function processDocument(job: Job<ProcessJobData>) {
  const { documentoId, filePath, formato } = job.data;

  logger.info(`Processing document ${documentoId} (${formato})`);

  await query(
    "UPDATE documentos SET status = 'processando' WHERE id = $1",
    [documentoId]
  );

  try {
    const texto = await extractText(filePath, formato);

    await query(
      `UPDATE documentos
       SET conteudo_texto = $1, status = 'concluido'
       WHERE id = $2`,
      [texto, documentoId]
    );

    logger.info(`Document ${documentoId} processed successfully`);
  } catch (err) {
    logger.error(`Error processing document ${documentoId}:`, err);

    await query(
      "UPDATE documentos SET status = 'erro' WHERE id = $1",
      [documentoId]
    );

    throw err;
  }
}

export function startWorker() {
  const worker = new Worker('document-processing', processDocument, {
    connection: redis,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed for document ${job.data.documentoId}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err);
  });

  logger.info('Document processing worker started');

  return worker;
}
