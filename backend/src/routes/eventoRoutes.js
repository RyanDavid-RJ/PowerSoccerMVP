const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas públicas (leitura)
router.get('/partida/:id', eventoController.listarPorPartida);
router.get('/atleta/:id', eventoController.listarPorAtleta);
router.get('/estatisticas/:id', eventoController.estatisticasAtleta);

// Rotas protegidas (escrita)
router.post('/', authMiddleware, eventoController.criarEvento);
router.put('/:id', authMiddleware, eventoController.editarEvento);
router.delete('/:id', authMiddleware, eventoController.deletarEvento);

module.exports = router;