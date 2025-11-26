import React, { useState, useEffect } from 'react';
import { Menu, X, CheckCircle, Mail, MapPin, Phone, ArrowRight, Star } from 'lucide-react';

import AgroPvIMG from '/src/img/FrontPage/AgroPvImg.jpg'

// 1. Componente de Navegação (Header)
const Navigation = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const toggleNav = () => setIsNavOpen(!isNavOpen);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top shadow-sm">
      <div className="container">
        <a className="navbar-brand fw-bold d-flex align-items-center" href="#">
          <Star className="me-2" size={24} />
          MinhaMarca
        </a>
        
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          onClick={toggleNav}
          aria-label="Toggle navigation"
        >
          {isNavOpen ? <X color="white" /> : <Menu color="white" />}
        </button>

        <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`}>
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link text-white" href="#produto">Nosso Produto</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="#sobre">Sobre Nós</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="#contato">Contato</a>
            </li>
            <li className="nav-item ms-lg-3">
              <button className="btn btn-light text-primary fw-bold btn-sm mt-1 mt-lg-0">
                Entrar
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

// 2. Componente Hero (Banner Principal com Background de Imagem)
const Hero = () => {
  return (
    <header 
      className="py-5 mb-5 border-bottom" 
      style={{ 
       backgroundImage: `url(${AgroPvIMG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}
    >
      {/* Overlay escuro para melhorar a leitura do texto */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)', // Ajuste a opacidade aqui
          zIndex: 1
        }}
      ></div>

      <div className="container px-5" style={{ position: 'relative', zIndex: 2 }}>
        <div className="row gx-5 align-items-center justify-content-center">
          <div className="col-lg-8 col-xl-7 col-xxl-6">
            <div className="my-5 text-center text-xl-start">
              {/* Texto alterado para branco para contrastar com o fundo escuro */}
              <h1 className="display-5 fw-bolder text-white mb-2">
           Agro Photovoltaics

              </h1>

            </div>
          </div>
        
        </div>
      </div>
    </header>
  );
};

// 3. Componente "Nosso Produto"
const ProductFeatures = () => {
  const features = [
    { title: "Análise em Tempo Real", desc: "Dados atualizados instantaneamente para melhor tomada de decisão." },
    { title: "Interface Intuitiva", desc: "Design focado na experiência do usuário e facilidade de uso." },
    { title: "Segurança Avançada", desc: "Criptografia de ponta a ponta protegendo seus dados." },
  ];

  return (
    <section className="py-5" id="produto">
      <div className="container px-5 my-5">
        <div className="row gx-5 justify-content-center">
          <div className="col-lg-8 col-xl-6">
            <div className="text-center">
              <h2 className="fw-bolder">Nosso Produto</h2>
              <p className="lead fw-normal text-muted mb-5">
                Feito para escalar o seu negócio com ferramentas poderosas.
              </p>
            </div>
          </div>
        </div>
        <div className="row gx-5">
          {features.map((item, index) => (
            <div className="col-lg-4 mb-5" key={index}>
              <div className="card h-100 shadow border-0">
                <div className="card-body p-4">
                  <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3 d-inline-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                    <CheckCircle size={24} />
                  </div>
                  <h5 className="card-title fw-bold mt-2">{item.title}</h5>
                  <p className="card-text text-muted">{item.desc}</p>
                </div>
                <div className="card-footer p-4 pt-0 bg-transparent border-top-0">
                  <div className="d-flex align-items-end justify-content-between">
                    <div className="d-flex align-items-center">
                       <small className="text-primary fw-bold" style={{cursor: 'pointer'}}>Ver detalhes <ArrowRight size={14}/></small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 4. Componente Sobre Nós
const AboutUs = () => {
  return (
    <section className="py-5 bg-light" id="sobre">
      <div className="container px-5 my-5">
        <div className="row gx-5 align-items-center">
          <div className="col-lg-6 order-first order-lg-last">
            <img 
              className="img-fluid rounded mb-5 mb-lg-0 shadow" 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Sobre nós" 
            />
          </div>
          <div className="col-lg-6">
            <h2 className="fw-bolder">Sobre Nossa Missão</h2>
            <p className="lead fw-normal text-muted mb-4">
              Fundada em 2023, nossa empresa nasceu com o objetivo de simplificar a complexidade digital.
            </p>
            <p className="text-muted">
              Acreditamos que a tecnologia deve ser uma ponte, não uma barreira. Nossa equipe multidisciplinar trabalha incansavelmente para entregar produtos que não apenas funcionam, mas encantam. Valorizamos a transparência, a colaboração e a excelência técnica em cada linha de código.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// 5. Componente de Contato
const Contact = () => {
  return (
    <section className="py-5" id="contato">
      <div className="container px-5">
        <div className="bg-light rounded-3 py-5 px-4 px-md-5 mb-5 shadow-sm border">
          <div className="text-center mb-5">
            <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3 d-inline-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
              <Mail size={24} />
            </div>
            <h2 className="fw-bolder">Entre em Contato</h2>
            <p className="lead fw-normal text-muted mb-0">Adoraríamos ouvir você!</p>
          </div>
          <div className="row gx-5 justify-content-center">
            <div className="col-lg-8 col-xl-6">
              <form>
                <div className="form-floating mb-3">
                  <input className="form-control" id="name" type="text" placeholder="Nome" />
                  <label htmlFor="name">Nome completo</label>
                </div>
                <div className="form-floating mb-3">
                  <input className="form-control" id="email" type="email" placeholder="name@example.com" />
                  <label htmlFor="email">Endereço de Email</label>
                </div>
                <div className="form-floating mb-3">
                  <textarea className="form-control" id="message" style={{ height: '10rem' }} placeholder="Mensagem"></textarea>
                  <label htmlFor="message">Mensagem</label>
                </div>
                <div className="d-grid">
                  <button className="btn btn-primary btn-lg" type="submit">Enviar Mensagem</button>
                </div>
              </form>
            </div>
          </div>
          <div className="row mt-5 text-center">
             <div className="col-md-4 mb-3">
                <MapPin className="text-primary mb-2" />
                <p className="text-muted">Av. Paulista, 1000 - SP</p>
             </div>
             <div className="col-md-4 mb-3">
                <Phone className="text-primary mb-2" />
                <p className="text-muted">(11) 99999-9999</p>
             </div>
             <div className="col-md-4 mb-3">
                <Mail className="text-primary mb-2" />
                <p className="text-muted">contato@minhamarca.com</p>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// 6. Footer
const Footer = () => {
  return (
    <footer className="py-4 bg-dark mt-auto">
      <div className="container px-5">
        <div className="row align-items-center justify-content-between flex-column flex-sm-row">
          <div className="col-auto">
            <div className="small m-0 text-white">Copyright &copy; MinhaMarca 2024</div>
          </div>
          <div className="col-auto">
            <a className="link-light small" href="#!">Privacidade</a>
            <span className="text-white mx-1">&middot;</span>
            <a className="link-light small" href="#!">Termos</a>
            <span className="text-white mx-1">&middot;</span>
            <a className="link-light small" href="#!">FAQ</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Componente Página Inicial (Agrupador) ---
// Este seria o componente que você "importaria" no seu App principal
const HomePage = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navigation />
      <Hero />
      <ProductFeatures />
      <AboutUs />
      <Contact />
      <Footer />
    </div>
  );
};

// --- Componente Principal APP ---
export default function App() {
  
  // Efeito para injetar o Bootstrap CSS dinamicamente
  // (Isso garante que o Bootstrap funcione neste ambiente de preview)
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css";
    link.rel = "stylesheet";
    link.integrity = "sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);

    // Limpeza ao desmontar
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <HomePage />
  );
}