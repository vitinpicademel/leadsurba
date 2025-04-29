export default async function handler(req, res) {
  // Verificar a existência da variável de ambiente
  const hasEnvVar = !!process.env.MONGODB_URI;
  
  // Verificar o formato da string de conexão (mantendo a segurança)
  let uriAnalysis = {
    exists: hasEnvVar,
    length: hasEnvVar ? process.env.MONGODB_URI.length : 0,
    starts_with_mongodb: hasEnvVar ? process.env.MONGODB_URI.startsWith('mongodb') : false,
    contains_at_symbol: hasEnvVar ? process.env.MONGODB_URI.includes('@') : false,
    contains_question: hasEnvVar ? process.env.MONGODB_URI.includes('?') : false,
  };
  
  // Se tiver a URI, verificar mais detalhes
  if (hasEnvVar) {
    const uri = process.env.MONGODB_URI;
    try {
      // Verifica a estrutura da string
      const parts = uri.split('://');
      const protocol = parts[0];
      
      let credentials = null;
      let host = null;
      let params = null;
      
      if (parts.length > 1) {
        const restParts = parts[1].split('@');
        
        if (restParts.length > 1) {
          credentials = restParts[0];
          const remainingPart = restParts[1];
          
          const hostAndParams = remainingPart.split('?');
          host = hostAndParams[0];
          
          if (hostAndParams.length > 1) {
            params = hostAndParams[1];
          }
        } else {
          // Sem credenciais
          const hostAndParams = restParts[0].split('?');
          host = hostAndParams[0];
          
          if (hostAndParams.length > 1) {
            params = hostAndParams[1];
          }
        }
      }
      
      // Mascar a senha mas manter a estrutura para diagnóstico
      let maskedUri = uri;
      if (credentials) {
        const userPass = credentials.split(':');
        if (userPass.length > 1) {
          // Manter o usuário mas mascarar a senha
          maskedUri = uri.replace(credentials, `${userPass[0]}:********`);
        }
      }
      
      uriAnalysis.structure = {
        protocol,
        has_credentials: !!credentials,
        username: credentials ? credentials.split(':')[0] : null,
        has_password: credentials ? credentials.includes(':') : false,
        host: host,
        has_params: !!params,
        masked_uri: maskedUri
      };
    } catch (e) {
      uriAnalysis.parse_error = "Erro ao analisar a string de conexão";
    }
  }
  
  // Verificar outras variáveis de ambiente relacionadas a MongoDB
  const mongoEnvVars = {};
  for (const key in process.env) {
    if (key.includes('MONGO') || key.includes('DB_') || key.includes('DATABASE')) {
      mongoEnvVars[key] = key.includes('PASSWORD') || key.includes('PASS') ? 
        '********' : // Mascarar senhas
        key === 'MONGODB_URI' ? '[URI OCULTA]' : process.env[key];
    }
  }

  // Testar um módulo mongodb básico
  let mongoModuleTest = "Módulo não testado";
  try {
    const { MongoClient } = require('mongodb');
    mongoModuleTest = "Módulo importado com sucesso";
  } catch (e) {
    mongoModuleTest = `Erro ao importar módulo: ${e.message}`;
  }
  
  // Retornar todas as informações de diagnóstico
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV,
    uri_analysis: uriAnalysis,
    environment_variables: {
      total_count: Object.keys(process.env).length,
      mongo_related: mongoEnvVars
    },
    mongo_module: mongoModuleTest,
    vercel_region: process.env.VERCEL_REGION || 'desconhecida',
    runtime_info: {
      platform: process.platform,
      nodejs_version: process.version,
    }
  });
} 