import Opcao from '../models/Opcao.js';
import CalculoLog from '../models/CalculoLog.js';

// --- CONSTANTES E CONFIGURAÇÕES ---

const EMOJIS = {
    'Bovina': '🥩',
    'Suína': '🥓',
    'Frango': '🐔',
    'Linguiça': '🌭',
    'Outras': '🍖',
    'Acompanhamento': '🥗',
    'Adicional': '🧂',
    'BebidaAlcoolica': '🍻',
    'BebidaNaoAlcoolica': '🥤',
    'Utensilio': '🍴'
};

const PROPORCOES = {
    mulher: 0.75,
    crianca: 0.45,
};

// --- FUNÇÕES AUXILIARES DE CÁLCULO ---

/**
 * Calcula a quantidade de carnes com base na cota total e nos pesos relativos.
 */
function processarCarnes(carnesSelecionadas, cotaCarneTotal) {
    if (!carnesSelecionadas || carnesSelecionadas.length === 0) return [];

    const somaPesosRelativos = carnesSelecionadas.reduce((acc, c) => acc + (c.pesoRelativo || 10), 0);
    
    return carnesSelecionadas.map(item => {
        const pesoItem = cotaCarneTotal * (item.pesoRelativo / somaPesosRelativos);
        return {
            nome: `${EMOJIS[item.subcategoria] || EMOJIS['Bovina']} ${item.nome}`,
            quantidade: pesoItem >= 1000 ? `${(pesoItem / 1000).toFixed(2)}kg` : `${Math.ceil(pesoItem)}g`,
            tipo: 'comida'
        };
    });
}

/**
 * Calcula a quantidade de bebidas alcoólicas e não alcoólicas.
 */
function processarBebidas(bebidasSelecionadas, cotas, participantes) {
    if (!bebidasSelecionadas || bebidasSelecionadas.length === 0) return [];
    
    const { cotaAlcoolTotalML, cotaNaoAlcoolTotalML } = cotas;
    const { qtdeQueBebemAlcool } = participantes;

    const resultados = [];
    const alcoolicasSel = bebidasSelecionadas.filter(b => b.subcategoria === 'Alcoólica');
    const naoAlcoolicasSel = bebidasSelecionadas.filter(b => b.subcategoria !== 'Alcoólica');

    // Processa bebidas não alcoólicas
    if (naoAlcoolicasSel.length > 0 && cotaNaoAlcoolTotalML > 0) {
        const somaMls = naoAlcoolicasSel.reduce((acc, b) => acc + (b.mlPorAdulto || 600), 0);
        const itensNaoAlcoolicos = naoAlcoolicasSel.map(item => {
            const proporcao = (item.mlPorAdulto || 600) / somaMls;
            const mlTotalItem = cotaNaoAlcoolTotalML * proporcao;
            const unidades = Math.ceil(mlTotalItem / (item.embalagem || 350));
            return unidades > 0 ? { nome: `${EMOJIS.BebidaNaoAlcoolica} ${item.nome}`, quantidade: `${unidades} un`, tipo: 'bebida' } : null;
        }).filter(Boolean);

        if (itensNaoAlcoolicos.length > 0) {
            resultados.push({ 
                nome: 'Consumo total estimado de bebida NÃO alcoólica', 
                quantidade: `${(cotaNaoAlcoolTotalML / 1000).toFixed(2)} litros`, 
                tipo: 'bebida', subtipo: 'observacao'
            }, ...itensNaoAlcoolicos);
        }
    }

    // Processa bebidas alcoólicas
    if (alcoolicasSel.length > 0 && cotaAlcoolTotalML > 0 && qtdeQueBebemAlcool > 0) {
        const somaMls = alcoolicasSel.reduce((acc, b) => acc + (b.mlPorAdulto || 600), 0);
        const itensAlcoolicos = alcoolicasSel.map(item => {
            const proporcao = (item.mlPorAdulto || 600) / somaMls;
            const mlTotalItem = cotaAlcoolTotalML * proporcao;
            const unidades = Math.ceil(mlTotalItem / (item.embalagem || 350));
            return unidades > 0 ? { nome: `${EMOJIS.BebidaAlcoolica} ${item.nome}`, quantidade: `${unidades} un`, tipo: 'bebida' } : null;
        }).filter(Boolean);

        if (itensAlcoolicos.length > 0) {
            resultados.push({ 
                nome: 'Consumo total estimado de bebida alcoólica', 
                quantidade: `${(cotaAlcoolTotalML / 1000).toFixed(2)} litros`, 
                tipo: 'bebida', subtipo: 'observacao'
            }, ...itensAlcoolicos);
        }
    }
    
    return resultados;
}

/**
 * Calcula a quantidade de acompanhamentos e adicionais.
 */
function processarOutros(outrosSelecionados, cotaOutrosTotal, acompanhamentos) {
    if (!outrosSelecionados || outrosSelecionados.length === 0) return [];
    
    const somaPesos = outrosSelecionados.reduce((acc, i) => acc + (i.gramasPorAdulto ?? i.qtdPorAdulto ?? 10), 0);

    return outrosSelecionados.map(item => {
        const pesoConfig = (item.gramasPorAdulto ?? item.qtdPorAdulto ?? 10);
        const pesoItem = cotaOutrosTotal * (pesoConfig / somaPesos);
        const unit = item.unidade || 'g';
        const emoji = acompanhamentos.some(a => a.id === item.id) ? EMOJIS.Acompanhamento : EMOJIS.Adicional;

        const desc = (unit === 'g' && pesoItem >= 1000)
            ? `${(pesoItem / 1000).toFixed(2)}kg`
            : `${Math.ceil(pesoItem)}${unit}`;
            
        return { nome: `${emoji} ${item.nome}`, quantidade: desc, tipo: 'comida' };
    });
}

/**
 * Calcula a quantidade de utensílios necessários.
 */
function processarUtensilios(utensiliosSelecionados, cotaCarneTotal, nTotalPessoas) {
    if (!utensiliosSelecionados || utensiliosSelecionados.length === 0) return [];

    return utensiliosSelecionados.map(u => {
        let qtd = 0;
        if (u.base === 'carne') qtd = Math.ceil((cotaCarneTotal / 1000) * u.fator);
        else if (u.base === 'pessoa') qtd = Math.ceil(nTotalPessoas * u.fator);
        else qtd = u.fator;

        return { nome: `${EMOJIS.Utensilio} ${u.nome}`, quantidade: `${qtd} ${u.unidade || 'un'}`, tipo: 'outros' };
    });
}


// --- CONTROLLER PRINCIPAL ---

/**
 * @description Orquestra o cálculo completo do churrasco.
 * @route POST /api/calcular
 */
export const calcular = async (req, res) => {
    try {
        const { homens, mulheres, criancas, selecionados, adultosQueBebem, horas } = req.body;
        const usuarioId = req.user ? req.user.id : null;
        const dados = await Opcao.findOne();
        
        if (!dados) return res.status(404).json({ error: "Configurações não encontradas" });

        // 1. Definições e Participantes
        const config = dados.configuracoes;
        const pesoBaseCarne = config?.gramasCarneAdulto || 450;
        const pesoBaseOutros = config?.gramasOutrosAdulto || 250;
        const cotaBebidaBase = config?.mlBebidaAdulto || 1500;

        const nHomens = parseInt(homens) || 0;
        const nMulheres = parseInt(mulheres) || 0;
        const nCriancas = parseInt(criancas) || 0;
        const nAdultosTotal = nHomens + nMulheres;
        const nTotalPessoas = nAdultosTotal + nCriancas;
        const qtdeQueBebemAlcool = Math.min(parseInt(adultosQueBebem) || 0, nAdultosTotal);
        
        const fatorTempo = 1 + (Math.max(0, (parseInt(horas) || 4) - 4) * 0.2);

        // 2. Cálculo de Cotas Totais
        const cotaCarneTotal = ((nHomens * pesoBaseCarne) + (nMulheres * pesoBaseCarne * PROPORCOES.mulher) + (nCriancas * pesoBaseCarne * PROPORCOES.crianca)) * fatorTempo;
        const cotaOutrosTotal = ((nHomens * pesoBaseOutros) + (nMulheres * pesoBaseOutros * PROPORCOES.mulher) + (nCriancas * pesoBaseOutros * PROPORCOES.crianca)) * fatorTempo;
        
        const pesoMedioAdulto = nAdultosTotal > 0 ? (nHomens + (nMulheres * PROPORCOES.mulher)) / nAdultosTotal : 1;
        const cotaAlcoolTotalML = (qtdeQueBebemAlcool * (cotaBebidaBase * pesoMedioAdulto)) * fatorTempo;
        const cotaNaoAlcoolTotalML = (((nAdultosTotal - qtdeQueBebemAlcool) * (cotaBebidaBase * pesoMedioAdulto)) + (nCriancas * (cotaBebidaBase * PROPORCOES.crianca))) * fatorTempo;

        // 3. Seleção de Itens
        const carnesSel = dados.carnes.filter(c => selecionados.includes(c.id));
        const bebidasSel = dados.bebidas.filter(b => selecionados.includes(b.id));
        const outrosSel = [...dados.acompanhamentos, ...dados.adicionais].filter(i => selecionados.includes(i.id));
        const utensiliosSel = dados.utensilios.filter(u => selecionados.includes(u.id));

        // 4. Processamento e Geração de Resultados
        const resultadosCarnes = processarCarnes(carnesSel, cotaCarneTotal);
        const resultadosBebidas = processarBebidas(bebidasSel, { cotaAlcoolTotalML, cotaNaoAlcoolTotalML }, { qtdeQueBebemAlcool });
        const resultadosOutros = processarOutros(outrosSel, cotaOutrosTotal, dados.acompanhamentos);
        const resultadosUtensilios = processarUtensilios(utensiliosSel, cotaCarneTotal, nTotalPessoas);
        
        const resultadosFinais = [
            ...resultadosCarnes,
            ...resultadosBebidas,
            ...resultadosOutros,
            ...resultadosUtensilios,
        ];

        try {
            await CalculoLog.create({
                usuarioId: usuarioId, // Se null, salva sem usuário conforme pedido
                participantes: {
                    homens: nHomens,
                    mulheres: nMulheres,
                    criancas: nCriancas,
                    adultosQueBebem: qtdeQueBebemAlcool
                },
                horasDuracao: parseInt(horas) || 4,
                itensSelecionados: selecionados,
                resultadoFinal: resultadosFinais,
                dataConsulta: new Date() // Data e hora atual
            });
        } catch (logErr) {
            console.error("Erro ao salvar log de consulta:", logErr);
            // Não bloqueamos a resposta ao usuário se o log falhar
        }

        res.json(resultadosFinais);

    } catch (err) {
        console.error("Erro detalhado no cálculo:", err);
        res.status(500).json({ error: "Erro ao processar o cálculo." });
    }
};
