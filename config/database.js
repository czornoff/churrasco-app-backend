import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("🍃 Conectado ao MongoDB Atlas");
    } catch (err) {
        console.error("Erro ao conectar ao Mongo:", err);
        // Encerra o processo com falha se não conseguir conectar ao banco
        process.exit(1);
    }
};

export default connectDB;
