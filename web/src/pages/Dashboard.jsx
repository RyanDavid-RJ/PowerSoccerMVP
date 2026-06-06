import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Registra os componentes do ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [stats, setStats] = useState({ gols: 0, passes: 0, interceptacoes: 0 });

  useEffect(() => {
    // Aqui buscaríamos os dados agregados do banco
    // Por enquanto, simulamos com dados que vêm do seu backend
    const carregarStats = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/estatisticas');
            const data = await res.json();
            setStats(data);
        } catch (e) {
            console.log("Ainda não temos a rota de stats, vamos criar!");
        }
    };
    carregarStats();
  }, []);

  const data = {
    labels: ['Gols', 'Passes', 'Interceptações'],
    datasets: [{
      label: 'Performance do Time',
      data: [stats.gols, stats.passes, stats.interceptacoes],
      backgroundColor: ['#ffc800', '#1cb0f6', '#ff9600'],
    }]
  };

  return (
    <>
      <Header userName="Treinador" showBackButton={true} />
      
      <div className="dashboard-container">
        <h2>Dashboard <span className="cor-duo">Tático</span></h2>

        {/* KPIs (Cards de resumo) */}
        <div className="kpi-grid">
          <div className="kpi-card kpi-gols">
            <h3>Gols</h3>
            <div className="valor">{stats.gols}</div>
          </div>
          <div className="kpi-card kpi-passes-c">
            <h3>Passes</h3>
            <div className="valor">{stats.passes}</div>
          </div>
          <div className="kpi-card kpi-intercep">
            <h3>Interceptações</h3>
            <div className="valor">{stats.interceptacoes}</div>
          </div>
        </div>

        {/* Área do Gráfico */}
        <div className="duo-container">
          <Bar data={data} options={{ responsive: true }} />
        </div>
      </div>
    </>
  );
}