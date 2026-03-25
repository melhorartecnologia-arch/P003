# Sistema de Gestão de Documentos Oficiais

Sistema web para upload, processamento, classificação e consulta de documentos oficiais publicados no Diário Oficial da União (DOU) e nos Diários Oficiais dos Estados (DOE).

## Stack Tecnológica

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL 16 (full-text search em português)
- **Fila**: BullMQ + Redis (processamento assíncrono de arquivos)

## Funcionalidades

- Upload de documentos PDF, Word (.docx) e Excel (.xlsx)
- Extração automática de conteúdo textual (PDF parse, Mammoth, SheetJS)
- Busca full-text em português com ranking de relevância
- Classificação por tipo (DOU/DOE), UF, seção e órgão emissor
- Autenticação JWT com três perfis: Admin, Operador, Consulta
- Auditoria completa de todas as ações
- Detecção de duplicatas via hash SHA-256
- Exclusão lógica de documentos

## Pré-requisitos

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

## Início Rápido

**Backend:**
```bash
cd backend
cp .env.example .env
npm install
npm run migration:run
npm run migration:seed
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Credenciais Padrão

- **Email**: admin@sistema.gov.br
- **Senha**: admin123

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh token |
| POST | `/api/v1/documentos/upload` | Upload de documento |
| GET | `/api/v1/documentos` | Listar documentos |
| GET | `/api/v1/documentos/:id` | Detalhes do documento |
| GET | `/api/v1/documentos/:id/download` | Download do arquivo |
| PUT | `/api/v1/documentos/:id` | Atualizar metadados |
| DELETE | `/api/v1/documentos/:id` | Exclusão lógica |
| GET | `/api/v1/documentos/busca` | Busca full-text |
| POST | `/api/v1/usuarios` | Criar usuário (admin) |
| GET | `/api/v1/usuarios` | Listar usuários (admin) |
| PUT | `/api/v1/usuarios/:id` | Atualizar usuário (admin) |
| GET | `/api/v1/audit` | Logs de auditoria (admin) |

## Estrutura do Projeto

```
├── backend/
│   ├── src/
│   │   ├── config/          # Configurações (DB, Redis, JWT)
│   │   ├── common/          # Guards, filters, interceptors
│   │   ├── modules/
│   │   │   ├── auth/        # Autenticação JWT
│   │   │   ├── users/       # Gestão de usuários
│   │   │   ├── documents/   # Documentos + Worker de processamento
│   │   │   └── audit/       # Logs de auditoria
│   │   └── database/        # Migrations e seeds
│   └── database/        # Migrations e seeds
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # Serviços de API
│   │   ├── contexts/        # Contextos React (Auth)
│   │   └── types/           # Tipos TypeScript
│   └── package.json
```
