import api from './api';
import { AuditLog, PaginatedResponse } from '../types';

export interface AuditFilters {
  usuario_id?: string;
  acao?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
}

export const auditService = {
  async list(filters: AuditFilters = {}): Promise<PaginatedResponse<AuditLog>> {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    );
    const { data } = await api.get<PaginatedResponse<AuditLog>>('/audit', { params });
    return data;
  },
};
