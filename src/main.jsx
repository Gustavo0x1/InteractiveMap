import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import InteractiveMap from './InteractiveMap.jsx'

createRoot(document.getElementById('root')).render(

    <BrowserRouter>
      <Routes>
        {/* Rota da Página Inicial */}
        <Route path="/" element={<InteractiveMap />} />
        
        {/* Rota do Mapa com Contexto (curto, medio, longo prazo) */}
        <Route path="/mapa/:contexto" element={<InteractiveMap />} />
        
        {/* Redirecionamentos */}
        <Route path="/mapa" element={<Navigate to="/mapa/curto_prazo" replace />} />
        
        {/* Rota de Erro (Debug) - Se cair aqui, a rota acima falhou */}
        <Route path="*" element={
          <div style={{ padding: 20, textAlign: 'center' }}>
            <h1>Página não encontrada (404)</h1>
            <p>A rota acessada não existe.</p>
            <a href="/">Voltar ao Início</a>
          </div>
        } />
      </Routes>
    </BrowserRouter>

)