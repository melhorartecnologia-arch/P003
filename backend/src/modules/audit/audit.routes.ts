import { Router, Response, NextFunction } from 'express';
import { auditService } from './audit.service';
import { authGuard, roleGuard, AuthRequest } from '../../common/guards/auth.guard';

const router = Router();

router.use(authGuard);
router.use(roleGuard('admin'));

router.get(
  '/',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await auditService.findAll({
        usuario_id: req.query.usuario_id as string | undefined,
        acao: req.query.acao as string | undefined,
        data_inicio: req.query.data_inicio as string | undefined,
        data_fim: req.query.data_fim as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
