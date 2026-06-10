const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const atletaController = require('../controllers/atletaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', atletaController.listarAtletas);
router.get('/estatisticas', atletaController.listarEstatisticas);

// Rotas protegidas
router.post('/', authMiddleware, upload.single('foto'), atletaController.cadastrarAtleta);
router.put('/:id', authMiddleware, upload.single('foto'), atletaController.editarAtleta);
router.delete('/:id', authMiddleware, atletaController.deletarAtleta);

module.exports = router;