const db = require('../config/db');

const partidaController = {
    listarPartidas: async (req, res) => {
        try {
            const [resultados] = await db.query('SELECT * FROM partidas ORDER BY id DESC');
            res.json(resultados);
        } catch (erro) {
            console.error('Erro ao listar partidas:', erro);
            res.status(500).json({ erro: 'Erro interno ao buscar partidas' });
        }
    },

    // --- NOVA FUNÇÃO AQUI ---
    buscarPartida: async (req, res) => {
        try {
            const { id } = req.params;
            const [resultados] = await db.query('SELECT * FROM partidas WHERE id = ?', [id]);
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
            
            const sql = 'INSERT INTO partidas (data_jogo, adversario, escalacao) VALUES (?, ?, ?)';
            const [resultados] = await db.query(sql, [data_jogo, adversario, escalacaoStr]);
            
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