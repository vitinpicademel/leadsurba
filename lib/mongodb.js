import { MongoClient } from 'mongodb';

// Configurações básicas
const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB || 'LandingEstilo';

// Singleton para conexão
let client = null;
let db = null;

/**
 * Conecta ao MongoDB
 */
export async function connect() {
  if (!uri) {
    throw new Error("String de conexão (MONGODB_URI) não configurada");
  }

  try {
    // Se já está conectado, retorne a conexão existente
    if (client && db) {
      return { client, db };
    }

    // Conectar
    console.log("Iniciando conexão com MongoDB...");
    client = new MongoClient(uri, {
      // Opções mínimas para evitar problemas
      serverSelectionTimeoutMS: 5000
    });
    await client.connect();
    console.log("Conectado ao MongoDB com sucesso");
    
    // Obter referência do banco
    db = client.db(dbName);
    
    return { client, db };
  } catch (err) {
    console.error("Erro na conexão com MongoDB:", err.message, err.stack);
    
    // Criar um erro mais legível e com informações úteis
    let errorMessage = "Falha na conexão com MongoDB";
    
    if (err.name === "MongoServerSelectionError") {
      errorMessage = "Não foi possível conectar ao servidor MongoDB. Verifique se o endereço do servidor e a rede estão corretos.";
    } else if (err.name === "MongoError" && err.message.includes("Authentication failed")) {
      errorMessage = "Falha na autenticação. Verifique usuário e senha.";
    } else if (err.name === "MongoError" && err.message.includes("not authorized")) {
      errorMessage = "Usuário não autorizado para acessar o banco de dados.";
    } else {
      errorMessage = `Erro ao conectar com MongoDB: ${err.message}`;
    }
    
    const formattedError = new Error(errorMessage);
    formattedError.originalError = {
      name: err.name,
      code: err.code,
      message: err.message
    };
    
    throw formattedError;
  }
}

/**
 * Obtém a coleção especificada
 */
export async function getCollection(collectionName) {
  try {
    const { db } = await connect();
    return db.collection(collectionName);
  } catch (err) {
    console.error(`Erro ao obter coleção ${collectionName}:`, err);
    throw err;
  }
}

/**
 * Para compatibilidade com código existente
 */
export default async function clientPromise() {
  try {
    const { client } = await connect();
    return client;
  } catch (err) {
    console.error("Erro ao obter client promise:", err);
    throw err;
  }
} 