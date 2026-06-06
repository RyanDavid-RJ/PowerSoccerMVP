const db = require('../config/db');

const atletaController = {
    listarAtletas: async (req, res) => {
        try {
            const [resultados] = await db.query('SELECT * FROM atletas ORDER BY id ASC');
            res.json(resultados);
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao buscar' });
        }
    },

    cadastrarAtleta: async (req, res) => {
        try {
            console.log("--- PROCESSO DE CADASTRO ---");
            console.log("Nome:", req.body.nome);
            console.log("File (se existir):", req.file ? req.file.path : "Nenhum");

            const { nome, numero_camisa } = req.body;
            const fotoPath = req.file ? req.file.path : null; 
            
            const sql = 'INSERT INTO atletas (nome, numero_camisa, equipe_id, foto) VALUES (?, ?, 1, ?)';
            const [resultados] = await db.query(sql, [nome, numero_camisa, fotoPath]);
            
            res.status(201).json({ mensagem: 'Sucesso!', id: resultados.insertId });
        } catch (erro) {
            console.error('ERRO NO BANCO:', erro);
            res.status(500).json({ erro: 'Erro no banco de dados', detalhes: erro.message });
        }
    },

    deletarAtleta: async (req, res) => {
        try {
            const { id } = req.params;
            await db.query('DELETE FROM atletas WHERE id = ?', [id]);
            res.json({ mensagem: 'Removido!' });
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao excluir' });
        }
    },

    // --- FUNÇÃO ADICIONADA AQUI ---
    listarEstatisticas: async (req, res) => {
        try {
            res.json({ gols: 12, passes: 45, interceptacoes: 8 }); 
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao buscar stats' });
        }
    }
};

module.exports = atletaController;