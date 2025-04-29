require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();

// Configurar CORS
app.use(cors());

// Middleware para processar JSON
app.use(express.json());

// Variável global para armazenar a conexão
let mongoConnection = null;

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('String de conexão do MongoDB não encontrada nas variáveis de ambiente');
    }

    console.log('Tentando conectar ao MongoDB...');
    console.log('String de conexão:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@')); // Log seguro da string de conexão

    if (mongoConnection === null) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000
      });
      
      mongoConnection = mongoose.connection;
      console.log('Conectado ao MongoDB Atlas com sucesso!');
      console.log('Nome do banco de dados:', mongoose.connection.db.databaseName);
      console.log('Estado da conexão:', mongoose.connection.readyState);
      
      mongoConnection.on('error', (err) => {
        console.error('Erro na conexão MongoDB:', err);
        mongoConnection = null;
      });
      
      mongoConnection.on('disconnected', () => {
        console.log('MongoDB desconectado');
        mongoConnection = null;
      });
    }

    return mongoConnection;
  } catch (error) {
    console.error('Erro detalhado ao conectar ao MongoDB:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    mongoConnection = null;
    throw error;
  }
};

// Middleware para garantir conexão com MongoDB
const ensureDbConnected = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
    res.status(500).json({ error: 'Erro de conexão com o banco de dados' });
  }
};

// Criar router específico para API
const apiRouter = express.Router();

// Rota básica de teste
apiRouter.get('/test', (req, res) => {
  res.json({ status: 'API funcionando!' });
});

// Rota para obter todos os dados
apiRouter.get('/dados', ensureDbConnected, async (req, res) => {
  try {
    console.log('Buscando dados do MongoDB...');
    const collection = mongoose.connection.db.collection('leads');
    const dados = await collection.find({}).toArray();
    console.log(`Encontrados ${dados.length} registros`);
    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar dados',
      details: error.message 
    });
  }
});

// Rota para receber novos leads
apiRouter.post('/leads', ensureDbConnected, async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('leads');
    const novoLead = {
      ...req.body,
      dataEnvio: new Date()
    };
    
    const resultado = await collection.insertOne(novoLead);
    const leadCompleto = await collection.findOne({ _id: resultado.insertedId });
    
    // Notificar via Socket.IO
    io.emit('novoLead', leadCompleto);
    
    res.status(201).json({ 
      message: 'Lead registrado com sucesso!',
      lead: leadCompleto
    });
  } catch (error) {
    console.error('Erro ao registrar lead:', error);
    res.status(500).json({ error: 'Erro ao registrar lead' });
  }
});

// Rota de teste para conexão MongoDB
apiRouter.get('/test-db', async (req, res) => {
  try {
    console.log('Testando conexão com MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não está configurada');
    }

    console.log('URI do MongoDB configurada:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@'));
    
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    const dbName = connection.connection.db.databaseName;
    const collections = await connection.connection.db.listCollections().toArray();
    const connectionState = mongoose.connection.readyState;
    const stateMap = {
      0: 'desconectado',
      1: 'conectado',
      2: 'conectando',
      3: 'desconectando'
    };

    res.json({
      status: 'success',
      message: 'Conexão com MongoDB estabelecida com sucesso',
      database: dbName,
      collections: collections.map(c => c.name),
      connectionState: `${connectionState} (${stateMap[connectionState]})`,
      version: mongoose.version
    });

  } catch (error) {
    console.error('Erro no teste de conexão:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao conectar com MongoDB',
      error: {
        message: error.message,
        code: error.code,
        name: error.name
      },
      mongodbUri: process.env.MONGODB_URI ? 'Configurada' : 'Não configurada'
    });
  }
});

// Montar o router da API antes dos middlewares estáticos
app.use('/api', apiRouter);

// Configurar middleware para servir arquivos estáticos DEPOIS das rotas da API
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Socket.IO - Conexão
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);
  
  socket.on('requestInitialData', async () => {
    try {
      await connectDB();
      const collection = mongoose.connection.db.collection('leads');
      const dados = await collection.find({}).toArray();
      console.log(`Enviando ${dados.length} registros para o cliente ${socket.id}`);
      socket.emit('initialData', dados);
    } catch (error) {
      console.error('Erro ao enviar dados iniciais:', error);
      socket.emit('error', { message: 'Erro ao carregar dados iniciais' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Rota para servir o frontend (deve ser a última rota)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;

// Conectar ao MongoDB antes de iniciar o servidor
connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Falha ao iniciar o servidor:', err);
});

// Exportar para Vercel
module.exports = server; 