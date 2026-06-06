const express = require('express');
const router = express.Router();
const partidaController = require('../controllers/partidaController');

router.get('/', partidaController.listarPartidas);
router.post('/', partidaController.criarPartida);

module.exports = router;