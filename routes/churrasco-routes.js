import express from 'express';
import bcrypt from 'bcryptjs';
import * as churrascoController from '../controllers/churrasco-controller.js';
import passport from 'passport';
import { eAdmin } from '../middlewares/auth.js';
import Usuario from '../models/Usuario.js';

const router = express.Router();
// Pega a URL do frontend do .env ou usa o padrão
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Rotas de Autenticação
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login` }),
    (req, res) => {
        // Redireciona para o frontend dinâmico
        res.redirect(FRONTEND_URL); 
    }
);

router.get('/auth/usuario', (req, res) => {
    res.send(req.user);
});

router.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ message: "Erro ao sair" });
        req.session.destroy(() => {
            res.clearCookie('connect.sid'); 
            res.redirect(FRONTEND_URL); // Redireciona dinamicamente
        });
    });
});

// ... (Resto das rotas permanecem iguais)
router.post('/auth/login-manual', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return res.status(500).json({ message: "Erro no servidor" });
        if (!user) return res.status(401).json({ message: info.message || "Dados inválidos" });

        req.logIn(user, (err) => {
            if (err) return res.status(500).json({ message: "Erro ao iniciar sessão" });
            return res.send(user);
        });
    })(req, res, next);
});

// ... (Registro e outras rotas)
router.get('/opcoes', churrascoController.getOpcoes);
router.post('/calcular', churrascoController.calcular);
router.post('/admin/salvar', eAdmin, churrascoController.salvarDados);

export default router;