const express = require('express');
const router = express.Router();
const partidaController = require('../controllers/partidaController');
const authMiddleware = require('../middlewares/authMiddleware');

// AGORA TODAS AS ROTAS SÃO PROTEGIDAS PELO AUTHMIDDLEWARE
router.get('/', authMiddleware, partidaController.listarPartidas);
router.get('/:id', authMiddleware, partidaController.buscarPartida);
router.post('/', authMiddleware, partidaController.criarPartida);

module.exports = router;