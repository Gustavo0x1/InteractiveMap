import React from 'react';
import './styles/SelectionInfo.css'; // Vamos reusar o CSS do SelectionInfo

// Lista de propriedades que não queremos mostrar no painel
const IGNORE_PROPS = [
  'id', 'ID', 'LAT', 'LON', 'municipios', 
  'icon_url', 'icon_size', 'icon_anchor'
];

function FeatureInfoSidebar({ data, onClose }) {
  if (!data) return null;

  // Usa 'name' como título, ou 'Sem nome'
  const title = data.name || 'Informações da Feição';

  return (
    <div className="selection-info-pane">
      <div className="selection-info-header">
        <h3>{title}</h3>
        <button onClick={onClose} className="selection-info-close-btn">&times;</button>
      </div>
      <div className="selection-info-content">
        <div className="feature-details-list">
          {Object.entries(data).map(([key, value]) => {
            // Se a chave não estiver na lista de ignorados
            if (!IGNORE_PROPS.includes(key)) {
              // Formata o valor para exibição
              let displayValue = value;
              if (typeof displayValue === 'number' && !Number.isInteger(displayValue)) {
                displayValue = displayValue.toFixed(2);
              }
              if (displayValue === null || displayValue === undefined || displayValue === '-') {
                displayValue = 'N/A';
              }

              return (
                <div key={key} className="feature-detail-item">
                  <strong>{key}:</strong>
                  <span>{String(displayValue)}</span>
                </div>
              );
            }
            return null; // Ignora a propriedade
          })}
        </div>
      </div>
    </div>
  );
}

export default FeatureInfoSidebar;