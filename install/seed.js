import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import Opcoes from './models/Opcoes.js'; // Verifique se o caminho está correto

dotenv.config();

const seed = async () => {
  try {
    console.log("Iniciando conexão com MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🍃 Conectado!");

    // 1. Ler o arquivo local data.json
    const rawData = fs.readFileSync('./data/data.json', 'utf8');
    const dadosParaSubir = JSON.parse(rawData);

    // 2. Limpar a coleção atual para evitar duplicidade (opcional)
    console.log("Limpando dados antigos no banco...");
    await Opcoes.deleteMany({});

    // 3. Inserir os dados do JSON
    console.log("Subindo novos dados...");
    await Opcoes.create(dadosParaSubir);

    console.log("✅ Dados importados com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro no script de seed:", error);
    process.exit(1);
  }
};

seed();