import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { apiGet, apiPost } from '../services/api';
import toast from 'react-hot-toast';
import styles from './NovaPartida.module.css';

export default function NovaPartida() {
  const navigate = useNavigate();
  
  const [adversario, setAdversario] = useState('');
  const [dataJogo, setDataJogo] = useState(new Date().toISOString().split('T')[0]);
  
  const [elenco, setElenco] = useState([]);
  const [titulares, setTitulares] = useState([null, null, null, null]);
  const [reservas, setReservas] = useState([null, null, null, null]);
  
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const [slotAtivo, setSlotAtivo] = useState({ tipo: '', index: -1 });
  const [loading, setLoading] = useState(false);

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
    setCamisaTemp(jogador.numero_camisa);
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
      
      <div className={styles.container}>
        <h2 className={styles.title}>Nova <span className="cor-duo">Partida</span></h2>
        
        <form onSubmit={iniciarPartida}>
          <div className={styles.formGrupo}>
            <label className={styles.formLabel}>Data e Hora</label>
            <input type="date" className={styles.formInput} value={dataJogo} onChange={(e) => setDataJogo(e.target.value)} required />
          </div>
          <div className={styles.formGrupoAdversario}>
            <label className={styles.formLabel}>Adversário</label>
            <input type="text" className={styles.formInput} placeholder="Ex: Flamengo" value={adversario} onChange={(e) => setAdversario(e.target.value)} required />
          </div>

          {/* Titulares */}
          <h4 className={`${styles.sectionTitle} ${styles.sectionTitleTitulares}`}>👥 Titulares (Escolha 4)</h4>
          <div className={styles.slotsGrid}>
            {titulares.map((atleta, index) => (
              <div key={`t-${index}`} className={`${styles.slot} ${atleta ? styles.slotPreenchido : ''}`} onClick={() => abrirGaveta('titular', index)}>
                {atleta ? (
                   <>
                     {atleta.foto ? <div className={styles.slotFoto} style={{ backgroundImage: `url(${atleta.foto})`, backgroundSize: 'cover' }}></div> : <div className={styles.slotFoto}>{atleta.nome.charAt(0)}</div>}
                     <span className={styles.slotNome}>{atleta.nome.split(' ')[0]}</span>
                   </>
                ) : (
                   <><div className={`${styles.slotFoto} ${styles.slotFotoVazio}`}>+</div><span className={styles.slotNome}>Adicionar</span></>
                )}
              </div>
            ))}
          </div>

          {/* Reservas */}
          <h4 className={`${styles.sectionTitle} ${styles.sectionTitleReservas}`}>🔄 Reservas (Obrigatório)</h4>
          <div className={styles.slotsGrid}>
            {reservas.map((atleta, index) => (
              <div key={`r-${index}`} className={`${styles.slot} ${atleta ? styles.slotPreenchido : ''}`} onClick={() => abrirGaveta('reserva', index)}>
                {atleta ? (
                   <>
                     {atleta.foto ? <div className={styles.slotFoto} style={{ backgroundImage: `url(${atleta.foto})`, backgroundSize: 'cover' }}></div> : <div className={styles.slotFoto}>{atleta.nome.charAt(0)}</div>}
                     <span className={styles.slotNome}>{atleta.nome.split(' ')[0]}</span>
                   </>
                ) : (
                   <><div className={`${styles.slotFoto} ${styles.slotFotoVazio}`}>+</div><span className={styles.slotNome}>Adicionar</span></>
                )}
              </div>
            ))}
          </div>

          <button type="submit" className={`btn-acao btn-duo-primary ${styles.submitButton}`} disabled={loading}>
            {loading ? 'Carregando...' : 'Começar Coleta 🎯'}
          </button>
        </form>
      </div>

      {/* Gaveta de Seleção */}
      {gavetaAberta && (
        <>
          <div className={`gaveta-overlay ${styles.gavetaOverlay}`} onClick={() => setGavetaAberta(false)}></div>
          <div className={`gaveta aberta ${styles.gaveta}`}>
            <h3 className={styles.gavetaTitle}>Selecione o Jogador</h3>
            <div className="duo-list">
              {jogadoresDisponiveis.map(jogador => (
                <div key={jogador.id} className={styles.jogadorItem} onClick={() => iniciarSelecaoJogador(jogador)}>
                  {jogador.foto ? <div className={styles.jogadorItemFoto} style={{ backgroundImage: `url(${jogador.foto})`, backgroundSize: 'cover' }}></div> : <div className={styles.jogadorItemFoto}>{jogador.nome.charAt(0)}</div>}
                  <div className={styles.jogadorItemInfo}><strong>{jogador.nome}</strong></div>
                  <span className={styles.jogadorItemCamisa}>Camisa {jogador.numero_camisa}</span>
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
          <div className={`gaveta-overlay ${styles.gavetaOverlay}`} style={{ zIndex: 1001 }}></div>
          <div className={`duo-modal modal-centralizado ${styles.modalCamisa}`}>
            <h4 className={styles.modalCamisaTitle}>👕 Número da Camisa</h4>
            <p className={styles.modalCamisaTexto}>Defina a camisa de {jogadorTemp.nome.split(' ')[0]}:</p>
            <form onSubmit={confirmarCamisa}>
              <input type="number" className={styles.modalCamisaInput} value={camisaTemp} onChange={(e) => setCamisaTemp(e.target.value)} required autoFocus />
              <button type="submit" className="btn-acao btn-duo-primary" style={{ width: '100%' }}>Confirmar</button>
              <button type="button" className="btn-cancelar" onClick={() => setModalCamisa(false)}>Cancelar</button>
            </form>
          </div>
        </>
      )}
    </>
  );
}