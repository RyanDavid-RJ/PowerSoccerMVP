import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Registrando componentes do ChartJS para o modal
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Elenco() {
  const [atletas, setAtletas] = useState([]);
  // Estados do formulário de CADASTRO
  const [nome, setNome] = useState('');
  const [numero, setNumero] = useState('');
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [atletaSelecionado, setAtletaSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false); // Alterna entre Ver Status / Editar

  // Estados do formulário de EDIÇÃO
  const [editNome, setEditNome] = useState('');
  const [editNumero, setEditNumero] = useState('');
  const [editFoto, setEditFoto] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const carregarElenco = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/atletas');
      const data = await response.json();
      setAtletas(data);
    } catch (error) {
      console.error("Erro ao buscar atletas:", error);
    }
  }, []);

  useEffect(() => {
    const buscarDados = async () => {
      await carregarElenco();
    };
    buscarDados();
  }, [carregarElenco]);

  // Abre o modal em modo de visualização (Raio-X)
  const abrirPerfil = (atleta) => {
    setAtletaSelecionado(atleta);
    setModoEdicao(false);
    
    // Prepara os campos de edição caso o usuário clique em editar
    setEditNome(atleta.nome);
    setEditNumero(atleta.numero_camisa);
    setEditFoto(null);
    
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setAtletaSelecionado(null);
  };

  // --- Função de CADASTRO ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('numero_camisa', numero);
    if (foto) formData.append('foto', foto);

    try {
      const response = await fetch('http://localhost:3000/api/atletas', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Erro no servidor');

      alert("Atleta cadastrado com sucesso!");
      setNome('');
      setNumero('');
      setFoto(null);
      document.getElementById('foto-atleta').value = '';
      carregarElenco();
    } catch (error) {
      console.error("Erro completo:", error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Função de EDIÇÃO ---
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoadingEdit(true);

    const formData = new FormData();
    formData.append('nome', editNome);
    formData.append('numero_camisa', editNumero);
    if (editFoto) formData.append('foto', editFoto);

    try {
      const response = await fetch(`http://localhost:3000/api/atletas/${atletaSelecionado.id}`, {
        method: 'PUT',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Erro ao editar');

      alert("Atleta atualizado com sucesso!");
      carregarElenco();
      fecharModal();
    } catch (error) {
      console.error("Erro completo:", error);
      alert("Erro ao editar: " + error.message);
    } finally {
      setLoadingEdit(false);
    }
  };

  // Dados fictícios para o Gráfico de Evolução (Em breve virão do banco!)
  const dadosGraficoMock = {
    labels: ['Jogo 1', 'Jogo 2', 'Jogo 3', 'Jogo 4'],
    datasets: [
      { label: 'Gols', data: [0, 1, 0, 2], borderColor: '#ffc800', backgroundColor: '#ffc800', tension: 0.1 },
      { label: 'Passes Certos', data: [15, 22, 18, 25], borderColor: '#1cb0f6', backgroundColor: '#1cb0f6', tension: 0.1 },
      { label: 'Passes Errados', data: [3, 1, 4, 2], borderColor: '#ff4b4b', backgroundColor: '#ff4b4b', tension: 0.1 },
      { label: 'Interceptações', data: [2, 5, 3, 4], borderColor: '#ff9600', backgroundColor: '#ff9600', tension: 0.1 }
    ]
  };

  const opcoesGrafico = {
    responsive: true,
    plugins: { legend: { labels: { color: '#aaa', font: { size: 10 } } } },
    scales: { 
      x: { ticks: { color: '#aaa' }, grid: { color: '#444' } },
      y: { ticks: { color: '#aaa' }, grid: { color: '#444' } }
    }
  };

  return (
    <>
      <Header userName="Treinador" showBackButton={true} />
      
      <div className="elenco-layout">
        <div>
          <h2>Nosso <span className="cor-duo">Elenco</span></h2>
          <div className="grid-jogadores spacing-top">
            {atletas.map((atleta) => (
              <div key={atleta.id} className="card-atleta" onClick={() => abrirPerfil(atleta)}>
                {atleta.foto ? (
                  <div className="foto-grande" style={{ backgroundImage: `url(${atleta.foto})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' }}></div>
                ) : (
                  <div className="foto-grande">{atleta.nome.charAt(0)}</div>
                )}
                <h4>{atleta.nome}</h4>
                <small>Camisa {atleta.numero_camisa}</small>
              </div>
            ))}
          </div>
        </div>

        {/* --- Formulário de Cadastro na direita --- */}
        <div className="duo-container">
          <h3>Cadastrar <span className="cor-duo">Atleta</span></h3>
          <form onSubmit={handleSubmit} className="spacing-top">
            <input type="text" className="form-input" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <input type="number" className="form-input" placeholder="Camisa" value={numero} onChange={(e) => setNumero(e.target.value)} required style={{margin: '10px 0'}} />
            <input type="file" id="foto-atleta" className="form-input" accept="image/*" onChange={(e) => setFoto(e.target.files[0])} />
            <button type="submit" className="btn-acao btn-duo-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Atleta'}
            </button>
          </form>
        </div>
      </div>

      {/* --- MODAL DO JOGADOR --- */}
      {modalAberto && atletaSelecionado && (
        <div className="gaveta-overlay" style={{ display: 'block' }} onClick={fecharModal}>
          <div className="duo-modal modal-perfil modal-centralizado" style={{ width: '90%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', zIndex: 1000 }} onClick={e => e.stopPropagation()}>
            
            {/* Cabeçalho do Modal */}
            <div className="perfil-header" style={{ justifyContent: 'center', borderBottom: 'none', paddingBottom: '0' }}>
               {atletaSelecionado.foto ? (
                  <div className="foto-grande" style={{ width: '60px', height: '60px', backgroundImage: `url(${atletaSelecionado.foto})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' }}></div>
                ) : (
                  <div className="foto-grande" style={{ width: '60px', height: '60px' }}>{atletaSelecionado.nome.charAt(0)}</div>
               )}
               <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0 }}>{atletaSelecionado.nome}</h3>
                  <span className="cor-duo" style={{ fontWeight: 'bold', fontSize: '14px', backgroundColor: 'var(--input-bg)', padding: '2px 8px', borderRadius: '10px' }}>Camisa {atletaSelecionado.numero_camisa}</span>
               </div>
            </div>

            <hr style={{ borderColor: 'var(--border-ui)', margin: '15px 0' }}/>

            {/* CONTEÚDO DO MODAL (Alterna entre Raio-X e Formulário de Edição) */}
            {!modoEdicao ? (
              <>
                <h4 style={{textAlign: 'center', marginBottom: '15px'}}>📊 Raio-X (Médias Fictícias)</h4>
                <div className="perfil-kpis" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <div className="kpi-mini"><h5>Média Gols</h5><div className="val" style={{color: 'var(--duo-yellow)'}}>0.8</div></div>
                  <div className="kpi-mini"><h5>Passes Certos</h5><div className="val" style={{color: 'var(--duo-blue)'}}>18.5</div></div>
                </div>
                
                <div style={{ backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '12px', marginBottom: '20px' }}>
                    <Line data={dadosGraficoMock} options={opcoesGrafico} height={150} />
                </div>

                <div className="modal-botoes-coluna">
                  <button className="btn-acao btn-duo-azul" onClick={() => setModoEdicao(true)}>✏️ Editar Dados do Atleta</button>
                  <button className="btn-cancelar" onClick={fecharModal}>Fechar Perfil</button>
                </div>
              </>
            ) : (
              <>
                <h4 style={{textAlign: 'center', marginBottom: '15px'}}>✏️ Editar Dados</h4>
                <form onSubmit={handleEditSubmit}>
                  <div className="form-grupo">
                    <label className="form-label">Nome do Atleta</label>
                    <input type="text" className="form-input" value={editNome} onChange={(e) => setEditNome(e.target.value)} required />
                  </div>
                  <div className="form-grupo">
                    <label className="form-label">Número da Camisa</label>
                    <input type="number" className="form-input" value={editNumero} onChange={(e) => setEditNumero(e.target.value)} required />
                  </div>
                  <div className="form-grupo">
                    <label className="form-label">Substituir Foto (Opcional)</label>
                    <input type="file" className="form-input" accept="image/*" onChange={(e) => setEditFoto(e.target.files[0])} />
                  </div>
                  
                  <div className="modal-botoes-coluna" style={{ marginTop: '20px' }}>
                    <button type="submit" className="btn-acao btn-duo-green" disabled={loadingEdit} style={{ backgroundColor: 'var(--duo-green-primary)', color: 'white' }}>
                      {loadingEdit ? 'Salvando...' : 'Salvar Modificações'}
                    </button>
                    <button type="button" className="btn-cancelar" onClick={() => setModoEdicao(false)}>Cancelar Edição</button>
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