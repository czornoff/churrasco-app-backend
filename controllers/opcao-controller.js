import Opcao from '../models/Opcao.js';

/**
 * @description Busca todas as opções e configurações do banco de dados.
 * @route GET /api/opcao
 */
export const getDados = async (req, res) => {
    try {
        const dados = await Opcao.findOne();
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar dados no banco" });
    }
};

/**
 * @description Salva ou atualiza as opções e configurações no banco de dados.
 * @route POST /api/opcao
 */
export const salvarDados = async (req, res) => {
    try {
        const dadosParaSalvar = req.body;

        const atualizado = await Opcao.findOneAndUpdate(
            {}, 
            dadosParaSalvar, 
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, data: atualizado, message: "Dados salvos com sucesso!" });
    } catch (err) {
        console.error("Erro ao salvar no Banco:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
