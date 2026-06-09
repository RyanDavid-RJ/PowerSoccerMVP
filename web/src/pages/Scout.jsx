import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";

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

  const [modalAcao, setModalAcao] = useState({ visivel: false, x: 0, y: 0 });
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
        const [resPartida, resEventos, resAtletas] = await Promise.all([
          fetch(`http://localhost:3000/api/partidas/${id}`),
          fetch(`http://localhost:3000/api/eventos/partida/${id}`),
          fetch(`http://localhost:3000/api/atletas`),
        ]);

        if (!resPartida.ok) throw new Error("Partida não encontrada");
        const dataPartida = await resPartida.json();
        setPartida(dataPartida);

        const dataEventos = await resEventos.json();
        const eventosOrdenados = ordenarEventosCronologicamente(dataEventos);
        setEventos(eventosOrdenados);

        const dataAtletas = await resAtletas.json();

        const escalacao =
          typeof dataPartida.escalacao === "string"
            ? JSON.parse(dataPartida.escalacao)
            : dataPartida.escalacao;

        // 🔥 Enriquecer usando os dados locais (dataAtletas) – NÃO o estado atletas!
        const enriquecer = (lista) => {
          if (!lista) return [];
          return lista.map((item) => {
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
        alert("Erro ao carregar a prancheta.");
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

  // ========== AÇÕES NO CAMPO ==========
  const handleCampoClick = (e) => {
    if (!jogadorAtivo)
      return alert("Selecione um jogador na lateral esquerda antes!");
    if (!estaEmQuadra(jogadorAtivo.id, segundoAtual))
      return alert(`${jogadorAtivo.nome} está no banco neste minuto!`);
    const minutoVideo = segundosParaTempo(segundoAtual);
    if (eventos.some((ev) => ev.minuto_video === minutoVideo))
      return alert("Segundo Ocupado! Avance ou recue o tempo em 1s.");
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setModalAcao({ visivel: true, x, y });
  };

  const registrarAcao = async (tipoAcao) => {
    if (!estaEmQuadra(jogadorAtivo.id, segundoAtual)) {
      alert(
        `ERRO: ${jogadorAtivo.nome} não está em quadra neste minuto! Ação cancelada.`,
      );
      return;
    }

    const periodo = segundoAtual <= 1200 ? "1º Tempo" : "2º Tempo";

    const payload = {
      partida_id: parseInt(id),
      atleta_id: jogadorAtivo.id,
      usuario_id: 4,
      minuto_video: segundosParaTempo(segundoAtual),
      tipo_acao: tipoAcao,
      coord_x: modalAcao.x.toFixed(2),
      coord_y: modalAcao.y.toFixed(2),
      periodo: periodo,
    };

    try {
      const res = await fetch("http://localhost:3000/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Falha ao salvar lance");
      await carregarDadosDaAPI();
      setModalAcao({ visivel: false, x: 0, y: 0 });
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar ação no banco de dados.");
    }
  };

  // ========== SUBSTITUIÇÕES ==========
  const handleReservaClick = (reserva) => {
    if (!jogadorAtivo)
      return alert(
        "Selecione um jogador titular (na lateral esquerda) para fazer a troca.",
      );

    const eventosFuturosDoJogador = eventos.filter(
      (ev) =>
        ev.atleta_id === jogadorAtivo.id &&
        tempoParaSegundos(ev.minuto_video) > segundoAtual,
    );
    if (eventosFuturosDoJogador.length > 0) {
      alert(
        `Este jogador possui lances no futuro. Apague os lances dele que ocorrem após ${segundosParaTempo(segundoAtual)} antes de substituí-lo no passado.`,
      );
      return;
    }

    const minutoVideo = segundosParaTempo(segundoAtual);
    if (eventos.some((ev) => ev.minuto_video === minutoVideo))
      return alert(
        "Segundo Ocupado! Avance ou recue o tempo em 1s antes de substituir.",
      );

    setModalSub({
      visivel: true,
      idSaindo: jogadorAtivo.id,
      idEntrando: reserva.id,
      nomeEntrando: reserva.nome,
    });
  };

  const confirmarSubstituicao = async () => {
    if (!estaEmQuadra(modalSub.idSaindo, segundoAtual)) {
      alert(
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
      alert(
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
      alert(
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
      usuario_id: 4,
      minuto_video: segundosParaTempo(segundoAtual),
      tipo_acao: "Substituição",
      coord_x: null,
      coord_y: null,
    };

    try {
      const res = await fetch("http://localhost:3000/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro na sub");
      await carregarDadosDaAPI();
      setModalSub({
        visivel: false,
        idSaindo: null,
        idEntrando: null,
        nomeEntrando: "",
      });
      setJogadorAtivo(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao registrar substituição.");
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
      await fetch(`http://localhost:3000/api/eventos/${lanceClicado.id}`, {
        method: "DELETE",
      });
      if (modalEdicao.visivel && modalEdicao.evento?.id === lanceClicado.id)
        setModalEdicao({
          visivel: false,
          evento: null,
          tipoAcao: "",
          minutoVideo: "",
        });
      await carregarDadosDaAPI();
    } catch (e) {
      console.error(e);
      alert("Erro ao deletar.");
    }
  };

  const confirmarDelecaoEmCascata = async () => {
    try {
      await Promise.all(
        modalDomino.idsParaDeletar.map((idEv) =>
          fetch(`http://localhost:3000/api/eventos/${idEv}`, {
            method: "DELETE",
          }),
        ),
      );
      await carregarDadosDaAPI();
      setModalDomino({ visivel: false, idsParaDeletar: [], qtdExtras: 0 });
    } catch (e) {
      console.error(e);
      alert("Erro crítico ao apagar lances em cascata.");
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
    if (!formatoValido)
      return alert("O tempo deve estar no formato MM:SS (Ex: 14:30)");
    const novoSegundo = tempoParaSegundos(modalEdicao.minutoVideo);
    if (novoSegundo > 2400) return alert("O tempo máximo permitido é 40:00.");
    const ocupado = eventos.some(
      (ev) =>
        tempoParaSegundos(ev.minuto_video) === novoSegundo &&
        ev.id !== modalEdicao.evento.id,
    );
    if (ocupado)
      return alert(
        "Já existe outro lance marcado neste exato segundo. Escolha outro tempo.",
      );
    try {
      const res = await fetch(
        `http://localhost:3000/api/eventos/${modalEdicao.evento.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo_acao: modalEdicao.tipoAcao,
            minuto_video: modalEdicao.minutoVideo,
          }),
        },
      );
      if (!res.ok) throw new Error("Falha ao editar");
      await carregarDadosDaAPI();
      setModalEdicao({
        visivel: false,
        evento: null,
        tipoAcao: "",
        minutoVideo: "",
      });
      setSegundoAtual(novoSegundo);
    } catch (e) {
      console.error(e);
      alert("Erro ao editar lance no banco de dados.");
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
      alert("Este jogador estava no banco neste momento.");
      const jogadoresNaQuadra = obterJogadoresEmQuadraNoSegundo(novoSegundo);
      if (jogadoresNaQuadra.length > 0) setJogadorAtivo(jogadoresNaQuadra[0]);
    }
    setSegundoAtual(novoSegundo);
  };

  // Função de recarga (exposta)
  const carregarDadosDaAPI = async () => {
    try {
      const [resPartida, resEventos, resAtletas] = await Promise.all([
        fetch(`http://localhost:3000/api/partidas/${id}`),
        fetch(`http://localhost:3000/api/eventos/partida/${id}`),
        fetch(`http://localhost:3000/api/atletas`),
      ]);
      if (!resPartida.ok) throw new Error("Partida não encontrada");
      const dataPartida = await resPartida.json();
      setPartida(dataPartida);

      const dataEventos = await resEventos.json();
      const eventosOrdenados = ordenarEventosCronologicamente(dataEventos);
      setEventos(eventosOrdenados);

      const dataAtletas = await resAtletas.json();

      const escalacao =
        typeof dataPartida.escalacao === "string"
          ? JSON.parse(dataPartida.escalacao)
          : dataPartida.escalacao;

      const enriquecer = (lista) => {
        if (!lista) return [];
        return lista.map((item) => {
          const completo = dataAtletas.find((a) => a.id === item.id);
          return completo ? { ...item, ...completo } : item;
        });
      };

      setTitularesIniciais(enriquecer(escalacao.titulares));
      setReservasIniciais(enriquecer(escalacao.reservas));
    } catch (e) {
      console.error("Erro no carregamento:", e);
      alert("Erro ao carregar a prancheta.");
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

  // ========== RENDER ==========
  return (
    <>
      <Header userName="Treinador" showBackButton={false} />

      <div
        style={{
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>
          PowerSoccer <span className="cor-duo">vs {partida.adversario}</span>
        </h3>
        <button
          className="btn-acao btn-duo-vermelho"
          onClick={() => navigate("/nova-partida")}
          style={{ padding: "8px 15px" }}
        >
          Sair da Partida
        </button>
      </div>

      <div className="layout-principal">
        {/* TITULARES (em quadra) */}
        <div className="titulares duo-container">
          <h3 style={{ color: "var(--duo-blue)", marginBottom: "15px" }}>
            ⚽ Em Quadra
          </h3>
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

        {/* PRANCHETA + LINHA DO TEMPO + RESERVAS */}
        <div className="area-campo">
          {/* TOGGLE DE VISUALIZAÇÃO + INDICADORES DE PERÍODO */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <div style={{ display: "flex", gap: "10px", marginRight: "100px" }}>
              <button
                className={`btn-acao ${modoVisualizacao === "time" ? "btn-duo-primary" : "btn-config"}`}
                onClick={() => setModoVisualizacao("time")}
                style={{ padding: "5px 15px", fontSize: "14px" }}
              >
                🏟️ Visão Time
              </button>
              <button
                className={`btn-acao ${modoVisualizacao === "jogador" ? "btn-duo-primary" : "btn-config"}`}
                onClick={() => setModoVisualizacao("jogador")}
                style={{ padding: "5px 15px", fontSize: "14px" }}
                disabled={!jogadorAtivo}
              >
                👤 Visão Jogador
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", marginLeft: "100px" }}>
              <div
                className={`btn-acao ${segundoAtual <= 1200 ? "btn-duo-primary" : "btn-config"}`}
                style={{
                  padding: "5px 15px",
                  fontSize: "14px",
                  cursor: "default",
                  pointerEvents: "none",
                  opacity: 0.9,
                }}
              >
                1º Tempo
              </div>
              <div
                className={`btn-acao ${segundoAtual > 1200 ? "btn-duo-primary" : "btn-config"}`}
                style={{
                  padding: "5px 15px",
                  fontSize: "14px",
                  cursor: "default",
                  pointerEvents: "none",
                  opacity: 0.9,
                }}
              >
                2º Tempo
              </div>
            </div>
          </div>

          {/* CAMPO SVG */}
          <div
            className="campo-container duo-container"
            style={{
              backgroundColor: "var(--duo-green-primary)",
              border: "4px solid white",
              position: "relative",
            }}
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
                  title={`${ev.nome_atleta} - ${ev.tipo_acao}`}
                />
              );
            })}

            {modalAcao.visivel && (
              <div
                style={{
                  position: "absolute",
                  left: `${modalAcao.x}%`,
                  top: `${modalAcao.y}%`,
                  backgroundColor: "var(--bg-secondary)",
                  padding: "10px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
                  transform: "translate(-50%, -110%)",
                  zIndex: 20,
                  display: "flex",
                  gap: "5px",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="btn-acao btn-duo-blue"
                  style={{ padding: "8px", fontSize: "12px" }}
                  onClick={() => registrarAcao("Passe Certo")}
                >
                  Passe ✓
                </button>
                <button
                  className="btn-acao btn-duo-vermelho"
                  style={{ padding: "8px", fontSize: "12px" }}
                  onClick={() => registrarAcao("Passe Errado")}
                >
                  Passe ✗
                </button>
                <button
                  className="btn-acao btn-duo-amarelo"
                  style={{ padding: "8px", fontSize: "12px", color: "black" }}
                  onClick={() => registrarAcao("Gol")}
                >
                  GOL ⚽
                </button>
                <button
                  className="btn-acao btn-duo-roxo"
                  style={{ padding: "8px", fontSize: "12px", color: "white" }}
                  onClick={() => registrarAcao("Finalização")}
                >
                  Chute
                </button>
                <button
                  className="btn-acao btn-duo-laranja"
                  style={{ padding: "8px", fontSize: "12px" }}
                  onClick={() => registrarAcao("Interceptação")}
                >
                  Roubo
                </button>
                <button
                  className="btn-acao"
                  style={{
                    padding: "8px",
                    fontSize: "12px",
                    background: "#333",
                    color: "white",
                  }}
                  onClick={() => setModalAcao({ visivel: false, x: 0, y: 0 })}
                >
                  X
                </button>
              </div>
            )}
          </div>

          {/* LINHA DO TEMPO */}
          <div
            className="linha-tempo-container duo-card"
            style={{ width: "100%", marginTop: "15px" }}
          >
            <label
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              ⏱️ Tempo de Jogo:
              <span
                style={{
                  color: "var(--text-main)",
                  fontWeight: 900,
                  fontSize: "1.2em",
                  background: "var(--bg-primary)",
                  padding: "4px 12px",
                  borderRadius: "8px",
                  border: "2px solid var(--border-ui)",
                }}
              >
                {segundosParaTempo(segundoAtual)}
              </span>
            </label>
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                marginTop: "15px",
              }}
            >
              <button
                className="btn-acao btn-config"
                style={{ width: "auto", padding: "5px 15px", margin: 0 }}
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
                style={{
                  flex: 1,
                  margin: 0,
                  background: gerarGradienteBarra(),
                }}
              />
              <button
                className="btn-acao btn-config"
                style={{ width: "auto", padding: "5px 15px", margin: 0 }}
                onClick={() => ajustarTempo(1)}
              >
                +1s
              </button>
            </div>
          </div>

          {/* RESERVAS */}
          <div className="reservas duo-container" style={{ width: "100%" }}>
            <h4 style={{ color: "#aaa", margin: "0 0 10px 0" }}>
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
        <div className="historico duo-container">
          <h3
            style={{ color: "var(--duo-green-primary)", marginBottom: "15px" }}
          >
            📝 Últimos Lances
          </h3>
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
                    className="item-historico"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      cursor: "pointer",
                      borderLeft:
                        ev.tipo_acao === "Substituição"
                          ? "4px solid white"
                          : "none",
                    }}
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
                      <div style={{ fontSize: "12px", color: "#ccc" }}>
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
                      <span style={{ fontSize: "12px", color: "#888" }}>
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

      {/* Modais - mantidos inalterados (já estão no final) */}
      {modalSub.visivel && (
        <div
          className="gaveta-overlay"
          style={{ display: "block", zIndex: 1001 }}
        >
          <div
            className="duo-modal modal-centralizado"
            style={{
              zIndex: 1002,
              padding: "30px",
              backgroundColor: "var(--bg-secondary)",
            }}
          >
            <h4
              style={{
                color: "var(--text-main)",
                textAlign: "center",
                marginBottom: "15px",
              }}
            >
              🔄 Substituição
            </h4>
            <p style={{ textAlign: "center", margin: "15px 0", color: "#ccc" }}>
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
            <div className="modal-botoes-coluna">
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
        <div
          className="gaveta-overlay"
          style={{ display: "block", zIndex: 1001 }}
        >
          <div
            className="duo-modal modal-centralizado"
            style={{
              zIndex: 1002,
              padding: "30px",
              backgroundColor: "#333",
              border: "3px solid var(--duo-red)",
            }}
          >
            <h4
              style={{
                color: "var(--duo-orange)",
                textAlign: "center",
                marginBottom: "15px",
              }}
            >
              ⚠️ Atenção Crítica
            </h4>
            <p
              style={{
                textAlign: "center",
                margin: "15px 0",
                color: "#fff",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              Cancelar esta substituição causará um{" "}
              <strong>Efeito Dominó!</strong>
              <br />
              <br />O jogador que entrou (e seus possíveis substitutos)
              realizaram{" "}
              <span style={{ color: "var(--duo-orange)", fontWeight: "bold" }}>
                {modalDomino.qtdExtras} ações
              </span>{" "}
              no futuro.
              <br />
              <br />
              Se você apagar esta troca, todas essas ações sumirão da linha do
              tempo. Prosseguir?
            </p>
            <div className="modal-botoes-coluna">
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
        <div
          className="gaveta-overlay"
          style={{ display: "block", zIndex: 1001 }}
        >
          <div
            className="duo-modal modal-centralizado"
            style={{
              zIndex: 1002,
              padding: "30px",
              backgroundColor: "var(--bg-secondary)",
            }}
          >
            <h4
              style={{
                color: "var(--text-main)",
                textAlign: "center",
                marginBottom: "15px",
              }}
            >
              ⚙️ Opções do Lance
            </h4>
            <div className="form-grupo">
              <label className="label-modal">Alterar Ação:</label>
              <select
                className="select-modal"
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
              <label className="label-modal" style={{ marginTop: "15px" }}>
                Alterar Minuto (MM:SS):
              </label>
              <input
                type="text"
                className="input-modal-padrao"
                value={modalEdicao.minutoVideo}
                onChange={(e) =>
                  setModalEdicao({
                    ...modalEdicao,
                    minutoVideo: e.target.value,
                  })
                }
              />
            </div>
            <div className="modal-botoes-coluna" style={{ marginTop: "20px" }}>
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
