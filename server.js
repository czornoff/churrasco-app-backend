import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import passport from 'passport';
import './config/passport.js'; 
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import churrascoRoutes from './routes/churrasco-routes.js';

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("🍃 Conectado ao MongoDB Atlas"))
    .catch(err => console.error("Erro ao conectar ao Mongo:", err));

const app = express();
const PORT = process.env.PORT || 3001;

// Identifica se o servidor está rodando no Render (produção) ou Local
const isProduction = process.env.NODE_ENV === 'production';

// 1. CORS Dinâmico
const originsString = process.env.ALLOWED_ORIGINS || 'http://localhost:3000';
const allowedOrigins = originsString.split(',');

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS não permite esta origem'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// 2. Configuração de Sessão e Cookie Híbrida
app.set('trust proxy', 1); 

app.use(session({
    secret: process.env.SESSION_SECRET || 'churrasco_secret_key',
    resave: false,
    saveUninitialized: false,
    proxy: true, 
    cookie: {
        // Se for produção, usa configurações para Vercel/Render (HTTPS)
        // Se for local, usa configurações simples para o navegador aceitar
        secure: isProduction, 
        sameSite: isProduction ? 'none' : 'lax', 
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

app.use(express.json()); // Importante para ler corpo de requisições POST
app.use(passport.initialize());
app.use(passport.session());

app.use('/', churrascoRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT} (${isProduction ? 'PROD' : 'DEV'})`);
});