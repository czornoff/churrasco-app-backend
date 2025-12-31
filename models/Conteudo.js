import mongoose from 'mongoose';

const ConteudoSchema = new mongoose.Schema({
    nomeApp: { type: String, default: 'Calculadora de Churrasco' },
    slogan: String,
    email: String,
    sobreTitulo: String,
    sobreTexto: String,
    // Definimos como objetos para organizar as abas
    dicas: { titulo: String, subtitulo: String, itens: Array },
    produtos: { titulo: String, subtitulo: String, itens: Array },
    receitas: { titulo: String, subtitulo: String, itens: Array },
    utensilios: { titulo: String, subtitulo: String, itens: Array }
}, { timestamps: true });

export default mongoose.model('Conteudo', ConteudoSchema);