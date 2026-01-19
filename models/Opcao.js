import mongoose from 'mongoose';

const OpcaoSchema = new mongoose.Schema({
    configuracoes: {
        gramasCarneAdulto: Number,
        gramasOutrosAdulto: Number,
        mlBebidaAdulto: Number
    },
    carnes: Array,
    bebidas: Array,
    acompanhamentos: Array,
    adicionais: Array,
    utensilios: Array,
    sobremesas: Array
}, { collection: 'opcoes' });

export default mongoose.model('Opcao', OpcaoSchema);