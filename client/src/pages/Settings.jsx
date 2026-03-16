import { useState } from 'react';
import { CheckCircle, RotateCcw, Store, Clock, CalendarDays, Info } from 'lucide-react';
import { useSettings, DEFAULT_SETTINGS } from '../hooks/useSettings';

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Heures disponibles de 7h à 23h
const HOURS = Array.from({ length: 17 }, (_, i) => i + 7);

// Toggle switch accessible
function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none group">
      <div
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0
          ${checked ? 'bg-accent-blue' : 'bg-bg-hover border border-bg-border'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </div>
      <span className={`text-sm font-medium transition-colors ${checked ? 'text-text-primary' : 'text-text-muted'}`}>
        {label}
      </span>
    </label>
  );
}

// Select d'heure stylisé
function HourSelect({ value, onChange, min, max, label }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-text-muted">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="bg-bg-hover border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary
                   focus:outline-none focus:border-accent-blue/60 w-24"
      >
        {HOURS.filter((h) => h >= (min ?? 7) && h <= (max ?? 23)).map((h) => (
          <option key={h} value={h}>{h}h00</option>
        ))}
      </select>
    </div>
  );
}

// Card section générique
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
      <div className="pl-0 sm:pl-11">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { settings, update, toggleDay, reset } = useSettings();
  const [saved, setSaved] = useState(false);
  const [nameValue, setNameValue] = useState(settings.restaurantName);

  function handleSaveName() {
    update({ restaurantName: nameValue.trim() || DEFAULT_SETTINGS.restaurantName });
    flash();
  }

  function handleLunchChange(key, val) {
    const updated = { ...settings.lunchService, [key]: val };
    // end doit toujours être > start
    if (key === 'start' && val >= updated.end) updated.end = val + 1;
    if (key === 'end' && val <= updated.start) updated.start = val - 1;
    update({ lunchService: updated });
    flash();
  }

  function handleDinnerChange(key, val) {
    const updated = { ...settings.dinnerService, [key]: val };
    if (key === 'start' && val >= updated.end) updated.end = val + 1;
    if (key === 'end' && val <= updated.start) updated.start = val - 1;
    update({ dinnerService: updated });
    flash();
  }

  function handleReset() {
    if (window.confirm('Réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      reset();
      setNameValue(DEFAULT_SETTINGS.restaurantName);
      flash();
    }
  }

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const openCount = settings.openDays.filter(Boolean).length;

  return (
    <div className="space-y-4 sm:space-y-5 max-w-2xl">

      {/* Bandeau de confirmation */}
      <div className={`overflow-hidden transition-all duration-300 ${saved ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex items-center gap-2 bg-accent-green/10 border border-accent-green/30 rounded-xl px-4 py-2.5 text-sm text-accent-green">
          <CheckCircle size={15} />
          Paramètres enregistrés automatiquement
        </div>
      </div>

      {/* ── Informations restaurant ───────────────────────────────────── */}
      <Section
        icon={Store}
        title="Informations du restaurant"
        description="Nom affiché dans l'en-tête du dashboard"
      >
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
          <button onClick={handleSaveName} className="btn-primary px-4 flex-shrink-0">
            Valider
          </button>
        </div>
        <p className="text-[11px] text-text-muted mt-2">
          Appuyez sur Entrée ou cliquez Valider pour sauvegarder.
        </p>
      </Section>

      {/* ── Jours d'ouverture ─────────────────────────────────────────── */}
      <Section
        icon={CalendarDays}
        title="Jours d'ouverture"
        description={`${openCount} jour${openCount > 1 ? 's' : ''} ouvert${openCount > 1 ? 's' : ''} par semaine — les jours fermés apparaissent grisés sur la carte de chaleur`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DAYS_FR.map((day, i) => (
            <div
              key={day}
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors duration-150
                ${settings.openDays[i]
                  ? 'bg-bg-hover border-bg-border'
                  : 'bg-bg-primary border-bg-border/50 opacity-60'}`}
            >
              <Toggle
                checked={settings.openDays[i]}
                onChange={() => { toggleDay(i); flash(); }}
                label={day}
              />
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0
                ${settings.openDays[i]
                  ? 'bg-accent-green/15 text-accent-green'
                  : 'bg-accent-red/10 text-accent-red'}`}>
                {settings.openDays[i] ? 'Ouvert' : 'Fermé'}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Horaires des services ─────────────────────────────────────── */}
      <Section
        icon={Clock}
        title="Horaires des services"
        description="Définissez les créneaux de service — utilisés pour le calcul des heures de pointe"
      >
        <div className="space-y-5">
          {/* Service midi */}
          <div className="p-4 rounded-xl bg-bg-hover border border-bg-border">
            <p className="text-xs font-semibold text-accent-amber mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent-amber inline-block" />
              Service du midi
            </p>
            <div className="flex items-end gap-4 flex-wrap">
              <HourSelect
                label="Ouverture"
                value={settings.lunchService.start}
                onChange={(v) => handleLunchChange('start', v)}
                min={7}
                max={14}
              />
              <span className="text-text-muted text-sm pb-2">→</span>
              <HourSelect
                label="Fermeture"
                value={settings.lunchService.end}
                onChange={(v) => handleLunchChange('end', v)}
                min={settings.lunchService.start + 1}
                max={17}
              />
              <p className="text-xs text-text-muted pb-2 self-end">
                {settings.lunchService.end - settings.lunchService.start}h de service
              </p>
            </div>
          </div>

          {/* Service soir */}
          <div className="p-4 rounded-xl bg-bg-hover border border-bg-border">
            <p className="text-xs font-semibold text-accent-blue mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent-blue inline-block" />
              Service du soir
            </p>
            <div className="flex items-end gap-4 flex-wrap">
              <HourSelect
                label="Ouverture"
                value={settings.dinnerService.start}
                onChange={(v) => handleDinnerChange('start', v)}
                min={17}
                max={21}
              />
              <span className="text-text-muted text-sm pb-2">→</span>
              <HourSelect
                label="Fermeture"
                value={settings.dinnerService.end}
                onChange={(v) => handleDinnerChange('end', v)}
                min={settings.dinnerService.start + 1}
                max={23}
              />
              <p className="text-xs text-text-muted pb-2 self-end">
                {settings.dinnerService.end - settings.dinnerService.start}h de service
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Note roadmap ─────────────────────────────────────────────── */}
      <div className="flex gap-3 p-4 rounded-xl bg-accent-blue/5 border border-accent-blue/15">
        <Info size={15} className="text-accent-blue flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          <span className="font-medium text-text-primary">Roadmap</span> — Ces paramètres seront synchronisés avec votre caisse (Lightspeed, Zelty) dans une prochaine version. Les plats du menu seront également éditables ici en attendant l'intégration API.
        </p>
      </div>

      {/* ── Reset ─────────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-xs text-text-muted hover:text-accent-red transition-colors duration-150 px-3 py-2 rounded-lg hover:bg-accent-red/5"
        >
          <RotateCcw size={13} />
          Réinitialiser les paramètres
        </button>
      </div>

    </div>
  );
}
