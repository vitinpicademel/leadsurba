# Sistema de Leads Urba

Sistema de gerenciamento de leads em tempo real com notificações automáticas.

## Funcionalidades

- Visualização de leads em tempo real
- Notificações sonoras e visuais para novos leads
- Envio automático de e-mail para cada novo lead
- Interface responsiva e moderna
- Conexão com MongoDB Atlas
- WebSocket para atualizações em tempo real

## Tecnologias

- Node.js
- Express
- MongoDB
- Socket.IO
- Nodemailer
- Bootstrap

## Variáveis de Ambiente

Crie um arquivo `.env` com as seguintes variáveis:

```env
MONGODB_URI=sua_string_de_conexao_mongodb
PORT=3000
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app
EMAIL_DESTINO=email_destino@exemplo.com
```

## Instalação

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Rodar em produção
npm start
```

## Deploy

O projeto está configurado para deploy na Vercel com as seguintes configurações:

1. Configurar variáveis de ambiente na Vercel
2. Conectar com o repositório GitHub
3. Deploy automático a cada push na branch main 