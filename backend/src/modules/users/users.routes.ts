import { Router, Response, NextFunction } from 'express';
import { body, validationResult, param, query as queryValidator } from 'express-validator';
import { usersService } from './users.service';
import { authGuard, roleGuard, AuthRequest } from '../../common/guards/auth.guard';

const router = Router();

router.use(authGuard);

router.post(
  '/',
  roleGuard('admin'),
  [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('E-mail inválido'),
    body('senha').isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres'),
    body('perfil').isIn(['admin', 'operador', 'consulta']).withMessage('Perfil inválido'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      const user = await usersService.create(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/',
  roleGuard('admin'),
  [
    queryValidator('page').optional().isInt({ min: 1 }),
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await usersService.findAll(page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id',
  roleGuard('admin'),
  [param('id').isUUID()],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await usersService.findById(req.params.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  roleGuard('admin'),
  [
    param('id').isUUID(),
    body('nome').optional().notEmpty(),
    body('email').optional().isEmail(),
    body('perfil').optional().isIn(['admin', 'operador', 'consulta']),
    body('ativo').optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      const user = await usersService.update(req.params.id, req.body);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
