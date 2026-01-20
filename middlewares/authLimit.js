import RegistroIP from '../models/RegistroIP.js';
import Conteudo from '../models/Conteudo.js';

export const verificarLimiteVisitante = async (req, res, next) => {
    try {
        // 1. Se o usuário estiver autenticado (ajuste conforme seu sistema de login)
        if (req.user || req.isAuthenticated?.()) {
            return next();
        }

        // 2. Captura o IP real vindo do Nginx
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

        // 3. Atualiza ou cria o registro usando findOneAndUpdate para ser atômico
        const registro = await RegistroIP.findOneAndUpdate(
            { ip },
            { $setOnInsert: { ip }, $set: { createdAt: new Date() } }, // Reseta o TTL a cada tentativa
            { upsert: true, new: true }
        );

        // 4. Verifica se já atingiu o limite
        const conf = await Conteudo.find({}, 'limiteConsulta');
        const limite = conf[0].limiteConsulta;
        let mensagem = `Limite de ${limite} consultas para visitantes atingido. Identificamos seu IP.`;
        
        if (registro.consultas >= limite) {
            return res.status(403).json({
                success: false,
                limiteAtingido: true,
                message: mensagem
            });
        }

        // 5. Incrementa a consulta
        registro.consultas += 1;
        await registro.save();

        next();
    } catch (error) {
        console.error("Erro no controle de IP:", error);
        next(); // Em caso de falha no banco, libera para não frustrar o usuário
    }
};