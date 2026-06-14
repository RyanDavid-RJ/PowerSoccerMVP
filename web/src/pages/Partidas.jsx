import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { apiGet } from '../services/api';
import toast from 'react-hot-toast';

export default function Partidas() {
  const [partidas, setPartidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const carregarPartidas = async () => {
      try {
        const data = await apiGet('/partidas');
        setPartidas(data);
      } catch (err) {
        console.error("Erro ao buscar partidas:", err);
        toast.error("Erro ao carregar histórico de partidas.");
      } finally {
        setLoading(false);
      }
    };
    carregarPartidas();
  }, []);

  return (
    <>
      <Header showBackButton={true} />
      
      <div className="duo-container config-container">
        <h2>Histórico de <span className="cor-duo">Partidas</span></h2>
        
        {loading ? (
          <p style={{ textAlign: 'center', marginTop: '20px' }}>Carregando histórico...</p>
        ) : (
          <div className="spacing-top">
            {partidas.length === 0 ? (
              <p className="text-center" style={{ color: '#aaa' }}>Nenhuma partida registrada ainda.</p>
            ) : (
              partidas.map(p => (
                <div 
                  key={p.id} 
                  className="partida-card" 
                  onClick={() => navigate(`/scout/${p.id}`)}
                >
                  <div>
                    <strong style={{ fontSize: '18px', color: 'var(--text-main)' }}>vs {p.adversario}</strong>
                    <br/>
                    <small className="form-label">📅 {new Date(p.data_jogo).toLocaleDateString('pt-BR')}</small>
                  </div>
                  <span style={{ fontSize: '24px', color: 'var(--text-main)' }}>▶</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}