import { getCollection } from '../../lib/mongodb';

export default async function handler(req, res) {
  console.log("API /api/dados iniciada");
  
  try {
    // Obter coleção diretamente
    const collection = await getCollection('leads');
    console.log("Coleção 'leads' obtida com sucesso");

    // Buscar todos os documentos
    const leads = await collection.find({}).toArray();
    console.log(`Encontrados ${leads.length} leads`);

    // Retornar como JSON
    return res.status(200).json(leads);
  } catch (error) {
    console.error("Erro na API /api/dados:", error);
    
    return res.status(500).json({ 
      error: "Erro de conexão com o banco de dados",
      message: error.message
    });
  }
} 