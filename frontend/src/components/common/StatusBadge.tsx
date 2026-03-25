import React from 'react';
import { StatusDocumento } from '../../types';

const statusConfig: Record<StatusDocumento, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
  processando: { label: 'Processando', className: 'bg-blue-100 text-blue-800' },
  concluido: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
  erro: { label: 'Erro', className: 'bg-red-100 text-red-800' },
};

export default function StatusBadge({ status }: { status: StatusDocumento }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
