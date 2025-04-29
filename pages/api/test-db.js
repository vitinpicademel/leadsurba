import { connect } from '../../lib/mongodb';

export default async function handler(req, res) {
  console.log("API de teste de conexão iniciada");
  
  // Verificar variável de ambiente
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI não configurada");
    return res.status(500).json({
      status: 'error',
      message: 'String de conexão não configurada',
      details: 'A variável de ambiente MONGODB_URI não está definida',
      suggestion: 'Configure a variável MONGODB_URI no painel do Vercel (Settings > Environment Variables)'
    });
  }
  
  try {
    // Tentar conectar
    console.log("Testando conexão com MongoDB...");
    const { client, db } = await connect();
    
    // Obter informações do servidor
    const serverInfo = await db.admin().serverInfo().catch(err => ({ 
      version: 'Desconhecida',
      error: err.message 
    }));
    
    // Listar coleções
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Retornar sucesso com informações
    return res.status(200).json({
      status: 'success',
      message: 'Conexão com MongoDB estabelecida com sucesso!',
      database: db.databaseName,
      collections: collectionNames,
      mongoVersion: serverInfo.version || 'Desconhecida',
      connection_details: {
        uri_provided: true,
        uri_valid: process.env.MONGODB_URI.startsWith('mongodb'),
        connection_type: process.env.MONGODB_URI.includes('srv') ? 'DNS SRV' : 'Padrão'
      }
    });
  } catch (error) {
    console.error("Erro no teste de conexão:", error);
    
    // Preparar mensagem de erro mais amigável
    let errorMessage = error.message || 'Falha ao conectar com MongoDB';
    let errorDetails = {};
    
    // Verificar o tipo de erro para mensagens específicas
    if (error.originalError) {
      errorDetails = {
        type: error.originalError.name,
        code: error.originalError.code,
        original_message: error.originalError.message
      };
    } else {
      errorDetails = {
        type: error.name,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      };
    }
    
    // Sugestões baseadas no tipo de erro
    let suggestion = 'Verifique se a string de conexão está correta.';
    
    if (errorMessage.includes('Authentication failed')) {
      suggestion = 'Verifique se o usuário e senha estão corretos.';
    } else if (errorMessage.includes('timed out') || errorMessage.includes('ServerSelection')) {
      suggestion = 'Verifique se o endereço do servidor está correto e se o IP está liberado no MongoDB Atlas.';
    }
    
    return res.status(500).json({
      status: 'error',
      message: errorMessage,
      details: errorDetails,
      suggestion: suggestion,
      connection_string: {
        exists: true,
        format_valid: process.env.MONGODB_URI?.startsWith('mongodb'),
        contains_credentials: process.env.MONGODB_URI?.includes('@'),
        approximate_length: process.env.MONGODB_URI?.length
      }
    });
  }
} 