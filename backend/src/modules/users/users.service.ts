import bcrypt from 'bcryptjs';
import { query } from '../../config/database';
import { AppError } from '../../common/filters/error.filter';

export interface CreateUserDto {
  nome: string;
  email: string;
  senha: string;
  perfil: 'admin' | 'operador' | 'consulta';
}

export interface UpdateUserDto {
  nome?: string;
  email?: string;
  perfil?: 'admin' | 'operador' | 'consulta';
  ativo?: boolean;
}

export class UsersService {
  async create(dto: CreateUserDto) {
    const existing = await query('SELECT id FROM usuarios WHERE email = $1', [dto.email]);
    if (existing.rows.length > 0) {
      throw new AppError(409, 'E-mail já cadastrado');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 12);

    const result = await query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, email, perfil, ativo, criado_em`,
      [dto.nome, dto.email, senhaHash, dto.perfil]
    );

    return result.rows[0];
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT id, nome, email, perfil, ativo, criado_em
         FROM usuarios
         ORDER BY criado_em DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      query('SELECT COUNT(*) FROM usuarios'),
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
      'SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    return result.rows[0];
  }

  async update(id: string, dto: UpdateUserDto) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (dto.nome !== undefined) {
      fields.push(`nome = $${paramIdx++}`);
      values.push(dto.nome);
    }
    if (dto.email !== undefined) {
      fields.push(`email = $${paramIdx++}`);
      values.push(dto.email);
    }
    if (dto.perfil !== undefined) {
      fields.push(`perfil = $${paramIdx++}`);
      values.push(dto.perfil);
    }
    if (dto.ativo !== undefined) {
      fields.push(`ativo = $${paramIdx++}`);
      values.push(dto.ativo);
    }

    if (fields.length === 0) {
      throw new AppError(400, 'Nenhum campo para atualizar');
    }

    values.push(id);

    const result = await query(
      `UPDATE usuarios SET ${fields.join(', ')}
       WHERE id = $${paramIdx}
       RETURNING id, nome, email, perfil, ativo, criado_em`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    return result.rows[0];
  }
}

export const usersService = new UsersService();
