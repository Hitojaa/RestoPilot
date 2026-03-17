import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setError(''); };
  }

  function validate() {
    if (!form.name.trim())    return 'Indique ton prénom ou pseudo.';
    if (!form.email.trim())   return 'Indique ton email.';
    if (form.password.length < 6) return 'Mot de passe trop court (6 caractères min).';
    if (form.password !== form.confirm) return 'Les mots de passe ne correspondent pas.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      register(form.email, form.password, form.name);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const strength = form.password.length === 0 ? 0
    : form.password.length < 6  ? 1
    : form.password.length < 10 ? 2
    : 3;
  const strengthColor = ['', 'bg-accent-red', 'bg-accent-amber', 'bg-accent-green'][strength];
  const strengthLabel = ['', 'Faible', 'Moyen', 'Fort'][strength];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 py-10">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="w-9 h-9 rounded-xl bg-accent-blue flex items-center justify-center">
          <ChefHat size={18} className="text-white" />
        </div>
        <span className="text-base font-bold text-text-primary group-hover:text-accent-blue transition-colors">
          RestoPilot
        </span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-bg-card border border-bg-border rounded-2xl p-7 shadow-xl animate-fade-in">
        <h1 className="text-lg font-bold text-text-primary mb-1">Créer un compte</h1>
        <p className="text-xs text-text-muted mb-6">Gratuit — aucune carte bancaire requise</p>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-accent-red/10 border border-accent-red/20 rounded-lg mb-5">
            <AlertCircle size={14} className="text-accent-red flex-shrink-0" />
            <span className="text-xs text-accent-red">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Prénom */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Ton prénom</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Marie"
                className="w-full bg-bg-hover border border-bg-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/20 transition-all"
                autoComplete="given-name"
              />
            </div>
          </div>

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
                autoComplete="new-password"
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
            {form.password.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1 flex-1">
                  {[1,2,3].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-bg-border'}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-text-muted">{strengthLabel}</span>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.confirm}
                onChange={set('confirm')}
                placeholder="••••••••"
                className={`w-full bg-bg-hover border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-all
                  ${form.confirm && form.confirm !== form.password
                    ? 'border-accent-red/50 focus:border-accent-red/60 focus:ring-accent-red/20'
                    : 'border-bg-border focus:border-accent-blue/60 focus:ring-accent-blue/20'
                  }`}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 text-sm font-semibold mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>

        </form>
      </div>

      <p className="mt-5 text-xs text-text-muted">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-accent-blue hover:underline font-medium">
          Se connecter
        </Link>
      </p>

    </div>
  );
}
