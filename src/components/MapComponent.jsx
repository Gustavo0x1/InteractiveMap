import React, { useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { scaleSequential } from 'd3-scale';
import { interpolateYlOrRd } from 'd3-scale-chromatic';
import Legend from './Legend';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';

// 1. FUNÇÃO DE TOOLTIP ATUALIZADA
const createTooltipContent = (properties, selectedAttribute, layerType) => {
  const name = properties.name || properties.Name || properties.NOME || 'Irradiação';
  let content = `<strong class="tooltip-title">${name}</strong><hr class="tooltip-hr">`;
  content += '<div class="tooltip-grid">';
  
  let dataFound = false;

  // Lógica para camadas de dados (Choropleth)
  if (layerType === 'choropleth') {
    // Tenta encontrar o atributo selecionado
    if (selectedAttribute && properties[selectedAttribute] !== undefined) {
      let value = properties[selectedAttribute];
      
      // Formatação de números
      if (typeof value === 'number') {
         // Se for muito grande ou decimal, formata. Se for ano (ex: 2024), deixa inteiro.
         value = Number.isInteger(value) ? value : value.toFixed(2);
      }

      console.log(properties)
      if(selectedAttribute == "ANNUAL"){

        content += `<span class="tooltip-key">Anual:</span><span class="tooltip-value">${value} (kWh/m²/dia)</span>`;
      }else{

        content += `<span class="tooltip-key">${selectedAttribute}:</span><span class="tooltip-value">${value} </span>`;
      }
      dataFound = true;
    }
  } 

  else {
    const ignoreProps = [
      'id', 'name', 'description', 'ID', 'LAT', 'LON', 
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'ANNUAL', 
      'municipios', 'icon_url', 'icon_size', 'icon_anchor'
    ];
    
    for (const key in properties) {
      if (!ignoreProps.includes(key) && Object.prototype.hasOwnProperty.call(properties, key)) {
        let value = properties[key];
        if (typeof value === 'number' && !Number.isInteger(value)) value = value.toFixed(2);
        
        dataFound = true;
      }
    }
    content += `<span class="tooltip-value">Clique para mais informações</span>`;
  }

  // Fallback (se não achou dados ou atributo selecionado)
  if (!dataFound) {
     if (layerType === 'choropleth') {
        // Se tem dados de irradiação anual (camada base), mostra com a unidade correta
        if (properties.ANNUAL !== undefined) { 
           content += `<span class="tooltip-key">Irradiação:</span><span class="tooltip-value">${properties.ANNUAL.toFixed(2)} <small>kWh/m²/dia</small></span>`;
        } else {
           // Debug opcional
           // console.log("Propriedades disponíveis:", properties);
           content += `<span style="grid-column: span 2; font-style: italic; color: #666;">(Selecione um atributo no painel lateral)</span>`;
        }
     } else {
        return `<strong class="tooltip-title">${name}</strong><br>Sem dados adicionais.`;
     }
  }

  content += '</div>';
  return content;
};

function MapComponent({ layers, selectedAttribute, valueRange, onAreaSelect, selectedFeatures, onPolygonClick, onFeatureClick, selectedFeatureData}) {
  const drawnItemsRef = useRef();

  const colorScale = useMemo(() => {
    if (!valueRange || typeof valueRange[0] !== 'number') return () => '#ccc';
    return scaleSequential(valueRange, interpolateYlOrRd);
  }, [valueRange]);

const styleChoropleth = (feature, colorScale, selectedAttribute) => {
    const value = feature.properties[selectedAttribute];
    const isSelected = selectedFeatureData === feature.properties;
const baseColor = typeof value === 'number' ? colorScale(value) : '#ccc';
  return {
      fillColor: baseColor,
      fillOpacity: 0.8, // Opacidade do interior
      color: isSelected ? '#1f1' : baseColor, 
      
      // Mantemos uma borda fina (weight: 1) justamente para cobrir o gap entre polígonos
      weight: isSelected ? 4: 1, // 4px para destaque, 1px para correção visual
      
      opacity: 1, // Opacidade da borda total
      dashArray: '', // Removemos o pontilhado para ficar sólido e liso
    };
  };

  const choroplethIsVisible = layers.some(l => l.type === 'choropleth' && l.visible);

  const handleCreate = (e) => {
    const layer = e.layer;
    if (drawnItemsRef.current) drawnItemsRef.current.clearLayers();
    drawnItemsRef.current.addLayer(layer);
    onAreaSelect(layer.toGeoJSON());
    layer.on('click', (event) => { L.DomEvent.stopPropagation(event); onPolygonClick(); });
  };

  const createPointToLayer = (layerConfig) => {
    return (feature, latlng) => {
     if (layerConfig.type === 'point_icon') {
        const iconUrl = feature.properties.icon_url || layerConfig.iconUrl;
        const iconSize = feature.properties.icon_size || layerConfig.iconSize || [25, 41];
        const iconAnchor = feature.properties.icon_anchor || layerConfig.iconAnchor || [iconSize[0]/2, iconSize[1]];
        
        return L.marker(latlng, { 
            icon: L.icon({ iconUrl, iconSize, iconAnchor, className: 'cooperativa-icon' }) 
        });
      }
      return L.marker(latlng);
    };
  };

  return (
    <div className="map-wrapper">
      <MapContainer center={[-18.91, -44.55]} zoom={6} zoomControl={false} style={{ height: '100%', width: '100%' }} preferCanvas={true}>
         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />

        <FeatureGroup ref={drawnItemsRef}>
          <EditControl position="topright" onCreated={handleCreate} 
            draw={{ rectangle: false, polygon: true, circle: false, marker: false, polyline: false, circlemarker: false }} 
            edit={{ remove: true }} 
          />
        </FeatureGroup>

        {layers.filter(layer => layer.visible).map(layer => {
          
          const onEachFeatureHandler = (feature, layerInstance) => {
            if (feature.properties) {
              const tooltipContent = createTooltipContent(
                feature.properties, 
                selectedAttribute, // Passa o atributo atual
                layer.type
              );
              layerInstance.bindTooltip(tooltipContent, { sticky: true, className: 'custom-leaflet-tooltip' });
            }
            layerInstance.on('click', (e) => {
              L.DomEvent.stopPropagation(e);
              onFeatureClick(feature.properties);
            });
          };

          if (layer.type === 'point_circle' || layer.type === 'point_icon') {
            return <GeoJSON key={layer.id} data={layer.data} pointToLayer={createPointToLayer(layer)} onEachFeature={onEachFeatureHandler} />;
          }

        if (layer.type === 'choropleth') {
            return (
              <GeoJSON
                // DICA: Não é necessário mudar a 'key' aqui se o React Leaflet estiver atualizado.
                // A prop 'style' reativa já deve cuidar da atualização visual.
                key={`${layer.id}-${selectedAttribute}`} 
                data={layer.data}
                
                // O estilo será recalculado sempre que o componente renderizar (ao clicar)
                style={(feature) => styleChoropleth(feature, colorScale, selectedAttribute)}
                
                onEachFeature={onEachFeatureHandler}
              />
            );
          }

          if (layer.type === 'geojson') {
              return <GeoJSON key={layer.id} data={layer.data} onEachFeature={onEachFeatureHandler} style={{ weight: 2, color: '#777', fillOpacity: 0 }} />;
          }
          
          return null;
        })}

        { /* choroplethIsVisible && <Legend colorScale={colorScale} valueRange={valueRange} /> */} 
      </MapContainer>
    </div>
  );
}

export default MapComponent;