import React, { useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { scaleSequential } from 'd3-scale';
import { interpolateYlOrRd } from 'd3-scale-chromatic';
import Legend from './Legend';
import SelectionInfo from './SelectionInfo';
import 'leaflet-draw/dist/leaflet.draw.css';

const createTooltipContent = (properties) => {

  const ignoreProps = [
    'id', 'name', 'description',
    'ID', 'LAT', 'LON', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'ANNUAL', 
    'municipios' 
  ];

  const name = properties.name || 'Sem nome';

  let content = `<strong class="tooltip-title">${name}</strong><hr class="tooltip-hr">`;
  content += '<div class="tooltip-grid">';

  let dataFound = false;

  for (const key in properties) {

    if (!ignoreProps.includes(key) && Object.prototype.hasOwnProperty.call(properties, key)) {
      let value = properties[key];

      if (typeof value === 'number' && !Number.isInteger(value)) {
        value = value.toFixed(2);
      }

      if (value === '-' || value === null || value === undefined) {
        value = 'N/A';
      }
      

      content += `<span class="tooltip-key">${key}:</span><span class="tooltip-value">${value}</span>`;
      dataFound = true;
    }
  }

  if (!dataFound) {
     if (properties.ANNUAL) { 
        content += `<span class="tooltip-key">Irrad. Anual:</span><span class="tooltip-value">${properties.ANNUAL.toFixed(2)}</span>`;
     } else {
        return `<strong class="tooltip-title">${name}</strong><br>Sem dados adicionais.`;
     }
  }

  content += '</div>';
  return content;
};
function MapComponent({ layers, selectedAttribute, valueRange, onAreaSelect,selectedFeatures,onPolygonClick }) {
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
const styleChoropleth = (feature, colorScale, selectedAttribute) => {
  const value = feature.properties[selectedAttribute];
  return {
    fillColor: typeof value === 'number' ? colorScale(value) : '#ccc',
    weight: 0,
    fillOpacity: 0.8,
  };
};
  const choroplethIsVisible = layers.some(l => l.type === 'choropleth' && l.visible);

const handleCreate = (e) => {
    const drawnPolygonLayer = e.layer;
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
    }
    drawnItemsRef.current.addLayer(drawnPolygonLayer);
    onAreaSelect(drawnPolygonLayer.toGeoJSON());
    
    // 3. Ao clicar, apenas chama a função recebida por prop
    drawnPolygonLayer.on('click', (event) => {
      L.DomEvent.stopPropagation(event);
      onPolygonClick(); // Simplesmente notifica o componente pai
    });
  };
  const closeInfoPane = () => {
    setInfoPane({ ...infoPane, visible: false });
  };
const onEachFeature = (feature, layerInstance) => {
  if (feature.properties) {
    const tooltipContent = createTooltipContent(feature.properties);
    layerInstance.bindTooltip(tooltipContent, {
      sticky: true, 
      className: 'custom-leaflet-tooltip' 
    });
  }
};
return (
    <div className="map-wrapper">
      <MapContainer center={[-18.91, -44.55]} zoom={6} style={{ height: '100%', width: '100%' }} preferCanvas={true}>

         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />

        <FeatureGroup ref={drawnItemsRef}>
          <EditControl
            position="topright"
            onCreated={handleCreate}
            draw={{
              rectangle: false,
              polygon: true,
              circle: false,
              marker: false,
              polyline: false,
              circlemarker: false,
            }}
            edit={{ remove: true }}
          />
        </FeatureGroup>

        {layers.filter(layer => layer.visible).map(layer => (
          <GeoJSON
            key={`${layer.id}-${selectedAttribute}`}
            data={layer.data}
            style={(feature) =>
              layer.type === 'choropleth'
                ? styleChoropleth(feature, colorScale, selectedAttribute)
                : { color: '#0000ff', weight: 2, fillOpacity: 0.3 }
            }
            onEachFeature={onEachFeature}
          />
        ))}

        {choroplethIsVisible && <Legend colorScale={colorScale} valueRange={valueRange} />}
      </MapContainer>
      
  
    </div>
  );
}

export default MapComponent;