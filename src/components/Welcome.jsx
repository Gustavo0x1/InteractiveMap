import React from 'react';

// O componente recebe uma função para ser chamada ao iniciar
function Welcome({ onStart }) {
  return (
    <div className="welcome-container">
      <h1>Bem-vindo ao Mapa Interativo!</h1>
      <p>Explore as camadas de dados solares, cultivos e rebanhos da região de Minas Gerais.</p>
      <button onClick={onStart} className="start-button">
        Explorar o Mapa
      </button>
      
      <style>{`
        .welcome-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #f0f4f8; /* Cor de fundo clara */
          color: #333;
          text-align: center;
          z-index: 1000; /* Garante que fique acima de tudo */
        }
        .welcome-container h1 {
          font-size: 2.5em;
          color: #007bff; /* Cor primária */
        }
        .welcome-container p {
          font-size: 1.2em;
          margin-bottom: 40px;
        }
        .start-button {
          padding: 12px 24px;
          font-size: 1.1em;
          background-color: #28a745; /* Cor de sucesso */
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .start-button:hover {
          background-color: #218838;
        }
      `}</style>
    </div>
  );
}

export default Welcome;