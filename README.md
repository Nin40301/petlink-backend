# Petlink Backend

Este é o repositório do backend da aplicação Petlink, responsável por gerenciar a lógica de negócios, banco de dados e APIs para o frontend.

## Informações do Estudante

- **Nome:** Miguel Luis Ferreira de Paula
- **Matrícula:** UC24102939
- **Atribuição:** Todas as funcionalidades do projeto foram desenvolvidas por este estudante.

## Funcionalidades Principais

O backend oferece as seguintes funcionalidades:

- **Autenticação e Autorização:** Login de usuários (clientes, prestadores, administradores).
- **Gerenciamento de Usuários:** CRUD para clientes, prestadores e administradores.
- **Gerenciamento de Serviços:** CRUD para serviços, incluindo criação, edição, ativação/inativação e remoção.
- **Sistema de Carteira:** Gerenciamento de saldo para clientes e prestadores.
- **Sistema de Pagamentos:** Contratação de serviços com débito de saldo e crédito para prestadores.
- **Sistema de Saque (Resgate):** Prestadores podem solicitar saques, que são aprovados/rejeitados por administradores.
- **Gerenciamento de Pedidos:** Criação, acompanhamento, conclusão e cancelamento de pedidos.
- **Avaliações:** Clientes podem avaliar serviços concluídos.
- **Transações:** Registro detalhado de todas as movimentações financeiras.

## Tecnologias Utilizadas

- **Node.js:** Ambiente de execução JavaScript.
- **Express:** Framework web para Node.js.
- **SQLite:** Banco de dados relacional leve e sem servidor.
- **TypeScript:** Linguagem de programação para tipagem estática.

## Como Executar o Projeto (Backend)

Siga os passos abaixo para configurar e executar o backend localmente:

### Pré-requisitos

Certifique-se de ter o Node.js (versão 18 ou superior) e o pnpm instalados em sua máquina.

- [Node.js Download](https://nodejs.org/en/download/)
- [pnpm Installation](https://pnpm.io/installation/)

### 1. Clonar o Repositório

```bash
git clone https://github.com/Nin40301/petlink-backend.git
cd petlink-backend
```

### 2. Instalar Dependências

```bash
pnpm install
```

### 3. Configurar e Popular o Banco de Dados

O projeto utiliza SQLite, então o banco de dados `petlink.db` será criado automaticamente na primeira execução do script de seed. O script de seed popula o banco com dados iniciais de teste (usuários, serviços, etc.).

```bash
pnpm run seed
```

### 4. Iniciar o Servidor

```bash
pnpm start
```

O servidor estará rodando em `http://localhost:3000` (ou a porta configurada).

## Estrutura de Pastas

- `src/`: Código fonte da aplicação.
  - `controllers/`: Lógica de negócio (não utilizada diretamente, a lógica está nas rotas).
  - `database.ts`: Configuração do banco de dados SQLite.
  - `db-utils.ts`: Funções utilitárias para interação com o banco de dados.
  - `middleware/`: Middlewares de autenticação e autorização.
  - `routes/`: Definição das rotas da API (auth, usuarios, servicos, pedidos, etc.).
  - `server.ts`: Configuração principal do servidor Express.
  - `seed.ts`: Script para popular o banco de dados com dados iniciais.
- `dist/`: Arquivos JavaScript compilados (gerados pelo TypeScript).

## Submissão do Projeto

Ao compactar o projeto para submissão, **NÃO inclua a pasta `node_modules`** para evitar arquivos desnecessariamente grandes. A pasta `node_modules` será recriada ao executar `pnpm install`.
