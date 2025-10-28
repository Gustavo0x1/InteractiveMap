import React from 'react';

// Remova onDataUpload dos parâmetros
function Sidebar({ layers, attributes, selectedAttribute, onToggleLayer, onAttributeChange }) {
  return (
    <div className="sidebar">
      <h2>Controle de Camadas</h2>
      <div className="layer-toggle">
        {layers.map(layer => (
          <div key={layer.id}>
            <input
              type="checkbox"
              id={layer.id}
              checked={layer.visible}
              onChange={() => onToggleLayer(layer.id)}
            />
            <label htmlFor={layer.id}>{layer.name}</label>
          </div>
        ))}
      </div>

      <div className="attribute-selector">
        <label htmlFor="attribute-select">Atributo:</label>
        <select id="attribute-select" value={selectedAttribute} onChange={onAttributeChange}>
          {attributes.map(attr => (
            <option key={attr.value} value={attr.value}>
              {attr.label}
            </option>
          ))}
        </select>
      </div>
      

    </div>
  );
}

export default Sidebar;