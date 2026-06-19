// Lê o ficheiro .env e coloca as variáveis em process.env
require("dotenv").config();

const express = require('express'); // Framework do servidor
const cors = require('cors'); // Permite comunicação entre domínios diferentes.
const mysql = require('mysql2/promise'); // Base de dados
const nodemailer = require('nodemailer'); // Nodemailer para a mailing list

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do pool com as variáveis do .env
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '', 
    database: process.env.DATABASE_NAME || 'stemcellsrock',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// CONFIGURAÇÃO DO NODEMAILER
const transporter = nodemailer.createTransport({
    service: 'gmail', // Trata das portas e hosts automaticamente de forma segura
    auth: {
        user: process.env.GMAIL_USER,     
        pass: process.env.GMAIL_APP_PASS  
    }
});

// Middlewares obrigatórios
app.use(cors());
app.use(express.json()); // Permite receber dados em formato JSON do frontend


// Função principal que valida a estrutura da Base de Dados
async function iniciarServidor() {
    console.log("👉 Email lido do .env:", process.env.GMAIL_USER);
    console.log("👉 Pass existe no .env?:", process.env.GMAIL_APP_PASS ? "Sim ✅" : "Não, está UNDEFINED ❌");
    
    try {
        console.log('📦 A verificar tabelas na base de dados MySQL...');

        // 1. Criar Tabela de Produtos usando o Pool unificado
        await pool.query(`
            CREATE TABLE IF NOT EXISTS produtos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                preco DECIMAL(10, 2) NOT NULL,
                stock INT DEFAULT 0
            )
        `);

        // [POVOAMENTO AUTOMÁTICO] Insere a T-shirt caso a tabela esteja vazia
        const [linhas] = await pool.query('SELECT * FROM produtos WHERE id = 1');
        if (linhas.length === 0) {
            await pool.query(`
                INSERT INTO produtos (id, nome, preco, stock) 
                VALUES (1, 'What a Science Communicator Looks Like Shirt', 25.00, 500)
            `);
            console.log('👕 T-shirt padrão adicionada ao stock do MySQL com ID 1!');
        }

        // 2. Criar Tabela de Clientes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                telefone VARCHAR(50)
            )
        `);

        // 3. Criar Tabela de Encomendas com Morada de Envio
        await pool.query(`
            CREATE TABLE IF NOT EXISTS encomendas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cliente_id INT,
                produto_id INT,
                quantidade INT NOT NULL,
                morada VARCHAR(255) NOT NULL,
                codigo_postal VARCHAR(50) NOT NULL,
                localidade VARCHAR(100) NOT NULL,
                pais VARCHAR(100) NOT NULL,
                data_encomenda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
                FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
            )
        `);

        // 4. Criar Tabela da Mailing List
        await pool.query(`
            CREATE TABLE IF NOT EXISTS newsletter (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                data_subscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('📑 Todas as tabelas (Clientes, Produtos, Encomendas e Newsletter) prontas!');

        // Inicia o servidor Express apenas se as tabelas estiverem criadas com sucesso
        app.listen(PORT, () => {
            console.log(`🚀 Servidor backend ativo em: http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('❌ Erro crítico ao iniciar o backend:', error.message);
        process.exit(1);
    }
}

// Inicializa a base de dados e o servidor
iniciarServidor();

/* ==========================================================================
   ROTAS DA API (Endpoints chamados pelo ficheiro app.js)
   ========================================================================== */

// 1. Rota para o Frontend listar ou verificar produtos
app.get('/api/produtos', async (req, res) => {
    try {
        const [produtos] = await pool.query('SELECT * FROM produtos');
        res.json(produtos);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// 2. Rota para subscrever na Mailing List
app.post('/api/newsletter', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ erro: 'O e-mail é obrigatório.' });
    }

    try {
        // Insere o e-mail na base de dados
        await pool.query('INSERT INTO newsletter (email) VALUES (?)', [email]);

        // Configuração do e-mail
        const emailBoasVindas = {
            from: `"stemcellsrock" <${process.env.GMAIL_USER}>`, 
            to: email,
            subject: '🚀 Olá Estaminalino, bem vindo ao reservatório estaminal!',
            html: `
                <div style="background-color: #0B0C10; color: #E0E0E0; padding: 30px; font-family: sans-serif; border: 2px solid #2DE2FF; border-radius: 8px;">
                    <h1 style="color: #2DE2FF;">Bem vindo ao NICHO!</h1>
                    <p>Obrigado por teres subscrito a nossa lista de emails.</p>
                    <p>A partir de agora vais ser o primeiro a saber acerca dos nossos <strong>shows ao vivo, avanços científicos relevantes, e lançamentos de produtos exclusivos de merchandising</strong>.</p>
                    <hr style="border: 0; border-top: 1px solid rgba(45, 226, 255, 0.3);">
                    <p style="font-size: 12px; color: #888;">Talk-Show: Stem Cells Rock! — Comunicação de Ciência.</p>
                </div>
            `
        };
        
        // transporter global visível aqui
        await transporter.sendMail(emailBoasVindas);

        res.status(201).json({ mensagem: 'Subscrição concluída com sucesso!' });

    } catch (err) {
        console.error("❌ Erro detalhado na rota:", err); 
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ erro: 'Este email já está na nossa lista!' });
        }
        res.status(500).json({ erro: err.message });
    }
});

// 3. Rota para registar ou reutilizar um cliente pelo Email
app.post('/api/clientes', async (req, res) => {
    const { nome, email, telefone } = req.body;
    try {
        // Tenta inserir o novo cliente
        const [resultado] = await pool.query(
            'INSERT INTO clientes (nome, email, telefone) VALUES (?, ?, ?)',
            [nome, email, telefone]
        );
        res.status(201).json({ id: resultado.insertId, mensagem: 'Cliente registado!' });
    } catch (err) {
        // Se o email já existir, devolve o ID desse cliente existente
        if (err.code === 'ER_DUP_ENTRY') {
            try {
                const [clientesExistentes] = await pool.query('SELECT id FROM clientes WHERE email = ?', [email]);
                return res.status(200).json({ id: clientesExistentes[0].id, mensagem: 'Cliente já existente utilizado.' });
            } catch (buscaErr) {
                return res.status(500).json({ erro: buscaErr.message });
            }
        }
        res.status(500).json({ erro: err.message });
    }
});

// 4. Rota para registar a Encomenda (Checkout) e atualizar o stock
app.post('/api/encomendas', async (req, res) => {
    const { cliente_id, produto_id, quantity, morada, codigo_postal, localidade, pais } = req.body;

    try {
        // Verificar se o produto existe e tem stock suficiente
        const [produtos] = await pool.query('SELECT * FROM produtos WHERE id = ?', [produto_id]);
        if (produtos.length === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });
        
        const produto = produtos[0];
        if (produto.stock < quantity) return res.status(400).json({ erro: 'Stock insuficiente.' });

        // Grava no MySQL incluindo os dados de morada
        const [resultado] = await pool.query(
            'INSERT INTO encomendas (cliente_id, produto_id, quantidade, morada, codigo_postal, localidade, pais) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [cliente_id, produto_id, quantity, morada, codigo_postal, localidade, pais]
        );
        
        // Retirar a quantidade vendida do stock do produto
        await pool.query('UPDATE produtos SET stock = stock - ? WHERE id = ?', [quantity, produto_id]);
        
        res.status(201).json({ id: resultado.insertId, mensagem: 'Encomenda guardada com morada de envio!' });

    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});