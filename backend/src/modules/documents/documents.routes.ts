import { Router, Response, NextFunction } from 'express';
import { body, param, query as qv, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { documentsService } from './documents.service';
import { authGuard, roleGuard, AuthRequest } from '../../common/guards/auth.guard';
import { auditInterceptor } from '../../common/interceptors/audit.interceptor';
import { config } from '../../config';
import { processingQueue } from './documents.queue';

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não permitido. Aceitos: PDF, DOCX, XLSX'));
    }
  },
});

const router = Router();

router.use(authGuard);

// POST /api/v1/documentos/upload
router.post(
  '/upload',
  roleGuard('admin', 'operador'),
  upload.single('arquivo'),
  auditInterceptor('upload'),
  [
    body('titulo').notEmpty().withMessage('Título é obrigatório'),
    body('tipo_diario').isIn(['DOU', 'DOE']).withMessage('Tipo de diário inválido'),
    body('data_publicacao').isDate().withMessage('Data de publicação inválida'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'Arquivo é obrigatório' });
        return;
      }

      const documento = await documentsService.upload(req.file, req.body, req.user!.userId);

      await processingQueue.add('process-document', {
        documentoId: documento.id,
        filePath: documento.caminho_arquivo,
        formato: documento.formato_arquivo,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });

      res.status(201).json(documento);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/documentos/busca
router.get(
  '/busca',
  [
    qv('q').notEmpty().withMessage('Termo de busca é obrigatório'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const result = await documentsService.search({
        q: req.query.q as string,
        tipo_diario: req.query.tipo_diario as 'DOU' | 'DOE' | undefined,
        estado_uf: req.query.estado_uf as string | undefined,
        data_inicio: req.query.data_inicio as string | undefined,
        data_fim: req.query.data_fim as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/documentos
router.get(
  '/',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await documentsService.findAll({
        tipo_diario: req.query.tipo_diario as 'DOU' | 'DOE' | undefined,
        estado_uf: req.query.estado_uf as string | undefined,
        data_inicio: req.query.data_inicio as string | undefined,
        data_fim: req.query.data_fim as string | undefined,
        orgao_emissor: req.query.orgao_emissor as string | undefined,
        formato_arquivo: req.query.formato_arquivo as string | undefined,
        status: req.query.status as string | undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/documentos/:id
router.get(
  '/:id',
  [param('id').isUUID()],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const doc = await documentsService.findById(req.params.id);
      res.json(doc);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/documentos/:id/download
router.get(
  '/:id/download',
  [param('id').isUUID()],
  auditInterceptor('download', (req) => req.params.id),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const file = await documentsService.getFilePath(req.params.id);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('Content-Type', file.mimetype);
      res.sendFile(path.resolve(file.path));
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/documentos/:id
router.put(
  '/:id',
  roleGuard('admin', 'operador'),
  [param('id').isUUID()],
  auditInterceptor('atualizacao', (req) => req.params.id),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const doc = await documentsService.update(req.params.id, req.body);
      res.json(doc);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/documentos/:id
router.delete(
  '/:id',
  roleGuard('admin'),
  [param('id').isUUID()],
  auditInterceptor('exclusao', (req) => req.params.id),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await documentsService.delete(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
