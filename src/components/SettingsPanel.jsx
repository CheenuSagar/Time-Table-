import React, { useState } from 'react';
import { 
  Bell, Volume2, VolumeX, Download, Share2, Trash2, 
  Upload, FileText, Check, AlertTriangle, ShieldCheck, Shield, Lock, Unlock, Clock
} from 'lucide-react';
import { generateShareUrl, exportBackup } from '../utils/storageHelper';
import { downloadICSFile } from '../utils/icsHelper';

// Synthesizes a beautiful digital double-chime note using Web Audio API
export function playSyntheticChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First chime note (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.4);
    
    // Second chime note (A5, slightly offset and higher pitch)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.error('Audio synthesis failed:', e);
  }
}

export default function SettingsPanel({ 
  timetable, 
  settings, 
  onSaveSettings, 
  onImportBackup, 
  onClearAll,
  onLoadPreset,
  selectedSection,
  isAdmin,
  onToggleAdmin
}) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) return;
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      onSaveSettings({
        ...settings,
        notificationsEnabled: permission === 'granted'
      });
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleCopyLink = () => {
    const url = generateShareUrl(timetable);
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      })
      .catch((err) => console.error('Failed to copy share link:', err));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) {
          if (confirm(`Do you want to import ${data.length} lectures? This will merge with your current timetable.`)) {
            onImportBackup(data);
            e.target.value = '';
          }
        } else {
          alert('Invalid backup file format. Expected a timetable JSON array.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleSoundToggle = () => {
    onSaveSettings({
      ...settings,
      soundEnabled: !settings.soundEnabled
    });
  };

  const handlePreTimeChange = (e) => {
    onSaveSettings({
      ...settings,
      preTime: Number(e.target.value)
    });
  };

  const handleTimeFormatToggle = () => {
    onSaveSettings({
      ...settings,
      timeFormat12h: !(settings.timeFormat12h !== false)
    });
  };

  return (
    <div className="settings-grid animate-fade-in">
      {/* Admin Authorization Card */}
      <div className="settings-card glass" style={{ border: isAdmin ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-light)' }}>
        <h3 className="settings-title">
          <Shield size={18} className="title-icon" style={{ color: isAdmin ? 'var(--success)' : 'var(--primary)' }} /> Admin Authorization
        </h3>
        
        <div className="settings-body">
          <div className="setting-row">
            <div className="setting-info">
              <h4>Authorization Status</h4>
              <p>
                {isAdmin 
                  ? 'Admin Mode is Active. You have full permission to add, edit, or delete lectures and load presets.' 
                  : 'Regular View Mode. Modification features are locked. Enter passcode to manage the schedule.'}
              </p>
            </div>
            
            {isAdmin ? (
              <div className="setting-actions flex-gap">
                <span className="badge badge-success" style={{ marginRight: '8px' }}>
                  <Unlock size={12} /> Admin Mode Active
                </span>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    onToggleAdmin(false);
                    setAdminPasswordInput('');
                    setAdminError('');
                  }}
                >
                  <Lock size={14} /> Lock Admin
                </button>
              </div>
            ) : (
              <div className="setting-actions flex-gap" style={{ alignItems: 'stretch', flexDirection: 'column', width: '100%', maxWidth: '320px', minWidth: '260px' }}>
                {adminError && <div className="form-error" style={{ width: '100%', margin: '0 0 8px 0', padding: '6px', fontSize: '0.8rem', color: '#f87171' }}>{adminError}</div>}
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Enter admin passcode..."
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.88rem' }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const success = await onToggleAdmin(true, adminPasswordInput);
                        if (success) {
                          setAdminError('');
                        } else {
                          setAdminError('Incorrect passcode!');
                        }
                      }
                    }}
                  />
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      const success = await onToggleAdmin(true, adminPasswordInput);
                      if (success) {
                        setAdminError('');
                      } else {
                        setAdminError('Incorrect passcode!');
                      }
                    }}
                    style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                  >
                    Unlock
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications and Alerts Card */}
      <div className="settings-card glass">
        <h3 className="settings-title">
          <Bell size={18} className="title-icon" /> Notification Settings
        </h3>
        
        <div className="settings-body">
          {/* Native Browser Notification Request */}
          <div className="setting-row">
            <div className="setting-info">
              <h4>Browser Push Notifications</h4>
              <p>Triggers a desktop alert when the app is active in your browser.</p>
            </div>
            
            {notificationStatus === 'unsupported' ? (
              <span className="badge badge-unsupported">Not Supported</span>
            ) : notificationStatus === 'granted' ? (
              <span className="badge badge-success">
                <ShieldCheck size={14} /> Active
              </span>
            ) : (
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={handleRequestPermission}
              >
                Enable Notifications
              </button>
            )}
          </div>

          {/* Sound Alarm Toggle */}
          <div className="setting-row">
            <div className="setting-info">
              <h4>Chime Sound Alerts</h4>
              <p>Plays a clean, synthesizer chime before class starts.</p>
            </div>
            <div className="setting-actions">
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={playSyntheticChime}
                style={{ marginRight: '8px' }}
              >
                Test Chime
              </button>
              <button 
                className={`btn btn-sm ${settings.soundEnabled ? 'btn-primary' : 'btn-secondary'}`}
                onClick={handleSoundToggle}
              >
                {settings.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                {settings.soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Pre-alert Duration setting */}
          <div className="setting-row">
            <div className="setting-info">
              <h4>Alert Trigger Time</h4>
              <p>How many minutes before the lecture start time should alerts sound?</p>
            </div>
            <select 
              className="form-select select-duration" 
              value={settings.preTime}
              onChange={handlePreTimeChange}
            >
              <option value={2}>2 minutes before</option>
              <option value={5}>5 minutes before</option>
              <option value={10}>10 minutes before</option>
              <option value={15}>15 minutes before</option>
            </select>
          </div>

          {/* Time Format setting */}
          <div className="setting-row">
            <div className="setting-info">
              <h4>12-Hour Time Format</h4>
              <p>Display all class schedules in 12-hour AM/PM format.</p>
            </div>
            <div className="setting-actions">
              <button 
                className={`btn btn-sm ${settings.timeFormat12h !== false ? 'btn-primary' : 'btn-secondary'}`}
                onClick={handleTimeFormatToggle}
              >
                <Clock size={14} />
                {settings.timeFormat12h !== false ? '12-Hour (AM/PM)' : '24-Hour'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sync and Share (Public Use) Card */}
      <div className="settings-card glass">
        <h3 className="settings-title">
          <Share2 size={18} className="title-icon" /> Calendar Sync & Sharing
        </h3>
        
        <div className="settings-body">
          {/* ICS Download */}
          <div className="setting-row">
            <div className="setting-info">
              <h4>1-Click Calendar Export (.ics)</h4>
              <p>
                <strong>Recommended for Mobile (iOS & Android)</strong>. Export iCalendar file with 
                weekly recurring lectures for Google Calendar, Apple Calendar, or Outlook.
              </p>
            </div>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => downloadICSFile(timetable)}
              disabled={timetable.length === 0}
            >
              <Download size={15} /> Export Calendar (.ics)
            </button>
          </div>

          {/* Share Link Generator */}
          <div className="setting-row">
            <div className="setting-info">
              <h4>Shareable Schedule Link</h4>
              <p>
                Generates a encoded URL of your timetable so classmates can import your schedule in 1-click.
              </p>
            </div>
            <button 
              className={`btn btn-sm ${copySuccess ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleCopyLink}
              disabled={timetable.length === 0}
            >
              {copySuccess ? <Check size={15} /> : <Share2 size={15} />}
              {copySuccess ? 'Copied Link!' : 'Copy Share Link'}
            </button>
          </div>
        </div>
      </div>

      {/* Backups & Maintenance */}
      <div className="settings-card glass">
        <h3 className="settings-title">
          <FileText size={18} className="title-icon" /> Data Backups & Presets
        </h3>
        
        <div className="settings-body">
          {/* Export JSON and Import JSON */}
          <div className="setting-row">
            <div className="setting-info">
              <h4>Timetable Backups</h4>
              <p>Export your scheduled classes as a JSON file, or restore from a previous JSON backup.</p>
            </div>
            <div className="setting-actions flex-gap">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => exportBackup(timetable)}
                disabled={timetable.length === 0}
              >
                <Download size={14} /> Export JSON
              </button>
              
              <label className="btn btn-secondary btn-sm file-input-label">
                <Upload size={14} /> Import JSON
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden-file-input" 
                  onChange={handleFileChange} 
                />
              </label>
            </div>
          </div>

          {/* Load Preset Schedule */}
          <div className="setting-row">
            <div className="setting-info">
              <h4>Load Department Presets</h4>
              <p>Reset your schedule to official MCA III section timetable presets.</p>
            </div>
            <div className="setting-actions flex-gap">
              <button 
                className={`btn ${selectedSection === 'A' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => {
                  if (confirm('Load MCA III-A timetable preset? This will replace your current schedule.')) {
                    onLoadPreset('A');
                  }
                }}
              >
                Section III-A
              </button>
              <button 
                className={`btn ${selectedSection === 'B' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => {
                  if (confirm('Load MCA III-B timetable preset? This will replace your current schedule.')) {
                    onLoadPreset('B');
                  }
                }}
              >
                Section III-B
              </button>
              <button 
                className={`btn ${selectedSection === 'C' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => {
                  if (confirm('Load MCA III-C timetable preset? This will replace your current schedule.')) {
                    onLoadPreset('C');
                  }
                }}
              >
                Section III-C
              </button>
            </div>
          </div>

          {/* Clear Timetable */}
          <div className="setting-row border-danger-top">
            <div className="setting-info">
              <h4 className="text-danger-title">Danger Zone: Reset All</h4>
              <p>Remove all lectures and clear local storage. Irreversible action.</p>
            </div>
            <button 
              className="btn btn-danger btn-sm" 
              onClick={() => {
                if (confirm('Are you sure you want to clear all scheduled lectures?')) {
                  onClearAll();
                }
              }}
              disabled={timetable.length === 0}
            >
              <Trash2 size={14} /> Clear All Classes
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        .settings-card {
          padding: 26px;
        }
        .settings-title {
          font-size: 1.15rem;
          color: white;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 14px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .title-icon {
          color: var(--primary);
        }
        .settings-body {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .setting-info {
          flex: 1;
          min-width: 260px;
        }
        .setting-info h4 {
          font-size: 1.02rem;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }
        .setting-info p {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.45;
        }
        .setting-actions {
          display: flex;
          align-items: center;
        }
        .flex-gap {
          gap: 10px;
        }
        .badge-unsupported {
          background: rgba(239, 68, 68, 0.12);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .badge-success {
          background: rgba(16, 185, 129, 0.12);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .select-duration {
          width: auto;
          min-width: 170px;
        }
        .hidden-file-input {
          display: none;
        }
        .file-input-label {
          margin-bottom: 0;
        }
        .border-danger-top {
          border-top: 1px dashed rgba(239, 68, 68, 0.25);
          padding-top: 20px;
          margin-top: 10px;
        }
        .text-danger-title {
          color: #f87171 !important;
        }
      `}</style>
    </div>
  );
}
