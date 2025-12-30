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
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// 1. CORS (Deve ser o primeiro)
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

// 2. Configuração de Sessão
app.use(session({
    secret: 'e09962be-a862-4342-afb0-9b9723ef44aa',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Mantenha false para localhost
        httpOnly: true,
        sameSite: 'lax' // Necessário para cookies entre portas 3000 e 3001
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