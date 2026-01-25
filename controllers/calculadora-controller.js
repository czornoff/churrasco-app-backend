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
    'Adicional': '🧀',
    'BebidaAlcoolica': '🍻',
    'BebidaNaoAlcoolica': '🥤',
    'Utensilio': '🍴',
    'Sobremesa': '🍰'
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
    
    // 1. Calcula o peso real de cada item primeiro
    const itensCalculados = carnesSelecionadas.map(item => {
        const pesoItem = cotaCarneTotal * ((item.pesoRelativo || 10) / somaPesosRelativos);
        return {
            ...item,
            pesoReal: pesoItem
        };
    });

    // 2. Agrupa por subcategoria para calcular subtotais
    const agrupado = itensCalculados.reduce((acc, item) => {
        const sub = item.subcategoria || 'Outras';
        if (!acc[sub]) acc[sub] = { itens: [], totalSub: 0 };
        acc[sub].itens.push(item);
        acc[sub].totalSub += item.pesoReal;
        return acc;
    }, {});

    const resultados = [];
    let totalGeralCarnes = 0;

    // 3. Monta o array final com os itens e os subtotais intercalados
    Object.keys(agrupado).forEach(sub => {
        const dadosSub = agrupado[sub];
        totalGeralCarnes += dadosSub.totalSub;

        // Adiciona os itens da subcategoria
        dadosSub.itens.forEach(item => {
            resultados.push({
                nome: `${EMOJIS[item.subcategoria] || EMOJIS['Bovina']} ${item.nome}`,
                quantidade: item.pesoReal >= 1000 ? `${(item.pesoReal / 1000).toFixed(2)}kg` : `${Math.ceil(item.pesoReal)}g`,
                tipo: 'comida',
                subcategoria: sub
            });
        });

        // Adiciona a linha de Subtotal da Subcategoria (ex: Subtotal Bovina)
        resultados.push({
            nome: `Subtotal ${sub}`,
            quantidade: dadosSub.totalSub >= 1000 ? `${(dadosSub.totalSub / 1000).toFixed(2)}kg` : `${Math.ceil(dadosSub.totalSub)}g`,
            tipo: 'comida',
            subtipo: 'subtotal', // Para você estilizar diferente no front se quiser
            isBold: true
        });
    });

    // 4. Adiciona o Total Geral de Carnes no final da seção
    resultados.push({
        nome: `TOTAL GERAL DE CARNES`,
        quantidade: totalGeralCarnes >= 1000 ? `${(totalGeralCarnes / 1000).toFixed(2)}kg` : `${Math.ceil(totalGeralCarnes)}g`,
        tipo: 'comida',
        subtipo: 'total_secao',
        isBold: true
    });

    return resultados;
}

/**
 * Calcula a quantidade de bebidas alcoólicas e não alcoólicas.
 */
function processarBebidas(bebidasSelecionadas, cotas, participantes) {
    if (!bebidasSelecionadas || bebidasSelecionadas.length === 0) return [];
    
    const { cotaAlcoolTotalML, cotaNaoAlcoolTotalML } = cotas;
    const { qtdeQueBebemAlcool } = participantes;
    const resultados = [];

    // Não Alcoólicas
    const naoAlcoolicasSel = bebidasSelecionadas.filter(b => b.subcategoria !== 'Alcoólica');
    if (naoAlcoolicasSel.length > 0) {
        const somaMls = naoAlcoolicasSel.reduce((acc, b) => acc + (b.mlPorAdulto || 600), 0);
        naoAlcoolicasSel.forEach(item => {
            const mlTotalItem = cotaNaoAlcoolTotalML * ((item.mlPorAdulto || 600) / somaMls);
            const unidades = Math.ceil(mlTotalItem / (item.embalagem || 350));
            resultados.push({ nome: `${EMOJIS.BebidaNaoAlcoolica} ${item.nome}`, quantidade: `${unidades} un`, tipo: 'bebida' });
        });
        resultados.push({
            nome: "TOTAL BEBIDAS NÃO ALCOÓLICAS",
            quantidade: `${(cotaNaoAlcoolTotalML / 1000).toFixed(2)}L`,
            tipo: 'bebida', subtipo: 'total_secao', isBold: true
        });
    }

    // Alcoólicas
    const alcoolicasSel = bebidasSelecionadas.filter(b => b.subcategoria === 'Alcoólica');
    if (alcoolicasSel.length > 0 && qtdeQueBebemAlcool > 0) {
        const somaMls = alcoolicasSel.reduce((acc, b) => acc + (b.mlPorAdulto || 600), 0);
        alcoolicasSel.forEach(item => {
            const mlTotalItem = cotaAlcoolTotalML * ((item.mlPorAdulto || 600) / somaMls);
            const unidades = Math.ceil(mlTotalItem / (item.embalagem || 350));
            resultados.push({ nome: `${EMOJIS.BebidaAlcoolica} ${item.nome}`, quantidade: `${unidades} un`, tipo: 'bebida' });
        });
        resultados.push({
            nome: "TOTAL BEBIDAS ALCOÓLICAS",
            quantidade: `${(cotaAlcoolTotalML / 1000).toFixed(2)}L`,
            tipo: 'bebida', subtipo: 'total_secao', isBold: true
        });
    }
    
    return resultados;
}

function processarOutros(outrosSelecionados, cotaOutrosTotal, acompanhamentos) {
    if (!outrosSelecionados || outrosSelecionados.length === 0) return [];
    
    const somaPesos = outrosSelecionados.reduce((acc, i) => acc + (i.gramasPorAdulto ?? i.qtdPorAdulto ?? 10), 0);
    let totalGeral = 0;

    const itens = outrosSelecionados.map(item => {
        const pesoItem = cotaOutrosTotal * ((item.gramasPorAdulto ?? item.qtdPorAdulto ?? 10) / somaPesos);
        totalGeral += pesoItem;
        const unit = item.unidade || 'g';
        const emoji = acompanhamentos.some(a => a.id === item.id) ? EMOJIS.Acompanhamento : EMOJIS.Adicional;
        const desc = (unit === 'g' && pesoItem >= 1000) ? `${(pesoItem / 1000).toFixed(2)}kg` : `${Math.ceil(pesoItem)}${unit}`;
        
        return { nome: `${emoji} ${item.nome}`, quantidade: desc, tipo: 'acompanhamentos' };
    });

    itens.push({
        nome: "TOTAL ACOMPANHAMENTOS/ADICIONAIS",
        quantidade: totalGeral >= 1000 ? `${(totalGeral / 1000).toFixed(2)}kg` : `${Math.ceil(totalGeral)}g`,
        tipo: 'acompanhamentos', subtipo: 'total_secao', isBold: true
    });

    return itens;
}

function processarSobremesas(sobremesasSelecionadas, nHomens, nMulheres, nCriancas) {
    if (!sobremesasSelecionadas || sobremesasSelecionadas.length === 0) return [];
    let totalGeral = 0;

    const itens = sobremesasSelecionadas.map(item => {
        const gramasBase = item.gramasPorAdulto || 100;
        const totalGramas = (nHomens + nMulheres + nCriancas) * gramasBase;
        totalGeral += totalGramas;
        return {
            nome: `${EMOJIS.Sobremesa} ${item.nome}`,
            quantidade: totalGramas >= 1000 ? `${(totalGramas / 1000).toFixed(2)}kg` : `${Math.ceil(totalGramas)}g`,
            tipo: 'sobremesas'
        };
    });

    itens.push({
        nome: "TOTAL SOBREMESAS",
        quantidade: totalGeral >= 1000 ? `${(totalGeral / 1000).toFixed(2)}kg` : `${Math.ceil(totalGeral)}g`,
        tipo: 'sobremesas', subtipo: 'total_secao', isBold: true
    });

    return itens;
}

/**
 * Calcula a quantidade de utensílios necessários.
 */
function processarUtensilios(utensiliosSelecionados, cotaCarneTotal, nTotalPessoas, fatorTempo) {
    if (!utensiliosSelecionados || utensiliosSelecionados.length === 0) return [];

    return utensiliosSelecionados.map(u => {
        let qtd = 0;
        if (u.base === 'carne') qtd = Math.ceil((cotaCarneTotal / 1000) * u.fator);
        else if (u.base === 'pessoa') qtd = Math.ceil(nTotalPessoas * u.fator);
        else qtd = u.fator;

        qtd *= fatorTempo;

        if (u.unidade === 'kg') qtd = Math.ceil(qtd).toFixed(0);

        return { nome: `${EMOJIS.Utensilio} ${u.nome}`, quantidade: `${qtd} ${u.unidade || 'un'}`, tipo: 'outros' };
    });
}

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
        const sobremesasSel = (dados.sobremesas || []).filter(s => selecionados.includes(s.id));

        // 4. Processamento e Geração de Resultados
        const resultadosCarnes = processarCarnes(carnesSel, cotaCarneTotal);
        const resultadosBebidas = processarBebidas(bebidasSel, { cotaAlcoolTotalML, cotaNaoAlcoolTotalML }, { qtdeQueBebemAlcool });
        const resultadosOutros = processarOutros(outrosSel, cotaOutrosTotal, dados.acompanhamentos);
        const resultadosUtensilios = processarUtensilios(utensiliosSel, cotaCarneTotal, nTotalPessoas, fatorTempo);
        const resultadosSobremesas = processarSobremesas(sobremesasSel, nHomens, nMulheres, nCriancas);
        
        const resultadosFinais = [
            ...resultadosCarnes,
            ...resultadosBebidas,
            ...resultadosOutros,
            ...resultadosSobremesas,
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
