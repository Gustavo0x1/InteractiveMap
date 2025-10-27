import React, { useState, useEffect, useCallback } from 'react';
import * as turf from '@turf/turf';
import shp from 'shpjs';
import 'leaflet/dist/leaflet.css';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import './components/styles/App.css';

function App() {
  const [selectedFeatures, setSelectedFeatures] = useState({});
  const ATTRIBUTE_MAP = {
    JAN: 'Janeiro',
    FEB: 'Fevereiro',
    MAR: 'Março',
    APR: 'Abril',
    MAY: 'Maio',
    JUN: 'Junho',
    JUL: 'Julho',
    AUG: 'Agosto',
    SEP: 'Setembro',
    OCT: 'Outubro',
    NOV: 'Novembro',
    DEC: 'Dezembro',
    ANNUAL: 'Anual',
  };
  const [layers, setLayers] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [valueRange, setValueRange] = useState([0, 0]);

  const handleAreaSelect = useCallback((drawnPolygon) => {
    if (!drawnPolygon?.geometry || !drawnPolygon.geometry.coordinates?.length) {
      console.error("Polígono desenhado é inválido:", drawnPolygon);
      return;
    }

    console.log("Drawn polygon geometry type:", drawnPolygon.geometry.type);

    const visibleLayers = layers.filter(l => l.visible);
    const selectedByLayer = {};

    visibleLayers.forEach(layer => {
      if (!layer?.data?.features) {
        console.warn(`Camada ${layer.id} sem feições válidas.`);
        return;
      }

      if (layer.data.features[0]?.geometry) {
        console.log(`Geometria da camada ${layer.id}:`, layer.data.features[0].geometry.type);
      }

      const featuresInside = [];
      layer.data.features.forEach(feature => {
        if (
          feature?.geometry &&
          ['Point', 'MultiPoint', 'Polygon', 'MultiPolygon'].includes(feature.geometry.type) &&
          feature.geometry.coordinates?.length > 0
        ) {
          try {
            if (turf.booleanIntersects(drawnPolygon, feature)) {
              featuresInside.push(feature);
            }
          } catch (e) {
            console.warn(`Ignorando feição inválida na camada ${layer.id}:`, feature, e.message);
          }
        } else {
          console.warn(`Geometria inválida ou não suportada na camada ${layer.id}:`, feature?.geometry);
        }
      });

      if (featuresInside.length > 0) {
        selectedByLayer[layer.id] = featuresInside;
      }
    });

    console.log("Feições selecionadas por camada:", selectedByLayer);
    setSelectedFeatures(selectedByLayer);
  }, [layers]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shpResponse = await fetch('/Irrad.zip');
        const arrayBuffer = await shpResponse.arrayBuffer();
        const geojsonData = await shp(arrayBuffer);

        // Debug: Logar estrutura do GeoJSON
        console.log("Sample choropleth feature:", geojsonData.features[0]);

        const choroplethLayer = {
          id: 'choropleth-mg',
          name: 'Mapa de Calor MG',
          data: geojsonData,
          visible: true,
          type: 'choropleth',
        };

        const brasilResponse = await fetch('/limite_brasil.geojson');
        const brasilData = await brasilResponse.json();
        const brasilLayer = {
          id: 'brasil-limite',
          name: 'Limite do Brasil',
          data: brasilData,
          visible: false,
          type: 'geojson',
        };

        setLayers([choroplethLayer, brasilLayer]);

        if (geojsonData.features?.length > 0) {
          const props = geojsonData.features[0].properties;
          const excludedAttributes = ['ID', 'LAT', 'LON'];
          const availableAttributes = Object.keys(props)
            .filter(key => typeof props[key] === 'number' && !excludedAttributes.includes(key.toUpperCase()))
            .map(key => ({
              value: key,
              label: ATTRIBUTE_MAP[key.toUpperCase()] || key,
            }));

          setAttributes(availableAttributes);

          const defaultAttr = availableAttributes.find(attr => attr.value.toUpperCase() === 'ANUAL');
          setSelectedAttribute(defaultAttr ? defaultAttr.value : (availableAttributes[0]?.value || ''));
        }
      } catch (error) {
        console.error("Erro ao carregar as camadas:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const choroplethLayer = layers.find(l => l.type === 'choropleth');
    if (!choroplethLayer?.data || !selectedAttribute) return;
    const values = choroplethLayer.data.features
      .map(feature => feature.properties[selectedAttribute])
      .filter(value => typeof value === 'number');
    if (values.length > 0) {
      setValueRange([Math.min(...values), Math.max(...values)]);
    }
  }, [layers, selectedAttribute]);

  const toggleLayerVisibility = (layerId) => {
    setLayers(prevLayers =>
      prevLayers.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l)
    );
  };

  const handleAttributeChange = (event) => {
    setSelectedAttribute(event.target.value);
  };

  return (
    <div className="app-container">
      <Sidebar
        layers={layers}
        attributes={attributes}
        selectedAttribute={selectedAttribute}
        onToggleLayer={toggleLayerVisibility}
        onAttributeChange={handleAttributeChange}
      />
      <MapComponent
        layers={layers}
        selectedAttribute={selectedAttribute}
        valueRange={valueRange}
        onAreaSelect={handleAreaSelect}
      />
    </div>
  );
}

export default App;