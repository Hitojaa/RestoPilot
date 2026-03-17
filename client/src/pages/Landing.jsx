import { Link } from 'react-router-dom';
import { ChefHat, ArrowRight, BarChart2, Zap, TrendingUp } from 'lucide-react';

const FEATURES = [
  { icon: BarChart2,  label: 'Analytics en temps réel',   desc: 'CA, couverts, ticket moyen — tout en un coup d\'œil.' },
  { icon: Zap,        label: 'Insights automatiques',       desc: 'L\'IA détecte vos plats stars, vos créneaux morts, vos opportunités de prix.' },
  { icon: TrendingUp, label: 'Simulation de revenus',       desc: 'Testez l\'impact d\'une hausse de prix avant de l\'appliquer.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-bg-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center">
            <ChefHat size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-text-primary">RestoPilot</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Se connecter
          </Link>
          <Link
            to="/register"
            className="btn-primary text-sm"
          >
            Essayer gratuitement
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl mx-auto animate-fade-in">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/20 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
            <span className="text-xs text-accent-blue font-medium">Tableau de bord analytics pour restaurants</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-5">
            Pilotez votre restaurant<br />
            <span className="text-accent-blue">avec vos données</span>
          </h1>

          <p className="text-base text-text-secondary max-w-md mx-auto mb-10 leading-relaxed">
            RestoPilot analyse vos ventes, identifie vos opportunités et vous aide à prendre
            les bonnes décisions — en quelques secondes.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="flex items-center gap-2 px-6 py-3 bg-accent-blue hover:bg-accent-blue/90 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-accent-blue/20 w-full sm:w-auto justify-center"
            >
              Commencer — c'est gratuit
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 text-sm font-medium text-text-secondary hover:text-text-primary border border-bg-border hover:border-accent-blue/40 rounded-xl transition-all duration-150 w-full sm:w-auto text-center"
            >
              Déjà un compte
            </Link>
          </div>
        </div>

        {/* Feature pills */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full mx-auto animate-slide-up">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card p-4 text-left">
              <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center mb-3">
                <Icon size={16} className="text-accent-blue" />
              </div>
              <p className="text-sm font-semibold text-text-primary mb-1">{label}</p>
              <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-bg-border">
        <p className="text-xs text-text-muted">© 2026 RestoPilot — Tous droits réservés</p>
      </footer>

    </div>
  );
}
