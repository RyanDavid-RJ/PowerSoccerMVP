import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { apiPost } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        navigate('/');
      } else {
        alert(data.erro || 'Erro no login');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await apiPost('/auth/google', { token: credentialResponse.credential });
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      navigate('/');
    } catch (err) {
      console.error('Erro no login com Google:', err);
      alert('Falha ao autenticar com Google. Tente novamente.');
    }
  };

  const handleGoogleError = () => {
    console.error('Falha no login com Google');
    alert('Não foi possível fazer login com Google. Verifique suas permissões.');
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          required
          style={{ display: 'block', width: '100%', marginBottom: '20px', padding: '8px' }}
        />
        <button type="submit" style={{ width: '100%', padding: '10px', marginBottom: '20px' }}>
          Entrar
        </button>
      </form>

      <hr style={{ margin: '20px 0' }} />

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