import { connect } from '../../lib/mongodb';

export default async function handler(req, res) {
  console.log("API de teste de conexão iniciada");
  
  // Verificar variável de ambiente
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI não configurada");
    return res.status(500).json({
      status: 'error',
      message: 'String de conexão não configurada',
      details: 'A variável de ambiente MONGODB_URI não está definida'
    });
  }
  
  try {
    // Tentar conectar
    console.log("Testando conexão com MongoDB...");
    const { client, db } = await connect();
    
    // Obter informações do servidor
    const serverInfo = await db.admin().serverInfo();
    
    // Listar coleções
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Retornar sucesso com informações
    return res.status(200).json({
      status: 'success',
      message: 'Conexão com MongoDB estabelecida com sucesso!',
      database: db.databaseName,
      collections: collectionNames,
      mongoVersion: serverInfo.version,
      connection_details: {
        uri_provided: true,
        uri_valid: process.env.MONGODB_URI.startsWith('mongodb'),
      }
    });
  } catch (error) {
    console.error("Erro no teste de conexão:", error);
    
    // Detalhar o erro para diagnóstico
    let errorDetails = {
      type: error.name,
      message: error.message,
      code: error.code
    };
    
    // Mensagens comuns para erros específicos
    let errorMessage = 'Falha ao conectar com MongoDB';
    if (error.name === 'MongoServerSelectionError') {
      errorMessage = 'Não foi possível conectar ao servidor MongoDB. Verifique a string de conexão e se o servidor está acessível.';
    } else if (error.message && error.message.includes('authentication failed')) {
      errorMessage = 'Falha na autenticação. Verifique usuário e senha da string de conexão.';
    }
    
    return res.status(500).json({
      status: 'error',
      message: errorMessage,
      details: errorDetails,
      connection_string: {
        exists: !!process.env.MONGODB_URI,
        format_valid: process.env.MONGODB_URI?.startsWith('mongodb'),
        contains_credentials: process.env.MONGODB_URI?.includes('@'),
        approximate_length: process.env.MONGODB_URI?.length
      }
    });
  }
} 