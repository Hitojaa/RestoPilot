/**
 * Wizard d'onboarding — 4 étapes
 * Étape 1 : Nom du restaurant
 * Étape 2 : Type de cuisine + nombre de couverts
 * Étape 3 : Identité visuelle (couleur + emoji)
 * Étape 4 : Jours ouverts + horaires
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DEFAULT_SETTINGS } from '../hooks/useSettings';

/* ─── Données statiques ─────────────────────────────────────────────────── */

const CUISINE_TYPES = [
  'Français', 'Italien', 'Japonais', 'Mexicain', 'Méditerranéen',
  'Indien', 'Américain', 'Fusion', 'Végétarien', 'Brasserie', 'Bistrot', 'Autre',
];

const ACCENT_COLORS = [
  { label: 'Bleu',    value: '#4F8EF7' },
  { label: 'Vert',    value: '#22c55e' },
  { label: 'Violet',  value: '#a855f7' },
  { label: 'Orange',  value: '#f97316' },
  { label: 'Rose',    value: '#ec4899' },
  { label: 'Ambre',   value: '#f59e0b' },
];

const EMOJIS = ['🍽️', '🥐', '🍕', '🍜', '🍣', '🌮', '🥗', '🍔', '🍷', '☕', '🧑‍🍳', '⭐'];

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const DEFAULT_SCHEDULE = { lunchStart: 11, lunchEnd: 15, dinnerStart: 18, dinnerEnd: 23 };

/* ─── Stepper ────────────────────────────────────────────────────────────── */

const STEPS = ['Restaurant', 'Type & taille', 'Identité', 'Horaires'];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300
            ${i < current  ? 'bg-accent-blue text-white'
            : i === current ? 'bg-accent-blue text-white ring-2 ring-accent-blue/30'
            :                 'bg-bg-hover text-text-muted border border-bg-border'
            }`}
          >
            {i < current ? <Check size={12} /> : i + 1}
          </div>
          <span className={`text-xs hidden sm:inline ${i === current ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-px mx-1 ${i < current ? 'bg-accent-blue/60' : 'bg-bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Étapes ─────────────────────────────────────────────────────────────── */

function Step1({ data, onChange }) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-text-primary mb-1">Quel est le nom de ton restaurant ?</h2>
      <p className="text-sm text-text-muted mb-6">C'est ce qui apparaîtra sur ton tableau de bord.</p>
      <label className="block text-xs font-medium text-text-secondary mb-2">Nom du restaurant</label>
      <input
        type="text"
        value={data.restaurantName}
        onChange={e => onChange({ restaurantName: e.target.value })}
        placeholder="La Belle Époque"
        className="w-full bg-bg-hover border border-bg-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/20 transition-all"
        autoFocus
      />
    </div>
  );
}

function Step2({ data, onChange }) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-text-primary mb-1">Type de cuisine & capacité</h2>
      <p className="text-sm text-text-muted mb-6">Pour personnaliser tes insights.</p>

      <div className="mb-5">
        <label className="block text-xs font-medium text-text-secondary mb-2">Type de cuisine</label>
        <div className="flex flex-wrap gap-2">
          {CUISINE_TYPES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ cuisineType: t })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150
                ${data.cuisineType === t
                  ? 'bg-accent-blue/10 border-accent-blue/40 text-accent-blue'
                  : 'bg-bg-hover border-bg-border text-text-secondary hover:border-bg-border hover:text-text-primary'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">Nombre de couverts</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={999}
            value={data.covers}
            onChange={e => onChange({ covers: Number(e.target.value) })}
            className="w-28 bg-bg-hover border border-bg-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/20 transition-all"
          />
          <span className="text-xs text-text-muted">places assises en salle</span>
        </div>
      </div>
    </div>
  );
}

function Step3({ data, onChange }) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-text-primary mb-1">Personnalise ton identité</h2>
      <p className="text-sm text-text-muted mb-6">Couleur et icône pour ton espace.</p>

      {/* Preview */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-bg-hover rounded-xl border border-bg-border">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300"
          style={{ backgroundColor: data.color + '22', border: `1.5px solid ${data.color}44` }}
        >
          {data.emoji}
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{data.restaurantName || 'Mon restaurant'}</p>
          <p className="text-xs text-text-muted">{data.cuisineType || 'Type de cuisine'}</p>
        </div>
      </div>

      {/* Couleur */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-text-secondary mb-2">Couleur principale</label>
        <div className="flex gap-2">
          {ACCENT_COLORS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ color: value })}
              title={label}
              className={`w-8 h-8 rounded-full transition-all duration-150 border-2
                ${data.color === value ? 'border-white scale-110' : 'border-transparent scale-100'}`}
              style={{ backgroundColor: value }}
            />
          ))}
        </div>
      </div>

      {/* Emoji */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">Icône</label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map(em => (
            <button
              key={em}
              type="button"
              onClick={() => onChange({ emoji: em })}
              className={`w-9 h-9 rounded-lg text-lg transition-all duration-150 border
                ${data.emoji === em
                  ? 'bg-accent-blue/10 border-accent-blue/40'
                  : 'bg-bg-hover border-bg-border hover:border-bg-border'
                }`}
            >
              {em}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4({ data, onChange }) {
  function toggleDay(i) {
    const openDays = [...data.openDays];
    openDays[i] = !openDays[i];
    onChange({ openDays });
  }

  function updateSchedule(dayIndex, field, value) {
    const daySchedules = data.daySchedules.map((s, i) =>
      i === dayIndex ? { ...s, [field]: Number(value) } : s
    );
    onChange({ daySchedules });
  }

  const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 7h–23h

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-text-primary mb-1">Jours d'ouverture & horaires</h2>
      <p className="text-sm text-text-muted mb-5">Coche les jours ouverts et ajuste les créneaux.</p>

      <div className="space-y-2">
        {DAYS_FR.map((day, i) => (
          <div key={day} className={`rounded-xl border transition-all duration-200 overflow-hidden
            ${data.openDays[i] ? 'border-accent-blue/20 bg-bg-hover' : 'border-bg-border bg-bg-card'}`}
          >
            {/* En-tête du jour */}
            <button
              type="button"
              onClick={() => toggleDay(i)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors
                  ${data.openDays[i] ? 'bg-accent-blue border-accent-blue' : 'border-bg-border'}`}
                >
                  {data.openDays[i] && <Check size={10} className="text-white" />}
                </div>
                <span className={`text-sm font-medium ${data.openDays[i] ? 'text-text-primary' : 'text-text-muted'}`}>
                  {day}
                </span>
              </div>
              {data.openDays[i] && (
                <span className="text-xs text-text-muted">
                  {data.daySchedules[i].lunchStart}h–{data.daySchedules[i].lunchEnd}h · {data.daySchedules[i].dinnerStart}h–{data.daySchedules[i].dinnerEnd}h
                </span>
              )}
            </button>

            {/* Horaires */}
            {data.openDays[i] && (
              <div className="px-4 pb-3 grid grid-cols-2 gap-3 border-t border-bg-border/50">
                <div>
                  <p className="text-[10px] text-text-muted mb-1.5 mt-2">Service midi</p>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={data.daySchedules[i].lunchStart}
                      onChange={e => updateSchedule(i, 'lunchStart', e.target.value)}
                      className="flex-1 bg-bg-card border border-bg-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-blue/60"
                    >
                      {HOURS.map(h => <option key={h} value={h}>{h}h</option>)}
                    </select>
                    <span className="text-text-muted text-xs">→</span>
                    <select
                      value={data.daySchedules[i].lunchEnd}
                      onChange={e => updateSchedule(i, 'lunchEnd', e.target.value)}
                      className="flex-1 bg-bg-card border border-bg-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-blue/60"
                    >
                      {HOURS.map(h => <option key={h} value={h}>{h}h</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted mb-1.5 mt-2">Service soir</p>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={data.daySchedules[i].dinnerStart}
                      onChange={e => updateSchedule(i, 'dinnerStart', e.target.value)}
                      className="flex-1 bg-bg-card border border-bg-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-blue/60"
                    >
                      {HOURS.map(h => <option key={h} value={h}>{h}h</option>)}
                    </select>
                    <span className="text-text-muted text-xs">→</span>
                    <select
                      value={data.daySchedules[i].dinnerEnd}
                      onChange={e => updateSchedule(i, 'dinnerEnd', e.target.value)}
                      className="flex-1 bg-bg-card border border-bg-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-blue/60"
                    >
                      {HOURS.map(h => <option key={h} value={h}>{h}h</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────────────────────── */

export default function Onboarding() {
  const { user, markOnboarded } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    restaurantName: '',
    cuisineType: '',
    covers: 40,
    color: '#4F8EF7',
    emoji: '🍽️',
    openDays: [...DEFAULT_SETTINGS.openDays],
    daySchedules: DEFAULT_SETTINGS.daySchedules.map(s => ({ ...s })),
  });

  function update(patch) {
    setData(p => ({ ...p, ...patch }));
  }

  function canProceed() {
    if (step === 0) return data.restaurantName.trim().length > 0;
    if (step === 1) return data.cuisineType.length > 0 && data.covers > 0;
    return true;
  }

  function handleNext() {
    if (step < 3) { setStep(s => s + 1); return; }
    finish();
  }

  function finish() {
    const settings = {
      restaurantName: data.restaurantName.trim(),
      cuisineType: data.cuisineType,
      covers: data.covers,
      color: data.color,
      emoji: data.emoji,
      openDays: data.openDays,
      daySchedules: data.daySchedules,
    };
    const key = `cleanplate_settings_${user.id}`;
    localStorage.setItem(key, JSON.stringify(settings));
    markOnboarded(user.id);
    navigate('/dashboard', { replace: true });
  }

  const steps = [
    <Step1 key={0} data={data} onChange={update} />,
    <Step2 key={1} data={data} onChange={update} />,
    <Step3 key={2} data={data} onChange={update} />,
    <Step4 key={3} data={data} onChange={update} />,
  ];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 py-10">

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-accent-blue flex items-center justify-center">
          <ChefHat size={18} className="text-white" />
        </div>
        <span className="text-base font-bold text-text-primary">CleanPlate</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-bg-card border border-bg-border rounded-2xl p-7 shadow-xl">

        <StepIndicator current={step} />

        <div className="min-h-[300px]">
          {steps[step]}
        </div>

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-bg-border">
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-0 disabled:pointer-events-none transition-all"
          >
            <ArrowLeft size={15} />
            Retour
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-blue hover:bg-accent-blue/90 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent-blue/20"
          >
            {step < 3 ? (
              <>Continuer <ArrowRight size={15} /></>
            ) : (
              <>Accéder au dashboard <ArrowRight size={15} /></>
            )}
          </button>
        </div>
      </div>

      <p className="mt-4 text-xs text-text-muted">Étape {step + 1} sur {STEPS.length}</p>
    </div>
  );
}
