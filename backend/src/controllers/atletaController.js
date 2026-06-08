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

    // --- NOVA FUNÇÃO DE EDIÇÃO ---
    editarAtleta: async (req, res) => {
        try {
            const { id } = req.params;
            const { nome, numero_camisa } = req.body;
            let sql = 'UPDATE atletas SET nome = ?, numero_camisa = ? WHERE id = ?';
            let params = [nome, numero_camisa, id];

            // Se o usuário mandou uma foto nova, atualiza a foto também
            if (req.file) {
                sql = 'UPDATE atletas SET nome = ?, numero_camisa = ?, foto = ? WHERE id = ?';
                params = [nome, numero_camisa, req.file.path, id];
            }

            await db.query(sql, params);
            res.json({ sucesso: true, mensagem: 'Atleta atualizado!' });
        } catch (erro) {
            console.error('Erro ao editar atleta:', erro);
            res.status(500).json({ erro: 'Erro ao atualizar dados' });
        }
    },

    deletarAtleta: async (req, res) => {
        // Mantemos a rota no backend por segurança estrutural, mas o frontend não vai mais usá-la.
        try {
            const { id } = req.params;
            await db.query('DELETE FROM atletas WHERE id = ?', [id]);
            res.json({ mensagem: 'Removido!' });
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao excluir' });
        }
    },

    listarEstatisticas: async (req, res) => {
        try {
            res.json({ gols: 12, passes: 45, interceptacoes: 8 }); 
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao buscar stats' });
        }
    }
};

module.exports = atletaController;