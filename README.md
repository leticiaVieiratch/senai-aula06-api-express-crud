# Atividade 06 (Parte 2): Backend RESTful em Node.js & Express — DevPulse Notes API

> **Disciplina:** Frameworks Front-End  
> **Professor:** Me. Deivison S. Takatu  
> **Instituição:** SENAI  
> **Referência:** Aula 05 — Criando APIs para o Front-End (Slides 20 a 32)

---

## 1. Visão Geral do Backend

A pasta `atividade-02-api-express-crud` contém um servidor de backend RESTful completo construído sobre o ecossistema **Node.js** com o framework **Express**. A API fornece operações completas de CRUD (*Create, Read, Update, Delete*) para o gerenciamento de notas técnicas da plataforma DevPulse, com persistência atômica e não-bloqueante no arquivo `data.json` através do módulo nativo `fs/promises`.

### Destaques Técnicos:
- **Separação de Camadas e Rotas RESTful:** Rotas semânticas utilizando verbos HTTP padronizados (`GET`, `POST`, `PUT`, `DELETE`).
- **Middlewares Estratégicos:**
  - `cors`: Habilita a comunicação segura entre diferentes origens (ex: frontend Vite rodando na porta 5173 consumindo a API na porta 3001).
  - `express.json()`: Decodificação automática do corpo das requisições em formato JSON.
  - *Logger de Requisições:* Monitoramento no console de cada chamada com verbo HTTP, URL, código de status e tempo de resposta em milissegundos.
  - *Error Handlers:* Captura centralizada de payloads JSON malformados (400 Bad Request) e rotas não registradas (404 Not Found).
- **Tratamento Rigoroso de Códigos de Status HTTP:**
  - `200 OK`: Sucesso em operações de leitura, atualização e exclusão.
  - `201 Created`: Criação bem-sucedida de novos recursos com retorno do objeto e ID gerado.
  - `400 Bad Request`: Falha na validação de campos obrigatórios (título ou conteúdo ausente ou com menos de 3 caracteres).
  - `404 Not Found`: Tentativa de acesso, edição ou deleção de IDs inexistentes.
  - `500 Internal Server Error`: Falhas imprevistas de I/O tratadas graciosamente sem derrubar o processo Node.js.

---

## 2. Estrutura de Arquivos

```
atividade-02-api-express-crud/
├── server.js           # Ponto de entrada da API Express, rotas e middlewares
├── data.json           # Armazenamento persistente em JSON (fs/promises)
├── package.json        # Manifesto do projeto, dependências (express, cors) e scripts
├── .env.example        # Modelo de variáveis de ambiente (PORT, CORS_ORIGIN)
├── test-api.js         # Suíte de testes automatizados de integração end-to-end
└── README.md           # Documentação técnica e guia de consumo
```

---

## 3. Guia de Instalação e Execução

### Pré-requisitos:
- Node.js versão 18 ou superior instalado.

### Passo a Passo:
```bash
# 1. Acesse o diretório da API
cd "06-Criando-e-Consumindo-APIs/atividade-02-api-express-crud"

# 2. Instale as dependências (express e cors)
npm install

# 3. Inicie o servidor em modo de produção
npm start

# Ou inicie em modo de desenvolvimento com hot-reload nativo (Node 18+)
npm run dev

# 4. Execute a suíte de testes de integração automatizados
npm test
```

O servidor iniciará por padrão na porta `3001`: `http://localhost:3001`.

---

## 4. Referência Completa dos Endpoints da API

### 4.1. `GET /` — Apresentação e Catálogo de Rotas
Retorna informações institucionais, status da aplicação e a lista de rotas disponíveis.
* **Status HTTP:** `200 OK`
* **Exemplo de Resposta:**
```json
{
  "projeto": "DevPulse Notes API",
  "disciplina": "Frameworks Front-End",
  "professor": "Me. Deivison S. Takatu",
  "versao": "1.0.0",
  "status": "ONLINE"
}
```

---

### 4.2. `GET /api/health` — Verificação de Integridade
Retorna a saúde do serviço, tempo de atividade (*uptime*), timestamp UTC e total de notas cadastradas.
* **Status HTTP:** `200 OK`
* **Exemplo com cURL:**
```bash
curl -X GET http://localhost:3001/api/health
```

---

### 4.3. `GET /api/notes` — Listar Todas as Notas
Recupera a lista de anotações persistidas. Permite filtragem por categoria e busca textual via Query Parameters.
* **Parâmetros Opcionais (Query):**
  - `categoria`: Filtra pelo nome exato da categoria (ex: `?categoria=Conceito`).
  - `busca`: Busca termos contidos no título ou no conteúdo (ex: `?busca=cors`).
* **Status HTTP:** `200 OK`
* **Exemplo com cURL:**
```bash
curl -X GET "http://localhost:3001/api/notes?busca=express"
```

---

### 4.4. `GET /api/notes/:id` — Obter Detalhes de uma Nota
Recupera os detalhes de uma única anotação pelo seu identificador único.
* **Status HTTP de Sucesso:** `200 OK`
* **Status HTTP de Erro:** `404 Not Found` (caso o ID não exista).
* **Exemplo com cURL:**
```bash
curl -X GET http://localhost:3001/api/notes/1
```

---

### 4.5. `POST /api/notes` — Cadastrar Nova Nota
Insere uma nova anotação técnica no banco `data.json`.
* **Headers:** `Content-Type: application/json`
* **Corpo da Requisição (JSON):**
```json
{
  "titulo": "Hooks Customizados no React",
  "conteudo": "Hooks customizados permitem isolar e compartilhar lógica de estado entre múltiplos componentes.",
  "categoria": "Prática"
}
```
* **Status HTTP de Sucesso:** `201 Created`
* **Status HTTP de Validação:** `400 Bad Request` (se título ou conteúdo tiver menos de 3 caracteres).
* **Exemplo com cURL:**
```bash
curl -X POST http://localhost:3001/api/notes \
  -H "Content-Type: application/json" \
  -d '{"titulo": "Hooks Customizados", "conteudo": "Compartilhamento de lógica reativa.", "categoria": "Prática"}'
```

---

### 4.6. `PUT /api/notes/:id` — Atualizar Nota Existente
Atualiza os dados de uma anotação existente e atualiza automaticamente o carimbo `dataAtualizacao`.
* **Headers:** `Content-Type: application/json`
* **Corpo da Requisição (JSON):**
```json
{
  "titulo": "Título Revisado e Atualizado",
  "conteudo": "Novo conteúdo detalhado da anotação."
}
```
* **Status HTTP de Sucesso:** `200 OK`
* **Status HTTP de Erro:** `404 Not Found` (se a nota não existir) ou `400 Bad Request` (validação).

---

### 4.7. `DELETE /api/notes/:id` — Excluir Nota
Remove a anotação do arquivo `data.json`.
* **Status HTTP de Sucesso:** `200 OK` com payload de confirmação.
* **Status HTTP de Erro:** `404 Not Found` (se o ID for inexistente).
* **Exemplo com cURL:**
```bash
curl -X DELETE http://localhost:3001/api/notes/1
```

---

## 5. Testes Automatizados Integrados

O projeto inclui o script `test-api.js` que testa sequencialmente todo o fluxo do CRUD sem necessidade de frameworks de teste externos pesados:
1. Conecta no servidor Express;
2. Testa a rota de Health Check;
3. Executa um `POST` criando uma nova nota e captura o ID gerado;
4. Executa um `GET` no ID capturado e valida a igualdade dos dados;
5. Executa um `PUT` alterando o título da nota;
6. Executa um `DELETE` removendo a nota;
7. Executa um `GET` no mesmo ID para certificar o retorno `404 Not Found`;
8. Testa a rejeição de requisição com payload inválido (`400 Bad Request`);
9. Encerra a conexão e exibe o relatório de conformidade.
