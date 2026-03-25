import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Filter } from 'lucide-react';
import { documentsService, DocumentFilters } from '../services/documents.service';
import { Documento, ESTADOS_UF } from '../types';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Documento[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DocumentFilters>({});

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await documentsService.list({ ...filters, page, limit: 20 });
      setDocuments(result.data);
      setTotal(result.total);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          <Filter size={16} />
          Filtros
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo Diário</label>
            <select
              value={filters.tipo_diario || ''}
              onChange={(e) => handleFilterChange('tipo_diario', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Todos</option>
              <option value="DOU">DOU - Federal</option>
              <option value="DOE">DOE - Estadual</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
            <select
              value={filters.estado_uf || ''}
              onChange={(e) => handleFilterChange('estado_uf', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Todos</option>
              {ESTADOS_UF.map((uf) => (
                <option key={uf.sigla} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>
              ))}
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
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum documento encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Título</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Formato</th>
                  <th className="text-left p-3">Tamanho</th>
                  <th className="text-left p-3">Data Publicação</th>
                  <th className="text-left p-3">Órgão</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <Link to={`/documentos/${doc.id}`} className="text-primary-600 hover:underline font-medium">
                        {doc.titulo}
                      </Link>
                    </td>
                    <td className="p-3">
                      {doc.tipo_diario}
                      {doc.estado_uf && ` - ${doc.estado_uf}`}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{doc.formato_arquivo}</span>
                    </td>
                    <td className="p-3 text-gray-500">{formatSize(doc.tamanho_bytes)}</td>
                    <td className="p-3">{new Date(doc.data_publicacao).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 text-gray-500">{doc.orgao_emissor || '-'}</td>
                    <td className="p-3"><StatusBadge status={doc.status} /></td>
                    <td className="p-3">
                      <a
                        href={documentsService.getDownloadUrl(doc.id)}
                        className="text-primary-600 hover:text-primary-800"
                        title="Download"
                      >
                        <Download size={16} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      </div>
    </div>
  );
}
