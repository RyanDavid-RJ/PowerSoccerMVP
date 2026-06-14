import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Elenco from './pages/Elenco';
import Dashboard from './pages/Dashboard';
import NovaPartida from './pages/NovaPartida';
import Scout from './pages/Scout';
import Partidas from './pages/Partidas';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';

function App() {
  // Carregar tema salvo do localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('ps_theme');
    if (savedTheme === 'light-mode') {
      document.body.classList.add('light-mode');
    } else if (savedTheme === 'daltonico-mode') {
      document.body.classList.add('daltonico-mode');
    } else {
      // 'dark' é o padrão – remove classes extras
      document.body.classList.remove('light-mode', 'daltonico-mode');
    }
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: '#333', color: '#fff' },
          success: { iconTheme: { primary: '#58cc02', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ff4b4b', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/elenco" element={<PrivateRoute><Elenco /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/nova-partida" element={<PrivateRoute><NovaPartida /></PrivateRoute>} />
        <Route path="/scout/:id" element={<PrivateRoute><Scout /></PrivateRoute>} />
        <Route path="/partidas" element={<PrivateRoute><Partidas /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;