import api from './api';
import { Documento, PaginatedResponse } from '../types';

export interface DocumentFilters {
  tipo_diario?: string;
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
  tipo_diario?: string;
  estado_uf?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
}

export const documentsService = {
  async list(filters: DocumentFilters = {}): Promise<PaginatedResponse<Documento>> {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    );
    const { data } = await api.get<PaginatedResponse<Documento>>('/documentos', { params });
    return data;
  },

  async getById(id: string): Promise<Documento> {
    const { data } = await api.get<Documento>(`/documentos/${id}`);
    return data;
  },

  async upload(formData: FormData): Promise<Documento> {
    const { data } = await api.post<Documento>('/documentos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async update(id: string, body: Partial<Documento>): Promise<Documento> {
    const { data } = await api.put<Documento>(`/documentos/${id}`, body);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documentos/${id}`);
  },

  async search(params: SearchParams): Promise<PaginatedResponse<Documento>> {
    const queryParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    );
    const { data } = await api.get<PaginatedResponse<Documento>>('/documentos/busca', {
      params: queryParams,
    });
    return data;
  },

  getDownloadUrl(id: string): string {
    return `/api/v1/documentos/${id}/download`;
  },
};
