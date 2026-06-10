const express = require('express');
const router = express.Router();
const partidaController = require('../controllers/partidaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', partidaController.listarPartidas);
router.get('/:id', partidaController.buscarPartida);
router.post('/', authMiddleware, partidaController.criarPartida); // protegida

module.exports = router;