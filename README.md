# PetLink — Backend API

Backend do **PetLink**, marketplace de prestação de serviços para pets. Desenvolvido com **Node.js**, **Express**, **TypeScript** e **SQLite** (via `better-sqlite3`).

---

## Tecnologias

| Tecnologia       | Versão  | Finalidade                          |
|------------------|---------|-------------------------------------|
| Node.js          | ≥ 18    | Runtime JavaScript                  |
| TypeScript       | 5.x     | Tipagem estática                    |
| Express          | 4.x     | Framework HTTP                      |
| better-sqlite3   | 9.x     | Banco de dados SQLite               |
| tsx              | 4.x     | Execução de TypeScript sem compilar |
| cors             | 2.x     | Middleware CORS                     |

---

## Instalação e Execução

### 1. Instalar dependências

```bash
npm install
```

### 2. Iniciar servidor em modo desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3001`.

### 3. Popular banco de dados com dados de teste

```bash
npm run seed
```

> Isso cria o arquivo `petlink.db` e insere dados de teste em todas as tabelas.

### 4. Build para produção

```bash
npm run build
npm start
```

---

## Estrutura do Projeto

```
petlink-backend/
├── src/
│   ├── server.ts          # Ponto de entrada — Express + rotas
│   ├── database.ts        # Inicialização do SQLite e criação das tabelas
│   ├── seed.ts            # Script para popular dados de teste
│   └── routes/
│       ├── usuarios.ts    # CRUD de Usuários
│       ├── categorias.ts  # CRUD de Categorias
│       ├── servicos.ts    # CRUD de Serviços
│       ├── pedidos.ts     # CRUD de Pedidos/Contratos
│       ├── avaliacoes.ts  # CRUD de Avaliações
│       └── enderecos.ts   # CRUD de Endereços
├── package.json
├── tsconfig.json
└── README.md
```

---

## Entidades e Rotas

### Entidade 1 — Usuário

| Campo      | Tipo    | Descrição                          |
|------------|---------|------------------------------------|
| id         | INTEGER | Chave primária (auto-increment)    |
| nome       | TEXT    | Nome completo                      |
| email      | TEXT    | E-mail único                       |
| senha      | TEXT    | Senha (hash)                       |
| tipo       | TEXT    | `cliente` ou `prestador`           |
| telefone   | TEXT    | Telefone de contato (opcional)     |
| createdAt  | TEXT    | Data de criação (ISO 8601)         |

**Rotas:**

| Método | Rota               | Descrição                  |
|--------|--------------------|----------------------------|
| GET    | `/api/usuarios`    | Lista todos os usuários    |
| GET    | `/api/usuarios/:id`| Busca usuário por ID       |
| POST   | `/api/usuarios`    | Cria novo usuário          |
| PUT    | `/api/usuarios/:id`| Atualiza usuário           |
| DELETE | `/api/usuarios/:id`| Remove usuário             |

---

### Entidade 2 — Serviço

| Campo       | Tipo    | Descrição                          |
|-------------|---------|------------------------------------|
| id          | INTEGER | Chave primária                     |
| titulo      | TEXT    | Título do serviço                  |
| descricao   | TEXT    | Descrição detalhada                |
| preco       | REAL    | Preço em reais                     |
| categoria   | TEXT    | Categoria do serviço               |
| prestadorId | INTEGER | FK → usuarios(id)                  |
| status      | TEXT    | `ativo` ou `inativo`               |
| createdAt   | TEXT    | Data de criação                    |

**Rotas:**

| Método | Rota               | Descrição                  |
|--------|--------------------|----------------------------|
| GET    | `/api/servicos`    | Lista todos os serviços    |
| GET    | `/api/servicos/:id`| Busca serviço por ID       |
| POST   | `/api/servicos`    | Cria novo serviço          |
| PUT    | `/api/servicos/:id`| Atualiza serviço           |
| DELETE | `/api/servicos/:id`| Remove serviço             |

---

### Entidade 3 — Categoria

| Campo    | Tipo    | Descrição                          |
|----------|---------|------------------------------------|
| id       | INTEGER | Chave primária                     |
| nome     | TEXT    | Nome único da categoria            |
| descricao| TEXT    | Descrição (opcional)               |
| icone    | TEXT    | Emoji ou nome do ícone (opcional)  |

**Rotas:**

| Método | Rota                  | Descrição                    |
|--------|-----------------------|------------------------------|
| GET    | `/api/categorias`     | Lista todas as categorias    |
| GET    | `/api/categorias/:id` | Busca categoria por ID       |
| POST   | `/api/categorias`     | Cria nova categoria          |
| PUT    | `/api/categorias/:id` | Atualiza categoria           |
| DELETE | `/api/categorias/:id` | Remove categoria             |

---

### Entidade 4 — Pedido/Contrato

| Campo           | Tipo    | Descrição                                                  |
|-----------------|---------|------------------------------------------------------------|
| id              | INTEGER | Chave primária                                             |
| clienteId       | INTEGER | FK → usuarios(id)                                          |
| servicoId       | INTEGER | FK → servicos(id)                                          |
| dataSolicitacao | TEXT    | Data/hora da solicitação                                   |
| status          | TEXT    | `pendente`, `aceito`, `concluido` ou `cancelado`           |
| valorTotal      | REAL    | Valor total cobrado                                        |

**Rotas:**

| Método | Rota              | Descrição                 |
|--------|-------------------|---------------------------|
| GET    | `/api/pedidos`    | Lista todos os pedidos    |
| GET    | `/api/pedidos/:id`| Busca pedido por ID       |
| POST   | `/api/pedidos`    | Cria novo pedido          |
| PUT    | `/api/pedidos/:id`| Atualiza status do pedido |
| DELETE | `/api/pedidos/:id`| Remove pedido             |

---

### Entidade 5 — Avaliação

| Campo         | Tipo    | Descrição                          |
|---------------|---------|------------------------------------|
| id            | INTEGER | Chave primária                     |
| pedidoId      | INTEGER | FK → pedidos(id) (único)           |
| nota          | INTEGER | Nota de 1 a 5                      |
| comentario    | TEXT    | Comentário (opcional)              |
| dataAvaliacao | TEXT    | Data da avaliação                  |

**Rotas:**

| Método | Rota                  | Descrição                    |
|--------|-----------------------|------------------------------|
| GET    | `/api/avaliacoes`     | Lista todas as avaliações    |
| GET    | `/api/avaliacoes/:id` | Busca avaliação por ID       |
| POST   | `/api/avaliacoes`     | Cria nova avaliação          |
| PUT    | `/api/avaliacoes/:id` | Atualiza avaliação           |
| DELETE | `/api/avaliacoes/:id` | Remove avaliação             |

---

### Entidade 6 — Endereço (adicional)

| Campo      | Tipo    | Descrição                          |
|------------|---------|------------------------------------|
| id         | INTEGER | Chave primária                     |
| usuarioId  | INTEGER | FK → usuarios(id)                  |
| cep        | TEXT    | CEP                                |
| logradouro | TEXT    | Rua/Avenida                        |
| numero     | TEXT    | Número                             |
| bairro     | TEXT    | Bairro                             |
| cidade     | TEXT    | Cidade                             |

**Rotas:**

| Método | Rota                 | Descrição                   |
|--------|----------------------|-----------------------------|
| GET    | `/api/enderecos`     | Lista todos os endereços    |
| GET    | `/api/enderecos/:id` | Busca endereço por ID       |
| POST   | `/api/enderecos`     | Cria novo endereço          |
| PUT    | `/api/enderecos/:id` | Atualiza endereço           |
| DELETE | `/api/enderecos/:id` | Remove endereço             |

---

## Exemplos de Requisição

### Criar usuário

```bash
curl -X POST http://localhost:3001/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome":"João Silva","email":"joao@email.com","senha":"123456","tipo":"cliente","telefone":"(11) 99999-9999"}'
```

### Criar serviço

```bash
curl -X POST http://localhost:3001/api/servicos \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Banho Premium","descricao":"Banho com produtos premium","preco":120.00,"categoria":"Banho e Tosa","prestadorId":6}'
```

### Criar pedido

```bash
curl -X POST http://localhost:3001/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{"clienteId":1,"servicoId":1,"valorTotal":80.00}'
```

### Atualizar status do pedido

```bash
curl -X PUT http://localhost:3001/api/pedidos/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"aceito"}'
```

---

## Branch de Entrega

Este projeto deve ser entregue na branch **`entrega-backend-n2`**.

```bash
git checkout entrega-backend-n2
```
