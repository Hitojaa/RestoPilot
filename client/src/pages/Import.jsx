/**
 * Page d'import CSV avec détection automatique de colonnes
 */

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, AlertCircle,
  ChevronRight, X, Download, RefreshCw, Sliders,
} from 'lucide-react';
import { detectColumnsFromCSV, parseCSVWithMapping, saveImportedData, clearImportedData } from '../utils/csvParser';
import { useAuth } from '../hooks/useAuth';

// Métadonnées d'affichage pour chaque champ interne
const FIELD_META = {
  name:     { label: 'Nom du plat',    required: true,  tip: 'Nom de l\'article vendu' },
  date:     { label: 'Date',           required: true,  tip: 'Date de la vente (JJ/MM/AAAA ou AAAA-MM-JJ)' },
  category: { label: 'Catégorie',      required: false, tip: 'Famille / rayon' },
  qty:      { label: 'Quantité',       required: false, tip: 'Nombre d\'articles' },
  price:    { label: 'Prix unitaire',  required: false, tip: 'Prix TTC unitaire (€)' },
  hour:     { label: 'Heure',          required: false, tip: 'Heure de la vente (HH:MM)' },
};

const FIELD_ORDER = ['name', 'date', 'category', 'qty', 'price', 'hour'];

function ScoreBadge({ score }) {
  if (score === 0) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red font-medium">
      Non trouvée
    </span>
  );
  if (score >= 0.8) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green font-medium">
      {Math.round(score * 100)}%
    </span>
  );
  if (score >= 0.5) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber font-medium">
      {Math.round(score * 100)}%
    </span>
  );
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red font-medium">
      {Math.round(score * 100)}%
    </span>
  );
}

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

  const [dragging,     setDragging]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  // Étape 1 : détection des colonnes
  const [rawContent,   setRawContent]   = useState(null);   // texte brut du CSV
  const [detection,    setDetection]    = useState(null);   // { headers, samples, mapping, sep }
  const [editedMap,    setEditedMap]    = useState(null);   // { field: idx } éditable

  // Étape 2 : résultat parsé
  const [result,       setResult]       = useState(null);
  const [imported,     setImported]     = useState(false);

  function reset() {
    setRawContent(null);
    setDetection(null);
    setEditedMap(null);
    setResult(null);
    setError('');
    setImported(false);
  }

  async function processContent(text, fileName) {
    setLoading(true);
    setError('');
    try {
      const det = detectColumnsFromCSV(text);
      const initialMap = Object.fromEntries(
        Object.entries(det.mapping).map(([field, v]) => [field, v.idx])
      );
      setRawContent({ text, fileName });
      setDetection(det);
      setEditedMap(initialMap);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function processFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Format invalide — importe un fichier .csv');
      return;
    }
    const text = await file.text();
    await processContent(text, file.name);
  }

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }, []);

  const onDragOver  = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);

  function onFileChange(e) {
    processFile(e.target.files[0]);
    e.target.value = '';
  }

  async function loadTestFile(url, label) {
    setLoading(true);
    setError('');
    reset();
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Fichier de test introuvable.');
      await processContent(await res.text(), label);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function confirmMapping() {
    setLoading(true);
    setError('');
    try {
      const parsed = parseCSVWithMapping(rawContent.text, editedMap);
      setResult({ ...parsed, fileName: rawContent.fileName });
      setDetection(null);
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

  // Résumé de la qualité du mapping
  const mappingQuality = detection ? (() => {
    const required = ['name', 'date'];
    const missingRequired = required.filter(f => editedMap[f] === -1);
    const found = FIELD_ORDER.filter(f => editedMap[f] !== -1).length;
    return { missingRequired, found, total: FIELD_ORDER.length };
  })() : null;

  return (
    <div className="max-w-2xl space-y-5">

      {/* Titre */}
      <div>
        <h2 className="text-base font-bold text-text-primary mb-1">Importer vos données de caisse</h2>
        <p className="text-sm text-text-muted">
          Déposez l'export CSV de n'importe quel logiciel de caisse. Les colonnes sont détectées automatiquement.
        </p>
      </div>

      {/* ── Étape 0 : Upload ─────────────────────────────────────────────────── */}
      {!detection && !result && !imported && (
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
                <p className="text-sm font-semibold text-text-primary mb-1">Glisse ton fichier ici</p>
                <p className="text-xs text-text-muted mb-3">ou clique pour choisir un fichier</p>
                <span className="text-[10px] px-2.5 py-1 rounded-full border border-bg-border text-text-muted">
                  .CSV uniquement · Zelty, L'Addition, Square, SumUp, et tous formats génériques
                </span>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-accent-red/10 border border-accent-red/20 rounded-xl">
              <AlertCircle size={15} className="text-accent-red flex-shrink-0 mt-0.5" />
              <p className="text-xs text-accent-red">{error}</p>
            </div>
          )}

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
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-hover border border-bg-border hover:border-accent-blue/30 transition-all duration-150 group"
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

      {/* ── Étape 1 : Vérification du mapping ────────────────────────────────── */}
      {detection && !result && !imported && (
        <div className="card p-5 space-y-4 animate-fade-in">
          {/* En-tête */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                <Sliders size={17} className="text-accent-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Vérification du mapping</p>
                <p className="text-xs text-text-muted">
                  {mappingQuality.found}/{mappingQuality.total} colonnes détectées
                  {mappingQuality.missingRequired.length > 0 && (
                    <span className="text-accent-red ml-1">
                      · Manquant : {mappingQuality.missingRequired.map(f => FIELD_META[f].label).join(', ')}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button onClick={reset} className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-bg-hover">
              <X size={15} />
            </button>
          </div>

          {/* Tableau de mapping */}
          <div className="rounded-xl overflow-hidden border border-bg-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-bg-hover border-b border-bg-border">
                  <th className="text-left px-3 py-2 text-text-secondary font-medium">Champ</th>
                  <th className="text-left px-3 py-2 text-text-secondary font-medium">Colonne CSV détectée</th>
                  <th className="text-left px-3 py-2 text-text-secondary font-medium">Confiance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {FIELD_ORDER.map(field => {
                  const meta = FIELD_META[field];
                  const detectedScore = detection.mapping[field]?.score || 0;
                  const currentIdx = editedMap[field];

                  return (
                    <tr key={field} className="hover:bg-bg-hover/50 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-text-primary font-medium">{meta.label}</span>
                          {meta.required && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue font-semibold">
                              Requis
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={currentIdx === -1 ? '' : currentIdx}
                          onChange={e => setEditedMap(prev => ({
                            ...prev,
                            [field]: e.target.value === '' ? -1 : parseInt(e.target.value),
                          }))}
                          className="w-full bg-bg-hover border border-bg-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-blue/50 cursor-pointer"
                        >
                          <option value="">— Aucune —</option>
                          {detection.headers.map((h, idx) => (
                            <option key={idx} value={idx}>{h || `Colonne ${idx + 1}`}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        {currentIdx === editedMap[field] && currentIdx !== -1
                          ? <ScoreBadge score={detectedScore} />
                          : currentIdx === -1
                            ? <ScoreBadge score={0} />
                            : <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue font-medium">Manuel</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Aperçu des 3 premières lignes */}
          {detection.samples.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2">Aperçu des données</p>
              <div className="rounded-xl border border-bg-border overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-bg-hover border-b border-bg-border">
                      {detection.headers.map((h, i) => (
                        <th key={i} className={`text-left px-2.5 py-1.5 font-medium whitespace-nowrap
                          ${Object.values(editedMap).includes(i) ? 'text-accent-blue' : 'text-text-muted'}`}>
                          {h || `Col. ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-border">
                    {detection.samples.map((row, ri) => (
                      <tr key={ri} className="hover:bg-bg-hover/50">
                        {detection.headers.map((_, ci) => (
                          <td key={ci} className={`px-2.5 py-1.5 whitespace-nowrap truncate max-w-[120px]
                            ${Object.values(editedMap).includes(ci) ? 'text-text-primary' : 'text-text-muted'}`}>
                            {row[ci] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-accent-red/10 border border-accent-red/20 rounded-xl">
              <AlertCircle size={15} className="text-accent-red flex-shrink-0 mt-0.5" />
              <p className="text-xs text-accent-red">{error}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-2 pt-1 border-t border-bg-border">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-bg-border hover:border-accent-blue/30 rounded-xl transition-all"
            >
              <RefreshCw size={13} /> Changer de fichier
            </button>
            <button
              onClick={confirmMapping}
              disabled={loading || (mappingQuality?.missingRequired.length > 0)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent-blue hover:opacity-90 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-opacity shadow-lg shadow-accent-blue/20"
            >
              {loading
                ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : <><CheckCircle size={15} /> Confirmer le mapping</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Étape 2 : Succès import ──────────────────────────────────────────── */}
      {imported && (
        <div className="card p-8 flex flex-col items-center text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-accent-green/10 flex items-center justify-center mb-4">
            <CheckCircle size={28} className="text-accent-green" />
          </div>
          <p className="text-base font-bold text-text-primary mb-1">Import réussi !</p>
          <p className="text-sm text-text-muted">Redirection vers le dashboard…</p>
        </div>
      )}

      {/* ── Étape 2 : Preview résultat ───────────────────────────────────────── */}
      {result && !imported && (
        <div className="card p-5 space-y-4 animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-accent-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary truncate max-w-[220px]">{result.fileName}</p>
                <p className="text-xs text-accent-green font-medium">Colonnes mappées automatiquement</p>
              </div>
            </div>
            <button onClick={reset} className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-bg-hover">
              <X size={15} />
            </button>
          </div>

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
