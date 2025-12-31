import express from 'express';
import bcrypt from 'bcryptjs';
import * as churrascoController from '../controllers/churrasco-controller.js';
import passport from 'passport';
import { eAdmin } from '../middlewares/auth.js';
import Usuario from '../models/Usuario.js';
import Conteudo from '../models/Conteudo.js';

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

router.get('/conteudo', async (req, res) => {
    try {
        const conteudo = await Conteudo.findOne(); // Pega o único doc existente
        res.json(conteudo || {}); // Retorna vazio se ainda não houver nada
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
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

router.post('/admin/conteudo/salvar', eAdmin, async (req, res) => {
    try {
        // req.body contém todo o seu estado 'conteudo' enviado pelo React
        const dadosParaSalvar = req.body;

        // {} significa: "procure qualquer documento"
        // upsert: true significa: "se não existir nenhum, crie o primeiro"
        const atualizado = await Conteudo.findOneAndUpdate(
            {}, 
            dadosParaSalvar, 
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, data: atualizado });
    } catch (err) {
        console.error("Erro ao salvar no MongoDB:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/admin/usuarios/:id', eAdmin, async (req, res) => {
    try {
        const { role, status } = req.body;
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id, 
            { role, status }, 
            { new: true }
        );
        res.json(usuario);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/admin/usuarios', eAdmin, async (req, res) => {
    // Verifique se quem está pedindo é ADMIN (importante para segurança!)
    try {
        const usuarios = await Usuario.find(); // Retorna apenas campos necessários
        res.json(usuarios);
    } catch (err) {
        res.status(500).send("Erro ao buscar usuários");
    }
});

router.post('/admin/usuarios', eAdmin, async (req, res) => {
    try {
        const { nome, email, senha, role, status } = req.body;

        // Verifica se o e-mail já existe
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({ message: "Este e-mail já está cadastrado." });
        }

        // Criptografa a senha antes de salvar
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        const novoUsuario = new Usuario({
            nome,
            email,
            password: senhaCriptografada,
            avatar: `https://ui-avatars.com/api/?name=${nome}&background=random`,
            createdAt: new Date(),
            role: role || 'user',
            status: status || 'active'
        });

        await novoUsuario.save();
        res.status(201).json({ success: true, message: "Usuário criado com sucesso!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/admin/usuarios/:id', eAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Segurança: Impede que o admin logado exclua a própria conta
        if (req.user._id.toString() === id) {
            return res.status(400).json({ message: "Você não pode excluir sua própria conta de administrador." });
        }

        const usuarioExcluido = await Usuario.findByIdAndDelete(id);

        if (!usuarioExcluido) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        res.json({ success: true, message: "Usuário removido com sucesso!" });
    } catch (err) {
        res.status(500).json({ error: "Erro interno ao excluir usuário." });
    }
});

export default router;