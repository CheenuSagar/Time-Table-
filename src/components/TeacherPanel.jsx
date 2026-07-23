import React, { useState, useEffect } from 'react';
import { UserCheck, Clock, MapPin, Calendar, Download, RefreshCw, AlertCircle, Sparkles, BookOpen, Layers, Lock, Unlock, Key, ShieldCheck } from 'lucide-react';
import { extractUniqueTeachers, getTeacherTimetable, isActualLecture, loadTeacherPINs, verifyTeacherPIN } from '../utils/storageHelper';
import { downloadICSFile } from '../utils/icsHelper';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export default function TeacherPanel({ timetable, settings, onEditClick, isAdmin }) {
  const allTeachers = extractUniqueTeachers(timetable);
  const teacherPins = loadTeacherPINs(allTeachers);

  const [selectedTeacher, setSelectedTeacher] = useState(() => {
    try {
      return localStorage.getItem('lecalert_selected_teacher') || (allTeachers[0] || '');
    } catch (e) {
      return allTeachers[0] || '';
    }
  });

  const [authenticatedTeacher, setAuthenticatedTeacher] = useState(() => {
    try {
      return sessionStorage.getItem('lecalert_auth_teacher') || '';
    } catch (e) {
      return '';
    }
  });

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectTeacher = (name) => {
    setSelectedTeacher(name);
    setPinInput('');
    setPinError('');
    try {
      localStorage.setItem('lecalert_selected_teacher', name);
    } catch (e) {}
  };

  const handleVerifyPIN = () => {
    if (verifyTeacherPIN(selectedTeacher, pinInput, teacherPins)) {
      setAuthenticatedTeacher(selectedTeacher);
      setPinError('');
      setPinInput('');
      try {
        sessionStorage.setItem('lecalert_auth_teacher', selectedTeacher);
      } catch (e) {}
    } else {
      setPinError('Incorrect PIN! Please try again.');
    }
  };

  const handleLogoutTeacher = () => {
    setAuthenticatedTeacher('');
    try {
      sessionStorage.removeItem('lecalert_auth_teacher');
    } catch (e) {}
  };

  const isUnlocked = authenticatedTeacher === selectedTeacher;

  const teacherSchedule = isUnlocked ? getTeacherTimetable(timetable, selectedTeacher) : [];
  const currentDay = DAYS[currentTime.getDay()];
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Filter today's lectures for teacher
  const todayLectures = teacherSchedule
    .filter(cls => cls.day === currentDay && isActualLecture(cls))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // Determine current ongoing and next lecture
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

  // Group weekly schedule by day
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const groupedWeekly = {};
  daysOfWeek.forEach(d => {
    groupedWeekly[d] = teacherSchedule
      .filter(cls => cls.day === d && isActualLecture(cls))
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  });

  return (
    <div className="teacher-panel animate-fade-in">
      {/* Teacher Portal Header & Picker */}
      <div className="teacher-header-card glass">
        <div className="teacher-header-top">
          <div className="teacher-header-info">
            <div className="teacher-icon-badge">
              <UserCheck size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h2 className="teacher-portal-title">Faculty Schedule Portal</h2>
              <p className="teacher-portal-subtitle">
                Private Workload, Room Allocations & Proxy Alerts for {selectedTeacher || 'Faculty'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {isUnlocked && (
              <>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={handleLogoutTeacher}
                >
                  <Lock size={14} /> Lock Account
                </button>

                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => downloadICSFile(teacherSchedule, `Faculty_${selectedTeacher.replace(/\s+/g, '_')}_Schedule`)}
                  disabled={teacherSchedule.length === 0}
                >
                  <Download size={15} /> Export My Calendar (.ics)
                </button>
              </>
            )}
          </div>
        </div>

        {/* Teacher Selection Pill Dropdown */}
        <div className="teacher-select-row">
          <label className="teacher-select-label">Select Faculty Account:</label>
          <div className="teacher-pills-scroll">
            {allTeachers.map((t) => (
              <button 
                key={t}
                className={`teacher-pill ${selectedTeacher === t ? 'active' : ''}`}
                onClick={() => handleSelectTeacher(t)}
              >
                {t} {authenticatedTeacher === t ? '✓' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PIN Authentication Lock Screen (If not unlocked for selected teacher) */}
      {!isUnlocked ? (
        <div className="teacher-pin-lock-card glass">
          <div className="pin-lock-icon">
            <Key size={32} style={{ color: 'var(--primary)' }} />
          </div>
          <h3>Private Schedule PIN Verification</h3>
          <p>Please enter the 4-digit PIN for <strong>{selectedTeacher}</strong> to view private schedule.</p>

          <div className="pin-input-group">
            <input 
              type="password"
              maxLength={6}
              className="form-input pin-field"
              placeholder="Enter PIN..."
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyPIN()}
            />
            <button className="btn btn-primary" onClick={handleVerifyPIN}>
              <Unlock size={16} /> Unlock Schedule
            </button>
          </div>

          {pinError && <div className="pin-error-msg">{pinError}</div>}

          <div className="pin-hint-box">
            <span>💡 Initial Default PIN for <strong>{selectedTeacher}</strong>: <code>{teacherPins[selectedTeacher] || '1001'}</code></span>
          </div>
        </div>
      ) : (
        <>
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
              Weekly Master Workload for {selectedTeacher} ({teacherSchedule.length} Lectures Total)
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
                                  <RefreshCw size={11} /> Proxy Assignment
                                </span>
                              )}
                            </div>
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
    </div>
  );
}
