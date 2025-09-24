// src/MapComponent.js
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { scaleSequential } from 'd3-scale';
import { interpolateYlOrRd } from 'd3-scale-chromatic';
import Legend from './Legend';

// A função de estilo para o mapa de calor não muda
const styleChoropleth = (feature, colorScale, selectedAttribute) => {
  const value = feature.properties[selectedAttribute];
  return {
    fillColor: typeof value === 'number' ? colorScale(value) : '#ccc',
    weight: 0,
    fillOpacity: 0.8,
  };
};

function MapComponent({ layers, selectedAttribute, valueRange }) {
  const colorScale = useMemo(() => {
    if (valueRange[0] === valueRange[1]) return () => interpolateYlOrRd(0.5);
    return scaleSequential(valueRange, interpolateYlOrRd);
  }, [valueRange]);

  const choroplethIsVisible = layers.some(l => l.type === 'choropleth' && l.visible);

  return (
    <div className="map-wrapper">
      <MapContainer center={[-18.91, -44.55]} zoom={6} style={{ height: '100%', width: '100%' }} preferCanvas={true}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
        
        {layers.filter(layer => layer.visible).map(layer => (
          <GeoJSON
            key={`${layer.id}-${selectedAttribute}`} // Chave mais robusta
            data={layer.data}
            style={(feature) => 
              layer.type === 'choropleth'
                ? styleChoropleth(feature, colorScale, selectedAttribute)
                : { color: '#0000ff', weight: 2 }
            }
          />
        ))}
        
        {choroplethIsVisible && <Legend colorScale={colorScale} valueRange={valueRange} />}
      </MapContainer>
    </div>
  );
}

export default MapComponent;