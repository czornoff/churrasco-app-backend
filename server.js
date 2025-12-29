import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import churrascoRoutes from './routes/churrasco-routes.js';

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("🍃 Conectado ao MongoDB Atlas"))
  .catch(err => console.error("Erro ao conectar ao Mongo:", err));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Carregando as rotas modulares
app.use('/', churrascoRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});