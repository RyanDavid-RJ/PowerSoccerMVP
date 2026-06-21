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
                
                for (let a of atletas) {
                    const [res] = await db.query(
                        'INSERT INTO atletas (nome, numero_camisa, equipe_id, foto, usuario_id) VALUES (?, ?, 1, ?, ?)',
                        [a.nome, a.numero_camisa, a.foto, usuarioId]
                    );
                    atletasInseridos.push({ id: res.insertId, nome: a.nome, numero_camisa: a.numero_camisa, foto: a.foto });
                }

                const escalacaoPreenchida = JSON.stringify({
                    titulares: atletasInseridos.slice(0, 4),
                    reservas: atletasInseridos.slice(4, 8)
                });

                const partidas = [
                    { adversario: 'Inglaterra', data_jogo: '2025-03-23' },
                    { adversario: 'Itália', data_jogo: '2025-03-16' },
                    { adversario: 'Flamengo', data_jogo: '2026-06-08' },
                ];

                let partidasInseridas = [];
                for (let p of partidas) {
                    const [res] = await db.query(
                        'INSERT INTO partidas (data_jogo, adversario, escalacao, usuario_id) VALUES (?, ?, ?, ?)',
                        [p.data_jogo, p.adversario, escalacaoPreenchida, usuarioId]
                    );
                    partidasInseridas.push({ id: res.insertId, adversario: p.adversario });
                }

                const idInglaterra = partidasInseridas[0].id;
                const idItalia = partidasInseridas[1].id;

                const a = atletasInseridos; // alias para facilitar leitura dos índices

                const eventos = [
                    // Partida 1 – Inglaterra (12 eventos)
                    { partida_id: idInglaterra, atleta_id: a[6].id, periodo: '1º Tempo', minuto_video: '05:30', tipo_acao: 'Passe Certo', coord_x: 45, coord_y: 60 },
                    { partida_id: idInglaterra, atleta_id: a[8].id, periodo: '1º Tempo', minuto_video: '12:45', tipo_acao: 'Gol', coord_x: 80, coord_y: 30 },
                    { partida_id: idInglaterra, atleta_id: a[1].id, periodo: '1º Tempo', minuto_video: '18:20', tipo_acao: 'Passe Errado', coord_x: 20, coord_y: 70 },
                    { partida_id: idInglaterra, atleta_id: a[2].id, periodo: '1º Tempo', minuto_video: '25:10', tipo_acao: 'Interceptação', coord_x: 50, coord_y: 50 },
                    { partida_id: idInglaterra, atleta_id: a[5].id, periodo: '1º Tempo', minuto_video: '30:00', tipo_acao: 'Finalização', coord_x: 85, coord_y: 45 },
                    { partida_id: idInglaterra, atleta_id: a[9].id, periodo: '1º Tempo', minuto_video: '35:40', tipo_acao: 'Passe Certo', coord_x: 30, coord_y: 40 },
                    { partida_id: idInglaterra, atleta_id: a[7].id, periodo: '1º Tempo', minuto_video: '40:15', tipo_acao: 'Gol', coord_x: 75, coord_y: 55 },
                    { partida_id: idInglaterra, atleta_id: a[4].id, periodo: '2º Tempo', minuto_video: '50:20', tipo_acao: 'Interceptação', coord_x: 60, coord_y: 65 },
                    { partida_id: idInglaterra, atleta_id: a[3].id, periodo: '2º Tempo', minuto_video: '55:10', tipo_acao: 'Passe Certo', coord_x: 15, coord_y: 50 },
                    { partida_id: idInglaterra, atleta_id: a[8].id, periodo: '2º Tempo', minuto_video: '62:30', tipo_acao: 'Finalização', coord_x: 82, coord_y: 35 },
                    { partida_id: idInglaterra, atleta_id: a[5].id, periodo: '2º Tempo', minuto_video: '70:00', tipo_acao: 'Gol', coord_x: 78, coord_y: 40 },
                    { partida_id: idInglaterra, atleta_id: a[10].id, periodo: '2º Tempo', minuto_video: '78:15', tipo_acao: 'Passe Errado', coord_x: 40, coord_y: 80 },
                    // Partida 2 – Itália (6 eventos)
                    { partida_id: idItalia, atleta_id: a[8].id, periodo: '1º Tempo', minuto_video: '08:45', tipo_acao: 'Passe Certo', coord_x: 55, coord_y: 55 },
                    { partida_id: idItalia, atleta_id: a[9].id, periodo: '1º Tempo', minuto_video: '15:30', tipo_acao: 'Gol', coord_x: 88, coord_y: 25 },
                    { partida_id: idItalia, atleta_id: a[0].id, periodo: '1º Tempo', minuto_video: '22:10', tipo_acao: 'Interceptação', coord_x: 10, coord_y: 15 },
                    { partida_id: idItalia, atleta_id: a[6].id, periodo: '1º Tempo', minuto_video: '35:50', tipo_acao: 'Passe Errado', coord_x: 35, coord_y: 75 },
                    { partida_id: idItalia, atleta_id: a[7].id, periodo: '2º Tempo', minuto_video: '48:20', tipo_acao: 'Finalização', coord_x: 84, coord_y: 50 },
                    { partida_id: idItalia, atleta_id: a[8].id, periodo: '2º Tempo', minuto_video: '65:00', tipo_acao: 'Gol', coord_x: 80, coord_y: 20 },
                ];

                const insertsEventos = eventos.map(ev =>
                    db.query(
                        `INSERT INTO eventos_scout 
                         (partida_id, atleta_id, usuario_id, periodo, minuto_video, tipo_acao, coord_x, coord_y) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [ev.partida_id, ev.atleta_id, usuarioId, ev.periodo, ev.minuto_video, ev.tipo_acao, ev.coord_x, ev.coord_y]
                    )
                );

                await Promise.all(insertsEventos);
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

module.exports = authController; // TUDO OK???