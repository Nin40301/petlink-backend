# PetLink — Backend API

Backend do **PetLink**, marketplace de prestação de serviços para pets. Desenvolvido com **Node.js**, **Express**, **TypeScript** e **SQLite** (via `sql.js`).

## 👨‍💻 Desenvolvedor

| Nome | Matrícula |
| :--- | :--- |
| Miguel Luis Ferreira de Paula | UC24102939 |

---

## Tecnologias

| Tecnologia     | Versão | Finalidade                        |
|----------------|--------|-----------------------------------|
| Node.js        | ≥ 18   | Runtime                           |
| TypeScript     | 5.x    | Tipagem estática                  |
| Express        | 4.x    | Framework HTTP                    |
| sql.js         | 1.x    | SQLite via WebAssembly            |
| tsx            | 4.x    | Execução de TS sem compilar       |

---

## Instalação e Execução

```bash
npm install
npm run seed    # Cria e popula o banco de dados
npm run dev     # Servidor em http://localhost:3001
```

---

## Credenciais de Teste

| Perfil    | Email                    | Senha    |
|-----------|--------------------------|----------|
| Admin     | admin@petlink.com        | admin123 |
| Cliente   | ana.souza@email.com      | senha123 |
| Prestador | marcos.pet@email.com     | senha123 |

---

## Estrutura do Projeto

```
src/
├── server.ts               # Express + registro de rotas
├── database.ts             # Inicialização SQLite + criação de tabelas
├── db-utils.ts             # queryAll, queryOne, execute
├── seed.ts                 # Dados de teste
├── middleware/
│   └── auth.ts             # JWT (createToken, verifyToken, authMiddleware)
└── routes/
    ├── auth.ts             # POST /api/auth/login, GET /api/auth/me
    ├── usuarios.ts         # CRUD de Usuários
    ├── categorias.ts       # CRUD de Categorias
    ├── servicos.ts         # CRUD de Serviços
    ├── pedidos.ts          # CRUD + aceitar/concluir + filtros
    ├── avaliacoes.ts       # CRUD de Avaliações
    ├── enderecos.ts        # CRUD de Endereços
    ├── carteira.ts         # Saldo, adicionar, resgatar, histórico
    ├── pagamentos.ts       # Criar/consultar pagamentos
    ├── resgates.ts         # Solicitar/aprovar resgates
    ├── admin.ts            # Dashboard e gestão de usuários (admin)
    └── prestador.ts        # Ganhos mensais do prestador
```

---

## Rotas da API

### Autenticação

| Método | Rota              | Descrição                                    |
|--------|-------------------|----------------------------------------------|
| POST   | `/api/auth/login` | Login — retorna token JWT + dados do usuário |
| GET    | `/api/auth/me`    | Dados do usuário autenticado (requer token)  |

**Exemplo de login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@petlink.com","senha":"admin123","tipo":"admin"}'
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "usuario": { "id": 1, "nome": "Admin PetLink", "tipo": "admin", ... }
  }
}
```

**Usar o token nas rotas protegidas:**
```
Authorization: Bearer <token>
```

---

### Carteira

| Método | Rota                              | Descrição                        |
|--------|-----------------------------------|----------------------------------|
| GET    | `/api/carteira/:usuarioId`        | Consultar saldo                  |
| POST   | `/api/carteira/adicionar`         | Adicionar saldo (cliente)        |
| POST   | `/api/carteira/resgatar`          | Solicitar resgate (prestador)    |
| GET    | `/api/carteira/historico/:usuarioId` | Histórico de transações       |

**Adicionar saldo:**
```json
{ "usuarioId": 2, "valor": 100, "metodo": "pix" }
```

**Solicitar resgate:**
```json
{ "usuarioId": 7, "valor": 150, "chavePixOuConta": "pix@email.com" }
```

---

### Pedidos

| Método | Rota                         | Descrição                                      |
|--------|------------------------------|------------------------------------------------|
| GET    | `/api/pedidos`               | Listar pedidos (filtros: `?clienteId=X` ou `?prestadorId=X`) |
| GET    | `/api/pedidos/:id`           | Buscar pedido                                  |
| POST   | `/api/pedidos`               | Criar pedido                                   |
| PUT    | `/api/pedidos/:id`           | Atualizar status/valor                         |
| PUT    | `/api/pedidos/:id/aceitar`   | Prestador aceita pedido                        |
| PUT    | `/api/pedidos/:id/concluir`  | Cliente confirma conclusão (libera pagamento)  |
| DELETE | `/api/pedidos/:id`           | Remover pedido                                 |

---

### Admin

| Método | Rota                                   | Descrição                              |
|--------|----------------------------------------|----------------------------------------|
| GET    | `/api/admin/dashboard`                 | Estatísticas: faturamento, serviços... |
| GET    | `/api/admin/usuarios`                  | Listar todos os usuários               |
| PUT    | `/api/admin/usuarios/:id/bloquear`     | Bloquear usuário                       |
| PUT    | `/api/admin/usuarios/:id/desbloquear`  | Desbloquear usuário                    |

> Requer token de admin.

---

### Prestador

| Método | Rota                               | Descrição                                             |
|--------|------------------------------------|-------------------------------------------------------|
| GET    | `/api/prestador/:id/ganhos/mensal` | Total ganho no mês, qtd serviços, média de avaliações |

---

### Resgates

| Método | Rota                          | Descrição                         |
|--------|-------------------------------|-----------------------------------|
| POST   | `/api/resgates`               | Solicitar resgate                 |
| GET    | `/api/resgates`               | Listar todos (admin)              |
| GET    | `/api/resgates/:id`           | Detalhe do resgate                |
| GET    | `/api/resgates/prestador/:id` | Resgates de um prestador          |
| PUT    | `/api/resgates/:id/aprovar`   | Admin aprova (desconta saldo)     |
| PUT    | `/api/resgates/:id/rejeitar`  | Admin rejeita                     |

---

### Demais entidades (CRUD completo)

| Prefixo           | Entidade    |
|-------------------|-------------|
| `/api/usuarios`   | Usuários    |
| `/api/categorias` | Categorias  |
| `/api/servicos`   | Serviços    |
| `/api/avaliacoes` | Avaliações  |
| `/api/enderecos`  | Endereços   |
| `/api/pagamentos` | Pagamentos  |

---

## Branch de Entrega

```bash
git checkout entrega-backend-n2
```
