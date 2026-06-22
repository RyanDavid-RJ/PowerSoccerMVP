import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { apiPost } from '../services/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const [isSplashing, setIsSplashing] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashing(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoginLoading(true);
    toast.loading('Conectando ao servidor... Pode levar até 40 segundos.', { duration: 5000 });
    try {
      const data = await apiPost('/auth/google', { token: credentialResponse.credential });
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      toast.dismiss();
      toast.success('Bem-vindo ao PowerSoccer!');
      navigate('/');
    } catch (err) {
      console.error('Erro no login com Google:', err);
      toast.dismiss();
      toast.error('Falha ao autenticar com Google. Tente novamente.');
      setLoginLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Não foi possível fazer login com Google. Verifique suas permissões.');
  };

  // SPLASH SCREEN
  if (isSplashing) {
    return (
      <div className={styles.splashContainer}>
        <div className={styles.splashContent}>
          <img src="/assets/img/logo-novo.png" className={styles.splashLogo} alt="PowerSoccer Logo" />
          <img src="/assets/img/powerSoccer.png" className={styles.splashNameLogo} alt="PowerSoccer" />
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

  // TELA DE LOGIN
  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <img src="/assets/img/logo-novo.png" className={styles.loginLogoMain} alt="Logo" />
        <img src="/assets/img/powerSoccer.png" className={styles.loginNameLogo} alt="PowerSoccer" />
        <p className={styles.subtitle}>
          O primeiro Dashboard de Performance Esportiva projetado exclusivamente para o futebol em cadeira de rodas motorizada.
        </p>
        
        <div className={styles.googleWrapper}>
          <p style={{fontSize: '14px', color: '#ccc', marginBottom: '15px'}}>
            {loginLoading ? 'Processando login... Aguarde (até 40s)' : 'Faça login ou crie sua conta gratuitamente'}
          </p>
          {loginLoading ? (
            <div className={styles.loadingSpinner}>
              <Loader2 size={40} className={styles.spin} />
              <p style={{color: '#aaa', fontSize: '13px', marginTop: '10px'}}>
                Nosso banco de dados está acordando... Isso pode levar até 40 segundos.
              </p>
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="filled_blue"
              size="large"
              text="continue_with"
              shape="rectangular"
            />
          )}
        </div>
        <span style={{fontSize: '0.9rem', color: '#aaa', marginTop: '20px', display: 'block'}}>CBC</span>
      </div>
    </div>
  );
}