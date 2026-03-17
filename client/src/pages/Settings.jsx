import { useState } from 'react';
import { CheckCircle, RotateCcw, Store, CalendarDays, Palette } from 'lucide-react';
import { useSettings, DEFAULT_SETTINGS } from '../hooks/useSettings';

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 7);

const CUISINE_TYPES = [
  'Français', 'Italien', 'Japonais', 'Mexicain', 'Méditerranéen',
  'Indien', 'Américain', 'Fusion', 'Végétarien', 'Brasserie', 'Bistrot', 'Autre',
];

const ACCENT_COLORS = [
  { label: 'Bleu',   value: '#4F8EF7' },
  { label: 'Vert',   value: '#22c55e' },
  { label: 'Violet', value: '#a855f7' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Rose',   value: '#ec4899' },
  { label: 'Ambre',  value: '#f59e0b' },
];

const EMOJIS = ['🍽️','🥐','🍕','🍜','🍣','🌮','🥗','🍔','🍷','☕','🧑‍🍳','⭐'];

// ── Sous-composants ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer
        ${checked ? 'bg-accent-blue' : 'bg-bg-hover border border-bg-border'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow
        transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  );
}

function HourSelect({ value, onChange, min = 7, max = 23 }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="bg-bg-primary border border-bg-border rounded-lg px-2 py-1.5 text-xs text-text-primary
                 focus:outline-none focus:border-accent-blue/60 w-[72px]"
    >
      {HOURS.filter((h) => h >= min && h <= max).map((h) => (
        <option key={h} value={h}>{h}h00</option>
      ))}
    </select>
  );
}

function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="card p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={15} className="text-accent-blue" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function DayCard({ dayName, isOpen, schedule, onToggle, onScheduleChange }) {
  return (
    <div className={`rounded-xl border transition-colors duration-150
      ${isOpen ? 'bg-bg-hover border-bg-border' : 'bg-bg-primary border-bg-border/40 opacity-60'}`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Toggle checked={isOpen} onChange={onToggle} />
          <span className={`text-sm font-medium ${isOpen ? 'text-text-primary' : 'text-text-muted'}`}>
            {dayName}
          </span>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
          ${isOpen ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
          {isOpen ? 'Ouvert' : 'Fermé'}
        </span>
      </div>

      {isOpen && (
        <div className="px-4 pb-4 pt-0 border-t border-bg-border/50">
          <div className="flex flex-wrap gap-x-6 gap-y-3 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-accent-amber w-8">Midi</span>
              <HourSelect
                value={schedule.lunchStart}
                onChange={(v) => onScheduleChange({ lunchStart: v, lunchEnd: Math.max(v + 1, schedule.lunchEnd) })}
                min={7} max={16}
              />
              <span className="text-text-muted text-xs">→</span>
              <HourSelect
                value={schedule.lunchEnd}
                onChange={(v) => onScheduleChange({ lunchEnd: v, lunchStart: Math.min(v - 1, schedule.lunchStart) })}
                min={schedule.lunchStart + 1} max={17}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-accent-blue w-8">Soir</span>
              <HourSelect
                value={schedule.dinnerStart}
                onChange={(v) => onScheduleChange({ dinnerStart: v, dinnerEnd: Math.max(v + 1, schedule.dinnerEnd) })}
                min={15} max={22}
              />
              <span className="text-text-muted text-xs">→</span>
              <HourSelect
                value={schedule.dinnerEnd}
                onChange={(v) => onScheduleChange({ dinnerEnd: v, dinnerStart: Math.min(v - 1, schedule.dinnerStart) })}
                min={schedule.dinnerStart + 1} max={23}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function Settings() {
  const { settings, update, toggleDay, updateDaySchedule, reset } = useSettings();
  const [saved, setSaved] = useState(false);
  const [nameValue, setNameValue] = useState(settings.restaurantName);

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleSaveName() {
    update({ restaurantName: nameValue.trim() || DEFAULT_SETTINGS.restaurantName });
    flash();
  }

  function handleReset() {
    if (window.confirm('Réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      reset();
      setNameValue(DEFAULT_SETTINGS.restaurantName);
      flash();
    }
  }

  const openCount = settings.openDays.filter(Boolean).length;
  const color = settings.color || '#4F8EF7';
  const emoji = settings.emoji || '🍽️';

  return (
    <div className="space-y-4 sm:space-y-5 max-w-2xl">

      {/* Bandeau confirmation */}
      <div className={`overflow-hidden transition-all duration-300 ${saved ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex items-center gap-2 bg-accent-green/10 border border-accent-green/30 rounded-xl px-4 py-2.5 text-sm text-accent-green">
          <CheckCircle size={15} /> Paramètres enregistrés
        </div>
      </div>

      {/* ── Informations du restaurant ───────────────────────────────────── */}
      <Section icon={Store} title="Informations du restaurant" description="Nom, type de cuisine et capacité">
        <div className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Nom du restaurant</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                maxLength={50}
                placeholder="Nom du restaurant"
                className="flex-1 bg-bg-hover border border-bg-border rounded-lg px-3 py-2.5 text-sm text-text-primary
                           placeholder:text-text-muted focus:outline-none focus:border-accent-blue/60"
              />
              <button onClick={handleSaveName} className="btn-primary px-4 flex-shrink-0">Valider</button>
            </div>
          </div>

          {/* Type de cuisine */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Type de cuisine</label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { update({ cuisineType: t }); flash(); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150
                    ${settings.cuisineType === t
                      ? 'bg-accent-blue/10 border-accent-blue/40 text-accent-blue'
                      : 'bg-bg-hover border-bg-border text-text-secondary hover:text-text-primary'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Couverts */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Nombre de couverts</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={999}
                value={settings.covers || 40}
                onChange={(e) => { update({ covers: Number(e.target.value) }); flash(); }}
                className="w-24 bg-bg-hover border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue/60"
              />
              <span className="text-xs text-text-muted">places assises en salle</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Identité visuelle ────────────────────────────────────────────── */}
      <Section icon={Palette} title="Identité visuelle" description="Couleur et icône affichées dans le header">
        <div className="space-y-4">

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-bg-hover rounded-xl border border-bg-border">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: color + '22', border: `1.5px solid ${color}44` }}
            >
              {emoji}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{settings.restaurantName}</p>
              <p className="text-xs text-text-muted">{settings.cuisineType || 'Type de cuisine'}</p>
            </div>
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Couleur principale</label>
            <div className="flex gap-2">
              {ACCENT_COLORS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { update({ color: value }); flash(); }}
                  title={label}
                  className={`w-8 h-8 rounded-full transition-all duration-150 border-2
                    ${settings.color === value ? 'border-white scale-110' : 'border-transparent'}`}
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
                  onClick={() => { update({ emoji: em }); flash(); }}
                  className={`w-9 h-9 rounded-lg text-lg transition-all duration-150 border
                    ${settings.emoji === em
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
      </Section>

      {/* ── Jours & Horaires ─────────────────────────────────────────────── */}
      <Section
        icon={CalendarDays}
        title="Jours & Horaires"
        description={`${openCount} jour${openCount > 1 ? 's' : ''} ouvert${openCount > 1 ? 's' : ''} — horaires personnalisables par journée`}
      >
        <div className="space-y-2.5">
          {DAYS_FR.map((day, i) => (
            <DayCard
              key={day}
              dayName={day}
              isOpen={settings.openDays[i]}
              schedule={settings.daySchedules[i]}
              onToggle={() => { toggleDay(i); flash(); }}
              onScheduleChange={(patch) => { updateDaySchedule(i, patch); flash(); }}
            />
          ))}
        </div>
      </Section>

      {/* ── Reset ────────────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-xs text-text-muted hover:text-accent-red transition-colors duration-150 px-3 py-2 rounded-lg hover:bg-accent-red/5"
        >
          <RotateCcw size={13} /> Réinitialiser les paramètres
        </button>
      </div>

    </div>
  );
}
