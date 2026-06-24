import { useState, useEffect, useRef, useCallback } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import DatePicker from '../components/DatePicker';
import { api } from '../api';
import { FileText, Download, Eye, FolderOpen, Upload, Trash2, Send, ChevronDown, Search, Check, X, Settings, Image, Phone, MapPin, User, Palette, Save, RefreshCw, ZoomIn, Move, PenLine, Type, Layers, Plus, Edit2, Wand2, FileCheck, FileCheck2, FileX, Award, Clock, TrendingUp, Star, LogOut, ShieldCheck, BookOpen, Scale, Lock, ClipboardCheck, FileImage, FileSpreadsheet, Archive, File, Presentation } from 'lucide-react';

const DOC_ICONS = [
  { key: 'Appointment Letter',     icon: ClipboardCheck },
  { key: 'Confirmation Letter',    icon: FileCheck      },
  { key: 'Experience Letter',      icon: Award          },
  { key: 'Extended of Probation',  icon: Clock          },
  { key: 'Increment Letter',       icon: TrendingUp     },
  { key: 'Letter Of Intent',       icon: PenLine        },
  { key: 'Promotion Letter',       icon: Star           },
  { key: 'Termination Letter',     icon: FileX          },
  { key: 'Relieving Letter',       icon: LogOut         },
  { key: 'Resignation Acceptance', icon: FileCheck2     },
  { key: 'Offer Letter',           icon: FileText       },
  { key: 'Employment Agreement',   icon: FileCheck2     },
  { key: 'NDA',                    icon: ShieldCheck    },
  { key: 'Confidentiality',        icon: ShieldCheck    },
  { key: 'HR Policy',              icon: BookOpen       },
  { key: 'Code of Conduct',        icon: Scale          },
  { key: 'IT Security',            icon: Lock           },
];

function DocIcon({ label, size = 18, className = '', style }) {
  const match = DOC_ICONS.find(({ key }) => label.toLowerCase().includes(key.toLowerCase()));
  const Icon = match ? match.icon : FileText;
  return <Icon size={size} className={className} style={style} />;
}

function docLabel(filename) {
  return filename.replace(/\.[^.]+$/, '').replace(/\s*\(\d+\)\s*$/, '').trim();
}

function DocTypeIcon({ filename, size = 20, className = '' }) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  const props = { size, className };
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return <FileImage {...props} />;
  if (['xls','xlsx','csv','ods'].includes(ext)) return <FileSpreadsheet {...props} />;
  if (['ppt','pptx','odp'].includes(ext)) return <Presentation {...props} />;
  if (['doc','docx','odt','txt'].includes(ext)) return <FileText {...props} />;
  if (['zip','rar','7z'].includes(ext)) return <Archive {...props} />;
  if (ext === 'pdf') return <FileText {...props} />;
  return <File {...props} />;
}

// Case-insensitive lookup into letterFields (keys are e.g. "Appointment Letter")
function findLetterFields(label, letterFields) {
  if (!label || !letterFields) return null;
  // Exact match first
  if (letterFields[label] !== undefined) return letterFields[label];
  // Case-insensitive fallback
  const lower = label.toLowerCase();
  for (const [key, val] of Object.entries(letterFields)) {
    if (key.toLowerCase() === lower) return val;
  }
  return null;
}


async function fetchPdfBlob(url) {
  const token = localStorage.getItem('artech_hrms_token');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to load PDF');
  return URL.createObjectURL(await res.blob());
}

// ── Employee searchable dropdown ────────────────────────────────────────────
function EmpDropdown({ value, onChange, employees }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = employees.filter(e => !search || e.full_name.toLowerCase().includes(search.toLowerCase()));
  const selected = employees.find(e => e.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm bg-white dark:bg-gray-900 transition-all ${
          open ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20' : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        <span className="flex-1 text-left text-gray-700 dark:text-gray-300 truncate">
          {selected ? selected.full_name : 'Select employee…'}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                className="w-full pl-7 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-[var(--accent)]/30 text-gray-700 dark:text-gray-300 placeholder-gray-400"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-52 py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No employees found</p>
            ) : filtered.map(e => (
              <button
                key={e.id}
                type="button"
                onClick={() => { onChange(e.id); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  value === e.id
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="flex-1 text-left truncate">{e.full_name}</span>
                <span className="text-xs text-gray-400">{e.employee_id}</span>
                {value === e.id && <Check size={12} className="text-[var(--accent)] flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Generate Letter Modal ───────────────────────────────────────────────────
function GenerateModal({ doc, employees, letterFields, onClose, toast }) {
  const rawLabel = docLabel(doc.name);
  // Resolve to the canonical key (matching case in letterFields) so backend lookup works
  const letterType = Object.keys(letterFields).find(k => k.toLowerCase() === rawLabel.toLowerCase()) || rawLabel;
  const fields = findLetterFields(letterType, letterFields) || [];

  const [empId, setEmpId] = useState(null);
  const [form, setForm] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    const defaults = {};
    fields.forEach(f => { if (f.type === 'date' && f.key === 'letter_date') defaults[f.key] = today; });
    return defaults;
  });
  const [generating, setGenerating] = useState(false);

  const f = patch => setForm(p => ({ ...p, ...patch }));

  const submit = async () => {
    if (!empId) return toast('Please select an employee', 'warning');
    for (const field of fields) {
      if (field.required && !form[field.key]?.toString().trim()) {
        return toast(`"${field.label}" is required`, 'warning');
      }
    }
    setGenerating(true);
    try {
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch('/api/hrm/letters/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ letter_type: letterType, employee_id: empId, fields: form }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Generation failed' }));
        throw new Error(err.detail || 'Generation failed');
      }
      // Trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const emp = employees.find(e => e.id === empId);
      a.href = url;
      a.download = `${letterType} - ${emp?.full_name || 'Employee'}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      toast(`Letter generated and sent to employee's portal`, 'success');
      onClose();
    } catch (e) { toast(e.message, 'error'); }
    finally { setGenerating(false); }
  };

  const emp = employees.find(e => e.id === empId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
            <DocIcon label={letterType} size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Generate {letterType}</p>
            <p className="text-xs text-gray-400 mt-0.5">Fill details → PDF sent to employee's portal</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Employee selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Employee <span className="text-red-500">*</span>
            </label>
            <EmpDropdown value={empId} onChange={setEmpId} employees={employees} />
            {emp && (
              <div className="mt-1.5 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{emp.full_name}</span>
                  {emp.designation_name && <> · {emp.designation_name}</>}
                  {emp.employee_id && <span className="ml-1 font-mono text-gray-400">{emp.employee_id}</span>}
                </span>
              </div>
            )}
          </div>

          {/* Letter-specific fields */}
          {fields.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No additional fields needed for this letter.</p>
          ) : fields.map(field => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {field.type === 'date' ? (
                <DatePicker
                  className="form-input w-full"
                  value={form[field.key] || ''}
                  onChange={v => f({ [field.key]: v })}
                  placeholder="Select date"
                />
              ) : field.type === 'select' ? (
                <select
                  className="form-input w-full"
                  value={form[field.key] || field.options[0]}
                  onChange={e => f({ [field.key]: e.target.value })}
                >
                  {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input w-full"
                  placeholder={field.placeholder || ''}
                  value={form[field.key] || ''}
                  onChange={e => f({ [field.key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button
            onClick={submit}
            disabled={generating}
            className="btn btn-primary btn-sm gap-1.5"
          >
            <Send size={13} />
            {generating ? 'Generating…' : 'Generate & Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Custom Document Templates ────────────────────────────────────────────────

const TEMPLATE_CATEGORIES = ['HR Letter', 'Offer', 'Policy', 'Notice', 'Certificate', 'Other'];

// Reusable custom dropdown matching EmpDropdown style
function SelectDropdown({ value, onChange, options, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm bg-white dark:bg-gray-900 transition-all ${
          open ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20' : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        <span className="flex-1 text-left text-gray-700 dark:text-gray-300 truncate">{value || placeholder}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-y-auto max-h-48 py-1">
            {options.map(opt => (
              <button
                key={opt} type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  value === opt
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="flex-1 text-left">{opt}</span>
                {value === opt && <Check size={12} className="text-[var(--accent)]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateFormModal({ template, onClose, onSave, toast, docs = [] }) {
  const isEdit = !!template;
  const [name, setName]           = useState(template?.name || '');
  const [category, setCategory]   = useState(template?.category || 'HR Letter');
  const [content, setContent]     = useState(template?.content || '');
  const [variables, setVariables] = useState(template?.variables || []);
  const [saving, setSaving]       = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showUploadNew, setShowUploadNew] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const fileRef = useRef(null);

  const detectVars = (text = content) => {
    const matches = [...text.matchAll(/\{\{(\w+)\}\}/g)];
    const keys = [...new Set(matches.map(m => m[1]))];
    const existing = new Map((variables || []).map(v => [v.key, v]));
    return keys.map(key => existing.get(key) || {
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      type: key.endsWith('_date') ? 'date' : 'text',
    });
  };

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) return toast('Only PDF or DOCX files are supported', 'warning');
    setSelectedDoc(file.name);
    setExtracting(true);
    try {
      const token = localStorage.getItem('artech_hrms_token');
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/hrm/doc-templates/extract-text', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || 'Extraction failed'); }
      const { text, variables: detectedVars } = await res.json();
      setContent(text);
      setVariables(detectedVars);
      if (!name) setName(file.name.replace(/\.(pdf|docx)$/i, '').replace(/[-_]/g, ' '));
      toast(`Extracted ${detectedVars.length} variable(s) from document`, 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setExtracting(false);
    }
  };

  const submit = async () => {
    if (!name.trim())    return toast('Template name is required', 'warning');
    if (!content.trim()) return toast('Content is required', 'warning');
    setSaving(true);
    try {
      const vars = variables.length ? variables : detectVars();
      const endpoint = isEdit ? `/api/hrm/doc-templates/${template.id}` : '/api/hrm/doc-templates';
      const saved = await api(isEdit ? 'PUT' : 'POST', endpoint, { name, category, content, variables: vars });
      onSave(saved);
      toast(isEdit ? 'Template updated' : 'Template created', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full"
        style={{ maxWidth: 760, maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
              <PenLine size={15} className="text-[var(--accent)]" />
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{isEdit ? 'Edit Template' : 'New Letter Template'}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Source selector — only shown for new templates */}
          {!isEdit && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Document Source</label>

              {/* Existing docs dropdown */}
              {docs.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Pick from uploaded company documents:</p>
                  <SelectDropdown
                    value={selectedDoc}
                    onChange={async (docName) => {
                      setSelectedDoc(docName);
                      setExtracting(true);
                      try {
                        const token = localStorage.getItem('artech_hrms_token');
                        const res = await fetch('/api/hrm/doc-templates/extract-from-doc', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ doc_name: docName }),
                        });
                        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Extraction failed'); }
                        const { text, variables: vars } = await res.json();
                        setContent(text);
                        setVariables(vars);
                        if (!name) setName(docName.replace(/\.(pdf|docx)$/i, '').replace(/[-_]/g, ' '));
                        toast(`Extracted ${vars.length} variable(s)`, 'success');
                      } catch (e) { toast(e.message, 'error'); }
                      finally { setExtracting(false); }
                    }}
                    options={docs.map(d => d.name)}
                    placeholder="Choose a document…"
                  />
                  {extracting && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-[var(--accent)]">
                      <RefreshCw size={12} className="animate-spin" /> Extracting text…
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              </div>

              {/* Upload new file */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  dragOver ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-[var(--accent)]/50'
                }`}
              >
                <Upload size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">Upload a new PDF or DOCX file</span>
                <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
              </div>
            </div>
          )}

          {/* Name + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Template Name *</label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Offer Letter, Salary Certificate"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
              <SelectDropdown value={category} onChange={setCategory} options={TEMPLATE_CATEGORIES} />
            </div>
          </div>

          {/* Content textarea */}
          {(content || isEdit) && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Letter Content</label>
                <button
                  type="button"
                  onClick={() => setVariables(detectVars())}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                >
                  <Wand2 size={11} /> Re-detect variables
                </button>
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={14}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 font-mono p-3 resize-y focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                style={{ minHeight: 200 }}
              />
            </div>
          )}

          {/* Variables list */}
          {variables.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {variables.length} Variable{variables.length !== 1 ? 's' : ''} Detected
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {variables.map((v, i) => (
                  <div key={v.key} className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <code className="text-xs font-mono text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded-md flex-shrink-0 max-w-[120px] truncate">
                      {`{{${v.key}}}`}
                    </code>
                    <input
                      value={v.label}
                      onChange={e => setVariables(vars => vars.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                      className="flex-1 text-xs bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 min-w-0"
                      placeholder="Field label…"
                    />
                    <SelectDropdown
                      value={v.type}
                      onChange={val => setVariables(vars => vars.map((x, j) => j === i ? { ...x, type: val } : x))}
                      options={['text', 'date', 'number']}
                    />
                    <button type="button" onClick={() => setVariables(vars => vars.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={submit} disabled={saving || extracting} className="btn btn-primary btn-sm gap-1.5">
            <Save size={13} />
            {saving ? 'Saving…' : isEdit ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}


function GenerateFromTemplateModal({ template, employees, onClose, toast }) {
  const today = new Date().toISOString().slice(0, 10);
  const vars  = template.variables || [];

  const [empId, setEmpId]       = useState(null);
  const [form, setForm]         = useState(() => {
    const d = {};
    vars.forEach(v => { if (v.type === 'date') d[v.key] = today; });
    return d;
  });
  const [generating, setGenerating] = useState(false);

  const f = patch => setForm(p => ({ ...p, ...patch }));

  // Auto-fill employee data from DB when employee is selected
  const empMeta = empId ? employees.find(e => e.id === empId) : null;

  const submit = async () => {
    // validate non-auto-fill required vars
    const autoKeys = new Set(['employee_name','candidate_name','designation','department','employee_id_code','work_email']);
    for (const v of vars) {
      if (!autoKeys.has(v.key) && !form[v.key]?.toString().trim()) {
        return toast(`"${v.label}" is required`, 'warning');
      }
    }
    setGenerating(true);
    try {
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch(`/api/hrm/doc-templates/${template.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ employee_id: empId || null, fields: form }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Generation failed');
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${template.name}.pdf`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast('Document generated & downloaded', 'success');
      onClose();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const autoKeys = new Set(['employee_name','candidate_name','designation','department','employee_id_code','work_email']);
  const manualVars = vars.filter(v => !autoKeys.has(v.key));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full"
        style={{ maxWidth: 520, maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <Send size={14} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Generate Document</h3>
              <p className="text-xs text-gray-400">{template.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Employee picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Employee <span className="text-gray-400 font-normal normal-case">(optional — auto-fills name, role, dept)</span>
            </label>
            <EmpDropdown value={empId} onChange={setEmpId} employees={employees} />
            {empMeta && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[['Name', empMeta.full_name], ['Role', empMeta.designation], ['Dept', empMeta.department]].filter(([,v]) => v).map(([l, v]) => (
                  <span key={l} className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                    {l}: {v}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Manual variable fields */}
          {manualVars.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fill in Details</p>
              {manualVars.map(v => (
                <div key={v.key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {v.label}
                  </label>
                  {v.type === 'date' ? (
                    <DatePicker
                      value={form[v.key] || ''}
                      onChange={val => f({ [v.key]: val })}
                      placeholder={`Select ${v.label.toLowerCase()}…`}
                    />
                  ) : (
                    <input
                      type={v.type === 'number' ? 'number' : 'text'}
                      value={form[v.key] || ''}
                      onChange={e => f({ [v.key]: e.target.value })}
                      placeholder={`Enter ${v.label.toLowerCase()}…`}
                      className="lp-input w-full"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {vars.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              This template has no variable fields — it will generate as-is.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={submit} disabled={generating} className="btn btn-primary btn-sm gap-1.5">
            <Send size={13} />
            {generating ? 'Generating…' : 'Generate & Download'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Letterhead Template Editor ──────────────────────────────────────────────
const DEFAULTS = {
  company_name: 'AR TECH SOLUTIONS', tagline: 'Driven By Innovation',
  logo_filename: null, logo_x_mm: 16, logo_y_mm: 10, logo_w_mm: 32, logo_h_mm: 32,
  footer_image_filename: null,
  footer_x_mm: 0, footer_y_mm: 0, footer_w_mm: 210, footer_h_mm: 62,
  addr1: 'Flat: 402, 4th Floor, 1-11-254 & 255',
  addr2: "Naiks's Vijayasri Nivas, Prakash Nagar,",
  addr3: 'Begumpet, Hyderabad,', addr4: 'Telangana – 500016',
  phone1: '+91 7993013344', phone2: '+91 7993013355',
  email: 'info@artechsolution.co.in', website: 'www.artechsolution.co.in',
  header_color: '#1764B4', accent_color: '#01BEB0',
  hr_signatory: 'Radhika Yalamanchili', hr_role: 'Human Resource Executive',
  signature_filename: null, sig_x_mm: 18, sig_w_mm: 40, sig_h_mm: 20,
  content_top_mm: 58.92,
  body_font: 'Source Sans 3', body_font_size: 10.5, body_bold: false, body_italic: false,
  watermark_filename: null, watermark_opacity: 0.08,
  watermark_x_mm: 45, watermark_y_mm: 88.5, watermark_w_mm: 120, watermark_h_mm: 120,
};

// Mini header preview constants
const PREV_W = 420;
const A4_MM  = 210;
const SC     = PREV_W / A4_MM;
const HDR_MM = 16.92;
const PREV_H = Math.round((HDR_MM + 48) * SC);

// Authenticated image loader hook
function useAuthImage(filename, endpoint) {
  const [blobUrl, setBlobUrl] = useState(null);
  const prevKey = useRef(null);
  useEffect(() => {
    const key = filename;
    if (!filename) { if (blobUrl) URL.revokeObjectURL(blobUrl); setBlobUrl(null); prevKey.current = null; return; }
    if (key === prevKey.current) return;
    prevKey.current = key;
    const token = localStorage.getItem('artech_hrms_token');
    fetch(`/api/hrm/letterhead-template/${endpoint}/${filename}?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.blob() : null)
      .then(blob => { if (blob) setBlobUrl(URL.createObjectURL(blob)); })
      .catch(() => {});
    return () => { /* cleanup on unmount */ };
  }, [filename, endpoint]);
  return blobUrl;
}

function LogoPreview({ cfg, logoBlobUrl, onLogoChange }) {
  const dragRef = useRef(null);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const startDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      type,
      sx: e.clientX, sy: e.clientY,
      ox: cfg.logo_x_mm || 16,
      oy: cfg.logo_y_mm || 10,
      ow: cfg.logo_w_mm || 32,
      oh: cfg.logo_h_mm || 32,
    };
    const onMove = (ev) => {
      if (!dragRef.current) return;
      const { type: t, sx, sy, ox, oy, ow, oh } = dragRef.current;
      const dx = (ev.clientX - sx) / SC;
      const dy = (ev.clientY - sy) / SC;
      if (t === 'move') {
        onLogoChange({
          logo_x_mm: clamp(ox + dx, 0, A4_MM - (cfg.logo_w_mm || 32) - 1),
          logo_y_mm: clamp(oy + dy, 0, 40),
        });
      } else if (t === 'right') {
        onLogoChange({ logo_w_mm: clamp(ow + dx, 8, 120) });
      } else if (t === 'bottom') {
        onLogoChange({ logo_h_mm: clamp(oh + dy, 8, 60) });
      } else if (t === 'corner') {
        onLogoChange({
          logo_w_mm: clamp(ow + dx, 8, 120),
          logo_h_mm: clamp(oh + dy, 8, 60),
        });
      }
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const lx = (cfg.logo_x_mm || 16) * SC;
  const ly = HDR_MM * SC + (cfg.logo_y_mm || 10) * SC;
  const lw = (cfg.logo_w_mm || 32) * SC;
  const lh = (cfg.logo_h_mm || 32) * SC;
  const hc = cfg.header_color || '#1764B4';
  const ac = cfg.accent_color || '#01BEB0';
  const HANDLE = 10;

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
        <Move size={11} /> Logo Position &amp; Size
        <span className="text-gray-400 font-normal ml-1">(drag body to move · right edge = width · bottom edge = height · corner = both)</span>
      </p>
      <div
        className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 select-none shadow-sm"
        style={{ width: PREV_W, height: PREV_H, background: '#f8f9fb' }}
      >
        {/* Header stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HDR_MM * SC, background: hc }} />
        {/* Teal corner */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: (A4_MM - 98.4) * SC, height: HDR_MM * SC,
          background: ac,
          clipPath: `polygon(${((138 - 98.4) / (A4_MM - 98.4) * 100).toFixed(1)}% 0%, 100% 0%, 100% 100%, 0% 100%)`,
        }} />
        {/* Divider */}
        <div style={{ position: 'absolute', left: 15 * SC, right: 15 * SC, top: (HDR_MM + 40) * SC, height: 1, background: '#CCCCCC' }} />

        {/* Logo element */}
        <div
          style={{ position: 'absolute', left: lx, top: ly, width: lw, height: lh, cursor: 'grab', userSelect: 'none' }}
          onMouseDown={e => startDrag(e, 'move')}
        >
          {logoBlobUrl ? (
            <img
              src={logoBlobUrl}
              alt="logo"
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', borderRadius: 3 }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', border: '2px dashed #bbb', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: '#bbb' }}>Upload logo</span>
            </div>
          )}

          {/* Right-edge handle (stretch width) */}
          <div
            style={{ position: 'absolute', right: -HANDLE/2, top: '25%', width: HANDLE, height: '50%', cursor: 'ew-resize', background: ac, borderRadius: 3, opacity: 0.85 }}
            onMouseDown={e => startDrag(e, 'right')}
          />
          {/* Bottom-edge handle (stretch height) */}
          <div
            style={{ position: 'absolute', bottom: -HANDLE/2, left: '25%', width: '50%', height: HANDLE, cursor: 'ns-resize', background: ac, borderRadius: 3, opacity: 0.85 }}
            onMouseDown={e => startDrag(e, 'bottom')}
          />
          {/* Corner handle (both) */}
          <div
            style={{ position: 'absolute', bottom: -HANDLE/2, right: -HANDLE/2, width: HANDLE+2, height: HANDLE+2, cursor: 'nwse-resize', background: hc, borderRadius: 3, border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            onMouseDown={e => startDrag(e, 'corner')}
          />
        </div>

        {/* Readout */}
        <div style={{ position: 'absolute', bottom: 4, right: 8, fontSize: 9, color: '#999', fontFamily: 'monospace' }}>
          x:{Math.round(cfg.logo_x_mm||16)} y:{Math.round(cfg.logo_y_mm||10)} w:{Math.round(cfg.logo_w_mm||32)} h:{Math.round(cfg.logo_h_mm||32)}
        </div>
      </div>

      {/* Numeric inputs */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {[
          { label: 'X', k: 'logo_x_mm', min: 0, max: 190, unit: 'mm' },
          { label: 'Y', k: 'logo_y_mm', min: 0, max: 40, unit: 'mm' },
          { label: 'Width', k: 'logo_w_mm', min: 8, max: 120, unit: 'mm' },
          { label: 'Height', k: 'logo_h_mm', min: 8, max: 60, unit: 'mm' },
        ].map(({ label, k, min, max, unit }) => (
          <label key={k} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">{label}</span>
            <input
              type="number" min={min} max={max} step={0.5}
              value={+(cfg[k] || 0).toFixed(1)}
              onChange={e => onLogoChange({ [k]: parseFloat(e.target.value) || 0 })}
              className="form-input w-16 text-xs py-1 px-1.5"
            />
            <span className="text-gray-400">{unit}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Signature live preview (signoff area mockup) ──────────────────────────────
const SIG_PREVIEW_W = 420;
const SIG_SC = SIG_PREVIEW_W / A4_MM; // px per mm

function SignaturePreview({ cfg, sigBlobUrl, onSigChange }) {
  const dragRef = useRef(null);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const sx   = (cfg.sig_x_mm  ?? 18) * SIG_SC;
  const sWmm = cfg.sig_w_mm ?? 40;
  const sHmm = cfg.sig_h_mm ?? 20;
  const sW   = sWmm * SIG_SC;
  const sH   = sHmm * SIG_SC;

  // Line height in preview (px) — approximate 10.5pt at 72dpi/mm
  const pxLH = 5.0 * SIG_SC;
  const pxPG = 2.0 * SIG_SC;
  const textX = 18 * SIG_SC;

  // Preview height: "Yours sincerely" + "For ..." + sig + name + role + padding
  const prevH = Math.round(pxLH * 2 + sH + pxPG + pxLH * 2 + pxLH * 2);
  const HANDLE = 10;
  const ac = cfg.accent_color || '#01BEB0';
  const hc = cfg.header_color || '#1764B4';

  // y positions (from top)
  const row1y = pxLH;
  const row2y = row1y + pxLH;
  const sigTop = row2y + pxLH * 0.4;
  const nameY  = sigTop + sH + pxPG;
  const roleY  = nameY + pxLH;

  const startDrag = (e, type) => {
    e.preventDefault(); e.stopPropagation();
    dragRef.current = { type, sx: e.clientX, sy: e.clientY, ox: cfg.sig_x_mm ?? 18, ow: sWmm, oh: sHmm };
    const onMove = (ev) => {
      if (!dragRef.current) return;
      const { type: t, sx: startX, ow, oh, ox } = dragRef.current;
      const dx = (ev.clientX - startX) / SIG_SC;
      if (t === 'move') onSigChange({ sig_x_mm: clamp(ox + dx, 0, A4_MM - ow - 1) });
      else if (t === 'right') onSigChange({ sig_w_mm: clamp(ow + dx, 10, 120) });
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Height resize (bottom handle changes height via pointer y)
  const startHeightDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    const startY = e.clientY; const startH = sHmm;
    const onMove = (ev) => onSigChange({ sig_h_mm: clamp(startH + (ev.clientY - startY) / SIG_SC, 5, 60) });
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
        <PenLine size={11} /> Signature Preview &amp; Size
        <span className="text-gray-400 font-normal ml-1">(drag to move left/right · right edge = width · bottom = height)</span>
      </p>

      <div
        className="relative rounded-xl border border-gray-200 dark:border-gray-700 select-none shadow-sm bg-white dark:bg-gray-900"
        style={{ width: SIG_PREVIEW_W, height: prevH + pxLH }}
      >
        {/* "Yours sincerely," */}
        <div style={{ position: 'absolute', top: row1y, left: textX, fontSize: 10, color: '#1A1A2E', fontFamily: 'serif' }}>
          Yours sincerely,
        </div>
        {/* "For AR TECH SOLUTIONS" */}
        <div style={{ position: 'absolute', top: row2y, left: textX, fontSize: 10, fontWeight: 700, color: '#1A1A2E', fontFamily: 'serif' }}>
          For {cfg.company_name || 'AR TECH SOLUTIONS'}
        </div>

        {/* Signature image element */}
        <div
          style={{ position: 'absolute', top: sigTop, left: sx, width: sW, height: sH, cursor: 'ew-resize', userSelect: 'none' }}
          onMouseDown={e => startDrag(e, 'move')}
        >
          {sigBlobUrl ? (
            <img src={sigBlobUrl} alt="signature" draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', border: '2px dashed #ddd', borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: '#bbb', fontFamily: 'sans-serif' }}>Signature image</span>
            </div>
          )}
          {/* Right-edge handle */}
          <div style={{ position: 'absolute', right: -HANDLE/2, top: '20%', width: HANDLE, height: '60%',
            cursor: 'ew-resize', background: ac, borderRadius: 3, opacity: 0.85 }}
            onMouseDown={e => startDrag(e, 'right')} />
          {/* Bottom-edge handle */}
          <div style={{ position: 'absolute', bottom: -HANDLE/2, left: '25%', width: '50%', height: HANDLE,
            cursor: 'ns-resize', background: ac, borderRadius: 3, opacity: 0.85 }}
            onMouseDown={startHeightDrag} />
          {/* Corner handle */}
          <div style={{ position: 'absolute', bottom: -HANDLE/2, right: -HANDLE/2, width: HANDLE+2, height: HANDLE+2,
            cursor: 'nwse-resize', background: hc, borderRadius: 3, border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
            onMouseDown={e => {
              e.preventDefault(); e.stopPropagation();
              const startX = e.clientX; const startY = e.clientY; const startW = sWmm; const startH2 = sHmm;
              const onMove = (ev) => onSigChange({
                sig_w_mm: clamp(startW + (ev.clientX - startX) / SIG_SC, 10, 120),
                sig_h_mm: clamp(startH2 + (ev.clientY - startY) / SIG_SC, 5, 60),
              });
              const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }} />
        </div>

        {/* Signatory name */}
        <div style={{ position: 'absolute', top: nameY, left: textX, fontSize: 10, fontWeight: 700, color: '#1A1A2E', fontFamily: 'serif' }}>
          {cfg.hr_signatory || 'Signatory Name'}
        </div>
        {/* HR Role */}
        <div style={{ position: 'absolute', top: roleY, left: textX, fontSize: 10, color: '#1A1A2E', fontFamily: 'serif' }}>
          {cfg.hr_role || 'Designation'}
        </div>

        {/* Readout */}
        <div style={{ position: 'absolute', bottom: 3, right: 8, fontSize: 9, color: '#bbb', fontFamily: 'monospace' }}>
          x:{Math.round(cfg.sig_x_mm??18)} w:{Math.round(sWmm)} h:{Math.round(sHmm)}
        </div>
      </div>

      {/* Numeric inputs */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {[
          { label: 'X offset', k: 'sig_x_mm',  min: 0,  max: 150, unit: 'mm' },
          { label: 'Width',    k: 'sig_w_mm',   min: 10, max: 120, unit: 'mm' },
          { label: 'Height',   k: 'sig_h_mm',   min: 5,  max: 60,  unit: 'mm' },
        ].map(({ label, k, min, max, unit }) => (
          <label key={k} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">{label}</span>
            <input type="number" min={min} max={max} step={0.5}
              value={+(cfg[k] ?? 0).toFixed(1)}
              onChange={e => onSigChange({ [k]: parseFloat(e.target.value) || 0 })}
              className="form-input w-16 text-xs py-1 px-1.5" />
            <span className="text-gray-400">{unit}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// Footer zone: 62mm tall above HEADER_H strip, full page width = 210mm
const FOOTER_ZONE_MM = 62;
const FTRAP_X2_MM    = 111.6;  // teal trapezoid right edge at bottom
const FTRAP_X1_MM    = 72.0;   // teal trapezoid left edge top

function FooterPreview({ cfg, footerBlobUrl, onFooterChange }) {
  const dragRef = useRef(null);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const fx   = (cfg.footer_x_mm  ?? 0)   * SC;
  const fYmm = cfg.footer_y_mm  ?? 0;
  const fWmm = cfg.footer_w_mm  ?? A4_MM;
  const fHmm = cfg.footer_h_mm  ?? FOOTER_ZONE_MM;
  const fZoneH = FOOTER_ZONE_MM * SC;
  const prevH  = Math.round(fZoneH + HDR_MM * SC);
  // In preview: y=0 is top of footer zone (highest point on page), strip is at bottom
  // imgTop = distance from top of preview to top of image
  const imgTop  = fZoneH - (fYmm + fHmm) * SC;
  const imgLeft = fx;
  const imgW    = fWmm * SC;
  const imgH    = fHmm * SC;
  const hc = cfg.header_color  || '#1764B4';
  const ac = cfg.accent_color  || '#01BEB0';
  const HANDLE = 10;

  const startDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { type, sx: e.clientX, sy: e.clientY, ox: cfg.footer_x_mm ?? 0, oy: fYmm, ow: fWmm, oh: fHmm };
    const onMove = (ev) => {
      if (!dragRef.current) return;
      const { type: t, sx, sy, ox, oy, ow, oh } = dragRef.current;
      const dx =  (ev.clientX - sx) / SC;
      const dy = -(ev.clientY - sy) / SC; // DOM y down → PDF y decreases
      if (t === 'move') {
        onFooterChange({
          footer_x_mm: clamp(ox + dx, 0, A4_MM - ow),
          footer_y_mm: clamp(oy + dy, 0, FOOTER_ZONE_MM - oh),
        });
      } else if (t === 'right') {
        onFooterChange({ footer_w_mm: clamp(ow + dx, 20, A4_MM - (cfg.footer_x_mm ?? 0)) });
      } else if (t === 'top') {
        // Drag top edge upward → taller image, y_mm stays (bottom anchored)
        onFooterChange({ footer_h_mm: clamp(oh - dy, 10, FOOTER_ZONE_MM) });
      } else if (t === 'corner') {
        onFooterChange({ footer_w_mm: clamp(ow + dx, 20, A4_MM), footer_h_mm: clamp(oh - dy, 10, FOOTER_ZONE_MM) });
      }
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="mt-2">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
        <Move size={11} /> Footer Image Position &amp; Size
        <span className="text-gray-400 font-normal ml-1">(drag to move · right = width · top edge = height · corner = both)</span>
      </p>
      <div
        className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 select-none shadow-sm"
        style={{ width: PREV_W, height: prevH, background: '#f8f9fb' }}
      >
        {/* Footer zone background */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: fZoneH, background: '#f8f9fb' }} />
        {/* Teal footer strip */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: HDR_MM * SC, background: ac }} />
        {/* Blue bar at very bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8.73 / 16.92 * HDR_MM * SC, background: hc }} />
        {/* Teal trapezoid (bottom-left) */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: FTRAP_X2_MM * SC, height: HDR_MM * SC,
          background: ac,
          clipPath: `polygon(0% 0%, 100% 0%, ${(FTRAP_X1_MM / FTRAP_X2_MM * 100).toFixed(1)}% 100%, 0% 100%)`,
        }} />
        {/* Separator line at top of footer zone */}
        <div style={{ position: 'absolute', top: 0, left: 15 * SC, right: 15 * SC, height: 1, background: '#CCCCCC' }} />

        {/* Footer image element */}
        <div
          style={{ position: 'absolute', left: imgLeft, top: imgTop, width: imgW, height: imgH, cursor: 'grab', userSelect: 'none' }}
          onMouseDown={e => startDrag(e, 'move')}
        >
          {footerBlobUrl ? (
            <img src={footerBlobUrl} alt="footer" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', border: '2px dashed #bbb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: '#bbb' }}>Upload footer image</span>
            </div>
          )}
          {/* Right-edge handle */}
          <div style={{ position: 'absolute', right: -HANDLE/2, top: '25%', width: HANDLE, height: '50%', cursor: 'ew-resize', background: ac, borderRadius: 3, opacity: 0.85 }} onMouseDown={e => startDrag(e, 'right')} />
          {/* Top-edge handle */}
          <div style={{ position: 'absolute', top: -HANDLE/2, left: '25%', width: '50%', height: HANDLE, cursor: 'ns-resize', background: ac, borderRadius: 3, opacity: 0.85 }} onMouseDown={e => startDrag(e, 'top')} />
          {/* Top-right corner handle */}
          <div style={{ position: 'absolute', top: -HANDLE/2, right: -HANDLE/2, width: HANDLE+2, height: HANDLE+2, cursor: 'nesw-resize', background: hc, borderRadius: 3, border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} onMouseDown={e => startDrag(e, 'corner')} />
        </div>

        {/* Readout */}
        <div style={{ position: 'absolute', top: 4, right: 8, fontSize: 9, color: '#999', fontFamily: 'monospace' }}>
          x:{Math.round(cfg.footer_x_mm??0)} y:{Math.round(fYmm)} w:{Math.round(fWmm)} h:{Math.round(fHmm)}
        </div>
      </div>

      {/* Numeric inputs */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {[
          { label: 'X', k: 'footer_x_mm', min: 0, max: 190, unit: 'mm' },
          { label: 'Y (from bottom)', k: 'footer_y_mm', min: 0, max: 55, unit: 'mm' },
          { label: 'Width', k: 'footer_w_mm', min: 20, max: 210, unit: 'mm' },
          { label: 'Height', k: 'footer_h_mm', min: 10, max: 62, unit: 'mm' },
        ].map(({ label, k, min, max, unit }) => (
          <label key={k} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">{label}</span>
            <input
              type="number" min={min} max={max} step={0.5}
              value={+(cfg[k] ?? 0).toFixed(1)}
              onChange={e => onFooterChange({ [k]: parseFloat(e.target.value) || 0 })}
              className="form-input w-16 text-xs py-1 px-1.5"
            />
            <span className="text-gray-400">{unit}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

const FONT_CSS = {
  'Source Sans 3':    '"Source Sans 3", "Source Sans Pro", Arial, sans-serif',
  'Plus Jakarta Sans':'Plus Jakarta Sans, Arial, sans-serif',
  'Helvetica':        'Arial, Helvetica, sans-serif',
  'Times-Roman':      '"Times New Roman", Times, serif',
  'Courier':          '"Courier New", Courier, monospace',
};

function ContentTypographyPreview({ cfg, onChange }) {
  const dragRef = useRef(null);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const ctm = cfg.content_top_mm ?? 58.92;
  const lineY = Math.round(ctm * SC);
  const PREV_H = Math.max(lineY + 60, 120);
  const hc = cfg.header_color || '#1764B4';
  const ac = cfg.accent_color || '#01BEB0';

  const startDrag = (e) => {
    e.preventDefault();
    const sy = e.clientY; const ov = ctm;
    const onMove = (ev) => {
      const dy = (ev.clientY - sy) / SC;
      onChange({ content_top_mm: clamp(ov + dy, HDR_MM + 4, 90) });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
        <Move size={11} /> Content Start Position
        <span className="text-gray-400 font-normal ml-1">(drag the teal line to set where body text begins)</span>
      </p>
      <div
        className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 select-none shadow-sm"
        style={{ width: PREV_W, height: PREV_H, background: '#f8f9fb' }}
      >
        {/* Header stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HDR_MM * SC, background: hc }} />
        {/* Mock letter content (faint lines below the start line) */}
        {lineY < PREV_H - 10 && (
          <div style={{ position: 'absolute', top: lineY + 8, left: 18 * SC, right: 18 * SC, pointerEvents: 'none' }}>
            <div style={{ height: 8, background: '#666', borderRadius: 2, width: '38%', marginBottom: 6, opacity: 0.18 }} />
            {[92, 80, 88, 70].map((w, i) => (
              <div key={i} style={{ height: 5, background: '#888', borderRadius: 2, width: `${w}%`, marginBottom: 4, opacity: 0.12 }} />
            ))}
          </div>
        )}
        {/* Draggable start line */}
        <div
          style={{ position: 'absolute', left: 0, right: 0, top: lineY - 1, height: 2, background: ac, cursor: 'ns-resize', zIndex: 10 }}
          onMouseDown={startDrag}
        >
          {/* Drag handle pill */}
          <div style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: -8,
            width: 36, height: 14, background: ac, borderRadius: 4, cursor: 'ns-resize',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
          }}>
            {[0, 1].map(i => <div key={i} style={{ width: 12, height: 2, background: 'white', borderRadius: 1 }} />)}
          </div>
          {/* Readout */}
          <div style={{ position: 'absolute', right: 10, top: 4, fontSize: 9, color: ac, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            {(Math.round(ctm * 10) / 10).toFixed(1)} mm
          </div>
        </div>
      </div>
      {/* Numeric input */}
      <div className="flex items-center gap-2 mt-2">
        <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">Content starts at</span>
          <input
            type="number" min={20} max={90} step={0.5}
            value={+(ctm).toFixed(1)}
            onChange={e => onChange({ content_top_mm: parseFloat(e.target.value) || 58.92 })}
            className="form-input w-20 text-xs py-1 px-1.5"
          />
          <span className="text-gray-400">mm from top of page</span>
        </label>
        <button
          type="button"
          onClick={() => onChange({ content_top_mm: 58.92 })}
          className="text-[11px] text-gray-400 hover:text-[var(--accent)] transition-colors"
        >Reset</button>
      </div>
    </div>
  );
}


function LetterheadEditor({ toast }) {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFooter, setUploadingFooter] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [uploadingWm, setUploadingWm] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);
  const [deletingFooter, setDeletingFooter] = useState(false);
  const [deletingSig, setDeletingSig] = useState(false);
  const [deletingWm, setDeletingWm] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [footerDragOver, setFooterDragOver] = useState(false);
  const logoInputRef = useRef(null);
  const footerInputRef = useRef(null);
  // Authenticated blob URLs for images
  const logoBlobUrl = useAuthImage(cfg.logo_filename, 'logo');
  const footerBlobUrl = useAuthImage(cfg.footer_image_filename, 'footer-image');
  const sigBlobUrl = useAuthImage(cfg.signature_filename, 'signature');
  const wmBlobUrl = useAuthImage(cfg.watermark_filename, 'watermark');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('GET', '/api/hrm/letterhead-template');
      setCfg({ ...DEFAULTS, ...data });
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = patch => setCfg(p => ({ ...p, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      const { logo_filename, footer_image_filename, watermark_filename, ...body } = cfg;
      await api('PUT', '/api/hrm/letterhead-template', body);
      toast('Template saved — all new letters will use this design', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const saveAndPreview = async () => {
    setSaving(true);
    try {
      const { logo_filename, footer_image_filename, watermark_filename, ...body } = cfg;
      await api('PUT', '/api/hrm/letterhead-template', body);
    } catch (e) { toast(e.message, 'error'); setSaving(false); return; }
    setSaving(false);
    setPreviewing(true);
    try {
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch('/api/hrm/letterhead-template/preview', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Preview generation failed');
      const blob = await res.blob();
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(URL.createObjectURL(blob));
    } catch (e) { toast(e.message, 'error'); }
    finally { setPreviewing(false); }
  };

  const uploadLogo = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      toast('Only PNG, JPG, or WEBP images are allowed', 'warning'); return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch('/api/hrm/letterhead-template/logo', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) { const err = await res.json().catch(() => ({ detail: 'Upload failed' })); throw new Error(err.detail || 'Upload failed'); }
      const data = await res.json();
      // Clear then re-set to trigger useAuthImage to reload
      setCfg(p => ({ ...p, logo_filename: null }));
      setTimeout(() => setCfg(p => ({ ...p, logo_filename: data.logo_filename })), 50);
      toast('Logo uploaded successfully', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setUploading(false); }
  }, [toast]);

  const uploadFooterImage = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      toast('Only PNG, JPG, or WEBP images are allowed', 'warning'); return;
    }
    setUploadingFooter(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch('/api/hrm/letterhead-template/footer-image', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) { const err = await res.json().catch(() => ({ detail: 'Upload failed' })); throw new Error(err.detail || 'Upload failed'); }
      const data = await res.json();
      setCfg(p => ({ ...p, footer_image_filename: null }));
      setTimeout(() => setCfg(p => ({ ...p, footer_image_filename: data.footer_image_filename })), 50);
      toast('Footer image uploaded — it will replace the default footer in all letters', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setUploadingFooter(false); }
  }, [toast]);

  const handleLogoFileInput = (e) => { uploadLogo(e.target.files?.[0]); e.target.value = ''; };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); uploadLogo(e.dataTransfer.files?.[0]); };
  const handleFooterFileInput = (e) => { uploadFooterImage(e.target.files?.[0]); e.target.value = ''; };
  const handleFooterDrop = (e) => { e.preventDefault(); setFooterDragOver(false); uploadFooterImage(e.dataTransfer.files?.[0]); };

  const deleteLogo = async () => {
    setDeletingLogo(true);
    try {
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch('/api/hrm/letterhead-template/logo', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Delete failed');
      set({ logo_filename: null });
      toast('Logo removed', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setDeletingLogo(false); }
  };

  const deleteFooterImage = async () => {
    setDeletingFooter(true);
    try {
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch('/api/hrm/letterhead-template/footer-image', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Delete failed');
      set({ footer_image_filename: null });
      toast('Footer image removed — default footer will be used', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setDeletingFooter(false); }
  };

  const sigInputRef = useRef(null);
  const [sigDragOver, setSigDragOver] = useState(false);

  const uploadSignature = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) { toast('Only PNG/JPG/WEBP allowed', 'warning'); return; }
    setUploadingSig(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch('/api/hrm/letterhead-template/signature', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) { const err = await res.json().catch(() => ({ detail: 'Upload failed' })); throw new Error(err.detail || 'Upload failed'); }
      const data = await res.json();
      setCfg(p => ({ ...p, signature_filename: null }));
      setTimeout(() => setCfg(p => ({ ...p, signature_filename: data.signature_filename })), 50);
      toast('Signature uploaded', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setUploadingSig(false); }
  }, [toast]);

  const handleSigFileInput = (e) => { uploadSignature(e.target.files?.[0]); e.target.value = ''; };
  const handleSigDrop = (e) => { e.preventDefault(); setSigDragOver(false); uploadSignature(e.dataTransfer.files?.[0]); };

  const deleteSignature = async () => {
    setDeletingSig(true);
    try {
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch('/api/hrm/letterhead-template/signature', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Delete failed');
      set({ signature_filename: null });
      toast('Signature removed', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setDeletingSig(false); }
  };

  const wmInputRef = useRef(null);
  const [wmDragOver, setWmDragOver] = useState(false);

  const uploadWatermark = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) { toast('Only PNG/JPG/WEBP allowed', 'warning'); return; }
    setUploadingWm(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch('/api/hrm/letterhead-template/watermark', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) { const err = await res.json().catch(() => ({ detail: 'Upload failed' })); throw new Error(err.detail || 'Upload failed'); }
      const data = await res.json();
      setCfg(p => ({ ...p, watermark_filename: null }));
      setTimeout(() => setCfg(p => ({ ...p, watermark_filename: data.watermark_filename })), 50);
      toast('Watermark uploaded', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setUploadingWm(false); }
  }, [toast]);

  const handleWmFileInput = (e) => { uploadWatermark(e.target.files?.[0]); e.target.value = ''; };
  const handleWmDrop = (e) => { e.preventDefault(); setWmDragOver(false); uploadWatermark(e.dataTransfer.files?.[0]); };

  const deleteWatermark = async () => {
    setDeletingWm(true);
    try {
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch('/api/hrm/letterhead-template/watermark', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Delete failed');
      set({ watermark_filename: null });
      toast('Watermark removed', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setDeletingWm(false); }
  };

  const Field = ({ label, k, placeholder, type = 'text', half }) => (
    <div className={half ? '' : 'col-span-2'}>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        className="form-input w-full text-sm"
        value={cfg[k] || ''}
        placeholder={placeholder || label}
        onChange={e => set({ [k]: e.target.value })}
      />
    </div>
  );

  const Section = ({ icon: Icon, title, children }) => (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-[var(--accent)]" />
        </div>
        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{title}</p>
      </div>
      {children}
    </div>
  );

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="card p-5 animate-pulse h-32" />)}
    </div>
  );

  // logoBlobUrl and footerBlobUrl come from useAuthImage hooks above

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <Settings size={15} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Configure your company letterhead here. All generated letters use these settings automatically.
          Save your changes, then click <strong>Save &amp; Preview</strong> to see the result as a PDF.
        </p>
      </div>

      {/* Logo */}
      <Section icon={Image} title="Header Logo">
        <div className="flex items-start gap-5">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && logoInputRef.current?.click()}
            className={`relative w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all flex-shrink-0 ${
              dragOver
                ? 'border-[var(--accent)] bg-[var(--accent)]/5 scale-105'
                : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-[var(--accent)] hover:bg-[var(--accent)]/5'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-1">
                <RefreshCw size={20} className="text-[var(--accent)] animate-spin" />
                <span className="text-[10px] text-gray-400">Uploading…</span>
              </div>
            ) : logoBlobUrl ? (
              <>
                <img src={logoBlobUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                  <span className="text-[10px] text-white font-semibold">Change</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-center px-2">
                <Upload size={20} className="text-gray-300" />
                <span className="text-[10px] text-gray-400 leading-tight">
                  {dragOver ? 'Drop here' : 'Click or drag\nto upload'}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3 pt-1">
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Logo Image</p>
              <p className="text-[11px] text-gray-400 mt-0.5">PNG or JPG, transparent background recommended. The logo replaces the company name text.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => logoInputRef.current?.click()} disabled={uploading} className="btn btn-secondary btn-sm gap-1.5">
                <Upload size={12} />{uploading ? 'Uploading…' : 'Upload Logo'}
              </button>
              {cfg.logo_filename && (
                <button onClick={deleteLogo} disabled={deletingLogo} className="btn btn-sm gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 border border-red-200 dark:border-red-800">
                  <Trash2 size={12} />{deletingLogo ? 'Removing…' : 'Delete Logo'}
                </button>
              )}
            </div>
            {cfg.logo_filename && (
              <p className="text-[11px] text-green-600 flex items-center gap-1">
                <Check size={10} /> {cfg.logo_filename} is active
              </p>
            )}
          </div>
        </div>

        {/* Interactive logo position/size preview */}
        <LogoPreview cfg={cfg} logoBlobUrl={logoBlobUrl} onLogoChange={set} />

        <input ref={logoInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleLogoFileInput} />
      </Section>

      {/* Footer */}
      <Section icon={MapPin} title="Footer Details">
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
          Upload a custom footer image to replace the default address/contact block, or fill in the fields below.
        </p>

        {/* Footer image upload — full-width drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setFooterDragOver(true); }}
          onDragLeave={() => setFooterDragOver(false)}
          onDrop={handleFooterDrop}
          onClick={() => !uploadingFooter && footerInputRef.current?.click()}
          className={`relative w-full rounded-xl border-2 flex items-center justify-center cursor-pointer overflow-hidden transition-all ${
            footerDragOver
              ? 'border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.01]'
              : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-[var(--accent)] hover:bg-[var(--accent)]/5'
          }`}
          style={{ height: 80 }}
        >
          {uploadingFooter ? (
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="text-[var(--accent)] animate-spin" />
              <span className="text-xs text-gray-400">Uploading…</span>
            </div>
          ) : footerBlobUrl ? (
            <>
              <img src={footerBlobUrl} alt="Footer" className="w-full h-full object-fill" style={{ objectFit: 'fill' }} />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-xs text-white font-semibold">Click to change</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-center px-4">
              <Upload size={16} className="text-gray-300 flex-shrink-0" />
              <span className="text-xs text-gray-400">
                {footerDragOver ? 'Drop footer image here' : 'Click or drag to upload footer image (optional — replaces address/contact block)'}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap -mt-1">
          <button onClick={() => footerInputRef.current?.click()} disabled={uploadingFooter} className="btn btn-secondary btn-sm gap-1.5">
            <Upload size={12} />{uploadingFooter ? 'Uploading…' : 'Upload Footer Image'}
          </button>
          {cfg.footer_image_filename && (
            <button onClick={deleteFooterImage} disabled={deletingFooter} className="btn btn-sm gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 border border-red-200 dark:border-red-800">
              <Trash2 size={12} />{deletingFooter ? 'Removing…' : 'Remove Footer Image'}
            </button>
          )}
          {cfg.footer_image_filename && (
            <p className="text-[11px] text-green-600 flex items-center gap-1">
              <Check size={10} /> Custom footer active — text fields below are ignored
            </p>
          )}
        </div>

        <input ref={footerInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFooterFileInput} />

        {/* Footer image position/size interactive preview */}
        <FooterPreview cfg={cfg} footerBlobUrl={footerBlobUrl} onFooterChange={set} />

        {/* Default text footer fields */}
        <div className={cfg.footer_image_filename ? 'opacity-40 pointer-events-none' : ''}>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Address</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Address Line 1" k="addr1" half />
            <Field label="Address Line 2" k="addr2" half />
            <Field label="Address Line 3" k="addr3" half />
            <Field label="Address Line 4" k="addr4" half />
          </div>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Contact</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone 1" k="phone1" half />
            <Field label="Phone 2" k="phone2" half />
            <Field label="Email" k="email" half />
            <Field label="Website" k="website" half />
          </div>
        </div>
      </Section>

      {/* HR Signatory */}
      <Section icon={User} title="HR Signatory">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Signatory Name" k="hr_signatory" placeholder="e.g. Radhika Yalamanchili" half />
          <Field label="Signatory Role / Title" k="hr_role" placeholder="e.g. Human Resource Executive" half />
        </div>

        {/* Signature image upload */}
        <div>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
            <PenLine size={12} /> Signature Image
          </p>
          <div className="flex items-start gap-4">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setSigDragOver(true); }}
              onDragLeave={() => setSigDragOver(false)}
              onDrop={handleSigDrop}
              onClick={() => !uploadingSig && sigInputRef.current?.click()}
              className={`relative rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all flex-shrink-0 ${
                sigDragOver
                  ? 'border-[var(--accent)] bg-[var(--accent)]/5 scale-105'
                  : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-[var(--accent)] hover:bg-[var(--accent)]/5'
              }`}
              style={{ width: 120, height: 52 }}
            >
              {uploadingSig ? (
                <div className="flex flex-col items-center gap-1">
                  <RefreshCw size={14} className="text-[var(--accent)] animate-spin" />
                  <span className="text-[10px] text-gray-400">Uploading…</span>
                </div>
              ) : sigBlobUrl ? (
                <>
                  <img src={sigBlobUrl} alt="Signature" className="w-full h-full object-contain p-1" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[10px] text-white font-semibold">Change</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-center px-2">
                  <Upload size={14} className="text-gray-300" />
                  <span className="text-[10px] text-gray-400 leading-tight">
                    {sigDragOver ? 'Drop here' : 'Signature\nimage'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2 pt-1">
              <p className="text-[11px] text-gray-400">
                Upload a signature image (transparent PNG recommended). It appears between "For [Company]" and the signatory name in all letters.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => sigInputRef.current?.click()} disabled={uploadingSig} className="btn btn-secondary btn-sm gap-1.5">
                  <Upload size={12} />{uploadingSig ? 'Uploading…' : 'Upload Signature'}
                </button>
                {cfg.signature_filename && (
                  <button onClick={deleteSignature} disabled={deletingSig} className="btn btn-sm gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 border border-red-200 dark:border-red-800">
                    <Trash2 size={12} />{deletingSig ? 'Removing…' : 'Delete'}
                  </button>
                )}
              </div>
              {cfg.signature_filename && (
                <p className="text-[11px] text-green-600 flex items-center gap-1">
                  <Check size={10} /> {cfg.signature_filename} is active
                </p>
              )}
            </div>
          </div>
          <input ref={sigInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleSigFileInput} />
        </div>

        {/* Signature position/size interactive preview */}
        <SignaturePreview cfg={cfg} sigBlobUrl={sigBlobUrl} onSigChange={set} />
      </Section>

      {/* Content & Typography */}
      <Section icon={Type} title="Content & Typography">
        <ContentTypographyPreview cfg={cfg} onChange={set} />

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Font Family</label>
            <select
              className="form-input w-full text-sm"
              value={cfg.body_font || 'Source Sans 3'}
              onChange={e => set({ body_font: e.target.value })}
            >
              <option value="Source Sans 3">Source Sans 3 (recommended)</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times-Roman">Times Roman</option>
              <option value="Courier">Courier</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Font Size</label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={8} max={16} step={0.5}
                className="form-input w-24 text-sm"
                value={+(cfg.body_font_size ?? 10.5).toFixed(1)}
                onChange={e => set({ body_font_size: parseFloat(e.target.value) || 10.5 })}
              />
              <span className="text-xs text-gray-400">pt</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => set({ body_bold: !cfg.body_bold })}
            className={`w-8 h-8 rounded-lg text-sm font-bold border transition-all ${
              cfg.body_bold
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[var(--accent)]'
            }`}
          >B</button>
          <button
            type="button"
            onClick={() => set({ body_italic: !cfg.body_italic })}
            className={`w-8 h-8 rounded-lg text-sm italic border transition-all ${
              cfg.body_italic
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[var(--accent)]'
            }`}
          >I</button>
          <div
            className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 truncate text-sm"
            style={{
              fontFamily: FONT_CSS[cfg.body_font] || FONT_CSS.Helvetica,
              fontSize: `${(cfg.body_font_size ?? 10.5) * 1.15}px`,
              fontWeight: cfg.body_bold ? 'bold' : 'normal',
              fontStyle: cfg.body_italic ? 'italic' : 'normal',
            }}
          >
            Sample body text — we are pleased to confirm your appointment.
          </div>
        </div>
      </Section>

      {/* Colors */}
      <Section icon={Palette} title="Brand Colors">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Header Color', k: 'header_color', hint: 'Top bar & decorative strip' },
            { label: 'Accent Color', k: 'accent_color', hint: 'Footer background & icons' },
          ].map(({ label, k, hint }) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cfg[k] || '#000000'}
                  onChange={e => set({ [k]: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer p-0.5 bg-white flex-shrink-0"
                />
                <div>
                  <input
                    type="text"
                    className="form-input w-28 text-sm font-mono"
                    value={cfg[k] || ''}
                    onChange={e => set({ [k]: e.target.value })}
                    placeholder="#000000"
                  />
                  <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Watermark */}
      <Section icon={Layers} title="Page Watermark">
        <p className="text-xs text-gray-400 -mt-1">A faint background image centred on every page of generated letters. Use a transparent PNG logo for best results.</p>
        <div className="flex items-start gap-5">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setWmDragOver(true); }}
            onDragLeave={() => setWmDragOver(false)}
            onDrop={handleWmDrop}
            onClick={() => !uploadingWm && wmInputRef.current?.click()}
            className={`relative w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all flex-shrink-0 ${
              wmDragOver
                ? 'border-[var(--accent)] bg-[var(--accent)]/5 scale-105'
                : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-[var(--accent)] hover:bg-[var(--accent)]/5'
            }`}
          >
            {uploadingWm ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] text-gray-400">Uploading…</span>
              </div>
            ) : wmBlobUrl ? (
              <>
                <img src={wmBlobUrl} alt="watermark" draggable={false}
                  className="w-full h-full object-contain p-2" style={{ opacity: 0.5 }} />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                  <span className="text-white text-[10px] font-semibold">Replace</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1.5 px-2 text-center">
                <Layers size={20} className="text-gray-300 dark:text-gray-600" />
                <span className="text-[10px] text-gray-400 leading-tight">Drop PNG here</span>
              </div>
            )}
          </div>
          <input ref={wmInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleWmFileInput} />

          <div className="flex-1 space-y-3">
            {cfg.watermark_filename && (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <Check size={11} /> {cfg.watermark_filename} is active
                <button onClick={deleteWatermark} disabled={deletingWm}
                  className="ml-auto flex items-center gap-1 text-red-400 hover:text-red-600 text-[11px]">
                  <Trash2 size={11} />{deletingWm ? 'Removing…' : 'Remove'}
                </button>
              </div>
            )}

            {/* Opacity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Opacity</label>
                <span className="text-xs font-mono text-gray-500">{Math.round((cfg.watermark_opacity ?? 0.08) * 100)}%</span>
              </div>
              <input type="range" min="1" max="40" step="1"
                value={Math.round((cfg.watermark_opacity ?? 0.08) * 100)}
                onChange={e => set({ watermark_opacity: parseInt(e.target.value) / 100 })}
                className="w-full accent-[var(--accent)]" />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>1%</span><span>40%</span></div>
            </div>

            {/* Size */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Width (mm)', k: 'watermark_w_mm', min: 20, max: 200 },
                { label: 'Height (mm)', k: 'watermark_h_mm', min: 20, max: 200 },
              ].map(({ label, k, min, max }) => (
                <div key={k}>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
                  <input type="number" min={min} max={max} step="1"
                    value={+(cfg[k] ?? 120).toFixed(0)}
                    onChange={e => set({ [k]: parseFloat(e.target.value) || 120 })}
                    className="form-input w-full text-sm" />
                </div>
              ))}
            </div>

            {/* Position */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'X position (mm)', k: 'watermark_x_mm', min: 0, max: 190, hint: 'from left edge' },
                { label: 'Y position (mm)', k: 'watermark_y_mm', min: 0, max: 250, hint: 'from bottom edge' },
              ].map(({ label, k, min, max, hint }) => (
                <div key={k}>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
                  <input type="number" min={min} max={max} step="0.5"
                    value={+(cfg[k] ?? 45).toFixed(1)}
                    onChange={e => set({ [k]: parseFloat(e.target.value) })}
                    className="form-input w-full text-sm" />
                  <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live preview of watermark placement on page outline */}
        {wmBlobUrl && (
          <div className="mt-1 relative bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
            style={{ height: 140 }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative bg-white border border-gray-200 shadow-sm"
                style={{ width: 80, height: 113, borderRadius: 2 }}>
                {/* mini header */}
                <div className="absolute top-0 left-0 right-0 h-4 rounded-t" style={{ background: cfg.header_color || '#1764B4' }} />
                {/* watermark preview */}
                <img src={wmBlobUrl} alt=""
                  style={{
                    position: 'absolute',
                    left: `${((cfg.watermark_x_mm ?? 45) / 210) * 100}%`,
                    bottom: `${((cfg.watermark_y_mm ?? 88.5) / 297) * 100}%`,
                    width: `${((cfg.watermark_w_mm ?? 120) / 210) * 100}%`,
                    height: `${((cfg.watermark_h_mm ?? 120) / 297) * 100}%`,
                    opacity: cfg.watermark_opacity ?? 0.08,
                    objectFit: 'contain',
                  }}
                />
                {/* mini footer */}
                <div className="absolute bottom-0 left-0 right-0 h-3 rounded-b" style={{ background: cfg.accent_color || '#01BEB0' }} />
              </div>
            </div>
            <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-gray-400">Page preview</p>
          </div>
        )}
      </Section>

      {/* Action bar */}
      <div className="flex items-center justify-between pb-4">
        <button onClick={load} className="btn btn-secondary btn-sm gap-1.5 text-gray-500">
          <RefreshCw size={12} /> Discard Changes
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={saveAndPreview}
            disabled={saving || previewing}
            className="btn btn-sm gap-1.5 border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10"
          >
            <ZoomIn size={12} />
            {previewing ? 'Generating…' : saving ? 'Saving…' : 'Save & Preview'}
          </button>
          <button onClick={save} disabled={saving || previewing} className="btn btn-primary btn-sm gap-1.5">
            <Save size={12} />{saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* PDF Preview modal */}
      {previewBlobUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => { URL.revokeObjectURL(previewBlobUrl); setPreviewBlobUrl(null); }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: '92vw', maxWidth: 900, height: '92vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Eye size={15} className="text-[var(--accent)]" />
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Template Preview — Appointment Letter</p>
                <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Sample data</span>
              </div>
              <button
                onClick={() => { URL.revokeObjectURL(previewBlobUrl); setPreviewBlobUrl(null); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            </div>
            <iframe
              src={previewBlobUrl}
              title="Template Preview"
              className="flex-1 w-full"
              style={{ border: 'none' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function CompanyDocs({ toast }) {
  const [activeTab, setActiveTab] = useState('documents');
  const [docs, setDocs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [letterFields, setLetterFields] = useState({});
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [generateDoc, setGenerateDoc] = useState(null);
  const fileInputRef = useRef(null);
  const blobUrlRef = useRef(null);

  const [confirmDialog, setConfirmDialog] = useState(null);

  // Custom templates state
  const [customTemplates, setCustomTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);   // null=closed, false=new, obj=edit
  const [generateFromTpl, setGenerateFromTpl] = useState(null);
  const [deletingTpl, setDeletingTpl] = useState(null);

  const loadCustomTemplates = () => {
    setTemplatesLoading(true);
    api('GET', '/api/hrm/doc-templates')
      .then(setCustomTemplates)
      .catch(e => toast(e.message, 'error'))
      .finally(() => setTemplatesLoading(false));
  };

  const load = () => {
    setLoading(true);
    Promise.all([
      api('GET', '/api/hrm/company-docs'),
      api('GET', '/api/employees?all=true'),
      api('GET', '/api/hrm/letter-fields'),
    ])
      .then(([d, e, lf]) => { setDocs(d); setEmployees(e); setLetterFields(lf); })
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); loadCustomTemplates(); }, []);

  const closePreview = () => {
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    setPreview(null);
  };

  const openPreview = async (doc) => {
    setPreviewLoading(true);
    try {
      const blobUrl = await fetchPdfBlob(doc.url);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = blobUrl;
      setPreview({ doc, blobUrl });
    } catch (e) { toast(e.message, 'error'); }
    finally { setPreviewLoading(false); }
  };

  const download = async (doc) => {
    setDownloading(doc.name);
    try {
      const blobUrl = await fetchPdfBlob(doc.url);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = doc.name; a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (e) { toast(e.message, 'error'); }
    finally { setDownloading(null); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('artech_hrms_token');
      const res = await fetch('/api/hrm/company-docs/upload', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) { const err = await res.json().catch(() => ({ detail: 'Upload failed' })); throw new Error(err.detail || 'Upload failed'); }
      toast('Document uploaded successfully', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (doc) => {
    setConfirmDialog({
      title: 'Delete Document',
      message: `Delete "${docLabel(doc.name)}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        setDeleting(doc.name);
        try {
          await api('DELETE', `/api/hrm/company-docs/${encodeURIComponent(doc.name)}`);
          toast('Document deleted', 'success');
          if (preview?.doc?.name === doc.name) closePreview();
          load();
        } catch (e) { toast(e.message, 'error'); }
        finally { setDeleting(null); }
      }
    });
    return;
  };

  return (
    <div className="page-content space-y-4">
      <div className="page-head">
        <div>
          <h1 className="page-title">Company Documents</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Official letter templates — view, generate, or configure</p>
        </div>
        {activeTab === 'documents' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{docs.length} templates</span>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn btn-secondary btn-sm gap-1.5">
              <Upload size={13} />{uploading ? 'Uploading…' : 'Upload PDF'}
            </button>
          </div>
        )}
        {activeTab === 'custom' && (
          <button onClick={() => setEditingTemplate(false)} className="btn btn-primary btn-sm gap-1.5">
            <Plus size={13} /> New Template
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 pb-0">
        {[
          { id: 'documents', label: 'Documents', icon: FileText },
          { id: 'custom', label: 'Custom Templates', icon: PenLine },
          { id: 'template', label: 'Letterhead Template', icon: Settings },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
              activeTab === id
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      <input ref={fileInputRef} type="file" accept="*" className="hidden" onChange={handleUpload} />

      {/* Letterhead Template tab */}
      {activeTab === 'template' && <LetterheadEditor toast={toast} />}

      {/* Custom Templates tab */}
      {activeTab === 'custom' && (
        <>
          {templatesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : customTemplates.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mb-4">
                <PenLine size={24} className="text-[var(--accent)]" />
              </div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No custom templates yet</h3>
              <p className="text-sm text-gray-400 mb-4 max-w-sm">
                Create a template with your full letter content and <code className="text-[var(--accent)] bg-[var(--accent)]/10 px-1 rounded">{'{{variables}}'}</code> for fields that change per employee.
              </p>
              <button onClick={() => setEditingTemplate(false)} className="btn btn-primary btn-sm gap-1.5">
                <Plus size={13} /> Create First Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {customTemplates.map(tpl => (
                <div key={tpl.id} className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0 text-lg">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{tpl.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{tpl.category}</p>
                    </div>
                  </div>

                  {/* Variable badges */}
                  {tpl.variables?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tpl.variables.slice(0, 4).map(v => (
                        <span key={v.key} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-mono">
                          {`{{${v.key}}}`}
                        </span>
                      ))}
                      {tpl.variables.length > 4 && (
                        <span className="text-xs text-gray-400 px-1">+{tpl.variables.length - 4} more</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => setGenerateFromTpl(tpl)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                    >
                      <Send size={11} /> Generate
                    </button>
                    <button
                      onClick={() => setEditingTemplate(tpl)}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDialog({
                          title: 'Delete Template',
                          message: `Delete template "${tpl.name}"?`,
                          confirmLabel: 'Delete',
                          danger: true,
                          onConfirm: async () => {
                            setConfirmDialog(null);
                            setDeletingTpl(tpl.id);
                            try {
                              await api('DELETE', `/api/hrm/doc-templates/${tpl.id}`);
                              setCustomTemplates(ts => ts.filter(t => t.id !== tpl.id));
                              toast('Template deleted', 'success');
                            } catch (e) { toast(e.message, 'error'); }
                            finally { setDeletingTpl(null); }
                          }
                        });
                      }}
                      disabled={deletingTpl === tpl.id}
                      className="flex items-center px-2 py-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Template form modal */}
          {editingTemplate !== null && (
            <TemplateFormModal
              template={editingTemplate || null}
              docs={docs}
              onClose={() => setEditingTemplate(null)}
              onSave={saved => {
                setCustomTemplates(ts => {
                  const idx = ts.findIndex(t => t.id === saved.id);
                  return idx >= 0 ? ts.map(t => t.id === saved.id ? saved : t) : [saved, ...ts];
                });
                setEditingTemplate(null);
              }}
              toast={toast}
            />
          )}

          {/* Generate from template modal */}
          {generateFromTpl && (
            <GenerateFromTemplateModal
              template={generateFromTpl}
              employees={employees}
              onClose={() => setGenerateFromTpl(null)}
              toast={toast}
            />
          )}
        </>
      )}

      {activeTab === 'documents' && (<>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded-lg w-full mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="card">
          <div className="empty-state py-16">
            <FolderOpen size={36} className="mb-2 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No documents found</p>
            <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary btn-sm mt-3 gap-1.5">
              <Upload size={13} /> Upload PDF
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.map(doc => {
            const label = docLabel(doc.name);
            const ext = doc.name.split('.').pop().toUpperCase();
            const hasGenerator = !!findLetterFields(label, letterFields);
            return (
              <div key={doc.name} className="card p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                  <DocTypeIcon filename={doc.name} size={20} className="text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">{label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{ext} Document</p>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    {doc.name.toLowerCase().endsWith('.pdf') && (
                      <button
                        onClick={() => openPreview(doc)}
                        disabled={previewLoading}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        <Eye size={11} /> View
                      </button>
                    )}
                    <button
                      onClick={() => download(doc)}
                      disabled={downloading === doc.name}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg text-white transition-colors disabled:opacity-60"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <Download size={11} /> {downloading === doc.name ? '…' : 'Download'}
                    </button>
                    {hasGenerator && (
                      <button
                        onClick={() => setGenerateDoc(doc)}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <Send size={11} /> Generate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={deleting === doc.name}
                      className="ml-auto flex items-center px-2 py-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      </>)}

      {/* PDF Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closePreview}>
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: '90vw', maxWidth: 860, height: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{docLabel(preview.doc.name)}</span>
              </div>
              <div className="flex items-center gap-2">
                {findLetterFields(docLabel(preview.doc.name), letterFields) && (
                  <button
                    onClick={() => { closePreview(); setGenerateDoc(preview.doc); }}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <Send size={12} /> Generate
                  </button>
                )}
                <button
                  onClick={() => download(preview.doc)}
                  disabled={downloading === preview.doc.name}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Download size={12} /> Download
                </button>
                <button onClick={() => handleDelete(preview.doc)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 size={13} />
                </button>
                <button onClick={closePreview} className="text-gray-400 hover:text-gray-600 text-lg font-bold px-1">✕</button>
              </div>
            </div>
            <iframe src={preview.blobUrl} title={preview.doc.name} className="flex-1 w-full" style={{ border: 'none' }} />
          </div>
        </div>
      )}

      {/* Generate Letter modal */}
      {generateDoc && (
        <GenerateModal
          doc={generateDoc}
          employees={employees}
          letterFields={letterFields}
          onClose={() => setGenerateDoc(null)}
          toast={toast}
        />
      )}

      <ConfirmModal
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        danger={confirmDialog?.danger}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}
