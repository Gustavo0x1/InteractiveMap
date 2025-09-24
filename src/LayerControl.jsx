// src/LayerControl.js

import React from 'react';

// Estilos para o painel de controle
const controlPanelStyle = {
  position: 'absolute', top: '80px', right: '10px', zIndex: 1000,
  backgroundColor: 'white', padding: '10px', borderRadius: '5px',
  boxShadow: '0 0 10px rgba(0,0,0,0.2)', fontFamily: 'sans-serif',
};

const layerItemStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '5px',
};

const checkboxStyle = {
  marginRight: '8px',
};



function LayerControl({ layers, onToggle }) {
  return (
    <div style={controlPanelStyle}>
      <h4>Camadas</h4>
      {layers.map((layer) => (
        <div key={layer.id}>
          <input
            type="checkbox"
            checked={layer.visible}
            onChange={() => onToggle(layer.id)}
          />
          <label>{layer.name}</label>
        </div>
      ))}
    </div>
  );
}
export default LayerControl;