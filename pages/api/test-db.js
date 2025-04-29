import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  // Verificar se a variável de ambiente existe
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({
      status: 'error',
      message: 'MONGODB_URI não configurada',
      env_vars: Object.keys(process.env).filter(key => key.includes('MONGO') || key.includes('DB')).length
    });
  }

  try {
    console.log('Testando conexão com MongoDB...');
    
    // Tentar conectar usando nossa função de conexão
    const { client, db } = await connectToDatabase();
    
    // Testar listagem de coleções
    console.log('Listando coleções...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Verificar detalhes de conexão
    const dbName = db.databaseName;
    
    // Retornar sucesso
    res.status(200).json({
      status: 'success',
      message: 'Conexão com MongoDB estabelecida com sucesso!',
      database: dbName,
      collections: collectionNames,
      connection_details: {
        uri_exists: !!process.env.MONGODB_URI,
        uri_length: process.env.MONGODB_URI.length,
        uri_valid: process.env.MONGODB_URI.startsWith('mongodb'),
        uri_has_credentials: process.env.MONGODB_URI.includes('@'),
      }
    });
  } catch (error) {
    console.error('Erro no teste de conexão:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Falha ao conectar com MongoDB',
      error: error.message,
      code: error.code,
      name: error.name,
      connection_details: {
        uri_exists: !!process.env.MONGODB_URI,
        uri_length: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
        uri_valid: process.env.MONGODB_URI ? process.env.MONGODB_URI.startsWith('mongodb') : false,
        uri_has_credentials: process.env.MONGODB_URI ? process.env.MONGODB_URI.includes('@') : false,
      }
    });
  }
} 