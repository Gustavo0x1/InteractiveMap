import React, { useState, useEffect, useCallback } from 'react';
import * as turf from '@turf/turf';
import shp from 'shpjs';
import Papa from 'papaparse';
import 'leaflet/dist/leaflet.css';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import './components/styles/App.css';
import SelectionInfo from './components/SelectionInfo';
import Welcome from './components/Welcome'; 
// A sua função createLayerFromCSV permanece idêntica
const createLayerFromCSV = async (layerInfo, municipiosGeoJSON) => {
  try {
    console.log(`[${layerInfo.name}] Iniciando carregamento (CSV)...`);
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
        type: 'choropleth', // CSVs sempre geram 'choropleth'
        attributes: layerAttributes,
      };
    }
    return null;
  } catch (error) {
    console.error(`Erro ao carregar a camada ${layerInfo.name}:`, error);
    return null;
  }
};
const createLayerFromGeoJSON = async (layerInfo) => {
  try {
    console.log(`[${layerInfo.name}] Iniciando carregamento (GeoJSON)...`);
    const response = await fetch(layerInfo.path);
    if (!response.ok) {
      throw new Error(`Falha ao buscar ${layerInfo.path} - Status ${response.status}`);
    }
    const geojsonData = await response.json();

    return {
      ...layerInfo, // Isso inclui id, name, type, visible, iconUrl, radius, etc.
      data: geojsonData,
    };
  } catch (error) {
    console.error(`Erro ao carregar a camada GeoJSON ${layerInfo.name}:`, error);
    return null;
  }
};

function App() {
  const [recommendations, setRecommendations] = useState({});
  const [showMap, setShowMap] = useState(false);
  const [layers, setLayers] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [valueRange, setValueRange] = useState([0, 0]);
  const [selectedFeatures, setSelectedFeatures] = useState({});
  const [infoPaneVisible, setInfoPaneVisible] = useState(false);
  const [selectedFeatureData, setSelectedFeatureData] = useState(null);
  const ATTRIBUTE_MAP = {
    JAN: 'Janeiro', FEB: 'Fevereiro', MAR: 'Março', APR: 'Abril', MAY: 'Maio', JUN: 'Junho',
    JUL: 'Julho', AUG: 'Agosto', SEP: 'Setembro', OCT: 'Outubro', NOV: 'Novembro', DEC: 'Dezembro', ANNUAL: 'Anual',
  };

  const handleAreaSelect = useCallback((drawnPolygon) => {
    // ... (sua função handleAreaSelect idêntica) ...
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
        const recResponse = await fetch('/data/recommendations.csv');
        const recText = await recResponse.text();
        const recParsed = Papa.parse(recText, { header: true, skipEmptyLines: true });
        console.log("CSV Bruto Carregado:", recParsed.data);

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

        const recMap = {};
        recParsed.data.forEach(row => {
            if (row.Cultura) {
                // Normaliza para maiúsculas para evitar erro de digitação
                const key = row.Cultura.toUpperCase(); 
                recMap[key] = row;
            }
        });
        setRecommendations(recMap);
        console.log("Recomendações carregadas:", recMap);
        let initialLayers = [choroplethLayer];
        
        // Carrega os municípios base para fazer o "join" com os CSVs
        const municipiosResponse = await fetch('/mg-municipios.geojson');
        const municipiosGeoJSON = await municipiosResponse.json();
        
        // Carrega o manifest
        const manifestResponse = await fetch('/data/manifest.json');
        const manifest = await manifestResponse.json();

        // --- 2. LÓGICA DE CARREGAMENTO ATUALIZADA ---
        const customLayerPromises = manifest.layers.map(layerInfo => {
          
          // Se o tipo for 'point_icon' ou 'point_circle', usa o novo loader
          if (layerInfo.type === 'point_icon' || layerInfo.type === 'point_circle') {
            return createLayerFromGeoJSON(layerInfo);
          }
          
          // Senão, assume que é um CSV que precisa de join (comportamento antigo)
          return createLayerFromCSV(layerInfo, municipiosGeoJSON);
        });
        
        const loadedCustomLayers = (await Promise.all(customLayerPromises)).filter(Boolean);
        
        // Adiciona as camadas carregadas do manifest
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
    const featureCount = Object.keys(selectedFeatures).length;
    if (featureCount > 0) {
      // 1. Se feições forem encontradas, ligue o painel
      setInfoPaneVisible(true);
      // 2. Garanta que o modo Feature (Cooperativa) esteja desligado
      setSelectedFeatureData(null);
    } else if (infoPaneVisible && !selectedFeatureData) {
      // 3. Caso o usuário limpe o polígono e o painel esteja aberto, feche-o
      setInfoPaneVisible(false);
    }
  }, [selectedFeatures]);
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
        
        // Se a camada clicada for a camada de calor base ('choropleth-mg')
        if (l.id === layerId && l.id === 'choropleth-mg') {
           return { ...l, visible: !l.visible };
        }
 
        // Se a camada clicada for qualquer outra camada (CSV, Pontos, etc.)
        if (l.id === layerId) {
          // Se for uma camada 'choropleth' (CSV) e estiver sendo ligada
          if (l.type === 'choropleth' && !l.visible) {
             // Desliga todas as outras 'choropleth'
             return { ...l, visible: true }; 
          }
          // Se for qualquer outra camada (pontos, geojson, etc.)
          return { ...l, visible: !l.visible };
        }
  
        // Se a camada NÃO for a clicada, mas for uma 'choropleth',
        // precisamos verificar se a camada CLICADA também é 'choropleth'
        const clickedLayer = prevLayers.find(c => c.id === layerId);
        if (l.type === 'choropleth' && clickedLayer && clickedLayer.type === 'choropleth') {
          return { ...l, visible: false }; // Desliga as outras
        }

        return l;
      })
      // Ajuste final para garantir que a camada de calor base e as de CSV
      // não fiquem ligadas ao mesmo tempo
      .map((l, _, arr) => {
         const clickedLayer = arr.find(c => c.id === layerId);
         if (clickedLayer && clickedLayer.type === 'choropleth' && clickedLayer.id !== 'choropleth-mg') {
            if (l.id === 'choropleth-mg') return { ...l, visible: false };
         }
         if (clickedLayer && clickedLayer.id === 'choropleth-mg' && clickedLayer.visible) {
            if (l.type === 'choropleth' && l.id !== 'choropleth-mg') return { ...l, visible: false };
         }
         return l;
      })
    );
  };
const handleCloseSidebar = () => {
    setInfoPaneVisible(false);
    setSelectedFeatureData(null);
    setSelectedFeatures({}); 
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
const handleFeatureClick = (featureData) => {
    console.log("Feature clicada:", featureData);
    // 1. Define os dados da feição
    setSelectedFeatureData(featureData);
    // 2. Garante que a seleção de área esteja zerada
    setSelectedFeatures({}); 
    // 3. MUDANÇA CRUCIAL: Ativa o painel de forma explícita
    setInfoPaneVisible(true); 
  };
  const closeFeatureInfoPane = () => {
    setSelectedFeatureData(null);
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
      
      {infoPaneVisible && (
        <SelectionInfo
          selectedFeatures={selectedFeatures}
          featureData={selectedFeatureData}
          layers={layers}
          onClose={handleCloseSidebar}
          recommendations={recommendations}
        />
      )}
      <MapComponent
        layers={layers}
        selectedAttribute={selectedAttribute}
        valueRange={valueRange}
        onAreaSelect={handleAreaSelect}
        selectedFeatures={selectedFeatures}
        onPolygonClick={handlePolygonClick}
        onFeatureClick={handleFeatureClick}
      />
    </div>
  );
}

export default App;