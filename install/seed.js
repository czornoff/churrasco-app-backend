import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Importa os Models
import Usuario from '../models/Usuario.js';
import Conteudo from '../models/Conteudo.js';
import Opcao from '../models/Opcao.js';

// Recria __dirname para ES Modules e configura o dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seed = async () => {
    try {
        console.log("Iniciando conexão com MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("🍃 Conectado!");

        // Limpa as coleções existentes
        await Usuario.deleteMany({});
        await Conteudo.deleteMany({});
        await Opcao.deleteMany({});
        console.log("🧹 Coleções limpas!");

        // Importa Usuários
        // usuario: admin@admin.com
        // senha: @dmin1234
        const usuariosPath = path.join(__dirname, 'usuarios.json');
        if (fs.existsSync(usuariosPath)) {
            const usuariosData = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
            console.log("Inserindo novos usuários...");
            await Usuario.create(usuariosData);
            console.log("👍 Usuários importados com sucesso!");
        } else {
            console.log("⚠️ Arquivo usuarios.json não encontrado. Pulando etapa.");
        }

        // Importa Conteúdos
        const conteudosPath = path.join(__dirname, 'conteudos.json');
        if (fs.existsSync(conteudosPath)) {
            const conteudosData = JSON.parse(fs.readFileSync(conteudosPath, 'utf8'));
            // Tratando a data do objeto único
            if (conteudosData.updatedAt && conteudosData.updatedAt.$date) {
                conteudosData.updatedAt = conteudosData.updatedAt.$date;
            }

            console.log("Inserindo novo conteúdo único...");
            // Usamos o objeto direto, sem o map
            await Conteudo.create(conteudosData); 
            console.log("👍 Conteúdos importados com sucesso!");
        } else {
            console.log("⚠️ Arquivo conteudos.json não encontrado. Pulando etapa.");
        }

        // Importa Opções
        const opcoesPath = path.join(__dirname, 'opcoes.json');
        if (fs.existsSync(opcoesPath)) {
            const opcoesData = JSON.parse(fs.readFileSync(opcoesPath, 'utf8'));
            console.log("Inserindo novas opções...");
            await Opcao.create(opcoesData);
            console.log("👍 Opções importadas com sucesso!");
        } else {
            console.log("⚠️ Arquivo opcoes.json não encontrado. Pulando etapa.");
        }

        console.log("\n✅ Script de seed concluído com sucesso!");

    } catch (error) {
        console.error("\n❌ Erro no script de seed:", error);
    } finally {
        // Garante que a conexão com o banco de dados seja fechada
        await mongoose.disconnect();
        console.log("🔌 Conexão com MongoDB fechada.");
        process.exit(0);
    }
};

seed();