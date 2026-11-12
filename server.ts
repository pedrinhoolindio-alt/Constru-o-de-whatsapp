import express from 'express';
import path from 'path';
import fs from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import pino from 'pino';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authDir = path.join(__dirname, '.baileys_auth');
fs.mkdirSync(authDir, { recursive: true, mode: 0o700 });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const logger = pino({ level: 'silent' });

app.use(express.json({ limit: '1mb' }));

// Mantém o endpoint de IA do projeto original, caso seja reutilizado futuramente.
app.post('/api/chat-ai', async (req, res) => {
  try {
    const { message, knowledgeBase, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ text: 'Serviço de IA não configurado.', isError: true });
    }
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `Você é um assistente de atendimento. Use esta base de conhecimento:\n${knowledgeBase || 'Atendimento geral.'}`;
    const contents = [
      ...(Array.isArray(history) ? history.slice(-10).map((item: any) => ({
        role: item.sender === 'bot' ? 'model' : 'user',
        parts: [{ text: String(item.text || '') }],
      })) : []),
      { role: 'user', parts: [{ text: String(message || 'Olá') }] },
    ];
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: { systemInstruction, temperature: 0.7 },
    });
    return res.json({ text: response.text || 'Não consegui responder agora.', isError: false });
  } catch (error: any) {
    console.error('Gemini:', error?.message || error);
    return res.status(500).json({ text: 'Serviço de IA indisponível.', isError: true });
  }
});

type ChatMessage = {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
};
type Conversation = {
  jid: string;
  phone: string;
  name: string;
  messages: ChatMessage[];
  lastMessage: string;
  time: string;
};

let waSocket: ReturnType<typeof makeWASocket> | null = null;
let connectionStatus = 'disconnected';
let qrDataUrl: string | null = null;
let starting = false;
let manualDisconnect = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const conversations = new Map<string, Conversation>();

function setStatus(status: string) {
  connectionStatus = status;
  io.emit('whatsapp:status', { status });
}

function timeLabel(value = Date.now()) {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getMessageText(message: any): string {
  const content = message?.ephemeralMessage?.message
    || message?.viewOnceMessage?.message
    || message?.viewOnceMessageV2?.message
    || message;
  return content?.conversation
    || content?.extendedTextMessage?.text
    || content?.imageMessage?.caption
    || content?.videoMessage?.caption
    || content?.documentMessage?.caption
    || content?.buttonsResponseMessage?.selectedDisplayText
    || content?.listResponseMessage?.title
    || '';
}

function phoneFromJid(jid: string): string {
  return jid.split('@')[0].split(':')[0].replace(/\D/g, '');
}

function addMessage(jid: string, item: ChatMessage, eventName: string) {
  const conversation: Conversation = conversations.get(jid) || {
    jid,
    phone: phoneFromJid(jid),
    name: phoneFromJid(jid),
    messages: [],
    lastMessage: '',
    time: '',
  };
  if (!conversation.messages.some((message) => message.id === item.id)) {
    conversation.messages.push(item);
  }
  conversation.lastMessage = item.text || '[Mensagem de mídia]';
  conversation.time = item.time;
  conversations.set(jid, conversation);
  io.emit(eventName, conversation);
}

async function startWhatsApp() {
  if (starting || (waSocket && connectionStatus === 'connected')) return;
  starting = true;
  manualDisconnect = false;
  setStatus('connecting');

  try {
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const socket = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ['WhatsApp CRM Teste', 'Chrome', '1.0.0'],
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });
    waSocket = socket;
    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        qrDataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 2 });
        setStatus('qr');
        io.emit('whatsapp:qr', { qr: qrDataUrl });
      }
      if (connection === 'open') {
        qrDataUrl = null;
        setStatus('connected');
      }
      if (connection === 'close') {
        const code = (lastDisconnect?.error as any)?.output?.statusCode;
        waSocket = null;
        if (manualDisconnect || code === DisconnectReason.loggedOut) {
          qrDataUrl = null;
          setStatus('disconnected');
          return;
        }
        setStatus('reconnecting');
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          starting = false;
          startWhatsApp().catch((error) => console.error('Reconexão WhatsApp:', error));
        }, 3000);
      }
    });

    socket.ev.on('messages.upsert', ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const message of messages) {
        const jid = message.key?.remoteJid;
        if (!jid || jid === 'status@broadcast' || jid.endsWith('@g.us') || jid.endsWith('@broadcast')) continue;
        const timestamp = Number(message.messageTimestamp || Math.floor(Date.now() / 1000)) * 1000;
        addMessage(jid, {
          id: message.key?.id || `msg-${Date.now()}`,
          text: getMessageText(message.message) || '[Mensagem recebida; conteúdo de mídia não exibido]',
          fromMe: Boolean(message.key?.fromMe),
          time: timeLabel(timestamp),
        }, message.key?.fromMe ? 'message:sent' : 'message:received');
      }
    });
  } catch (error) {
    waSocket = null;
    setStatus('disconnected');
    throw error;
  } finally {
    starting = false;
  }
}

app.get('/api/status', (_req, res) => {
  res.json({ status: connectionStatus, qr: qrDataUrl });
});

app.post('/api/whatsapp/connect', async (_req, res) => {
  try {
    await startWhatsApp();
    res.json({ status: connectionStatus, message: 'Conexão iniciada. Aguarde o QR Code.' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Não foi possível iniciar o WhatsApp.' });
  }
});

app.post('/api/whatsapp/disconnect', async (_req, res) => {
  try {
    manualDisconnect = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    const current = waSocket;
    waSocket = null;
    if (current) await current.logout();
    qrDataUrl = null;
    setStatus('disconnected');
    res.json({ status: connectionStatus });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Falha ao desconectar.' });
  }
});

app.get('/api/conversations', (_req, res) => {
  const items = [...conversations.values()].sort(
    (a, b) => (b.messages.at(-1)?.id || '').localeCompare(a.messages.at(-1)?.id || ''),
  );
  res.json({ conversations: items });
});

app.get('/api/conversations/:jid/messages', (req, res) => {
  res.json({ messages: conversations.get(req.params.jid)?.messages || [] });
});

app.post('/api/messages/send', async (req, res) => {
  try {
    if (!waSocket || connectionStatus !== 'connected') {
      return res.status(409).json({ error: 'WhatsApp não está conectado.' });
    }
    const number = String(req.body?.number || '').replace(/\D/g, '');
    const text = String(req.body?.text || '').trim();
    if (number.length < 8 || number.length > 15) {
      return res.status(400).json({ error: 'Número inválido. Use DDI + DDD + número.' });
    }
    if (!text || text.length > 4000) {
      return res.status(400).json({ error: 'Mensagem vazia ou maior que 4.000 caracteres.' });
    }
    const jid = `${number}@s.whatsapp.net`;
    const result = await waSocket.sendMessage(jid, { text });
    const item: ChatMessage = {
      id: result?.key?.id || `local-${Date.now()}`,
      text,
      fromMe: true,
      time: timeLabel(),
    };
    addMessage(jid, item, 'message:sent');
    res.json({ success: true, conversation: conversations.get(jid) });
  } catch (error: any) {
    console.error('Falha no envio WhatsApp:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Falha ao enviar mensagem.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(`WhatsApp CRM Teste em http://${HOST}:${PORT}`);
    console.log('Protótipo de teste. Não exponha publicamente nem use número de produção.');
  });
}

startServer().catch((error) => {
  console.error('Falha ao iniciar servidor:', error);
  process.exit(1);
});
