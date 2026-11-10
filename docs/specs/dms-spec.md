# Especificação - Document Management System

> Especificação gerada no Passo 1 (Plan Mode), a partir de
> [spec-template.md](./spec-template.md). Documento de planejamento: não contém
> código de backend nem de frontend.

## 1. Objetivo

Permitir que usuários enviem, listem e baixem documentos por meio de uma aplicação
web simples, com armazenamento local ao servidor e metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário (cada documento pertence a um dono)

### Fora do escopo

- Armazenamento externo ou em nuvem (S3, Azure Blob, etc.)
- Versionamento de documentos
- Autenticação e autorização completas (login, sessões, perfis)
- Persistência em banco de dados (metadados são perdidos ao reiniciar o servidor)
- Exclusão, edição ou compartilhamento de documentos
- TypeScript (projeto em JavaScript puro nesta fase)

## 3. Requisitos funcionais

| ID    | Requisito                                                                           |
| ----- | ----------------------------------------------------------------------------------- |
| RF-01 | O usuário pode enviar um documento (arquivo único por requisição)                   |
| RF-02 | O sistema associa o documento enviado ao dono informado pelo usuário                |
| RF-03 | O usuário pode listar os documentos enviados, com seus metadados                    |
| RF-04 | O usuário pode baixar um documento pelo identificador, recebendo o arquivo original |
| RF-05 | O sistema rejeita uploads sem arquivo ou acima do tamanho máximo configurado        |
| RF-06 | O sistema responde 404 quando o documento solicitado não existe                     |
| RF-07 | A interface web exibe formulário de upload, lista de documentos e botão de download |

### Decisões em aberto (a confirmar antes da implementação)

- **Identificação do dono (RF-02):** proposta: cabeçalho `X-User-Id` enviado pelo
  frontend; na ausência, usar o valor `anonimo`. Não há login nesta fase.
- **Escopo da listagem (RF-03):** proposta: `GET /documents` retorna apenas os
  documentos do dono informado em `X-User-Id`. Alternativa: listar todos.

## 4. Requisitos não funcionais

| ID     | Requisito                                                                              |
| ------ | -------------------------------------------------------------------------------------- |
| RNF-01 | Arquivos gravados no filesystem local em `backend/storage`, via `multer` `diskStorage` |
| RNF-02 | Metadados mantidos em memória nesta fase                                               |
| RNF-03 | Configuração via variáveis de ambiente (12-Factor), com valores padrão seguros         |
| RNF-04 | Nenhum serviço de armazenamento ou upload de terceiros                                 |
| RNF-05 | Nomes de arquivo em disco não podem colidir nem expor o nome original no caminho       |
| RNF-06 | Erros de entrada HTTP e de I/O de arquivo são tratados nos limites do sistema          |
| RNF-07 | Testes do backend com o runner nativo `node:test`                                      |

### Variáveis de ambiente

| Variável        | Padrão             | Descrição                            |
| --------------- | ------------------ | ------------------------------------ |
| `PORT`          | `3000`             | Porta HTTP do backend                |
| `STORAGE_DIR`   | `backend/storage`  | Pasta onde os arquivos são gravados  |
| `MAX_FILE_SIZE` | `10485760` (10 MB) | Tamanho máximo do arquivo em bytes   |

## 5. Modelo de dados (metadados do documento)

Armazenados em memória (ex.: `Map` no repositório).

| Campo        | Tipo   | Descrição                                                            |
| ------------ | ------ | -------------------------------------------------------------------- |
| id           | string | Identificador único do documento (UUID)                              |
| originalName | string | Nome original do arquivo enviado                                     |
| size         | number | Tamanho em bytes                                                     |
| uploadedAt   | string | Data/hora do upload (ISO 8601)                                       |
| owner        | string | Identificador do usuário dono                                        |
| mimeType     | string | Tipo MIME informado no upload (usado no `Content-Type` do download)  |
| storedName   | string | Nome do arquivo em disco (interno, não exposto na API)               |

## 6. Contratos de API

Prefixo no frontend: `/api` (proxy do Vite remove o prefixo e encaminha ao backend).

### POST /upload

- Entrada: `multipart/form-data` com o campo `file` (um arquivo).
  Cabeçalho opcional `X-User-Id`.
- Saída `201 Created`: metadados do documento criado

```json
{
  "id": "5f0c2a7e-7d1b-4f0e-9a3e-2b8f1c6d4e10",
  "originalName": "contrato.pdf",
  "size": 48213,
  "uploadedAt": "2026-11-10T19:30:00.000Z",
  "owner": "anonimo"
}
```

- Erros:
  - `400` campo `file` ausente
  - `413` arquivo acima de `MAX_FILE_SIZE`

### GET /documents

- Cabeçalho opcional `X-User-Id` (ver decisão em aberto da seção 3).
- Saída `200 OK`: array de metadados (sem `storedName`; `mimeType` a definir)

```json
[
  {
    "id": "5f0c2a7e-7d1b-4f0e-9a3e-2b8f1c6d4e10",
    "originalName": "contrato.pdf",
    "size": 48213,
    "uploadedAt": "2026-11-10T19:30:00.000Z",
    "owner": "anonimo"
  }
]
```

### GET /documents/:id/download

- Saída `200 OK`: conteúdo binário do arquivo, com `Content-Type` do `mimeType` e
  `Content-Disposition: attachment` usando o `originalName`.
- Erros:
  - `404` documento inexistente ou arquivo ausente em disco

### Formato de erro (comum)

```json
{ "error": "Mensagem em português para o usuário" }
```

## 7. Decisões arquiteturais

- **Backend (Node.js + Express 5, CommonJS)** em Clean Architecture simples, em `backend/src`:
  - `routes/`: definem os endpoints e delegam para os controllers
  - `controllers/`: tratam entrada/saída HTTP e validação básica
  - `services/`: regras de negócio (ex.: montar metadados, validar dono)
  - `repositories/`: persistência (em memória e no filesystem via `multer`)
  - Fluxo de dependência: `routes -> controllers -> services -> repositories`
- **Entrada:** `app.js` monta o Express e carrega as rotas; sem lógica de negócio.
- **Upload:** `multer` com `diskStorage` em `STORAGE_DIR`, nome gerado por UUID.
- **Frontend (React 19 + Vite, ESM)** baseado em componentes:
  - `components/`: `UploadComponent`, `DocumentList`, `DownloadButton`
  - `pages/`: página principal que compõe os componentes
  - `services/`: chamadas `fetch` ao prefixo `/api`
  - Hooks funcionais; sem duplicação de lógica de chamadas HTTP
- **Armazenamento local apenas:** sem provedores externos.
- **Idioma:** símbolos de código em inglês; mensagens ao usuário e comentários em português.
- **Dependências:** usar somente as já presentes em `backend/package.json` e `frontend/package.json`.

### Estado atual do repositório (referência para o plano)

- `backend/`: possui `package.json` (express 5.2.1, multer 2.2.0) e scripts `start`, `dev`, `test`;
  ainda não possui `src/`.
- `frontend/`: possui `package.json`, `vite.config.js` com proxy `/api` para `http://localhost:3000`,
  e `src/App.jsx` / `src/main.jsx` como seed.

## 8. Plano de execução

Plano em etapas. Cada etapa depende apenas das anteriores, indicadas entre parênteses.
A execução de código acontece nos passos seguintes do workshop, não neste documento.

### Etapa 1 - Estrutura e configuração do backend (sem dependências)

- Arquivos: `backend/src/app.js`, `backend/src/config/env.js` (leitura de `PORT`, `STORAGE_DIR`, `MAX_FILE_SIZE`)
- Critérios de aceite:
  - `npm start` em `backend/` sobe o servidor na `PORT` configurada
  - Valores padrão aplicados quando as variáveis não existem

### Etapa 2 - Repositório de documentos (depende da 1)

- Arquivos: `backend/src/repositories/documentRepository.js` (Map em memória: salvar, listar por dono, buscar por id)
- Critérios de aceite:
  - Testes `node:test` cobrindo salvar, listar e buscar inexistente

### Etapa 3 - Serviço de documentos (depende da 2)

- Arquivos: `backend/src/services/documentService.js` (cria metadados, lista por dono, resolve caminho para download)
- Critérios de aceite:
  - Regra de dono padrão `anonimo` aplicada quando `X-User-Id` está ausente
  - Testes unitários sem HTTP

### Etapa 4 - Upload com multer (depende da 3)

- Arquivos: `backend/src/routes/documentRoutes.js` (parte de upload), `backend/src/controllers/documentController.js`,
  `backend/src/repositories/fileStorage.js` (configuração `multer` `diskStorage` e limite de tamanho)
- Critérios de aceite:
  - `POST /upload` retorna `201` com metadados
  - Sem arquivo retorna `400`; acima do limite retorna `413`
  - Arquivo gravado em `STORAGE_DIR` com nome UUID

### Etapa 5 - Listagem e download (depende da 4)

- Arquivos: rotas e controllers de `GET /documents` e `GET /documents/:id/download`
- Critérios de aceite:
  - `GET /documents` retorna array conforme a decisão de escopo
  - Download devolve bytes idênticos ao upload, com `Content-Disposition` correto
  - Id inexistente retorna `404`

### Etapa 6 - Tratamento de erros e middleware final (depende da 5)

- Arquivos: `backend/src/middlewares/errorHandler.js`, ajuste em `app.js`
- Critérios de aceite:
  - Todas as respostas de erro seguem o formato `{ "error": "..." }`
  - Erros de I/O não derrubam o processo

### Etapa 7 - Serviço de API no frontend (depende da 6)

- Arquivos: `frontend/src/services/documentService.js` (wrappers `fetch` para `/api/upload`, `/api/documents`, `/api/documents/:id/download`)
- Critérios de aceite:
  - Erros HTTP são convertidos em mensagens exibíveis

### Etapa 8 - Componentes e página (depende da 7)

- Arquivos: `frontend/src/components/UploadComponent.jsx`, `DocumentList.jsx`, `DownloadButton.jsx`,
  `frontend/src/pages/DocumentsPage.jsx`, ajuste em `App.jsx`
- Critérios de aceite:
  - Upload atualiza a lista sem recarregar a página
  - Download dispara o salvamento do arquivo no navegador
  - Componentes reutilizáveis, sem duplicação de chamadas HTTP

### Etapa 9 - Integração e validação final (depende da 8)

- Verificar o proxy `/api` do Vite com o backend em execução
- Rodar `npm test` em `backend/` e `npm run build` em `frontend/`
- Critérios de aceite:
  - Fluxo completo: enviar, listar, baixar
  - Testes e build passam sem erros
  - Nenhuma funcionalidade existente quebrada

## 9. Riscos

| Risco                                                       | Mitigação                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| Metadados em memória são perdidos ao reiniciar o servidor   | Aceito nesta fase (RNF-02); arquivos permanecem em disco     |
| Arquivos órfãos em disco se o registro falhar após o upload | Remover o arquivo quando a criação de metadados falhar       |
| Nome original malicioso no `Content-Disposition`            | Sanitizar o nome e usar `storedName` apenas internamente     |
| Ausência de autenticação permite acesso cruzado entre donos | Documentado como fora do escopo; revisitar em fase posterior |
| Limite de tamanho não aplicado causa esgotamento de disco   | Limite via `MAX_FILE_SIZE` no `multer` (Etapa 4)             |
