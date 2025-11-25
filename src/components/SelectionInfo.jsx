import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import './styles/SelectionInfo.css';
import Elevado from '/img/TiposDePainel/Elevado.webp'
import Semitransparente from '/img/TiposDePainel/Semitransparente.webp'
import Vertical from '/img/TiposDePainel/Vertical.webp'

// Lista de propriedades a ignorar
const IGNORE_PROPS = [
  'id', 'name', 'description', 'ID', 'LAT', 'LON', 'municipios', 
  'icon_url', 'icon_size', 'icon_anchor', 'TOTAL', 'Total'
];

const FIXED_ORDER = [
    'UF', 'ANNUAL', 
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const TRANSLATIONS = {
    'JAN': 'Janeiro', 'FEB': 'Fevereiro', 'MAR': 'Março', 'APR': 'Abril',
    'MAY': 'Maio', 'JUN': 'Junho', 'JUL': 'Julho', 'AUG': 'Agosto',
    'SEP': 'Setembro', 'OCT': 'Outubro', 'NOV': 'Novembro', 'DEC': 'Dezembro',
    'ANNUAL': 'Anual', 'UF': 'Estado'
};

const formatLabel = (label) => {
    const upperLabel = String(label).toUpperCase();
    return TRANSLATIONS[upperLabel] || label;
};

// --- COMPONENTE DE GRÁFICO ---
const ColumnChart = ({ properties, layerName }) => {
    let data = Object.entries(properties).map(([key, value]) => {
        if (IGNORE_PROPS.includes(key) || IGNORE_PROPS.includes(key.toUpperCase())) return null;

        let numericValue = 0;
        let label = key;
        
        if (typeof value === 'object' && value !== null && typeof value.value === 'number') {
            numericValue = value.value;
        } else if (typeof value === 'number') {
            numericValue = value;
        } else {
            return null;
        }

        return { name: label, value: numericValue };
    }).filter(item => item !== null);

    if (data.length === 0) return null;

    // Lógica para definir o Título do Gráfico
    const hasMonths = data.some(d => MONTHS.includes(d.name.toUpperCase()));
    let chartTitle = "";

    if (hasMonths) {
        data.sort((a, b) => {
            const idxA = MONTHS.indexOf(a.name.toUpperCase());
            const idxB = MONTHS.indexOf(b.name.toUpperCase());
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        });
        chartTitle = `Variação Mensal - ${layerName}`;
    } else {
        data.sort((a, b) => b.value - a.value);
        data = data.slice(0, 15);
        chartTitle = `Ranking (Top 15) - ${layerName}`;
    }

    return (
        <div className="chart-container" style={{ height: 320, width: '100%', marginTop: 20, marginBottom: 30 }}>
            <h5 style={{ textAlign: 'center', color: '#666', marginBottom: 10, fontSize: '0.9rem' }}>
                {chartTitle}
            </h5>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" tick={{ fontSize: 11, fill: '#555' }} height={60} tickFormatter={formatLabel} />
                    <YAxis tick={{ fontSize: 11, fill: '#555' }} tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} formatter={(value) => [value.toLocaleString('pt-BR'), 'Valor']} labelFormatter={formatLabel} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill="#4a90e2" />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// --- RENDERIZAÇÃO DAS PROPRIEDADES (TABELA) ---
const renderProperty = (key, value, calculationType) => {
    const displayKey = formatLabel(key);

    if (typeof value === 'object' && value !== null && value.hasOwnProperty('value') && value.hasOwnProperty('location')) {
        const numericValue = value.value;
        const formattedValue = Number.isInteger(numericValue) ? numericValue : numericValue.toFixed(2);
        return (
            <div key={key} className="feature-detail-item feature-max-item" style={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.9em', color: '#555' }}>
                    Município destaque: <strong style={{ color: '#000' }}>{value.location}</strong>
                </div>
                <div style={{ fontSize: '0.9em', color: '#555' }}>
                    Total: <strong>{formattedValue}</strong>
                </div>
            </div>
        );
    } else if (typeof value === 'number') {
        const displayValue = Number.isInteger(value) ? value : value.toFixed(2);
        return (
            <div key={key} className="feature-detail-item">
                <strong>{displayKey}:</strong>
                <span>{displayValue}</span>
            </div>
        );
    } else {
        return (
            <div key={key} className="feature-detail-item">
                <strong>{displayKey}:</strong>
                <span>{String(value)}</span>
            </div>
        );
    }
};

const isMaxAggregation = (layerName) => {
    if (!layerName) return false;
    const normalizedName = layerName.toLowerCase();
    return normalizedName.includes('cultivo') || normalizedName.includes('cultura') || normalizedName.includes('pecuária') || normalizedName.includes('produção') || normalizedName.includes('milho') || normalizedName.includes('soja') || normalizedName.includes('feijao') || normalizedName.includes('cafe') || normalizedName.includes('banana') || normalizedName.includes('dados') || normalizedName.includes('csv');
}

const calculateMetricsForFeatures = (features, operation = 'AVERAGE') => {
    const metrics = {}; 
    let totalFeatures = features.length;
    const commonProps = {};

    if (totalFeatures === 0) return { count: 0, properties: {} };

    features.forEach(feature => {
        const properties = feature.properties;
        const featureLocation = properties.name || properties.NAME || properties.nome || properties.municipio || properties.MUNICIPIO || 'Local Desconhecido';

        Object.entries(properties).forEach(([key, value]) => {
            const normalizedKey = key.toUpperCase();
            if (IGNORE_PROPS.includes(key) || IGNORE_PROPS.includes(normalizedKey) || key.toLowerCase() === 'name') return;

            if (typeof value === 'number') {
                if (operation === 'AVERAGE') {
                    metrics[key] = (metrics[key] || 0) + value;
                } else if (operation === 'MAX') {
                    if (!metrics.hasOwnProperty(key)) {
                        metrics[key] = { value: value, location: featureLocation };
                    } else {
                        if (value > metrics[key].value) {
                            metrics[key] = { value: value, location: featureLocation };
                        }
                    }
                }
            } else if (!commonProps.hasOwnProperty(key)) {
                commonProps[key] = value;
            }
        });
    });

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
        Object.assign(finalMetrics, metrics);
    }

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
        calculationType: operation === 'MAX' ? 'Destaques (Maior Valor Encontrado)' : 'Média'
    };
};

function SelectionInfo({ selectedFeatures, featureData, layers, onClose, recommendations }) {
  
  const getLayerName = (layerId) => {
    const layer = layers.find(l => l.id === layerId);
    return layer ? layer.name : layerId;
  };

  // MODO 1: Feature Individual
  if (featureData) {
    const title = featureData.name || 'Informações da Feição';
    const renderFeatureDetails = () => {
      return Object.entries(featureData).map(([key, value]) => {
        if (!IGNORE_PROPS.includes(key) && !IGNORE_PROPS.includes(key.toUpperCase())) {
          return renderProperty(key, value, 'INDIVIDUAL');
        }
        return null;
      });
    };

    return (
      <div className="selection-info area-select-info">
        <div className="selection-info-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="selection-info-content">
          <div className="feature-details-list">
            {renderFeatureDetails()}
          </div>
        </div>
      </div>
    );
  }

  // MODO 2: Seleção de Área (Polígono)
  if (selectedFeatures && Object.keys(selectedFeatures).length > 0) {
    
    const layerTypeMap = new Map(layers.map(l => [l.id, l.type]));
    const aggregatedLayers = [];
    const otherFeatures = [];
    
    Object.entries(selectedFeatures).forEach(([layerId, features]) => {
        const layerType = layerTypeMap.get(layerId);
        const layerName = getLayerName(layerId);
        
        if (layerType === 'choropleth') {
            const operation = isMaxAggregation(layerName) ? 'MAX' : 'AVERAGE';
            const data = calculateMetricsForFeatures(features, operation);
            if (data.count > 0) {
                aggregatedLayers.push({
                    id: layerId,
                    name: layerName,
                    ...data,
                });
            }
        } else {
            otherFeatures.push({ id: layerId, name: layerName, features: features });
        }
    });

    const hasData = aggregatedLayers.length > 0 || otherFeatures.length > 0;
    
    if (!hasData) {
         return (
            <div className="selection-info area-select-info">
                <div className="selection-info-header">
                    <h3>Seleção de Área</h3>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="selection-info-content">
                    <p>Nenhuma feição encontrada na área selecionada.</p>
                </div>
            </div>
        );
    }
    
    let diagnosisBlock = null;
    for (const layer of aggregatedLayers) {
        if (layer.calculationType.includes('Destaque')) {
            let maxKey = null;
            let maxVal = -Infinity;
            let maxLocation = "";

            Object.entries(layer.properties).forEach(([key, data]) => {
                if (data && typeof data.value === 'number') {
                    if (data.value > maxVal) {
                        maxVal = data.value;
                        maxKey = key; 
                        maxLocation = data.location;
                    }
                }
            });

            if (maxKey && recommendations) {
                let recData = recommendations[maxKey] || recommendations[maxKey.toUpperCase()];
                if (!recData) {
                    const quotedKey = `"${maxKey}"`;
                    recData = recommendations[quotedKey];
                }

                if (recData) {
                    diagnosisBlock = (
                        <div className="insight-box" style={{ 
                            backgroundColor: '#f0f8ff', 
                            borderLeft: '4px solid #007bff', 
                            padding: '10px', 
                            marginBottom: '20px',
                            borderRadius: '4px'
                        }}>
                            <h4 style={{marginTop:0, color:'#0056b3'}}>Diagnóstico da Região</h4>
                            <p style={{fontSize: '0.95rem', lineHeight: '1.5'}}>
                                Foi encontrado na região marcada um polo produtor de <strong>{formatLabel(maxKey)}</strong> (destaque para {maxLocation}).
                            </p>
                            <p style={{fontSize: '0.95rem', lineHeight: '1.5', marginTop: '8px'}}>
                                Recomendamos o uso de <strong>{recData.PainelRecomendado}</strong> e a instalação de sistema de <strong>{recData.IrrigacaoRecomendada}</strong>.
                            </p>
                        </div>
                    );
                    break;
                }
            }
        }
    }

    // --- ACHATAMENTO (FLATTENING) DAS FEIÇÕES ---
    // Criamos uma lista única com todas as feições de 'otherFeatures'
    const flatOtherFeatures = [];
    otherFeatures.forEach(layer => {
        layer.features.forEach(feature => {
            flatOtherFeatures.push({
                ...feature,
                _layerName: layer.name // Guardamos o nome da camada caso precise, mas não vamos exibir o agrupamento
            });
        });
    });

    const getFeatureProperties = (properties) => {
        const nameKey = Object.keys(properties).find(k => k.toLowerCase() === 'titulo' || k.toLowerCase() === 'titulo');
        const nameValue = nameKey ? properties[nameKey] : null;

        const descKey = Object.keys(properties).find(k => k.toLowerCase() === 'description' || k.toLowerCase() === 'descrição' || k.toLowerCase() === 'descricao');
        const descValue = descKey ? properties[descKey] : null;

        return (
            <div className="feature-custom-layout" style={{ marginTop: '5px' }}>
                {nameValue ? (
                    <h4 style={{ margin: '0 0 8px 0', color: '#007bff', fontSize: '1.1rem', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                        {nameValue}
                    </h4>
                ) : (
                    <h4 style={{ margin: '0 0 8px 0', color: '#999', fontSize: '1rem', fontStyle: 'italic' }}>(Sem Nome)</h4>
                )}

                <div className="feature-description-block" style={{ marginBottom: '12px', fontSize: '0.9rem', lineHeight: '1.4', color: '#444', backgroundColor: '#fafafa', padding: '8px', borderRadius: '4px' }}>
                    <strong style={{ display: 'block', marginBottom: '4px', color: '#333', fontSize: '0.85rem', textTransform: 'uppercase' }}>Descrição:</strong>
                    {descValue ? (
                        <span>{descValue}</span>
                    ) : (
                        <span style={{ color: '#aaa', fontStyle: 'italic' }}>Nenhuma descrição disponível.</span>
                    )}
                </div>

                <div className="feature-others-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 15px' }}>
                    {Object.entries(properties).map(([key, value]) => {
                        if (
                            key.toLowerCase() === 'name' || key.toLowerCase() === 'nome' ||
                            key.toLowerCase() === 'description' || key.toLowerCase() === 'descrição' || key.toLowerCase() === 'descricao' ||
                            IGNORE_PROPS.includes(key) || IGNORE_PROPS.includes(key.toUpperCase())
                        ) {
                            return null;
                        }
                        return (
                            <div key={key} className="feature-property-item" style={{ borderBottom: '1px dotted #eee', paddingBottom: '2px' }}>
                                <span className="info-key" style={{ fontWeight: 'bold', color: '#555', fontSize: '0.85rem' }}>{formatLabel(key)}:</span>
                                <span className="info-value" style={{ marginLeft: '5px', fontSize: '0.9rem' }}>{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
      <div className="selection-info area-select-info">
        <div className="selection-info-header">
          <h3>Relatório de Inteligência</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        
        <div className="selection-info-content">
          
          {diagnosisBlock}

          <div className="option-group">
            <label className="option-item">
                <img src={Semitransparente} alt="Painel Semitransparente"/>
                <div>Semitransparente</div>
                <input type="radio" name="option" value="1"/>
            </label>
            <label className="option-item">
                <img src={Vertical} alt="Painel Vertical"/>
                <div>Vertical</div>
                <input type="radio" name="option" value="2"/>
            </label>
            <label className="option-item">
                <img src={Elevado} alt="Painel Elevado"/>
                <div>Elevado</div>
                <input type="radio" name="option" value="3"/>
            </label>
          </div>

          <hr/>
          
          {aggregatedLayers.length > 0 && (
              <>
                  {aggregatedLayers.map(layer => {
                      let maxKey = null;
                      let maxVal = -Infinity;
                      if (layer.calculationType.includes('Destaque')) {
                          Object.entries(layer.properties).forEach(([key, data]) => {
                              if (data && typeof data.value === 'number') {
                                  if (data.value > maxVal) {
                                      maxVal = data.value;
                                      maxKey = key; 
                                  }
                              }
                          });
                      }

                      const cardTitle = (layer.calculationType.includes('Destaque') && maxKey) 
                          ? formatLabel(maxKey) 
                          : layer.name;

                      return (
                          <div key={layer.id} className="layer-average-block">
                              
                              <div className="layer-block-header">
                                  <h5>{cardTitle}</h5>
                              </div>

                              <ColumnChart properties={layer.properties} layerName={layer.name} />

                              <div className="feature-details-list average-table" style={{marginTop: '15px'}}>
                                  <h5 style={{margin: '0 0 5px 0', color:'#777', fontSize: '0.9em'}}>
                                      {layer.calculationType.includes('Destaque') ? 'Detalhamento do Maior Valor:' : 'Dados Detalhados:'}
                                  </h5>
                                  {Object.entries(layer.properties).map(([key, value]) => {
                                      if (layer.calculationType.includes('Destaque') && key !== maxKey) return null;
                                      return renderProperty(key, value, layer.calculationType);
                                  })}
                              </div>
                          </div>
                      );
                  })}
              </>
          )}


          {flatOtherFeatures.length > 0 && (
              <>
                  <hr/>
                  <h4>Associações na região</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {flatOtherFeatures.map((feature, index) => (
                       
                      <li key={`${feature._layerName}-${index}`} style={{ marginBottom: '20px', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '10px', backgroundColor: '#fff' }}>
                        <div className="feature-properties">
                          {getFeatureProperties(feature.properties)}
                        </div>
                      </li>
                    ))}
                  </ul>
              </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
export default SelectionInfo;