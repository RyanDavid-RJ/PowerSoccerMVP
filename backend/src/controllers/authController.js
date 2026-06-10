const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Chave secreta - deve vir de variável de ambiente
const JWT_SECRET = process.env.JWT_SECRET || 'power_soccer_secret_key_2025';

const authController = {
    async registrar(req, res) {
        try {
            const { nome, email, senha } = req.body;

            // Validações simples
            if (!nome || !email || !senha) {
                return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
            }

            // Verifica se email já está cadastrado
            const [existentes] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
            if (existentes.length > 0) {
                return res.status(409).json({ erro: 'Email já cadastrado' });
            }

            // Criptografa senha
            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(senha, salt);

            // Insere usuário
            const [result] = await db.query(
                'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
                [nome, email, senhaHash]
            );

            // Gera token JWT
            const token = jwt.sign(
                { id: result.insertId, email: email },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                mensagem: 'Usuário criado com sucesso',
                token,
                usuario: { id: result.insertId, nome, email }
            });
        } catch (erro) {
            console.error('Erro ao registrar usuário:', erro);
            res.status(500).json({ erro: 'Erro interno ao registrar' });
        }
    },

    async login(req, res) {
        try {
            const { email, senha } = req.body;

            if (!email || !senha) {
                return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
            }

            // Busca usuário pelo email
            const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
            if (rows.length === 0) {
                return res.status(401).json({ erro: 'Credenciais inválidas' });
            }

            const usuario = rows[0];

            // Compara senha
            const senhaValida = await bcrypt.compare(senha, usuario.senha);
            if (!senhaValida) {
                return res.status(401).json({ erro: 'Credenciais inválidas' });
            }

            // Gera token
            const token = jwt.sign(
                { id: usuario.id, email: usuario.email },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                mensagem: 'Login realizado com sucesso',
                token,
                usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
            });
        } catch (erro) {
            console.error('Erro ao fazer login:', erro);
            res.status(500).json({ erro: 'Erro interno ao fazer login' });
        }
    }
};

module.exports = authController;