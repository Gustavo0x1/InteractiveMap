import React from 'react';
import './styles/SelectionInfo.css';

function SelectionInfo({ selectedFeatures, layers, onClose }) {
  if (!selectedFeatures || Object.keys(selectedFeatures).length === 0) {
    return null;
  }

  const getLayerName = (layerId) => {
    const layer = layers.find(l => l.id === layerId);
    return layer ? layer.name : layerId;
  };

  const getFeatureProperties = (properties) => {
    const ignoreProps = ['id', 'name', 'description', 'ID', 'LAT', 'LON', 'municipios'];
    return Object.entries(properties)
      .filter(([key]) => !ignoreProps.includes(key))
      .map(([key, value]) => (
        <div key={key}>
          <span className="info-key">{key}:</span>
          <span className="info-value">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
        </div>
      ));
  };

  // Removido o <Draggable>, agora é apenas uma div.
  return (
    <div className="selection-info">
      <div className="selection-info-header">
        <h3>Informações da Seleção</h3>
        <button onClick={onClose} className="close-button">&times;</button>
      </div>
      <div className="selection-info-content">
        {Object.entries(selectedFeatures).map(([layerId, features]) => (
          <div key={layerId} className="layer-info">
            <h4>{getLayerName(layerId)}</h4>
            <ul>
              {features.map((feature, index) => (
                <li key={index}>
                  <strong>{feature.properties.name || `Feature ${index + 1}`}</strong>
                  <div className="feature-properties">
                    {getFeatureProperties(feature.properties)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SelectionInfo;