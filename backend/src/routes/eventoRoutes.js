const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const authMiddleware = require('../middlewares/authMiddleware');

// AGORA TODAS AS ROTAS SÃO PROTEGIDAS PELO AUTHMIDDLEWARE
router.get('/partida/:id', authMiddleware, eventoController.listarPorPartida);
router.get('/atleta/:id', authMiddleware, eventoController.listarPorAtleta);
router.get('/estatisticas/:id', authMiddleware, eventoController.estatisticasAtleta);
router.post('/', authMiddleware, eventoController.criarEvento);
router.put('/:id', authMiddleware, eventoController.editarEvento);
router.delete('/:id', authMiddleware, eventoController.deletarEvento);

module.exports = router;