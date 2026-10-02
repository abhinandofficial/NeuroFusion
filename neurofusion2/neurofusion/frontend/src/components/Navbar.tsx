import React, { useState, useEffect } from 'react';
import { Sun, Moon, Cpu, ArrowRight, Menu, X, Brain } from 'lucide-react';
import type { HealthStatus } from '../lib/types';

interface NavbarProps {
  health: HealthStatus | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, darkMode, setDarkMode }) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDemo = health?.model_mode === 'calibrated_demo';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
      const sections = ['demo', 'results', 'architecture', 'journey', 'why-mri', 'dataset'];
      const scrollPos = window.scrollY + 120;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const navLinks = [
    { id: 'demo', label: 'Demo' },
    { id: 'results', label: 'Results' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'journey', label: 'Research Journey' },
    { id: 'why-mri', label: 'Clinical Context' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        darkMode
          ? 'bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80'
          : scrolled
            ? 'bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm'
            : 'bg-white border-b border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
          aria-label="NeuroFusion – scroll to top"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-cyan-500/20 border border-cyan-500/40' : 'bg-[#0a0a0a]'}`}>
            <Brain className={`w-5 h-5 ${darkMode ? 'text-cyan-400' : 'text-white'}`} />
          </div>
          <span className={`text-base font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-[#0a0a0a]'}`}>
            Neuro<span className={darkMode ? 'text-cyan-400' : 'text-slate-400'}>Fusion</span>
          </span>
        </button>

        {/* Desktop Nav links (centered) */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? darkMode
                      ? 'text-cyan-300 bg-cyan-500/10'
                      : 'text-[#0a0a0a] font-semibold'
                    : darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      : 'text-slate-500 hover:text-[#0a0a0a]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2.5">
          {/* Mode badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
              isDemo
                ? darkMode
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
                : darkMode
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
            title={health?.message || 'Inference Engine Status'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isDemo ? 'bg-amber-400' : 'bg-emerald-500'}`} />
            <Cpu className="w-3 h-3" />
            <span>{isDemo ? 'Calibrated Demo' : 'PyTorch Live'}</span>
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full transition-colors ${
              darkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-700 hover:bg-gray-100'
            }`}
            aria-label="Toggle dark / light mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Launch Demo CTA */}
          <button
            type="button"
            onClick={() => scrollTo('demo')}
            className={`hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              darkMode
                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                : 'bg-[#0a0a0a] text-white hover:bg-[#222]'
            }`}
          >
            <span>Launch Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 rounded-full transition-colors ${
              darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-gray-100'
            }`}
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={`lg:hidden border-t px-4 py-3 space-y-1 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-100'}`}>
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-gray-50 hover:text-[#0a0a0a]'
              }`}
            >
              {link.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => scrollTo('demo')}
            className="w-full mt-2 px-4 py-2.5 rounded-full bg-[#0a0a0a] text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            Launch Demo <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
