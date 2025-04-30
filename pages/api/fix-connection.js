import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // Informações básicas
  const currentUri = process.env.MONGODB_URI || '';
  
  // Resultado do diagnóstico
  const diagnostic = {
    uri_exists: !!currentUri,
    uri_length: currentUri.length,
    is_valid_format: currentUri.startsWith('mongodb'),
    has_credentials: currentUri.includes('@'),
  };
  
  // Verificar a estrutura e tentar corrigir problemas comuns
  let correctedUri = '';
  let fixAttempt = { tried: false, issue: '', action: '' };
  
  if (currentUri) {
    try {
      // Diagnóstico detalhado
      const isAtlas = currentUri.includes('mongodb.net');
      const isSrv = currentUri.includes('+srv');
      
      if (!currentUri.startsWith('mongodb')) {
        fixAttempt = {
          tried: true,
          issue: 'URI não começa com "mongodb"',
          action: 'Formato inválido, não é possível corrigir automaticamente'
        };
      } else if (!currentUri.includes('@')) {
        fixAttempt = {
          tried: true,
          issue: 'URI não contém credenciais (falta o símbolo @)',
          action: 'Formato inválido, verifique se usuário e senha estão presentes'
        };
      } else {
        // Tentar fazer um pequeno teste de conexão com timeout baixo
        try {
          const client = new MongoClient(currentUri, {
            serverSelectionTimeoutMS: 3000,
            connectTimeoutMS: 3000
          });
          
          await client.connect();
          await client.close();
          
          diagnostic.connection_test = "Conexão bem-sucedida com a URI atual";
        } catch (testError) {
          diagnostic.connection_test = `Falha no teste: ${testError.message}`;
          diagnostic.error_name = testError.name;
          diagnostic.error_code = testError.code;
          
          // Vamos tentar identificar problemas específicos
          if (testError.name === 'MongoServerSelectionError') {
            if (isAtlas) {
              fixAttempt = {
                tried: true,
                issue: 'Erro de seleção de servidor com MongoDB Atlas',
                action: 'Verifique se liberou o IP 0.0.0.0/0 em Network Access no Atlas'
              };
            } else {
              fixAttempt = {
                tried: true,
                issue: 'Erro de seleção de servidor',
                action: 'Verifique se o nome do servidor está correto e acessível'
              };
            }
          } else if (testError.message.includes('Authentication failed')) {
            fixAttempt = {
              tried: true,
              issue: 'Falha na autenticação',
              action: 'Verifique se o usuário e senha estão corretos'
            };
          }
        }
      }
      
      // Sugerir uma URI corrigida para MongoDB Atlas
      if (isAtlas) {
        // Extrair as partes
        const [protocol, rest] = currentUri.split('://');
        const parts = rest.split('@');
        
        if (parts.length === 2) {
          const credentials = parts[0];
          const serverPart = parts[1];
          
          // Se parecer um cluster Atlas mas estiver faltando +srv, adicionar
          if (!isSrv && protocol === 'mongodb') {
            correctedUri = `mongodb+srv://${credentials}@${serverPart}`;
            fixAttempt.suggested_fix = "Adicionado +srv que estava faltando para MongoDB Atlas";
          }
        }
      }
    } catch (e) {
      diagnostic.parse_error = e.message;
    }
  }
  
  // Exibir exemplos de strings de conexão válidas
  const examples = {
    atlas: "mongodb+srv://usuário:senha@cluster0.mongodb.net/NomeDoBanco?retryWrites=true&w=majority",
    standalone: "mongodb://usuário:senha@enderecoservidor:27017/NomeDoBanco"
  };
  
  return res.status(200).json({
    diagnostic,
    fix_attempt: fixAttempt,
    corrected_uri: correctedUri || null,
    valid_examples: examples,
    instructions: {
      vercel: "Configure a variável MONGODB_URI em Project Settings > Environment Variables no Vercel",
      atlas: "Certifique-se que liberou o IP 0.0.0.0/0 em Network Access no MongoDB Atlas",
      credentials: "Verifique se o usuário e senha estão corretos e se o usuário tem permissão no banco"
    }
  });
} 