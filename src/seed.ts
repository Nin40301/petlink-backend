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
  db.run('DELETE FROM resgates');
  db.run('DELETE FROM pagamentos');
  db.run('DELETE FROM transacoes');
  db.run('DELETE FROM carteira');
  db.run('DELETE FROM pedidos');
  db.run('DELETE FROM enderecos');
  db.run('DELETE FROM servicos');
  db.run('DELETE FROM categorias');
  db.run('DELETE FROM usuarios');
  db.run("DELETE FROM sqlite_sequence WHERE name IN ('avaliacoes','resgates','pagamentos','transacoes','carteira','pedidos','enderecos','servicos','categorias','usuarios')");

  // =============================================
  // Usuários: 1 admin + 5 clientes + 5 prestadores
  // =============================================
  const usuariosData: any[][] = [
    // Admin
    ['Admin PetLink',        'admin@petlink.com',          'admin123',      'admin',      '(11) 90000-0000', '2024-01-01 00:00:00'],
    // Clientes (IDs 2-6)
    ['Ana Paula Souza',      'ana.souza@email.com',         'senha123',      'cliente',    '(11) 99001-1111', '2024-01-10 08:00:00'],
    ['Carlos Mendes',        'carlos.mendes@email.com',     'senha123',      'cliente',    '(21) 99002-2222', '2024-01-15 09:00:00'],
    ['Fernanda Lima',        'fernanda.lima@email.com',     'senha123',      'cliente',    '(31) 99003-3333', '2024-02-01 10:00:00'],
    ['Roberto Alves',        'roberto.alves@email.com',     'senha123',      'cliente',    '(41) 99004-4444', '2024-02-10 11:00:00'],
    ['Juliana Costa',        'juliana.costa@email.com',     'senha123',      'cliente',    '(51) 99005-5555', '2024-03-01 12:00:00'],
    // Prestadores (IDs 7-11)
    ['Marcos Oliveira',      'marcos.pet@email.com',        'senha123',      'prestador',  '(11) 98001-6666', '2024-01-05 07:00:00'],
    ['Patrícia Rocha',       'patricia.pets@email.com',     'senha123',      'prestador',  '(21) 98002-7777', '2024-01-08 08:30:00'],
    ['Diego Santos',         'diego.adestrador@email.com',  'senha123',      'prestador',  '(31) 98003-8888', '2024-01-20 09:30:00'],
    ['Camila Ferreira',      'camila.vet@email.com',        'senha123',      'prestador',  '(41) 98004-9999', '2024-02-05 10:30:00'],
    ['Lucas Barbosa',        'lucas.passeios@email.com',    'senha123',      'prestador',  '(51) 98005-0000', '2024-02-15 11:30:00'],
  ];

  for (const u of usuariosData) {
    db.run(
      'INSERT INTO usuarios (nome, email, senha, tipo, telefone, createdAt) VALUES (?,?,?,?,?,?)',
      u
    );
  }
  console.log(`✅ ${usuariosData.length} usuários inseridos (incluindo admin@petlink.com / admin123)`);

  // =============================================
  // Categorias
  // =============================================
  const categoriasData = [
    ['Banho e Tosa',  'Serviços de higiene e estética para pets',     '✂️'],
    ['Passeio',       'Passeios diários com seu pet',                  '🦮'],
    ['Hospedagem',    'Hospedagem temporária para pets',               '🏠'],
    ['Adestramento',  'Treinamento comportamental para cães e gatos',  '🎓'],
    ['Veterinário',   'Consultas e cuidados veterinários a domicílio', '🩺'],
    ['Pet Sitter',    'Cuidador de pets no conforto da sua casa',      '🐾'],
  ];

  for (const c of categoriasData) {
    db.run('INSERT INTO categorias (nome, descricao, icone) VALUES (?,?,?)', c);
  }
  console.log(`✅ ${categoriasData.length} categorias inseridas`);

  // =============================================
  // Serviços (prestadores são IDs 7-11)
  // =============================================
  const servicosData: any[][] = [
    ['Banho e Tosa Completo',    'Banho, tosa higiênica, corte de unhas e limpeza de ouvidos para cães de pequeno porte.',  80.00,  'Banho e Tosa',  7,  'ativo', '2024-01-10 10:00:00'],
    ['Passeio Diário 1h',        'Passeio de 1 hora em parques e áreas verdes da cidade. Máximo 2 pets por passeio.',        45.00,  'Passeio',       11, 'ativo', '2024-01-20 11:00:00'],
    ['Hospedagem Fim de Semana', 'Hospedagem de sexta a domingo em ambiente familiar, com alimentação e muito carinho.',      200.00, 'Hospedagem',    7,  'ativo', '2024-02-01 09:00:00'],
    ['Adestramento Básico',      'Pacote com 8 sessões de adestramento básico: sentar, deitar, ficar e vir.',                350.00, 'Adestramento',  9,  'ativo', '2024-02-10 14:00:00'],
    ['Consulta Veterinária',     'Consulta veterinária a domicílio com avaliação clínica geral e orientações de saúde.',     150.00, 'Veterinário',   10, 'ativo', '2024-02-15 15:00:00'],
    ['Pet Sitter Diário',        'Cuidador vai até sua casa por 4 horas para cuidar, brincar e alimentar seu pet.',          60.00,  'Pet Sitter',    7,  'ativo', '2024-03-01 10:00:00'],
    ['Tosa Higiênica',           'Tosa higiênica com foco em higiene: patas, barriga e região íntima.',                      50.00,  'Banho e Tosa',  8,  'ativo', '2024-03-05 11:00:00'],
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
  const enderecosData: any[][] = [
    [2, '01310-100', 'Av. Paulista',          '1000', 'Bela Vista',       'São Paulo'],
    [3, '20040-020', 'Rua da Assembleia',      '200',  'Centro',           'Rio de Janeiro'],
    [4, '30130-110', 'Av. Afonso Pena',        '3500', 'Centro',           'Belo Horizonte'],
    [5, '80010-010', 'Rua XV de Novembro',     '500',  'Centro',           'Curitiba'],
    [6, '90010-150', 'Av. Borges de Medeiros', '100',  'Centro Histórico', 'Porto Alegre'],
    [7, '01310-200', 'Rua Augusta',            '300',  'Consolação',       'São Paulo'],
  ];

  for (const e of enderecosData) {
    db.run(
      'INSERT INTO enderecos (usuarioId, cep, logradouro, numero, bairro, cidade) VALUES (?,?,?,?,?,?)',
      e
    );
  }
  console.log(`✅ ${enderecosData.length} endereços inseridos`);

  // =============================================
  // Pedidos (clientes são IDs 2-6)
  // =============================================
  const pedidosData: any[][] = [
    [2, 1, '2024-03-10 09:00:00', 'concluido', 80.00],
    [3, 2, '2024-03-12 10:00:00', 'concluido', 45.00],
    [4, 4, '2024-03-15 11:00:00', 'aceito',    350.00],
    [5, 5, '2024-03-18 14:00:00', 'pendente',  150.00],
    [6, 3, '2024-03-20 16:00:00', 'cancelado', 200.00],
    [2, 6, '2024-03-22 08:00:00', 'concluido', 60.00],
    [3, 7, '2024-03-25 09:30:00', 'pendente',  50.00],
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
  const avaliacoesData: any[][] = [
    [1, 5, 'Excelente serviço! Minha cachorra ficou linda e cheirosa.',          '2024-03-11 10:00:00'],
    [2, 4, 'Passeio muito bom, meu cachorro adorou.',                            '2024-03-13 11:00:00'],
    [6, 5, 'Pet sitter incrível! Meu gato ficou super bem cuidado.',             '2024-03-23 09:00:00'],
  ];

  for (const a of avaliacoesData) {
    db.run(
      'INSERT INTO avaliacoes (pedidoId, nota, comentario, dataAvaliacao) VALUES (?,?,?,?)',
      a
    );
  }
  console.log(`✅ ${avaliacoesData.length} avaliações inseridas`);

  // =============================================
  // Carteiras para TODOS os usuários (IDs 1-11)
  // =============================================
  const saldosFixos: Record<number, number> = {
    1: 0,      // admin — sem saldo
    2: 320.00, // cliente Ana
    3: 150.00, // cliente Carlos
    4: 500.00, // cliente Fernanda
    5: 75.00,  // cliente Roberto
    6: 200.00, // cliente Juliana
    7: 480.00, // prestador Marcos
    8: 220.00, // prestador Patrícia
    9: 350.00, // prestador Diego
    10: 600.00,// prestador Camila
    11: 130.00,// prestador Lucas
  };

  for (let i = 1; i <= usuariosData.length; i++) {
    db.run('INSERT INTO carteira (usuarioId, saldo) VALUES (?,?)', [i, saldosFixos[i] ?? 100]);
  }
  console.log(`✅ ${usuariosData.length} carteiras criadas`);

  // =============================================
  // Transações
  // =============================================
  const transacoesData: any[][] = [
    [2, 'entrada', 400,   'Recarga via PIX',                    null],
    [2, 'saida',   80,    'Pagamento - Banho e Tosa',            1],
    [3, 'entrada', 250,   'Recarga via Cartão',                  null],
    [3, 'saida',   45,    'Pagamento - Passeio Diário',          2],
    [7, 'entrada', 80,    'Recebimento - Banho e Tosa',          1],
    [11,'entrada', 45,    'Recebimento - Passeio',               2],
    [2, 'saida',   60,    'Pagamento - Pet Sitter',              6],
    [7, 'entrada', 60,    'Recebimento - Pet Sitter',            6],
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
  const pagamentosData: any[][] = [
    [1, 80,  'pix',    'confirmado'],
    [2, 45,  'cartao', 'confirmado'],
    [3, 200, 'pix',    'pendente'],
    [6, 60,  'pix',    'confirmado'],
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
  const resgatesData: any[][] = [
    [7,  150, 'pendente',  'pix-marcos@example.com'],
    [8,  300, 'aprovado',  'pix-patricia@example.com'],
    [10, 200, 'pendente',  'pix-camila@example.com'],
  ];

  for (const r of resgatesData) {
    db.run(
      'INSERT INTO resgates (prestadorId, valor, status, chavePixOuConta) VALUES (?,?,?,?)',
      r
    );
  }
  console.log(`✅ ${resgatesData.length} resgates criados`);

  saveDb(db);

  console.log('\n🎉 Seed concluído com sucesso! Banco de dados populado.');
  console.log('\n📋 Credenciais de teste:');
  console.log('   Admin:     admin@petlink.com    / admin123');
  console.log('   Cliente:   ana.souza@email.com  / senha123');
  console.log('   Prestador: marcos.pet@email.com / senha123');
}

seed().catch(console.error);
