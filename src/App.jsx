import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, Settings as SettingsIcon, Bell, Plus, Check, AlertCircle, Share2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import TimetableGrid from './components/TimetableGrid';
import SettingsPanel, { playSyntheticChime } from './components/SettingsPanel';
import ClassModal from './components/ClassModal';
import { 
  loadTimetable, saveTimetable, loadSettings, saveSettings, parseShareUrl, 
  DEFAULT_TIMETABLE_A, DEFAULT_TIMETABLE_B, DEFAULT_TIMETABLE_C 
} from './utils/storageHelper';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export default function App() {
  const [timetable, setTimetable] = useState([]);
  const [settings, setSettings] = useState({
    soundEnabled: true,
    notificationsEnabled: false,
    preTime: 5,
    alarmSound: 'chime'
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return localStorage.getItem('lecalert_is_admin') === 'true';
    } catch (e) {
      return false;
    }
  });
  
  // Share link import modal state
  const [sharedClasses, setSharedClasses] = useState(null);
  
  // Tracks already notified classes to prevent duplicate triggers in the same minute
  // Format: { 'classId': 'YYYY-MM-DD-HH:MM' }
  const notifiedRef = useRef({});

  // 1. Initial Load and Hash Sync
  useEffect(() => {
    // Load local storage data
    const localTable = loadTimetable();
    setTimetable(localTable);
    
    const localSettings = loadSettings();
    setSettings(localSettings);

    // Check for share link in URL hash
    const hash = window.location.hash;
    if (hash.includes('share=')) {
      const imported = parseShareUrl(hash);
      if (imported && imported.length > 0) {
        setSharedClasses(imported);
      }
      // Clear hash so it doesn't prompt again on refresh
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // 2. Alarm Trigger Interval Loop (runs every second)
  useEffect(() => {
    const checkSchedule = () => {
      if (timetable.length === 0) return;
      
      const now = new Date();
      const currentDay = DAYS[now.getDay()];
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayDateString = `${year}-${month}-${day}`;
      
      timetable.forEach((cls) => {
        if (cls.day !== currentDay) return;
        
        const startMins = timeToMinutes(cls.startTime);
        // Target trigger time is startMins minus the preTime
        const triggerMins = startMins - settings.preTime;
        
        if (currentMinutes === triggerMins) {
          const uniqueTriggerId = `${cls.id}-${todayDateString}-${currentMinutes}`;
          
          // Check if we already notified for this exact minute today
          if (notifiedRef.current[cls.id] === uniqueTriggerId) return;
          
          // Set as notified first to prevent race condition
          notifiedRef.current[cls.id] = uniqueTriggerId;
          
          // 1. Trigger Audio Alarm
          if (settings.soundEnabled) {
            playSyntheticChime();
            // Optional second chime after a short delay
            setTimeout(playSyntheticChime, 1500);
          }
          
          // 2. Trigger System Notification
          if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`Class Starting Soon!`, {
                body: `${cls.name} starts in ${settings.preTime} minutes ${cls.location ? `at ${cls.location}` : ''}.`,
                icon: '/favicon.ico',
                tag: cls.id
              });
            } catch (err) {
              console.error('Failed to dispatch notification:', err);
            }
          } else {
            // Fallback in-app alert
            alert(`Upcoming Lecture: "${cls.name}" starts in ${settings.preTime} minutes!`);
          }
        }
      });
    };

    // Run check once, then set interval
    checkSchedule();
    const interval = setInterval(checkSchedule, 1000);
    return () => clearInterval(interval);
  }, [timetable, settings]);

  // Save changes helper
  const handleSaveTimetable = (newTable) => {
    setTimetable(newTable);
    saveTimetable(newTable);
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Admin Verification Helper
  const verifyAdminAction = async (callback) => {
    if (isAdmin) {
      if (callback) callback();
      return true;
    }
    const enteredPassword = prompt("Please enter the Admin passcode to perform this action:");
    if (enteredPassword === null) return false;
    
    try {
      const msgBuffer = new TextEncoder().encode(enteredPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const targetHash = "2071810017735617cc09af7c114a19863f8e1ca8ae82bc4951a6d5e337e88aa6";
      
      if (hashHex === targetHash) {
        setIsAdmin(true);
        try {
          localStorage.setItem('lecalert_is_admin', 'true');
        } catch (e) {}
        if (callback) callback();
        return true;
      } else {
        alert("Incorrect passcode! Action aborted.");
      }
    } catch (e) {
      console.error("Crypto hashing failed:", e);
      alert("Verification system error.");
    }
    return false;
  };

  const handleToggleAdmin = async (status, password = "") => {
    if (status) {
      try {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const targetHash = "2071810017735617cc09af7c114a19863f8e1ca8ae82bc4951a6d5e337e88aa6";
        
        if (hashHex === targetHash) {
          setIsAdmin(true);
          try {
            localStorage.setItem('lecalert_is_admin', 'true');
          } catch (e) {}
          return true;
        } else {
          alert("Incorrect passcode!");
          return false;
        }
      } catch (e) {
        console.error("Crypto hashing failed:", e);
        alert("Verification system error.");
        return false;
      }
    } else {
      setIsAdmin(false);
      try {
        localStorage.setItem('lecalert_is_admin', 'false');
      } catch (e) {}
      return true;
    }
  };

  // Add / Edit / Delete Handlers
  const handleSaveClass = async (classData) => {
    await verifyAdminAction(() => {
      if (editingClass) {
        // Update
        const updated = timetable.map((c) => (c.id === editingClass.id ? classData : c));
        handleSaveTimetable(updated);
      } else {
        // Create new
        handleSaveTimetable([...timetable, classData]);
      }
      setEditingClass(null);
    });
  };

  const handleDeleteClass = async (id) => {
    await verifyAdminAction(() => {
      const filtered = timetable.filter((c) => c.id !== id);
      handleSaveTimetable(filtered);
      setEditingClass(null);
    });
  };

  const handleLoadSectionPreset = (sectionCode) => {
    let preset = [];
    if (sectionCode === 'A') preset = DEFAULT_TIMETABLE_A;
    else if (sectionCode === 'B') preset = DEFAULT_TIMETABLE_B;
    else if (sectionCode === 'C') preset = DEFAULT_TIMETABLE_C;
    handleSaveTimetable(preset);
  };


  // Import shared timetable options
  const handleAcceptImport = (merge) => {
    if (!sharedClasses) return;
    
    if (merge) {
      // Merge: avoid duplicates by ID
      const existingIds = new Set(timetable.map(c => c.id));
      const filteredShared = sharedClasses.filter(c => !existingIds.has(c.id));
      
      // If there are ID overlaps, regenerate their IDs
      const safeShared = filteredShared.map(c => ({
        ...c,
        id: timetable.some(t => t.id === c.id) ? Date.now().toString() + Math.random().toString(36).substr(2, 5) : c.id
      }));

      handleSaveTimetable([...timetable, ...safeShared]);
    } else {
      // Replace
      handleSaveTimetable(sharedClasses);
    }
    setSharedClasses(null);
  };

  return (
    <div className="app-layout">
      {/* Navigation Header */}
      <header className="app-header glass">
        <div className="brand-logo" onClick={() => setActiveTab('dashboard')}>
          <div className="logo-icon">
            <Bell size={20} className="bell-glow" />
          </div>
          <div className="logo-text">
            <span>Lec</span>Alert
          </div>
        </div>

        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Clock size={16} /> Dashboard
          </button>
          <button 
            className={`nav-tab ${activeTab === 'timetable' ? 'active' : ''}`}
            onClick={() => setActiveTab('timetable')}
          >
            <Calendar size={16} /> Weekly Schedule
          </button>
          <button 
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={16} /> Settings
          </button>
        </nav>

        <button 
          className="btn btn-primary btn-sm add-quick-btn"
          onClick={async () => {
            await verifyAdminAction(() => {
              setEditingClass(null);
              setIsModalOpen(true);
            });
          }}
        >
          <Plus size={16} /> Quick Add
        </button>
      </header>

      {/* Main Panel Content */}
      <main className="app-main-content">
        {activeTab === 'dashboard' && (
          <Dashboard 
            timetable={timetable} 
            settings={settings}
            onAddClick={async () => {
              await verifyAdminAction(() => {
                setEditingClass(null);
                setIsModalOpen(true);
              });
            }}
            onEditClick={async (cls) => {
              await verifyAdminAction(() => {
                setEditingClass(cls);
                setIsModalOpen(true);
              });
            }}
            onLoadPreset={handleLoadSectionPreset}
          />
        )}
        {activeTab === 'timetable' && (
          <TimetableGrid 
            timetable={timetable} 
            settings={settings}
            onAddClick={async () => {
              await verifyAdminAction(() => {
                setEditingClass(null);
                setIsModalOpen(true);
              });
            }}
            onEditClick={async (cls) => {
              await verifyAdminAction(() => {
                setEditingClass(cls);
                setIsModalOpen(true);
              });
            }}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsPanel 
            timetable={timetable} 
            settings={settings} 
            onSaveSettings={handleSaveSettings}
            onImportBackup={async (imported) => {
              await verifyAdminAction(() => {
                handleSaveTimetable([...timetable, ...imported]);
              });
            }}
            onClearAll={async () => {
              await verifyAdminAction(() => {
                handleSaveTimetable([]);
              });
            }}
            onLoadPreset={handleLoadSectionPreset}
            isAdmin={isAdmin}
            onToggleAdmin={handleToggleAdmin}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="page-footer">
        <p>© 2026 LecAlert • Build for public use • Synchronize calendar for 100% notification reliability</p>
      </footer>

      {/* Add / Edit Class Modal */}
      <ClassModal 
        isOpen={isModalOpen || !!editingClass} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingClass(null);
        }}
        onSave={handleSaveClass}
        onDelete={handleDeleteClass}
        editingClass={editingClass}
      />

      {/* Shared Timetable Import Dialog */}
      {sharedClasses && (
        <div className="modal-overlay">
          <div className="modal-content glass animate-fade-in text-center">
            <div className="import-prompt-icon">
              <Share2 size={36} />
            </div>
            <h2>Import Timetable Schedule?</h2>
            <p className="prompt-desc">
              We detected a shared timetable link containing <strong>{sharedClasses.length} lectures</strong>. 
              Would you like to merge these lectures into your current schedule, or replace your timetable entirely?
            </p>
            <div className="prompt-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setSharedClasses(null)}
              >
                Discard
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => handleAcceptImport(true)}
              >
                Merge with Mine
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleAcceptImport(false)}
              >
                Replace Entirely
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .app-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 16px;
          gap: 24px;
        }
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 24px;
          border-radius: var(--radius-lg);
          position: sticky;
          top: 16px;
          z-index: 100;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bell-glow {
          color: white;
          animation: ring 4s infinite ease-in-out;
        }
        @keyframes ring {
          0%, 80%, 100% { transform: rotate(0); }
          85% { transform: rotate(15deg); }
          90% { transform: rotate(-15deg); }
          95% { transform: rotate(10deg); }
        }
        .logo-text {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.3rem;
          color: white;
          letter-spacing: -0.02em;
        }
        .logo-text span {
          color: var(--primary);
        }
        .nav-tabs {
          display: flex;
          gap: 8px;
        }
        .nav-tab {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-tab:hover {
          color: white;
          background: rgba(255, 255, 255, 0.04);
        }
        .nav-tab.active {
          color: white;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
        }
        .app-main-content {
          flex: 1;
        }
        .page-footer {
          margin-top: auto;
          text-align: center;
          padding: 24px 0 10px 0;
          font-size: 0.8rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border-light);
        }
        
        /* Shared Import styles */
        .text-center {
          text-align: center;
        }
        .import-prompt-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.15);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px auto;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .prompt-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 10px 0 24px 0;
        }
        .prompt-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .app-header {
            flex-direction: column;
            gap: 14px;
            padding: 16px;
            top: 0;
            border-radius: 0 0 var(--radius-lg) var(--radius-lg);
            margin: -20px -16px 0 -16px;
          }
          .nav-tabs {
            width: 100%;
            justify-content: space-around;
          }
          .nav-tab {
            padding: 8px 10px;
            font-size: 0.8rem;
          }
          .add-quick-btn {
            display: none; /* Hide quick add on mobile header since page grids have it */
          }
        }
      `}</style>
    </div>
  );
}
