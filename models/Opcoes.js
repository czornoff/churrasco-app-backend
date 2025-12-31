import mongoose from 'mongoose';

const OpcoesSchema = new mongoose.Schema({
  configuracoes: {
    gramasCarneAdulto: Number,
    gramasOutrosAdulto: Number,
    mlBebidaAdulto: Number
  },
  carnes: Array,
  bebidas: Array,
  acompanhamentos: Array,
  adicionais: Array,
  utensilios: Array
}, { collection: 'dados' });

export default mongoose.model('Opcoes', OpcoesSchema);