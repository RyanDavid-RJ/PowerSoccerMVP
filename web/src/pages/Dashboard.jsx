import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { apiGet } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [stats, setStats] = useState({ gols: 0, passesC: 0, passesE: 0, intercep: 0 });
  const [partidas, setPartidas] = useState([]);
  const [partidaSelecionada, setPartidaSelecionada] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('Todos');
  const [eventos, setEventos] = useState([]);
  const [heatmapFiltroTipo, setHeatmapFiltroTipo] = useState('');
  const [loadingEventos, setLoadingEventos] = useState(false);

  // Carrega a lista de partidas
  useEffect(() => {
    const carregarPartidas = async () => {
      try {
        const data = await apiGet('/partidas');
        setPartidas(data);
        if (data.length > 0) setPartidaSelecionada(data[0].id);
      } catch (err) {
        console.error("Erro ao carregar partidas:", err);
        alert("Erro ao carregar lista de partidas.");
      }
    };
    carregarPartidas();
  }, []);

  // Carrega eventos e calcula estatísticas + heatmap
  useEffect(() => {
    if (!partidaSelecionada) return;

    const fetchEventos = async () => {
      setLoadingEventos(true);
      try {
        const lances = await apiGet(`/eventos/partida/${partidaSelecionada}`);
        setEventos(lances);

        // Filtra pelo período escolhido
        const lancesFiltrados = filtroPeriodo === 'Todos'
          ? lances
          : lances.filter(l => l.periodo === filtroPeriodo);

        let s = { gols: 0, passesC: 0, passesE: 0, intercep: 0 };
        lancesFiltrados.forEach(l => {
          if (l.tipo_acao === 'Gol') s.gols++;
          if (l.tipo_acao === 'Passe Certo') s.passesC++;
          if (l.tipo_acao === 'Passe Errado') s.passesE++;
          if (l.tipo_acao === 'Interceptação') s.intercep++;
        });
        setStats(s);
      } catch (err) {
        console.error("Erro ao carregar eventos:", err);
        alert("Erro ao carregar eventos da partida.");
      } finally {
        setLoadingEventos(false);
      }
    };

    fetchEventos();
  }, [partidaSelecionada, filtroPeriodo]);

  // ========== SÍNTESE DE IA ==========
  const gerarAnaliseIA = () => {
    const totalPasses = stats.passesC + stats.passesE;
    const percPassesCertos = totalPasses > 0 ? (stats.passesC / totalPasses) * 100 : 0;

    let analise = "";
    if (stats.gols > 3) analise += "⚽ Poder ofensivo absurdo! A equipe está arrasando no ataque. ";
    else if (stats.gols === 0) analise += "⚠️ Ataque ineficaz. É preciso finalizar mais e com qualidade. ";
    else analise += "🎯 Ataque regular, mas ainda pode melhorar. ";

    if (percPassesCertos >= 85) analise += "🧠 Excelente controle de bola e troca de passes (85%+ de acerto). ";
    else if (percPassesCertos >= 70) analise += "⚙️ Posse de bola razoável, mas erros de passe podem custar caro. ";
    else analise += "🔻 Circulação de bola comprometida. Muitos passes errados. ";

    if (stats.intercep > 5) analise += "🛡️ Defesa sólida! Alto número de interceptações. ";
    else if (stats.intercep < 2) analise += "⚠️ Pouca agressividade na recuperação de bola. ";

    if (percPassesCertos > 80 && stats.gols < 2) analise += "💡 Time domina a posse, mas falta capricho na finalização.";
    return analise || "Desempenho equilibrado. Continue ajustando a estratégia.";
  };

  // ========== PREPARAÇÃO DO GRÁFICO POR JOGADOR ==========
  const processarEstatisticasPorJogador = () => {
    // Filtra eventos pelo período e exclui substituições
    const eventosFiltrados = eventos.filter(ev => {
      if (ev.tipo_acao === 'Substituição') return false;
      if (filtroPeriodo !== 'Todos' && ev.periodo !== filtroPeriodo) return false;
      return true;
    });

    // Acumulador por jogador (nome)
    const jogadorMap = new Map(); // key: nome_atleta, value: { gols, passesC, passesE, intercep }

    eventosFiltrados.forEach(ev => {
      const nome = ev.nome_atleta || "Desconhecido";
      if (!jogadorMap.has(nome)) {
        jogadorMap.set(nome, { gols: 0, passesC: 0, passesE: 0, intercep: 0 });
      }
      const dados = jogadorMap.get(nome);
      if (ev.tipo_acao === 'Gol') dados.gols++;
      else if (ev.tipo_acao === 'Passe Certo') dados.passesC++;
      else if (ev.tipo_acao === 'Passe Errado') dados.passesE++;
      else if (ev.tipo_acao === 'Interceptação') dados.intercep++;
    });

    // Ordena jogadores por número de gols (decrescente) para destacar artilheiros
    const jogadoresOrdenados = Array.from(jogadorMap.entries())
      .sort((a, b) => b[1].gols - a[1].gols)
      .map(([nome, dados]) => ({ nome, ...dados }));

    return jogadoresOrdenados;
  };

  const jogadoresStats = processarEstatisticasPorJogador();

  // Configuração do gráfico de barras por jogador
  const chartDataPorJogador = {
    labels: jogadoresStats.map(j => j.nome.split(' ')[0]), // Primeiro nome
    datasets: [
      {
        label: 'Gols',
        data: jogadoresStats.map(j => j.gols),
        backgroundColor: '#ffc800',
        borderRadius: 6,
        barPercentage: 0.7,
      },
      {
        label: 'Passes Certos',
        data: jogadoresStats.map(j => j.passesC),
        backgroundColor: '#1cb0f6',
        borderRadius: 6,
        barPercentage: 0.7,
      },
      {
        label: 'Interceptações',
        data: jogadoresStats.map(j => j.intercep),
        backgroundColor: '#ff9600',
        borderRadius: 6,
        barPercentage: 0.7,
      },
    ],
  };

  const chartOptionsPorJogador = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: '#eaeaea', font: { size: 11 } } },
      tooltip: { backgroundColor: '#333', titleColor: '#fff', bodyColor: '#ccc' }
    },
    scales: {
      y: { ticks: { color: '#ccc', stepSize: 1 }, grid: { color: '#444' } },
      x: { ticks: { color: '#ccc', rotation: 45, maxRotation: 45, minRotation: 45 }, grid: { display: false } }
    }
  };

  // ========== PREPARAÇÃO DO HEATMAP ==========
  const eventosParaHeatmap = eventos.filter(ev => {
    if (ev.tipo_acao === 'Substituição') return false;
    if (filtroPeriodo !== 'Todos' && ev.periodo !== filtroPeriodo) return false;
    if (heatmapFiltroTipo !== '' && ev.tipo_acao !== heatmapFiltroTipo) return false;
    return ev.coord_x != null && ev.coord_y != null;
  });

  const corPorTipo = {
    'Gol': '#ffc800',
    'Passe Certo': '#1cb0f6',
    'Passe Errado': '#ff4b4b',
    'Finalização': '#9c27b0',
    'Interceptação': '#ff9600'
  };

  // ========== EXPORTAÇÃO PDF ==========
  const handleExportPDF = () => {
    document.body.classList.add('print-mode');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode');
    }, 500);
  };

  return (
    <>
      <Header showBackButton={true} />

      <div className="dashboard-container">
        {/* Filtros principais + Botão Exportar */}
        <div className="filtro-container">
          <h2>Análise <span className="cor-duo">Tática</span></h2>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select onChange={(e) => setPartidaSelecionada(e.target.value)} value={partidaSelecionada}>
              {partidas.map(p => (
                <option key={p.id} value={p.id}>vs {p.adversario} ({new Date(p.data_jogo).toLocaleDateString()})</option>
              ))}
            </select>

            <div className="btn-group" style={{ display: 'flex', gap: '5px' }}>
              {['Todos', '1º Tempo', '2º Tempo'].map(periodo => (
                <button
                  key={periodo}
                  className={`btn-filtro-periodo ${filtroPeriodo === periodo ? 'ativo' : ''}`}
                  onClick={() => setFiltroPeriodo(periodo)}
                  style={{ padding: '6px 12px', borderRadius: '20px', background: filtroPeriodo === periodo ? 'var(--duo-green-primary)' : 'var(--input-bg)', color: 'white', cursor: 'pointer', border: 'none' }}
                >
                  {periodo}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportPDF}
              style={{ padding: '6px 14px', borderRadius: '20px', background: 'var(--duo-purple)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📄 Exportar Relatório PDF
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="kpi-grid">
          <div className="kpi-card kpi-gols"><h3>Gols</h3><div className="valor">{stats.gols}</div></div>
          <div className="kpi-card kpi-passes-c"><h3>Passes Certos</h3><div className="valor">{stats.passesC}</div></div>
          <div className="kpi-card kpi-passes-e"><h3>Passes Errados</h3><div className="valor">{stats.passesE}</div></div>
          <div className="kpi-card kpi-intercep"><h3>Interceptações</h3><div className="valor">{stats.intercep}</div></div>
        </div>

        {/* SÍNTESE DE IA */}
        <div className="duo-container" style={{ marginBottom: '20px', borderLeft: `5px solid var(--duo-purple)` }}>
          <h3 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🧠 Síntese Tática (IA)</span>
          </h3>
          <p style={{ fontSize: '1rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
            {gerarAnaliseIA()}
          </p>
        </div>

        {/* GRÁFICO DE RENDIMENTO INDIVIDUAL */}
        <div className="duo-container" style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>📊 Comparativo por Jogador</h3>
          {jogadoresStats.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa' }}>Nenhum evento registrado para este filtro.</p>
          ) : (
            <Bar data={chartDataPorJogador} options={chartOptionsPorJogador} />
          )}
        </div>

        {/* MAPA DE CALOR (HEATMAP) */}
        <div className="duo-container" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>🔥 Mapa de Calor (Ocorrências)</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className={`btn-filtro-tipo ${heatmapFiltroTipo === '' ? 'ativo' : ''}`}
                onClick={() => setHeatmapFiltroTipo('')}
                style={{ padding: '4px 12px', borderRadius: '20px', background: heatmapFiltroTipo === '' ? 'var(--duo-green-primary)' : 'var(--input-bg)', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                Todos
              </button>
              {['Gol', 'Passe Certo', 'Passe Errado', 'Finalização', 'Interceptação'].map(tipo => (
                <button
                  key={tipo}
                  className={`btn-filtro-tipo ${heatmapFiltroTipo === tipo ? 'ativo' : ''}`}
                  onClick={() => setHeatmapFiltroTipo(tipo)}
                  style={{ padding: '4px 12px', borderRadius: '20px', background: heatmapFiltroTipo === tipo ? 'var(--duo-green-primary)' : 'var(--input-bg)', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {loadingEventos ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Carregando mapa...</div>
          ) : (
            <div className="heatmap-container" style={{ position: 'relative', width: '100%', aspectRatio: '8/5', backgroundColor: 'var(--duo-green-primary)', borderRadius: '16px', overflow: 'hidden', marginTop: '10px' }}>
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                <rect x="0" y="20%" width="15%" height="60%" fill="none" stroke="white" strokeWidth="3" />
                <rect x="85%" y="20%" width="15%" height="60%" fill="none" stroke="white" strokeWidth="3" />
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="3" />
                <circle cx="50%" cy="50%" r="15%" fill="none" stroke="white" strokeWidth="3" />
                <circle cx="50%" cy="50%" r="1%" fill="white" />
              </svg>

              {eventosParaHeatmap.map((ev, idx) => (
                <div
                  key={idx}
                  className="heatmap-ponto"
                  style={{
                    position: 'absolute',
                    left: `${ev.coord_x}%`,
                    top: `${ev.coord_y}%`,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: corPorTipo[ev.tipo_acao] || '#ffffff',
                    border: '1px solid rgba(0,0,0,0.5)',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                    pointerEvents: 'none',
                    zIndex: 5,
                    opacity: 0.85
                  }}
                  title={`${ev.tipo_acao} - ${ev.minuto_video}`}
                />
              ))}
              {eventosParaHeatmap.length === 0 && !loadingEventos && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: '20px', fontSize: '14px' }}>
                  Nenhum evento com coordenadas para este filtro.
                </div>
              )}
            </div>
          )}
          <p style={{ fontSize: '12px', color: '#aaa', marginTop: '10px', textAlign: 'center' }}>
            * Cada bolinha representa um lance na posição exata do campo (coordenadas relativas).
          </p>
        </div>
      </div>

      {/* Estilos para impressão (PDF) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .dashboard-container, .dashboard-container * {
            visibility: visible;
          }
          .dashboard-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
          }
          .duo-container, .kpi-card, .heatmap-container {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .btn-filtro-periodo, .btn-filtro-tipo, button, .btn-group, .btn-group * {
            display: none !important;
          }
          select, .filtro-container select {
            display: none !important;
          }
          .btn-acao, .btn-config, [onClick] {
            display: none !important;
          }
          .kpi-card .valor {
            color: #000 !important;
          }
          .heatmap-container svg rect, .heatmap-container svg line, .heatmap-container svg circle {
            stroke: #333 !important;
          }
        }
      `}</style>
    </>
  );
}