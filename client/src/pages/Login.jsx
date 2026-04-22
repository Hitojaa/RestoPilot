import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, hasOnboarded } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setError(''); };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Remplis tous les champs.'); return; }
    setLoading(true);
    try {
      const user = login(form.email, form.password);
      navigate(hasOnboarded(user.id) ? '/dashboard' : '/onboarding', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="w-9 h-9 rounded-xl bg-accent-blue flex items-center justify-center">
          <ChefHat size={18} className="text-white" />
        </div>
        <span className="text-base font-bold text-text-primary group-hover:text-accent-blue transition-colors">
          CleanPlate
        </span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-bg-card border border-bg-border rounded-2xl p-7 shadow-xl animate-fade-in">
        <h1 className="text-lg font-bold text-text-primary mb-1">Bon retour 👋</h1>
        <p className="text-xs text-text-muted mb-6">Connecte-toi à ton espace restaurant</p>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-accent-red/10 border border-accent-red/20 rounded-lg mb-5">
            <AlertCircle size={14} className="text-accent-red flex-shrink-0" />
            <span className="text-xs text-accent-red">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="chef@monresto.fr"
                className="w-full bg-bg-hover border border-bg-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/20 transition-all"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Mot de passe</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                className="w-full bg-bg-hover border border-bg-border rounded-xl pl-9 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/20 transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 text-sm font-semibold mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

        </form>
      </div>

      <p className="mt-5 text-xs text-text-muted">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-accent-blue hover:underline font-medium">
          Créer un compte
        </Link>
      </p>

    </div>
  );
}
