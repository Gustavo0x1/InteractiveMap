import React, { useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { scaleSequential } from 'd3-scale';
import { interpolateYlOrRd } from 'd3-scale-chromatic';
import Legend from './Legend';
import SelectionInfo from './SelectionInfo';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';

const createTooltipContent = (properties, selectedAttribute, layerType) => {
  // ... (Sua função de tooltip idêntica à da resposta anterior) ...
  const name = properties.name || 'Sem nome';
  let content = `<strong class="tooltip-title">${name}</strong><hr class="tooltip-hr">`;
  content += '<div class="tooltip-grid">';
  
  let dataFound = false;

  if (layerType === 'choropleth') {
    if (selectedAttribute && Object.prototype.hasOwnProperty.call(properties, selectedAttribute)) {
      let value = properties[selectedAttribute];
      
      if (typeof value === 'number' && !Number.isInteger(value)) {
        value = value.toFixed(2);
      }
      if (value === '-' || value === null || value === undefined) {
        value = 'N/A';
      }
      
      content += `<span class="tooltip-key">${selectedAttribute}:</span><span class="tooltip-value">${value}</span>`;
      dataFound = true;
    }
  } 
  else {
    const ignoreProps = [
      'id', 'name', 'description',
      'ID', 'LAT', 'LON', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'ANNUAL', 
      'municipios',
      'icon_url', // <-- Adicione 'icon_url' para não aparecer no tooltip
    'icon_size',   // <-- ADICIONE AQUI
      'icon_anchor'  // <-- ADICIONE AQUI (vamos implementar no próximo passo)
    ];
    
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
  }

  if (!dataFound) {
     if (layerType === 'choropleth') {
        if (properties.ANNUAL) { 
           content += `<span class="tooltip-key">Irrad. Anual:</span><span class="tooltip-value">${properties.ANNUAL.toFixed(2)}</span>`;
        } else {
           content += `<span>(Selecione um atributo no painel)</span>`;
        }
     } else {
        return `<strong class="tooltip-title">${name}</strong><br>Sem dados adicionais.`;
     }
  }

  content += '</div>';
  return content;
};


function MapComponent({ layers, selectedAttribute, valueRange, onAreaSelect, selectedFeatures, onPolygonClick, onFeatureClick }) { // <-- 1. Adicione onFeatureClick
  const drawnItemsRef = useRef();

  // ... (colorScale, styleChoropleth, choroplethIsVisible, handleCreate - todos idênticos) ...
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
    
    drawnPolygonLayer.on('click', (event) => {
      L.DomEvent.stopPropagation(event);
      onPolygonClick(); 
    });
  };

  // --- MODIFICAÇÃO PRINCIPAL AQUI ---
  const createPointToLayer = (layerConfig) => {
    // A função interna (retornada) tem acesso à 'feature' individual
    return (feature, latlng) => {
      
      // CASO 1: Pontos Circulares (sem alteração)
     if (layerConfig.type === 'point_icon') {
        
        // URLs (lógica que já tínhamos)
        const defaultIconUrl = layerConfig.iconUrl || '...';
        const featureIconUrl = feature.properties.icon_url;
        const iconUrl = featureIconUrl || defaultIconUrl;
        
        // --- LÓGICA ATUALIZADA PARA TAMANHO ---
        // 1. Pega o tamanho PADRÃO (do manifest.json)
        const defaultIconSize = layerConfig.iconSize || [25, 41];
        // 2. Procura um tamanho específico NA FEATURE (do cooperativas.geojson)
        const featureIconSize = feature.properties.icon_size;
        // 3. Usa o tamanho da feature, ou o padrão se não existir
        const iconSize = featureIconSize || defaultIconSize;

        // --- BÔNUS: LÓGICA PARA ÂNCORA ---
        // (A âncora do ícone geralmente é a metade do tamanho)
        const defaultIconAnchor = layerConfig.iconAnchor || [iconSize[0] / 2, iconSize[1]];
        const featureIconAnchor = feature.properties.icon_anchor;
        const iconAnchor = featureIconAnchor || defaultIconAnchor;
        
        const customIcon = L.icon({
          iconUrl: iconUrl,
          iconSize: iconSize,
          iconAnchor: iconAnchor,
        className: 'cooperativa-icon'
        });
        
        return L.marker(latlng, { icon: customIcon });
      }

      // Fallback
      return L.marker(latlng);
    };
  };


  return (
    <div className="map-wrapper">
      <MapContainer center={[-18.91, -44.55]} zoom={6} zoomControl={false} style={{ height: '100%', width: '100%' }} preferCanvas={true}>

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

{layers.filter(layer => layer.visible).map(layer => {
          
  const onEachFeatureHandler = (feature, layerInstance) => {
    // 1. Tooltip (como estava)
    if (feature.properties) {
      const tooltipContent = createTooltipContent(
        feature.properties, 
        selectedAttribute,
        layer.type
      );
      layerInstance.bindTooltip(tooltipContent, {
        sticky: true, 
        className: 'custom-leaflet-tooltip' 
      });
    }

    // 2. Evento de Clique
    layerInstance.on('click', (e) => {
      L.DomEvent.stopPropagation(e); // Impede que o clique "vaze" para o mapa
      onFeatureClick(feature.properties); // Envia os dados da feature para o App.jsx
    });
  };

  // --- CORREÇÃO AQUI ---

  // CASO 1: CAMADAS DE PONTOS (ÍCONES OU CÍRCULOS)
  if (layer.type === 'point_circle' || layer.type === 'point_icon') {
    return (
      <GeoJSON
        key={layer.id}
        data={layer.data}
        pointToLayer={createPointToLayer(layer)} 
        onEachFeature={onEachFeatureHandler}
      />
    );
  }

  // CASO 2: CAMADAS DE POLÍGONOS (CHOROPLETH)
  // (Tanto o base 'choropleth-mg' quanto os CSVs 'choropleth')
  if (layer.type === 'choropleth') {
    return (
      <GeoJSON
        key={layer.id}
        data={layer.data}
        // Aplica o estilo dinâmico baseado no atributo selecionado
        style={(feature) => styleChoropleth(feature, colorScale, selectedAttribute)}
        onEachFeature={onEachFeatureHandler}
      />
    );
  }

  // CASO 3: CAMADAS GEOJSON PADRÃO (ex: 'limite_brasil')
  if (layer.type === 'geojson') {
      return (
        <GeoJSON
          key={layer.id}
          data={layer.data}
          // Adiciona o handler para clique/tooltip
          onEachFeature={onEachFeatureHandler}
          // Adiciona um estilo simples (borda) para camadas geojson
          style={{
            weight: 2,
            color: '#777',
            fillOpacity: 0
          }}
        />
      );
  }
  
  // Se não for nenhum tipo conhecido, não renderiza
  return null;
})}

        {choroplethIsVisible && <Legend colorScale={colorScale} valueRange={valueRange} />}
      </MapContainer>
    </div>
  );
}

export default MapComponent;