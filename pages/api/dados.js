import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  try {
    console.log('Iniciando conexão com o banco de dados...');
    const { db } = await connectToDatabase();
    console.log('Conexão estabelecida com sucesso');
    
    // Buscar documentos da coleção (com tratamento de erro)
    try {
      const collection = db.collection('leads');
      const leads = await collection.find({}).toArray();
      console.log(`Encontrados ${leads.length} leads no banco de dados`);
      
      // Retornar dados como JSON
      res.status(200).json(leads);
    } catch (collectionError) {
      console.error('Erro ao acessar coleção:', collectionError);
      res.status(500).json({
        error: 'Erro ao acessar a coleção',
        details: collectionError.message
      });
    }
  } catch (error) {
    console.error('Erro na conexão:', error);
    res.status(500).json({
      error: 'Erro de conexão com o banco de dados',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 