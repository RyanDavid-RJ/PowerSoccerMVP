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
import toast from "react-hot-toast";
import styles from "./Elenco.module.css";

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

  const [statsPorPartida, setStatsPorPartida] = useState([]);
  const [totais, setTotais] = useState({
    gols: 0,
    passesC: 0,
    passesE: 0,
    interceptacoes: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const carregarElenco = async () => {
      try {
        const data = await apiGet("/atletas");
        setAtletas(data);
      } catch (error) {
        console.error("Erro ao buscar atletas:", error);
        toast.error("Erro ao carregar elenco.");
      }
    };
    carregarElenco();
  }, []);

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
      toast.error("Erro ao carregar estatísticas do atleta.");
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
      toast.success("Atleta cadastrado com sucesso!");
      setNome("");
      setNumero("");
      setFoto(null);
      document.getElementById("foto-atleta").value = "";
      const data = await apiGet("/atletas");
      setAtletas(data);
    } catch (error) {
      console.error("Erro completo:", error);
      toast.error(`Erro ao salvar: ${error.message}`);
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
      toast.success("Atleta atualizado com sucesso!");
      const data = await apiGet("/atletas");
      setAtletas(data);
      fecharModal();
    } catch (error) {
      console.error("Erro completo:", error);
      toast.error(`Erro ao editar: ${error.message}`);
    } finally {
      setLoadingEdit(false);
    }
  };

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

      <div className={styles.elencoLayout}>
        <div>
          <h2>
            Nosso <span className="cor-duo">Elenco</span>
          </h2>
          <div className={`${styles.gridJogadores} ${styles.spacingTop}`}>
            {atletas.map((atleta) => (
              <div
                key={atleta.id}
                className={styles.cardAtleta}
                onClick={() => abrirPerfil(atleta)}
              >
                {atleta.foto ? (
                  <div
                    className={styles.fotoGrande}
                    style={{
                      backgroundImage: `url(${atleta.foto})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      color: "transparent",
                    }}
                  ></div>
                ) : (
                  <div className={styles.fotoGrande}>{atleta.nome.charAt(0)}</div>
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
          <form onSubmit={handleSubmit} className={styles.spacingTop}>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
            <input
              type="number"
              className={styles.formInput}
              placeholder="Camisa"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
            />
            <input
              type="file"
              id="foto-atleta"
              className={styles.formInput}
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
            className={`duo-modal modal-perfil modal-centralizado ${styles.modalElenco}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.perfilHeader}>
              {atletaSelecionado.foto ? (
                <div
                  className={styles.fotoGrande}
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
                  className={styles.fotoGrande}
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
                  <>
                    <div className="skeleton-kpi-grid">
                      <div className="skeleton-kpi"></div>
                      <div className="skeleton-kpi"></div>
                      <div className="skeleton-kpi"></div>
                      <div className="skeleton-kpi"></div>
                    </div>
                    <div className="skeleton-chart"></div>
                  </>
                ) : (
                  <>
                    <div className={styles.perfilKpis}>
                      <div className={styles.kpiMini}>
                        <h5>Total Gols</h5>
                        <div className={styles.val} style={{ color: "var(--duo-yellow)" }}>
                          {totais.gols}
                        </div>
                      </div>
                      <div className={styles.kpiMini}>
                        <h5>Total Passes Certos</h5>
                        <div className={styles.val} style={{ color: "var(--duo-blue)" }}>
                          {totais.passesC}
                        </div>
                      </div>
                      <div className={styles.kpiMini}>
                        <h5>Total Passes Errados</h5>
                        <div className={styles.val} style={{ color: "var(--duo-red)" }}>
                          {totais.passesE}
                        </div>
                      </div>
                      <div className={styles.kpiMini}>
                        <h5>Total Interceptações</h5>
                        <div className={styles.val} style={{ color: "var(--duo-orange)" }}>
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

                <div className={styles.modalBotoesColuna}>
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
                  <div className={styles.formGrupo}>
                    <label className={styles.formLabel}>Nome do Atleta</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formGrupo}>
                    <label className={styles.formLabel}>Número da Camisa</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={editNumero}
                      onChange={(e) => setEditNumero(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formGrupo}>
                    <label className={styles.formLabel}>
                      Substituir Foto (Opcional)
                    </label>
                    <input
                      type="file"
                      className={styles.formInput}
                      accept="image/*"
                      onChange={(e) => setEditFoto(e.target.files[0])}
                    />
                  </div>
                  <div className={styles.modalBotoesColuna}>
                    <button
                      type="submit"
                      className={`btn-acao ${styles.btnDuoGreen}`}
                      disabled={loadingEdit}
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