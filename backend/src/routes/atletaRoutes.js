const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const atletaController = require('../controllers/atletaController');
const authMiddleware = require('../middlewares/authMiddleware');

// AGORA TODAS AS ROTAS SÃO PROTEGIDAS PELO AUTHMIDDLEWARE
router.get('/', authMiddleware, atletaController.listarAtletas);
router.get('/estatisticas', authMiddleware, atletaController.listarEstatisticas);
router.post('/', authMiddleware, upload.single('foto'), atletaController.cadastrarAtleta);
router.put('/:id', authMiddleware, upload.single('foto'), atletaController.editarAtleta);
router.delete('/:id', authMiddleware, atletaController.deletarAtleta);

module.exports = router;