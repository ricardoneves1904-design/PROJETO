// com este ficheiro listar consigo ver a lista de encomendas no terminal executando o comando: node listar.js Para ver a Mailing List (espetáculos, marketing, lançamentos): node listar.js newsletter
const mysql = require('mysql2/promise');

// Captura o argumento que escreves no terminal (ex: node listar.js newsletter)
const argumento = process.argv[2];

async function iniciarListagem() {
    try {
        const db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Mantém igual à do server.js
            database: 'stemcellsrock'
        });

        // Se o utilizador escrever "newsletter" ou "emails", mostra a Mailing List
        if (argumento === 'newsletter' || argumento === 'emails') {
            await listarMailingList(db);
        } else {
            // Por defeito, se não escrever nada ou escrever "encomendas", mostra as compras
            await listarEncomendas(db);
        }

        await db.end();
    } catch (error) {
        console.error('❌ Erro de ligação à base de dados:', error.message);
    }
}

// 1. FUNÇÃO PARA LISTAR ENCOMENDAS
async function listarEncomendas(db) {
    const query = `
        SELECT 
            e.id AS ID, 
            c.nome AS Cliente, 
            p.nome AS Produto, 
            e.quantidade AS Qtd, 
            e.morada AS Morada, 
            e.codigo_postal AS 'Cód. Postal', 
            e.localidade AS Localidade, 
            e.pais AS País,
            DATE_FORMAT(e.data_encomenda, '%d/%m/%Y %H:%i') AS Data
        FROM encomendas e
        INNER JOIN clientes c ON e.cliente_id = c.id
        INNER JOIN produtos p ON e.produto_id = p.id
        ORDER BY e.data_encomenda DESC
    `;

    const [encomendas] = await db.query(query);

    if (encomendas.length === 0) {
        console.log('\nℹ️ Nenhuma encomenda encontrada na base de dados.\n');
    } else {
        console.log('\n🚀 === LOGÍSTICA DE ENCOMENDAS (UNIVERSAL SCICOM) ===');
        console.table(encomendas);
        console.log(`📌 Total de encomendas: ${encomendas.length}`);
        console.log(`💡 Dica: Escreve 'node listar.js newsletter' para ver os subscritores.\n`);
    }
}

// 2. FUNÇÃO PARA LISTAR MAILING LIST
async function listarMailingList(db) {
    const query = `
        SELECT 
            id AS ID, 
            email AS 'E-mail Subscrito', 
            DATE_FORMAT(data_subscricao, '%d/%m/%Y %H:%i') AS 'Data de Inscrição'
        FROM newsletter
        ORDER BY data_subscricao DESC
    `;

    const [subscritores] = await db.query(query);

    if (subscritores.length === 0) {
        console.log('\nℹ️ A tua mailing list ainda não tem subscritores.\n');
    } else {
        console.log('\n📬 === CONTACTOS DA MAILING LIST (UNIVERSAL SCICOM) ===');
        console.table(subscritores);
        console.log(`📌 Total de subscritores ativos: ${subscritores.length}`);
        console.log(`💡 Dica: Escreve 'node listar.js' para voltar a ver as encomendas.\n`);
    }
}

// Arranca o script
iniciarListagem();