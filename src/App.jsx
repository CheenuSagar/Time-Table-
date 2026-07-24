import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, Settings as SettingsIcon, Bell, Plus, Check, AlertCircle, Share2, CalendarDays, Menu, X, Coffee, Zap, Layers, Palette, ChevronDown, UserCheck, Shield, GraduationCap } from 'lucide-react';
import StudentPanel from './components/StudentPanel';
import TeacherPanel from './components/TeacherPanel';
import AdminPanel from './components/AdminPanel';
import AutoGeneratorModal from './components/AutoGeneratorModal';
import Dashboard from './components/Dashboard';
import TimetableGrid from './components/TimetableGrid';
import AcademicCalendar from './components/AcademicCalendar';
import SettingsPanel, { playSyntheticChime, ALL_THEMES } from './components/SettingsPanel';
import ClassModal from './components/ClassModal';
import FeedbackModal from './components/FeedbackModal';
import { MessageSquare } from 'lucide-react';
import { 
  loadTimetable, saveTimetable, loadSettings, saveSettings, parseShareUrl, 
  loadAcademicCalendar, saveAcademicCalendar,
  DEFAULT_TIMETABLE_A, DEFAULT_TIMETABLE_B, DEFAULT_TIMETABLE_C 
} from './utils/storageHelper';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export default function App() {
  const [timetable, setTimetable] = useState([]);
  const [selectedSection, setSelectedSection] = useState(() => {
    try {
      const saved = localStorage.getItem('lecalert_selected_section');
      if (saved) return saved;
      const hasTimetable = localStorage.getItem('lecalert_timetable');
      if (!hasTimetable) {
        return 'B'; // default
      }
      return '';
    } catch (e) {
      return '';
    }
  });
  const [settings, setSettings] = useState({
    soundEnabled: true,
    notificationsEnabled: false,
    preTime: 5,
    alarmSound: 'chime'
  });
  const [academicEvents, setAcademicEvents] = useState(() => loadAcademicCalendar());
  const [activeTab, setActiveTab] = useState('student');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return localStorage.getItem('lecalert_is_admin') === 'true';
    } catch (e) {
      return false;
    }
  });
  
  // Theme state: 'default', 'vokka', 'coffee'
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('lecalert_theme') || 'default';
    } catch (e) {
      return 'default';
    }
  });

  // Mobile menu, Weekly Quick Popup & Header Theme Dropdown state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWeeklyPopupOpen, setIsWeeklyPopupOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('lecalert_theme', theme);
    } catch (e) {}
  }, [theme]);

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
          
          const subInfo = cls.substituteTeacher ? ` (Substitute Teacher: ${cls.substituteTeacher})` : '';
          
          // 2. Trigger System Notification
          if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`Class Starting Soon!`, {
                body: `${cls.name} starts in ${settings.preTime} minutes ${cls.location ? `at ${cls.location}` : ''}.${subInfo}`,
                icon: '/favicon.ico',
                tag: cls.id
              });
            } catch (err) {
              console.error('Failed to dispatch notification:', err);
            }
          } else {
            // Fallback in-app alert
            alert(`Upcoming Lecture: "${cls.name}" starts in ${settings.preTime} minutes!${subInfo}`);
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

  const handleSaveAcademicEvents = (newEvents) => {
    setAcademicEvents(newEvents);
    saveAcademicCalendar(newEvents);
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
      let pwd = password;
      if (!pwd) {
        pwd = prompt("Please enter the Admin passcode to unlock Admin Mode:");
        if (pwd === null) return false;
      }
      try {
        const msgBuffer = new TextEncoder().encode(pwd);
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
          alert("Incorrect passcode! Admin mode remains locked.");
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
    setSelectedSection(sectionCode);
    try {
      localStorage.setItem('lecalert_selected_section', sectionCode);
    } catch (e) {}
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
            <span>MCA</span> Time Table
          </div>
        </div>

        {/* Desktop Navbar - 3 Portals Architecture */}
        <nav className="desktop-nav">
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeTab === 'student' ? 'active' : ''}`}
              onClick={() => setActiveTab('student')}
            >
              <GraduationCap size={16} /> Student Portal
            </button>
            <button 
              className={`nav-tab ${activeTab === 'teacher' ? 'active' : ''}`}
              onClick={() => setActiveTab('teacher')}
            >
              <UserCheck size={16} /> Teacher Portal
            </button>
            <button 
              className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <Shield size={16} /> Admin Portal
            </button>
            <button 
              className={`nav-tab ${activeTab === 'academic' ? 'active' : ''}`}
              onClick={() => setActiveTab('academic')}
            >
              <CalendarDays size={16} /> Academic Calendar
            </button>
            <button 
              className="nav-tab"
              onClick={() => setIsFeedbackOpen(true)}
            >
              <MessageSquare size={16} style={{ color: 'var(--secondary)' }} /> Feedback & Support
            </button>
          </div>
        </nav>

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* Quick Theme Picker Pill */}
          <div className="header-theme-picker">
            <button 
              className="header-theme-btn" 
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              title="Quick Theme Selector"
            >
              <Palette size={16} style={{ color: 'var(--primary)' }} />
              <span>Theme</span>
              <ChevronDown size={14} style={{ transform: isThemeDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {isThemeDropdownOpen && (
              <div className="header-theme-dropdown glass">
                <div style={{ padding: '6px 8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)' }}>
                  SELECT APP THEME
                </div>
                {ALL_THEMES.map((t) => {
                  const IconComp = t.icon;
                  const isActive = theme === t.id || (t.id === 'default' && theme === 'light');
                  return (
                    <div 
                      key={t.id}
                      className={`header-theme-option ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setTheme(t.id);
                        setIsThemeDropdownOpen(false);
                      }}
                    >
                      <IconComp size={14} style={{ color: t.iconColor }} />
                      <span style={{ flex: 1 }}>{t.label}</span>
                      {isActive && <Check size={14} style={{ color: 'var(--primary)' }} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Corner Hamburger Button for Mobile */}
          <button 
            className="hamburger-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <span className="mobile-drawer-title">Navigation & Settings</span>
              <button className="icon-btn" onClick={() => setIsMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="mobile-nav-list">
              <button 
                className={`mobile-nav-item ${activeTab === 'student' ? 'active' : ''}`}
                onClick={() => { setActiveTab('student'); setIsMobileMenuOpen(false); }}
              >
                <GraduationCap size={18} /> Student Portal
              </button>
              <button 
                className={`mobile-nav-item ${activeTab === 'teacher' ? 'active' : ''}`}
                onClick={() => { setActiveTab('teacher'); setIsMobileMenuOpen(false); }}
              >
                <UserCheck size={18} /> Teacher Portal
              </button>
              <button 
                className={`mobile-nav-item ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }}
              >
                <Shield size={18} /> Admin Portal
              </button>
              <button 
                className={`mobile-nav-item ${activeTab === 'academic' ? 'active' : ''}`}
                onClick={() => { setActiveTab('academic'); setIsMobileMenuOpen(false); }}
              >
                <CalendarDays size={18} /> Academic Calendar
              </button>
              <button 
                className="mobile-nav-item"
                onClick={() => { setIsFeedbackOpen(true); setIsMobileMenuOpen(false); }}
              >
                <MessageSquare size={18} style={{ color: 'var(--secondary)' }} /> Feedback & Support
              </button>
            </div>

            {/* Mobile Theme Selector */}
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Palette size={15} style={{ color: 'var(--primary)' }} /> APP THEME
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {ALL_THEMES.map((t) => {
                  const IconComp = t.icon;
                  const isActive = theme === t.id || (t.id === 'default' && theme === 'light');
                  return (
                    <button
                      key={t.id}
                      className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                      style={{ padding: '8px 10px', fontSize: '0.78rem' }}
                      onClick={() => {
                        setTheme(t.id);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <IconComp size={14} style={{ color: t.iconColor }} />
                      <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Floating Bottom Trigger for Weekly Schedule */}
      <button 
        className="floating-bottom-trigger"
        onClick={() => setIsWeeklyPopupOpen(true)}
        title="View Full Weekly Schedule"
      >
        <Calendar size={18} />
        <span>Weekly Schedule</span>
      </button>

      {/* Full Weekly Schedule Modal */}
      {isWeeklyPopupOpen && (
        <div className="weekly-popup-overlay" onClick={() => setIsWeeklyPopupOpen(false)}>
          <div className="weekly-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="weekly-popup-header">
              <div className="weekly-popup-title">
                <Calendar size={22} style={{ color: 'var(--primary)' }} />
                <span>Weekly Schedule</span>
              </div>
              <button className="modal-close-btn" onClick={() => setIsWeeklyPopupOpen(false)}>
                <X size={22} />
              </button>
            </div>
            <div className="weekly-popup-body">
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
            </div>
          </div>
        </div>
      )}

      {/* Main Panel Content - 3 Portals */}
      <main className="app-main-content">
        {(activeTab === 'student' || activeTab === 'dashboard') && (
          <StudentPanel 
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
            selectedSection={selectedSection}
          />
        )}

        {activeTab === 'teacher' && (
          <TeacherPanel 
            timetable={timetable}
            settings={settings}
            isAdmin={isAdmin}
            onSaveTimetable={handleSaveTimetable}
            onEditClick={async (cls) => {
              await verifyAdminAction(() => {
                setEditingClass(cls);
                setIsModalOpen(true);
              });
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel 
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
                setSelectedSection('');
                try {
                  localStorage.removeItem('lecalert_selected_section');
                } catch (e) {}
              });
            }}
            onLoadPreset={handleLoadSectionPreset}
            selectedSection={selectedSection}
            isAdmin={isAdmin}
            onToggleAdmin={handleToggleAdmin}
            currentTheme={theme}
            onThemeChange={setTheme}
            onOpenGenerator={() => setIsGeneratorOpen(true)}
            onEditClick={async (cls) => {
              await verifyAdminAction(() => {
                setEditingClass(cls);
                setIsModalOpen(true);
              });
            }}
            onSaveTimetable={handleSaveTimetable}
            onAddClick={async () => {
              await verifyAdminAction(() => {
                setEditingClass(null);
                setIsModalOpen(true);
              });
            }}
          />
        )}

        {activeTab === 'academic' && (
          <AcademicCalendar 
            events={academicEvents} 
            onSaveEvents={handleSaveAcademicEvents}
            isAdmin={isAdmin}
            verifyAdminAction={verifyAdminAction}
          />
        )}
      </main>

      {/* AI Automatic Timetable Generator Modal */}
      <AutoGeneratorModal 
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onApplyTimetable={(generatedTable) => {
          handleSaveTimetable(generatedTable);
          alert('Conflict-free timetable published successfully!');
        }}
      />

      {/* Footer */}
      <footer className="page-footer">
        <p>© 2026 MCA Time Table ❤️ • Build by Cheenu Sagar</p>
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

      {/* Floating Feedback Button */}
      <button 
        className="floating-feedback-btn"
        onClick={() => setIsFeedbackOpen(true)}
        title="Feedback & Problem Report"
      >
        <MessageSquare size={18} />
        <span>Feedback & Support</span>
      </button>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />

    </div>
  );
}
