import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { apiPost } from '../services/api';
import toast from 'react-hot-toast';

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
    <div style={{ 
      maxWidth: '400px', 
      margin: '50px auto', 
      textAlign: 'center',
      padding: '40px',
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '16px',
      boxShadow: 'var(--shadow-duo)'
    }}>
      <h2 style={{ marginBottom: '30px', color: 'var(--text-main)' }}>
        PowerSoccer <span className="cor-duo">Scout</span>
      </h2>
      <p style={{ marginBottom: '30px', color: '#aaa' }}>
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