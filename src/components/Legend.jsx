// src/Legend.js

import React from 'react';

const legendStyle = {
  position: 'absolute',
  bottom: '30px',
  left: '10px',
  zIndex: 1000,
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  padding: '10px',
  borderRadius: '5px',
  boxShadow: '0 0 10px rgba(0,0,0,0.2)',
  fontFamily: 'sans-serif',
  fontSize: '14px',
};

const gradientStyle = {
  height: '20px',
  width: '200px',
  marginBottom: '5px',
};

const labelsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  width: '200px',
};

function Legend({ colorScale, valueRange }) {
  if (!colorScale || !valueRange || valueRange[0] === valueRange[1]) {
    return null; // Não renderiza a legenda se não houver dados
  }

  const [min, max] = valueRange;

  // Cria um gradiente linear para a barra de cores
  const gradient = `linear-gradient(to right, ${colorScale(min)}, ${colorScale(max)})`;

  return (
    <div style={legendStyle}>
      <strong>Valor</strong>
      <div style={{ ...gradientStyle, background: gradient }}></div>
      <div style={labelsStyle}>
        <span>{min.toFixed(2)}</span>
        <span>{max.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default Legend;