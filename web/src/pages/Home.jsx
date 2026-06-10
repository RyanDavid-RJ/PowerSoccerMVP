import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function Home() {
  const navigate = useNavigate();

  const handleSettings = () => {
    alert("Modal de configurações será aberto aqui!");
  };

  return (
    <>
      <Header onSettingsClick={handleSettings} showBackButton={false} />
      
      <div className="home-grid">
        <div className="duo-container card-home" onClick={() => navigate('/nova-partida')}>
          <div className="card-icon">
            <span style={{fontSize: '40px'}}>⚽</span>
          </div>
          <h2>Nova Partida</h2><p>Configurar equipes e iniciar registro</p>
        </div>
        
        <div className="duo-container card-home" onClick={() => navigate('/dashboard')}>
          <div className="card-icon">
            <span style={{fontSize: '40px'}}>📊</span>
          </div>
          <h2>Dashboard</h2><p>Estatísticas e análise da equipe</p>
        </div>
        
        <div className="duo-container card-home" onClick={() => navigate('/elenco')}>
          <div className="card-icon">
             <span style={{fontSize: '40px'}}>👥</span>
          </div>
          <h2>Elenco</h2><p>Gerenciar jogadores e fotos</p>
        </div>
        
        <div className="duo-container card-home" onClick={() => navigate('/partidas')}>
          <div className="card-icon">
             <span style={{fontSize: '40px'}}>📝</span>
          </div>
          <h2>Histórico</h2><p>Gerenciar partidas passadas</p>
        </div>
      </div>
    </>
  );
}