import 'leaflet/dist/leaflet.css';
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import {
  Camera, Upload, CheckCircle, ChevronRight, ChevronLeft,
  MapPin, FileText, Eye, Send, Loader2, AlertTriangle,
  Zap, Flame, Trash2, Droplets, TreePine, Lightbulb, HelpCircle,
} from 'lucide-react';
import type { LatLng } from 'leaflet';
import { CORPORATORS } from '../data';
import type { IssueType, Severity } from '../types';

// ── Type config ───────────────────────────────────────────────────────────────
interface TypeOption {
  value: IssueType;
  label: string;
  Icon: React.FC<{ className?: string }>;
}
const TYPE_OPTIONS: TypeOption[] = [
  { value: 'pothole',      label: 'Pothole',      Icon: ({ className }) => <Zap className={className} /> },
  { value: 'streetlight',  label: 'Streetlight',  Icon: ({ className }) => <Lightbulb className={className} /> },
  { value: 'garbage',      label: 'Garbage',      Icon: ({ className }) => <Trash2 className={className} /> },
  { value: 'flooding',     label: 'Flooding',     Icon: ({ className }) => <Droplets className={className} /> },
  { value: 'encroachment', label: 'Encroachment', Icon: ({ className }) => <Flame className={className} /> },
  { value: 'sewage',       label: 'Sewage',       Icon: ({ className }) => <Droplets className={className} /> },
  { value: 'tree',         label: 'Fallen Tree',  Icon: ({ className }) => <TreePine className={className} /> },
  { value: 'other',        label: 'Other',        Icon: ({ className }) => <HelpCircle className={className} /> },
];

const SEVERITY_OPTIONS: { value: Severity; label: string; classes: string }[] = [
  { value: 'critical', label: 'Critical', classes: 'bg-red-100 text-red-700 border-red-300 ring-red-400' },
  { value: 'high',     label: 'High',     classes: 'bg-orange-100 text-orange-700 border-orange-300 ring-orange-400' },
  { value: 'medium',   label: 'Medium',   classes: 'bg-amber-100 text-amber-700 border-amber-300 ring-amber-400' },
  { value: 'low',      label: 'Low',      classes: 'bg-green-100 text-green-700 border-green-300 ring-green-400' },
];

// ── Mock AI classification result ─────────────────────────────────────────────
interface AiResult {
  type: IssueType;
  severity: Severity;
  department: string;
  classification: string;
  title: string;
}

function mockAiResult(): AiResult {
  return {
    type: 'pothole',
    severity: 'high',
    department: 'BBMP Roads Division',
    classification: 'Pothole — Severity: High — BBMP Roads Division',
    title: 'Dangerous pothole detected on road',
  };
}

// ── Progress stepper ──────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Photo',    icon: Camera },
  { label: 'Details',  icon: FileText },
  { label: 'Location', icon: MapPin },
  { label: 'Confirm',  icon: Eye },
];

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = step.icon;
        return (
          <div key={step.label} className="flex items-center">
            <div className={`flex flex-col items-center`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                done    ? 'bg-orange-500 border-orange-500 text-white' :
                active  ? 'bg-white border-orange-500 text-orange-500' :
                          'bg-white border-gray-200 text-gray-400'
              }`}>
                {done ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs mt-1 font-medium ${active ? 'text-orange-600' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 sm:w-16 h-0.5 mb-5 mx-1 transition-colors ${i < current ? 'bg-orange-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Map click handler ─────────────────────────────────────────────────────────
function MapClickHandler({ onPick }: { onPick: (latlng: LatLng) => void }) {
  useMapEvents({ click: e => onPick(e.latlng) });
  return null;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FilePage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Step 1
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);

  // Step 2
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IssueType>('pothole');
  const [severity, setSeverity] = useState<Severity>('high');
  const [wardId, setWardId] = useState<string>(CORPORATORS[0].id);
  const [address, setAddress] = useState('');

  // Step 3
  const [pinLatLng, setPinLatLng] = useState<LatLng | null>(null);

  // Step 4
  const [reporterName, setReporterName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  const [submitError, setSubmitError] = useState('');

  // ── Photo handling ──────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAnalyzing(true);
    setAiResult(null);
    setTimeout(() => {
      const result = mockAiResult();
      setAiResult(result);
      setTitle(result.title);
      setType(result.type);
      setSeverity(result.severity);
      setAnalyzing(false);
    }, 2000);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  // ── Navigation ──────────────────────────────────────────────────────────
  const canNext = () => {
    if (step === 0) return !!photoFile && !analyzing;
    if (step === 1) return title.trim().length > 0 && description.trim().length > 0;
    if (step === 2) return true; // location optional
    return true;
  };

  const next = () => { if (canNext()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  // ── Submit ──────────────────────────────────────────────────────────────
  const submit = async () => {
    setSubmitting(true);
    setSubmitError('');
    const ward = CORPORATORS.find(c => c.id === wardId);
    const payload = {
      title,
      description,
      type,
      severity,
      wardId: ward?.ward,
      wardName: ward?.wardName,
      address,
      lat: pinLatLng?.lat ?? 12.9716,
      lng: pinLatLng?.lng ?? 77.5946,
      reporterName: reporterName.trim() || 'Anonymous',
    };
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setComplaintId(data.id ?? 'CMP-MOCK-001');
    } catch {
      // Mock success when backend unavailable
      setComplaintId(`CMP-${Date.now().toString(36).toUpperCase()}`);
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  const selectedWard = CORPORATORS.find(c => c.id === wardId);

  // ── Success screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Complaint Filed!</h1>
        <p className="text-gray-500 mb-4">Your complaint has been submitted and will be reviewed by {selectedWard?.name ?? 'the ward corporator'}.</p>
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-6 py-4 mb-6 inline-block">
          <p className="text-xs text-orange-600 mb-1 font-medium">Your Complaint ID</p>
          <p className="text-2xl font-bold text-orange-700 tracking-widest">{complaintId}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'NammaFix Complaint', text: `I filed complaint ${complaintId} on NammaFix.` });
              } else {
                navigator.clipboard.writeText(complaintId);
              }
            }}
            className="px-5 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Share / Copy ID
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">File a Complaint</h1>
      <p className="text-sm text-gray-500 mb-6">Help fix Bangalore — report civic issues in 4 quick steps.</p>

      <Stepper current={step} />

      {/* ── Step 1: Photo Upload ────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onInputChange}
          />

          {!previewUrl ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-colors ${
                dragging ? 'border-orange-400 bg-orange-50' : 'border-gray-300 bg-gray-50 hover:border-orange-300 hover:bg-orange-50/50'
              }`}
            >
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Camera className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-gray-700">Snap or Upload a photo</p>
                <p className="text-sm text-gray-400 mt-1">Drag & drop or click to browse</p>
                <p className="text-xs text-gray-300 mt-0.5">Supports JPG, PNG, HEIC</p>
              </div>
              <div className="flex gap-3">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium">
                  <Camera className="w-4 h-4" /> Take photo
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium">
                  <Upload className="w-4 h-4" /> Upload
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover" />
                <button
                  onClick={() => { setPreviewUrl(null); setPhotoFile(null); setAiResult(null); fileRef.current?.click(); }}
                  className="absolute top-3 right-3 bg-black/50 text-white rounded-full px-3 py-1 text-xs font-medium hover:bg-black/70"
                >
                  Change
                </button>
              </div>

              {analyzing ? (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  <div>
                    <p className="text-sm font-semibold text-blue-700">AI Analyzing…</p>
                    <p className="text-xs text-blue-500">Classifying issue type and severity</p>
                  </div>
                </div>
              ) : aiResult && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-700 mb-1">AI Classification</p>
                      <p className="text-sm text-green-600 mb-2">{aiResult.classification}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-0.5 bg-white border border-green-200 rounded-full text-green-700 capitalize">
                          {aiResult.type}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-white border border-green-200 rounded-full text-green-700 capitalize">
                          {aiResult.severity}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-white border border-green-200 rounded-full text-green-700">
                          {aiResult.department}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Details ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue in detail — location, duration, impact..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type</label>
            <div className="grid grid-cols-4 gap-2">
              {TYPE_OPTIONS.map(opt => {
                const Icon = opt.Icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${
                      type === opt.value
                        ? 'border-orange-400 bg-orange-50 text-orange-700 ring-1 ring-orange-300'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-center leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <div className="flex flex-wrap gap-2">
              {SEVERITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSeverity(opt.value)}
                  className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${opt.classes} ${
                    severity === opt.value ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ward / Area</label>
            <select
              value={wardId}
              onChange={e => setWardId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {CORPORATORS.map(c => (
                <option key={c.id} value={c.id}>Ward {c.ward} — {c.wardName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Nearest landmark or street address"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      )}

      {/* ── Step 3: Location ────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Tap the map to drop a pin at the exact complaint location.</p>
          <div className="rounded-xl overflow-hidden border border-gray-200 h-72 sm:h-96">
            <MapContainer
              center={[12.9716, 77.5946]}
              zoom={12}
              className="w-full h-full"
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapClickHandler onPick={setPinLatLng} />
              {pinLatLng && (
                <CircleMarker
                  center={[pinLatLng.lat, pinLatLng.lng]}
                  radius={12}
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.8, weight: 2 }}
                />
              )}
            </MapContainer>
          </div>
          {pinLatLng ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
              <MapPin className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>
                Pin placed: {pinLatLng.lat.toFixed(5)}, {pinLatLng.lng.toFixed(5)}
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center">No pin placed yet — location is optional.</p>
          )}
        </div>
      )}

      {/* ── Step 4: Confirm & Submit ─────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Summary card */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Summary</h3>

            {previewUrl && (
              <img src={previewUrl} alt="Complaint" className="w-full h-40 object-cover rounded-lg" />
            )}

            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 flex-shrink-0">Title</span>
                <span className="font-medium text-gray-900">{title || '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 flex-shrink-0">Description</span>
                <span className="text-gray-700 line-clamp-3">{description || '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 flex-shrink-0">Type</span>
                <span className="font-medium text-gray-900 capitalize">{type}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 flex-shrink-0">Severity</span>
                <span className={`font-semibold capitalize ${
                  severity === 'critical' ? 'text-red-600' :
                  severity === 'high' ? 'text-orange-600' :
                  severity === 'medium' ? 'text-amber-600' : 'text-green-600'
                }`}>{severity}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 flex-shrink-0">Ward</span>
                <span className="text-gray-700">Ward {selectedWard?.ward} — {selectedWard?.wardName}</span>
              </div>
              {address && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-24 flex-shrink-0">Address</span>
                  <span className="text-gray-700">{address}</span>
                </div>
              )}
              {pinLatLng && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-24 flex-shrink-0">Location</span>
                  <span className="text-gray-700">{pinLatLng.lat.toFixed(5)}, {pinLatLng.lng.toFixed(5)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reporter name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name <span className="text-gray-400">(optional)</span></label>
            <input
              type="text"
              value={reporterName}
              onChange={e => setReporterName(e.target.value)}
              placeholder="Anonymous"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {submitError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {submitError}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold text-base transition-colors"
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
            ) : (
              <><Send className="w-5 h-5" /> Submit Complaint</>
            )}
          </button>
        </div>
      )}

      {/* ── Navigation buttons ──────────────────────────────────────────── */}
      {step < 3 && (
        <div className={`flex mt-8 gap-3 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
          {step > 0 && (
            <button
              onClick={back}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            onClick={next}
            disabled={!canNext()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors"
          >
            {step === 2 ? 'Review' : 'Continue'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
