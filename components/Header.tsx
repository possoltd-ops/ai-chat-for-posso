
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <i className="fas fa-bolt text-xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">POSSO<span className="text-blue-600">LTD</span></h1>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 leading-none">Restaurant Tech Pioneers</p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-8">
          <a href="#" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">ePOS</a>
          <a href="#" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Kiosks</a>
          <a href="#" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Shop Fitting</a>
          <a href="#" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Ticketing</a>
        </nav>

        <div className="flex items-center gap-4">
          <button className="hidden sm:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-bold transition-all">
            <i className="fas fa-phone-alt text-xs"></i>
            0808 175 3956
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-95">
            Book Demo
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
