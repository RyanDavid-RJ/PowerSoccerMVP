const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinary');
const atletaController = require('../controllers/atletaController');

router.get('/', atletaController.listarAtletas);
router.get('/estatisticas', atletaController.listarEstatisticas);

router.post('/', (req, res, next) => {
    upload.single('foto')(req, res, (err) => {
        if (err) return res.status(400).json({ erro: 'Erro no upload', detalhes: err.message });
        next();
    });
}, atletaController.cadastrarAtleta);

// --- NOVA ROTA DE EDIÇÃO ---
router.put('/:id', (req, res, next) => {
    upload.single('foto')(req, res, (err) => {
        if (err) return res.status(400).json({ erro: 'Erro no upload', detalhes: err.message });
        next();
    });
}, atletaController.editarAtleta);

router.delete('/:id', atletaController.deletarAtleta);

module.exports = router;