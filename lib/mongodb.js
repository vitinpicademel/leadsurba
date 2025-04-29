import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Por favor, defina a variável de ambiente MONGODB_URI');
}

const uri = process.env.MONGODB_URI;

// Remova as opções obsoletas e simplifique
const options = {
  serverSelectionTimeoutMS: 5000,
};

let client;
let clientPromise;

// Simplificar a lógica de conexão para menos problemas
if (process.env.NODE_ENV === 'development') {
  // Em desenvolvimento, use uma variável global
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // Em produção, criar uma nova conexão
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise; 