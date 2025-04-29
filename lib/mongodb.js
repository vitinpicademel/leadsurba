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
    client = new MongoClient(uri);
    await client.connect();
    console.log("Conectado ao MongoDB com sucesso");
    
    // Obter referência do banco
    db = client.db(dbName);
    
    return { client, db };
  } catch (err) {
    console.error("Erro na conexão com MongoDB:", err.message);
    throw err;
  }
}

/**
 * Obtém a coleção especificada
 */
export async function getCollection(collectionName) {
  const { db } = await connect();
  return db.collection(collectionName);
}

/**
 * Para compatibilidade com código existente
 */
export default async function clientPromise() {
  const { client } = await connect();
  return client;
} 