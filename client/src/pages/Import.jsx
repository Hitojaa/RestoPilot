/**
 * Page d'import CSV
 * Supporte : Zelty, Lightspeed, L'Addition, format générique
 */

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, AlertCircle,
  ChevronRight, X, Download, RefreshCw,
} from 'lucide-react';
import { parseCSV, saveImportedData, clearImportedData } from '../utils/csvParser';
import { useAuth } from '../hooks/useAuth';

const FORMAT_LABELS = {
  zelty:      { label: 'Zelty',      color: 'text-accent-blue' },
  lightspeed: { label: 'Lightspeed', color: 'text-accent-green' },
  laddition:  { label: "L'Addition", color: 'text-accent-purple' },
  generic:    { label: 'Générique',  color: 'text-accent-amber' },
};

const TEST_FILES = [
  {
    name: 'test-zelty.csv',
    label: 'Données test — Zelty',
    desc: '2 200+ ventes · 28 jours · format Zelty',
    url: '/data/test-zelty.csv',
  },
  {
    name: 'test-laddition.csv',
    label: "Données test — L'Addition",
    desc: "2 200+ ventes · 28 jours · format L'Addition",
    url: '/data/test-laddition.csv',
  },
];

export default function Import() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [dragging, setDragging]   = useState(false);
  const [result,   setResult]     = useState(null); // parsed result
  const [error,    setError]      = useState('');
  const [loading,  setLoading]    = useState(false);
  const [imported, setImported]   = useState(false);

  function reset() {
    setResult(null);
    setError('');
    setImported(false);
  }

  async function processFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Format invalide — importe un fichier .csv');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      setResult({ ...parsed, fileName: file.name });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, []);

  const onDragOver = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);

  function onFileChange(e) {
    processFile(e.target.files[0]);
    e.target.value = '';
  }

  async function loadTestFile(url, label) {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Fichier de test introuvable.');
      const text = await res.text();
      const parsed = parseCSV(text);
      setResult({ ...parsed, fileName: label });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleImport() {
    if (!result || !user) return;
    saveImportedData(user.id, result);
    setImported(true);
    setTimeout(() => navigate('/dashboard'), 1200);
  }

  function handleClear() {
    if (!user) return;
    clearImportedData(user.id);
    reset();
  }

  const formatInfo = result ? (FORMAT_LABELS[result.format] || FORMAT_LABELS.generic) : null;

  return (
    <div className="max-w-2xl space-y-5">

      {/* Titre */}
      <div>
        <h2 className="text-base font-bold text-text-primary mb-1">Importer vos données de caisse</h2>
        <p className="text-sm text-text-muted">
          Déposez l'export CSV de votre logiciel de caisse. Zelty, Lightspeed, L'Addition et les formats CSV génériques sont supportés.
        </p>
      </div>

      {/* Zone de drop */}
      {!result && !imported && (
        <>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200
              ${dragging
                ? 'border-accent-blue bg-accent-blue/5 scale-[1.01]'
                : 'border-bg-border hover:border-accent-blue/40 hover:bg-bg-hover'
              }`}
          >
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFileChange} className="sr-only" />

            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
                <p className="text-sm text-text-muted">Analyse en cours…</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center mb-4">
                  <Upload size={22} className="text-accent-blue" />
                </div>
                <p className="text-sm font-semibold text-text-primary mb-1">
                  Glisse ton fichier ici
                </p>
                <p className="text-xs text-text-muted mb-3">ou clique pour choisir un fichier</p>
                <span className="text-[10px] px-2.5 py-1 rounded-full border border-bg-border text-text-muted">
                  .CSV uniquement
                </span>
              </>
            )}
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-accent-red/10 border border-accent-red/20 rounded-xl">
              <AlertCircle size={15} className="text-accent-red flex-shrink-0 mt-0.5" />
              <p className="text-xs text-accent-red">{error}</p>
            </div>
          )}

          {/* Fichiers de test */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
              <Download size={12} />
              Pas encore de vrai fichier ? Utilise nos données de test
            </p>
            <div className="space-y-2">
              {TEST_FILES.map(f => (
                <button
                  key={f.name}
                  onClick={() => loadTestFile(f.url, f.label)}
                  disabled={loading}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-hover hover:bg-bg-hover border border-bg-border hover:border-accent-blue/30 transition-all duration-150 group"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <FileText size={14} className="text-text-muted flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-text-primary">{f.label}</p>
                      <p className="text-[10px] text-text-muted">{f.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-text-muted group-hover:text-accent-blue transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Succès import */}
      {imported && (
        <div className="card p-8 flex flex-col items-center text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-accent-green/10 flex items-center justify-center mb-4">
            <CheckCircle size={28} className="text-accent-green" />
          </div>
          <p className="text-base font-bold text-text-primary mb-1">Import réussi !</p>
          <p className="text-sm text-text-muted">Redirection vers le dashboard…</p>
        </div>
      )}

      {/* Preview du fichier parsé */}
      {result && !imported && (
        <div className="card p-5 space-y-4 animate-fade-in">
          {/* Résumé */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-accent-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary truncate max-w-[220px]">{result.fileName}</p>
                <p className={`text-xs font-medium ${formatInfo.color}`}>
                  Format détecté : {formatInfo.label}
                </p>
              </div>
            </div>
            <button onClick={reset} className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-bg-hover">
              <X size={15} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Lignes importées', value: result.rowCount.toLocaleString('fr-FR') },
              { label: 'Plats détectés',   value: result.dishCount },
              { label: 'Période',          value: result.startDate },
            ].map(({ label, value }) => (
              <div key={label} className="bg-bg-hover rounded-xl p-3 text-center">
                <p className="text-base font-bold text-text-primary">{value}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Aperçu des plats */}
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2">Aperçu des plats détectés</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {result.menu.slice(0, 10).map(d => (
                <div key={d.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-bg-hover text-xs">
                  <span className="text-text-primary font-medium truncate mr-2">{d.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-text-muted capitalize">{d.category}</span>
                    <span className="text-accent-green font-medium">{d.price}€</span>
                  </div>
                </div>
              ))}
              {result.menu.length > 10 && (
                <p className="text-[10px] text-text-muted text-center py-1">+ {result.menu.length - 10} autres plats</p>
              )}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-2 pt-1 border-t border-bg-border">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-bg-border hover:border-accent-blue/30 rounded-xl transition-all"
            >
              <RefreshCw size={13} /> Changer de fichier
            </button>
            <button
              onClick={handleImport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent-blue hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-opacity shadow-lg shadow-accent-blue/20"
            >
              <CheckCircle size={15} />
              Importer {result.rowCount.toLocaleString('fr-FR')} ventes
            </button>
          </div>
        </div>
      )}

      {/* Effacer les données importées */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-text-muted">Les données importées remplacent les données de démo.</p>
        <button
          onClick={handleClear}
          className="text-xs text-text-muted hover:text-accent-red transition-colors px-3 py-1.5 rounded-lg hover:bg-accent-red/5"
        >
          Effacer les données importées
        </button>
      </div>

    </div>
  );
}
