export type TipoDiario = 'DOU' | 'DOE';
export type FormatoArquivo = 'PDF' | 'DOCX' | 'XLSX';
export type StatusDocumento = 'pendente' | 'processando' | 'concluido' | 'erro';
export type PerfilUsuario = 'admin' | 'operador' | 'consulta';

export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  criado_em: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Documento {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo_diario: TipoDiario;
  estado_uf: string | null;
  formato_arquivo: FormatoArquivo;
  tamanho_bytes: number;
  data_publicacao: string;
  secao: string | null;
  orgao_emissor: string | null;
  status: StatusDocumento;
  usuario_nome: string;
  criado_em: string;
  conteudo_texto?: string;
  relevancia?: number;
  destaque?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditLog {
  id: number;
  usuario_id: string;
  usuario_nome: string;
  usuario_email: string;
  acao: string;
  documento_id: string | null;
  detalhes: Record<string, unknown>;
  ip_origem: string;
  criado_em: string;
}

export const ESTADOS_UF = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];
