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

        const prompt = `Atue como um especialista em churrasco. Com base nestes itens: ${JSON.stringify(itens)}, gere uma estimativa de custo em Reais. Retorne um JSON com separação entre as carnes, bovina, suína, frango, linguiça, bebidas (alcoólicas e não alcoólicas), adicionais, acompanhamentos e utensílios. O JSON deve ter o seguinte formato, trazendo somente os itens e as categorias que foram previamente selecionados, opções e outros dados devem estar no campo observacao: { "grupos": [{"nome": string, "valor": number}], "total": number, "observacao": string }`;

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