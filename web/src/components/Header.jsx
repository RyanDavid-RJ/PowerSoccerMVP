import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, ArrowLeft, Moon, Sun, Eye, Smartphone, Monitor } from 'lucide-react';
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
          <img src="/assets/img/logo-novo.png" style={{ maxHeight: '30px', width: 'auto' }} alt="PowerSoccer Logo" />
          <img src="/assets/img/powerSoccer.png" style={{ maxHeight: '40px', width: 'auto', marginLeft: '-10px' }} alt="PowerSoccer" />
        </div>
        
        <div className={styles.headerActions}>
          {showBackButton && (
            <button onClick={() => navigate('/')} className={styles.headerLink} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={18} /> Menu Principal
            </button>
          )}
          
          <span className={styles.headerUserName}>Olá, {userName}</span>
          
          <button onClick={handleLogout} className={styles.btnHeaderSair} title="Sair">
            <LogOut size={18} />
            <span className={styles.logoutText}>Sair</span>
          </button>
          
          <button onClick={() => setModalTemaAberto(true)} className={styles.btnHeaderIcon}>
            <Settings size={22} />
          </button>
        </div>
      </header>

      {modalTemaAberto && (
        <>
          <div className="gaveta-overlay" style={{ display: 'block' }} onClick={fecharModal}></div>
          <div className="duo-modal modal-centralizado" style={{ zIndex: 1002, padding: '30px', backgroundColor: 'var(--bg-secondary)' }}>
            <h4 style={{ color: 'var(--text-main)', textAlign: 'center', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Settings size={20} /> Configurações
            </h4>
            
            <h5 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Temas</h5>
            <div className="modal-botoes-coluna">
              <button className="btn-acao" onClick={() => aplicarTema('dark')} style={{ backgroundColor: '#2d2d2d', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Moon size={18} /> Modo Escuro (Padrão)
              </button>
              <button className="btn-acao" onClick={() => aplicarTema('light-mode')} style={{ backgroundColor: '#f0f9f2', color: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Sun size={18} /> Modo Claro
              </button>
              <button className="btn-acao btn-duo-primary" onClick={() => aplicarTema('daltonico-mode')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Eye size={18} /> Modo Daltônico
              </button>
            </div>

            <hr style={{ borderColor: 'var(--border-ui)', margin: '15px 0' }} />

            <h5 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Layout</h5>
            <div className="modal-botoes-coluna">
              <button className="btn-acao" onClick={() => aplicarModo('mobile')} style={{ backgroundColor: 'var(--duo-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Smartphone size={18} /> Modo Mobile
              </button>
              <button className="btn-acao" onClick={() => aplicarModo('classic')} style={{ backgroundColor: '#666', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Monitor size={18} /> Modo Clássico
              </button>
            </div>

            <button className="btn-cancelar" onClick={fecharModal}>Fechar</button>
          </div>
        </>
      )}
    </>
  );
}