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

                // Starter Pack: Atletas com FOTOS REAIS
                const atletas = [
                    { nome: 'Félix', numero_camisa: 1, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787140/power_soccer_v2_elenco/t3dqwdrtosizvitourq2.jpg' },
                    { nome: 'Brito', numero_camisa: 2, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787349/power_soccer_v2_elenco/zc9krzpi4ml7eo7kpork.jpg' },
                    { nome: 'Piazza', numero_camisa: 3, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787380/power_soccer_v2_elenco/svvaix1puutroke07qdi.jpg' },
                    { nome: 'Carlos Alberto Torres', numero_camisa: 4, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787176/power_soccer_v2_elenco/onxqa7mo0kgbdhuhmn0u.jpg' },
                    { nome: 'Clodoaldo', numero_camisa: 5, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787432/power_soccer_v2_elenco/fttsq2o3dezmwqctoj4c.jpg' },
                    { nome: 'Jairzinho', numero_camisa: 7, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787498/power_soccer_v2_elenco/d5n2cvqarxd0rs4o4hkx.jpg' },
                    { nome: 'Gérson', numero_camisa: 8, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787475/power_soccer_v2_elenco/wcymvr98ru7hdhkzh0as.jpg' },
                    { nome: 'Tostão', numero_camisa: 9, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787566/power_soccer_v2_elenco/we7fvcpxux613omjjjtp.jpg' },
                    { nome: 'Pelé', numero_camisa: 10, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787592/power_soccer_v2_elenco/gyjftmtc7zegdjeaeq0y.jpg' },
                    { nome: 'Rivellino', numero_camisa: 11, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787648/power_soccer_v2_elenco/y6fcywwng4oksnebvtjt.jpg' },
                    { nome: 'Everaldo', numero_camisa: 16, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787401/power_soccer_v2_elenco/vqnibmq4wa1oahkst44d.jpg' },
                ];

                let atletasInseridos = [];
                
                // Insere os atletas e guarda os IDs reais gerados para esse usuário
                for (let a of atletas) {
                    const [res] = await db.query(
                        'INSERT INTO atletas (nome, numero_camisa, equipe_id, foto, usuario_id) VALUES (?, ?, 1, ?, ?)',
                        [a.nome, a.numero_camisa, a.foto, usuarioId]
                    );
                    atletasInseridos.push({ id: res.insertId, nome: a.nome, numero_camisa: a.numero_camisa, foto: a.foto });
                }

                // Cria uma escalação real pegando os primeiros 8 jogadores inseridos
                const escalacaoPreenchida = JSON.stringify({
                    titulares: atletasInseridos.slice(0, 4),
                    reservas: atletasInseridos.slice(4, 8)
                });

                const partidas = [
                    { adversario: 'Inglaterra', data_jogo: '2025-03-23' },
                    { adversario: 'Itália', data_jogo: '2025-03-16' },
                    { adversario: 'Flamengo', data_jogo: '2026-06-08' },
                ];

                // Insere as partidas já com o time escalado
                const insertsPartidas = partidas.map(p =>
                    db.query(
                        'INSERT INTO partidas (data_jogo, adversario, escalacao, usuario_id) VALUES (?, ?, ?, ?)',
                        [p.data_jogo, p.adversario, escalacaoPreenchida, usuarioId]
                    )
                );

                await Promise.all(insertsPartidas);
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