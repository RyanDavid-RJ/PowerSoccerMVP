const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'power_soccer_secret_key_2025';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authController = {
    async loginGoogle(req, res) {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ erro: 'Token do Google não fornecido' });
            }

            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            const { email, name, sub: googleId } = payload;

            if (!email) {
                return res.status(400).json({ erro: 'Email não obtido do Google' });
            }

            const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
            let usuario;

            if (rows.length === 0) {
                const senhaHash = await bcrypt.hash('google-auth', 10);
                const [result] = await db.query(
                    'INSERT INTO usuarios (nome, email, senha, google_id) VALUES (?, ?, ?, ?)',
                    [name || email.split('@')[0], email, senhaHash, googleId]
                );
                usuario = { id: result.insertId, nome: name || email.split('@')[0], email };
            } else {
                usuario = rows[0];
                if (!usuario.google_id) {
                    await db.query('UPDATE usuarios SET google_id = ? WHERE id = ?', [googleId, usuario.id]);
                }
            }

            const nossoToken = jwt.sign(
                { id: usuario.id, email: usuario.email },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                mensagem: 'Login com Google realizado com sucesso',
                token: nossoToken,
                usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
            });
        } catch (erro) {
            console.error('Erro no login com Google:', erro);
            res.status(500).json({ erro: 'Falha na autenticação com Google' });
        }
    }
};

module.exports = authController;