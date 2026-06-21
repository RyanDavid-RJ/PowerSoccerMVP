const db = require('../config/db');
const { uploadToCloudinary } = require('../config/cloudinary');

const atletaController = {
    listarAtletas: async (req, res) => {
        try {
            const [resultados] = await db.query('SELECT * FROM atletas WHERE usuario_id = ? ORDER BY id ASC', [req.user.id]);
            res.json(resultados);
        } catch (erro) {
            console.error('Erro ao listar atletas:', erro);
            res.status(500).json({ erro: 'Erro ao buscar atletas' });
        }
    },

    cadastrarAtleta: async (req, res) => {
        try {
            const { nome, numero_camisa } = req.body;
            let fotoUrl = null;

            if (req.file) {
                const uploadResult = await uploadToCloudinary(req.file.buffer, 'power_soccer_v2_elenco');
                fotoUrl = uploadResult.secure_url;
            }

            const sql = 'INSERT INTO atletas (nome, numero_camisa, equipe_id, foto, usuario_id) VALUES (?, ?, 1, ?, ?)';
            const [resultados] = await db.query(sql, [nome, numero_camisa, fotoUrl, req.user.id]);
            
            res.status(201).json({ 
                mensagem: 'Atleta cadastrado com sucesso!', 
                id: resultados.insertId,
                foto: fotoUrl
            });
        } catch (erro) {
            console.error('ERRO NO CADASTRO:', erro);
            res.status(500).json({ erro: 'Erro no banco de dados', detalhes: erro.message });
        }
    },

    editarAtleta: async (req, res) => {
        try {
            const { id } = req.params;
            const { nome, numero_camisa } = req.body;
            let fotoUrl = null;

            if (req.file) {
                const uploadResult = await uploadToCloudinary(req.file.buffer, 'power_soccer_v2_elenco');
                fotoUrl = uploadResult.secure_url;
            }

            let sql, params;
            if (fotoUrl) {
                sql = 'UPDATE atletas SET nome = ?, numero_camisa = ?, foto = ? WHERE id = ? AND usuario_id = ?';
                params = [nome, numero_camisa, fotoUrl, id, req.user.id];
            } else {
                sql = 'UPDATE atletas SET nome = ?, numero_camisa = ? WHERE id = ? AND usuario_id = ?';
                params = [nome, numero_camisa, id, req.user.id];
            }

            await db.query(sql, params);
            res.json({ sucesso: true, mensagem: 'Atleta atualizado com sucesso!' });
        } catch (erro) {
            console.error('Erro ao editar atleta:', erro);
            res.status(500).json({ erro: 'Erro ao atualizar dados' });
        }
    },

    deletarAtleta: async (req, res) => {
        try {
            const { id } = req.params;
            await db.query('DELETE FROM atletas WHERE id = ? AND usuario_id = ?', [id, req.user.id]);
            res.json({ mensagem: 'Atleta removido com sucesso!' });
        } catch (erro) {
            console.error('Erro ao deletar atleta:', erro);
            res.status(500).json({ erro: 'Erro ao excluir atleta' });
        }
    },

    listarEstatisticas: async (req, res) => {
        try {
            res.json({ gols: 12, passes: 45, interceptacoes: 8 });
        } catch (erro) {
            res.status(500).json({ erro: 'Erro ao buscar estatísticas' });
        }
    }
};

module.exports = atletaController;