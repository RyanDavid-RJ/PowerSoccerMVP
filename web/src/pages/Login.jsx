import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { apiPost } from '../services/api';
import toast from 'react-hot-toast';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const [isSplashing, setIsSplashing] = useState(true);

  // Controla o tempo de exibição do Splash Screen (2.8 segundos)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashing(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await apiPost('/auth/google', { token: credentialResponse.credential });
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      toast.success('Bem-vindo ao PowerSoccer!');
      navigate('/');
    } catch (err) {
      console.error('Erro no login com Google:', err);
      toast.error('Falha ao autenticar com Google. Tente novamente.');
    }
  };

  const handleGoogleError = () => {
    toast.error('Não foi possível fazer login com Google. Verifique suas permissões.');
  };

  // TELA 1: Splash Screen Animada
  if (isSplashing) {
    return (
      <div className={styles.splashContainer}>
        <div className={styles.splashContent}>
          <img src="/assets/img/logo-novo.png" alt="PowerSoccer Logo" className={styles.splashLogo} />
          <h1 className={styles.splashTitle}>
            Power<span className={styles.highlight}>Soccer</span>
          </h1>
          <p className={styles.splashSubtitle}>Iniciando o motor de análise...</p>
          
          <div className={styles.jozyContainer}>
            <img src="/assets/img/jozy-splash.png" alt="Carregando..." className={styles.jozyAnim} />
          </div>
          
          <div className={styles.loadingBarContainer}>
            <div className={styles.loadingBar}></div>
          </div>
        </div>
      </div>
    );
  }

  // TELA 2: Painel de Login Oficial
  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <img src="/assets/img/logo-novo.png" alt="Logo" className={styles.loginLogoMain} />
        <h2 className={styles.title}>
          Power<span className={styles.highlight}>Soccer</span> <span style={{fontSize: '1rem', color: '#fff'}}>SaaS</span>
        </h2>
        <p className={styles.subtitle}>
          O primeiro Dashboard de Performance Esportiva projetado exclusivamente para o futebol em cadeira de rodas motorizada.
        </p>
        
        <div className={styles.googleWrapper}>
          <p style={{fontSize: '14px', color: '#ccc', marginBottom: '15px'}}>Faça login ou crie sua conta gratuitamente</p>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="filled_blue"
            size="large"
            text="continue_with"
            shape="rectangular"
          />
        </div>
      </div>
    </div>
  );
}