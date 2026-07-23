import React, { useState } from 'react';
import { 
  Shield, Lock, Unlock, Zap, RefreshCw, FileText, 
  Download, Upload, Trash2, Check, AlertTriangle, Plus, Edit2, UserCheck, Layers, MapPin
} from 'lucide-react';
import SettingsPanel from './SettingsPanel';

export default function AdminPanel({
  timetable,
  settings,
  onSaveSettings,
  onImportBackup,
  onClearAll,
  onLoadPreset,
  selectedSection,
  isAdmin,
  onToggleAdmin,
  currentTheme,
  onThemeChange,
  onOpenGenerator,
  onEditClick,
  onSaveTimetable
}) {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [proxyTeacherName, setProxyTeacherName] = useState('');

  const handleAssignProxy = () => {
    if (!selectedClassId || !proxyTeacherName) {
      alert('Please select a class and enter the substitute teacher name.');
      return;
    }

    const updated = timetable.map((cls) => {
      if (cls.id === selectedClassId) {
        return {
          ...cls,
          substituteTeacher: proxyTeacherName.trim()
        };
      }
      return cls;
    });

    onSaveTimetable(updated);
    setSelectedClassId('');
    setProxyTeacherName('');
    alert('Substitute teacher assigned successfully!');
  };

  const handleClearProxy = (classId) => {
    const updated = timetable.map((cls) => {
      if (cls.id === classId) {
        const { substituteTeacher, ...rest } = cls;
        return rest;
      }
      return cls;
    });
    onSaveTimetable(updated);
  };

  const proxyClasses = timetable.filter(c => c.substituteTeacher);

  return (
    <div className="admin-panel animate-fade-in">
      {/* Admin Authorization Status Banner */}
      <div className="admin-status-banner glass" style={{ borderLeft: isAdmin ? '4px solid var(--success)' : '4px solid var(--warning)' }}>
        <div className="banner-left">
          <div className="banner-icon-bg">
            <Shield size={22} style={{ color: isAdmin ? 'var(--success)' : 'var(--warning)' }} />
          </div>
          <div>
            <h3>Admin Management Portal</h3>
            <p>
              {isAdmin 
                ? 'Admin Mode Active: Full permission to auto-generate timetables, assign substitute teachers, and modify lectures.' 
                : 'Locked View Mode: Click Unlock Admin Mode to perform administrative changes.'}
            </p>
          </div>
        </div>

        <div>
          {isAdmin ? (
            <button className="btn btn-danger btn-sm" onClick={() => onToggleAdmin(false)}>
              <Lock size={14} /> Lock Admin Portal
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => onToggleAdmin(true)}>
              <Unlock size={14} /> Enter Passcode to Unlock
            </button>
          )}
        </div>
      </div>

      {isAdmin ? (
        <div className="admin-grid">
          {/* Card 1: AI Automatic Timetable Generator */}
          <div className="admin-card glass card-featured">
            <div className="admin-card-header">
              <Zap size={22} style={{ color: 'var(--primary)' }} />
              <div>
                <h4>AI Automatic Timetable Generator</h4>
                <p>Auto-generate 100% conflict-free schedules given teacher workload hours</p>
              </div>
            </div>

            <div className="admin-card-body">
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Specify teacher names, weekly hours/lectures, subjects, and available rooms. Our constraint algorithm will calculate an optimized, non-overlapping schedule across Sec A, B & C in 1-click.
              </p>
              <button className="btn btn-primary" onClick={onOpenGenerator}>
                <Zap size={16} /> Launch Timetable Auto-Generator
              </button>
            </div>
          </div>

          {/* Card 2: Substitute / Replacement Teacher Manager */}
          <div className="admin-card glass">
            <div className="admin-card-header">
              <RefreshCw size={22} style={{ color: 'var(--secondary)' }} />
              <div>
                <h4>Substitute & Proxy Duty Management</h4>
                <p>Assign replacement teachers when a faculty member is absent</p>
              </div>
            </div>

            <div className="admin-card-body">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Select Scheduled Lecture:</label>
                <select 
                  className="form-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">-- Choose a class to assign proxy --</option>
                  {timetable.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.day} ({cls.startTime}) - {cls.name} [Sec {cls.section || 'A'}] (Orig: {cls.teacher})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Substitute / Proxy Teacher Name:</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Mr. Chirag Jain" 
                  value={proxyTeacherName}
                  onChange={(e) => setProxyTeacherName(e.target.value)}
                />
              </div>

              <button className="btn btn-secondary btn-sm" onClick={handleAssignProxy} style={{ width: '100%' }}>
                <RefreshCw size={14} /> Save Substitute Assignment
              </button>

              {/* Active Proxy List */}
              {proxyClasses.length > 0 && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                  <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Active Proxy Assignments ({proxyClasses.length}):
                  </h5>
                  <div className="proxy-list">
                    {proxyClasses.map((cls) => (
                      <div key={cls.id} className="proxy-item-chip">
                        <div>
                          <strong>{cls.substituteTeacher}</strong> (Proxy for {cls.teacher})
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {cls.day} {cls.startTime} • {cls.name} [Sec {cls.section || 'A'}]
                          </div>
                        </div>
                        <button className="icon-btn-danger" onClick={() => handleClearProxy(cls.id)} title="Remove Proxy">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Settings & Maintenance Section */}
          <div style={{ gridColumn: '1 / -1' }}>
            <SettingsPanel 
              timetable={timetable}
              settings={settings}
              onSaveSettings={onSaveSettings}
              onImportBackup={onImportBackup}
              onClearAll={onClearAll}
              onLoadPreset={onLoadPreset}
              selectedSection={selectedSection}
              isAdmin={isAdmin}
              onToggleAdmin={onToggleAdmin}
              currentTheme={currentTheme}
              onThemeChange={onThemeChange}
            />
          </div>
        </div>
      ) : (
        <div className="admin-locked-view glass">
          <Lock size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>Admin Features are Locked</h3>
          <p>Please click the button above to enter the passcode and unlock Administrative features.</p>
        </div>
      )}
    </div>
  );
}
