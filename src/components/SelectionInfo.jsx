import React, { useState } from 'react';
import './styles/SelectionInfo.css';
import Elevado from '/img/TiposDePainel/Elevado.webp'
import Semitransparente from '/img/TiposDePainel/Semitransparente.webp'
import Vertical from '/img/TiposDePainel/Vertical.webp'
// Lista de propriedades a serem ignoradas na exibição
const IGNORE_PROPS = [
  'id', 'name', 'description', 'ID', 'LAT', 'LON', 'municipios', 
  'icon_url', 'icon_size', 'icon_anchor'
];

// ORDEM FIXA PARA AS CHAVES NUMÉRICAS/CRONOLÓGICAS (para a média/máximo)
const FIXED_ORDER = [
    'UF', 'ANNUAL', 
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

// Função auxiliar para renderizar as linhas da tabela
const renderProperty = (key, value) => {
    let displayValue;

    if (typeof value === 'object' && value !== null && value.hasOwnProperty('value') && value.hasOwnProperty('location')) {
        // CASO DE MÁXIMO (Objeto { value, location })
        const numericValue = value.value;
        const formattedValue = Number.isInteger(numericValue) ? numericValue : numericValue.toFixed(2);
        
        // Formato solicitado: [Valor] - [Município]
        displayValue = `${formattedValue} - ${value.location}`;

    } else if (typeof value === 'number') {
        // CASO DE MÉDIA ou valor numérico simples
        displayValue = Number.isInteger(value) ? value : value.toFixed(2);
    } else {
        // CASO DE STRING (UF, etc.)
        displayValue = String(value);
    }
    
    return (
        <div key={key} className="feature-detail-item feature-coop-item">
            <strong>{key}:</strong>
            <span>{displayValue}</span>
        </div>
    );
};

// Função de ajuda para determinar a operação necessária
const isMaxAggregation = (layerName) => {
    const normalizedName = layerName.toLowerCase();
    console.log(normalizedName)
    return normalizedName.includes('cultivo') || 
           normalizedName.includes('cultura') ||
           normalizedName.includes('pecuária') || 
           normalizedName.includes('curtoPrazo') || 
           normalizedName.includes('curto prazo (csv)');
}


// Calcula Média OU Máximo com base no parâmetro 'operation', e armazena a localização no modo MAX.
const calculateMetricsForFeatures = (features, operation = 'AVERAGE') => {
    const metrics = {}; // Armazena somas ou objetos {value, location}
    let totalFeatures = features.length;
    const commonProps = {};

    if (totalFeatures === 0) return { count: 0, properties: {} };

    // 1. Acumular métricas e propriedades
    features.forEach(feature => {
        const properties = feature.properties;
        const featureLocation = properties.name || 'Desconhecido'; // Obtém o nome do município

        Object.entries(properties).forEach(([key, value]) => {
            const normalizedKey = key.toUpperCase();
            
            if (IGNORE_PROPS.includes(normalizedKey) || normalizedKey === 'NAME') {
                return;
            }

            if (typeof value === 'number') {
                if (operation === 'AVERAGE') {
                    // Média: Acumula a soma
                    metrics[key] = (metrics[key] || 0) + value;
                } else if (operation === 'MAX') {
                    // MÁXIMO: Armazena o valor e a localização
                    if (!metrics.hasOwnProperty(key)) {
                        // Inicializa
                        metrics[key] = { value: value, location: featureLocation };
                    } else if (value > metrics[key].value) {
                        // Atualiza se o valor atual for maior
                        metrics[key] = { value: value, location: featureLocation };
                    }
                }
            } else if (!commonProps.hasOwnProperty(key)) {
                commonProps[key] = value;
            }
        });
    });

    // 2. Finalizar Cálculo e Desempacotar (se necessário)
    const finalMetrics = {};
    if (operation === 'AVERAGE') {
        if (totalFeatures === 1) {
            Object.assign(finalMetrics, metrics);
        } else {
            Object.entries(metrics).forEach(([key, sum]) => {
                finalMetrics[key] = sum / totalFeatures;
            });
        }
    } else if (operation === 'MAX') {
        // MÁXIMO: O valor já está pronto (metrics contém {value, location})
        Object.assign(finalMetrics, metrics);
    }


    // 3. ORDENAR PROPRIEDADES (Garantindo a ordem cronológica)
    const combinedResult = { ...commonProps, ...finalMetrics };
    const sortedResult = {};
    const addedKeys = new Set();
    
    FIXED_ORDER.forEach(key => {
        if (combinedResult.hasOwnProperty(key)) {
            sortedResult[key] = combinedResult[key];
            addedKeys.add(key);
        }
    });

    Object.keys(combinedResult)
        .filter(key => !addedKeys.has(key))
        .sort()
        .forEach(key => {
            sortedResult[key] = combinedResult[key];
        });


    return {
        count: totalFeatures,
        properties: sortedResult,
        calculationType: operation === 'MAX' ? 'Máximo' : 'Média'
    };
};


function SelectionInfo({ selectedFeatures, featureData, layers, onClose }) {
  
  const [panelQty, setPanelQty] = useState('');
  const [consumption, setConsumption] = useState('');
  
  const getLayerName = (layerId) => {
    const layer = layers.find(l => l.id === layerId);
    return layer ? layer.name : layerId;
  };

  // 1. MODO: Clique em Feature (Ex: Cooperativa)
  if (featureData) {
    const title = featureData.name || 'Informações da Feição';

    const renderFeatureDetails = () => {
      return Object.entries(featureData).map(([key, value]) => {
        if (!IGNORE_PROPS.includes(key.toUpperCase())) {
          return renderProperty(key, value);
        }
        return null;
      });
    };

    return (
      <div className="selection-info-pane feature-info">
        <div className="selection-info-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="selection-info-content">
          <p>Esta é a **visualização com formatação específica** para informações detalhadas da Cooperativa.</p>
          <div className="feature-details-list">
            {renderFeatureDetails()}
          </div>
        </div>
      </div>
    );
  }

  // 2. MODO: Seleção de Área (Polígono)
  if (selectedFeatures && Object.keys(selectedFeatures).length > 0) {
    
    const layerTypeMap = new Map(layers.map(l => [l.id, l.type]));
    
    const averageLayers = [];
    const otherFeatures = [];
    let totalFeaturesToAverage = 0;
    
    // Processa cada camada selecionada separadamente
    Object.entries(selectedFeatures).forEach(([layerId, features]) => {
        const layerType = layerTypeMap.get(layerId);
        const layerName = getLayerName(layerId);
        
        if (layerType === 'choropleth') {
            
            // Define a operação (MAX ou AVERAGE)
            const operation = isMaxAggregation(layerName) ? 'MAX' : 'AVERAGE';
            
            const data = calculateMetricsForFeatures(features, operation);
            totalFeaturesToAverage += data.count;
            if (data.count > 0) {
                averageLayers.push({
                    id: layerId,
                    name: layerName,
                    ...data,
                });
            }
        } else {
            // Se for outro tipo, apenas lista as feições
            otherFeatures.push({
                id: layerId,
                name: layerName,
                features: features,
            });
        }
    });

    const hasData = averageLayers.length > 0 || otherFeatures.length > 0;
    
    if (!hasData) {
         return (
            <div className="selection-info area-select-info">
                <div className="selection-info-header">
                    <h3>Informações da Seleção de Área</h3>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="selection-info-content">
                    <p>Nenhuma feição encontrada na área selecionada.</p>
                </div>
            </div>
        );
    }
    
    const getFeatureProperties = (properties) => {
        return Object.entries(properties)
          .filter(([key]) => !IGNORE_PROPS.includes(key.toUpperCase()))
          .map(([key, value]) => (
            <div key={key} className="feature-property-item">
              <span className="info-key">{key}:</span>
              <span className="info-value">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
            </div>
          ));
    };


    return (
      <div className="selection-info area-select-info">
        <div className="selection-info-header">
          <h3>Informações da Seleção de Área</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="selection-info-content">
          {/* Formulário para definições do usuário */}
          <h2>Tipo de painel</h2>
      <div class="option-group">

    <label class="option-item">
        <img src={Semitransparente} alt="Imagem 1"/>
        <div>Semitransparente</div>
        <input type="radio" name="option" value="1"/>
    </label>

    <label class="option-item">
        <img src={Vertical} alt="Imagem 2"/>
        <div>Vertical</div>
        <input type="radio" name="option" value="2"/>
    </label>

    <label class="option-item">
        <img src={Elevado} alt="Imagem 3"/>
        <div>Elevado</div>
        <input type="radio" name="option" value="3"/>
    </label>

</div>

          
          <hr/>
          
          {/* BLOCO DE DADOS DE CHOROPLETH (MÉDIAS/MÁXIMOS SEPARADAS) */}
          {averageLayers.length > 0 && (
              <>
                  <h4>Dados Numéricos Selecionados ({totalFeaturesToAverage} feições)</h4>
                  {averageLayers.map(layer => (
                      <div key={layer.id} className="layer-average-block">
                          {/* TÍTULO ATUALIZADO */}
                          <h5>{layer.name} - ({layer.calculationType} de {layer.count} feições)</h5> 
                          <div className="feature-details-list average-table">
                              {Object.entries(layer.properties).map(([key, value]) => (
                                  renderProperty(key, value)
                              ))}
                          </div>
                      </div>
                  ))}
              </>
          )}

          {/* BLOCO DE OUTRAS FEIÇÕES (LISTAGEM DE PONTOS/LIMITE) */}
          {otherFeatures.length > 0 && (
              <>
                  <hr/>
                  <h4>Outras Feições Interceptadas</h4>
                  {otherFeatures.map(layer => (
                    <div key={layer.id} className="layer-info">
                      <h5>{layer.name} ({layer.features.length} feições)</h5>
                      <ul>
                        {layer.features.map((feature, index) => (
                          <li key={index}>
                            <strong>{feature.properties.name || `Feição ${index + 1}`}</strong>
                            <div className="feature-properties">
                              {getFeatureProperties(feature.properties)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

export default SelectionInfo;