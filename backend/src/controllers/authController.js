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

                // -------------------------------------------------------------
                // 1. CRIAÇÃO DOS ATLETAS (Respeitando a ordem do seu CSV)
                // -------------------------------------------------------------
                const atletasTemplate = [
                    { nome: 'Félix', numero_camisa: 1, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787140/power_soccer_v2_elenco/t3dqwdrtosizvitourq2.jpg' },                 // a[0]
                    { nome: 'Carlos Alberto Torres', numero_camisa: 4, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787176/power_soccer_v2_elenco/onxqa7mo0kgbdhuhmn0u.jpg' }, // a[1]
                    { nome: 'Brito', numero_camisa: 2, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787349/power_soccer_v2_elenco/zc9krzpi4ml7eo7kpork.jpg' },                 // a[2]
                    { nome: 'Piazza', numero_camisa: 3, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787380/power_soccer_v2_elenco/svvaix1puutroke07qdi.jpg' },                // a[3]
                    { nome: 'Everaldo', numero_camisa: 16, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787401/power_soccer_v2_elenco/vqnibmq4wa1oahkst44d.jpg' },              // a[4]
                    { nome: 'Clodoaldo', numero_camisa: 5, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787432/power_soccer_v2_elenco/fttsq2o3dezmwqctoj4c.jpg' },               // a[5]
                    { nome: 'Gérson', numero_camisa: 8, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787475/power_soccer_v2_elenco/wcymvr98ru7hdhkzh0as.jpg' },                  // a[6]
                    { nome: 'Jairzinho', numero_camisa: 7, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787498/power_soccer_v2_elenco/d5n2cvqarxd0rs4o4hkx.jpg' },               // a[7]
                    { nome: 'Tostão', numero_camisa: 9, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787566/power_soccer_v2_elenco/we7fvcpxux613omjjjtp.jpg' },                  // a[8]
                    { nome: 'Pelé', numero_camisa: 10, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787592/power_soccer_v2_elenco/gyjftmtc7zegdjeaeq0y.jpg' },                   // a[9]
                    { nome: 'Rivellino', numero_camisa: 11, foto: 'https://res.cloudinary.com/dupo1z8a6/image/upload/v1780787648/power_soccer_v2_elenco/y6fcywwng4oksnebvtjt.jpg' },               // a[10]
                ];

                let a = []; // Guardará os IDs reais do banco de dados na mesma ordem
                
                for (let atleta of atletasTemplate) {
                    const [res] = await db.query(
                        'INSERT INTO atletas (nome, numero_camisa, equipe_id, foto, usuario_id) VALUES (?, ?, 1, ?, ?)',
                        [atleta.nome, atleta.numero_camisa, atleta.foto, usuarioId]
                    );
                    a.push(res.insertId);
                }

                // -------------------------------------------------------------
                // 2. CRIAÇÃO DAS PARTIDAS (Inglaterra e Itália)
                // -------------------------------------------------------------
                
                // Escalação Inglaterra (Partida 1)
                const escInglaterra = JSON.stringify({
                    titulares: [{ id: a[0] }, { id: a[7] }, { id: a[9] }, { id: a[10] }],
                    reservas: [{ id: a[1] }, { id: a[6] }, { id: a[8] }, { id: a[5] }]
                });

                // Escalação Itália (Partida 2)
                const escItalia = JSON.stringify({
                    titulares: [{ id: a[0] }, { id: a[1] }, { id: a[8] }, { id: a[9] }],
                    reservas: [{ id: a[2] }, { id: a[3] }, { id: a[4] }, { id: a[5] }]
                });

                // Escalação Flamengo (Partida 3 - Vazia / para o usuário testar o banco)
                const escFlamengo = JSON.stringify({
                    titulares: [{ id: a[7] }, { id: a[2] }, { id: a[3] }, { id: a[6] }],
                    reservas: [{ id: a[9] }, { id: a[5] }, { id: a[1] }, { id: a[0] }]
                });

                const [pInglaterra] = await db.query('INSERT INTO partidas (data_jogo, adversario, escalacao, usuario_id) VALUES (?, ?, ?, ?)', ['2025-03-24', 'Inglaterra', escInglaterra, usuarioId]);
                const [pItalia] = await db.query('INSERT INTO partidas (data_jogo, adversario, escalacao, usuario_id) VALUES (?, ?, ?, ?)', ['2025-03-17', 'Itália', escItalia, usuarioId]);
                const [pFlamengo] = await db.query('INSERT INTO partidas (data_jogo, adversario, escalacao, usuario_id) VALUES (?, ?, ?, ?)', ['2026-06-09', 'Flamengo', escFlamengo, usuarioId]);

                const idInglaterra = pInglaterra.insertId;
                const idItalia = pItalia.insertId;

                // -------------------------------------------------------------
                // 3. INJEÇÃO DOS EVENTOS EXATOS DO SEU CSV
                // -------------------------------------------------------------
                const eventos = [
                    // ===== EVENTOS INGLATERRA (Partida 1) =====
                    { partida_id: idInglaterra, atleta_id: a[7], periodo: '1º Tempo', minuto_video: '09:11', tipo_acao: 'Gol', coord_x: 66, coord_y: 43 },
                    { partida_id: idInglaterra, atleta_id: a[10], periodo: '2º Tempo', minuto_video: '25:30', tipo_acao: 'Gol', coord_x: 71, coord_y: 39 },
                    { partida_id: idInglaterra, atleta_id: a[0], periodo: '1º Tempo', minuto_video: '02:20', tipo_acao: 'Passe Certo', coord_x: 30, coord_y: 51 },
                    { partida_id: idInglaterra, atleta_id: a[7], periodo: '1º Tempo', minuto_video: '06:05', tipo_acao: 'Passe Certo', coord_x: 47, coord_y: 59 },
                    { partida_id: idInglaterra, atleta_id: a[9], periodo: '1º Tempo', minuto_video: '12:30', tipo_acao: 'Passe Certo', coord_x: 62, coord_y: 64 },
                    { partida_id: idInglaterra, atleta_id: a[10], periodo: '1º Tempo', minuto_video: '17:40', tipo_acao: 'Passe Certo', coord_x: 25, coord_y: 73 },
                    { partida_id: idInglaterra, atleta_id: a[0], periodo: '2º Tempo', minuto_video: '34:20', tipo_acao: 'Passe Certo', coord_x: 43, coord_y: 41 },
                    { partida_id: idInglaterra, atleta_id: a[7], periodo: '1º Tempo', minuto_video: '15:50', tipo_acao: 'Passe Errado', coord_x: 49, coord_y: 66 },
                    { partida_id: idInglaterra, atleta_id: a[10], periodo: '2º Tempo', minuto_video: '30:15', tipo_acao: 'Passe Errado', coord_x: 70, coord_y: 26 },
                    { partida_id: idInglaterra, atleta_id: a[0], periodo: '1º Tempo', minuto_video: '04:40', tipo_acao: 'Interceptação', coord_x: 36, coord_y: 33 },
                    { partida_id: idInglaterra, atleta_id: a[7], periodo: '2º Tempo', minuto_video: '36:05', tipo_acao: 'Interceptação', coord_x: 45, coord_y: 27 },
                    { partida_id: idInglaterra, atleta_id: a[0], periodo: '2º Tempo', minuto_video: '34:21', tipo_acao: 'Gol', coord_x: 71.46, coord_y: 85.77 },
                    { partida_id: idInglaterra, atleta_id: a[10], periodo: null, minuto_video: '31:33', tipo_acao: 'Substituição', jogador_entrou_id: a[1], coord_x: null, coord_y: null },
                    { partida_id: idInglaterra, atleta_id: a[1], periodo: '2º Tempo', minuto_video: '31:34', tipo_acao: 'Finalização', coord_x: 85.85, coord_y: 52.2 },
                    { partida_id: idInglaterra, atleta_id: a[0], periodo: '1º Tempo', minuto_video: '19:55', tipo_acao: 'Passe Certo', coord_x: 32.78, coord_y: 82.85 },
                    { partida_id: idInglaterra, atleta_id: a[0], periodo: '2º Tempo', minuto_video: '21:54', tipo_acao: 'Passe Errado', coord_x: 46.23, coord_y: 86.87 },
                    { partida_id: idInglaterra, atleta_id: a[0], periodo: '2º Tempo', minuto_video: '25:07', tipo_acao: 'Gol', coord_x: 71.7, coord_y: 63.51 },
                    { partida_id: idInglaterra, atleta_id: a[0], periodo: '2º Tempo', minuto_video: '28:15', tipo_acao: 'Finalização', coord_x: 28.3, coord_y: 20.44 },
                    { partida_id: idInglaterra, atleta_id: a[0], periodo: '2º Tempo', minuto_video: '32:48', tipo_acao: 'Interceptação', coord_x: 79.72, coord_y: 24.09 },
                    { partida_id: idInglaterra, atleta_id: a[0], periodo: '2º Tempo', minuto_video: '32:03', tipo_acao: 'Passe Errado', coord_x: 15.33, coord_y: 19.71 },
                    { partida_id: idInglaterra, atleta_id: a[7], periodo: '2º Tempo', minuto_video: '14:10', tipo_acao: 'Gol', coord_x: 15.33, coord_y: 20.44 },
                    { partida_id: idInglaterra, atleta_id: a[0], periodo: '2º Tempo', minuto_video: '34:35', tipo_acao: 'Gol', coord_x: 14.88, coord_y: 58.11 },
                    { partida_id: idInglaterra, atleta_id: a[0], periodo: '2º Tempo', minuto_video: '37:13', tipo_acao: 'Passe Certo', coord_x: 91.75, coord_y: 21.59 },
                    { partida_id: idInglaterra, atleta_id: a[0], periodo: '1º Tempo', minuto_video: '10:47', tipo_acao: 'Gol', coord_x: 18.75, coord_y: 38.69 },
                    { partida_id: idInglaterra, atleta_id: a[7], periodo: '1º Tempo', minuto_video: '19:30', tipo_acao: 'Finalização', coord_x: 51.65, coord_y: 26.38 },
                    { partida_id: idInglaterra, atleta_id: a[1], periodo: null, minuto_video: '34:37', tipo_acao: 'Substituição', jogador_entrou_id: a[8], coord_x: null, coord_y: null },
                    { partida_id: idInglaterra, atleta_id: a[8], periodo: '2º Tempo', minuto_video: '37:14', tipo_acao: 'Passe Errado', coord_x: 94.87, coord_y: 54.38 },
                    { partida_id: idInglaterra, atleta_id: a[10], periodo: '2º Tempo', minuto_video: '25:36', tipo_acao: 'Passe Errado', coord_x: 96.84, coord_y: 11.14 },
                    { partida_id: idInglaterra, atleta_id: a[0], periodo: '2º Tempo', minuto_video: '31:51', tipo_acao: 'Gol', coord_x: 76.25, coord_y: 37.66 },
                    { partida_id: idInglaterra, atleta_id: a[9], periodo: '1º Tempo', minuto_video: '09:59', tipo_acao: 'Passe Certo', coord_x: 57.75, coord_y: 25 },
                    { partida_id: idInglaterra, atleta_id: a[9], periodo: '1º Tempo', minuto_video: '16:43', tipo_acao: 'Passe Errado', coord_x: 20.88, coord_y: 50.66 },
                    { partida_id: idInglaterra, atleta_id: a[9], periodo: '1º Tempo', minuto_video: '19:25', tipo_acao: 'Passe Errado', coord_x: 26.88, coord_y: 38.06 },
                    { partida_id: idInglaterra, atleta_id: a[9], periodo: '2º Tempo', minuto_video: '26:20', tipo_acao: 'Passe Errado', coord_x: 64.5, coord_y: 29.66 },
                    { partida_id: idInglaterra, atleta_id: a[9], periodo: '2º Tempo', minuto_video: '28:45', tipo_acao: 'Finalização', coord_x: 56.63, coord_y: 75.86 },
                    { partida_id: idInglaterra, atleta_id: a[9], periodo: '2º Tempo', minuto_video: '32:05', tipo_acao: 'Passe Errado', coord_x: 58.88, coord_y: 48.86 },
                    { partida_id: idInglaterra, atleta_id: a[9], periodo: '2º Tempo', minuto_video: '26:16', tipo_acao: 'Passe Errado', coord_x: 35.13, coord_y: 62.06 },
                    { partida_id: idInglaterra, atleta_id: a[9], periodo: '1º Tempo', minuto_video: '19:53', tipo_acao: 'Passe Errado', coord_x: 84.75, coord_y: 76.26 },

                    // ===== EVENTOS ITÁLIA (Partida 2) =====
                    { partida_id: idItalia, atleta_id: a[9], periodo: '1º Tempo', minuto_video: '18:45', tipo_acao: 'Passe Errado', coord_x: 58, coord_y: 40 },
                    { partida_id: idItalia, atleta_id: a[0], periodo: '1º Tempo', minuto_video: '05:10', tipo_acao: 'Passe Certo', coord_x: 32, coord_y: 49 },
                    { partida_id: idItalia, atleta_id: a[1], periodo: '1º Tempo', minuto_video: '11:30', tipo_acao: 'Passe Certo', coord_x: 44, coord_y: 56 },
                    { partida_id: idItalia, atleta_id: a[8], periodo: '1º Tempo', minuto_video: '21:00', tipo_acao: 'Passe Certo', coord_x: 63, coord_y: 61 },
                    { partida_id: idItalia, atleta_id: a[9], periodo: '1º Tempo', minuto_video: '27:15', tipo_acao: 'Passe Certo', coord_x: 27, coord_y: 71 },
                    { partida_id: idItalia, atleta_id: a[1], periodo: '1º Tempo', minuto_video: '14:20', tipo_acao: 'Passe Certo', coord_x: 52, coord_y: 64 },
                    { partida_id: idItalia, atleta_id: a[9], periodo: '1º Tempo', minuto_video: '31:50', tipo_acao: 'Passe Errado', coord_x: 68, coord_y: 22 },
                    { partida_id: idItalia, atleta_id: a[0], periodo: '1º Tempo', minuto_video: '08:50', tipo_acao: 'Interceptação', coord_x: 38, coord_y: 31 },
                    { partida_id: idItalia, atleta_id: a[10], periodo: '1º Tempo', minuto_video: '29:10', tipo_acao: 'Interceptação', coord_x: 73, coord_y: 54 },
                    { partida_id: idItalia, atleta_id: a[0], periodo: '1º Tempo', minuto_video: '06:26', tipo_acao: 'Passe Errado', coord_x: 15, coord_y: 41.14 },
                    { partida_id: idItalia, atleta_id: a[0], periodo: '1º Tempo', minuto_video: '06:42', tipo_acao: 'Passe Errado', coord_x: 15, coord_y: 25 },
                    { partida_id: idItalia, atleta_id: a[0], periodo: '1º Tempo', minuto_video: '08:01', tipo_acao: 'Passe Errado', coord_x: 15, coord_y: 71.34 },
                    { partida_id: idItalia, atleta_id: a[0], periodo: '1º Tempo', minuto_video: '09:09', tipo_acao: 'Passe Errado', coord_x: 37.79, coord_y: 25 },
                    { partida_id: idItalia, atleta_id: a[1], periodo: '1º Tempo', minuto_video: '15:18', tipo_acao: 'Interceptação', coord_x: 66.79, coord_y: 26.14 },
                    { partida_id: idItalia, atleta_id: a[1], periodo: '1º Tempo', minuto_video: '15:56', tipo_acao: 'Interceptação', coord_x: 25.29, coord_y: 64.14 },
                    { partida_id: idItalia, atleta_id: a[8], periodo: '2º Tempo', minuto_video: '23:49', tipo_acao: 'Passe Errado', coord_x: 15, coord_y: 34.54 },
                    { partida_id: idItalia, atleta_id: a[8], periodo: '2º Tempo', minuto_video: '24:49', tipo_acao: 'Passe Errado', coord_x: 25.92, coord_y: 79.74 },
                    { partida_id: idItalia, atleta_id: a[8], periodo: '2º Tempo', minuto_video: '25:30', tipo_acao: 'Passe Certo', coord_x: 56.92, coord_y: 25 },
                    { partida_id: idItalia, atleta_id: a[8], periodo: '2º Tempo', minuto_video: '23:50', tipo_acao: 'Passe Certo', coord_x: 53.92, coord_y: 87.54 },
                    { partida_id: idItalia, atleta_id: a[8], periodo: '2º Tempo', minuto_video: '25:57', tipo_acao: 'Passe Certo', coord_x: 78.92, coord_y: 25 },
                    { partida_id: idItalia, atleta_id: a[8], periodo: '2º Tempo', minuto_video: '27:14', tipo_acao: 'Passe Certo', coord_x: 85, coord_y: 25 },
                    { partida_id: idItalia, atleta_id: a[8], periodo: '2º Tempo', minuto_video: '30:00', tipo_acao: 'Interceptação', coord_x: 33.42, coord_y: 55.34 },
                    { partida_id: idItalia, atleta_id: a[8], periodo: null, minuto_video: '31:28', tipo_acao: 'Substituição', jogador_entrou_id: a[4], coord_x: null, coord_y: null },
                    { partida_id: idItalia, atleta_id: a[4], periodo: '2º Tempo', minuto_video: '33:29', tipo_acao: 'Gol', coord_x: 85, coord_y: 44.94 },
                    { partida_id: idItalia, atleta_id: a[4], periodo: '2º Tempo', minuto_video: '34:59', tipo_acao: 'Passe Errado', coord_x: 15, coord_y: 46.94 },
                    { partida_id: idItalia, atleta_id: a[4], periodo: null, minuto_video: '36:42', tipo_acao: 'Substituição', jogador_entrou_id: a[5], coord_x: null, coord_y: null },
                    { partida_id: idItalia, atleta_id: a[5], periodo: '2º Tempo', minuto_video: '38:19', tipo_acao: 'Passe Errado', coord_x: 15, coord_y: 25 },
                    { partida_id: idItalia, atleta_id: a[5], periodo: '2º Tempo', minuto_video: '38:52', tipo_acao: 'Finalização', coord_x: 85, coord_y: 32.34 },
                    { partida_id: idItalia, atleta_id: a[5], periodo: '2º Tempo', minuto_video: '39:49', tipo_acao: 'Finalização', coord_x: 66.17, coord_y: 57.74 },
                    { partida_id: idItalia, atleta_id: a[1], periodo: '1º Tempo', minuto_video: '10:30', tipo_acao: 'Passe Errado', coord_x: 15, coord_y: 25 },
                    { partida_id: idItalia, atleta_id: a[1], periodo: '1º Tempo', minuto_video: '12:20', tipo_acao: 'Passe Errado', coord_x: 43.42, coord_y: 90 },
                    { partida_id: idItalia, atleta_id: a[1], periodo: '1º Tempo', minuto_video: '13:15', tipo_acao: 'Passe Errado', coord_x: 38.29, coord_y: 25 },
                    { partida_id: idItalia, atleta_id: a[9], periodo: '2º Tempo', minuto_video: '33:16', tipo_acao: 'Passe Errado', coord_x: 85, coord_y: 73.94 },
                    { partida_id: idItalia, atleta_id: a[9], periodo: '2º Tempo', minuto_video: '35:06', tipo_acao: 'Interceptação', coord_x: 15, coord_y: 34.74 },
                    { partida_id: idItalia, atleta_id: a[9], periodo: '2º Tempo', minuto_video: '35:34', tipo_acao: 'Passe Errado', coord_x: 23.29, coord_y: 56.14 },
                    { partida_id: idItalia, atleta_id: a[4], periodo: '2º Tempo', minuto_video: '32:22', tipo_acao: 'Passe Certo', coord_x: 15, coord_y: 25 },
                    { partida_id: idItalia, atleta_id: a[4], periodo: '2º Tempo', minuto_video: '35:30', tipo_acao: 'Passe Errado', coord_x: 69.78, coord_y: 25 },
                    { partida_id: idItalia, atleta_id: a[4], periodo: '2º Tempo', minuto_video: '33:46', tipo_acao: 'Gol', coord_x: 84.66, coord_y: 27.66 },
                    { partida_id: idItalia, atleta_id: a[9], periodo: '2º Tempo', minuto_video: '23:28', tipo_acao: 'Gol', coord_x: 81.41, coord_y: 28.06 },
                    { partida_id: idItalia, atleta_id: a[4], periodo: '2º Tempo', minuto_video: '34:18', tipo_acao: 'Finalização', coord_x: 82.28, coord_y: 73.26 },
                    { partida_id: idItalia, atleta_id: a[9], periodo: '1º Tempo', minuto_video: '08:27', tipo_acao: 'Finalização', coord_x: 31.78, coord_y: 31.66 },
                    { partida_id: idItalia, atleta_id: a[9], periodo: '1º Tempo', minuto_video: '12:34', tipo_acao: 'Finalização', coord_x: 55.78, coord_y: 81.66 },
                    { partida_id: idItalia, atleta_id: a[9], periodo: '1º Tempo', minuto_video: '19:14', tipo_acao: 'Finalização', coord_x: 40.91, coord_y: 25 },
                    { partida_id: idItalia, atleta_id: a[9], periodo: '2º Tempo', minuto_video: '26:07', tipo_acao: 'Finalização', coord_x: 74.91, coord_y: 68.06 },
                    { partida_id: idItalia, atleta_id: a[9], periodo: '2º Tempo', minuto_video: '30:13', tipo_acao: 'Finalização', coord_x: 81.16, coord_y: 40.06 },
                    { partida_id: idItalia, atleta_id: a[4], periodo: '2º Tempo', minuto_video: '33:44', tipo_acao: 'Interceptação', coord_x: 49.91, coord_y: 49.86 }
                ];

                const insertsEventos = eventos.map(ev =>
                    db.query(
                        `INSERT INTO eventos_scout 
                         (partida_id, atleta_id, usuario_id, periodo, minuto_video, tipo_acao, coord_x, coord_y, jogador_entrou_id) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [ev.partida_id, ev.atleta_id, usuarioId, ev.periodo, ev.minuto_video, ev.tipo_acao, ev.coord_x, ev.coord_y, ev.jogador_entrou_id || null]
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

module.exports = authController;