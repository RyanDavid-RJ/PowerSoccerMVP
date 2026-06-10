import { useNavigate } from 'react-router-dom';

export default function Header({ showBackButton, onSettingsClick }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const userName = usuario.nome || 'Treinador';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  return (
    <header className="duo-header">
      <div className="logo">
        <img src="/assets/img/logo.png" style={{ maxHeight: '45px', width: 'auto' }} alt="Logo Cadeira" />
        <img src="/assets/img/texto-ps.png" style={{ maxHeight: '25px', width: 'auto' }} alt="Power Soccer" />
      </div>
      
      <div className="header-actions">
        {showBackButton && (
          <button onClick={() => navigate('/')} className="header-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            ⬅ Menu Principal
          </button>
        )}
        
        <span className="header-user-name">Olá, {userName}</span>
        
        <button onClick={handleLogout} className="btn-header-sair">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle', marginRight: '5px' }}>
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="var(--duo-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17L21 12L16 7" stroke="var(--duo-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" stroke="var(--duo-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sair
        </button>
        
        <button onClick={onSettingsClick} className="btn-header-icon">⚙️</button>
      </div>
    </header>
  );
}