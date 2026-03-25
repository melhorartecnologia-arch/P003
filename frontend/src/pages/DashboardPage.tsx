import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Search, Clock } from 'lucide-react';
import { documentsService } from '../services/documents.service';
import { Documento } from '../types';
import StatusBadge from '../components/common/StatusBadge';

export default function DashboardPage() {
  const [recentDocs, setRecentDocs] = useState<Documento[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    documentsService
      .list({ limit: 5, page: 1 })
      .then((res) => {
        setRecentDocs(res.data);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total de Documentos', value: total, icon: FileText, color: 'bg-blue-500' },
    { label: 'Upload', value: 'Enviar', icon: Upload, color: 'bg-green-500', link: '/upload' },
    { label: 'Buscar', value: 'Pesquisar', icon: Search, color: 'bg-purple-500', link: '/busca' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Painel</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <Icon className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
          return stat.link ? (
            <Link key={stat.label} to={stat.link}>{content}</Link>
          ) : (
            <div key={stat.label}>{content}</div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center gap-2">
          <Clock size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Documentos Recentes</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : recentDocs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum documento encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Título</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Data Publicação</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDocs.map((doc) => (
                  <tr key={doc.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <Link to={`/documentos/${doc.id}`} className="text-primary-600 hover:underline">
                        {doc.titulo}
                      </Link>
                    </td>
                    <td className="p-3">
                      {doc.tipo_diario}
                      {doc.estado_uf && ` - ${doc.estado_uf}`}
                    </td>
                    <td className="p-3">{new Date(doc.data_publicacao).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3"><StatusBadge status={doc.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {recentDocs.length > 0 && (
          <div className="p-4 border-t text-center">
            <Link to="/documentos" className="text-primary-600 hover:underline text-sm">
              Ver todos os documentos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
