import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { apiGet, apiPost, apiPut, apiDelete } from "../services/api";
import toast from "react-hot-toast";
import styles from "./Scout.module.css";

export default function Scout() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [partida, setPartida] = useState(null);
  const [titularesIniciais, setTitularesIniciais] = useState([]);
  const [reservasIniciais, setReservasIniciais] = useState([]);
  const [eventos, setEventos] = useState([]);

  const [jogadorAtivo, setJogadorAtivo] = useState(null);
  const [segundoAtual, setSegundoAtual] = useState(0);
  const [modoVisualizacao, setModoVisualizacao] = useState("time");

  const [editandoTempo, setEditandoTempo] = useState(false);
  const [tempoDigitado, setTempoDigitado] = useState("");

  const [acaoPendente, setAcaoPendente] = useState(null);
  const [mostrandoOutros, setMostrandoOutros] = useState(false);

  const [modalAcao, setModalAcao] = useState({ visivel: false, x: 0, y: 0, modalX: 0, modalY: 0 });
  const [modalSub, setModalSub] = useState({
    visivel: false,
    idSaindo: null,
    idEntrando: null,
    nomeEntrando: "",
  });
  const [modalDomino, setModalDomino] = useState({
    visivel: false,
    idsParaDeletar: [],
    qtdExtras: 0,
  });
  const [modalEdicao, setModalEdicao] = useState({
    visivel: false,
    evento: null,
    tipoAcao: "",
    minutoVideo: "",
  });

  // ========== UTILITÁRIOS ==========
  const tempoParaSegundos = (tempoTexto) => {
    if (!tempoTexto) return 0;
    const [m, s] = tempoTexto.split(":").map(Number);
    return m * 60 + s;
  };

  const segundosParaTempo = (totalSegundos) => {
    const min = Math.floor(totalSegundos / 60)
      .toString()
      .padStart(2, "0");
    const seg = (totalSegundos % 60).toString().padStart(2, "0");
    return `${min}:${seg}`;
  };

  const ajustarTempo = (valor) => {
    setSegundoAtual((prev) => {
      let novo = prev + valor;
      if (novo < 0) return 0;
      if (novo > 2400) return 2400;
      return novo;
    });
  };

  const ordenarEventosCronologicamente = (eventosArray) => {
    return [...eventosArray].sort(
      (a, b) =>
        tempoParaSegundos(a.minuto_video) - tempoParaSegundos(b.minuto_video),
    );
  };

  // ========== CARREGAMENTO DE DADOS ==========
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [dataPartida, dataEventos, dataAtletas] = await Promise.all([
          apiGet(`/partidas/${id}`),
          apiGet(`/eventos/partida/${id}`),
          apiGet("/atletas"),
        ]);

        setPartida(dataPartida);

        const eventosOrdenados = ordenarEventosCronologicamente(dataEventos);
        setEventos(eventosOrdenados);

        const escalacao =
          typeof dataPartida.escalacao === "string"
            ? JSON.parse(dataPartida.escalacao)
            : dataPartida.escalacao;

        const enriquecer = (lista) => {
          if (!lista) return [];
          return lista.map((item) => {
            if (!item) return null;
            const completo = dataAtletas.find((a) => a.id === item.id);
            return completo ? { ...item, ...completo } : item;
          });
        };

        const titularesCompletos = enriquecer(escalacao.titulares);
        const reservasCompletos = enriquecer(escalacao.reservas);

        setTitularesIniciais(titularesCompletos);
        setReservasIniciais(reservasCompletos);
      } catch (e) {
        console.error("Erro no carregamento:", e);
        toast.error("Erro ao carregar a prancheta.");
        navigate("/nova-partida");
      }
    };
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ========== MOTOR TÁTICO & RADAR ==========
  const calcularIntervalos = (jogadorId) => {
    if (!jogadorId) return [];
    const subs = eventos
      .filter((e) => e.tipo_acao === "Substituição")
      .sort(
        (a, b) =>
          tempoParaSegundos(a.minuto_video) - tempoParaSegundos(b.minuto_video),
      );

    const isTitular = titularesIniciais.some((t) => t && t.id === jogadorId);
    let intervals = [];
    let start = isTitular ? 0 : null;

    subs.forEach((sub) => {
      const tSub = tempoParaSegundos(sub.minuto_video);
      if (sub.atleta_id === jogadorId && start !== null) {
        intervals.push({ inicio: start, fim: tSub });
        start = null;
      } else if (sub.jogador_entrou_id === jogadorId) {
        start = tSub;
      }
    });
    if (start !== null) intervals.push({ inicio: start, fim: 2400 });
    return intervals;
  };

  const estaEmQuadra = (jogadorId, segundo) => {
    const intervalos = calcularIntervalos(jogadorId);
    return intervalos.some((int) => segundo >= int.inicio && segundo < int.fim);
  };

  const todosJogadores = [...titularesIniciais, ...reservasIniciais].filter(
    (j) => j !== null,
  );
  const todosEmQuadra = todosJogadores.filter((j) =>
    estaEmQuadra(j.id, segundoAtual),
  );
  const jogadoresEmQuadra =
    todosEmQuadra.length > 4
      ? [...todosEmQuadra]
          .sort((a, b) => (a.numero_camisa || 0) - (b.numero_camisa || 0))
          .slice(0, 4)
      : todosEmQuadra;
  const jogadoresNoBanco = todosJogadores.filter(
    (j) => !estaEmQuadra(j.id, segundoAtual),
  );

  const obterJogadoresEmQuadraNoSegundo = (segundo) =>
    todosJogadores.filter((j) => estaEmQuadra(j.id, segundo));

  const ultimoLanceDoJogador = (jogadorId) => {
    const lancesDoJogador = eventos.filter(
      (ev) => ev.atleta_id === jogadorId && ev.tipo_acao !== "Substituição",
    );
    if (lancesDoJogador.length === 0) return null;
    return lancesDoJogador[lancesDoJogador.length - 1];
  };

  const gerarGradienteBarra = () => {
    if (!jogadorAtivo) return "#444";
    const MAX_S = 2400;
    let intervalos = calcularIntervalos(jogadorAtivo.id);
    let gradientes = [];
    let ultimoFim = 0;

    intervalos.forEach((int) => {
      if (int.inicio > ultimoFim) {
        gradientes.push(
          `var(--duo-red) ${(ultimoFim / MAX_S) * 100}% ${(int.inicio / MAX_S) * 100}%`,
        );
      }
      gradientes.push(
        `#444 ${(int.inicio / MAX_S) * 100}% ${(int.fim / MAX_S) * 100}%`,
      );
      ultimoFim = int.fim;
    });
    if (ultimoFim < MAX_S) {
      gradientes.push(`var(--duo-red) ${(ultimoFim / MAX_S) * 100}% 100%`);
    }
    return `linear-gradient(to right, ${gradientes.join(", ")})`;
  };

  // ========== EDIÇÃO DE TEMPO ==========
  const iniciarEdicaoTempo = () => {
    setTempoDigitado(segundosParaTempo(segundoAtual));
    setEditandoTempo(true);
  };

  const confirmarEdicaoTempo = () => {
    if (!/^[0-9]{2}:[0-5][0-9]$/.test(tempoDigitado)) {
      toast.error("Formato inválido! Use MM:SS (ex: 10:05).");
      setEditandoTempo(false);
      return;
    }
    const totalSeg = tempoParaSegundos(tempoDigitado);
    if (totalSeg > 2400) {
      toast.error("O tempo máximo permitido é 40:00.");
      setEditandoTempo(false);
      return;
    }
    setSegundoAtual(totalSeg);
    setEditandoTempo(false);
  };

  const handleKeyDownTempo = (e) => {
    if (e.key === "Enter") {
      confirmarEdicaoTempo();
    }
  };

  // ========== AÇÕES NO CAMPO ==========
  const handleCampoClick = (e) => {
    if (!jogadorAtivo) {
      toast.error("Selecione um jogador na lateral esquerda antes!");
      return;
    }
    if (!estaEmQuadra(jogadorAtivo.id, segundoAtual)) {
      toast.error(`${jogadorAtivo.nome} está no banco neste minuto!`);
      return;
    }
    const minutoVideo = segundosParaTempo(segundoAtual);
    if (eventos.some((ev) => ev.minuto_video === minutoVideo)) {
      toast.error("Segundo Ocupado! Avance ou recue o tempo em 1s.");
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    let modalX = x;
    let modalY = y;
    if (window.innerWidth > 768) {
        modalX = Math.max(15, Math.min(x, 85));
        modalY = Math.max(25, Math.min(y, 90));
    }

    setModalAcao({ visivel: true, x, y, modalX, modalY });
    setAcaoPendente(null);
    setMostrandoOutros(false);
  };

  const selecionarAcao = (tipoAcao) => {
    setAcaoPendente(tipoAcao);
    setMostrandoOutros(false);
  };

  const executarAcaoJogadorAtivo = async () => {
    if (!jogadorAtivo) return;
    await registrarAcaoComJogador(jogadorAtivo, acaoPendente);
  };

  const escolherOutroJogador = () => {
    setMostrandoOutros(true);
  };

  const executarAcaoOutroJogador = async (atleta) => {
    setJogadorAtivo(atleta);
    await registrarAcaoComJogador(atleta, acaoPendente);
  };

  const registrarAcaoComJogador = async (atleta, tipoAcao) => {
    if (!estaEmQuadra(atleta.id, segundoAtual)) {
      toast.error(
        `ERRO: ${atleta.nome} não está em quadra neste minuto! Ação cancelada.`,
      );
      return;
    }

    const periodo = segundoAtual <= 1200 ? "1º Tempo" : "2º Tempo";

    const payload = {
      partida_id: parseInt(id),
      atleta_id: atleta.id,
      minuto_video: segundosParaTempo(segundoAtual),
      tipo_acao: tipoAcao,
      coord_x: modalAcao.x.toFixed(2),
      coord_y: modalAcao.y.toFixed(2),
      periodo: periodo,
    };

    try {
      await apiPost("/eventos", payload);
      await carregarDadosDaAPI();
      setModalAcao({ visivel: false, x: 0, y: 0, modalX: 0, modalY: 0 });
      setAcaoPendente(null);
      setMostrandoOutros(false);
      toast.success(`${tipoAcao} registrado com sucesso!`);
    } catch (e) {
      console.error(e);
      toast.error(`Erro ao salvar ação: ${e.message}`);
    }
  };

  const cancelarAcao = () => {
    setModalAcao({ visivel: false, x: 0, y: 0, modalX: 0, modalY: 0 });
    setAcaoPendente(null);
    setMostrandoOutros(false);
  };

  // ========== SUBSTITUIÇÕES ==========
  const handleReservaClick = (reserva) => {
    if (!jogadorAtivo) {
      toast.error(
        "Selecione um jogador titular (na lateral esquerda) para fazer a troca.",
      );
      return;
    }

    const eventosFuturosDoJogador = eventos.filter(
      (ev) =>
        ev.atleta_id === jogadorAtivo.id &&
        tempoParaSegundos(ev.minuto_video) > segundoAtual,
    );
    if (eventosFuturosDoJogador.length > 0) {
      toast.error(
        `Este jogador possui lances no futuro. Apague os lances dele que ocorrem após ${segundosParaTempo(segundoAtual)} antes de substituí-lo no passado.`,
      );
      return;
    }

    const minutoVideo = segundosParaTempo(segundoAtual);
    if (eventos.some((ev) => ev.minuto_video === minutoVideo)) {
      toast.error(
        "Segundo Ocupado! Avance ou recue o tempo em 1s antes de substituir.",
      );
      return;
    }

    setModalSub({
      visivel: true,
      idSaindo: jogadorAtivo.id,
      idEntrando: reserva.id,
      nomeEntrando: reserva.nome,
    });
  };

  const confirmarSubstituicao = async () => {
    if (!estaEmQuadra(modalSub.idSaindo, segundoAtual)) {
      toast.error(
        "ERRO: O jogador que você quer substituir não está em quadra neste momento.",
      );
      setModalSub({
        visivel: false,
        idSaindo: null,
        idEntrando: null,
        nomeEntrando: "",
      });
      return;
    }

    if (estaEmQuadra(modalSub.idEntrando, segundoAtual)) {
      toast.error(
        "ERRO: O jogador que você quer colocar já está em quadra. Substituição inválida.",
      );
      setModalSub({
        visivel: false,
        idSaindo: null,
        idEntrando: null,
        nomeEntrando: "",
      });
      return;
    }

    const eventosFuturosDoSaindo = eventos.filter(
      (ev) =>
        ev.atleta_id === modalSub.idSaindo &&
        tempoParaSegundos(ev.minuto_video) > segundoAtual,
    );
    if (eventosFuturosDoSaindo.length > 0) {
      toast.error(
        `ERRO: O jogador ${jogadorAtivo?.nome.split(" ")[0]} possui ${eventosFuturosDoSaindo.length} lance(s) após ${segundosParaTempo(segundoAtual)}.\n` +
          `Apague esses lances antes de fazer a substituição retroativa.`,
      );
      setModalSub({
        visivel: false,
        idSaindo: null,
        idEntrando: null,
        nomeEntrando: "",
      });
      return;
    }

    const payload = {
      partida_id: parseInt(id),
      atleta_id: modalSub.idSaindo,
      jogador_entrou_id: modalSub.idEntrando,
      minuto_video: segundosParaTempo(segundoAtual),
      tipo_acao: "Substituição",
      coord_x: null,
      coord_y: null,
    };

    try {
      await apiPost("/eventos", payload);
      await carregarDadosDaAPI();
      setModalSub({
        visivel: false,
        idSaindo: null,
        idEntrando: null,
        nomeEntrando: "",
      });
      setJogadorAtivo(null);
      toast.success("Substituição registrada com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error(`Erro ao registrar substituição: ${e.message}`);
    }
  };

  // ========== EFEITO DOMINÓ ==========
  const deletarLance = async (e, lanceClicado) => {
    e.stopPropagation();
    if (lanceClicado.tipo_acao === "Substituição") {
      const segSubCancelada = tempoParaSegundos(lanceClicado.minuto_video);
      let idsParaDeletar = [lanceClicado.id];
      let jogadoresAfetados = [lanceClicado.jogador_entrou_id];
      let i = 0;
      while (i < jogadoresAfetados.length) {
        let jogId = jogadoresAfetados[i];
        let acoesFuturas = eventos.filter(
          (l) =>
            l.atleta_id === jogId &&
            tempoParaSegundos(l.minuto_video) >= segSubCancelada &&
            l.id !== lanceClicado.id,
        );
        acoesFuturas.forEach((acao) => {
          if (!idsParaDeletar.includes(acao.id)) idsParaDeletar.push(acao.id);
          if (acao.tipo_acao === "Substituição" && acao.jogador_entrou_id) {
            if (!jogadoresAfetados.includes(acao.jogador_entrou_id))
              jogadoresAfetados.push(acao.jogador_entrou_id);
          }
        });
        i++;
      }
      const qtdExtras = idsParaDeletar.length - 1;
      if (qtdExtras > 0) {
        setModalDomino({ visivel: true, idsParaDeletar, qtdExtras });
        return;
      }
    }
    if (!window.confirm("Deseja apagar este lance permanentemente?")) return;
    try {
      await apiDelete(`/eventos/${lanceClicado.id}`);
      if (modalEdicao.visivel && modalEdicao.evento?.id === lanceClicado.id)
        setModalEdicao({
          visivel: false,
          evento: null,
          tipoAcao: "",
          minutoVideo: "",
        });
      await carregarDadosDaAPI();
      toast.success("Lance deletado com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error(`Erro ao deletar: ${e.message}`);
    }
  };

  const confirmarDelecaoEmCascata = async () => {
    try {
      await Promise.all(
        modalDomino.idsParaDeletar.map((idEv) => apiDelete(`/eventos/${idEv}`)),
      );
      await carregarDadosDaAPI();
      setModalDomino({ visivel: false, idsParaDeletar: [], qtdExtras: 0 });
      toast.success(
        `${modalDomino.idsParaDeletar.length} lances deletados em cascata.`,
      );
    } catch (e) {
      console.error(e);
      toast.error(`Erro crítico ao apagar lances em cascata: ${e.message}`);
    }
  };

  // ========== EDIÇÃO ==========
  const abrirModalEdicao = (e, lance) => {
    e.stopPropagation();
    setModalEdicao({
      visivel: true,
      evento: lance,
      tipoAcao: lance.tipo_acao,
      minutoVideo: lance.minuto_video,
    });
  };

  const salvarEdicaoLance = async () => {
    const formatoValido = /^[0-9]{2}:[0-5][0-9]$/.test(modalEdicao.minutoVideo);
    if (!formatoValido) {
      toast.error("O tempo deve estar no formato MM:SS (Ex: 14:30)");
      return;
    }
    const novoSegundo = tempoParaSegundos(modalEdicao.minutoVideo);
    if (novoSegundo > 2400) {
      toast.error("O tempo máximo permitido é 40:00.");
      return;
    }
    const ocupado = eventos.some(
      (ev) =>
        tempoParaSegundos(ev.minuto_video) === novoSegundo &&
        ev.id !== modalEdicao.evento.id,
    );
    if (ocupado) {
      toast.error(
        "Já existe outro lance marcado neste exato segundo. Escolha outro tempo.",
      );
      return;
    }
    try {
      await apiPut(`/eventos/${modalEdicao.evento.id}`, {
        tipo_acao: modalEdicao.tipoAcao,
        minuto_video: modalEdicao.minutoVideo,
      });
      await carregarDadosDaAPI();
      setModalEdicao({
        visivel: false,
        evento: null,
        tipoAcao: "",
        minutoVideo: "",
      });
      setSegundoAtual(novoSegundo);
      toast.success("Lance editado com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error(`Erro ao editar lance: ${e.message}`);
    }
  };

  // ========== HANDLERS ==========
  const handleCliqueTitular = (atleta) => {
    setJogadorAtivo(atleta);
    const ultimoLance = ultimoLanceDoJogador(atleta.id);
    if (ultimoLance)
      setSegundoAtual(tempoParaSegundos(ultimoLance.minuto_video));
  };

  const handleCliqueHistorico = (ev) => {
    setSegundoAtual(tempoParaSegundos(ev.minuto_video));
    if (ev.atleta_id) {
      const atleta = todosJogadores.find((j) => j.id === ev.atleta_id);
      if (atleta) setJogadorAtivo(atleta);
    }
  };

  const handleRangeChange = (e) => {
    const novoSegundo = parseInt(e.target.value);
    if (jogadorAtivo && !estaEmQuadra(jogadorAtivo.id, novoSegundo)) {
      toast.error("Este jogador estava no banco neste momento.");
      const jogadoresNaQuadra = obterJogadoresEmQuadraNoSegundo(novoSegundo);
      if (jogadoresNaQuadra.length > 0) setJogadorAtivo(jogadoresNaQuadra[0]);
    }
    setSegundoAtual(novoSegundo);
  };

  const carregarDadosDaAPI = async () => {
    try {
      const [dataPartida, dataEventos, dataAtletas] = await Promise.all([
        apiGet(`/partidas/${id}`),
        apiGet(`/eventos/partida/${id}`),
        apiGet("/atletas"),
      ]);

      setPartida(dataPartida);

      const eventosOrdenados = ordenarEventosCronologicamente(dataEventos);
      setEventos(eventosOrdenados);

      const escalacao =
        typeof dataPartida.escalacao === "string"
          ? JSON.parse(dataPartida.escalacao)
          : dataPartida.escalacao;

      const enriquecer = (lista) => {
        if (!lista) return [];
        return lista.map((item) => {
          if (!item) return null;
          const completo = dataAtletas.find((a) => a.id === item.id);
          return completo ? { ...item, ...completo } : item;
        });
      };

      setTitularesIniciais(enriquecer(escalacao.titulares));
      setReservasIniciais(enriquecer(escalacao.reservas));
    } catch (e) {
      console.error("Erro no carregamento:", e);
      toast.error("Erro ao carregar a prancheta.");
      navigate("/nova-partida");
    }
  };

  if (!partida)
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
        Carregando Partida...
      </div>
    );

  const eventosFiltrados =
    modoVisualizacao === "time"
      ? eventos
      : jogadorAtivo
        ? eventos.filter(
            (ev) =>
              ev.atleta_id === jogadorAtivo.id &&
              ev.tipo_acao !== "Substituição",
          )
        : [];

  const outrosJogadoresQuadra = jogadoresEmQuadra.filter(
    (j) => j.id !== jogadorAtivo?.id
  );

  return (
    <>
      <Header showBackButton={false} />

      <div className={styles.scoutTopBar}>
        <h3 className={styles.scoutTitle}>
          PowerSoccer <span className="cor-duo">vs {partida.adversario}</span>
        </h3>
        <button
          className={`btn-acao btn-duo-vermelho ${styles.scoutSairBtn}`}
          onClick={() => navigate("/")}
        >
          Sair da Partida
        </button>
      </div>

      <div className={styles.scoutLayout}>
        {/* TITULARES (em quadra) */}
        <div className={styles.sidebar}>
          <h3 style={{ color: "var(--duo-blue)", marginBottom: "15px", marginTop: "0px" }}>
            ⚽ Em Quadra
          </h3>
          <div className={styles.scrollJogadores}>
            {jogadoresEmQuadra.map((atleta) => (
              <div
                key={atleta.id}
                className={`jogador ${jogadorAtivo?.id === atleta.id ? "ativo" : ""}`}
                onClick={() => handleCliqueTitular(atleta)}
              >
                {atleta.foto ? (
                  <div
                    className="foto"
                    style={{
                      backgroundImage: `url(${atleta.foto})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      color: "transparent",
                    }}
                  />
                ) : (
                  <div className="foto">{atleta.nome.charAt(0)}</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                    {atleta.nome.split(" ")[0]}
                  </div>
                  <div style={{ fontSize: "12px", color: "#aaa" }}>
                    Camisa {atleta.numero_camisa}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRANCHETA + LINHA DO TEMPO + RESERVAS */}
        <div className={styles.centerArea}>
          {/* TOGGLE DE VISUALIZAÇÃO + INDICADORES DE PERÍODO */}
          <div className={styles.controlsRow}>
            <div className={styles.viewToggleGroup}>
              <button
                className={`btn-acao ${modoVisualizacao === "time" ? "btn-duo-primary" : "btn-config"} ${styles.viewToggle}`}
                onClick={() => setModoVisualizacao("time")}
              >
                🏟️ Visão Time
              </button>
              <button
                className={`btn-acao ${modoVisualizacao === "jogador" ? "btn-duo-primary" : "btn-config"} ${styles.viewToggle}`}
                onClick={() => setModoVisualizacao("jogador")}
                disabled={!jogadorAtivo}
              >
                👤 Visão Jogador
              </button>
            </div>

            <div className={styles.periodGroup}>
              <div
                className={`btn-acao ${segundoAtual <= 1200 ? "btn-duo-primary" : "btn-config"} ${styles.periodBadge} ${segundoAtual <= 1200 ? styles.periodBadgeActive : ""}`}
              >
                1º Tempo
              </div>
              <div
                className={`btn-acao ${segundoAtual > 1200 ? "btn-duo-primary" : "btn-config"} ${styles.periodBadge} ${segundoAtual > 1200 ? styles.periodBadgeActive : ""}`}
              >
                2º Tempo
              </div>
            </div>
          </div>

          {/* CAMPO SVG */}
          <div
            className={`${styles.campoField}`}
            onClick={handleCampoClick}
          >
            <svg
              width="100%"
              height="100%"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
              }}
            >
              <rect
                x="0"
                y="20%"
                width="15%"
                height="60%"
                fill="none"
                stroke="white"
                strokeWidth="3"
              />
              <rect
                x="85%"
                y="20%"
                width="15%"
                height="60%"
                fill="none"
                stroke="white"
                strokeWidth="3"
              />
              <line
                x1="50%"
                y1="0"
                x2="50%"
                y2="100%"
                stroke="white"
                strokeWidth="3"
              />
              <circle
                cx="50%"
                cy="50%"
                r="15%"
                fill="none"
                stroke="white"
                strokeWidth="3"
              />
              <circle cx="50%" cy="50%" r="1%" fill="white" />
            </svg>

            {/* PONTOS COM TOOLTIP CUSTOMIZADO */}
            {eventosFiltrados.map((ev) => {
              if (ev.tipo_acao === "Substituição") return null;
              const destaque =
                tempoParaSegundos(ev.minuto_video) === segundoAtual;
              return (
                <div
                  key={ev.id}
                  className={`ponto ${
                    ev.tipo_acao === "Gol"
                      ? "gol"
                      : ev.tipo_acao === "Passe Certo"
                        ? "passe-certo"
                        : ev.tipo_acao === "Passe Errado"
                          ? "passe-errado"
                          : ev.tipo_acao === "Finalização"
                            ? "finalizacao"
                            : "interceptacao"
                  } ${destaque ? "ponto-destaque" : ""}`}
                  style={{ left: `${ev.coord_x}%`, top: `${ev.coord_y}%` }}
                >
                  <div className="tooltip-ponto">
                    {ev.foto_atleta ? (
                      <img
                        src={ev.foto_atleta}
                        alt={ev.nome_atleta}
                        className="tooltip-foto"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="tooltip-foto"
                      style={{ display: ev.foto_atleta ? "none" : "flex" }}
                    >
                      {ev.nome_atleta?.charAt(0) || "?"}
                    </div>
                    <div className="tooltip-info">
                      <strong>{ev.nome_atleta?.split(" ")[0] || "?"}</strong>
                      <span>
                        {ev.tipo_acao} - {ev.minuto_video}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {modalAcao.visivel && !acaoPendente && (
              <div
                className={styles.actionModal}
                style={{ "--x": `${modalAcao.modalX}%`, "--y": `${modalAcao.modalY}%` }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`btn-acao btn-duo-azul ${styles.actionBtn}`}
                  onClick={() => selecionarAcao("Passe Certo")}
                >
                  Passe ✓
                </button>
                <button
                  className={`btn-acao btn-duo-vermelho ${styles.actionBtn}`}
                  onClick={() => selecionarAcao("Passe Errado")}
                >
                  Passe ✗
                </button>
                <button
                  className={`btn-acao btn-duo-amarelo ${styles.actionBtn}`}
                  style={{ color: "black" }}
                  onClick={() => selecionarAcao("Gol")}
                >
                  GOL ⚽
                </button>
                <button
                  className={`btn-acao btn-duo-roxo ${styles.actionBtn}`}
                  onClick={() => selecionarAcao("Finalização")}
                >
                  Chute
                </button>
                <button
                  className={`btn-acao btn-duo-laranja ${styles.actionBtn}`}
                  onClick={() => selecionarAcao("Interceptação")}
                >
                  Roubo
                </button>
                <button
                  className={`btn-acao ${styles.actionBtn}`}
                  style={{ background: "#333", color: "white" }}
                  onClick={cancelarAcao}
                >
                  X
                </button>
              </div>
            )}

            {modalAcao.visivel && acaoPendente && !mostrandoOutros && (
              <div
                className={styles.actionModal}
                style={{ "--x": `${modalAcao.modalX}%`, "--y": `${modalAcao.modalY}%` }}
                onClick={(e) => e.stopPropagation()}
              >
                <p style={{ gridColumn: "span 2", textAlign: "center", color: "white", margin: "0 0 5px" }}>
                  {acaoPendente} por:
                </p>
                <button
                  className={`btn-acao btn-duo-primary ${styles.actionBtn}`}
                  onClick={executarAcaoJogadorAtivo}
                >
                  {jogadorAtivo?.nome.split(" ")[0]}
                </button>
                <button
                  className={`btn-acao btn-duo-laranja ${styles.actionBtn}`}
                  onClick={escolherOutroJogador}
                >
                  Outro
                </button>
                <button
                  className={`btn-acao ${styles.actionBtn}`}
                  style={{ background: "#333", color: "white" }}
                  onClick={cancelarAcao}
                >
                  Cancelar
                </button>
              </div>
            )}

            {modalAcao.visivel && acaoPendente && mostrandoOutros && (
              <div
                className={styles.actionModal}
                style={{ "--x": `${modalAcao.modalX}%`, "--y": `${modalAcao.modalY}%` }}
                onClick={(e) => e.stopPropagation()}
              >
                <p style={{ gridColumn: "span 2", textAlign: "center", color: "white", margin: "0 0 5px" }}>
                  {acaoPendente} para:
                </p>
                {outrosJogadoresQuadra.map((atleta) => (
                  <button
                    key={atleta.id}
                    className={`btn-acao btn-duo-roxo ${styles.actionBtn}`}
                    onClick={() => executarAcaoOutroJogador(atleta)}
                  >
                    {atleta.nome.split(" ")[0]}
                  </button>
                ))}
                <button
                  className={`btn-acao ${styles.actionBtn}`}
                  style={{ background: "#333", color: "white", gridColumn: "span 2" }}
                  onClick={cancelarAcao}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* LINHA DO TEMPO */}
          <div className={`${styles.timelineContainer}`}>
            <label className={styles.timelineLabel}>
              ⏱️ Tempo de Jogo:
              {editandoTempo ? (
                <input
                  type="text"
                  className={styles.timelineInput}
                  value={tempoDigitado}
                  onChange={(e) => setTempoDigitado(e.target.value)}
                  onBlur={confirmarEdicaoTempo}
                  onKeyDown={handleKeyDownTempo}
                  autoFocus
                  style={{
                    background: "var(--bg-primary)",
                    border: "2px solid var(--duo-green-primary)",
                    borderRadius: "8px",
                    color: "var(--text-main)",
                    fontWeight: 900,
                    fontSize: "1.2em",
                    padding: "4px 12px",
                    width: "80px",
                    textAlign: "center",
                    outline: "none",
                  }}
                />
              ) : (
                <span
                  className={styles.timelineTimeDisplay}
                  onClick={iniciarEdicaoTempo}
                  style={{ cursor: "pointer" }}
                  title="Clique para editar o tempo"
                >
                  {segundosParaTempo(segundoAtual)}
                </span>
              )}
            </label>
            <div className={styles.timelineControls}>
              <button
                className={`btn-acao btn-config ${styles.timelineBtn}`}
                onClick={() => ajustarTempo(-1)}
              >
                -1s
              </button>
              <input
                type="range"
                min="0"
                max="2400"
                value={segundoAtual}
                onChange={handleRangeChange}
                className={styles.timelineRange}
                style={{ background: gerarGradienteBarra() }}
              />
              <button
                className={`btn-acao btn-config ${styles.timelineBtn}`}
                onClick={() => ajustarTempo(1)}
              >
                +1s
              </button>
            </div>
          </div>

          {/* RESERVAS */}
          <div className={styles.reservasContainer}>
            <h4 className={styles.reservasTitle}>
              🔄 Reservas (Clique para Substituir)
            </h4>
            <div className="lista-reservas">
              {jogadoresNoBanco.map((atleta) => (
                <div
                  key={atleta.id}
                  className="jogador"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    cursor: "pointer",
                  }}
                  onClick={() => handleReservaClick(atleta)}
                >
                  <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                    {atleta.nome.split(" ")[0]} ({atleta.numero_camisa})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HISTÓRICO DE LANCES */}
        <div className={styles.sidebar}>
          <h3 className={styles.historicoTitle}>📝 Últimos Lances</h3>
          <div className="duo-list" style={{ paddingRight: "5px" }}>
            {eventosFiltrados.length === 0 ? (
              <p
                style={{ color: "#aaa", fontSize: "14px", textAlign: "center" }}
              >
                {modoVisualizacao === "jogador" && !jogadorAtivo
                  ? "Selecione um jogador para ver seus lances."
                  : "Nenhum lance no banco de dados."}
              </p>
            ) : (
              [...eventosFiltrados].reverse().map((ev) => {
                let descricaoSub = "";
                if (ev.tipo_acao === "Substituição") {
                  const jogadorEntrou = todosJogadores.find(
                    (j) => j.id === ev.jogador_entrou_id,
                  );
                  const nomeEntrou = jogadorEntrou
                    ? jogadorEntrou.nome.split(" ")[0]
                    : "?";
                  descricaoSub = `${ev.nome_atleta?.split(" ")[0]} saiu 🔄 ${nomeEntrou} entrou`;
                }
                return (
                  <div
                    key={ev.id}
                    className={`item-historico ${styles.historicoItem} ${ev.tipo_acao === "Substituição" ? styles.historicoItemSub : ""}`}
                    onClick={() => handleCliqueHistorico(ev)}
                  >
                    <div>
                      <strong
                        style={{
                          color:
                            ev.tipo_acao === "Gol"
                              ? "var(--duo-yellow)"
                              : ev.tipo_acao === "Passe Certo"
                                ? "var(--duo-blue)"
                                : ev.tipo_acao === "Passe Errado"
                                  ? "var(--duo-red)"
                                  : ev.tipo_acao === "Substituição"
                                    ? "white"
                                    : ev.tipo_acao === "Finalização"
                                      ? "var(--duo-purple)"
                                      : "var(--duo-orange)",
                        }}
                      >
                        {ev.tipo_acao === "Substituição"
                          ? "🔄 SUBSTITUIÇÃO"
                          : ev.nome_atleta?.split(" ")[0]}
                      </strong>
                      <div className={styles.historicoItemAcao}>
                        {ev.tipo_acao === "Substituição"
                          ? descricaoSub
                          : ev.tipo_acao}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                      }}
                    >
                      <span className={styles.historicoItemTempo}>
                        ⏱ {ev.minuto_video}
                      </span>
                      {ev.tipo_acao === "Substituição" ? (
                        <button
                          className="btn-excluir"
                          style={{ marginTop: "5px" }}
                          onClick={(e) => deletarLance(e, ev)}
                        >
                          🗑️
                        </button>
                      ) : (
                        <button
                          className="btn-excluir"
                          style={{ marginTop: "5px" }}
                          onClick={(e) => abrirModalEdicao(e, ev)}
                        >
                          ⚙️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modais */}
      {modalSub.visivel && (
        <div className={`gaveta-overlay ${styles.modalOverlay}`}>
          <div
            className={`duo-modal modal-centralizado ${styles.modalContent}`}
          >
            <h4 className={styles.modalTitle}>🔄 Substituição</h4>
            <p className={styles.modalText}>
              Substituir aos <strong>{segundosParaTempo(segundoAtual)}</strong>?
              <br />
              <br />
              <span style={{ color: "var(--duo-red)" }}>
                Sai: {jogadorAtivo?.nome.split(" ")[0]}
              </span>
              <br />
              <span style={{ color: "var(--duo-green-primary)" }}>
                Entra: {modalSub.nomeEntrando.split(" ")[0]}
              </span>
            </p>
            <div className={styles.modalBotoesColuna}>
              <button
                className="btn-acao btn-duo-primary"
                onClick={confirmarSubstituicao}
              >
                Confirmar
              </button>
              <button
                className="btn-cancelar"
                onClick={() =>
                  setModalSub({
                    visivel: false,
                    idSaindo: null,
                    idEntrando: null,
                    nomeEntrando: "",
                  })
                }
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalDomino.visivel && (
        <div className={`gaveta-overlay ${styles.modalOverlay}`}>
          <div
            className={`duo-modal modal-centralizado ${styles.modalContent} ${styles.modalDominó}`}
          >
            <h4 className={styles.modalDominóTitle}>⚠️ Atenção Crítica</h4>
            <p className={styles.modalDominóText}>
              Cancelar esta substituição causará um{" "}
              <strong>Efeito Dominó!</strong>
              <br />
              <br />O jogador que entrou (e seus possíveis substitutos)
              realizaram{" "}
              <span style={{ color: "var(--duo-orange)", fontWeight: "bold" }}>
                {modalDomino.qtdExtras} ações
              </span>{" "}
              no future.
              <br />
              <br />
              Se você apagar esta troca, todas essas ações sumirão da linha do
              tempo. Prosseguir?
            </p>
            <div className={styles.modalBotoesColuna}>
              <button
                className="btn-acao btn-duo-vermelho"
                onClick={confirmarDelecaoEmCascata}
              >
                Sim, Apagar Tudo
              </button>
              <button
                className="btn-cancelar"
                style={{ color: "#fff" }}
                onClick={() =>
                  setModalDomino({
                    visivel: false,
                    idsParaDeletar: [],
                    qtdExtras: 0,
                  })
                }
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEdicao.visivel && (
        <div className={`gaveta-overlay ${styles.modalOverlay}`}>
          <div
            className={`duo-modal modal-centralizado ${styles.modalContent}`}
          >
            <h4 className={styles.modalTitle}>⚙️ Opções do Lance</h4>
            <div className={styles.edicaoFormGroup}>
              <label className={styles.edicaoLabel}>Alterar Ação:</label>
              <select
                className={styles.edicaoSelect}
                value={modalEdicao.tipoAcao}
                onChange={(e) =>
                  setModalEdicao({ ...modalEdicao, tipoAcao: e.target.value })
                }
              >
                <option value="Passe Certo">Passe Certo</option>
                <option value="Passe Errado">Passe Errado</option>
                <option value="Interceptação">Interceptação</option>
                <option value="Finalização">Finalização</option>
                <option value="Gol">Gol</option>
              </select>
              <label
                className={styles.edicaoLabel}
                style={{ marginTop: "15px" }}
              >
                Alterar Minuto (MM:SS):
              </label>
              <input
                type="text"
                className={styles.edicaoInput}
                value={modalEdicao.minutoVideo}
                onChange={(e) =>
                  setModalEdicao({
                    ...modalEdicao,
                    minutoVideo: e.target.value,
                  })
                }
              />
            </div>
            <div className={styles.modalBotoesColuna}>
              <button
                className="btn-acao btn-duo-primary"
                onClick={salvarEdicaoLance}
              >
                Salvar Alterações
              </button>
              <button
                className="btn-acao btn-duo-vermelho"
                onClick={(e) => deletarLance(e, modalEdicao.evento)}
              >
                Eliminar Lance
              </button>
              <button
                className="btn-cancelar"
                onClick={() =>
                  setModalEdicao({
                    visivel: false,
                    evento: null,
                    tipoAcao: "",
                    minutoVideo: "",
                  })
                }
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}