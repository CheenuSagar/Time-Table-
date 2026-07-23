import React, { useState } from 'react';
import { Zap, X, Plus, Trash2, Check, RefreshCw, Layers, MapPin, Sparkles, BookOpen } from 'lucide-react';
import { generateConflictFreeTimetable, DEFAULT_TEACHER_INPUTS } from '../utils/timetableGenerator';

export default function AutoGeneratorModal({ isOpen, onClose, onApplyTimetable }) {
  const [inputs, setInputs] = useState(DEFAULT_TEACHER_INPUTS);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [activePreviewSection, setActivePreviewSection] = useState('A');

  if (!isOpen) return null;

  const handleAddRow = () => {
    setInputs([
      ...inputs,
      {
        id: `custom-${Date.now()}`,
        teacher: '',
        subject: '',
        section: 'A',
        hoursPerWeek: 3,
        location: 'AB-207',
        color: '#4f46e5'
      }
    ]);
  };

  const handleRemoveRow = (id) => {
    setInputs(inputs.filter((i) => i.id !== id));
  };

  const handleChangeRow = (id, field, value) => {
    setInputs(
      inputs.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const handleResetToDefaults = () => {
    setInputs(DEFAULT_TEACHER_INPUTS);
    setGeneratedResult(null);
  };

  const handleRunGenerator = () => {
    const result = generateConflictFreeTimetable(inputs);
    setGeneratedResult(result);
  };

  const handlePublish = () => {
    if (!generatedResult || generatedResult.length === 0) return;
    onApplyTimetable(generatedResult);
    onClose();
  };

  const filteredPreview = generatedResult
    ? generatedResult.filter((c) => c.section === activePreviewSection)
    : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container generator-modal-container glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Zap size={22} style={{ color: 'var(--primary)' }} />
            <div>
              <h3 className="modal-title">AI Algorithmic Timetable Generator</h3>
              <p className="modal-subtitle">Auto-generate 100% conflict-free schedule from teacher workloads</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="modal-body generator-modal-body">
          {/* Top Control Action Bar */}
          <div className="generator-actions-bar">
            <button className="btn btn-secondary btn-sm" onClick={handleResetToDefaults}>
              <RefreshCw size={14} /> Reset Default MCA Workloads
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleAddRow}>
              <Plus size={14} /> Add Teacher Requirement
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleRunGenerator}>
              <Zap size={14} /> Generate Schedule Now
            </button>
          </div>

          {/* Teacher Workload Definition Table */}
          <div className="generator-table-container">
            <table className="generator-table">
              <thead>
                <tr>
                  <th>Teacher Name</th>
                  <th>Subject Title & Code</th>
                  <th>Sec</th>
                  <th>Hours/Wk</th>
                  <th>Room</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {inputs.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input 
                        type="text" 
                        className="form-input form-input-sm" 
                        value={row.teacher} 
                        placeholder="Teacher name..."
                        onChange={(e) => handleChangeRow(row.id, 'teacher', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="form-input form-input-sm" 
                        value={row.subject} 
                        placeholder="Subject name..."
                        onChange={(e) => handleChangeRow(row.id, 'subject', e.target.value)}
                      />
                    </td>
                    <td style={{ width: '80px' }}>
                      <select 
                        className="form-select form-select-sm" 
                        value={row.section}
                        onChange={(e) => handleChangeRow(row.id, 'section', e.target.value)}
                      >
                        <option value="A">Sec A</option>
                        <option value="B">Sec B</option>
                        <option value="C">Sec C</option>
                      </select>
                    </td>
                    <td style={{ width: '80px' }}>
                      <input 
                        type="number" 
                        min="1"
                        max="10"
                        className="form-input form-input-sm" 
                        value={row.hoursPerWeek} 
                        onChange={(e) => handleChangeRow(row.id, 'hoursPerWeek', e.target.value)}
                      />
                    </td>
                    <td style={{ width: '100px' }}>
                      <input 
                        type="text" 
                        className="form-input form-input-sm" 
                        value={row.location} 
                        placeholder="Room..."
                        onChange={(e) => handleChangeRow(row.id, 'location', e.target.value)}
                      />
                    </td>
                    <td style={{ width: '50px', textAlign: 'center' }}>
                      <button className="icon-btn-danger" onClick={() => handleRemoveRow(row.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Generated Result Preview */}
          {generatedResult && (
            <div className="generator-preview-section">
              <div className="preview-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} style={{ color: 'var(--success)' }} />
                  <h4>Generated Conflict-Free Timetable ({generatedResult.length} Total Slots)</h4>
                </div>

                <div className="preview-section-pills">
                  {['A', 'B', 'C'].map((sec) => (
                    <button 
                      key={sec}
                      className={`preview-pill ${activePreviewSection === sec ? 'active' : ''}`}
                      onClick={() => setActivePreviewSection(sec)}
                    >
                      Section {sec}
                    </button>
                  ))}
                </div>
              </div>

              <div className="preview-list-container">
                {filteredPreview.map((cls) => (
                  <div key={cls.id} className="preview-class-chip" style={{ borderLeftColor: cls.color || 'var(--primary)' }}>
                    <div className="preview-chip-time">{cls.day} ({cls.startTime} - {cls.endTime})</div>
                    <div className="preview-chip-title">{cls.name}</div>
                    <div className="preview-chip-sub">
                      <span>{cls.teacher || 'No Teacher'}</span> • <span>Room {cls.location || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {generatedResult && (
            <button className="btn btn-primary" onClick={handlePublish}>
              <Check size={16} /> Publish & Save Timetable to App
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
