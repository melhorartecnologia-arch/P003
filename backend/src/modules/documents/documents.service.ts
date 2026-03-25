import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { query } from '../../config/database';
import { AppError } from '../../common/filters/error.filter';
import { config } from '../../config';

export interface CreateDocumentDto {
  titulo: string;
  descricao?: string;
  tipo_diario: 'DOU' | 'DOE';
  estado_uf?: string;
  data_publicacao: string;
  secao?: string;
  orgao_emissor?: string;
}

export interface DocumentFilters {
  tipo_diario?: 'DOU' | 'DOE';
  estado_uf?: string;
  data_inicio?: string;
  data_fim?: string;
  orgao_emissor?: string;
  formato_arquivo?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface SearchParams {
  q: string;
  tipo_diario?: 'DOU' | 'DOE';
  estado_uf?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
}

const ESTADOS_VALIDOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

function getFormatoArquivo(mimetype: string): 'PDF' | 'DOCX' | 'XLSX' {
  const map: Record<string, 'PDF' | 'DOCX' | 'XLSX'> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  };
  const formato = map[mimetype];
  if (!formato) throw new AppError(400, 'Formato de arquivo não suportado');
  return formato;
}

export class DocumentsService {
  async upload(
    file: Express.Multer.File,
    dto: CreateDocumentDto,
    usuarioId: string
  ) {
    if (dto.tipo_diario === 'DOE' && !dto.estado_uf) {
      throw new AppError(400, 'UF é obrigatória para Diário Oficial Estadual');
    }

    if (dto.estado_uf && !ESTADOS_VALIDOS.includes(dto.estado_uf.toUpperCase())) {
      throw new AppError(400, 'UF inválida');
    }

    const fileBuffer = fs.readFileSync(file.path);
    const hashSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const existing = await query(
      'SELECT id FROM documentos WHERE hash_sha256 = $1 AND excluido = FALSE',
      [hashSha256]
    );
    if (existing.rows.length > 0) {
      fs.unlinkSync(file.path);
      throw new AppError(409, 'Arquivo duplicado já existe no sistema', {
        documento_id: existing.rows[0].id,
      });
    }

    const formato = getFormatoArquivo(file.mimetype);

    const result = await query(
      `INSERT INTO documentos (
        titulo, descricao, tipo_diario, estado_uf, formato_arquivo,
        caminho_arquivo, tamanho_bytes, hash_sha256, data_publicacao,
        secao, orgao_emissor, status, usuario_upload_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pendente', $12)
      RETURNING *`,
      [
        dto.titulo,
        dto.descricao || null,
        dto.tipo_diario,
        dto.estado_uf ? dto.estado_uf.toUpperCase() : null,
        formato,
        file.path,
        file.size,
        hashSha256,
        dto.data_publicacao,
        dto.secao || null,
        dto.orgao_emissor || null,
        usuarioId,
      ]
    );

    return result.rows[0];
  }

  async findAll(filters: DocumentFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['d.excluido = FALSE'];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (filters.tipo_diario) {
      conditions.push(`d.tipo_diario = $${paramIdx++}`);
      params.push(filters.tipo_diario);
    }
    if (filters.estado_uf) {
      conditions.push(`d.estado_uf = $${paramIdx++}`);
      params.push(filters.estado_uf.toUpperCase());
    }
    if (filters.data_inicio) {
      conditions.push(`d.data_publicacao >= $${paramIdx++}`);
      params.push(filters.data_inicio);
    }
    if (filters.data_fim) {
      conditions.push(`d.data_publicacao <= $${paramIdx++}`);
      params.push(filters.data_fim);
    }
    if (filters.orgao_emissor) {
      conditions.push(`d.orgao_emissor ILIKE $${paramIdx++}`);
      params.push(`%${filters.orgao_emissor}%`);
    }
    if (filters.formato_arquivo) {
      conditions.push(`d.formato_arquivo = $${paramIdx++}`);
      params.push(filters.formato_arquivo);
    }
    if (filters.status) {
      conditions.push(`d.status = $${paramIdx++}`);
      params.push(filters.status);
    }

    const where = conditions.join(' AND ');

    const countParams = [...params];
    params.push(limit, offset);

    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT d.id, d.titulo, d.descricao, d.tipo_diario, d.estado_uf,
                d.formato_arquivo, d.tamanho_bytes, d.data_publicacao,
                d.secao, d.orgao_emissor, d.status, d.criado_em,
                u.nome as usuario_nome
         FROM documentos d
         JOIN usuarios u ON u.id = d.usuario_upload_id
         WHERE ${where}
         ORDER BY d.data_publicacao DESC, d.criado_em DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
        params
      ),
      query(`SELECT COUNT(*) FROM documentos d WHERE ${where}`, countParams),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    };
  }

  async findById(id: string) {
    const result = await query(
      `SELECT d.*, u.nome as usuario_nome, u.email as usuario_email
       FROM documentos d
       JOIN usuarios u ON u.id = d.usuario_upload_id
       WHERE d.id = $1 AND d.excluido = FALSE`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Documento não encontrado');
    }

    return result.rows[0];
  }

  async getFilePath(id: string) {
    const doc = await this.findById(id);
    const filePath = doc.caminho_arquivo;

    if (!fs.existsSync(filePath)) {
      throw new AppError(404, 'Arquivo não encontrado no servidor');
    }

    return {
      path: filePath,
      filename: `${doc.titulo}.${doc.formato_arquivo.toLowerCase()}`,
      mimetype: this.getMimeType(doc.formato_arquivo),
    };
  }

  async update(id: string, dto: Partial<CreateDocumentDto>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (dto.titulo !== undefined) {
      fields.push(`titulo = $${paramIdx++}`);
      values.push(dto.titulo);
    }
    if (dto.descricao !== undefined) {
      fields.push(`descricao = $${paramIdx++}`);
      values.push(dto.descricao);
    }
    if (dto.tipo_diario !== undefined) {
      fields.push(`tipo_diario = $${paramIdx++}`);
      values.push(dto.tipo_diario);
    }
    if (dto.estado_uf !== undefined) {
      fields.push(`estado_uf = $${paramIdx++}`);
      values.push(dto.estado_uf ? dto.estado_uf.toUpperCase() : null);
    }
    if (dto.data_publicacao !== undefined) {
      fields.push(`data_publicacao = $${paramIdx++}`);
      values.push(dto.data_publicacao);
    }
    if (dto.secao !== undefined) {
      fields.push(`secao = $${paramIdx++}`);
      values.push(dto.secao);
    }
    if (dto.orgao_emissor !== undefined) {
      fields.push(`orgao_emissor = $${paramIdx++}`);
      values.push(dto.orgao_emissor);
    }

    if (fields.length === 0) {
      throw new AppError(400, 'Nenhum campo para atualizar');
    }

    values.push(id);

    const result = await query(
      `UPDATE documentos SET ${fields.join(', ')}
       WHERE id = $${paramIdx} AND excluido = FALSE
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Documento não encontrado');
    }

    return result.rows[0];
  }

  async delete(id: string) {
    const result = await query(
      `UPDATE documentos SET excluido = TRUE WHERE id = $1 AND excluido = FALSE RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Documento não encontrado');
    }

    return { message: 'Documento excluído com sucesso' };
  }

  async search(params: SearchParams) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['d.excluido = FALSE'];
    const queryParams: unknown[] = [];
    let paramIdx = 1;

    conditions.push(`d.ts_conteudo @@ plainto_tsquery('portuguese', $${paramIdx++})`);
    queryParams.push(params.q);

    if (params.tipo_diario) {
      conditions.push(`d.tipo_diario = $${paramIdx++}`);
      queryParams.push(params.tipo_diario);
    }
    if (params.estado_uf) {
      conditions.push(`d.estado_uf = $${paramIdx++}`);
      queryParams.push(params.estado_uf.toUpperCase());
    }
    if (params.data_inicio) {
      conditions.push(`d.data_publicacao >= $${paramIdx++}`);
      queryParams.push(params.data_inicio);
    }
    if (params.data_fim) {
      conditions.push(`d.data_publicacao <= $${paramIdx++}`);
      queryParams.push(params.data_fim);
    }

    const where = conditions.join(' AND ');
    const tsQueryParam = `plainto_tsquery('portuguese', $1)`;

    const countParams = [...queryParams];
    queryParams.push(limit, offset);

    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT d.id, d.titulo, d.descricao, d.tipo_diario, d.estado_uf,
                d.formato_arquivo, d.data_publicacao, d.secao, d.orgao_emissor,
                d.status, d.criado_em,
                ts_rank(d.ts_conteudo, ${tsQueryParam}) AS relevancia,
                ts_headline('portuguese', d.conteudo_texto, ${tsQueryParam},
                  'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20') AS destaque
         FROM documentos d
         WHERE ${where}
         ORDER BY relevancia DESC, d.data_publicacao DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
        queryParams
      ),
      query(`SELECT COUNT(*) FROM documentos d WHERE ${where}`, countParams),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    };
  }

  private getMimeType(formato: string): string {
    const map: Record<string, string> = {
      PDF: 'application/pdf',
      DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    return map[formato] || 'application/octet-stream';
  }
}

export const documentsService = new DocumentsService();
