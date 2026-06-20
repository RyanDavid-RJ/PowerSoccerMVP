import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { apiPost } from '../services/api';
import toast from 'react-hot-toast';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await apiPost('/auth/google', { token: credentialResponse.credential });
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      toast.success('Login com Google realizado!');
      navigate('/');
    } catch (err) {
      console.error('Erro no login com Google:', err);
      toast.error('Falha ao autenticar com Google. Tente novamente.');
    }
  };

  const handleGoogleError = () => {
    toast.error('Não foi possível fazer login com Google. Verifique suas permissões.');
  };

  return (
    <div className={styles.loginWrapper}>
      <h2 className={styles.title}>
        PowerSoccer <span className={styles.highlight}>Scout</span>
      </h2>
      <p className={styles.subtitle}>
        Acesse sua conta usando o Google
      </p>
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
  );
}