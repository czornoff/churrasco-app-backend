import express from 'express';
import bcrypt from 'bcryptjs';
import { eAdmin } from '../middlewares/auth.js';
import * as opcaoController from '../controllers/opcao-controller.js';
import * as conteudoController from '../controllers/conteudo-controller.js';
import * as usuarioController from '../controllers/usuario-controller.js';

const router = express.Router();

// --- Rotas de Gerenciamento de Conteúdo e Opções ---
router.post('/opcao/salvar', eAdmin, opcaoController.salvarDados);
router.post('/conteudo/salvar', eAdmin, conteudoController.salvarDados);

// --- Rotas de Gerenciamento de Usuários ---
router.post('/usuario/salvar', eAdmin, usuarioController.salvarDados); // Criar um novo usuário
router.put('/usuario/salvar/:id', eAdmin, usuarioController.atualizarDados); // Atualizar usuário existente
router.delete('/usuario/excluir/:id', eAdmin, usuarioController.excluirDados); // Excluir um usuário

export default router;
