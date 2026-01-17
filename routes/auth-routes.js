import express from 'express';
import passport from 'passport';
import * as authController from '../controllers/auth-controller.js';

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// A primeira parte da autenticação do Google apenas redireciona para o provedor.
// Pode permanecer aqui, pois é principalmente uma configuração de middleware.
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// O callback do Google agora usa o controller.
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login` }),
    authController.googleCallback
);

// Rota para verificar o status do usuário logado
router.get('/usuario', authController.getUsuarioStatus);

// Rota de logout
router.get('/logout', authController.logout);

// Rota de login manual
router.post('/login-manual', authController.loginManual);

// Rota de registro manual
router.post('/register', authController.register);

export default router;
