import React, { useEffect, useState } from 'react';
import { auditService, AuditFilters } from '../services/audit.service';
import { AuditLog } from '../types';
import Pagination from '../components/common/Pagination';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({});

  useEffect(() => {
    setLoading(true);
    auditService
      .list({ ...filters, page, limit: 50 })
      .then((result) => {
        setLogs(result.data);
        setTotal(result.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters, page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const acaoColors: Record<string, string> = {
    login: 'bg-blue-100 text-blue-800',
    upload: 'bg-green-100 text-green-800',
    download: 'bg-purple-100 text-purple-800',
    atualizacao: 'bg-yellow-100 text-yellow-800',
    exclusao: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Auditoria</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ação</label>
          <select
            value={filters.acao || ''}
            onChange={(e) => handleFilterChange('acao', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Todas</option>
            <option value="login">Login</option>
            <option value="upload">Upload</option>
            <option value="download">Download</option>
            <option value="atualizacao">Atualização</option>
            <option value="exclusao">Exclusão</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Data Início</label>
          <input
            type="date"
            value={filters.data_inicio || ''}
            onChange={(e) => handleFilterChange('data_inicio', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Data Fim</label>
          <input
            type="date"
            value={filters.data_fim || ''}
            onChange={(e) => handleFilterChange('data_fim', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Data/Hora</th>
                  <th className="text-left p-3">Usuário</th>
                  <th className="text-left p-3">Ação</th>
                  <th className="text-left p-3">IP</th>
                  <th className="text-left p-3">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.criado_em).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{log.usuario_nome}</p>
                        <p className="text-xs text-gray-400">{log.usuario_email}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${acaoColors[log.acao] || 'bg-gray-100 text-gray-800'}`}>
                        {log.acao}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 font-mono text-xs">{log.ip_origem}</td>
                    <td className="p-3 text-xs text-gray-500 max-w-xs truncate">
                      {log.detalhes ? JSON.stringify(log.detalhes) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} total={total} limit={50} onPageChange={setPage} />
      </div>
    </div>
  );
}
