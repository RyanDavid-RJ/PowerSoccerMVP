import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Elenco from './pages/Elenco';
import Dashboard from './pages/Dashboard';
import NovaPartida from './pages/NovaPartida';
import Scout from './pages/Scout';
import Partidas from './pages/Partidas'; // <-- Importe aqui

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/elenco" element={<Elenco />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/nova-partida" element={<NovaPartida />} />
        <Route path="/scout/:id" element={<Scout />} />
        <Route path="/partidas" element={<Partidas />} /> {/* <-- Adicione esta linha */}
      </Routes>
    </BrowserRouter>
  )
}

export default App;