import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
// Importando o CSS Module exclusivo desta página
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();

  const handleSettings = () => {
    alert("Modal de configurações será aberto aqui!");
  };

  return (
    <>
      <Header onSettingsClick={handleSettings} showBackButton={false} />
      
      <div className={styles.homeGrid}>
        {/* Usamos a classe global 'duo-container' junto com a classe modular 'cardHome' */}
        <div className={`duo-container ${styles.cardHome}`} onClick={() => navigate('/nova-partida')}>
          <div className={styles.cardIcon}>
            <span>⚽</span>
          </div>
          <h2 className={styles.cardTitle}>Nova Partida</h2>
          <p className={styles.cardDesc}>Configurar equipes e iniciar registro</p>
        </div>
        
        <div className={`duo-container ${styles.cardHome}`} onClick={() => navigate('/dashboard')}>
          <div className={styles.cardIcon}>
            <span>📊</span>
          </div>
          <h2 className={styles.cardTitle}>Dashboard</h2>
          <p className={styles.cardDesc}>Estatísticas e análise da equipe</p>
        </div>
        
        <div className={`duo-container ${styles.cardHome}`} onClick={() => navigate('/elenco')}>
          <div className={styles.cardIcon}>
             <span>👥</span>
          </div>
          <h2 className={styles.cardTitle}>Elenco</h2>
          <p className={styles.cardDesc}>Gerenciar jogadores e fotos</p>
        </div>
        
        <div className={`duo-container ${styles.cardHome}`} onClick={() => navigate('/partidas')}>
          <div className={styles.cardIcon}>
             <span>📝</span>
          </div>
          <h2 className={styles.cardTitle}>Histórico</h2>
          <p className={styles.cardDesc}>Gerenciar partidas passadas</p>
        </div>
      </div>
    </>
  );
}