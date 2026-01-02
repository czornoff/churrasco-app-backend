import express from 'express';
import * as opcaoController from '../controllers/opcao-controller.js';
import * as conteudoController from '../controllers/conteudo-controller.js';
import * as calculadoraController from '../controllers/calculadora-controller.js';
import * as usuarioController from '../controllers/usuario-controller.js';

const router = express.Router();

// --- Rotas Públicas da API ---

// Rota para buscar as opções de carnes, bebidas, etc.
router.get('/opcao', opcaoController.getDados);

// Rota para buscar os conteúdos (dicas, receitas, etc.)
router.get('/conteudo', conteudoController.getDados);

// Rota para buscar os conteúdos (dicas, receitas, etc.)
router.get('/usuario', usuarioController.getDados);

// Rota principal da calculadora
router.post('/calcular', calculadoraController.calcular);

export default router;
