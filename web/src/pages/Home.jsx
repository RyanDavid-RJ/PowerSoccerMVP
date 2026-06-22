import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Play, BarChart3, Users, History } from 'lucide-react';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();

  // O Segredo da Mágica: Captura a posição do mouse dentro do card
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--x', `${x}px`);
    card.style.setProperty('--y', `${y}px`);
  };

  return (
    <>
      <Header showBackButton={false} />
      
      <div className={styles.homeGrid}>
        
        {/* CARD 1: NOVA PARTIDA */}
        <div className={`duo-container ${styles.cardHome}`} onClick={() => navigate('/nova-partida')} onMouseMove={handleMouseMove}>
          <div className={styles.cardGlow}></div>
          <div className={styles.cardContent}>
            <div className={`${styles.cardIcon} ${styles.iconGreen}`}>
              <Play size={36} fill="currentColor" />
            </div>
            <h2 className={styles.cardTitle}>Nova Partida</h2>
            <p className={styles.cardDesc}>Configurar equipes e iniciar o registro em tempo real</p>
          </div>
        </div>
        
        {/* CARD 2: DASHBOARD */}
        <div className={`duo-container ${styles.cardHome}`} onClick={() => navigate('/dashboard')} onMouseMove={handleMouseMove}>
          <div className={styles.cardGlow}></div>
          <div className={styles.cardContent}>
            <div className={`${styles.cardIcon} ${styles.iconBlue}`}>
              <BarChart3 size={36} />
            </div>
            <h2 className={styles.cardTitle}>Dashboard</h2>
            <p className={styles.cardDesc}>Análise de desempenho tático e mapas de calor</p>
          </div>
        </div>
        
        {/* CARD 3: ELENCO */}
        <div className={`duo-container ${styles.cardHome}`} onClick={() => navigate('/elenco')} onMouseMove={handleMouseMove}>
          <div className={styles.cardGlow}></div>
          <div className={styles.cardContent}>
            <div className={`${styles.cardIcon} ${styles.iconGrena}`}>
              <Users size={36} />
            </div>
            <h2 className={styles.cardTitle}>Elenco</h2>
            <p className={styles.cardDesc}>Gerenciar atletas, numeração e evolução de carreira</p>
          </div>
        </div>
        
        {/* CARD 4: HISTÓRICO */}
        <div className={`duo-container ${styles.cardHome}`} onClick={() => navigate('/partidas')} onMouseMove={handleMouseMove}>
          <div className={styles.cardGlow}></div>
          <div className={styles.cardContent}>
            <div className={`${styles.cardIcon} ${styles.iconOrange}`}>
              <History size={36} />
            </div>
            <h2 className={styles.cardTitle}>Histórico</h2>
            <p className={styles.cardDesc}>Visualizar e exportar relatórios de jogos passados</p>
          </div>
        </div>

      </div>
    </>
  );
}