import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsService } from '../services/documents.service';
import { Documento } from '../types';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/common/StatusBadge';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    documentsService
      .getById(id)
      .then(setDoc)
      .catch(() => toast.error('Documento não encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id || !confirm('Tem certeza que deseja excluir este documento?')) return;
    try {
      await documentsService.delete(id);
      toast.success('Documento excluído');
      navigate('/documentos');
    } catch {
      toast.error('Erro ao excluir documento');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;
  if (!doc) return <div className="p-8 text-center text-gray-500">Documento não encontrado</div>;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{doc.titulo}</h1>
            {doc.descricao && <p className="text-gray-500 mt-1">{doc.descricao}</p>}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={documentsService.getDownloadUrl(doc.id)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Download size={16} /> Download
            </a>
            {hasRole('admin') && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 size={16} /> Excluir
              </button>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoRow label="Tipo de Diário" value={doc.tipo_diario === 'DOU' ? 'Diário Oficial da União' : 'Diário Oficial Estadual'} />
          {doc.estado_uf && <InfoRow label="Estado" value={doc.estado_uf} />}
          <InfoRow label="Data de Publicação" value={new Date(doc.data_publicacao).toLocaleDateString('pt-BR')} />
          <InfoRow label="Formato" value={doc.formato_arquivo} />
          <InfoRow label="Tamanho" value={`${(doc.tamanho_bytes / (1024 * 1024)).toFixed(2)} MB`} />
          <InfoRow label="Status" value={<StatusBadge status={doc.status} />} />
          {doc.secao && <InfoRow label="Seção" value={doc.secao} />}
          {doc.orgao_emissor && <InfoRow label="Órgão Emissor" value={doc.orgao_emissor} />}
          <InfoRow label="Enviado por" value={doc.usuario_nome} />
          <InfoRow label="Data de Upload" value={new Date(doc.criado_em).toLocaleString('pt-BR')} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <p className="text-sm text-gray-900 mt-1">{value}</p>
    </div>
  );
}
