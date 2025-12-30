import Opcoes from '../models/Opcoes.js';

const EMOJIS = {
    'Bovina': '🥩',
    'Suína': '🥓',
    'Frango': '🐔',
    'Linguiça': '🌭',
    'Outras': '🍖',
};


// Busca as opções configuradas no banco de dados
export const getOpcoes = async (req, res) => {
    try {
        const dados = await Opcoes.findOne(); // Busca o documento de configurações
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar dados no banco" });
    }
};

// Salva ou atualiza as configurações (Painel Admin)
export const salvarDados = async (req, res) => {
    try {
        // O upsert: true cria o documento caso ele ainda não exista
        await Opcoes.findOneAndUpdate({}, req.body, { upsert: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const calcular = async (req, res) => {
    try {
        const { adultos, criancas, selecionados, adultosQueBebem } = req.body;
        const dados = await Opcoes.findOne();
        
        if (!dados) return res.status(404).json({ error: "Configurações não encontradas" });

        const resultados = [];
        const resultadosAlcool = [];
        const nAdultos = parseInt(adultos) || 0;
        const nCriancas = parseInt(criancas) || 0;
        const nTotal = nAdultos + nCriancas;

        // --- 1. CARNES (Lógica de Peso Relativo) ---
        const cotaCarneTotal = (nAdultos * dados.configuracoes.gramasCarneAdulto) + 
                               (nCriancas * dados.configuracoes.gramasCarneCrianca);
        
        const carnesSel = dados.carnes.filter(c => selecionados.includes(c.id));
        
        if (carnesSel.length > 0) {
            const somaPesos = carnesSel.reduce((acc, c) => acc + (c.pesoRelativo || 10), 0);
            carnesSel.forEach(item => {
                const pesoItem = cotaCarneTotal * (item.pesoRelativo / somaPesos);
                resultados.push({
                    nome: `${EMOJIS[item.subcategoria]} ${item.nome}`,
                    quantidade: pesoItem >= 1000 ? `${(pesoItem/1000).toFixed(2)}kg` : `${Math.ceil(pesoItem)}g`,
                    tipo: 'comida'
                });
            });
        }

        // --- 2. BEBIDAS (Lógica de Diluição por Grupos) ---
        const bebidasSel = dados.bebidas.filter(b => selecionados.includes(b.id));
        const alcoolicas = bebidasSel.filter(b => b.subcategoria === 'Alcoólica');
        const naoAlcoolicas = bebidasSel.filter(b => b.subcategoria !== 'Alcoólica');

        if (naoAlcoolicas.length > 0) {
            naoAlcoolicas.forEach(item => {
                const mlBase = (nAdultos * item.mlPorAdulto) + (nCriancas * (item.mlPorAdulto / 2));
                const mlDiluido = mlBase / naoAlcoolicas.length;
                const unidades = Math.ceil(mlDiluido / (item.embalagem || 350));
                if (unidades > 0) {
                    resultados.push({ nome: `🥤 ${item.nome}`, quantidade: `${unidades} un`, tipo: 'bebida' });
                }
            });
        }

        if (alcoolicas.length > 0) {
            const qteBeberroes = parseInt(adultosQueBebem) >= 0 ? parseInt(adultosQueBebem) : nAdultos;
            let totalLitros = 0;

            alcoolicas.forEach(item => {
                const mlBase = qteBeberroes * item.mlPorAdulto;
                const mlDiluido = mlBase / alcoolicas.length;
                const unidades = Math.ceil(mlDiluido / (item.embalagem || 350));

                if (unidades > 0) {
                    totalLitros += mlBase;
                    resultadosAlcool.push({ nome: `🍻 ${item.nome}`, quantidade: `${unidades} un`, tipo: 'bebida', subcategoria: 'Alcoolica' });
                }
            });

            if(qteBeberroes > 0){
                resultadosAlcool.unshift({ 
                    nome: 'Consumo total estimado de bebida alcoólica', 
                    quantidade: `${(totalLitros / 1000).toFixed(2)} litros`, 
                    tipo: 'bebida',
                    subcategoria: 'Alcoolica',
                    subtipo: 'observacao'
                });
            }

            resultados.push(...resultadosAlcool);
        }

        // --- 3. ACOMPANHAMENTOS E ADICIONAIS ---
        const acompanhamentosSel = dados.acompanhamentos.filter(i => selecionados.includes(i.id));
        const adicionaisSel = dados.adicionais.filter(i => selecionados.includes(i.id));

        // Acompanhamentos (Mantido cálculo individual padrão)
        acompanhamentosSel.forEach(item => {
            let valor = 0;
            let unit = item.unidade || 'g';
            if (item.gramasPorAdulto) {
                valor = (nAdultos * item.gramasPorAdulto) + (nCriancas * (item.gramasPorAdulto / 2));
            } else if (item.qtdPorAdulto) {
                valor = (nAdultos * item.qtdPorAdulto) + (nCriancas * (item.qtdPorAdulto / 2));
            }
            const desc = (unit === 'g' && valor >= 1000) ? `${(valor/1000).toFixed(2)}kg` : `${Math.ceil(valor)}${unit}`;
            resultados.push({ nome: `🥗 ${item.nome}`, quantidade: desc, tipo: 'comida' });
        });

        // ADICIONAIS (Ajustado para cálculo por SOMA/DILUIÇÃO do grupo)
       if (adicionaisSel.length > 0) {
            adicionaisSel.forEach(item => {
                let valorIndividual = 0;
                let unit = item.unidade || 'g';
                
                // Verifica as duas possibilidades de nome de campo vindo do banco
                const valorConfigurado = item.gramasPorAdulto ?? item.qtdPorAdulto ?? 0;

                valorIndividual = (nAdultos * valorConfigurado) + (nCriancas * (valorConfigurado / 2));

                const valorDiluido = valorIndividual / adicionaisSel.length;

                const desc = (unit === 'g' && valorDiluido >= 1000) 
                    ? `${(valorDiluido/1000).toFixed(2)}kg` 
                    : `${Math.ceil(valorDiluido)}${unit}`;
                    
                resultados.push({ nome: `🧂 ${item.nome}`, quantidade: desc, tipo: 'comida' });
            });
        }

        // --- 4. UTENSÍLIOS ---
        dados.utensilios.filter(u => selecionados.includes(u.id)).forEach(u => {
            let qtd = 0;
            if (u.base === 'carne') qtd = Math.ceil((cotaCarneTotal / 1000) * u.fator);
            else if (u.base === 'pessoa') qtd = Math.ceil(nTotal * u.fator);
            else qtd = u.fator;

            resultados.push({ nome: `🍴 ${u.nome}`, quantidade: `${qtd} ${u.unidade || 'un'}`, tipo: 'outros' });
        });

        res.json(resultados);
    } catch (err) {
        res.status(500).json({ error: "Erro ao processar o cálculo" });
    }
};