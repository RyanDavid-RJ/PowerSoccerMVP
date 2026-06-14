import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { apiGet, apiPost } from '../services/api';
import toast from 'react-hot-toast';

export default function NovaPartida() {
  const navigate = useNavigate();
  
  // Dados da Partida
  const [adversario, setAdversario] = useState('');
  const [dataJogo, setDataJogo] = useState(new Date().toISOString().split('T')[0]);
  
  // Lógica de Escalação (Power Soccer: 4 e 4)
  const [elenco, setElenco] = useState([]);
  const [titulares, setTitulares] = useState([null, null, null, null]);
  const [reservas, setReservas] = useState([null, null, null, null]);
  
  // Controle da Gaveta e Modais
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const [slotAtivo, setSlotAtivo] = useState({ tipo: '', index: -1 });
  const [loading, setLoading] = useState(false);

  // Controle do Modal de Camisa
  const [modalCamisa, setModalCamisa] = useState(false);
  const [jogadorTemp, setJogadorTemp] = useState(null);
  const [camisaTemp, setCamisaTemp] = useState('');

  useEffect(() => {
    const carregarElenco = async () => {
      try {
        const data = await apiGet('/atletas');
        setElenco(data);
      } catch (error) {
        console.error("Erro ao buscar elenco:", error);
        toast.error("Erro ao carregar elenco. Tente novamente.");
      }
    };
    carregarElenco();
  }, []);

  const abrirGaveta = (tipo, index) => {
    setSlotAtivo({ tipo, index });
    setGavetaAberta(true);
  };

  const iniciarSelecaoJogador = (jogador) => {
    setJogadorTemp(jogador);
    setCamisaTemp(jogador.numero_camisa); // Sugere a camisa padrão dele
    setGavetaAberta(false);
    setModalCamisa(true);
  };

  const confirmarCamisa = (e) => {
    e.preventDefault();
    const jogadorFinal = { ...jogadorTemp, numero_camisa: camisaTemp };

    if (slotAtivo.tipo === 'titular') {
      const novos = [...titulares];
      novos[slotAtivo.index] = jogadorFinal;
      setTitulares(novos);
    } else {
      const novos = [...reservas];
      novos[slotAtivo.index] = jogadorFinal;
      setReservas(novos);
    }

    setModalCamisa(false);
    setJogadorTemp(null);
  };

  // Impede que um jogador seja escalado duas vezes
  const jogadoresDisponiveis = elenco.filter((jogador) => {
    const taNosTitulares = titulares.some((t) => t && t.id === jogador.id);
    const taNosReservas = reservas.some((r) => r && r.id === jogador.id);
    return !taNosTitulares && !taNosReservas;
  });

  const iniciarPartida = async (e) => {
    e.preventDefault();
    
    if (titulares.some(t => t === null) || reservas.some(r => r === null)) {
      toast.error("Preencha todos os 8 jogadores (Titulares e Reservas) para iniciar.");
      return;
    }

    setLoading(true);

    const dadosPartida = {
      data_jogo: dataJogo,
      adversario: adversario,
      escalacao: { titulares, reservas }
    };

    try {
      const result = await apiPost('/partidas', dadosPartida);
      toast.success("Partida criada com sucesso! Redirecionando...");
      navigate(`/scout/${result.id_partida}`);
    } catch (error) {
      console.error("Erro:", error);
      toast.error(`Erro ao iniciar a partida: ${error.message || "Tente novamente."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header showBackButton={true} />
      
      <div className="config-container" style={{ maxWidth: '600px', backgroundColor: 'var(--bg-secondary)', padding: '30px', borderRadius: '16px', marginTop: '30px', boxShadow: 'var(--shadow-duo)' }}>
        <h2 className="text-center" style={{ marginBottom: '20px' }}>Nova <span className="cor-duo">Partida</span></h2>
        
        <form onSubmit={iniciarPartida}>
          <div className="form-grupo">
            <label className="form-label">Data e Hora</label>
            <input type="date" className="form-input" value={dataJogo} onChange={(e) => setDataJogo(e.target.value)} required />
          </div>
          <div className="form-grupo" style={{ marginBottom: '30px' }}>
            <label className="form-label">Adversário</label>
            <input type="text" className="form-input" placeholder="Ex: Flamengo" value={adversario} onChange={(e) => setAdversario(e.target.value)} required />
          </div>

          {/* Titulares */}
          <h4 style={{ color: 'var(--duo-blue)', marginBottom: '15px' }}>👥 Titulares (Escolha 4)</h4>
          <div className="slots-grid">
            {titulares.map((atleta, index) => (
              <div key={`t-${index}`} className={`slot ${atleta ? 'preenchido' : ''}`} onClick={() => abrirGaveta('titular', index)}>
                {atleta ? (
                   <>
                     {atleta.foto ? <div className="slot-foto" style={{ backgroundImage: `url(${atleta.foto})`, backgroundSize: 'cover' }}></div> : <div className="slot-foto">{atleta.nome.charAt(0)}</div>}
                     <span className="slot-nome">{atleta.nome.split(' ')[0]}</span>
                   </>
                ) : (
                   <><div className="slot-foto" style={{ backgroundColor: 'transparent', border: '2px dashed #666' }}>+</div><span className="slot-nome">Adicionar</span></>
                )}
              </div>
            ))}
          </div>

          {/* Reservas */}
          <h4 style={{ color: '#aaa', marginTop: '20px', marginBottom: '15px' }}>🔄 Reservas (Obrigatório)</h4>
          <div className="slots-grid">
            {reservas.map((atleta, index) => (
              <div key={`r-${index}`} className={`slot ${atleta ? 'preenchido' : ''}`} onClick={() => abrirGaveta('reserva', index)}>
                {atleta ? (
                   <>
                     {atleta.foto ? <div className="slot-foto" style={{ backgroundImage: `url(${atleta.foto})`, backgroundSize: 'cover' }}></div> : <div className="slot-foto">{atleta.nome.charAt(0)}</div>}
                     <span className="slot-nome">{atleta.nome.split(' ')[0]}</span>
                   </>
                ) : (
                   <><div className="slot-foto" style={{ backgroundColor: 'transparent', border: '2px dashed #666' }}>+</div><span className="slot-nome">Adicionar</span></>
                )}
              </div>
            ))}
          </div>

          <button type="submit" className="btn-acao btn-duo-primary spacing-top" style={{ width: '100%', fontSize: '18px', padding: '15px' }} disabled={loading}>
            {loading ? 'Carregando...' : 'Começar Coleta 🎯'}
          </button>
        </form>
      </div>

      {/* Gaveta de Seleção */}
      {gavetaAberta && (
        <>
          <div className="gaveta-overlay" style={{ display: 'block' }} onClick={() => setGavetaAberta(false)}></div>
          <div className="gaveta aberta">
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Selecione o Jogador</h3>
            <div className="duo-list">
              {jogadoresDisponiveis.map(jogador => (
                <div key={jogador.id} className="jogador-item" onClick={() => iniciarSelecaoJogador(jogador)} style={{ backgroundColor: 'var(--input-bg)' }}>
                  {jogador.foto ? <div className="foto" style={{ backgroundImage: `url(${jogador.foto})`, backgroundSize: 'cover' }}></div> : <div className="foto">{jogador.nome.charAt(0)}</div>}
                  <div style={{ flex: 1 }}><strong>{jogador.nome}</strong></div>
                  <span className="cor-duo">Camisa {jogador.numero_camisa}</span>
                </div>
              ))}
            </div>
            <button className="btn-cancelar" onClick={() => setGavetaAberta(false)}>Cancelar</button>
          </div>
        </>
      )}

      {/* Modal de Camisa */}
      {modalCamisa && jogadorTemp && (
        <>
          <div className="gaveta-overlay" style={{ display: 'block', zIndex: 1001 }}></div>
          <div className="duo-modal modal-centralizado" style={{ zIndex: 1002, padding: '30px', backgroundColor: '#333' }}>
            <h4 style={{ textAlign: 'center', color: 'white', marginBottom: '15px' }}>👕 Número da Camisa</h4>
            <p style={{ textAlign: 'center', color: '#ccc', fontSize: '14px' }}>Defina a camisa de {jogadorTemp.nome.split(' ')[0]}:</p>
            <form onSubmit={confirmarCamisa}>
              <input type="number" className="form-input text-center" style={{ fontSize: '24px', margin: '15px 0' }} value={camisaTemp} onChange={(e) => setCamisaTemp(e.target.value)} required autoFocus />
              <button type="submit" className="btn-acao btn-duo-primary" style={{ width: '100%' }}>Confirmar</button>
              <button type="button" className="btn-cancelar" onClick={() => setModalCamisa(false)}>Cancelar</button>
            </form>
          </div>
        </>
      )}
    </>
  );
}