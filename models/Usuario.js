// models/Usuario.js
import mongoose from 'mongoose';

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
    avatar: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Hash da senha antes de salvar
usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

export default mongoose.model('Usuario', usuarioSchema);