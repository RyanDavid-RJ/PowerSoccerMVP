const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');

// Rotas focadas em eventos da partida
router.get('/partida/:id', eventoController.listarPorPartida);
router.post('/', eventoController.criarEvento);
router.put('/:id', eventoController.editarEvento);
router.delete('/:id', eventoController.deletarEvento);

// Rotas focadas no atleta (estatísticas globais)
router.get('/atleta/:id', eventoController.listarPorAtleta);
router.get('/estatisticas/:id', eventoController.estatisticasAtleta);

module.exports = router;