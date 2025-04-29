import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Por favor, defina a variável de ambiente MONGODB_URI');
}

const uri = process.env.MONGODB_URI;
const options = {
  maxIdleTimeMS: 60000, // Tempo máximo de conexão ociosa
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // Em desenvolvimento, use uma variável global para preservar o valor
  // entre recarregamentos causados pelo Hot Reloading
  let globalWithMongo = global;

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // Em produção, é melhor não usar uma variável global
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise; 