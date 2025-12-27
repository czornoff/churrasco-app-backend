const express = require('express');
const router = express.Router();
const churrascoController = require('../controllers/churrascoController');

// Rotas da aplicação
router.get('/opcoes', churrascoController.getOpcoes);
router.post('/calcular', churrascoController.calcular);
router.post('/admin/salvar', churrascoController.salvarDados);

module.exports = router;