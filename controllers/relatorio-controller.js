import CalculoLog from '../models/CalculoLog.js';

// Exemplo de controller para buscar os logs
export const buscarRelatorios = async (req, res) => {
    try {
        // Busca os últimos 50 cálculos, populando o nome do usuário se existir
        const logs = await CalculoLog.find()
            .populate('usuarioId', 'nome email')
            .sort({ dataConsulta: -1 })
            .limit(50);

        // Um resumo simples para os cards de cima
        const estatisticas = {
            totalCalculos: await CalculoLog.countDocuments(),
            totalPessoasAtendidas: await CalculoLog.aggregate([
                { $group: { _id: null, total: { $sum: { $add: ["$participantes.homens", "$participantes.mulheres", "$participantes.criancas"] } } } }
            ])
        };

        res.json({ logs, estatisticas });
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar relatórios" });
    }
};