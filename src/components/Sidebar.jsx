// src/components/Sidebar.jsx
import React, { useState } from 'react';
import './styles/Sidebar.css';

function Sidebar({ layers, attributes, selectedAttribute, onToggleLayer, onAttributeChange }) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className={`floating-panel ${isMinimized ? 'minimized' : ''}`}>
      {/* Cabeçalho com botão de minimizar */}
      <div className="panel-header">
        <div className="header-title">
          <h2>Controles</h2>
          {!isMinimized && <span className="subtitle">Mapa Interativo</span>}
        </div>
        <button 
          className="minimize-btn" 
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? "Expandir" : "Minimizar"}
        >
          {isMinimized ? (
            // Ícone de Expandir (Setas para fora)
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          ) : (
            // Ícone de Minimizar (Traço ou setas para dentro)
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          )}
        </button>
      </div>

      {/* Conteúdo (oculto quando minimizado) */}
      {!isMinimized && (
        <div className="panel-content">
          <div className="sidebar-section">
            <h3>Camadas</h3>
            <div className="layer-list">
              {layers.map(layer => (
                <div key={layer.id} className="layer-item">
                  <span className="layer-label">{layer.name}</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      id={layer.id}
                      checked={layer.visible}
                      onChange={() => onToggleLayer(layer.id)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Filtros</h3>
            <div className="input-group">
              <label htmlFor="attribute-select" className="input-label">Visualizar por:</label>
              <div className="select-wrapper">
                <select 
                  id="attribute-select" 
                  value={selectedAttribute} 
                  onChange={onAttributeChange}
                  className="modern-select"
                >
                  {attributes.map(attr => (
                    <option key={attr.value} value={attr.value}>
                      {attr.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;