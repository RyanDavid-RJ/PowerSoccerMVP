const db = require('../config/db');

const partidaController = {
    listarPartidas: async (req, res) => {
        try {
            const [resultados] = await db.query(
                'SELECT * FROM partidas WHERE usuario_id = ? ORDER BY id DESC',
                [req.user.id]
            );
            res.json(resultados);
        } catch (erro) {
            console.error('Erro ao listar partidas:', erro);
            res.status(500).json({ erro: 'Erro interno ao buscar partidas' });
        }
    },

    buscarPartida: async (req, res) => {
        try {
            const { id } = req.params;
            const [resultados] = await db.query(
                'SELECT * FROM partidas WHERE id = ? AND usuario_id = ?',
                [id, req.user.id]
            );
            if (resultados.length === 0) return res.status(404).json({ erro: 'Partida não encontrada' });
            res.json(resultados[0]);
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao buscar partida' });
        }
    },

    criarPartida: async (req, res) => {
        try {
            const { data_jogo, adversario, escalacao } = req.body;
            const escalacaoStr = JSON.stringify(escalacao);
            
            const sql = 'INSERT INTO partidas (data_jogo, adversario, escalacao, usuario_id) VALUES (?, ?, ?, ?)';
            const [resultados] = await db.query(sql, [data_jogo, adversario, escalacaoStr, req.user.id]);
            
            res.status(201).json({ 
                mensagem: 'Partida iniciada com sucesso!', 
                id_partida: resultados.insertId 
            });
        } catch (erro) {
            console.error('Erro ao criar partida:', erro);
            res.status(500).json({ erro: 'Erro ao salvar a partida no banco de dados' });
        }
    }
};

module.exports = partidaController;