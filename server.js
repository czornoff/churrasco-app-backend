import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import passport from 'passport';
import './config/passport.js'; // Certifique-se de ter esse arquivo com a estratégia Google
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import churrascoRoutes from './routes/churrasco-routes.js';

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("🍃 Conectado ao MongoDB Atlas"))
    .catch(err => console.error("Erro ao conectar ao Mongo:", err));

const app = express();
const PORT = process.env.PORT || 3001;

// 1. CORS (Deve ser o primeiro)
const allowedOrigins = [
  'http://localhost:3000',
  'https://churrasco-app-frontend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origin (como ferramentas de teste)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS não permite esta origem'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.set('trust proxy', 1); 

app.use(session({
    secret: process.env.SESSION_SECRET || 'churrasco_secret_key',
    resave: false,
    saveUninitialized: false,
    proxy: true, // Informa ao session que ele está atrás de um proxy (Render)
    cookie: {
        // Em produção (Render), secure DEVE ser true. Em localhost, deve ser false.
        secure: true, 
        
        // 'none' é o ÚNICO que permite o cookie funcionar entre Vercel e Render
        sameSite: 'none', 
        
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 dia
    }
}));

// 3. Inicialização do Passport
app.use(passport.initialize());
app.use(passport.session());

// 4. Rotas
app.use('/', churrascoRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});