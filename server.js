import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import passport from 'passport';
import cors from 'cors';
import session from 'express-session';

// Importações de configuração e rotas
import connectDB from './config/database.js';
import './config/passport.js'; 
import authRoutes from './routes/auth-routes.js';
import adminRoutes from './routes/admin-routes.js';
import apiRoutes from './routes/api-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Inicialização ---
const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Conecta ao Banco de Dados
connectDB();

// 1. CORS Dinâmico
const originsString = process.env.ALLOWED_ORIGINS || 'http://localhost:3000';
const allowedOrigins = originsString.split(',');

app.use(cors({
    origin: (origin, callback) => {
        // Permite requisições sem 'origin' (ex: Postman, apps mobile)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
        callback(null, true);
        } else {
        callback(new Error('Origem não permitida pelo CORS'));
        }
    },
    credentials: true,
}));

// 2. Parser de JSON
app.use(express.json());

// 3. Configuração de Sessão
// 'trust proxy' é necessário se o app estiver atrás de um proxy (Heroku, Render, etc)
app.set('trust proxy', 1); 
app.use(session({
    secret: process.env.SESSION_SECRET || 'churrasco_secret_key',
    resave: false,
    saveUninitialized: false,
    proxy: true, 
    cookie: {
        secure: isProduction, 
        sameSite: isProduction ? 'none' : 'lax', 
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// 4. Inicialização do Passport
app.use(passport.initialize());
app.use(passport.session());


// --- Rotas ---
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);
app.use('/logos', express.static(path.join(__dirname, 'public/logos')));

// --- Tratamento de Erros ---
// Rota "catch-all" para 404
app.use((req, res, next) => {
    res.status(404).json({ message: 'Endpoint não encontrado.' });
});

// Manipulador de erro global
app.use((err, req, res, next) => {
    console.error(err.stack); // Loga o erro no console
    res.status(err.status || 500).json({ 
        message: err.message || 'Ocorreu um erro interno no servidor.' 
    });
});


// --- Iniciar Servidor ---
app.listen(PORT, () => {
    
});