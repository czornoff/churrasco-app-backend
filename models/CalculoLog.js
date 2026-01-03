import mongoose from 'mongoose';

const CalculoLogSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    dataConsulta: { type: Date, default: Date.now },
    participantes: {
        homens: Number,
        mulheres: Number,
        criancas: Number,
        adultosQueBebem: Number
    },
    horasDuracao: Number,
    itensSelecionados: [Number], // IDs dos itens
    resultadoFinal: Array // O array de resultados gerado
});

export default mongoose.model('CalculoLog', CalculoLogSchema);