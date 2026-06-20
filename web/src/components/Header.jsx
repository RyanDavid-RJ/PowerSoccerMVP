import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

export default function Header({ showBackButton }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const userName = usuario.nome || 'Treinador';
  const [modalTemaAberto, setModalTemaAberto] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair do sistema?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      navigate('/login');
    }
  };

  const aplicarTema = (tema) => {
    document.body.classList.remove('light-mode', 'daltonico-mode');
    if (tema === 'light-mode') {
      document.body.classList.add('light-mode');
      localStorage.setItem('ps_theme', 'light-mode');
    } else if (tema === 'daltonico-mode') {
      document.body.classList.add('daltonico-mode');
      localStorage.setItem('ps_theme', 'daltonico-mode');
    } else {
      localStorage.setItem('ps_theme', 'dark');
    }
    setModalTemaAberto(false);
  };

  const aplicarModo = (modo) => {
    if (modo === 'mobile') {
      document.body.classList.add('modo-mobile');
      localStorage.setItem('ps_layout_mode', 'mobile');
    } else {
      document.body.classList.remove('modo-mobile');
      localStorage.setItem('ps_layout_mode', 'classic');
    }
    setModalTemaAberto(false);
  };

  useEffect(() => {
    const handleOpenSettings = () => setModalTemaAberto(true);
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  const fecharModal = () => setModalTemaAberto(false);

  return (
    <>
      <header className={styles.duoHeader}>
        <div className={styles.logo}>
          <img src="/assets/img/logo.png" style={{ maxHeight: '45px', width: 'auto' }} alt="Logo Cadeira" />
          <img src="/assets/img/texto-ps.png" style={{ maxHeight: '25px', width: 'auto' }} alt="Power Soccer" />
        </div>
        
        <div className={styles.headerActions}>
          {showBackButton && (
            <button onClick={() => navigate('/')} className={styles.headerLink}>
              ⬅ Menu Principal
            </button>
          )}
          
          <span className={styles.headerUserName}>Olá, {userName}</span>
          
          <button onClick={handleLogout} className={styles.btnHeaderSair} title="Sair">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="var(--duo-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17L21 12L16 7" stroke="var(--duo-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="var(--duo-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className={styles.logoutText}>Sair</span>
          </button>
          
          <button onClick={() => setModalTemaAberto(true)} className={styles.btnHeaderIcon}>⚙️</button>
        </div>
      </header>

      {modalTemaAberto && (
        <>
          <div className="gaveta-overlay" style={{ display: 'block' }} onClick={fecharModal}></div>
          <div className="duo-modal modal-centralizado" style={{ zIndex: 1002, padding: '30px', backgroundColor: 'var(--bg-secondary)' }}>
            <h4 style={{ color: 'var(--text-main)', textAlign: 'center', marginBottom: '15px' }}>⚙️ Configurações</h4>
            
            <h5 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>🎨 Temas</h5>
            <div className="modal-botoes-coluna">
              <button className="btn-acao" onClick={() => aplicarTema('dark')} style={{ backgroundColor: '#2d2d2d', color: 'white' }}>
                🌙 Modo Escuro (Padrão)
              </button>
              <button className="btn-acao" onClick={() => aplicarTema('light-mode')} style={{ backgroundColor: '#f0f9f2', color: '#2a2a2a' }}>
                ☀️ Modo Claro
              </button>
              <button className="btn-acao btn-duo-primary" onClick={() => aplicarTema('daltonico-mode')}>
                👁️ Modo Daltônico
              </button>
            </div>

            <hr style={{ borderColor: 'var(--border-ui)', margin: '15px 0' }} />

            <h5 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>📱 Layout</h5>
            <div className="modal-botoes-coluna">
              <button className="btn-acao" onClick={() => aplicarModo('mobile')} style={{ backgroundColor: 'var(--duo-blue)', color: 'white' }}>
                📱 Modo Mobile
              </button>
              <button className="btn-acao" onClick={() => aplicarModo('classic')} style={{ backgroundColor: '#666', color: 'white' }}>
                💻 Modo Clássico
              </button>
            </div>

            <button className="btn-cancelar" onClick={fecharModal}>Fechar</button>
          </div>
        </>
      )}
    </>
  );
}