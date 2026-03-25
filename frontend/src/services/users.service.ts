import api from './api';
import { User, PaginatedResponse } from '../types';

export const usersService = {
  async list(page = 1, limit = 20): Promise<PaginatedResponse<User>> {
    const { data } = await api.get<PaginatedResponse<User>>('/usuarios', {
      params: { page, limit },
    });
    return data;
  },

  async create(body: { nome: string; email: string; senha: string; perfil: string }): Promise<User> {
    const { data } = await api.post<User>('/usuarios', body);
    return data;
  },

  async update(id: string, body: Partial<User>): Promise<User> {
    const { data } = await api.put<User>(`/usuarios/${id}`, body);
    return data;
  },
};
