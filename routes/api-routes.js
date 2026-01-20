import express from 'express';
import * as opcaoController from '../controllers/opcao-controller.js';
import * as conteudoController from '../controllers/conteudo-controller.js';
import * as calculadoraController from '../controllers/calculadora-controller.js';
import * as usuarioController from '../controllers/usuario-controller.js';
import * as relatorioController from '../controllers/relatorio-controller.js';
import * as estimativaController from '../controllers/estimativa-controller.js';

import { verificarLimiteVisitante } from '../middlewares/authLimit.js';

const router = express.Router();

// --- Rotas Públicas da API ---

// Rota para buscar as opções de carnes, bebidas, etc.
router.get('/opcao', opcaoController.getDados);

// Rota para buscar os conteúdos (dicas, receitas, utensílios.)
router.get('/conteudo', conteudoController.getDados);

// Rota para buscar os usuários
router.get('/usuario', usuarioController.getDados);

// Rota principal da calculadora
router.post('/calcular', verificarLimiteVisitante, calculadoraController.calcular);

// Rota para buscar os relatórios dos usuarios
router.get('/relatorio/:id', relatorioController.buscarRelatoriosUsuarios);

// Rota para estimativa de custos com IA
router.post('/estimativa-ia', estimativaController.gerarEstimativa);

router.post('/verificar-acesso', usuarioController.verificarAcessoConteudo);

router.get('/verificar-limite-ip', usuarioController.getLimiteIP);

export default router;
