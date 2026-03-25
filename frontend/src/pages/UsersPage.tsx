import React, { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersService } from '../services/users.service';
import { User } from '../types';
import Pagination from '../components/common/Pagination';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '', perfil: 'consulta' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await usersService.list(page, 20);
      setUsers(result.data);
      setTotal(result.total);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersService.create(formData);
      toast.success('Usuário criado com sucesso!');
      setShowForm(false);
      setFormData({ nome: '', email: '', senha: '', perfil: 'consulta' });
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao criar usuário');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await usersService.update(user.id, { ativo: !user.ativo });
      toast.success(`Usuário ${user.ativo ? 'desativado' : 'ativado'}`);
      loadUsers();
    } catch {
      toast.error('Erro ao atualizar usuário');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <UserPlus size={16} /> Novo Usuário
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateUser} className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Criar Usuário</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                required
                minLength={8}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
              <select
                value={formData.perfil}
                onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="admin">Administrador</option>
                <option value="operador">Operador</option>
                <option value="consulta">Consulta</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Criar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">E-mail</th>
                <th className="text-left p-3">Perfil</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Criado em</th>
                <th className="text-left p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{user.nome}</td>
                  <td className="p-3 text-gray-500">{user.email}</td>
                  <td className="p-3">
                    <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs">{user.perfil}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${user.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{new Date(user.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      {user.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      </div>
    </div>
  );
}
