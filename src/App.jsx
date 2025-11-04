import React, { useState, useEffect, useCallback } from 'react';
import * as turf from '@turf/turf';
import shp from 'shpjs';
import Papa from 'papaparse';
import 'leaflet/dist/leaflet.css';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import './components/styles/App.css';
import SelectionInfo from './components/SelectionInfo';

const createLayerFromCSV = async (layerInfo, municipiosGeoJSON) => {
  try {
    console.log(`[${layerInfo.name}] Iniciando carregamento...`);
    const response = await fetch(layerInfo.path);
    if (!response.ok) {
      throw new Error(`Falha ao buscar ${layerInfo.path} - Status ${response.status}`);
    }
    const csvText = await response.text();

    const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    
    const customData = results.data;
 
    const keyField = results.meta.fields[0]; 

    const dataMap = new Map();
    customData.forEach(row => {
      const normalizedName = row[keyField]?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      if (normalizedName) {
        dataMap.set(normalizedName, row);
      }
    });

    const newFeatures = municipiosGeoJSON.features.map(feature => {
      const geojsonName = feature.properties.name;
      const normalizedGeojsonName = geojsonName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      const matchingData = dataMap.get(normalizedGeojsonName);

      if (matchingData) {
        const newProperties = { ...feature.properties };
        for (const key in matchingData) {
          const value = parseFloat(matchingData[key]);
        
          newProperties[key] = isNaN(value) ? matchingData[key] : value;
        }
        return { ...feature, properties: newProperties };
      }
      return null;
    }).filter(Boolean);

    console.log(`[${layerInfo.name}] Feições unidas: ${newFeatures.length}`);

    if (newFeatures.length > 0) {
 
      const customExcluded = ['id', 'name', 'description'];
      

      const layerAttributes = results.meta.fields
        .filter(key =>
      
          !customExcluded.includes(key) &&
          key.toLowerCase() !== keyField.toLowerCase()
        )
        .map(key => ({ value: key, label: key }));
      
      console.log(`[${layerInfo.name}] Atributos encontrados (${layerAttributes.length}):`, layerAttributes.map(a => a.value));

      return {
        id: layerInfo.id,
        name: layerInfo.name,
        data: { type: "FeatureCollection", features: newFeatures },
        visible: false,
        type: 'choropleth',
        attributes: layerAttributes,
      };
    }
    return null;
  } catch (error) {
    console.error(`Erro ao carregar a camada ${layerInfo.name}:`, error);
    return null;
  }
};

function App() {
  const [layers, setLayers] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [valueRange, setValueRange] = useState([0, 0]);
  const [selectedFeatures, setSelectedFeatures] = useState({});
const [infoPaneVisible, setInfoPaneVisible] = useState(false);
  const ATTRIBUTE_MAP = {
    JAN: 'Janeiro', FEB: 'Fevereiro', MAR: 'Março', APR: 'Abril', MAY: 'Maio', JUN: 'Junho',
    JUL: 'Julho', AUG: 'Agosto', SEP: 'Setembro', OCT: 'Outubro', NOV: 'Novembro', DEC: 'Dezembro', ANNUAL: 'Anual',
  };

const handleAreaSelect = useCallback((drawnPolygon) => {
    if (!drawnPolygon?.geometry || !drawnPolygon.geometry.coordinates?.length) {
      console.error("Polígono desenhado é inválido:", drawnPolygon);
      return;
    }

    const selectionPolygon = turf.polygon(drawnPolygon.geometry.coordinates);

    console.log("Analisando a área selecionada...");

    const visibleLayers = layers.filter(l => l.visible);
    const selectedByLayer = {};

layers.forEach(layer => {
      if (!layer?.data?.features) return;
      const featuresInside = [];
      layer.data.features.forEach(feature => {
        try {
          if (feature?.geometry && turf.booleanIntersects(drawnPolygon, feature)) {
            featuresInside.push(feature);
          }
        } catch (e) {

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
      console.log("--- Iniciando carregamento de todos os dados ---");
      try {
 
        const shpResponse = await fetch('/Irrad.zip');
        const arrayBuffer = await shpResponse.arrayBuffer();
        const geojsonData = await shp(arrayBuffer);
        
        const shpProps = geojsonData.features[0].properties;
        const baseExcluded = ['ID', 'LAT', 'LON'];
        const shpAttributes = Object.keys(shpProps)
          .filter(key => typeof shpProps[key] === 'number' && !baseExcluded.includes(key.toUpperCase()))
          .map(key => ({ value: key, label: ATTRIBUTE_MAP[key.toUpperCase()] || key }));

        const choroplethLayer = {
          id: 'choropleth-mg', name: 'Mapa de Calor MG', data: geojsonData,
          visible: true, type: 'choropleth', attributes: shpAttributes,
        };

        const brasilResponse = await fetch('/limite_brasil.geojson');
        const brasilData = await brasilResponse.json();
        const brasilLayer = {
          id: 'brasil-limite', name: 'Limite do Brasil', data: brasilData,
          visible: false, type: 'geojson',
        };

        let initialLayers = [choroplethLayer, brasilLayer];
        
        const municipiosResponse = await fetch('/mg-municipios.geojson');
        const municipiosGeoJSON = await municipiosResponse.json();
        const manifestResponse = await fetch('/data/manifest.json');
        const manifest = await manifestResponse.json();

        const customLayerPromises = manifest.layers.map(layerInfo =>
          createLayerFromCSV(layerInfo, municipiosGeoJSON)
        );
        const loadedCustomLayers = (await Promise.all(customLayerPromises)).filter(Boolean);
        initialLayers = [...initialLayers, ...loadedCustomLayers];

        setLayers(initialLayers);
        console.log("Todas as camadas foram carregadas no estado:", initialLayers);

      } catch (error) {
        console.error("Erro ao carregar as camadas:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const activeLayer = layers.find(l => l.visible && l.type === 'choropleth');

    if (activeLayer && activeLayer.attributes) {
      console.log(`Camada ativa mudou para: "${activeLayer.name}". Atualizando atributos.`);
      setAttributes(activeLayer.attributes);
      

      setSelectedAttribute(activeLayer.attributes[0]?.value || '');
    } else {

      setAttributes([]);
      setSelectedAttribute('');
    }
  }, [layers]); 

  useEffect(() => {
    const visibleChoropleth = layers.find(l => l.visible && l.type === 'choropleth');
    
    if (!visibleChoropleth || !selectedAttribute) {
      setValueRange([0, 0]);
      return;
    }

    const values = visibleChoropleth.data.features
      .map(feature => feature.properties[selectedAttribute])
      .filter(value => typeof value === 'number'); 
    
    if (values.length > 0) {
      setValueRange([Math.min(...values), Math.max(...values)]);
    } else {
    
      setValueRange([0, 0]);
    }
  }, [layers, selectedAttribute]); 


  const toggleLayerVisibility = (layerId) => {
    setLayers(prevLayers =>
      prevLayers.map(l => {
 
        if (l.id === layerId) {
          return { ...l, visible: !l.visible };
        }
  
        if (l.type === 'choropleth') {
          return { ...l, visible: false };
        }

        return l;
      })
    );
  };
const handlePolygonClick = () => {
  console.log("clkc")
    if (Object.keys(selectedFeatures).length > 0) {
      setInfoPaneVisible(true);
    }
  };

  const closeInfoPane = () => {
    setInfoPaneVisible(false);
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
      
      {/* 3. Renderiza o painel aqui, se estiver visível */}
      {infoPaneVisible && (
        <SelectionInfo
          selectedFeatures={selectedFeatures}
          layers={layers}
          onClose={closeInfoPane}
        />
      )}

      <MapComponent
        layers={layers}
        selectedAttribute={selectedAttribute}
        valueRange={valueRange}
        onAreaSelect={handleAreaSelect}
        selectedFeatures={selectedFeatures}
        onPolygonClick={handlePolygonClick} // Passa a função para o MapComponent
      />
    </div>
  );
}

export default App;