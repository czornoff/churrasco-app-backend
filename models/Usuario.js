import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const usuarioSchema = new mongoose.Schema({
    nome: String,
    email: { type: String, unique: true, required: true },
    password: { type: String },
    googleId: String,
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    },
    status: { 
        type: String, 
        enum: ['active', 'inactive', 'banned'], 
        default: 'active' 
    },
    UF: String,
    Cidade: String,
    birthday: Date,
    whatsApp: String,
    genero: { 
        type: String, 
        enum: ['masculino', 'feminino', 'outros', 'undefined'], 
        default: 'undefined' 
    },
    avatar: String,
}, { timestamps: true });

// Hash da senha antes de salvar
// REMOVEMOS o parâmetro 'next' e usamos apenas async/await
usuarioSchema.pre('save', async function() {
    // Importante: Não use Arrow Function aqui, pois precisamos do 'this'
    if (!this.password || !this.isModified('password')) {
        return; 
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw new Error(err); // No Next.js/Mongoose Moderno, lançar erro interrompe o save
    }
});

// Correção de cache para Next.js
const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', usuarioSchema);

export default Usuario;