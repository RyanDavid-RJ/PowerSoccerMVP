const express = require('express');
const router = express.Router();
const partidaController = require('../controllers/partidaController');

router.get('/', partidaController.listarPartidas);
router.get('/:id', partidaController.buscarPartida); // <-- ADICIONADO AQUI
router.post('/', partidaController.criarPartida);

module.exports = router;