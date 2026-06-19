import { useLocation, useNavigate } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const abrirConfiguracoes = () => {
    window.dispatchEvent(new CustomEvent('open-settings'));
  };

  const navegar = (rota) => {
    if (rota === 'ajustes') {
      abrirConfiguracoes();
    } else {
      navigate(rota);
    }
  };

  // Se estiver na tela de login, esconde a barra inferior
  if (location.pathname === '/login') {
    return null;
  }

  const pathname = location.pathname;

  // Mapeamento de rotas para ícones e nomes
  const rotaInfo = {
    '/nova-partida': { icon: '⚽', nome: 'Partida' },
    '/dashboard': { icon: '📊', nome: 'Dashboard' },
    '/elenco': { icon: '👥', nome: 'Elenco' },
    '/partidas': { icon: '📝', nome: 'Partidas' },
    '/scout': { icon: '🏟️', nome: 'Scout' }, // pega qualquer rota que comece com /scout
  };

  // Determina se está na home
  const isHome = pathname === '/';

  // Determina a rota ativa (para exibir no centro)
  let rotaAtiva = null;
  for (const [rota, info] of Object.entries(rotaInfo)) {
    if (pathname === rota || (rota === '/scout' && pathname.startsWith('/scout'))) {
      rotaAtiva = { rota, ...info };
      break;
    }
  }

  // Se estiver na Home, mostra apenas 2 botões
  if (isHome) {
    return (
      <div className="bottom-nav">
        <button
          className="nav-item ativo"
          onClick={() => navegar('/')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Início</span>
        </button>

        <button
          className="nav-item"
          onClick={abrirConfiguracoes}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          <span>Ajustes</span>
        </button>
      </div>
    );
  }

  // Se não estiver na Home, mostra 3 botões: Início, Página Ativa, Ajustes
  return (
    <div className="bottom-nav">
      <button
        className="nav-item"
        onClick={() => navegar('/')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Início</span>
      </button>

      {rotaAtiva && (
        <button
          className="nav-item ativo"
          onClick={() => navegar(rotaAtiva.rota)}
        >
          <span style={{ fontSize: '24px' }}>{rotaAtiva.icon}</span>
          <span>{rotaAtiva.nome}</span>
        </button>
      )}

      <button
        className="nav-item"
        onClick={abrirConfiguracoes}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
        <span>Ajustes</span>
      </button>
    </div>
  );
}