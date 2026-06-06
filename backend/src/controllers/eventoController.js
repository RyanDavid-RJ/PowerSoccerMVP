const db = require('../config/db');

const eventoController = {
    // Buscar todos os lances de uma partida específica (para carregar o mapa e a timeline)
    listarPorPartida: async (req, res) => {
        try {
            const { id } = req.params;
            const sql = `
                SELECT e.*, a.nome as nome_atleta 
                FROM eventos_scout e 
                LEFT JOIN atletas a ON e.atleta_id = a.id 
                WHERE e.partida_id = ? 
                ORDER BY e.id ASC
            `;
            const [resultados] = await db.query(sql, [id]);
            res.json(resultados);
        } catch (erro) {
            console.error('Erro ao buscar eventos da partida:', erro);
            res.status(500).json({ erro: 'Erro ao buscar eventos' });
        }
    },

    // Registrar um novo lance ou substituição
    criarEvento: async (req, res) => {
        try {
            const { partida_id, atleta_id, usuario_id, minuto_video, tipo_acao, coord_x, coord_y, jogador_entrou_id } = req.body;
            
            const sql = `
                INSERT INTO eventos_scout 
                (partida_id, atleta_id, usuario_id, minuto_video, tipo_acao, coord_x, coord_y, jogador_entrou_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [resultados] = await db.query(sql, [partida_id, atleta_id, usuario_id, minuto_video, tipo_acao, coord_x, coord_y, jogador_entrou_id || null]);
            
            res.status(201).json({ sucesso: true, id: resultados.insertId });
        } catch (erro) {
            console.error('Erro ao registrar evento:', erro);
            res.status(500).json({ erro: 'Erro ao salvar o evento' });
        }
    },

    // Editar uma ação errada do scout
    editarEvento: async (req, res) => {
        try {
            const { id } = req.params;
            const { tipo_acao, minuto_video } = req.body;
            const sql = 'UPDATE eventos_scout SET tipo_acao = ?, minuto_video = ? WHERE id = ?';
            
            await db.query(sql, [tipo_acao, minuto_video, id]);
            res.json({ sucesso: true });
        } catch (erro) {
            console.error('Erro ao editar evento:', erro);
            res.status(500).json({ erro: 'Erro ao editar o evento' });
        }
    },

    // Deletar um lance
    deletarEvento: async (req, res) => {
        try {
            const { id } = req.params;
            await db.query('DELETE FROM eventos_scout WHERE id = ?', [id]);
            res.json({ sucesso: true });
        } catch (erro) {
            console.error('Erro ao deletar evento:', erro);
            res.status(500).json({ erro: 'Erro ao apagar o evento' });
        }
    },

    // Estatísticas brutas do Atleta (Para o modal de Raio-X do elenco)
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
                WHERE a.id = ? 
                GROUP BY a.id
            `;
            const [resultados] = await db.query(sql, [id]);
            // O MySQL retorna um array, pegamos a posição 0 ou um objeto vazio
            res.json(resultados[0] || {});
        } catch (erro) {
            console.error('Erro ao gerar estatísticas:', erro);
            res.status(500).json({ erro: 'Erro ao gerar raio-x do atleta' });
        }
    },
    
    // Lista os lances crus de um atleta específico (usado para o gráfico de linha)
    listarPorAtleta: async (req, res) => {
        try {
            const { id } = req.params;
            const [resultados] = await db.query('SELECT * FROM eventos_scout WHERE atleta_id = ? ORDER BY id ASC', [id]);
            res.json(resultados);
        } catch (erro) {
            console.error('Erro ao buscar eventos do atleta:', erro);
            res.status(500).json({ erro: 'Erro interno' });
        }
    }
};

module.exports = eventoController;