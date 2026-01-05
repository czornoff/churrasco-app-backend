import Usuario from '../models/Usuario.js';
import bcrypt from 'bcryptjs';

/**
 * @description Busca todos os usuários do banco de dados.
 * @route GET /api/usuario
 */
export const getDados = async (req, res) => {
    try {
        const dados = await Usuario.find({}, 'nome email role status createdAt avatar birthday whatsApp Cidade UF genero');;
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
        const { nome, email, role, status, UF, Cidade, birthday, whatsApp, genero } = req.body;
        const id = req.params.id;

        // Se o usuário estiver tentando mudar o e-mail, verificamos se já existe
        if (email) {
            const emailEmUso = await Usuario.findOne({ email, _id: { $ne: id } });
            if (emailEmUso) {
                return res.status(400).json({ message: "Este e-mail já está sendo usado por outra conta." });
            }
        }

        const dadosParaAtualizar = {};
        if (nome) dadosParaAtualizar.nome = nome;
        if (email) dadosParaAtualizar.email = email;
        if (role) dadosParaAtualizar.role = role;
        if (status) dadosParaAtualizar.status = status;
        if (UF) dadosParaAtualizar.UF = UF;
        if (Cidade) dadosParaAtualizar.Cidade = Cidade;
        if (birthday) dadosParaAtualizar.birthday = birthday;
        if (whatsApp) dadosParaAtualizar.whatsApp = whatsApp;
        if (genero) dadosParaAtualizar.genero = genero;

        const usuario = await Usuario.findByIdAndUpdate(
            id,
            { $set: dadosParaAtualizar },
            { new: true, runValidators: true }
        );

        if (!usuario) return res.status(404).json({ message: "Usuário não encontrado." });

        res.json({ success: true, data: usuario, message: "Perfil atualizado com sucesso!" });
    } catch (err) {
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
