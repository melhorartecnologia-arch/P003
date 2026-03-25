import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsService } from '../services/documents.service';
import { ESTADOS_UF, TipoDiario } from '../types';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoDiario, setTipoDiario] = useState<TipoDiario>('DOU');
  const [estadoUf, setEstadoUf] = useState('');
  const [dataPublicacao, setDataPublicacao] = useState('');
  const [secao, setSecao] = useState('');
  const [orgaoEmissor, setOrgaoEmissor] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Formato não permitido. Aceitos: PDF, DOCX, XLSX');
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('Arquivo excede o limite de 50 MB');
        return;
      }
      setFile(selectedFile);
      if (!titulo) setTitulo(selectedFile.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Selecione um arquivo');
      return;
    }

    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('titulo', titulo);
    formData.append('descricao', descricao);
    formData.append('tipo_diario', tipoDiario);
    if (tipoDiario === 'DOE' && estadoUf) formData.append('estado_uf', estadoUf);
    formData.append('data_publicacao', dataPublicacao);
    if (secao) formData.append('secao', secao);
    if (orgaoEmissor) formData.append('orgao_emissor', orgaoEmissor);

    setUploading(true);
    setProgress(0);

    try {
      const doc = await documentsService.upload(formData);
      toast.success('Documento enviado com sucesso!');
      navigate(`/documentos/${doc.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao enviar documento';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload de Documento</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* File Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText size={24} className="text-primary-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div>
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Clique para selecionar ou arraste um arquivo</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX ou XLSX (máx. 50 MB)</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Classification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Diário *</label>
            <select
              value={tipoDiario}
              onChange={(e) => setTipoDiario(e.target.value as TipoDiario)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="DOU">DOU - Diário Oficial da União</option>
              <option value="DOE">DOE - Diário Oficial Estadual</option>
            </select>
          </div>

          {tipoDiario === 'DOE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
              <select
                value={estadoUf}
                onChange={(e) => setEstadoUf(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Selecione...</option>
                {ESTADOS_UF.map((uf) => (
                  <option key={uf.sigla} value={uf.sigla}>{uf.sigla} - {uf.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Publicação *</label>
            <input
              type="date"
              value={dataPublicacao}
              onChange={(e) => setDataPublicacao(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seção</label>
            <input
              type="text"
              value={secao}
              onChange={(e) => setSecao(e.target.value)}
              placeholder="Ex: Seção 1"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Órgão Emissor</label>
          <input
            type="text"
            value={orgaoEmissor}
            onChange={(e) => setOrgaoEmissor(e.target.value)}
            placeholder="Nome do órgão responsável"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file}
          className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium transition-colors"
        >
          {uploading ? 'Enviando...' : 'Enviar Documento'}
        </button>
      </form>
    </div>
  );
}
