import { GoogleGenerativeAI } from "@google/generative-ai";

export const gerarEstimativa = async (req, res) => {
    const { itens } = req.body;

    // 1. Inicializa o SDK
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
        // 2. Tente usar o modelo com o sufixo -latest ou o nome estável
        // Em versões novas do Node, o prefixo 'models/' ajuda a evitar o 404

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
        });

        const prompt = `Atue como um especialista em churrasco. Com base nestes itens: ${JSON.stringify(itens)}, gere uma estimativa de custo em Reais. Retorne um JSON com separação entre as carnes, bovina, suína, frango, linguiça, bebidas (alcoólicas e não alcoólicas), adicionais, acompanhamentos e utensílios. use o formato a seguir de retorno --- Detalhamento dos Custos e Pesos ---\n- 🥩 Alcatra: 2.21 kg x R$ 50.00/kg = R$ 110.50\n- 🥩 Bananinha: 0.44 kg x R$ 40.00/kg = R$ 17.72\n- 🥩 Contra-filé: 2.21 kg x R$ 60.00/kg = R$ 132.60\n- 🍖 Choripan: 0.49 kg x R$ 30.00/kg = R$ 14.61\n- 🐔 Coxinha da Asa: 0.66 kg x R$ 20.00/kg = R$ 13.28\n- 🐔 Meio da Asa (Tulipa): 0.66 kg x R$ 23.00/kg = R$ 15.27\n- 🌭 Linguiça Apimentada: 0.44 kg x R$ 30.00/kg = R$ 13.29\n- 🌭 Linguiça Toscana: 0.89 kg x R$ 28.00/kg = R$ 24.78\n- 🥓 Panceta Suína: 0.89 kg x R$ 40.00/kg = R$ 35.40\n- 🥤 Refrigerante 2L: 10 un x R$ 10.00/un = R$ 100.00\n- 🍻 Cerveja Lata 350ml: 15 un x R$ 5.00/un = R$ 75.00\n- 🥗 Arroz: 1.70 kg x R$ 7.00/kg = R$ 11.90\n- 🥗 Farofa: 0.68 kg x R$ 25.00/kg = R$ 17.05\n- 🧀 Pão de Alho: 1.36 kg x R$ 25.00/kg = R$ 34.00\n- 🧀 Queijo Coalho (espeto): 1.19 kg x R$ 50.00/kg = R$ 59.50\n- 🍰 abacaxi: 1.25 kg x R$ 10.00/kg = R$ 12.50\n- 🍰 Bolo: 2.50 kg x R$ 50.00/kg = R$ 125.00\n- 🍴 Acendedor: 2 un x R$ 7.00/un = R$ 14.00\n- 🍴 Carvão: 9 kg x R$ 20.00/kg = R$ 180.00\n\n--- Resumo por Categoria ---\nTotal Carnes - Bovina: R$ 260.82 (4.86 kg)\nTotal Carnes - Suína: R$ 35.40 (0.89 kg)\nTotal Carnes - Frango: R$ 28.55 (1.33 kg)\nTotal Carnes - Linguiça: R$ 38.07 (1.33 kg)\nTotal Carnes - Outras: R$ 14.61 (0.49 kg)\nTotal Bebidas - Não Alcoólicas: R$ 100.00 (20.00 L)\nTotal Bebidas - Alcoólicas: R$ 75.00 (5.25 L)\nTotal Acompanhamentos/Adicionais: R$ 122.45 (4.93 kg)\nTotal Sobremesas: R$ 137.50 (3.75 kg)\nTotal Utensílios/Outros: R$ 194.00\n\n--- Totais Gerais ---\nTotal de Carnes: R$ 377.45 (8.89 kg)\nTotal de Bebidas: R$ 175.00 (25.25 L)\nTotal Geral Estimado do Churrasco: R$ 1006.40\n\n--- Observações ---\nOs preços unitários são estimativas baseadas em valores médios de mercado no Brasil (região sudeste) para produtos de qualidade intermediária, e podem variar conforme o fornecedor, promoções e localização geográfica.\nAs quantidades foram convertidas para kg para carnes e acompanhamentos. Para as bebidas, o 'peso' nos grupos representa o volume total em Litros (L).\nO arroz foi precificado como 'arroz cru' e a farofa como 'farofa pronta'.\nO volume total de Refrigerante 2L foi calculado como 10 unidades * 2L/un = 20L, o que difere ligeiramente do subtotal de 18.45L fornecido no input original, presumindo que o item 'Refrigerante 2L' se refere a garrafas de 2 litros. O JSON deve ter o seguinte formato, trazendo somente os itens e as categorias que foram previamente selecionados, o total dos grupos, carnes e bebidas, devem estar no final de observações, junto com o peso e valor unitario de cada item, linhas que os valores são igual a zero não devem ser mostradas, opções e outros dados devem estar no campo observacao: { "grupos": [{"nome": string, "valor": number, "peso": number}], "total": number, "observacao": string }`;

        // 3. Executa a geração
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            text = jsonMatch[0];
        } else {
            throw new Error("A IA não retornou um formato JSON válido.");
        }

        try {
            const dadosEstimativa = JSON.parse(text);
            res.status(200).json(dadosEstimativa);
        } catch (parseError) {
            console.error("Erro ao parsear texto da IA:", text);
            res.status(500).json({ error: "Erro na formatação da estimativa." });
        }

    } catch (error) {
        console.error("ERRO DETALHADO:");
        console.error("Mensagem:", error.message);
        
        // Se o erro for 404, tente este fallback automático
        if (error.message.includes('404')) {
            return res.status(404).json({ 
                error: "Modelo não encontrado. Verifique se o modelo 'gemini-1.5-flash' está disponível na sua região ou tente 'gemini-1.5-pro'." 
            });
        }

        res.status(500).json({ error: "Erro interno ao processar IA" });
    }
};