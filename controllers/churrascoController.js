const fs = require('fs');
const path = require('path');
const DATA_PATH = process.env.DATA_PATH || './data.json';
const lerDados = () => JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

exports.getOpcoes = (req, res) => res.json(lerDados());

exports.salvarDados = (req, res) => {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

exports.calcular = (req, res) => {
    const { adultos, criancas, selecionados } = req.body;
    const dados = lerDados();
    const resultados = [];
    const nAdultos = parseInt(adultos) || 0;
    const nCriancas = parseInt(criancas) || 0;
    const nTotal = nAdultos + nCriancas;

    // 1. Carnes (Baseado em Peso Relativo Individual)
    const cotaCarneTotal = (nAdultos * dados.configuracoes.gramasCarneAdulto) + (nCriancas * dados.configuracoes.gramasCarneCrianca);
    const carnesSel = dados.carnes.filter(c => selecionados.includes(c.id));
    
    if (carnesSel.length > 0) {
        const somaPesos = carnesSel.reduce((acc, c) => acc + (c.pesoRelativo || 10), 0);
        carnesSel.forEach(item => {
            const pesoItem = cotaCarneTotal * (item.pesoRelativo / somaPesos);
            resultados.push({
                nome: item.nome,
                quantidade: pesoItem >= 1000 ? `${(pesoItem/1000).toFixed(2)}kg` : `${Math.ceil(pesoItem)}g`,
                tipo: 'comida'
            });
        });
    }

    // 2. Bebidas (Calculando unidades baseadas na embalagem)
    dados.bebidas.filter(b => selecionados.includes(b.id)).forEach(item => {
        const mlTotal = (nAdultos * item.mlPorAdulto) + (nCriancas * (item.mlPorAdulto / 2));
        const unidades = Math.ceil(mlTotal / (item.embalagem || 350));
        resultados.push({ nome: item.nome, quantidade: `${unidades} un`, tipo: 'bebida' });
    });

    // 3. Acompanhamentos e Adicionais
    const outrosComida = [...dados.acompanhamentos, ...dados.adicionais];
    outrosComida.filter(i => selecionados.includes(i.id)).forEach(item => {
        let valor = 0;
        let unit = item.unidade || 'g';
        
        if (item.gramasPorAdulto) {
            valor = (nAdultos * item.gramasPorAdulto) + (nCriancas * (item.gramasPorAdulto / 2));
        } else if (item.qtdPorAdulto) {
            valor = (nAdultos * item.qtdPorAdulto) + (nCriancas * (item.qtdPorAdulto / 2));
        }

        const desc = (unit === 'g' && valor >= 1000) ? `${(valor/1000).toFixed(2)}kg` : `${Math.ceil(valor)}${unit}`;
        resultados.push({ nome: item.nome, quantidade: desc, tipo: 'comida' });
    });

    // 4. Utensílios (Base dinâmica: carne, pessoa ou fixo)
    dados.utensilios.filter(u => selecionados.includes(u.id)).forEach(u => {
        let qtd = 0;
        if (u.base === 'carne') qtd = Math.ceil((cotaCarneTotal / 1000) * u.fator);
        else if (u.base === 'pessoa') qtd = Math.ceil(nTotal * u.fator);
        else qtd = u.fator; // Fixo

        resultados.push({ nome: u.nome, quantidade: `${qtd} ${u.unidade || 'un'}`, tipo: 'outros' });
    });

    res.json(resultados);
};