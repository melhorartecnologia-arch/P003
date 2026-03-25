-- Migration: 001_initial_schema
-- Description: Create initial database schema for official documents system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Custom ENUM types
CREATE TYPE tipo_diario_enum AS ENUM ('DOU', 'DOE');
CREATE TYPE formato_arquivo_enum AS ENUM ('PDF', 'DOCX', 'XLSX');
CREATE TYPE status_documento_enum AS ENUM ('pendente', 'processando', 'concluido', 'erro');
CREATE TYPE perfil_usuario_enum AS ENUM ('admin', 'operador', 'consulta');

-- Table: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil perfil_usuario_enum NOT NULL DEFAULT 'consulta',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_perfil ON usuarios(perfil);

-- Table: documentos
CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(500) NOT NULL,
    descricao TEXT,
    tipo_diario tipo_diario_enum NOT NULL,
    estado_uf CHAR(2),
    formato_arquivo formato_arquivo_enum NOT NULL,
    caminho_arquivo VARCHAR(1000) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    hash_sha256 CHAR(64) NOT NULL,
    conteudo_texto TEXT,
    ts_conteudo TSVECTOR,
    data_publicacao DATE NOT NULL,
    secao VARCHAR(100),
    orgao_emissor VARCHAR(300),
    status status_documento_enum NOT NULL DEFAULT 'pendente',
    usuario_upload_id UUID NOT NULL REFERENCES usuarios(id),
    excluido BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_estado_uf_doe CHECK (
        (tipo_diario = 'DOE' AND estado_uf IS NOT NULL) OR
        (tipo_diario = 'DOU')
    )
);

-- Indexes for documentos
CREATE INDEX idx_documentos_ts_conteudo ON documentos USING GIN (ts_conteudo);
CREATE INDEX idx_documentos_tipo_uf_data ON documentos (tipo_diario, estado_uf, data_publicacao);
CREATE UNIQUE INDEX idx_documentos_hash ON documentos (hash_sha256) WHERE excluido = FALSE;
CREATE INDEX idx_documentos_status ON documentos (status);
CREATE INDEX idx_documentos_usuario ON documentos (usuario_upload_id);
CREATE INDEX idx_documentos_data_pub ON documentos (data_publicacao DESC);
CREATE INDEX idx_documentos_orgao ON documentos (orgao_emissor);

-- Trigger to auto-update ts_conteudo
CREATE OR REPLACE FUNCTION documentos_update_tsvector()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.conteudo_texto IS NOT NULL THEN
        NEW.ts_conteudo := to_tsvector('portuguese', NEW.conteudo_texto);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_documentos_tsvector
    BEFORE INSERT OR UPDATE OF conteudo_texto ON documentos
    FOR EACH ROW
    EXECUTE FUNCTION documentos_update_tsvector();

-- Trigger to auto-update atualizado_em
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_documentos_atualizado_em
    BEFORE UPDATE ON documentos
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_usuarios_atualizado_em
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

-- Table: logs_auditoria
CREATE TABLE logs_auditoria (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id),
    acao VARCHAR(100) NOT NULL,
    documento_id UUID REFERENCES documentos(id),
    detalhes JSONB,
    ip_origem INET,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_usuario ON logs_auditoria (usuario_id);
CREATE INDEX idx_logs_acao ON logs_auditoria (acao);
CREATE INDEX idx_logs_documento ON logs_auditoria (documento_id);
CREATE INDEX idx_logs_criado_em ON logs_auditoria (criado_em DESC);
