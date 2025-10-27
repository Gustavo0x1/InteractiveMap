import React, { useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { scaleSequential } from 'd3-scale';
import { interpolateYlOrRd } from 'd3-scale-chromatic';
import Legend from './Legend';
import 'leaflet-draw/dist/leaflet.draw.css';

const styleChoropleth = (feature, colorScale, selectedAttribute) => {
  const value = feature.properties[selectedAttribute];
  return {
    fillColor: typeof value === 'number' ? colorScale(value) : '#ccc',
    weight: 0,
    fillOpacity: 0.8,
  };
};

function MapComponent({ layers, selectedAttribute, valueRange, onAreaSelect }) {
  const drawnItemsRef = useRef();

  const colorScale = useMemo(() => {
    if (!valueRange || typeof valueRange[0] !== 'number' || typeof valueRange[1] !== 'number') {
      return () => '#ccc';
    }
    if (valueRange[0] === valueRange[1]) {
      return () => interpolateYlOrRd(0.5);
    }
    return scaleSequential(valueRange, interpolateYlOrRd);
  }, [valueRange]);

  const choroplethIsVisible = layers.some(l => l.type === 'choropleth' && l.visible);

  const handleCreate = (e) => {
    const drawnPolygon = e.layer.toGeoJSON();
    console.log("Drawn polygon GeoJSON:", drawnPolygon); // Debug: Verifique a estrutura

    // Envia o polígono para análise no componente App
    onAreaSelect(drawnPolygon);

    // Opcional: Limpa após 500ms para evitar múltiplos polígonos (ajuste ou remova)
    if (drawnItemsRef.current) {
      setTimeout(() => {
        drawnItemsRef.current.clearLayers();
      }, 500);
    }
  };

  return (
    <div className="map-wrapper">
      <MapContainer center={[-18.91, -44.55]} zoom={6} style={{ height: '100%', width: '100%' }} preferCanvas={true}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />

        {/* Grupo para desenhos do usuário */}
        <FeatureGroup ref={drawnItemsRef}>
          <EditControl
            position="topright"
            onCreated={handleCreate}
            draw={{
              rectangle: true,
              polygon: true,
              circle: false,
              marker: false,
              polyline: false,
              circlemarker: false,
            }}
            edit={{ remove: false }} // Desativa exclusão manual para controle via código
          />
        </FeatureGroup>

        {/* Renderiza camadas visíveis */}
        {layers.filter(layer => layer.visible).map(layer => (
          <GeoJSON
            key={`${layer.id}-${selectedAttribute}`}
            data={layer.data}
            style={(feature) =>
              layer.type === 'choropleth'
                ? styleChoropleth(feature, colorScale, selectedAttribute)
                : { color: '#0000ff', weight: 2, fillOpacity: 0.3 }
            }
          />
        ))}

        {choroplethIsVisible && <Legend colorScale={colorScale} valueRange={valueRange} />}
      </MapContainer>
    </div>
  );
}

export default MapComponent;