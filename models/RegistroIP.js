import mongoose from 'mongoose';

const RegistroIPSchema = new mongoose.Schema({
    ip: { type: String, required: true },
    consultas: { type: Number, default: 0 },
    // O registro será deletado automaticamente 24 horas (86400 segundos) após a última atualização
    createdAt: { type: Date, default: Date.now, expires: 172800 } 
});

RegistroIPSchema.index({ ip: 1 });

export default mongoose.model('RegistroIP', RegistroIPSchema);