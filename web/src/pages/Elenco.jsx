import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';

export default function Elenco() {
  const [atletas, setAtletas] = useState([]);
  const [nome, setNome] = useState('');
  const [numero, setNumero] = useState('');
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [modalAberto, setModalAberto] = useState(false);
  const [atletaSelecionado, setAtletaSelecionado] = useState(null);

  const carregarElenco = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/atletas');
      const data = await response.json();
      setAtletas(data);
    } catch (error) {
      console.error("Erro ao buscar atletas:", error);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    carregarElenco();
  }, [carregarElenco]);

  const abrirPerfil = (atleta) => {
    setAtletaSelecionado(atleta);
    setModalAberto(true);
  };

  const excluirAtleta = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Deseja realmente excluir este atleta?")) return;
    try {
      await fetch(`http://localhost:3000/api/atletas/${id}`, { method: 'DELETE' });
      setModalAberto(false);
      carregarElenco();
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('numero_camisa', numero);
    
    // IMPORTANTE: 'foto' aqui deve ser o mesmo nome que você usa no backend
    if (foto) {
        formData.append('foto', foto);
    }

    try {
      const response = await fetch('http://localhost:3000/api/atletas', {
        method: 'POST',
        body: formData, // NUNCA adicione Content-Type: multipart/form-data manualmente!
      });
      
      const responseText = await response.text();
      let data;
      try {
          data = JSON.parse(responseText);
      } catch (e) {
          throw new Error("Erro de servidor: " + responseText.substring(0, 50));
      }

      if (!response.ok) throw new Error(data.erro || 'Erro no servidor');

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

      {modalAberto && atletaSelecionado && (
        <div className="duo-modal modal-perfil modal-centralizado" style={{ zIndex: 1000, position: 'fixed' }}>
          <h3>Perfil: {atletaSelecionado.nome}</h3>
          <p>Número: {atletaSelecionado.numero_camisa}</p>
          <div className="modal-botoes-coluna">
            <button className="btn-acao btn-duo-vermelho" onClick={(e) => excluirAtleta(atletaSelecionado.id, e)}>Excluir Jogador</button>
            <button className="btn-cancelar" onClick={() => setModalAberto(false)}>Fechar</button>
          </div>
        </div>
      )}
    </>
  );
}
