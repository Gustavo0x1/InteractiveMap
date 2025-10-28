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
    // Faz o parse do CSV
    const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    
    const customData = results.data;
    // A primeira coluna (results.meta.fields[0]) é a chave
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
          // Se não for um número (NaN), mantém o valor original (ex: "-")
          newProperties[key] = isNaN(value) ? matchingData[key] : value;
        }
        return { ...feature, properties: newProperties };
      }
      return null;
    }).filter(Boolean);

    console.log(`[${layerInfo.name}] Feições unidas: ${newFeatures.length}`);

    if (newFeatures.length > 0) {
      // --- INÍCIO DA CORREÇÃO ---
      // Lista de colunas base do GeoJSON para ignorar
      const customExcluded = ['id', 'name', 'description'];
      
      // A lógica agora usa os CABEÇALHOS (results.meta.fields) em vez dos dados da primeira linha
      const layerAttributes = results.meta.fields
        .filter(key =>
          // Filtra apenas a coluna de junção (ex: 'municipios') e as colunas base
          !customExcluded.includes(key) &&
          key.toLowerCase() !== keyField.toLowerCase()
        )
        .map(key => ({ value: key, label: key })); // Adiciona TODOS os outros
      
      console.log(`[${layerInfo.name}] Atributos encontrados (${layerAttributes.length}):`, layerAttributes.map(a => a.value));
      // --- FIM DA CORREÇÃO ---

      return {
        id: layerInfo.id,
        name: layerInfo.name,
        data: { type: "FeatureCollection", features: newFeatures },
        visible: false,
        type: 'choropleth',
        attributes: layerAttributes, // Adiciona a lista COMPLETA de atributos
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
  const [attributes, setAttributes] = useState([]); // Atributos da camada ATIVA para o Sidebar
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

    // 1. Criamos um polígono "normalizado" a partir das coordenadas desenhadas.
    //    Isso resolve inconsistências que podem confundir a biblioteca de interseção.
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
          // Ignora erros de topologia
        }
      });
      if (featuresInside.length > 0) {
        selectedByLayer[layer.id] = featuresInside;
      }
    });

    console.log("Feições selecionadas por camada:", selectedByLayer);
    setSelectedFeatures(selectedByLayer);
  }, [layers]);

  // Efeito para carregar todos os dados uma única vez
  useEffect(() => {
    const fetchData = async () => {
      console.log("--- Iniciando carregamento de todos os dados ---");
      try {
        // 1. Carrega a camada base (mapa de calor) e extrai seus atributos
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
        
        // 2. Carrega as camadas personalizadas do manifesto
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

  // Efeito para ATUALIZAR o seletor de atributos quando a camada visível muda
  useEffect(() => {
    const activeLayer = layers.find(l => l.visible && l.type === 'choropleth');

    if (activeLayer && activeLayer.attributes) {
      console.log(`Camada ativa mudou para: "${activeLayer.name}". Atualizando atributos.`);
      setAttributes(activeLayer.attributes);
      
      // Define o atributo selecionado como o primeiro da nova lista
      setSelectedAttribute(activeLayer.attributes[0]?.value || '');
    } else {
      // Se nenhuma camada de calor estiver ativa, limpa o seletor
      setAttributes([]);
      setSelectedAttribute('');
    }
  }, [layers]); // Depende apenas de [layers]

  // Efeito para ATUALIZAR a escala de cores
  useEffect(() => {
    const visibleChoropleth = layers.find(l => l.visible && l.type === 'choropleth');
    
    if (!visibleChoropleth || !selectedAttribute) {
      setValueRange([0, 0]);
      return;
    }
    // Calcula os valores *apenas* para o atributo selecionado
    const values = visibleChoropleth.data.features
      .map(feature => feature.properties[selectedAttribute])
      .filter(value => typeof value === 'number'); // Filtra strings, "-", null, etc.
    
    if (values.length > 0) {
      setValueRange([Math.min(...values), Math.max(...values)]);
    } else {
      // Se o atributo selecionado não tiver dados numéricos, reseta a escala
      setValueRange([0, 0]);
    }
  }, [layers, selectedAttribute]); // Depende de [layers] e [selectedAttribute]

  // Função para ligar/desligar camadas
  const toggleLayerVisibility = (layerId) => {
    setLayers(prevLayers =>
      prevLayers.map(l => {
        // Se for a camada clicada, inverte a visibilidade
        if (l.id === layerId) {
          return { ...l, visible: !l.visible };
        }
        // Se for OUTRA camada de calor (choropleth), garante que ela seja desligada
        if (l.type === 'choropleth') {
          return { ...l, visible: false };
        }
        // Mantém as outras camadas (ex: limite do Brasil) como estão
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