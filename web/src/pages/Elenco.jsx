import { useState, useEffect } from "react";
import Header from "../components/Header";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { apiGet } from "../services/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export default function Elenco() {
  const [atletas, setAtletas] = useState([]);
  const [nome, setNome] = useState("");
  const [numero, setNumero] = useState("");
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [atletaSelecionado, setAtletaSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editNumero, setEditNumero] = useState("");
  const [editFoto, setEditFoto] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Dados reais do atleta
  const [statsPorPartida, setStatsPorPartida] = useState([]);
  const [totais, setTotais] = useState({
    gols: 0,
    passesC: 0,
    passesE: 0,
    interceptacoes: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Carrega elenco usando apiGet (com token)
  useEffect(() => {
    const carregarElenco = async () => {
      try {
        const data = await apiGet("/atletas");
        setAtletas(data);
      } catch (error) {
        console.error("Erro ao buscar atletas:", error);
        alert("Erro ao carregar elenco.");
      }
    };
    carregarElenco();
  }, []);

  // Função para processar eventos e gerar evolução por partida
  const processarEventos = (eventos) => {
    const partidasMap = new Map();
    let totaisAcumulados = {
      gols: 0,
      passesC: 0,
      passesE: 0,
      interceptacoes: 0,
    };

    eventos.forEach((ev) => {
      if (ev.tipo_acao === "Substituição") return;
      const pid = ev.partida_id;
      if (!partidasMap.has(pid)) {
        partidasMap.set(pid, { gols: 0, passesC: 0, passesE: 0, intercep: 0 });
      }
      const stats = partidasMap.get(pid);
      switch (ev.tipo_acao) {
        case "Gol":
          stats.gols++;
          totaisAcumulados.gols++;
          break;
        case "Passe Certo":
          stats.passesC++;
          totaisAcumulados.passesC++;
          break;
        case "Passe Errado":
          stats.passesE++;
          totaisAcumulados.passesE++;
          break;
        case "Interceptação":
          stats.intercep++;
          totaisAcumulados.interceptacoes++;
          break;
        default:
          break;
      }
    });

    const partidasOrdenadas = Array.from(partidasMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([id, stats]) => ({ partida: id, ...stats }));

    return { partidasOrdenadas, totais: totaisAcumulados };
  };

  const abrirPerfil = async (atleta) => {
    setAtletaSelecionado(atleta);
    setModoEdicao(false);
    setEditNome(atleta.nome);
    setEditNumero(atleta.numero_camisa);
    setEditFoto(null);
    setModalAberto(true);
    setLoadingStats(true);

    try {
      const eventos = await apiGet(`/eventos/atleta/${atleta.id}`);
      const { partidasOrdenadas, totais: totaisCalc } = processarEventos(eventos);
      setStatsPorPartida(partidasOrdenadas);
      setTotais(totaisCalc);
    } catch (error) {
      console.error("Erro ao carregar eventos do atleta:", error);
      setStatsPorPartida([]);
      setTotais({ gols: 0, passesC: 0, passesE: 0, interceptacoes: 0 });
    } finally {
      setLoadingStats(false);
    }
  };

  const fecharModal = () => {
    setModalAberto(false);
    setAtletaSelecionado(null);
    setStatsPorPartida([]);
    setTotais({ gols: 0, passesC: 0, passesE: 0, interceptacoes: 0 });
  };

  // --- Funções de cadastro e edição (com FormData e token manual) ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("numero_camisa", numero);
    if (foto) formData.append("foto", foto);
    try {
      const response = await fetch("http://localhost:3000/api/atletas", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      if (!response.ok) throw new Error(await response.text());
      alert("Atleta cadastrado com sucesso!");
      setNome("");
      setNumero("");
      setFoto(null);
      document.getElementById("foto-atleta").value = "";
      // Recarrega elenco com apiGet
      const data = await apiGet("/atletas");
      setAtletas(data);
    } catch (error) {
      console.error("Erro completo:", error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoadingEdit(true);
    const formData = new FormData();
    formData.append("nome", editNome);
    formData.append("numero_camisa", editNumero);
    if (editFoto) formData.append("foto", editFoto);
    try {
      const response = await fetch(
        `http://localhost:3000/api/atletas/${atletaSelecionado.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: formData,
        }
      );
      if (!response.ok) throw new Error(await response.text());
      alert("Atleta atualizado com sucesso!");
      const data = await apiGet("/atletas");
      setAtletas(data);
      fecharModal();
    } catch (error) {
      console.error("Erro completo:", error);
      alert("Erro ao editar: " + error.message);
    } finally {
      setLoadingEdit(false);
    }
  };

  // Preparar dados do gráfico de linha
  const labels = statsPorPartida.map((_, idx) => `Jogo ${idx + 1}`);
  const golsPorJogo = statsPorPartida.map((s) => s.gols);
  const passesCPorJogo = statsPorPartida.map((s) => s.passesC);
  const passesEPorJogo = statsPorPartida.map((s) => s.passesE);
  const intercepPorJogo = statsPorPartida.map((s) => s.intercep);

  const dadosGraficoEvolucao = {
    labels,
    datasets: [
      {
        label: "Gols",
        data: golsPorJogo,
        borderColor: "#ffc800",
        backgroundColor: "transparent",
        tension: 0.2,
        fill: false,
      },
      {
        label: "Passes Certos",
        data: passesCPorJogo,
        borderColor: "#1cb0f6",
        backgroundColor: "transparent",
        tension: 0.2,
        fill: false,
      },
      {
        label: "Passes Errados",
        data: passesEPorJogo,
        borderColor: "#ff4b4b",
        backgroundColor: "transparent",
        tension: 0.2,
        fill: false,
      },
      {
        label: "Interceptações",
        data: intercepPorJogo,
        borderColor: "#ff9600",
        backgroundColor: "transparent",
        tension: 0.2,
        fill: false,
      },
    ],
  };

  const opcoesGrafico = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: "#aaa", font: { size: 10 } } },
      tooltip: {
        backgroundColor: "#333",
        titleColor: "#fff",
        bodyColor: "#ccc",
      },
    },
    scales: {
      x: { ticks: { color: "#aaa" }, grid: { color: "#444" } },
      y: { ticks: { color: "#aaa", stepSize: 1 }, grid: { color: "#444" } },
    },
  };

  return (
    <>
      <Header showBackButton={true} />

      <div className="elenco-layout">
        <div>
          <h2>
            Nosso <span className="cor-duo">Elenco</span>
          </h2>
          <div className="grid-jogadores spacing-top">
            {atletas.map((atleta) => (
              <div
                key={atleta.id}
                className="card-atleta"
                onClick={() => abrirPerfil(atleta)}
              >
                {atleta.foto ? (
                  <div
                    className="foto-grande"
                    style={{
                      backgroundImage: `url(${atleta.foto})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      color: "transparent",
                    }}
                  ></div>
                ) : (
                  <div className="foto-grande">{atleta.nome.charAt(0)}</div>
                )}
                <h4>{atleta.nome}</h4>
                <small>Camisa {atleta.numero_camisa}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="duo-container">
          <h3>
            Cadastrar <span className="cor-duo">Atleta</span>
          </h3>
          <form onSubmit={handleSubmit} className="spacing-top">
            <input
              type="text"
              className="form-input"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
            <input
              type="number"
              className="form-input"
              placeholder="Camisa"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
              style={{ margin: "10px 0" }}
            />
            <input
              type="file"
              id="foto-atleta"
              className="form-input"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files[0])}
            />
            <button
              type="submit"
              className="btn-acao btn-duo-primary"
              style={{ width: "100%", marginTop: "10px" }}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Atleta"}
            </button>
          </form>
        </div>
      </div>

      {modalAberto && atletaSelecionado && (
        <div
          className="gaveta-overlay"
          style={{ display: "block" }}
          onClick={fecharModal}
        >
          <div
            className="duo-modal modal-perfil modal-centralizado"
            style={{
              width: "90%",
              maxWidth: "500px",
              backgroundColor: "var(--bg-secondary)",
              zIndex: 1000,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="perfil-header"
              style={{
                justifyContent: "center",
                borderBottom: "none",
                paddingBottom: "0",
              }}
            >
              {atletaSelecionado.foto ? (
                <div
                  className="foto-grande"
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundImage: `url(${atletaSelecionado.foto})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    color: "transparent",
                  }}
                ></div>
              ) : (
                <div
                  className="foto-grande"
                  style={{ width: "60px", height: "60px" }}
                >
                  {atletaSelecionado.nome.charAt(0)}
                </div>
              )}
              <div style={{ textAlign: "left" }}>
                <h3 style={{ margin: 0 }}>{atletaSelecionado.nome}</h3>
                <span
                  className="cor-duo"
                  style={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    backgroundColor: "var(--input-bg)",
                    padding: "2px 8px",
                    borderRadius: "10px",
                  }}
                >
                  Camisa {atletaSelecionado.numero_camisa}
                </span>
              </div>
            </div>

            <hr style={{ borderColor: "var(--border-ui)", margin: "15px 0" }} />

            {!modoEdicao ? (
              <>
                <h4 style={{ textAlign: "center", marginBottom: "15px" }}>
                  📊 Raio-X (Carreira)
                </h4>
                {loadingStats ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    Carregando estatísticas...
                  </div>
                ) : (
                  <>
                    <div
                      className="perfil-kpis"
                      style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
                    >
                      <div className="kpi-mini">
                        <h5>Total Gols</h5>
                        <div
                          className="val"
                          style={{ color: "var(--duo-yellow)" }}
                        >
                          {totais.gols}
                        </div>
                      </div>
                      <div className="kpi-mini">
                        <h5>Total Passes Certos</h5>
                        <div
                          className="val"
                          style={{ color: "var(--duo-blue)" }}
                        >
                          {totais.passesC}
                        </div>
                      </div>
                      <div className="kpi-mini">
                        <h5>Total Passes Errados</h5>
                        <div
                          className="val"
                          style={{ color: "var(--duo-red)" }}
                        >
                          {totais.passesE}
                        </div>
                      </div>
                      <div className="kpi-mini">
                        <h5>Total Interceptações</h5>
                        <div
                          className="val"
                          style={{ color: "var(--duo-orange)" }}
                        >
                          {totais.interceptacoes}
                        </div>
                      </div>
                    </div>

                    {statsPorPartida.length > 0 ? (
                      <div
                        style={{
                          backgroundColor: "var(--bg-primary)",
                          padding: "10px",
                          borderRadius: "12px",
                          marginBottom: "20px",
                        }}
                      >
                        <Line
                          data={dadosGraficoEvolucao}
                          options={opcoesGrafico}
                          height={150}
                        />
                      </div>
                    ) : (
                      <p style={{ textAlign: "center", color: "#aaa" }}>
                        Nenhum evento registrado para este atleta.
                      </p>
                    )}
                  </>
                )}

                <div className="modal-botoes-coluna">
                  <button
                    className="btn-acao btn-duo-azul"
                    onClick={() => setModoEdicao(true)}
                  >
                    ✏️ Editar Dados do Atleta
                  </button>
                  <button className="btn-cancelar" onClick={fecharModal}>
                    Fechar Perfil
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 style={{ textAlign: "center", marginBottom: "15px" }}>
                  ✏️ Editar Dados
                </h4>
                <form onSubmit={handleEditSubmit}>
                  <div className="form-grupo">
                    <label className="form-label">Nome do Atleta</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-grupo">
                    <label className="form-label">Número da Camisa</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editNumero}
                      onChange={(e) => setEditNumero(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-grupo">
                    <label className="form-label">
                      Substituir Foto (Opcional)
                    </label>
                    <input
                      type="file"
                      className="form-input"
                      accept="image/*"
                      onChange={(e) => setEditFoto(e.target.files[0])}
                    />
                  </div>
                  <div
                    className="modal-botoes-coluna"
                    style={{ marginTop: "20px" }}
                  >
                    <button
                      type="submit"
                      className="btn-acao btn-duo-green"
                      disabled={loadingEdit}
                      style={{
                        backgroundColor: "var(--duo-green-primary)",
                        color: "white",
                      }}
                    >
                      {loadingEdit ? "Salvando..." : "Salvar Modificações"}
                    </button>
                    <button
                      type="button"
                      className="btn-cancelar"
                      onClick={() => setModoEdicao(false)}
                    >
                      Cancelar Edição
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}