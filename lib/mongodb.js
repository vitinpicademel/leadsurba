import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Por favor, defina a variável de ambiente MONGODB_URI');
}

const uri = process.env.MONGODB_URI;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // Em desenvolvimento, use uma variável global para preservar o valor
  // entre recarregamentos causados pelo Hot Reloading
  let globalWithMongo = global;

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect()
      .catch(err => {
        console.error('Erro ao conectar ao MongoDB:', {
          error: err.message,
          code: err.code,
          uri: uri.replace(/:[^:/@]+@/, ':****@') // Oculta a senha no log
        });
        throw err;
      });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // Em produção, é melhor não usar uma variável global
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .catch(err => {
      console.error('Erro ao conectar ao MongoDB:', {
        error: err.message,
        code: err.code,
        uri: uri.replace(/:[^:/@]+@/, ':****@') // Oculta a senha no log
      });
      throw err;
    });
}

export default clientPromise; 