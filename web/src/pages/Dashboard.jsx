import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [stats, setStats] = useState({ gols: 0, passesC: 0, passesE: 0, intercep: 0 });
  const [partidas, setPartidas] = useState([]);
  const [partidaSelecionada, setPartidaSelecionada] = useState('');

  // 1. Carrega a lista de partidas
  useEffect(() => {
    fetch('http://localhost:3000/api/partidas')
      .then(res => res.json())
      .then(data => {
        setPartidas(data);
        if (data.length > 0) setPartidaSelecionada(data[0].id);
      });
  }, []);

  // 2. Carrega estatísticas quando a partida muda
  useEffect(() => {
    if (!partidaSelecionada) return;
    
    fetch(`http://localhost:3000/api/eventos/partida/${partidaSelecionada}`)
      .then(res => res.json())
      .then(lances => {
        let s = { gols: 0, passesC: 0, passesE: 0, intercep: 0 };
        lances.forEach(l => {
          if (l.tipo_acao === 'Gol') s.gols++;
          if (l.tipo_acao === 'Passe Certo') s.passesC++;
          if (l.tipo_acao === 'Passe Errado') s.passesE++;
          if (l.tipo_acao === 'Interceptação') s.intercep++;
        });
        setStats(s);
      });
  }, [partidaSelecionada]);

  const data = {
    labels: ['Gols', 'Passes Certos', 'Passes Errados', 'Interceptações'],
    datasets: [{
      label: 'Performance Tática',
      data: [stats.gols, stats.passesC, stats.passesE, stats.intercep],
      backgroundColor: ['#ffc800', '#1cb0f6', '#ff4b4b', '#ff9600'],
    }]
  };

  return (
    <>
      <Header userName="Treinador" showBackButton={true} />
      
      <div className="dashboard-container">
        <div className="filtro-container">
          <h2>Análise <span className="cor-duo">Tática</span></h2>
          <select onChange={(e) => setPartidaSelecionada(e.target.value)} value={partidaSelecionada}>
            {partidas.map(p => (
              <option key={p.id} value={p.id}>vs {p.adversario} ({new Date(p.data_jogo).toLocaleDateString()})</option>
            ))}
          </select>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card kpi-gols"><h3>Gols</h3><div className="valor">{stats.gols}</div></div>
          <div className="kpi-card kpi-passes-c"><h3>Passes Certos</h3><div className="valor">{stats.passesC}</div></div>
          <div className="kpi-card kpi-passes-e"><h3>Passes Errados</h3><div className="valor">{stats.passesE}</div></div>
          <div className="kpi-card kpi-intercep"><h3>Interceptações</h3><div className="valor">{stats.intercep}</div></div>
        </div>

        <div className="duo-container" style={{ marginTop: '20px' }}>
          <Bar data={data} options={{ responsive: true, plugins: { legend: { labels: { color: '#eaeaea' } } } }} />
        </div>
      </div>
    </>
  );
}