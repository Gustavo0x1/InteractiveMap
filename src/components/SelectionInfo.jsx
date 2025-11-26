// src/components/SelectionInfo.jsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import './styles/SelectionInfo.css';

// --- CONFIGURAÇÕES CONSTANTES ---
const IGNORE_PROPS = [
  'id', 'name', 'description', 'descrição', 'descricao', 'ID', 'LAT', 'LON', 'municipios', 
  'icon_url', 'icon_size', 'icon_anchor', 'TOTAL', 'Total', 'titulo'
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

    const hasMonths = data.some(d => MONTHS.includes(d.name.toUpperCase()));
    let chartTitle = "";

    if (hasMonths) {
        data.sort((a, b) => {
            const idxA = MONTHS.indexOf(a.name.toUpperCase());
            const idxB = MONTHS.indexOf(b.name.toUpperCase());
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        });
        chartTitle = `Variação Mensal`;
    } else {
        data.sort((a, b) => b.value - a.value);
        data = data.slice(0, 15);
        chartTitle = `Ranking (Top 15)`;
    }

    return (
        <div className="chart-wrapper">
            <h5 className="chart-title">{chartTitle}</h5>
            <div style={{ height: 280, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                            dataKey="name" 
                            interval={0} 
                            angle={-90} 
                            textAnchor="end" 
                            height={110} 
                            tick={{ fontSize: 10, fill: '#666', dy: 3 }} 
                            tickFormatter={formatLabel} 
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                        <Tooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            formatter={(value) => [value.toLocaleString('pt-BR'), 'Valor']}
                            labelFormatter={formatLabel}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill="#3b82f6" />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTE PARA ITEM EXPANSÍVEL ---
const FeatureItem = ({ feature, layerName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const properties = feature.properties;
    const name = properties.name || properties.Name || properties.Nome || properties.titulo || "Sem Nome";
    const description = properties.description || properties.Description || properties.descrição || properties.descricao;

    return (
        <div className={`feature-card ${isOpen ? 'expanded' : ''}`} onClick={() => setIsOpen(!isOpen)}>
            <div className="feature-header">
                <div className="feature-title-group">
                    <strong>{name}</strong>
                    <span className="feature-layer-tag">{layerName}</span>
                </div>
                <span className="toggle-icon">{isOpen ? '−' : '+'}</span>
            </div>

            {isOpen && (
                <div className="feature-body" onClick={(e) => e.stopPropagation()}>
                    {description && (
                        <div className="feature-description">
                            <strong>Descrição:</strong>
                            <p>{description}</p>
                        </div>
                    )}
                    <div className="feature-grid">
                        {Object.entries(properties).map(([key, value]) => {
                            if (IGNORE_PROPS.includes(key) || IGNORE_PROPS.includes(key.toLowerCase())) return null;
                            return (
                                <div key={key} className="grid-item">
                                    <span className="grid-key">{formatLabel(key)}:</span>
                                    <span className="grid-value">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- FUNÇÕES AUXILIARES DE CÁLCULO (CORRIGIDA) ---
// Restaurei a lista completa de palavras-chave para garantir que safras específicas ativem o modo MAX/Destaque
const isMaxAggregation = (layerName) => {
    if (!layerName) return false;
    const normalizedName = layerName.toLowerCase();
    return normalizedName.includes('cultivo') || 
           normalizedName.includes('cultura') || 
           normalizedName.includes('pecuária') || 
           normalizedName.includes('produção') || 
           normalizedName.includes('milho') || 
           normalizedName.includes('soja') || 
           normalizedName.includes('feijao') || 
           normalizedName.includes('cafe') || 
           normalizedName.includes('banana') || 
           normalizedName.includes('dados') || 
           normalizedName.includes('csv');
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
            Object.entries(metrics).forEach(([key, sum]) => finalMetrics[key] = sum / totalFeatures);
        }
    } else {
        Object.assign(finalMetrics, metrics);
    }

    return {
        count: totalFeatures,
        properties: { ...commonProps, ...finalMetrics },
        calculationType: operation === 'MAX' ? 'Destaques' : 'Média'
    };
};

// --- COMPONENTE DE RESULTADOS DA SIMULAÇÃO ---
const SimulationResults = ({ inputs, layers }) => {
    const irradiationLayer = layers.find(l => 
        l.properties && (l.properties.ANNUAL !== undefined || l.properties.JAN !== undefined)
    );

    if (!irradiationLayer) return null;

    const annualIrrad = irradiationLayer.properties.ANNUAL || 0;
    const systemPowerKW = (inputs.count * inputs.power) / 1000; 
    const usefulPanelArea = inputs.width * inputs.height;
    
    // Cálculo com Espaçamento
    const effectiveWidth = inputs.width; 
    const effectiveHeight = inputs.height + inputs.spacing; 
    const totalOccupiedArea = inputs.count * effectiveWidth * effectiveHeight; 
    
    const efficiencyFactor = 0.75; 
    const dailyIrradKWh = annualIrrad / 1000;

    const dailyGeneration = systemPowerKW * dailyIrradKWh * efficiencyFactor;
    const monthlyGeneration = dailyGeneration * 30;
    const annualGeneration = dailyGeneration * 365;
    const moduleEfficiency = (inputs.power / (usefulPanelArea * 1000)) * 100;

    return (
        <div className="simulation-result-card">
            <h5 className="result-title">⚡ Potencial de Geração Estimado</h5>
            <div className="result-grid">
                <div className="result-item">
                    <span className="result-label">Capacidade do Sistema</span>
                    <span className="result-value">{systemPowerKW.toFixed(2)} <small>kWp</small></span>
                </div>
                <div className="result-item highlight">
                    <span className="result-label">Geração Média Mensal</span>
                    <span className="result-value">{monthlyGeneration.toFixed(0)} <small>kWh</small></span>
                </div>
                <div className="result-item">
                    <span className="result-label">Área de Ocupação</span>
                    <span className="result-value">{totalOccupiedArea.toFixed(1)} <small>m²</small></span>
                </div>
                <div className="result-item">
                    <span className="result-label">Eficiência do Painel</span>
                    <span className="result-value" style={{ color: moduleEfficiency > 23 || moduleEfficiency < 15 ? '#d97706' : '#64748b' }}>
                        {moduleEfficiency.toFixed(1)}%
                    </span>
                </div>
                <div className="result-item">
                    <span className="result-label">Geração Anual</span>
                    <span className="result-value">{(annualGeneration/1000).toFixed(2)} <small>MWh</small></span>
                </div>
            </div>
            <p className="disclaimer">
                *Área considera espaçamento entre fileiras de {inputs.spacing}m. Geração baseada na irradiação local ({dailyIrradKWh.toFixed(2)} kWh/m²/dia).
            </p>
        </div>
    );
};


function SelectionInfo({ selectedFeatures, featureData, layers, onClose, recommendations }) {
  const [isMinimized, setIsMinimized] = useState(false);
  
  const [panelInputs, setPanelInputs] = useState({
      count: 100,
      width: 1.1,
      height: 2.3,
      power: 550,
      spacing: 1.5 
  });

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      const numValue = parseFloat(value);
      setPanelInputs(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        if (selectedFeatures && Object.keys(selectedFeatures).length > 0) {
            
            const steps = [
                {
                    element: '.info-panel-floating',
                    intro: 'Este é o <b>Relatório de Inteligência</b>. Aqui consolidamos todos os dados da área que você selecionou no mapa.',
                    position: 'right'
                },
                {
                    element: '.input-section',
                    intro: '<b>Simulador Solar:</b> Ajuste a quantidade, potência e dimensões dos painéis para simular um projeto fotovoltaico nesta região.',
                    position: 'right'
                },
                {
                    element: '.simulation-result-card',
                    intro: '<b>Resultados em Tempo Real:</b> Veja a estimativa de geração de energia e área necessária baseada nos dados climáticos locais.',
                    position: 'right'
                }
            ];

            if (document.querySelector('.insight-card')) {
                steps.push({
                    element: '.insight-card',
                    intro: '<b>Diagnóstico Inteligente:</b> O sistema identificou um potencial produtivo aqui! Veja as recomendações sugeridas.',
                    position: 'left'
                });
            }

            if (document.querySelector('.chart-wrapper')) {
                steps.push({
                    element: '.chart-wrapper',
                    intro: 'Visualize os dados climáticos e produtivos através destes gráficos interativos.',
                    position: 'left'
                });
            }

            if (document.querySelector('.features-container')) {
                steps.push({
                    element: '.features-container',
                    intro: 'Aqui estão as <b>Cooperativas e Pontos de Interesse</b> encontrados dentro da área selecionada. Clique neles para ver detalhes.',
                    position: 'left'
                });
            }

            introJs().setOptions({
                steps: steps,
                showProgress: true,
                showBullets: false,
                nextLabel: 'Próximo',
                prevLabel: 'Anterior',
                doneLabel: 'Entendi',
                exitOnOverlayClick: false,
                scrollToElement: true
            }).start();
        }
    }, 1000); 
    
    return () => clearTimeout(timer);
  }, [selectedFeatures]); 


  const getLayerName = (layerId) => {
    const layer = layers.find(l => l.id === layerId);
    return layer ? layer.name : layerId;
  };

  const isAreaSelection = selectedFeatures && Object.keys(selectedFeatures).length > 0;
  const isFeatureSelection = !!featureData;

  if (!isAreaSelection && !isFeatureSelection) return null;

  const title = isAreaSelection ? "Relatório de Inteligência" : (featureData.name || "Informações");
  const subtitle = isAreaSelection ? "Análise de Área" : "Detalhes da Feição";

  let content = null;
  
  if (isAreaSelection) {
      const layerTypeMap = new Map(layers.map(l => [l.id, l.type]));
      const aggregatedLayers = [];
      const otherFeatures = [];

      Object.entries(selectedFeatures).forEach(([layerId, features]) => {
          const layerType = layerTypeMap.get(layerId);
          const layerName = getLayerName(layerId);
          
          if (layerType === 'choropleth') {
              // Garante que a operação será MAX se for uma camada de cultivo/produção
              const operation = isMaxAggregation(layerName) ? 'MAX' : 'AVERAGE';
              const data = calculateMetricsForFeatures(features, operation);
              if (data.count > 0) aggregatedLayers.push({ id: layerId, name: layerName, ...data });
          } else {
              otherFeatures.push({ id: layerId, name: layerName, features: features });
          }
      });

      // LÓGICA DE DIAGNÓSTICO (RESTAURADA)
      let diagnosisBlock = null;
      for (const layer of aggregatedLayers) {
          // Verifica se a camada foi marcada como Destaques (MAX)
          if (layer.calculationType === 'Destaques') {
              let maxKey = null;
              let maxVal = -Infinity;
              let maxLocation = "";

              // Encontra o maior valor dentro dessa camada
              Object.entries(layer.properties).forEach(([key, data]) => {
                  if (data && typeof data.value === 'number') {
                      if (data.value > maxVal) {
                          maxVal = data.value;
                          maxKey = key; 
                          maxLocation = data.location; // Recupera a cidade
                      }
                  }
              });

              // Se achou um destaque, procura no recommendation.csv
              if (maxKey && recommendations) {
                  let rec = recommendations[maxKey] || recommendations[maxKey.toUpperCase()];
                  if (!rec) rec = recommendations[`"${maxKey}"`];
                  
                  if (rec) {
                      diagnosisBlock = (
                          <div className="insight-card">
                              <div className="insight-icon">💡</div>
                              <div className="insight-content">
                                  <h4>Diagnóstico: Polo de {formatLabel(maxKey)}</h4>
                                  <p>Foi identificado um polo produtor nesta região, com destaque para <strong>{maxLocation}</strong>.</p>
                                  <div className="insight-tags">
                                      <span className="tag">Recomendação: {rec.PainelRecomendado}</span>
                                      <span className="tag">Irrigação: {rec.IrrigacaoRecomendada}</span>
                                  </div>
                              </div>
                          </div>
                      );
                      // Para no primeiro diagnóstico encontrado para não poluir
                      break;
                  }
              }
          }
      }

      content = (
          <>
              {/* Renderiza o Diagnóstico no topo, se existir */}
              {diagnosisBlock}
              
              <div className="section-block input-section">
                  <h4 className="section-title">Simulação Fotovoltaica</h4>
                  <div className="input-grid">
                      <div className="input-group">
                          <label>Qtd. Painéis</label>
                          <input type="number" name="count" value={panelInputs.count} onChange={handleInputChange} className="modern-input"/>
                      </div>
                      <div className="input-group">
                          <label>Potência (W)</label>
                          <input type="number" name="power" value={panelInputs.power} onChange={handleInputChange} className="modern-input"/>
                      </div>
                      <div className="input-group">
                          <label>Largura (m)</label>
                          <input type="number" name="width" value={panelInputs.width} onChange={handleInputChange} step="0.1" className="modern-input"/>
                      </div>
                      <div className="input-group">
                          <label>Altura (m)</label>
                          <input type="number" name="height" value={panelInputs.height} onChange={handleInputChange} step="0.1" className="modern-input"/>
                      </div>
                      <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                          <label>Distância entre Fileiras (m)</label>
                          <input type="number" name="spacing" value={panelInputs.spacing} onChange={handleInputChange} step="0.1" className="modern-input"/>
                      </div>
                  </div>
                  
                  <SimulationResults inputs={panelInputs} layers={aggregatedLayers} />
              </div>

              {aggregatedLayers.map(layer => (
                  <div key={layer.id} className="section-block">
                      <h4 className="section-title">{layer.name} <span className="badge">{layer.calculationType}</span></h4>
                      <ColumnChart properties={layer.properties} layerName={layer.name} />
                  </div>
              ))}

              {otherFeatures.length > 0 && (
                  <div className="section-block">
                      <h4 className="section-title">Pontos de Interesse / Cooperativas</h4>
                      <div className="features-container">
                          {otherFeatures.map(layer => (
                              layer.features.map((feature, index) => (
                                  <FeatureItem 
                                      key={`${layer.id}-${index}`} 
                                      feature={feature} 
                                      layerName={layer.name} 
                                  />
                              ))
                          ))}
                      </div>
                  </div>
              )}
          </>
      );
  } else {
      content = (
          <div className="feature-details-list">
              {Object.entries(featureData).map(([key, value]) => {
                   if (IGNORE_PROPS.includes(key)) return null;
                   return (
                       <div key={key} className="detail-row">
                           <span className="detail-key">{formatLabel(key)}</span>
                           <span className="detail-value">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                       </div>
                   )
              })}
          </div>
      )
  }

  return (
    <div className={`info-panel-floating ${isMinimized ? 'minimized' : ''}`}>
        <div className="panel-header">
            <div className="header-info">
                <h2>{title}</h2>
                {!isMinimized && <span className="header-subtitle">{subtitle}</span>}
            </div>
            <div className="header-actions">
                <button className="icon-btn" onClick={() => setIsMinimized(!isMinimized)} title={isMinimized ? "Expandir" : "Minimizar"}>
                   {isMinimized ? '⤢' : '—'}
                </button>
                <button className="icon-btn close-btn" onClick={onClose} title="Fechar">×</button>
            </div>
        </div>
        {!isMinimized && (
            <div className="panel-scroll-content">
                {content}
            </div>
        )}
    </div>
  );
}

export default SelectionInfo;