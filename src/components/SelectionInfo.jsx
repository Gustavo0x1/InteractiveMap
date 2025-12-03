// src/components/SelectionInfo.jsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import './styles/SelectionInfo.css';
import img_painel_altura from '../img/ICONS/PainelSolar_altura.png'
import img_painel_largura from '../img/ICONS/PainelSolar_largura.png'
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

// --- CHART COMPONENT ---
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
        chartTitle = `Principais`;
    }

    return (
        <div className="chart-wrapper">
            <h5 className="chart-title">{chartTitle}</h5>
            <div style={{ height: 280, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" interval={0} angle={-90} textAnchor="end" height={110} tick={{ fontSize: 10, fill: '#666', dy: 3 }} tickFormatter={formatLabel} />
                        <YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} formatter={(value) => [value.toLocaleString('pt-BR'), 'Valor']} labelFormatter={formatLabel} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill="#3b82f6" />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- FEATURE ITEM ---
const FeatureItem = ({ feature, layerName }) => {
    
    const [isOpen, setIsOpen] = useState(false);
    const properties = feature.properties;
    console.log(properties)
    const name = properties.name || properties.Name || properties.Nome || properties.titulo || "Sem Nome";
    const description = properties.description || properties.Description || properties.descrição || properties.descricao || properties.DESCRICAO;

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
                    {description && <div className="feature-description"><strong>Descrição:</strong><p>{description}</p></div>}
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

// --- HELPERS ---
const isMaxAggregation = (layerName) => {
    if (!layerName) return false;
    const normalizedName = layerName.toLowerCase();
    return normalizedName.includes('cultivo') || normalizedName.includes('cultura') || normalizedName.includes('pecuária') || 
           normalizedName.includes('produção') || normalizedName.includes('Agricultura') || normalizedName.includes('soja') || 
           normalizedName.includes('feijao') || normalizedName.includes('cafe') || normalizedName.includes('banana') || 
           normalizedName.includes('dados') || normalizedName.includes('csv') || normalizedName.includes('médio') || 
           normalizedName.includes('medio') || normalizedName.includes('longo') || normalizedName.includes('prazo') || 
           normalizedName.includes('cenário') || normalizedName.includes('projecao');
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
                        if (value > metrics[key].value) metrics[key] = { value: value, location: featureLocation };
                    }
                }
            } else if (!commonProps.hasOwnProperty(key)) commonProps[key] = value;
        });
    });

    const finalMetrics = {};
    if (operation === 'AVERAGE') {
        if (totalFeatures === 1) Object.assign(finalMetrics, metrics);
        else Object.entries(metrics).forEach(([key, sum]) => finalMetrics[key] = sum / totalFeatures);
    } else Object.assign(finalMetrics, metrics);

    return { count: totalFeatures, properties: { ...commonProps, ...finalMetrics }, calculationType: operation === 'MAX' ? 'Destaques' : 'Média' };
};

// --- COMPONENTE DE RESULTADOS (CORRIGIDO) ---
// Adicionamos valores padrão (default parameters) para evitar o erro 'undefined'
const SimulationResults = ({ finalCount = 0, finalAreaM2 = 0, powerKW = 0, layers = [], tariff = 0.95 }) => {
    const irradiationLayer = layers.find(l => l.properties && (l.properties.ANNUAL !== undefined || l.properties.JAN !== undefined));
    if (!irradiationLayer) return null;

    const annualIrrad = irradiationLayer.properties.ANNUAL || 0;
    const efficiencyFactor = 0.75; 
    const dailyIrradKWh = annualIrrad;
    
    // Geração de Energia
    const dailyGeneration = powerKW * dailyIrradKWh * efficiencyFactor;
    const monthlyGeneration = dailyGeneration * 30;
    const annualGeneration = dailyGeneration * 365;

    // Cálculos Financeiros e Ambientais
    const monthlySavings = monthlyGeneration * tariff;
    const annualSavings = annualGeneration * tariff;
    const co2Avoided = (annualGeneration * 0.1) / 1000; // ~0.1 kg CO2/kWh -> convertido para Toneladas
    const homesPowered = monthlyGeneration / 150; // Média 150kWh/mês por residência

    const safeCount = Number.isFinite(finalCount) ? finalCount : 0;
    const safeArea = Number.isFinite(finalAreaM2) ? finalAreaM2 : 0;
    const areaInHa = safeArea / 10000;
    return (
        <div className="simulation-result-card">
            <h5 className="result-title">⚡ Análise de Viabilidade</h5>
            <div className="result-grid">
                {/* Dados Técnicos */}
                <div className="result-item">
                    <span className="result-label">Módulos</span>
                    <span className="result-value">{safeCount.toLocaleString()} <small>unid.</small></span>
                </div>
                <div className="result-item">
                    <span className="result-label">Capacidade</span>
                    <span className="result-value">{powerKW.toFixed(2)} <small>kWp</small></span>
                </div>
                           <div className="result-item">
                    <span className="result-label">Área utilizada em m²</span>
                    <span className="result-value">{safeArea} <small>m²</small></span>
                </div>
                <div className="result-item">
                    <span className="result-label">Área utilizada em Ha</span>
                    <span className="result-value">{areaInHa} <small>Ha</small></span>
                </div>
                
           
                
                {/* Dados Financeiros (Destaque) */}
                <div className="result-item highlight-money" style={{backgroundColor: '#f0fdf4', borderColor: '#bbf7d0'}}>
                    <span className="result-label" style={{color: '#166534'}}>Economia Mensal</span>
                    <span className="result-value" style={{color: '#15803d'}}>
                        {monthlySavings.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                    </span>
                </div>
                <div className="result-item highlight-money" style={{backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', gridColumn: 'span 2'}}>
                    <span className="result-label" style={{color: '#166534'}}>Economia Estimada (Anual)</span>
                    <span className="result-value" style={{color: '#15803d', fontSize: '1.2em'}}>
                        {annualSavings.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                    </span>
                </div>

        
            </div>
            <p className="disclaimer">
                *Considerando tarifa de {tariff.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}/kWh
            </p>
        </div>
    );
};
// --- COMPONENTE PRINCIPAL ---
function SelectionInfo({ selectedFeatures, featureData, layers, onClose, recommendations }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [simMode, setSimMode] = useState('count');

  const [panelInputs, setPanelInputs] = useState({
      count: 100,
      width: 1.1,
      height: 2.3,
      power: 550,
      spacing: 1.5 
  });
  
  const [areaInput, setAreaInput] = useState({ value: 1, unit: 'ha' });

  const handlePanelChange = (e) => {
      const { name, value } = e.target;
      // Garante que o valor seja numérico ou 0, evitando undefined
      setPanelInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleAreaChange = (e) => {
      const { name, value } = e.target;
      if (name === 'unit') setAreaInput(prev => ({ ...prev, unit: value }));
      else setAreaInput(prev => ({ ...prev, value: parseFloat(value) || 0 }));
  };

const isValidDimensions = (panelInputs.width > 0) && (panelInputs.height > 0);
const singlePanelArea = isValidDimensions 
      ? panelInputs.width * (panelInputs.height + (panelInputs.spacing || 0))
      : 0;
  let finalCount = 0;
  let finalAreaM2 = 0;

  if (simMode === 'count') {
      finalCount = panelInputs.count || 0;
      finalAreaM2 = finalCount * singlePanelArea;
  } else {
      const inputAreaM2 = areaInput.unit === 'ha' ? (areaInput.value || 0) * 10000 : (areaInput.value || 0);
      finalAreaM2 = inputAreaM2;
      finalCount = singlePanelArea > 0 ? Math.floor(inputAreaM2 / singlePanelArea) : 0;
  }

  const finalSystemPowerKW = (finalCount * (panelInputs.power || 0)) / 1000;

  useEffect(() => {
    const timer = setTimeout(() => {
        if (selectedFeatures && Object.keys(selectedFeatures).length > 0) {
            introJs().setOptions({
                steps: [
                    { element: '.info-panel-floating', intro: 'Este é o <b>Visualizador de seleção</b>, aqui você encontrará informações específicas da área selecionada.', position: 'right' },
                    { element: '.intro_fotosim', intro: 'Simulador Fotovoltáico: Obtenha uma análise rápida a respeito das possibilidades da sua região!.', position: 'right' },
                    { intro: 'O Visualizador de seleção também fornece a visualização gráfica dos dados a respeito da Pecuária e Cultivo na região, além de cooperativas próximas. <br/> Sinta-se livre para explorar a ferramenta', position: 'right' }
                ],
                showProgress: true, showBullets: false, doneLabel: 'Ok'
            }).start();
        }
    }, 1000); 
    return () => clearTimeout(timer);
  }, [selectedFeatures]); 

  const isAreaSelection = selectedFeatures && Object.keys(selectedFeatures).length > 0;
  const isFeatureSelection = !!featureData;
  if (!isAreaSelection && !isFeatureSelection) return null;
  const title = isAreaSelection ? "Relatório da seleção" : (featureData.name || "Informações");

  let content = null;
  
  if (isAreaSelection) {
      const layerTypeMap = new Map(layers.map(l => [l.id, l.type]));
      const aggregatedLayers = [];
      const otherFeatures = [];

      Object.entries(selectedFeatures).forEach(([layerId, features]) => {
          const l = layers.find(lay => lay.id === layerId);
          const layerName = l ? l.name : layerId;
          const layerType = layerTypeMap.get(layerId);
          
          if (layerType === 'choropleth') {
              const op = isMaxAggregation(layerName) ? 'MAX' : 'AVERAGE';
              const d = calculateMetricsForFeatures(features, op);
              if (d.count > 0) aggregatedLayers.push({ id: layerId, name: layerName, ...d });
          } else {
              otherFeatures.push({ id: layerId, name: layerName, features: features });
          }
      });

      // LÓGICA DE DIAGNÓSTICO
      let diagnosisBlock = null;
      for (const layer of aggregatedLayers) {
          if (layer.calculationType === 'Destaques') {
              let maxKey = null; let maxVal = -Infinity; let maxLocation = "";
              Object.entries(layer.properties).forEach(([key, data]) => {
                  if (data && typeof data.value === 'number') {
                      if (data.value > maxVal) { maxVal = data.value; maxKey = key; maxLocation = data.location; }
                  }
              });
              if (maxKey && recommendations) {
                  const normalizedMaxKey = maxKey.toUpperCase().trim();
                  let rec = recommendations[normalizedMaxKey];
                  if (!rec) {
                      const recKeys = Object.keys(recommendations);
                      const partialMatch = recKeys.find(rKey => normalizedMaxKey.includes(rKey.toUpperCase()) && rKey.length > 3);
                      if (partialMatch) rec = recommendations[partialMatch];
                  }
                  if (rec) {
                      diagnosisBlock = (
                          <div className="insight-card">
                              <div className="insight-icon">💡</div>
                              <div className="insight-content">
                                  <h4>Diagnóstico: Polo de {formatLabel(maxKey)}</h4>
                                  <p>Polo produtor identificado em <strong>{maxLocation}</strong>.</p>
                                  <div className="insight-tags">
                                      <span className="tag">Recomendação: {rec.PainelRecomendado}</span>
                                    
                                  </div>
                              </div>
                          </div>
                      );
                      break;
                  }
              }
          }
      }

      content = (
          <>
              {diagnosisBlock}
              
              <div className="section-block input-section intro_fotosim">
                  <h4 className="section-title">Simulação Fotovoltaica</h4>
                  
                  {/* --- OPÇÃO 1: QUANTIDADE DE PAINÉIS --- */}
                  <div 
                    className={`sim-option-container ${simMode === 'count' ? 'active' : 'disabled'}`}
                    onClick={() => setSimMode('count')}
                  >
                      <div className="sim-option-header">
                          <input type="radio" checked={simMode === 'count'} readOnly />
                          <label>Definir por Quantidade</label>
                      </div>
                      <div className="sim-option-body">
                          <label className="sub-label">Número de Módulos</label>
                          <input 
                              type="number" 
                              name="count" 
                              value={simMode === 'count' ? panelInputs.count : finalCount} 
                              onChange={handlePanelChange} 
                              className="modern-input"
                              disabled={simMode !== 'count'}
                          />
                          {simMode !== 'count' && (
                              <div className="disabled-alert">
                                  ⚠️ Calculado automaticamente pela Área.
                              </div>
                          )}
                      </div>
                  </div>

                  {/* --- OPÇÃO 2: ÁREA DISPONÍVEL --- */}
                  <div 
                    className={`sim-option-container ${simMode === 'area' ? 'active' : 'disabled'}`}
                    onClick={() => setSimMode('area')}
                  >
                      <div className="sim-option-header">
                          <input type="radio" checked={simMode === 'area'} readOnly />
                          <label>Definir por Área Disponível</label>
                      </div>
                      <div className="sim-option-body">
                          <label className="sub-label">Área Total</label>
                          <div className="d-flex gap-2">
                              <input 
                                  type="number" 
                                  name="value" 
                                  value={simMode === 'area' ? areaInput.value : (areaInput.unit === 'ha' ? (finalAreaM2/10000).toFixed(4) : finalAreaM2.toFixed(0))} 
                                  onChange={handleAreaChange} 
                                  className="modern-input"
                                  style={{flex: 2}}
                                  disabled={simMode !== 'area'}
                              />
                              <select 
                                  name="unit" 
                                  value={areaInput.unit} 
                                  onChange={handleAreaChange} 
                                  className="modern-input"
                                  style={{flex: 1}}
                                  disabled={simMode !== 'area'}
                              >
                                  <option value="m2">m²</option>
                                  <option value="ha">ha</option>
                              </select>
                          </div>
                          {simMode !== 'area' && (
                              <div className="disabled-alert">
                                  ⚠️ Calculado automaticamente pela quanitdade de módulos.
                              </div>
                          )}
                      </div>
                  </div>

       <div className="input-grid mt-3">
    <div className="input-group">
        <label>Potência (W)</label>
        <input 
            type="number" 
            name="power" 
            value={panelInputs.power} 
            onChange={handlePanelChange} 
            className="modern-input"
        />
    </div>
    
    <div className="input-group">
        <label>
            Largura (m) 
            <img className='solarPanel_icon' src={img_painel_largura} alt="Largura" />
        </label>
        <input 
            type="number" 
            name="width" 
            value={panelInputs.width} 
            onChange={handlePanelChange} 
            step="0.1" 
            className="modern-input"
        />
    </div>
    
    <div className="input-group">
        <label>
            Altura (m) 
            <img className='solarPanel_icon' src={img_painel_altura} alt="Altura" />
        </label>
        <input 
            type="number" 
            name="height" 
            value={panelInputs.height} 
            onChange={handlePanelChange} 
            step="0.1" 
            className="modern-input"
        />
    </div>
    
    <div className="input-group" >
        <label>
            Espaçamento entre Fileiras (m)
            {/* Se quiser usar ícone aqui também */}
            {/* <img className='solarPanel_icon' src={img_painel_altura} alt="Espaçamento" /> */}
        </label>
        <input 
            type="number" 
            name="spacing" 
            value={panelInputs.spacing} 
            onChange={handlePanelChange} 
            step="0.1" 
            className="modern-input"
        />
    </div>
</div>

                  <SimulationResults 
                      finalCount={finalCount || 0} 
                      finalAreaM2={finalAreaM2 || 0} 
                      powerKW={finalSystemPowerKW || 0}
                      layers={aggregatedLayers} 
                  />
              </div>

              {aggregatedLayers.map(layer => (
                  <div key={layer.id} className="section-block">
                      <h4 className="section-title">{layer.name} <span className="badge">{layer.calculationType}</span></h4>
                      <ColumnChart properties={layer.properties} layerName={layer.name} />
                  </div>
              ))}
              {otherFeatures.length > 0 && (
                  <div className="section-block">
                      <h4 className="section-title">Pontos de Interesse</h4>
                      <div className="features-container">
                          {otherFeatures.map(layer => layer.features.map((feature, index) => <FeatureItem key={`${layer.id}-${index}`} feature={feature} layerName={layer.name} />))}
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
                   if(key == "TITULO" || key == "DESCRICAO"){
                   return <div key={key} className="detail-row"><span className="detail-value">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span></div> 
                   }
                   return <div key={key} className="detail-row"><span className="detail-key">{formatLabel(key)}</span><span className="detail-value">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span></div>
              })}
          </div>
      )
  }

  return (
    <div className={`info-panel-floating ${isMinimized ? 'minimized' : ''}`}>
        <div className="panel-header">
            <div className="header-info"><h2>{title}</h2>{!isMinimized && <span className="header-subtitle">Análise</span>}</div>
            <div className="header-actions">
                <button className="icon-btn" onClick={() => setIsMinimized(!isMinimized)}>{isMinimized ? '⤢' : '—'}</button>
                <button className="icon-btn close-btn" onClick={onClose}>×</button>
            </div>
        </div>
        {!isMinimized && <div className="panel-scroll-content">{content}</div>}
    </div>
  );
}

export default SelectionInfo;