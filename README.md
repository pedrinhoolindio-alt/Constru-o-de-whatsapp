# WhatsApp CRM Teste

Protótipo para validar uma conexão de um único WhatsApp via QR Code, receber mensagens e responder pela interface.

## Requisitos
- Node.js 20+
- npm
- Número separado para testes

## Execução local
1. Clone o repositório e selecione a branch `whatsapp-crm-mvp`.
2. Instale dependências: `npm install`.
3. Crie `.env` com `HOST=127.0.0.1` e `PORT=3000`.
4. Inicie: `npm run dev`.
5. Abra `http://127.0.0.1:3000`.
6. Clique em Conectar WhatsApp e escaneie o QR pelo menu Aparelhos conectados.
7. Envie mensagem de outro telefone e responda pela interface.

## O que está implementado
- Sessão Baileys com QR Code.
- Eventos de conexão e reconexão.
- Recebimento de mensagens de texto.
- Envio de mensagens para número com DDI e DDD.
- Interface em tempo real com Socket.IO.
- Conversas em memória durante a execução.

## Limitações
- Protótipo de uma sessão.
- Histórico é perdido ao reiniciar o servidor.
- Conteúdo de mídia ainda não é baixado.
- Sem login ou controle de usuários.
- Servidor de teste: não publicar nem compartilhar publicamente.

Credenciais são salvas em `.baileys_auth/`, ignorada pelo Git. Nunca compartilhe essa pasta.

Baileys é uma biblioteca comunitária não oficial, não afiliada ou aprovada pela WhatsApp/Meta. O uso pode sofrer desconexões ou restrições. Use número de teste e respeite os termos aplicáveis.
