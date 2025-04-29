import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("LandingEstilo");
    const collection = db.collection("leads");
    
    // Busca todos os documentos da coleção
    const dados = await collection.find({}).toArray();
    
    // Retorna os dados como JSON
    res.status(200).json(dados);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar dados do banco',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 