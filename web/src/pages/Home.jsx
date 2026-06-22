import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Play, BarChart3, Users, History } from 'lucide-react';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();

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
      
      <div className={styles.homeWrapper}>
        {/* Seção informativa (no mobile aparece acima, no desktop abaixo) */}
        <section className={styles.infoSection}>
          <h2 className={styles.infoTitle}>Bem-vindo ao PowerSoccer</h2>
          <p className={styles.infoText}>
            O PowerSoccer é a primeira plataforma de análise de desempenho projetada exclusivamente para o futebol em cadeira de rodas motorizada.
          </p>
          <div className={styles.infoSteps}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <p>Cadastre seus atletas no <strong>Elenco</strong> com foto, nome e número da camisa.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <p>Crie uma <strong>Nova Partida</strong> escolhendo os 4 titulares e os 4 reservas.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <p>Durante o jogo, clique no campo para registrar passes, gols, interceptações e finalizações.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>4</span>
              <p>Acesse o <strong>Dashboard</strong> para ver estatísticas, gráficos e o mapa de calor da partida.</p>
            </div>
          </div>
        </section>

        {/* Grid de cards */}
        <div className={styles.homeGrid}>
          {/* ... cards mantidos exatamente iguais ... */}
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
      </div>
    </>
  );
}