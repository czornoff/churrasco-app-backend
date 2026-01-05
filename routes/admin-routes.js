import express from 'express';
import multer from 'multer'; // Mudança de require para import
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { eAdmin, eUser } from '../middlewares/auth.js';
import * as opcaoController from '../controllers/opcao-controller.js';
import * as conteudoController from '../controllers/conteudo-controller.js';
import * as usuarioController from '../controllers/usuario-controller.js';
import * as relatorioController from '../controllers/relatorio-controller.js';

const router = express.Router();

// Configuração necessária para trabalhar com caminhos de arquivos em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Multer para Upload de Logo
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Salva na pasta public/logos dentro do seu projeto BACKEND
        cb(null, './public/logos');
    },
    filename: (req, file, cb) => {
        cb(null, `logo_${Date.now()}_${file.originalname.replace(/\s/g, '_')}`);
    }
});

const upload = multer({ storage });

// --- Rotas de Gerenciamento de Conteúdo e Opções ---
router.post('/opcao/salvar', eAdmin, opcaoController.salvarDados);
router.post('/conteudo/salvar', eAdmin, conteudoController.salvarDados);

// --- Rotas de Gerenciamento de Usuários ---
router.post('/usuario/salvar', eAdmin, usuarioController.salvarDados); 
router.put('/usuario/salvar/:id', eAdmin, usuarioController.atualizarDados); 
router.delete('/usuario/excluir/:id', eAdmin, usuarioController.excluirDados); 
router.put('/usuario/atualizar/:id', usuarioController.atualizarDados); 

// --- Rotas de Gerenciamento de Relatórios ---
router.get('/relatorio', eAdmin, relatorioController.buscarRelatorios);

// --- Rota de Upload de Imagem ---
// Note que no Front-end você chama ${API_URL}/admin/upload-logo
// Se o seu server.js já prefixa as rotas com /admin, aqui deve ser apenas /upload-logo
router.post('/upload-logo', eAdmin, upload.single('logo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Erro no upload' });

    // Pega o protocolo (http/https) e o host (api.seusite.com) dinamicamente
    res.json({ url: `/logos/${req.file.filename}` });
});

router.get('/listar-logos', eAdmin, (req, res) => {
    const diretorio = './public/logos';
    
    fs.readdir(diretorio, (err, arquivos) => {
        if (err) return res.status(500).json({ error: "Erro ao ler pasta" });

        // Filtra apenas imagens e ordena pela data de criação (mais recentes primeiro)
        const logos = arquivos
            .filter(arq => arq.startsWith('logo_'))
            .map(arq => ({
                url: `/logos/${arq}`,
                time: fs.statSync(`${diretorio}/${arq}`).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time)
            .slice(0, 10); // Pega os 3 últimos

        res.json(logos);
    });
});

export default router;