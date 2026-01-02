import Usuario from '../models/Usuario.js';
import bcrypt from 'bcryptjs';

/**
 * @description Busca todos os usuários do banco de dados.
 * @route GET /api/usuario
 */
export const getDados = async (req, res) => {
    try {
        const dados = await Usuario.find({}, 'nome email role status createdAt avatar');;
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar dados no banco" });
    }
};

/**
 * @description Salva os usuarios no banco de dados.
 * @route POST /api/usuario
 */
export const salvarDados = async (req, res) => {
    try {
        const { nome, email, senha, role, status } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ message: "Nome, email e senha são obrigatórios." });
        }

        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(409).json({ message: "Este e-mail já está cadastrado." });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        const novoUsuario = new Usuario({
            nome,
            email,
            password: senhaCriptografada,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=random`,
            role: role || 'user',
            status: status || 'active'
        });

        await novoUsuario.save();
        res.status(201).json({ success: true, data: novoUsuario, message: "Dados salvos com sucesso!" });
    } catch (err) {
        console.error("Erro ao salvar no Banco:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * @description Atualiza os usuarios no banco de dados.
 * @route PUT /api/usuario
 */
export const atualizarDados = async (req, res) => {
    try {
        const { role, status } = req.body;
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id, 
            { role, status }, 
            { new: true }
        );
        if (!usuario) 
            return res.status(404).json({ message: "Usuário não encontrado." });
        res.json({success: true, data: usuario, message: "Dados salvos com sucesso!"});
    } catch (err) {
        console.error("Erro ao salvar no Banco:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * @description Exclui usuarios no banco de dados.
 * @route DELETE /api/usuario
 */
export const excluirDados = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user._id.toString() === id) {
            return res.status(400).json({ message: "Você não pode excluir sua própria conta de administrador." });
        }

        const usuarioExcluido = await Usuario.findByIdAndDelete(id);

        if (!usuarioExcluido) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        res.json({ success: true, message: "Usuário removido com sucesso!" });
    } catch (err) {
        console.error("Erro ao salvar no Banco:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
