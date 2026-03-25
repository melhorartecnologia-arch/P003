import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Download } from 'lucide-react';
import { documentsService } from '../services/documents.service';
import { Documento, ESTADOS_UF } from '../types';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [tipoDiario, setTipoDiario] = useState('');
  const [estadoUf, setEstadoUf] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [results, setResults] = useState<Documento[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (p = 1) => {
    if (!query.trim()) return;
    setSearching(true);
    setPage(p);
    try {
      const result = await documentsService.search({
        q: query,
        tipo_diario: tipoDiario || undefined,
        estado_uf: estadoUf || undefined,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        page: p,
        limit: 20,
      });
      setResults(result.data);
      setTotal(result.total);
      setSearched(true);
    } catch {
      // error handled silently
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Busca de Documentos</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar no conteúdo dos documentos..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={searching || !query.trim()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={tipoDiario}
            onChange={(e) => setTipoDiario(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Tipo: Todos</option>
            <option value="DOU">DOU - Federal</option>
            <option value="DOE">DOE - Estadual</option>
          </select>
          <select
            value={estadoUf}
            onChange={(e) => setEstadoUf(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Estado: Todos</option>
            {ESTADOS_UF.map((uf) => (
              <option key={uf.sigla} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>
            ))}
          </select>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            placeholder="Data início"
          />
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            placeholder="Data fim"
          />
        </div>
      </div>

      {searched && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <p className="text-sm text-gray-600">
              {total} resultado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhum resultado encontrado</div>
          ) : (
            <div className="divide-y">
              {results.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link to={`/documentos/${doc.id}`} className="text-primary-600 hover:underline font-medium">
                        {doc.titulo}
                      </Link>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{doc.tipo_diario}{doc.estado_uf && ` - ${doc.estado_uf}`}</span>
                        <span>{new Date(doc.data_publicacao).toLocaleDateString('pt-BR')}</span>
                        <span>{doc.formato_arquivo}</span>
                        <StatusBadge status={doc.status} />
                        {doc.relevancia && (
                          <span className="text-primary-600">Relevância: {(doc.relevancia * 100).toFixed(0)}%</span>
                        )}
                      </div>
                      {doc.destaque && (
                        <p
                          className="text-sm text-gray-600 mt-2 line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: doc.destaque }}
                        />
                      )}
                    </div>
                    <a
                      href={documentsService.getDownloadUrl(doc.id)}
                      className="ml-4 text-gray-400 hover:text-primary-600"
                      title="Download"
                    >
                      <Download size={18} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination page={page} total={total} limit={20} onPageChange={(p) => handleSearch(p)} />
        </div>
      )}
    </div>
  );
}
