/**
 * seed.ts
 * Popula o banco de dados com dados de teste para o PetLink.
 * Execute com: npm run seed
 */

import { getDb, saveDb } from './database';

async function seed() {
  const db = await getDb();

  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Limpa as tabelas na ordem correta (respeitando FK)
  db.run('DELETE FROM avaliacoes');
  db.run('DELETE FROM pedidos');
  db.run('DELETE FROM enderecos');
  db.run('DELETE FROM servicos');
  db.run('DELETE FROM categorias');
  db.run('DELETE FROM usuarios');
  // Reseta os auto-incrementos
  db.run("DELETE FROM sqlite_sequence WHERE name IN ('avaliacoes','pedidos','enderecos','servicos','categorias','usuarios')");

  // =============================================
  // Usuários (5 clientes + 5 prestadores)
  // =============================================
  const usuariosData = [
    // Clientes
    ['Ana Paula Souza',    'ana.souza@email.com',    'hash_senha_1', 'cliente',    '(11) 99001-1111', '2024-01-10 08:00:00'],
    ['Carlos Mendes',      'carlos.mendes@email.com', 'hash_senha_2', 'cliente',    '(21) 99002-2222', '2024-01-15 09:00:00'],
    ['Fernanda Lima',      'fernanda.lima@email.com', 'hash_senha_3', 'cliente',    '(31) 99003-3333', '2024-02-01 10:00:00'],
    ['Roberto Alves',      'roberto.alves@email.com', 'hash_senha_4', 'cliente',    '(41) 99004-4444', '2024-02-10 11:00:00'],
    ['Juliana Costa',      'juliana.costa@email.com', 'hash_senha_5', 'cliente',    '(51) 99005-5555', '2024-03-01 12:00:00'],
    // Prestadores
    ['Marcos Oliveira',    'marcos.pet@email.com',    'hash_senha_6', 'prestador',  '(11) 98001-6666', '2024-01-05 07:00:00'],
    ['Patrícia Rocha',     'patricia.pets@email.com', 'hash_senha_7', 'prestador',  '(21) 98002-7777', '2024-01-08 08:30:00'],
    ['Diego Santos',       'diego.adestrador@email.com', 'hash_senha_8', 'prestador', '(31) 98003-8888', '2024-01-20 09:30:00'],
    ['Camila Ferreira',    'camila.vet@email.com',    'hash_senha_9', 'prestador',  '(41) 98004-9999', '2024-02-05 10:30:00'],
    ['Lucas Barbosa',      'lucas.passeios@email.com', 'hash_senha_10', 'prestador', '(51) 98005-0000', '2024-02-15 11:30:00'],
  ];

  for (const u of usuariosData) {
    db.run(
      'INSERT INTO usuarios (nome, email, senha, tipo, telefone, createdAt) VALUES (?,?,?,?,?,?)',
      u
    );
  }
  console.log(`✅ ${usuariosData.length} usuários inseridos`);

  // =============================================
  // Categorias
  // =============================================
  const categoriasData = [
    ['Banho e Tosa',  'Serviços de higiene e estética para pets',          '✂️'],
    ['Passeio',       'Passeios diários com seu pet',                       '🦮'],
    ['Hospedagem',    'Hospedagem temporária para pets',                    '🏠'],
    ['Adestramento',  'Treinamento comportamental para cães e gatos',       '🎓'],
    ['Veterinário',   'Consultas e cuidados veterinários a domicílio',      '🩺'],
    ['Pet Sitter',    'Cuidador de pets no conforto da sua casa',           '🐾'],
  ];

  for (const c of categoriasData) {
    db.run('INSERT INTO categorias (nome, descricao, icone) VALUES (?,?,?)', c);
  }
  console.log(`✅ ${categoriasData.length} categorias inseridas`);

  // =============================================
  // Serviços
  // =============================================
  const servicosData = [
    ['Banho e Tosa Completo',    'Banho, tosa higiênica, corte de unhas e limpeza de ouvidos para cães de pequeno porte.',   80.00,  'Banho e Tosa',  7, 'ativo', '2024-01-10 10:00:00'],
    ['Passeio Diário 1h',        'Passeio de 1 hora em parques e áreas verdes da cidade. Máximo 2 pets por passeio.',         45.00,  'Passeio',       10, 'ativo', '2024-01-20 11:00:00'],
    ['Hospedagem Fim de Semana', 'Hospedagem de sexta a domingo em ambiente familiar, com alimentação e muito carinho.',       200.00, 'Hospedagem',    6, 'ativo', '2024-02-01 09:00:00'],
    ['Adestramento Básico',      'Pacote com 8 sessões de adestramento básico: sentar, deitar, ficar e vir.',                 350.00, 'Adestramento',  8, 'ativo', '2024-02-10 14:00:00'],
    ['Consulta Veterinária',     'Consulta veterinária a domicílio com avaliação clínica geral e orientações de saúde.',      150.00, 'Veterinário',   9, 'ativo', '2024-02-15 15:00:00'],
    ['Pet Sitter Diário',        'Cuidador vai até sua casa por 4 horas para cuidar, brincar e alimentar seu pet.',           60.00,  'Pet Sitter',    6, 'ativo', '2024-03-01 10:00:00'],
    ['Tosa Higiênica',           'Tosa higiênica com foco em higiene: patas, barriga e região íntima.',                       50.00,  'Banho e Tosa',  7, 'ativo', '2024-03-05 11:00:00'],
  ];

  for (const s of servicosData) {
    db.run(
      'INSERT INTO servicos (titulo, descricao, preco, categoria, prestadorId, status, createdAt) VALUES (?,?,?,?,?,?,?)',
      s
    );
  }
  console.log(`✅ ${servicosData.length} serviços inseridos`);

  // =============================================
  // Endereços
  // =============================================
  const enderecosData = [
    [1, '01310-100', 'Av. Paulista',           '1000', 'Bela Vista',       'São Paulo'],
    [2, '20040-020', 'Rua da Assembleia',       '200',  'Centro',           'Rio de Janeiro'],
    [3, '30130-110', 'Av. Afonso Pena',         '3500', 'Centro',           'Belo Horizonte'],
    [4, '80010-010', 'Rua XV de Novembro',      '500',  'Centro',           'Curitiba'],
    [5, '90010-150', 'Av. Borges de Medeiros',  '100',  'Centro Histórico', 'Porto Alegre'],
    [6, '01310-200', 'Rua Augusta',             '300',  'Consolação',       'São Paulo'],
  ];

  for (const e of enderecosData) {
    db.run(
      'INSERT INTO enderecos (usuarioId, cep, logradouro, numero, bairro, cidade) VALUES (?,?,?,?,?,?)',
      e
    );
  }
  console.log(`✅ ${enderecosData.length} endereços inseridos`);

  // =============================================
  // Pedidos
  // =============================================
  const pedidosData = [
    [1, 1, '2024-03-10 09:00:00', 'concluido', 80.00],
    [2, 2, '2024-03-12 10:00:00', 'concluido', 45.00],
    [3, 4, '2024-03-15 11:00:00', 'aceito',    350.00],
    [4, 5, '2024-03-18 14:00:00', 'pendente',  150.00],
    [5, 3, '2024-03-20 16:00:00', 'cancelado', 200.00],
    [1, 6, '2024-03-22 08:00:00', 'concluido', 60.00],
    [2, 7, '2024-03-25 09:30:00', 'pendente',  50.00],
  ];

  for (const p of pedidosData) {
    db.run(
      'INSERT INTO pedidos (clienteId, servicoId, dataSolicitacao, status, valorTotal) VALUES (?,?,?,?,?)',
      p
    );
  }
  console.log(`✅ ${pedidosData.length} pedidos inseridos`);

  // =============================================
  // Avaliações (apenas pedidos concluídos: 1, 2, 6)
  // =============================================
  const avaliacoesData = [
    [1, 5, 'Excelente serviço! Minha cachorra ficou linda e cheirosa. Super recomendo!',          '2024-03-11 10:00:00'],
    [2, 4, 'Passeio muito bom, meu cachorro adorou. Só achei um pouco curto.',                    '2024-03-13 11:00:00'],
    [6, 5, 'Pet sitter incrível! Meu gato ficou super bem cuidado. Voltarei com certeza.',         '2024-03-23 09:00:00'],
    [3, 4, 'Adestramento está indo muito bem, meu cão já aprendeu vários comandos básicos.',       '2024-04-01 15:00:00'],
    [5, 3, 'Tive que cancelar por imprevisto, mas o prestador foi muito compreensivo.',            '2024-03-21 10:00:00'],
  ];

  for (const a of avaliacoesData) {
    db.run(
      'INSERT INTO avaliacoes (pedidoId, nota, comentario, dataAvaliacao) VALUES (?,?,?,?)',
      a
    );
  }
  console.log(`✅ ${avaliacoesData.length} avaliações inseridas`);

  // =============================================
  // Carteira (todos os usuários)
  // =============================================
  usuariosData.forEach((_u, i) => {
    db.run(
      'INSERT INTO carteira (usuarioId, saldo) VALUES (?,?)',
      [i + 1, Math.floor(Math.random() * 500) + 50]
    );
  });
  console.log(`✅ ${usuariosData.length} carteiras criadas`);

  // =============================================
  // Transações
  // =============================================
  const transacoesData = [
    [1, 'entrada', 100, 'Recarga via PIX', null],
    [1, 'saida', 80, 'Pagamento - Banho e Tosa', 1],
    [2, 'entrada', 250, 'Recarga via Cartão', null],
    [6, 'entrada', 80, 'Recebimento - Banho e Tosa', 1],
    [7, 'entrada', 45, 'Recebimento - Passeio', 2],
    [10, 'entrada', 200, 'Recarga via PIX', null],
  ];

  for (const t of transacoesData) {
    db.run(
      'INSERT INTO transacoes (usuarioId, tipo, valor, descricao, pedidoId) VALUES (?,?,?,?,?)',
      t
    );
  }
  console.log(`✅ ${transacoesData.length} transações criadas`);

  // =============================================
  // Pagamentos
  // =============================================
  const pagamentosData = [
    [1, 80, 'pix', 'confirmado'],
    [2, 45, 'cartao', 'confirmado'],
    [3, 200, 'pix', 'pendente'],
  ];

  for (const p of pagamentosData) {
    db.run(
      'INSERT INTO pagamentos (pedidoId, valor, metodo, status) VALUES (?,?,?,?)',
      p
    );
  }
  console.log(`✅ ${pagamentosData.length} pagamentos criados`);

  // =============================================
  // Resgates
  // =============================================
  const resgatesData = [
    [6, 150, 'pendente', 'chave-pix-marcos@example.com'],
    [7, 300, 'aprovado', 'chave-pix-patricia@example.com'],
  ];

  for (const r of resgatesData) {
    db.run(
      'INSERT INTO resgates (prestadorId, valor, status, chavePixOuConta) VALUES (?,?,?,?)',
      r
    );
  }
  console.log(`✅ ${resgatesData.length} resgates criados`);

  // Persiste no arquivo
  saveDb(db);

  console.log('\n🎉 Seed concluído com sucesso! Banco de dados populado.');
}

seed().catch(console.error);
