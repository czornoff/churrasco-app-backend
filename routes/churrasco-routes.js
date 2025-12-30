import express from 'express';
import bcrypt from 'bcryptjs';
import * as churrascoController from '../controllers/churrasco-controller.js';
import passport from 'passport';
import { eAdmin } from '../middlewares/auth.js';
import Usuario from '../models/Usuario.js';

const router = express.Router();

// Rotas de Autenticação
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login' }),
    (req, res) => {
        res.redirect('http://localhost:3000'); 
    }
);

router.get('/auth/usuario', (req, res) => {
    // Retorna o usuário logado ou undefined se não houver
    res.send(req.user);
});

router.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        // Destrói a sessão no servidor e limpa o cookie
        req.session.destroy(() => {
            res.clearCookie('connect.sid'); // Nome padrão do cookie de sessão
            res.redirect('http://localhost:3000');
        });
    });
});

// Rotas da aplicação
router.get('/opcoes', churrascoController.getOpcoes);

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

router.post('/auth/register', async (req, res) => {
    try {
        const { nome, email, password } = req.body;

        // 1. Verificar se o usuário já existe
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({ message: "Este e-mail já está cadastrado." });
        }

        // 2. Criptografar a senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Criar usuário
        const novoUsuario = await Usuario.create({
            nome,
            email,
            password: hashedPassword,
            role: 'user',
            avatar: `https://ui-avatars.com/api/?name=${nome}&background=random` // Avatar padrão
        });

        res.status(201).json({ message: "Usuário criado com sucesso!" });
    } catch (err) {
        res.status(500).json({ message: "Erro ao criar usuário." });
    }
});

router.post('/calcular', churrascoController.calcular);

// Rota de Admin Protegida (opcional adicionar um middleware aqui depois)
router.post('/admin/salvar', eAdmin, churrascoController.salvarDados);

export default router;