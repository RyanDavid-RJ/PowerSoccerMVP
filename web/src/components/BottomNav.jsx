import { useLocation, useNavigate } from 'react-router-dom';
import { Play, BarChart3, Users, History, Settings, Home } from 'lucide-react';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const abrirConfiguracoes = () => {
    window.dispatchEvent(new CustomEvent('open-settings'));
  };

  if (location.pathname === '/login') {
    return null;
  }

  const pathname = location.pathname;

  // Mapeamento dos ícones para o menu inferior
  const menuItens = [
    { rota: '/', nome: 'Início', icon: <Home size={22} /> },
    { rota: '/nova-partida', nome: 'Partida', icon: <Play size={22} fill="currentColor" />, rotaAlternativa: '/scout' },
    { rota: '/dashboard', nome: 'Dashboard', icon: <BarChart3 size={22} /> },
    { rota: '/elenco', nome: 'Elenco', icon: <Users size={22} /> },
    { rota: '/partidas', nome: 'Partidas', icon: <History size={22} /> },
  ];

  const verificarAtivo = (item) => {
    if (pathname === item.rota) return true;
    if (item.rotaAlternativa && pathname.startsWith(item.rotaAlternativa)) return true;
    return false;
  };

  return (
    <div className={styles.bottomNav}>
      {menuItens.map((item) => (
        <button
          key={item.rota}
          className={`${styles.navItem} ${verificarAtivo(item) ? styles.navItemAtivo : ''}`}
          onClick={() => navigate(item.rota)}
        >
          {item.icon}
          <span>{item.nome}</span>
        </button>
      ))}

      <button className={styles.navItem} onClick={abrirConfiguracoes}>
        <Settings size={22} />
        <span>Ajustes</span>
      </button>
    </div>
  );
}