import express from 'express';
import * as churrascoController from '../controllers/churrasco-controller.js';

const router = express.Router();

// Rotas da aplicação
router.get('/opcoes', churrascoController.getOpcoes);
router.post('/calcular', churrascoController.calcular);
router.post('/admin/salvar', churrascoController.salvarDados);

export default router;