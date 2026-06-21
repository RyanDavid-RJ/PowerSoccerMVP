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
                const usuarioId = result.insertId;
                usuario = { id: usuarioId, nome: name || email.split('@')[0], email };

                // Starter Pack: atletas e partidas
                const atletas = [
                    { nome: 'Félix', numero_camisa: 1 },
                    { nome: 'Brito', numero_camisa: 2 },
                    { nome: 'Piazza', numero_camisa: 3 },
                    { nome: 'Carlos Alberto Torres', numero_camisa: 4 },
                    { nome: 'Clodoaldo', numero_camisa: 5 },
                    { nome: 'Jairzinho', numero_camisa: 7 },
                    { nome: 'Gérson', numero_camisa: 8 },
                    { nome: 'Tostão', numero_camisa: 9 },
                    { nome: 'Pelé', numero_camisa: 10 },
                    { nome: 'Rivellino', numero_camisa: 11 },
                    { nome: 'Everaldo', numero_camisa: 16 },
                ];

                const partidas = [
                    { adversario: 'Inglaterra', data_jogo: '2025-03-23' },
                    { adversario: 'Itália', data_jogo: '2025-03-16' },
                    { adversario: 'Flamengo', data_jogo: '2026-06-08' },
                ];

                const escalacaoVazia = JSON.stringify({
                    titulares: [null, null, null, null],
                    reservas: [null, null, null, null],
                });

                const insertsAtletas = atletas.map(a =>
                    db.query(
                        'INSERT INTO atletas (nome, numero_camisa, equipe_id, usuario_id) VALUES (?, ?, 1, ?)',
                        [a.nome, a.numero_camisa, usuarioId]
                    )
                );

                const insertsPartidas = partidas.map(p =>
                    db.query(
                        'INSERT INTO partidas (data_jogo, adversario, escalacao, usuario_id) VALUES (?, ?, ?, ?)',
                        [p.data_jogo, p.adversario, escalacaoVazia, usuarioId]
                    )
                );

                await Promise.all([...insertsAtletas, ...insertsPartidas]);
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