import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for AI Agent (Gemini)
  app.post('/api/chat-ai', async (req, res) => {
    try {
      const { message, knowledgeBase, history } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        console.warn('GEMINI_API_KEY is missing or invalid.');
        return res.json({
          text: '⚠️ O serviço de Inteligência Artificial está temporariamente indisponível. Digite *0* para retornar ao menu principal.',
          isError: true,
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `Você é um assistente virtual de atendimento ao cliente via WhatsApp, inteligente, cortês, prestativo e objetivo.
Seu objetivo é responder às dúvidas do cliente com base na seguinte Base de Conhecimento e contexto de negócio:

--- BASE DE CONHECIMENTO ---
${knowledgeBase && knowledgeBase.trim() ? knowledgeBase : 'Atendimento geral da empresa. Responda com cordialidade e objetividade.'}
----------------------------

Instruções importantes:
1. Seja amigável e objetivo em suas respostas (estilo mensagem de WhatsApp).
2. Utilize formatação legível (ex: *negrito* para destacar pontos importantes).
3. Responda estritamente com base na Base de Conhecimento fornecida acima quando aplicável.
4. Se o cliente pedir para voltar, falar com humano ou mudar de assunto, lembre-o de que pode digitar "0" ou "menu" a qualquer momento para retornar ao menu principal.`;

      // Build contents with conversation history
      const formattedContents = [];

      if (Array.isArray(history) && history.length > 0) {
        // Take last 10 messages for context
        const recentHistory = history.slice(-10);
        for (const item of recentHistory) {
          if (item.text && (item.sender === 'client' || item.sender === 'bot')) {
            formattedContents.push({
              role: item.sender === 'client' ? 'user' : 'model',
              parts: [{ text: item.text }],
            });
          }
        }
      }

      // Add current client message
      formattedContents.push({
        role: 'user',
        parts: [{ text: message || 'Olá' }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || 'Desculpe, não consegui processar sua pergunta. Digite *0* para voltar ao menu.';

      return res.json({ text: replyText, isError: false });
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      return res.json({
        text: '⚠️ Tivemos uma instabilidade temporária no serviço de IA. Por favor, tente novamente em instantes ou digite *0* para retornar ao menu principal.',
        isError: true,
        errorDetail: error?.message || 'Unknown error',
      });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
