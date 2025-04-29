require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const nodemailer = require('nodemailer');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();

// Configurar CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["my-custom-header", "content-type"]
  },
  transports: ['websocket', 'polling'],
  path: '/socket.io',
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8,
  connectTimeout: 45000,
  handlePreflightRequest: (req, res) => {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST",
      "Access-Control-Allow-Headers": "my-custom-header,content-type",
      "Access-Control-Allow-Credentials": true
    });
    res.end();
  }
});

// Middleware para processar JSON
app.use(express.json());

// Configurar middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('Conectado ao MongoDB'))
.catch((error) => console.error('Erro ao conectar ao MongoDB:', error));

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true, // Ativa logs detalhados
  logger: true // Ativa logger
});

// Verificar conexão do email
transporter.verify(function(error, success) {
  if (error) {
    console.error('Erro na configuração do email:', error);
  } else {
    console.log('Servidor de email pronto para enviar mensagens');
  }
});

// Middleware para logging detalhado do Socket.IO
io.engine.on("connection_error", (err) => {
  console.log("Erro de conexão no engine:", err);
});

io.engine.on("headers", (headers, req) => {
  console.log("Headers do engine:", headers);
});

// Adicionar middleware de logging para Socket.IO
io.use((socket, next) => {
  console.log('Nova tentativa de conexão Socket.IO:', {
    id: socket.id,
    handshake: {
      headers: socket.handshake.headers,
      query: socket.handshake.query,
      auth: socket.handshake.auth
    },
    transport: socket.conn?.transport?.name
  });
  next();
});

// Socket.IO - Conexão
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', {
    id: socket.id,
    transport: socket.conn.transport.name,
    remoteAddress: socket.handshake.address
  });
  
  socket.on('error', (error) => {
    console.error('Erro no Socket:', error);
  });

  socket.on('connect_error', (error) => {
    console.error('Erro de conexão:', error);
  });
  
  // Enviar dados existentes quando um cliente se conecta
  socket.on('requestInitialData', async () => {
    try {
      console.log('Solicitação de dados iniciais recebida de:', socket.id);
      const db = mongoose.connection.db;
      const collection = db.collection('leads');
      const dados = await collection.find({}).toArray();
      console.log('Enviando dados iniciais para:', socket.id, 'Total de registros:', dados.length);
      socket.emit('initialData', dados);
    } catch (error) {
      console.error('Erro ao enviar dados iniciais:', error);
      socket.emit('error', { 
        message: 'Erro ao carregar dados iniciais',
        details: error.message 
      });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Cliente desconectado:', {
      id: socket.id,
      reason: reason,
      wasConnected: socket.connected
    });
  });
});

// Função para enviar email
async function enviarEmailNotificacao(lead) {
  console.log('Iniciando envio de email para:', process.env.EMAIL_DESTINO);
  const dataFormatada = new Date(lead.dataEnvio).toLocaleString('pt-BR');
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_DESTINO,
    subject: 'Novo Lead Recebido - Formulário Urba',
    html: `
      <h2>Novo Lead Recebido!</h2>
      <p><strong>Nome:</strong> ${lead.nome}</p>
      <p><strong>WhatsApp:</strong> ${lead.whatsapp}</p>
      <p><strong>E-mail:</strong> ${lead.email}</p>
      <p><strong>Parcelas:</strong> ${lead.parcelas}</p>
      <p><strong>Data de Envio:</strong> ${dataFormatada}</p>
    `
  };

  try {
    console.log('Tentando enviar email com as configurações:', {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_DESTINO
    });
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado com sucesso! ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Erro detalhado ao enviar email:', error);
    return false;
  }
}

// Rota básica de teste
app.get('/', (req, res) => {
  res.json({ mensagem: 'API REST funcionando!' });
});

// Rota para obter todos os dados
app.get('/api/dados', async (req, res) => {
  try {
    console.log('Recebida requisição para /api/dados');
    const db = mongoose.connection.db;
    console.log('Banco de dados conectado:', db.databaseName);
    const collection = db.collection('leads');
    console.log('Buscando documentos na coleção leads...');
    const dados = await collection.find({}).toArray();
    console.log('Documentos encontrados:', dados.length);
    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', detalhes: error.message });
  }
});

// Rota para receber novos leads
app.post('/api/leads', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('leads');
    const novoLead = {
      ...req.body,
      dataEnvio: new Date()
    };
    
    const resultado = await collection.insertOne(novoLead);
    console.log('Lead salvo no banco de dados, tentando enviar email...');
    
    // Enviar email de notificação
    const emailEnviado = await enviarEmailNotificacao(novoLead);
    
    // Buscar o lead completo com o _id
    const leadCompleto = await collection.findOne({ _id: resultado.insertedId });
    
    // Notificar todos os clientes conectados via Socket.IO
    io.emit('novoLead', leadCompleto);
    
    res.status(201).json({ 
      message: 'Lead registrado com sucesso!',
      emailEnviado: emailEnviado,
      lead: leadCompleto
    });
  } catch (error) {
    console.error('Erro ao registrar lead:', error);
    res.status(500).json({ error: 'Erro ao registrar lead' });
  }
});

// Rota principal - deve vir depois das outras rotas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor (usando server ao invés de app para suportar Socket.IO)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 