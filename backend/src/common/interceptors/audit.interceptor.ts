import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../guards/auth.guard';
import { auditService } from '../../modules/audit/audit.service';

export function auditInterceptor(acao: string, getDocumentoId?: (req: Request) => string | undefined) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.json.bind(res);

    res.json = function (body: unknown) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const documentoId = getDocumentoId ? getDocumentoId(req) : undefined;
        auditService.log({
          usuarioId: req.user.userId,
          acao,
          documentoId,
          detalhes: { method: req.method, path: req.path },
          ipOrigem: req.ip || req.socket.remoteAddress || 'unknown',
        }).catch(err => console.error('Audit log error:', err));
      }
      return originalSend(body);
    } as typeof res.json;

    next();
  };
}
