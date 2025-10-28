import React, { useState, useEffect, useCallback } from 'react';
import * as turf from '@turf/turf';
import shp from 'shpjs';
import Papa from 'papaparse'; // NECESSÁRIO: Importa a biblioteca para ler CSV
import 'leaflet/dist/leaflet.css';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import './components/styles/App.css';

// --- FUNÇÃO GENÉRICA PARA CRIAR CAMADAS ---
/**
 * Cria uma camada GeoJSON unindo dados de um arquivo CSV com as geometrias dos municípios.
 * @param {object} layerInfo - Objeto com informações da camada (id, name, path).
 * @param {object} municipiosGeoJSON - O GeoJSON base com as geometrias dos municípios.
 * @returns {Promise<object|null>} Uma promessa que resolve para o objeto da nova camada.
 */
const createLayerFromCSV = async (layerInfo, municipiosGeoJSON) => {
  try {
    console.log(`[${layerInfo.name}] Iniciando carregamento...`);
    const response = await fetch(layerInfo.path);
    if (!response.ok) {
      throw new Error(`Falha ao buscar ${layerInfo.path} - Status ${response.status}`);
    }
    const csvText = await response.text();
    
    // Faz o parse do CSV
    const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });

    const customData = results.data;
    const keyField = results.meta.fields[0]; // A primeira coluna é a chave (ex: 'municipios')
    
    console.log(`[${layerInfo.name}] Chave de junção (CSV): ${keyField}`);
    console.log(`[${layerInfo.name}] Total de linhas no CSV: ${customData.length}`);

    const dataMap = new Map();
    customData.forEach(row => {
      // Normaliza o nome para a junção (remove acentos e converte para maiúsculas)
      const normalizedName = row[keyField]?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      if (normalizedName) {
        dataMap.set(normalizedName, row);
      }
    });

    // Une os dados do CSV com as feições do GeoJSON
    const newFeatures = municipiosGeoJSON.features.map(feature => {
      const geojsonName = feature.properties.name;
      const normalizedGeojsonName = geojsonName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      const matchingData = dataMap.get(normalizedGeojsonName);

      if (matchingData) {
        // Copia as propriedades base do GeoJSON
        const newProperties = { ...feature.properties };
        
        // Adiciona/Sobrescreve com todos os dados do CSV
        for (const key in matchingData) {
          // Tenta converter para número, se falhar, mantém como texto
          const value = parseFloat(matchingData[key]);
          newProperties[key] = isNaN(value) ? matchingData[key] : value;
        }
        return { ...feature, properties: newProperties };
      }
      return null; // Remove municípios que não estão no CSV
    }).filter(Boolean); // Filtra os nulos

    console.log(`[${layerInfo.name}] Feições unidas: ${newFeatures.length}`);

    if (newFeatures.length > 0) {
      return {
        id: layerInfo.id,
        name: layerInfo.name,
        data: { type: "FeatureCollection", features: newFeatures },
        visible: false, // Inicia como invisível
        type: 'choropleth',
      };
    }
    return null;
  } catch (error) {
    console.error(`Erro ao carregar a camada ${layerInfo.name}:`, error);
    return null;
  }
};
// --- FIM DA FUNÇÃO GENÉRICA ---

function App() {
  const [layers, setLayers] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [valueRange, setValueRange] = useState([0, 0]);
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
      console.log("--- Iniciando carregamento de dados ---");
      try {
        // 1. Carrega a camada base original (mapa de calor)
        const shpResponse = await fetch('/Irrad.zip');
        const arrayBuffer = await shpResponse.arrayBuffer();
        const geojsonData = await shp(arrayBuffer);
        
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

        let initialLayers = [choroplethLayer, brasilLayer];
        
        // --- LÓGICA DE CARREGAMENTO AUTOMÁTICO ---
        // 2. Carrega o GeoJSON base dos municípios
        const municipiosResponse = await fetch('/mg-municipios.geojson');
        const municipiosGeoJSON = await municipiosResponse.json();
        console.log("GeoJSON de municípios carregado:", municipiosGeoJSON.features.length, 'feições');
        
        // 3. Carrega o manifesto de camadas
        const manifestResponse = await fetch('/data/manifest.json');
        const manifest = await manifestResponse.json();
        console.log("Manifesto carregado:", manifest);

        // 4. Cria todas as camadas personalizadas em paralelo
        const customLayerPromises = manifest.layers.map(layerInfo =>
          createLayerFromCSV(layerInfo, municipiosGeoJSON)
        );

        const loadedCustomLayers = (await Promise.all(customLayerPromises)).filter(Boolean);
        console.log("Camadas personalizadas processadas:", loadedCustomLayers);
        
        initialLayers = [...initialLayers, ...loadedCustomLayers];
        // --- FIM DA LÓGICA ---

        // Define as camadas no estado
        setLayers(initialLayers);
        console.log("Total de camadas a serem definidas no estado:", initialLayers.length);

        // --- INÍCIO DA LÓGICA DE ATRIBUTOS CORRIGIDA ---
        // Cria uma lista mestra de todos os atributos numéricos de todas as camadas
        const allNumericAttributes = new Map();
        const baseExcluded = ['ID', 'LAT', 'LON'];
        const customExcluded = ['id', 'name', 'description']; // Props do geojson base

        initialLayers.forEach(layer => {
          if (layer.type === 'choropleth' && layer.data?.features?.length > 0) {
            const props = layer.data.features[0].properties;
            // Tenta encontrar a chave de junção (ex: 'municipios') para excluí-la
            const keyField = Object.keys(props).find(k => k.toLowerCase() === 'municipios'); 
            
            Object.keys(props).forEach(key => {
              // Se for numérico e não for uma chave de exclusão...
              if (typeof props[key] === 'number' && 
                  !baseExcluded.includes(key.toUpperCase()) && 
                  !customExcluded.includes(key) &&
                  key !== keyField) {
                
                if (!allNumericAttributes.has(key)) {
                  // Usa o ATTRIBUTE_MAP se existir, senão usa a própria chave
                  const label = ATTRIBUTE_MAP[key.toUpperCase()] || key;
                  allNumericAttributes.set(key, { value: key, label: label });
                }
              }
            });
          }
        });

        const availableAttributes = Array.from(allNumericAttributes.values());
        setAttributes(availableAttributes);
        console.log("Atributos numéricos encontrados:", availableAttributes);

        // Define o atributo padrão
        const defaultAttr = availableAttributes.find(attr => attr.value.toUpperCase() === 'ANNUAL');
        setSelectedAttribute(defaultAttr ? defaultAttr.value : (availableAttributes[0]?.value || ''));
        // --- FIM DA LÓGICA DE ATRIBUTOS ---

      } catch (error) {
        console.error("Erro ao carregar as camadas:", error);
      }
    };
    fetchData();
  }, []); // Executa apenas uma vez

  useEffect(() => {
    // --- LÓGICA DE VALUE RANGE CORRIGIDA ---
    // Atualiza o range de cores baseado na camada visível e no atributo selecionado
    
    // Encontra a camada de calor que está visível
    const visibleChoropleth = layers.find(l => l.visible && l.type === 'choropleth');
    
    // Se nenhuma estiver visível, ou o atributo não existir nela, reseta o range
    if (!visibleChoropleth || !visibleChoropleth.data.features[0]?.properties[selectedAttribute]) {
      setValueRange([0, 0]); // Reseta o range
      return;
    }

    // Se encontrou a camada e o atributo, calcula o min/max
    const values = visibleChoropleth.data.features
      .map(feature => feature.properties[selectedAttribute])
      .filter(value => typeof value === 'number');
    
    if (values.length > 0) {
      setValueRange([Math.min(...values), Math.max(...values)]);
    } else {
      setValueRange([0, 0]);
    }
    // --- FIM DA LÓGICA DE VALUE RANGE ---
  }, [layers, selectedAttribute]); // Roda sempre que as camadas ou o atributo mudam

  const toggleLayerVisibility = (layerId) => {
    setLayers(prevLayers =>
      prevLayers.map(l => {
        // Se for a camada clicada, inverte a visibilidade
        if (l.id === layerId) {
          return { ...l, visible: !l.visible };
        }
        // Se for OUTRA camada do tipo choropleth, desliga ela
        if (l.type === 'choropleth' && l.id !== layerId) {
          return { ...l, visible: false };
        }
        // Mantém as outras camadas (ex: limite do brasil) como estão
        return l;
      })
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

