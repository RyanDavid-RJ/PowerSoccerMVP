import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Elenco from './pages/Elenco';
import Dashboard from './pages/Dashboard';
import NovaPartida from './pages/NovaPartida';
import Scout from './pages/Scout';
import Partidas from './pages/Partidas';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
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