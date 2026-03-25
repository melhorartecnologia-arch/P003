import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/database';
import { config } from '../../config';
import { AppError } from '../../common/filters/error.filter';
import { AuthPayload } from '../../common/guards/auth.guard';

export class AuthService {
  async login(email: string, senha: string) {
    const result = await query(
      'SELECT id, nome, email, senha_hash, perfil, ativo FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError(401, 'Credenciais inválidas');
    }

    const user = result.rows[0];

    if (!user.ativo) {
      throw new AppError(403, 'Usuário desativado');
    }

    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      throw new AppError(401, 'Credenciais inválidas');
    }

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      perfil: user.perfil,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as string,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as AuthPayload;

      const result = await query(
        'SELECT id, email, perfil, ativo FROM usuarios WHERE id = $1',
        [payload.userId]
      );

      if (result.rows.length === 0 || !result.rows[0].ativo) {
        throw new AppError(401, 'Token inválido');
      }

      const user = result.rows[0];
      const newPayload: AuthPayload = {
        userId: user.id,
        email: user.email,
        perfil: user.perfil,
      };

      const accessToken = jwt.sign(newPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn as string,
      });

      return { accessToken };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(401, 'Refresh token inválido ou expirado');
    }
  }
}

export const authService = new AuthService();
