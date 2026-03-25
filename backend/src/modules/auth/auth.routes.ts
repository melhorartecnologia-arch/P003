import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from './auth.service';
import { auditService } from '../audit/audit.service';

const router = Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('E-mail inválido'),
    body('senha').notEmpty().withMessage('Senha é obrigatória'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, senha } = req.body;
      const result = await authService.login(email, senha);

      await auditService.log({
        usuarioId: result.user.id,
        acao: 'login',
        detalhes: { email },
        ipOrigem: req.ip || req.socket.remoteAddress || 'unknown',
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token é obrigatório'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
