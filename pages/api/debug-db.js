import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // Verificar se a variável de ambiente existe
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({
      status: 'error',
      message: 'MONGODB_URI não configurada',
      env: Object.keys(process.env).filter(key => key.includes('MONGO') || key.includes('DB'))
    });
  }

  // Tentar se conectar diretamente sem usar clientPromise
  const uri = process.env.MONGODB_URI;
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  };

  try {
    console.log('Tentando conectar com:', uri.replace(/:[^:/@]+@/, ':****@')); // Oculta a senha
    
    const client = new MongoClient(uri, options);
    await client.connect();
    
    // Verificar se conseguimos listar os bancos de dados
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    
    // Verificar se o banco LandingEstilo existe
    const dbNames = dbs.databases.map(db => db.name);
    const targetDb = client.db("LandingEstilo");
    
    // Tentar listar as coleções
    const collections = await targetDb.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Fechar a conexão
    await client.close();
    
    return res.status(200).json({
      status: 'success',
      message: 'Conexão com MongoDB estabelecida com sucesso!',
      databases: dbNames,
      collections: collectionNames,
      uri_structure: {
        protocol: uri.split('://')[0],
        hasCredentials: uri.includes('@'),
        hasDatabaseName: uri.includes('?') && uri.split('?')[0].includes('/'),
        hasOptions: uri.includes('?')
      }
    });
    
  } catch (error) {
    console.error('Erro detalhado:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Falha ao conectar com MongoDB',
      error: error.message,
      code: error.code,
      name: error.name,
      driver: error.driver ? true : false,
      uri_provided: !!uri,
      uri_structure: uri ? {
        protocol: uri.split('://')[0],
        hasCredentials: uri.includes('@'),
        hasDatabaseName: uri.includes('?') && uri.split('?')[0].includes('/'),
        hasOptions: uri.includes('?')
      } : null
    });
  }
} 