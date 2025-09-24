// src/Sidebar.js
import React from 'react';

function Sidebar({ layers, attributes, selectedAttribute, onToggleLayer, onAttributeChange }) {
  const choroplethLayer = layers.find(l => l.type === 'choropleth');
  const choroplethIsVisible = choroplethLayer && choroplethLayer.visible;

  return (
    <div className="sidebar">
      <h2 style={{color:'black'}}>Controles</h2>
      
      <h4>Camadas</h4>
      {layers.map((layer) => (
        <div key={layer.id} className="layer-item">
          <input
            type="checkbox"
            id={`layer-${layer.id}`}
            checked={layer.visible}
            onChange={() => onToggleLayer(layer.id)}
          />
          <label htmlFor={`layer-${layer.id}`} style={{ marginLeft: '8px' }}>
            {layer.name}
          </label>
        </div>
      ))}

      {choroplethIsVisible && (
        <div className="choropleth-controls">
          <label htmlFor="attribute-select">Visualizar por:</label>
          <select 
            id="attribute-select"
            value={selectedAttribute} 
            onChange={onAttributeChange}
          >
   
            {attributes.map(attr => (
              <option key={attr.value} value={attr.value}>
                {attr.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default Sidebar;