import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { MessageCircle, QrCode, Send, Smartphone, Wifi, WifiOff, RefreshCw } from 'lucide-react';

type ChatMessage = { id: string; text: string; fromMe: boolean; time: string };
type Conversation = { jid: string; phone: string; name: string; messages: ChatMessage[]; lastMessage: string; time: string };
type Status = 'disconnected' | 'connecting' | 'qr' | 'connected' | 'reconnecting';

const socket = io();
const statusText: Record<string, string> = {
  disconnected: 'Desconectado',
  connecting: 'Iniciando conexão',
  qr: 'Aguardando leitura do QR Code',
  connected: 'WhatsApp conectado',
  reconnecting: 'Reconectando',
};

export default function App() {
  const [status, setStatus] = useState<Status>('disconnected');
  const [qr, setQr] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedJid, setSelectedJid] = useState('');
  const [target, setTarget] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('Conecte um número separado para testes.');

  const selected = useMemo(
    () => conversations.find((conversation) => conversation.jid === selectedJid),
    [conversations, selectedJid],
  );

  async function refreshState() {
    try {
      const [statusResponse, conversationsResponse] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/conversations'),
      ]);
      const statusData = await statusResponse.json();
      const conversationsData = await conversationsResponse.json();
      setStatus(statusData.status || 'disconnected');
      setQr(statusData.qr || '');
      setConversations(conversationsData.conversations || []);
    } catch {
      setNotice('Servidor ainda não respondeu. Aguarde e atualize a página.');
    }
  }

  useEffect(() => {
    refreshState();
    socket.on('whatsapp:status', ({ status: nextStatus }) => setStatus(nextStatus));
    socket.on('whatsapp:qr', ({ qr: nextQr }) => { setQr(nextQr); setStatus('qr'); });
    const handleMessage = (conversation: Conversation) => {
      setConversations((current) => [conversation, ...current.filter((item) => item.jid !== conversation.jid)]);
      setSelectedJid((current) => current || conversation.jid);
      setTarget((current) => current || conversation.phone);
      setNotice('Mensagem sincronizada.');
    };
    socket.on('message:received', handleMessage);
    socket.on('message:sent', handleMessage);
    socket.on('message:error', ({ error }) => setNotice(error || 'Erro no envio.'));
    return () => {
      socket.off('whatsapp:status');
      socket.off('whatsapp:qr');
      socket.off('message:received', handleMessage);
      socket.off('message:sent', handleMessage);
      socket.off('message:error');
    };
  }, []);

  useEffect(() => {
    if (selected) setTarget(selected.phone);
  }, [selectedJid]);

  async function connect() {
    setBusy(true);
    setNotice('Iniciando sessão do WhatsApp…');
    try {
      const response = await fetch('/api/whatsapp/connect', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível conectar.');
      setStatus(data.status || 'connecting');
      setNotice(data.message || 'Aguardando QR Code.');
    } catch (error: any) {
      setNotice(error.message || 'Erro ao conectar.');
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      const response = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao desconectar.');
      setQr('');
      setStatus('disconnected');
      setNotice('Sessão desconectada.');
    } catch (error: any) {
      setNotice(error.message || 'Falha ao desconectar.');
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const number = target.replace(/\D/g, '');
    const text = draft.trim();
    if (number.length < 8 || number.length > 15) {
      setNotice('Informe o número com DDI e DDD. Ex.: 5511999999999.');
      return;
    }
    if (!text) return;
    setBusy(true);
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha no envio.');
      const conversation = data.conversation as Conversation;
      setConversations((current) => [conversation, ...current.filter((item) => item.jid !== conversation.jid)]);
      setSelectedJid(conversation.jid);
      setDraft('');
      setNotice('Mensagem enviada para a API do WhatsApp.');
    } catch (error: any) {
      setNotice(error.message || 'Erro ao enviar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><MessageCircle size={21} /></div>
          <div><strong>WhatsApp CRM</strong><span>Protótipo de conexão</span></div>
        </div>
        <div className="top-actions">
          <span className={`status-chip ${status}`}><i />{statusText[status] || status}</span>
          {status === 'connected'
            ? <button className="button secondary" onClick={disconnect} disabled={busy}><WifiOff size={15} /> Desconectar</button>
            : <button className="button primary" onClick={connect} disabled={busy}><RefreshCw size={15} /> {busy ? 'Aguarde…' : 'Conectar WhatsApp'}</button>}
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="kicker">LABORATÓRIO · UMA CONEXÃO · TESTE REAL</span>
          <h1>Seu WhatsApp.<br /><em>Dentro do CRM.</em></h1>
          <p>Vamos validar o básico: conectar por QR Code, receber uma mensagem e responder por esta tela.</p>
          <div className="hero-note"><Smartphone size={16} /> Use um número separado, exclusivo para testes.</div>
        </div>
        <div className="qr-card">
          <div className="card-label"><span>CONEXÃO DO DISPOSITIVO</span><span className={`pulse ${status === 'connected' ? 'on' : ''}`} /></div>
          {qr ? (
            <div className="qr-content">
              <img src={qr} alt="QR Code para conectar o WhatsApp" />
              <strong>Escaneie com seu WhatsApp</strong>
              <small>WhatsApp → Aparelhos conectados → Conectar aparelho</small>
            </div>
          ) : (
            <div className="qr-empty">
              {status === 'connected' ? <Wifi size={42} /> : <QrCode size={48} />}
              <strong>{status === 'connected' ? 'Dispositivo conectado' : 'QR Code aparecerá aqui'}</strong>
              <small>{status === 'connected' ? 'A sessão está ativa.' : 'Clique em Conectar WhatsApp para gerar o código.'}</small>
            </div>
          )}
        </div>
      </section>

      <section className="inbox">
        <aside className="sidebar">
          <div className="sidebar-heading"><div><span className="kicker">CAIXA DE ENTRADA</span><h2>Conversas</h2></div><span className="counter">{conversations.length}</span></div>
          {conversations.length === 0 ? (
            <div className="empty-state"><MessageCircle size={27} /><strong>Nenhuma mensagem ainda</strong><span>Quando alguém escrever para o número conectado, a conversa aparecerá aqui.</span></div>
          ) : conversations.map((conversation) => (
            <button key={conversation.jid} className={`conversation ${selectedJid === conversation.jid ? 'active' : ''}`} onClick={() => { setSelectedJid(conversation.jid); setTarget(conversation.phone); }}>
              <span className="avatar">{conversation.phone.slice(-2)}</span>
              <span className="conversation-text"><strong>{conversation.name || conversation.phone}</strong><small>{conversation.lastMessage}</small></span>
              <time>{conversation.time}</time>
            </button>
          ))}
        </aside>

        <section className="chat">
          {selected ? (
            <>
              <div className="chat-head"><span className="avatar">{selected.phone.slice(-2)}</span><div><strong>{selected.name || selected.phone}</strong><small>{selected.phone}</small></div><span className="channel-label">WhatsApp</span></div>
              <div className="message-list">
                {selected.messages.map((message) => (
                  <div key={message.id} className={`message-line ${message.fromMe ? 'mine' : 'theirs'}`}>
                    <div className="bubble"><p>{message.text}</p><time>{message.time}</time></div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="chat-placeholder"><MessageCircle size={42} /><h3>Envie e receba sua primeira mensagem</h3><p>Conecte o WhatsApp e mande uma mensagem de outro celular para começar o teste.</p></div>
          )}
          <form className="composer" onSubmit={sendMessage}>
            <label htmlFor="phone">NÚMERO DE DESTINO (DDI + DDD)</label>
            <input id="phone" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="5511999999999" inputMode="numeric" />
            <div className="send-row"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escreva uma mensagem…" disabled={status !== 'connected'} /><button className="send-button" type="submit" disabled={busy || status !== 'connected' || !draft.trim()}><Send size={16} /> Enviar</button></div>
          </form>
        </section>
      </section>

      <footer className="footer"><span className="footer-dot" />{notice}<small>Protótipo local · Sem disparos em massa</small></footer>
    </main>
  );
}
