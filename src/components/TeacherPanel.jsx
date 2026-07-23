import React, { useState, useEffect } from 'react';
import { UserCheck, Clock, MapPin, Calendar, Download, RefreshCw, AlertCircle, Sparkles, BookOpen, Layers, Lock, Unlock, Key, ShieldCheck, KeyRound, X, Bell, CheckCircle2 } from 'lucide-react';
import { extractUniqueTeachers, getTeacherTimetable, isActualLecture, loadTeacherPINs, saveTeacherPINs, loadTeacherNotifications, saveTeacherNotifications, addProxyNotification } from '../utils/storageHelper';
import { downloadICSFile } from '../utils/icsHelper';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export default function TeacherPanel({ timetable, settings, onEditClick, isAdmin, onSaveTimetable }) {
  const allTeachers = extractUniqueTeachers(timetable);
  const [teacherPins, setTeacherPins] = useState(() => loadTeacherPINs(allTeachers));

  const [authenticatedTeacher, setAuthenticatedTeacher] = useState(() => {
    try {
      return sessionStorage.getItem('lecalert_auth_teacher') || '';
    } catch (e) {
      return '';
    }
  });

  const [selectedTeacher, setSelectedTeacher] = useState(() => {
    try {
      return sessionStorage.getItem('lecalert_auth_teacher') || (allTeachers[0] || '');
    } catch (e) {
      return allTeachers[0] || '';
    }
  });

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Proxy duty assignment state
  const [proxyModalClass, setProxyModalClass] = useState(null);
  const [proxyTeacherTarget, setProxyTeacherTarget] = useState('');
  const [notifications, setNotifications] = useState(() => loadTeacherNotifications());

  // Change PIN modal / inline state
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changePinMsg, setChangePinMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerifyPIN = () => {
    const trimmedPin = pinInput.trim();
    if (!trimmedPin) {
      setPinError('Please enter your 4-digit Faculty PIN.');
      return;
    }

    // Find teacher whose PIN matches the entered input
    const currentPinsMap = loadTeacherPINs(allTeachers);
    const matchedTeacher = allTeachers.find(
      (t) => String(currentPinsMap[t]).trim() === trimmedPin
    );

    if (matchedTeacher) {
      setAuthenticatedTeacher(matchedTeacher);
      setSelectedTeacher(matchedTeacher);
      setPinError('');
      setPinInput('');
      try {
        sessionStorage.setItem('lecalert_auth_teacher', matchedTeacher);
      } catch (e) {}
    } else {
      setPinError('Incorrect PIN! No faculty account found for this PIN.');
    }
  };

  const handleLogoutTeacher = () => {
    setAuthenticatedTeacher('');
    setIsChangingPin(false);
    setPinInput('');
    setPinError('');
    try {
      sessionStorage.removeItem('lecalert_auth_teacher');
    } catch (e) {}
  };

  const handleSaveNewPIN = () => {
    if (!oldPin.trim() || !newPin.trim() || !confirmPin.trim()) {
      setChangePinMsg({ type: 'error', text: 'All fields are required.' });
      return;
    }

    const currentPinsMap = loadTeacherPINs(allTeachers);
    if (String(currentPinsMap[authenticatedTeacher]).trim() !== oldPin.trim()) {
      setChangePinMsg({ type: 'error', text: 'Current PIN is incorrect.' });
      return;
    }

    if (newPin.trim().length < 4) {
      setChangePinMsg({ type: 'error', text: 'New PIN must be at least 4 digits.' });
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setChangePinMsg({ type: 'error', text: 'New PIN and Confirm PIN do not match.' });
      return;
    }

    const updated = {
      ...currentPinsMap,
      [authenticatedTeacher]: newPin.trim()
    };
    saveTeacherPINs(updated);
    setTeacherPins(updated);
    setChangePinMsg({ type: 'success', text: 'PIN updated successfully!' });
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => {
      setIsChangingPin(false);
      setChangePinMsg({ type: '', text: '' });
    }, 1500);
  };

  const activeTeacher = authenticatedTeacher || (isAdmin ? selectedTeacher : '');
  const isUnlocked = Boolean(authenticatedTeacher || isAdmin);

  const teacherSchedule = activeTeacher ? getTeacherTimetable(timetable, activeTeacher) : [];
  const currentDay = DAYS[currentTime.getDay()];
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Filter today's lectures for active teacher
  const todayLectures = teacherSchedule
    .filter(cls => cls.day === currentDay && isActualLecture(cls))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  let ongoingClass = null;
  let nextClass = null;

  for (let i = 0; i < todayLectures.length; i++) {
    const cls = todayLectures[i];
    const startMins = timeToMinutes(cls.startTime);
    const endMins = timeToMinutes(cls.endTime);

    if (currentMinutes >= startMins && currentMinutes < endMins) {
      ongoingClass = cls;
    } else if (currentMinutes < startMins && !nextClass) {
      nextClass = cls;
    }
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const groupedWeekly = {};
  daysOfWeek.forEach(d => {
    groupedWeekly[d] = teacherSchedule
      .filter(cls => cls.day === d && isActualLecture(cls))
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  });

  const myNotifications = authenticatedTeacher 
    ? notifications.filter(n => n.toTeacher === authenticatedTeacher)
    : [];

  return (
    <div className="teacher-panel animate-fade-in">
      {!isUnlocked ? (
        /* Simple Direct PIN Login Card - No Teacher Selection List */
        <div className="teacher-pin-lock-card glass" style={{ marginTop: '40px' }}>
          <div className="pin-lock-icon">
            <Key size={36} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ margin: '8px 0 4px', fontSize: '1.4rem' }}>Faculty Portal Access</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Enter your 4-digit Faculty PIN to open your personal timetable portal.
          </p>

          <div className="pin-input-group">
            <input 
              type="password"
              maxLength={6}
              className="form-input pin-field"
              placeholder="Enter PIN..."
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyPIN()}
              autoFocus
            />
            <button className="btn btn-primary" onClick={handleVerifyPIN}>
              <Unlock size={16} /> Login
            </button>
          </div>

          {pinError && <div className="pin-error-msg">{pinError}</div>}
        </div>
      ) : (
        <>
          {/* Teacher Portal Header */}
          <div className="teacher-header-card glass">
            <div className="teacher-header-top">
              <div className="teacher-header-info">
                <div className="teacher-icon-badge">
                  <UserCheck size={24} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h2 className="teacher-portal-title">Faculty Portal — {activeTeacher}</h2>
                  <p className="teacher-portal-subtitle">
                    Private Workload, Room Allocations & Proxy Alerts for {activeTeacher}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsChangingPin(!isChangingPin)}
                >
                  <KeyRound size={14} /> {isChangingPin ? 'Cancel' : 'Change PIN'}
                </button>

                {authenticatedTeacher && (
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={handleLogoutTeacher}
                  >
                    <Lock size={14} /> Lock / Logout
                  </button>
                )}

                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => downloadICSFile(teacherSchedule, `Faculty_${activeTeacher.replace(/\s+/g, '_')}_Schedule`)}
                  disabled={teacherSchedule.length === 0}
                >
                  <Download size={15} /> Export Calendar (.ics)
                </button>
              </div>
            </div>

            {/* Admin-only Teacher Switcher */}
            {isAdmin && !authenticatedTeacher && (
              <div className="teacher-select-row" style={{ marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                <label className="teacher-select-label">Admin Faculty View:</label>
                <div className="teacher-pills-scroll">
                  {allTeachers.map((t) => (
                    <button 
                      key={t}
                      className={`teacher-pill ${selectedTeacher === t ? 'active' : ''}`}
                      onClick={() => setSelectedTeacher(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Inbox for Active Teacher */}
          {authenticatedTeacher && myNotifications.length > 0 && (
            <div className="admin-card glass card-featured" style={{ marginBottom: '20px', borderColor: 'var(--primary)' }}>
              <div className="admin-card-header">
                <div className="status-live-indicator">
                  <Bell size={20} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>🔔 Proxy Duty Notifications ({myNotifications.length})</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Other faculty members have assigned substitute lectures to you.
                  </p>
                </div>
              </div>

              <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myNotifications.map((n) => (
                  <div key={n.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {n.fromTeacher} assigned proxy for <span style={{ color: 'var(--primary)' }}>{n.className}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        📅 {n.day} ({n.startTime} - {n.endTime}) • Room: {n.location} • {n.section}
                      </div>
                    </div>

                    <button 
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                      onClick={() => {
                        const updated = notifications.filter(item => item.id !== n.id);
                        saveTeacherNotifications(updated);
                        setNotifications(updated);
                      }}
                    >
                      <CheckCircle2 size={14} style={{ color: 'var(--success)' }} /> Acknowledge Alert
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Change PIN Inline Card */}
          {isChangingPin && (
            <div className="admin-card glass" style={{ marginBottom: '20px' }}>
              <div className="admin-card-header">
                <KeyRound size={20} style={{ color: 'var(--primary)' }} />
                <h4 style={{ margin: 0 }}>Change Your Faculty PIN</h4>
              </div>
              <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
                <div>
                  <label className="form-label">Current PIN:</label>
                  <input 
                    type="password"
                    className="form-input"
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">New PIN (min 4 digits):</label>
                  <input 
                    type="password"
                    className="form-input"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Confirm New PIN:</label>
                  <input 
                    type="password"
                    className="form-input"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                  />
                </div>
                {changePinMsg.text && (
                  <div style={{ color: changePinMsg.type === 'error' ? 'var(--danger)' : 'var(--success)', fontSize: '0.88rem', fontWeight: 600 }}>
                    {changePinMsg.text}
                  </div>
                )}
                <button className="btn btn-primary btn-sm" onClick={handleSaveNewPIN}>
                  Update PIN
                </button>
              </div>
            </div>
          )}

          {/* Live Teacher Banner */}
          <div className="teacher-live-grid">
            {/* Ongoing Lecture Card */}
            <div className={`teacher-status-card glass ${ongoingClass ? 'card-ongoing' : ''}`}>
              <div className="status-card-header">
                <span className="live-dot-pulse"></span>
                <h4>ONGOING LECTURE (TODAY)</h4>
              </div>
              {ongoingClass ? (
                <div className="status-card-body">
                  <h3 className="status-class-title">{ongoingClass.name}</h3>
                  <div className="status-meta-pills">
                    <span className="meta-pill section-pill">
                      <Layers size={13} /> Section {ongoingClass.section || 'General'}
                    </span>
                    <span className="meta-pill room-pill">
                      <MapPin size={13} /> Room {ongoingClass.location || 'N/A'}
                    </span>
                    <span className="meta-pill time-pill">
                      <Clock size={13} /> {ongoingClass.startTime} - {ongoingClass.endTime}
                    </span>
                    {ongoingClass.substituteTeacher && (
                      <span className="meta-pill proxy-pill">
                        <RefreshCw size={13} /> Substitute Duty
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="status-empty-text">No active class right now.</p>
              )}
            </div>

            {/* Next Upcoming Lecture Card */}
            <div className="teacher-status-card glass card-next">
              <div className="status-card-header">
                <Clock size={16} style={{ color: 'var(--secondary)' }} />
                <h4>NEXT UPCOMING LECTURE</h4>
              </div>
              {nextClass ? (
                <div className="status-card-body">
                  <h3 className="status-class-title">{nextClass.name}</h3>
                  <div className="status-meta-pills">
                    <span className="meta-pill section-pill">
                      <Layers size={13} /> Section {nextClass.section || 'General'}
                    </span>
                    <span className="meta-pill room-pill">
                      <MapPin size={13} /> Room {nextClass.location || 'N/A'}
                    </span>
                    <span className="meta-pill time-pill">
                      <Clock size={13} /> {nextClass.startTime} - {nextClass.endTime}
                    </span>
                    {nextClass.substituteTeacher && (
                      <span className="meta-pill proxy-pill">
                        <RefreshCw size={13} /> Substitute Duty
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="status-empty-text">No more lectures scheduled for today!</p>
              )}
            </div>
          </div>

          {/* Full Weekly Faculty Schedule */}
          <div className="teacher-weekly-section glass">
            <h3 className="teacher-section-title">
              <Calendar size={18} style={{ color: 'var(--primary)' }} /> 
              Weekly Master Workload for {activeTeacher} ({teacherSchedule.length} Lectures Total)
            </h3>

            <div className="teacher-days-grid">
              {daysOfWeek.map((day) => {
                const dayClasses = groupedWeekly[day] || [];
                const isToday = day === currentDay;

                return (
                  <div key={day} className={`teacher-day-column ${isToday ? 'today-column' : ''}`}>
                    <div className="teacher-day-header">
                      <span>{day}</span>
                      <span className="day-count-badge">{dayClasses.length} Classes</span>
                    </div>

                    <div className="teacher-class-list">
                      {dayClasses.length > 0 ? (
                        dayClasses.map((cls) => (
                          <div 
                            key={cls.id} 
                            className="teacher-class-card" 
                            style={{ borderLeftColor: cls.color || 'var(--primary)' }}
                            onClick={() => isAdmin && onEditClick && onEditClick(cls)}
                          >
                            <div className="teacher-card-top">
                              <span className="card-time-slot">{cls.startTime} - {cls.endTime}</span>
                              <span className="card-section-badge">Sec {cls.section || 'A'}</span>
                            </div>
                            <h4 className="teacher-card-subject">{cls.name}</h4>
                            <div className="teacher-card-bottom">
                              <span className="card-room-tag">
                                <MapPin size={12} /> {cls.location || 'AB-207'}
                              </span>
                              {cls.substituteTeacher && (
                                <span className="card-proxy-tag">
                                  <RefreshCw size={11} /> {cls.substituteTeacher}
                                </span>
                              )}
                            </div>

                            {authenticatedTeacher && (
                              <button 
                                className="btn btn-secondary btn-xs"
                                style={{ marginTop: '8px', fontSize: '0.75rem', padding: '4px 8px', width: '100%', justifyContent: 'center' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProxyModalClass(cls);
                                  setProxyTeacherTarget(cls.substituteTeacher || '');
                                }}
                              >
                                <RefreshCw size={12} /> {cls.substituteTeacher ? `Change Proxy (${cls.substituteTeacher})` : 'Assign Proxy'}
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="teacher-empty-day">No Classes</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Proxy Assignment Modal */}
      {proxyModalClass && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass animate-fade-in" style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Assign Substitute Teacher</h3>
              </div>
              <button className="icon-btn" onClick={() => setProxyModalClass(null)}><X size={18} /></button>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Assign a colleague to take over <strong>{proxyModalClass.name}</strong> on {proxyModalClass.day} ({proxyModalClass.startTime} - {proxyModalClass.endTime}). An instant notification will be sent to the substitute faculty member.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontWeight: 600, marginBottom: '6px' }}>Select Substitute Faculty Member:</label>
              <select 
                className="form-select"
                value={proxyTeacherTarget}
                onChange={(e) => setProxyTeacherTarget(e.target.value)}
                style={{ width: '100%', padding: '10px' }}
              >
                <option value="">-- Choose Faculty Member --</option>
                {allTeachers.filter(t => t !== activeTeacher).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {proxyModalClass.substituteTeacher && (
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    const updated = timetable.map(c => c.id === proxyModalClass.id ? { ...c, substituteTeacher: '' } : c);
                    if (onSaveTimetable) onSaveTimetable(updated);
                    setProxyModalClass(null);
                  }}
                >
                  Remove Proxy
                </button>
              )}
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (!proxyTeacherTarget) {
                    alert('Please select a substitute faculty member.');
                    return;
                  }
                  const updated = timetable.map(c => c.id === proxyModalClass.id ? { ...c, substituteTeacher: proxyTeacherTarget } : c);
                  if (onSaveTimetable) onSaveTimetable(updated);
                  addProxyNotification({
                    fromTeacher: activeTeacher,
                    toTeacher: proxyTeacherTarget,
                    classObj: proxyModalClass
                  });
                  setNotifications(loadTeacherNotifications());
                  setProxyModalClass(null);
                  alert(`Proxy duty assigned to ${proxyTeacherTarget}! Notification sent to their portal.`);
                }}
              >
                Assign & Send Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
