import express from 'express';
import cors from 'cors';
import churrascoRoutes from './routes/churrasco-routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Carregando as rotas modulares
app.use('/', churrascoRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});