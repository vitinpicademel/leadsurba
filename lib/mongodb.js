import { MongoClient } from 'mongodb';

// Verificar se a URI do MongoDB está definida
if (!process.env.MONGODB_URI) {
  throw new Error('A variável de ambiente MONGODB_URI não está configurada');
}

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'LandingEstilo';

// Variáveis para caching da conexão
let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  // Se já temos uma conexão, use-a
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Configurações básicas de conexão
  const opts = {
    // Removi opções obsoletas para evitar warnings
  };

  try {
    // Conectar ao cliente
    let client = await MongoClient.connect(MONGODB_URI, opts);
    let db = client.db(MONGODB_DB);

    // Salvar conexão para reuso
    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('Erro na conexão com MongoDB:', error);
    throw error;
  }
}

// Para compatibilidade com o código existente
const clientPromise = (async () => {
  const { client } = await connectToDatabase();
  return client;
})();

export default clientPromise; 