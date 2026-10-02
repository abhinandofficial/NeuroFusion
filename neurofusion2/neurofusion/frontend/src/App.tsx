import { useState, useEffect, lazy, Suspense } from 'react';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { DemoSection } from './components/demo/DemoSection';
import { ResultsSection } from './components/ResultsSection';
import { ArchitectureSection } from './components/ArchitectureSection';
import { JourneySection } from './components/JourneySection';
import { ClinicalSection } from './components/ClinicalSection';
import { DatasetSection } from './components/DatasetSection';
import { Footer } from './components/Footer';
import { getHealth, getResearchMetrics, getSamples } from './lib/api';
import type { HealthStatus, ResearchMetrics, SamplePatient } from './lib/types';
import { ArrowRight, Brain } from 'lucide-react';

function App() {
  const [darkMode, setDarkMode] = useState(false); // light is default
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<ResearchMetrics | null>(null);
  const [samples, setSamples] = useState<SamplePatient[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply dark/light mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  // Fetch initial data
  useEffect(() => {
    async function initialize() {
      try {
        const [h, m, s] = await Promise.all([getHealth(), getResearchMetrics(), getSamples()]);
        setHealth(h);
        setMetrics(m);
        setSamples(s);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }
    initialize();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm text-slate-500 font-medium">Initializing NeuroFusion…</span>
        </div>
      </div>
    );
  }

  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-body)]">
        {/* Persistent Disclaimer Banner */}
        <DisclaimerBanner />

        {/* Sticky Navigation */}
        <Navbar health={health} darkMode={darkMode} setDarkMode={setDarkMode} />

        {/* Page Sections */}
        <main>
          {/* 1. Hero / Landing */}
          <HeroSection />

          {/* 2. Interactive Inference Demo */}
          <DemoSection samples={samples} />

          {/* 3. Results & Ablation Study */}
          {metrics && <ResultsSection metrics={metrics} />}

          {/* 4. Model Architecture */}
          <ArchitectureSection />

          {/* 5. Research Journey Timeline */}
          {metrics && <JourneySection journey={metrics.research_journey} />}

          {/* 6. Clinical Context & Limitations */}
          {metrics && <ClinicalSection metrics={metrics} />}

          {/* 7. Dataset & Tech Stack */}
          {metrics && <DatasetSection metrics={metrics} />}

          {/* 8. Dark CTA Block */}
          <section className="py-16 sm:py-20 px-4">
            <div className="max-w-4xl mx-auto bg-[#0a0a0a] rounded-3xl px-8 py-16 sm:py-20 text-center">
              <p className="eyebrow text-slate-500 mb-4">Interactive Demo</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                See the multimodal pipeline
                <span className="block text-slate-400">in action.</span>
              </h2>
              <p className="text-slate-400 text-base mb-8 max-w-xl mx-auto leading-relaxed">
                Upload a T1 MPRAGE NIfTI scan or load an ADNI sample subject. Adjust clinical biomarkers and watch the model classify in real time.
              </p>
              <button
                type="button"
                onClick={scrollToDemo}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-[#0a0a0a] font-bold rounded-full hover:bg-slate-100 transition-colors shadow-lg"
              >
                <span>Try the Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default App;
