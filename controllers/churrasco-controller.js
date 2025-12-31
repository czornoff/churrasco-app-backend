import Opcoes from '../models/Opcoes.js';

const EMOJIS = {
    'Bovina': '🥩',
    'Suína': '🥓',
    'Frango': '🐔',
    'Linguiça': '🌭',
    'Outras': '🍖',
};

const propMulher = 0.75;
const propCrianca = 0.45;

export const getOpcoes = async (req, res) => {
    try {
        const dados = await Opcoes.findOne();
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar dados no banco" });
    }
};

export const salvarDados = async (req, res) => {
    try {
        await Opcoes.findOneAndUpdate({}, req.body, { upsert: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const calcular = async (req, res) => {
    try {
        const { homens, mulheres, criancas, selecionados, adultosQueBebem, horas } = req.body;
        const dados = await Opcoes.findOne();
        
        if (!dados) return res.status(404).json({ error: "Configurações não encontradas" });

        // --- 1. CONFIGURAÇÕES DINÂMICAS DO BANCO ---
        const pesoBaseCarne = dados.configuracoes?.gramasCarneAdulto || 450; 
        const pesoBaseOutros = dados.configuracoes?.gramasOutrosAdulto || 250; 
        // Adicionando a cota de bebida (1.5L se não houver no banco)
        const cotaBebidaBase = dados.configuracoes?.mlBebidaAdulto || 1500; 

        const nHomens = parseInt(homens) || 0;
        const nMulheres = parseInt(mulheres) || 0;
        const nCriancas = parseInt(criancas) || 0;
        const nAdultosTotal = nHomens + nMulheres;
        const nTotalPessoas = nAdultosTotal + nCriancas;
        const nHoras = parseInt(horas) || 4;

        // Fator Tempo: +20% por hora extra após a 4ª hora
        const fatorTempo = 1 + (Math.max(0, nHoras - 4) * 0.2);

        const resultados = [];
        const resultadosAlcool = [];

        // --- 2. CÁLCULO DE COTAS TOTAIS (Baseado nos perfis) ---
        // Carne: Homem(100%), Mulher(75%), Criança(45%)
        const cotaCarneTotal = (
            (nHomens * pesoBaseCarne) + 
            (nMulheres * (pesoBaseCarne * propMulher)) + 
            (nCriancas * (pesoBaseCarne * propCrianca))
        ) * fatorTempo;

        // Acompanhamentos/Adicionais: Homem(100%), Mulher(75%), Criança(45%)
        const cotaOutrosTotal = (
            (nHomens * pesoBaseOutros) + 
            (nMulheres * (pesoBaseOutros * propMulher)) + 
            (nCriancas * (pesoBaseOutros * propCrianca))
        ) * fatorTempo;

        // --- 3. PROCESSAMENTO DE CARNES (Peso Relativo) ---
        const carnesSel = dados.carnes.filter(c => selecionados.includes(c.id));
        if (carnesSel.length > 0) {
            const somaPesosRelativos = carnesSel.reduce((acc, c) => acc + (c.pesoRelativo || 10), 0);
            carnesSel.forEach(item => {
                const pesoItem = cotaCarneTotal * (item.pesoRelativo / somaPesosRelativos);
                resultados.push({
                    nome: `${EMOJIS[item.subcategoria] || '🥩'} ${item.nome}`,
                    quantidade: pesoItem >= 1000 ? `${(pesoItem/1000).toFixed(2)}kg` : `${Math.ceil(pesoItem)}g`,
                    tipo: 'comida'
                });
            });
        }

        // --- 4. PROCESSAMENTO DE BEBIDAS (Lógica de Teto por Perfil) ---
        const bebidasSel = dados.bebidas.filter(b => selecionados.includes(b.id));

        if (bebidasSel.length > 0) {
            const cotaBebidaBase = dados.configuracoes?.mlBebidaAdulto || 1500; 
            let qtdeQueBebemAlcool = Math.min(parseInt(adultosQueBebem) || 0, nAdultosTotal);
            
            // 1. COTA ALCOÓLICA: Calculada apenas para quem foi marcado como "bebe"
            // Peso proporcional (Homem 1.0, Mulher 0.75)
            const pesoMedioAdulto = nAdultosTotal > 0 ? (nHomens + (nMulheres * propMulher)) / nAdultosTotal : 1;
            const cotaAlcoolTotalML = (qtdeQueBebemAlcool * (cotaBebidaBase * pesoMedioAdulto)) * fatorTempo;

            // 2. COTA NÃO ALCOÓLICA: 
            // Para crianças: 45% da cota base (0.675L se a base for 1.5L)
            // Para adultos: Você quer que o total do adulto seja 1.5L. 
            // Se ele já bebeu 1.5L de álcool, o não-alcoólico para ele se torna um "extra" ou 
            // o cálculo deve considerar apenas quem NÃO bebe álcool + as crianças?
            
            // Ajustando para bater com seu exemplo: 1 Adulto + 1 Criança = 0.68L (não alcoólico) e 1.5L (álcool)
            const cotaNaoAlcoolTotalML = (
                ((nAdultosTotal - qtdeQueBebemAlcool) * (cotaBebidaBase * pesoMedioAdulto)) + 
                (nCriancas * (cotaBebidaBase * propCrianca))
            ) * fatorTempo;

            const tempResultadosAlcool = [];
            const tempResultadosNaoAlcool = [];

            const alcoolicasSel = bebidasSel.filter(b => b.subcategoria === 'Alcoólica');
            const naoAlcoolicasSel = bebidasSel.filter(b => b.subcategoria !== 'Alcoólica');

            // Itens Não Alcoólicos
            if (naoAlcoolicasSel.length > 0) {
                const somaMlsNaoAlcool = naoAlcoolicasSel.reduce((acc, b) => acc + (b.mlPorAdulto || 600), 0);
                naoAlcoolicasSel.forEach(item => {
                    const proporcao = (item.mlPorAdulto || 600) / somaMlsNaoAlcool;
                    const mlTotalItem = cotaNaoAlcoolTotalML * proporcao;
                    const unidades = Math.ceil(mlTotalItem / (item.embalagem || 350));
                    if (unidades > 0) tempResultadosNaoAlcool.push({ nome: `🥤 ${item.nome}`, quantidade: `${unidades} un`, tipo: 'bebida' });
                });
            }

            // Itens Alcoólicos
            if (alcoolicasSel.length > 0 && qtdeQueBebemAlcool > 0) {
                const somaMlsAlcool = alcoolicasSel.reduce((acc, b) => acc + (b.mlPorAdulto || 600), 0);
                alcoolicasSel.forEach(item => {
                    const proporcao = (item.mlPorAdulto || 600) / somaMlsAlcool;
                    const mlTotalItem = cotaAlcoolTotalML * proporcao;
                    const unidades = Math.ceil(mlTotalItem / (item.embalagem || 350));
                    if (unidades > 0) tempResultadosAlcool.push({ nome: `🍻 ${item.nome}`, quantidade: `${unidades} un`, tipo: 'bebida' });
                });
            }

            // Renderização
            if (tempResultadosNaoAlcool.length > 0) {
                resultados.push({ 
                    nome: 'Consumo total estimado de bebida NÃO alcoólica', 
                    quantidade: `${(cotaNaoAlcoolTotalML / 1000).toFixed(2)} litros`, 
                    tipo: 'bebida', subtipo: 'observacao'
                });
                resultados.push(...tempResultadosNaoAlcool);
            }
            
            if (tempResultadosAlcool.length > 0) {
                resultados.push({ 
                    nome: 'Consumo total estimado de bebida alcoólica', 
                    quantidade: `${(cotaAlcoolTotalML / 1000).toFixed(2)} litros`, 
                    tipo: 'bebida', subtipo: 'observacao'
                });
                resultados.push(...tempResultadosAlcool);
            }
        }

        // --- 5. ACOMPANHAMENTOS E ADICIONAIS (Proporcional à Cota Dinâmica) ---
        const outrosSel = [...dados.acompanhamentos, ...dados.adicionais].filter(i => selecionados.includes(i.id));
        if (outrosSel.length > 0) {
            const somaPesosOutros = outrosSel.reduce((acc, i) => acc + (i.gramasPorAdulto ?? i.qtdPorAdulto ?? 10), 0);
            
            outrosSel.forEach(item => {
                const pesoConfig = (item.gramasPorAdulto ?? item.qtdPorAdulto ?? 10);
                const pesoItem = cotaOutrosTotal * (pesoConfig / somaPesosOutros);
                const unit = item.unidade || 'g';
                const emoji = dados.acompanhamentos.some(a => a.id === item.id) ? '🥗' : '🧂';

                const desc = (unit === 'g' && pesoItem >= 1000) 
                    ? `${(pesoItem/1000).toFixed(2)}kg` 
                    : `${Math.ceil(pesoItem)}${unit}`;
                    
                resultados.push({ nome: `${emoji} ${item.nome}`, quantidade: desc, tipo: 'comida' });
            });
        }

        // --- 6. UTENSÍLIOS ---
        dados.utensilios.filter(u => selecionados.includes(u.id)).forEach(u => {
            let qtd = 0;
            if (u.base === 'carne') qtd = Math.ceil((cotaCarneTotal / 1000) * u.fator);
            else if (u.base === 'pessoa') qtd = Math.ceil(nTotalPessoas * u.fator);
            else qtd = u.fator;

            resultados.push({ nome: `🍴 ${u.nome}`, quantidade: `${qtd} ${u.unidade || 'un'}`, tipo: 'outros' });
        });

        res.json(resultados);
    } catch (err) {
        res.status(500).json({ error: "Erro ao processar o cálculo" });
    }
};