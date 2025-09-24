// src/App.js
import React, { useState, useEffect } from 'react';
import  shp  from 'shpjs';
import 'leaflet/dist/leaflet.css'
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import './components/styles/App.css'; // Importa nossos novos estilos

function App() {
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
  }
  const [layers, setLayers] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [valueRange, setValueRange] = useState([0, 0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shpResponse = await fetch('/Irrad.zip');
        const arrayBuffer = await shpResponse.arrayBuffer();
        const geojsonData = await shp(arrayBuffer);

        const choroplethLayer = {
          id: 'choropleth-mg', name: 'Mapa de Calor MG', data: geojsonData,
          visible: true, type: 'choropleth',
        };


        const brasilResponse = await fetch('/limite_brasil.geojson');
        const brasilData = await brasilResponse.json();
        const brasilLayer = {
          id: 'brasil-limite', name: 'Limite do Brasil', data: brasilData,
          visible: false, type: 'geojson',
        };
        
        setLayers([choroplethLayer, brasilLayer]);

        if (geojsonData.features?.length > 0) {
          const props = geojsonData.features[0].properties;
          const excludedAttributes = ['ID', 'LAT', 'LON'];
          const availableAttributes = Object.keys(props)
            .filter(key => 
              typeof props[key] === 'number' && !excludedAttributes.includes(key.toUpperCase())
            )
            .map(key => ({
              value: key, 
              label: ATTRIBUTE_MAP[key.toUpperCase()] || key // O rótulo amigável, ex: "Janeiro"
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
      />
    </div>
  );
}

export default App;