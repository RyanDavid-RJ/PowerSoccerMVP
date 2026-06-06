import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Elenco from './pages/Elenco'; // <-- NOVO IMPORT
import Dashboard from './pages/Dashboard';
// ...


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/elenco" element={<Elenco />} /> {/* <-- NOVA ROTA */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;