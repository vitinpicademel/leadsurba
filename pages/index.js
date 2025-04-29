import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/dados');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro ${response.status}`);
        }
        
        const data = await response.json();
        setLeads(data);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  function formatarData(dataISO) {
    if (!dataISO) return '';
    const data = new Date(dataISO);
    if (isNaN(data.getTime())) return dataISO;
    
    const dia = data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const hora = data.toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <div className="data-destaque">
        <span className="data-dia">{dia}</span>
        <span className="data-hora">{hora}</span>
      </div>
    );
  }

  return (
    <div className="container">
      <Head>
        <title>Leads dos formulários Urba</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
      </Head>

      <div className="card-custom">
        <h1>Leads dos formulários Urba</h1>
        {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="mt-3">Carregando dados...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Erro!</h4>
            <p>{error}</p>
            <hr />
            <p className="mb-0">Verifique sua conexão ou tente novamente mais tarde.</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="alert alert-info" role="alert">
            Nenhum lead encontrado.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>WhatsApp</th>
                  <th>E-mail</th>
                  <th>Parcelas</th>
                  <th className="data-header">Data de Envio</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, index) => (
                  <tr key={index}>
                    <td>{lead.nome}</td>
                    <td>{lead.whatsapp}</td>
                    <td>{lead.email}</td>
                    <td>{lead.parcelas}</td>
                    <td className="data-cell">{formatarData(lead.dataEnvio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        body {
          background: linear-gradient(120deg, #f8fafc 0%, #e2eafc 100%);
          min-height: 100vh;
          font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
        }
        .container {
          margin-top: 3rem;
          margin-bottom: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .card-custom {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
          padding: 2.5rem 2rem 2rem 2rem;
          max-width: 1100px;
          width: 100%;
        }
        h1 {
          text-align: center;
          margin-bottom: 2.5rem;
          font-weight: 800;
          letter-spacing: 1px;
          color: #22223b;
        }
        .table-responsive {
          border-radius: 12px;
          overflow: hidden;
        }
        table {
          margin-bottom: 0;
          width: 100%;
        }
        th {
          background: #22223b;
          color: #fff;
          font-weight: 600;
          font-size: 1.08rem;
          letter-spacing: 0.5px;
          border: none;
          padding: 1rem;
          white-space: nowrap;
        }
        tr {
          transition: background 0.2s;
        }
        tr:hover {
          background: #e9ecef !important;
        }
        td {
          background: #fff;
          font-size: 1rem;
          color: #22223b;
          border: none;
          padding: 1rem;
          vertical-align: middle;
        }
        .data-cell {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #2b2d42;
          padding: 0.5rem;
        }
        .data-header {
          background-color: #2b2d42 !important;
        }
        .data-destaque {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.4;
          padding: 0.3rem 0;
        }
        .data-dia {
          font-size: 1.1rem;
          color: #2b2d42;
          font-weight: 700;
        }
        .data-hora {
          font-size: 0.9rem;
          color: #6c757d;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
} 