import { query } from '../../config/database';

export interface AuditLogDto {
  usuarioId: string;
  acao: string;
  documentoId?: string;
  detalhes?: Record<string, unknown>;
  ipOrigem: string;
}

export interface AuditFilters {
  usuario_id?: string;
  acao?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
}

export class AuditService {
  async log(dto: AuditLogDto) {
    await query(
      `INSERT INTO logs_auditoria (usuario_id, acao, documento_id, detalhes, ip_origem)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        dto.usuarioId,
        dto.acao,
        dto.documentoId || null,
        dto.detalhes ? JSON.stringify(dto.detalhes) : null,
        dto.ipOrigem,
      ]
    );
  }

  async findAll(filters: AuditFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (filters.usuario_id) {
      conditions.push(`l.usuario_id = $${paramIdx++}`);
      params.push(filters.usuario_id);
    }
    if (filters.acao) {
      conditions.push(`l.acao = $${paramIdx++}`);
      params.push(filters.acao);
    }
    if (filters.data_inicio) {
      conditions.push(`l.criado_em >= $${paramIdx++}`);
      params.push(filters.data_inicio);
    }
    if (filters.data_fim) {
      conditions.push(`l.criado_em <= $${paramIdx++}`);
      params.push(filters.data_fim);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countParams = [...params];
    params.push(limit, offset);

    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT l.*, u.nome as usuario_nome, u.email as usuario_email
         FROM logs_auditoria l
         LEFT JOIN usuarios u ON u.id = l.usuario_id
         ${where}
         ORDER BY l.criado_em DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
        params
      ),
      query(`SELECT COUNT(*) FROM logs_auditoria l ${where}`, countParams),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    };
  }
}

export const auditService = new AuditService();
