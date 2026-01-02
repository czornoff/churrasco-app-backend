import Conteudo from '../models/Conteudo.js';

/**
 * @description Busca todos os conteudos do banco de dados.
 * @route GET /api/conteudo
 */
export const getDados = async (req, res) => {
    try {
        const dados = await Conteudo.findOne();
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar dados no banco" });
    }
};

/**
 * @description Salva ou atualiza as opções e configurações no banco de dados.
 * @route POST /api/conteudo
 */
export const salvarDados = async (req, res) => {
    try {
        const dadosParaSalvar = req.body;

        const atualizado = await Conteudo.findOneAndUpdate(
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