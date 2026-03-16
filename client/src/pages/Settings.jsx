import { useState } from 'react';
import { CheckCircle, RotateCcw, Store, CalendarDays, Info, ChevronDown } from 'lucide-react';
import { useSettings, DEFAULT_SETTINGS } from '../hooks/useSettings';

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 7h → 23h

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

// Carte d'un jour avec ses horaires
function DayCard({ dayName, isOpen, schedule, onToggle, onScheduleChange }) {
  return (
    <div className={`rounded-xl border transition-colors duration-150
      ${isOpen ? 'bg-bg-hover border-bg-border' : 'bg-bg-primary border-bg-border/40 opacity-60'}`}
    >
      {/* Ligne principale : toggle + nom + badge */}
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

      {/* Horaires — visible uniquement si le jour est ouvert */}
      {isOpen && (
        <div className="px-4 pb-4 pt-0 border-t border-bg-border/50">
          <div className="flex flex-wrap gap-x-6 gap-y-3 mt-3">
            {/* Midi */}
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

            {/* Soir */}
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

  return (
    <div className="space-y-4 sm:space-y-5 max-w-2xl">

      {/* Bandeau confirmation */}
      <div className={`overflow-hidden transition-all duration-300 ${saved ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex items-center gap-2 bg-accent-green/10 border border-accent-green/30 rounded-xl px-4 py-2.5 text-sm text-accent-green">
          <CheckCircle size={15} /> Paramètres enregistrés automatiquement
        </div>
      </div>

      {/* ── Nom du restaurant ─────────────────────────────────────────────── */}
      <Section icon={Store} title="Informations du restaurant" description="Nom affiché dans l'en-tête du dashboard">
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
      </Section>

      {/* ── Jours & Horaires (combinés) ───────────────────────────────────── */}
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

      {/* ── Note roadmap ─────────────────────────────────────────────────── */}
      <div className="flex gap-3 p-4 rounded-xl bg-accent-blue/5 border border-accent-blue/15">
        <Info size={15} className="text-accent-blue flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          <span className="font-medium text-text-primary">Roadmap</span> — Ces horaires seront synchronisés avec votre caisse (Lightspeed, Zelty) dans une prochaine version. Les plats seront aussi éditables ici directement.
        </p>
      </div>

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
