const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary');
const atletaController = require('../controllers/atletaController');

router.get('/', atletaController.listarAtletas);
router.get('/estatisticas', atletaController.listarEstatisticas);

// Adicionamos um tratamento de erro específico para o upload
router.post('/', (req, res, next) => {
    upload.single('foto')(req, res, (err) => {
        if (err) {
            console.error("ERRO NO UPLOAD (MULTER/CLOUDINARY):", err);
            return res.status(400).json({ erro: 'Erro no upload da imagem', detalhes: err.message });
        }
        next(); // Se deu tudo certo, passa para o controller
    });
}, atletaController.cadastrarAtleta);

router.delete('/:id', atletaController.deletarAtleta);

module.exports = router;