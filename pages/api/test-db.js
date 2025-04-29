import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  try {
    // Tenta conectar ao MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Lista todas as coleções
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Retorna sucesso com informações úteis
    res.status(200).json({
      status: 'success',
      message: 'Conexão com MongoDB estabelecida com sucesso!',
      database: db.databaseName,
      collections: collectionNames,
      connectionInfo: {
        host: client.options.srvHost,
        readPreference: client.readPreference.mode,
      }
    });
  } catch (error) {
    console.error('Erro ao conectar com MongoDB:', error);
    res.status(500).json({
      status: 'error',
      message: 'Falha ao conectar com MongoDB',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 