const db = require('../config/db');

const eventoController = {
    listarPorPartida: async (req, res) => {
        try {
            const { id } = req.params;
            const sql = `
                SELECT e.*, a.nome as nome_atleta, a.foto as foto_atleta
                FROM eventos_scout e 
                INNER JOIN partidas p ON e.partida_id = p.id AND p.usuario_id = ?
                LEFT JOIN atletas a ON e.atleta_id = a.id 
                WHERE e.partida_id = ? 
                ORDER BY e.id ASC
            `;
            const [resultados] = await db.query(sql, [req.user.id, id]);
            res.json(resultados);
        } catch (erro) {
            console.error('Erro ao buscar eventos da partida:', erro);
            res.status(500).json({ erro: 'Erro ao buscar eventos' });
        }
    },

    criarEvento: async (req, res) => {
        try {
            const { partida_id, atleta_id, minuto_video, tipo_acao, coord_x, coord_y, jogador_entrou_id, periodo } = req.body;
            const usuario_id = req.user.id;

            const sql = `
                INSERT INTO eventos_scout 
                (partida_id, atleta_id, usuario_id, minuto_video, tipo_acao, coord_x, coord_y, jogador_entrou_id, periodo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [resultados] = await db.query(sql, [
                partida_id, 
                atleta_id, 
                usuario_id, 
                minuto_video, 
                tipo_acao, 
                coord_x, 
                coord_y, 
                jogador_entrou_id || null,
                periodo || null
            ]);
            
            res.status(201).json({ sucesso: true, id: resultados.insertId });
        } catch (erro) {
            console.error('Erro ao registrar evento:', erro);
            res.status(500).json({ erro: 'Erro ao salvar o evento' });
        }
    },

    editarEvento: async (req, res) => {
        try {
            const { id } = req.params;
            const { tipo_acao, minuto_video } = req.body;

            const sql = `
                UPDATE eventos_scout e
                INNER JOIN partidas p ON e.partida_id = p.id AND p.usuario_id = ?
                SET e.tipo_acao = ?, e.minuto_video = ?
                WHERE e.id = ?
            `;
            await db.query(sql, [req.user.id, tipo_acao, minuto_video, id]);
            res.json({ sucesso: true });
        } catch (erro) {
            console.error('Erro ao editar evento:', erro);
            res.status(500).json({ erro: 'Erro ao editar o evento' });
        }
    },

    deletarEvento: async (req, res) => {
        try {
            const { id } = req.params;

            const sql = `
                DELETE e FROM eventos_scout e
                INNER JOIN partidas p ON e.partida_id = p.id AND p.usuario_id = ?
                WHERE e.id = ?
            `;
            await db.query(sql, [req.user.id, id]);
            res.json({ sucesso: true });
        } catch (erro) {
            console.error('Erro ao deletar evento:', erro);
            res.status(500).json({ erro: 'Erro ao apagar o evento' });
        }
    },

    estatisticasAtleta: async (req, res) => {
        try {
            const { id } = req.params;
            const sql = `
                SELECT a.*, 
                SUM(CASE WHEN e.tipo_acao = "Gol" THEN 1 ELSE 0 END) as gols,
                SUM(CASE WHEN e.tipo_acao = "Passe Certo" THEN 1 ELSE 0 END) as passes_certos,
                SUM(CASE WHEN e.tipo_acao = "Passe Errado" THEN 1 ELSE 0 END) as passes_errados,
                SUM(CASE WHEN e.tipo_acao = "Interceptação" THEN 1 ELSE 0 END) as interceptacoes
                FROM atletas a 
                LEFT JOIN eventos_scout e ON a.id = e.atleta_id 
                WHERE a.id = ? AND a.usuario_id = ?
                GROUP BY a.id
            `;
            const [resultados] = await db.query(sql, [id, req.user.id]);
            res.json(resultados[0] || {});
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao gerar raio-x do atleta' });
        }
    },
    
    listarPorAtleta: async (req, res) => {
        try {
            const { id } = req.params;
            const sql = `
                SELECT e.* FROM eventos_scout e
                INNER JOIN atletas a ON e.atleta_id = a.id
                WHERE a.id = ? AND a.usuario_id = ?
                ORDER BY e.id ASC
            `;
            const [resultados] = await db.query(sql, [id, req.user.id]);
            res.json(resultados);
        } catch (erro) {
            res.status(500).json({ erro: 'Erro interno' });
        }
    }
};

module.exports = eventoController;