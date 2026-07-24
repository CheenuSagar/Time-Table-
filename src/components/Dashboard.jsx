import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, User, ArrowRight, AlertCircle, PlusCircle, Sparkles, BookOpen, BellRing, Layers, Coffee, RefreshCw } from 'lucide-react';
import { formatTimeTo12Hr, isActualLecture } from '../utils/storageHelper';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export default function Dashboard({ timetable, settings, onAddClick, onEditClick, onLoadPreset, selectedSection }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const show12h = settings?.timeFormat12h !== false;

  const currentDayIndex = currentTime.getDay();
  const currentDay = DAYS[currentDayIndex];
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentSeconds = currentTime.getSeconds();

  // Format Current Time
  const formattedTime = currentTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: show12h
  });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  if (timetable.length === 0) {
    return (
      <div className="empty-dashboard glass animate-scale-in">
        <div className="empty-icon-wrapper">
          <Sparkles size={40} className="empty-icon text-primary" />
        </div>
        <h2>Your Timetable is Empty</h2>
        <p>Start by adding your class schedule manually or load a pre-configured MCA III Section preset.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%', marginTop: '12px' }}>
          <button className="btn btn-primary" onClick={onAddClick}>
            <PlusCircle size={18} /> Add Class Manually
          </button>
          
          <div style={{ width: '100%', height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />
          
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>
              Quick Load Pre-compiled MCA III Presets:
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className={`btn ${selectedSection === 'A' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => onLoadPreset('A')}>
                Section III-A
              </button>
              <button className={`btn ${selectedSection === 'B' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => onLoadPreset('B')}>
                Section III-B
              </button>
              <button className={`btn ${selectedSection === 'C' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => onLoadPreset('C')}>
                Section III-C
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Find currently active class
  const activeClass = timetable.find((cls) => {
    if (cls.day !== currentDay) return false;
    const start = timeToMinutes(cls.startTime);
    const end = timeToMinutes(cls.endTime);
    return currentMinutes >= start && currentMinutes < end;
  });

  // Calculate next class
  let nextClass = null;
  let minDiff = Infinity;

  timetable.forEach((cls) => {
    if (activeClass && cls.id === activeClass.id) return;

    const classDayIndex = DAYS.indexOf(cls.day);
    const startMins = timeToMinutes(cls.startTime);

    let dayDiff = classDayIndex - currentDayIndex;
    if (dayDiff < 0 || (dayDiff === 0 && currentMinutes >= startMins)) {
      dayDiff += 7;
    }

    let diffMinutes = 0;
    if (dayDiff === 0) {
      diffMinutes = startMins - currentMinutes;
    } else {
      diffMinutes = dayDiff * 24 * 60 + startMins - currentMinutes;
    }

    if (diffMinutes < minDiff) {
      minDiff = diffMinutes;
      nextClass = { ...cls, diffMinutes };
    }
  });

  // Format countdown for next class
  let countdownStr = '';
  let isClose = false;

  if (nextClass) {
    const totalSeconds = (nextClass.diffMinutes * 60) - currentSeconds;
    if (totalSeconds > 0) {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      const pad = (n) => String(n).padStart(2, '0');
      countdownStr = `${hours > 0 ? `${pad(hours)}:` : ''}${pad(minutes)}:${pad(seconds)}`;
      
      if (nextClass.diffMinutes <= 15) {
        isClose = true;
      }
    } else {
      countdownStr = '00:00';
    }
  }

  // Calculate active class progress
  let activeProgress = 0;
  let activeRemaining = '';
  if (activeClass) {
    const start = timeToMinutes(activeClass.startTime);
    const end = timeToMinutes(activeClass.endTime);
    const totalDuration = end - start;
    const elapsed = currentMinutes - start;
    activeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    activeRemaining = end - currentMinutes;
  }

  // Get Today's Timeline & Substituted Lectures
  const todayClasses = timetable
    .filter((cls) => cls.day === currentDay)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const todaySubstitutedClasses = todayClasses.filter(cls => cls.substituteTeacher && isActualLecture(cls));

  return (
    <div className="dashboard-grid animate-fade-in">
      {/* Left Column */}
      <div className="dashboard-left">
        {/* Clock & Welcome Card */}
        <div className="clock-card glass">
          <div className="clock-info">
            <div className="date-badge-wrapper">
              <Calendar size={14} />
              <span className="date-badge">{formattedDate}</span>
            </div>
            <h1 className="clock-time">{formattedTime}</h1>
          </div>
          <div className="live-clock-badge">
            <span className="live-dot"></span>
            <span>LIVE TICKER</span>
          </div>
        </div>

        {/* Quick Stats & Section Switcher */}
        <div className="stats-row">
          <div className="stat-card glass">
            <div className="stat-icon-bg bg-primary-glow">
              <BookOpen size={18} className="text-primary" />
            </div>
            <div className="stat-details">
              <span className="stat-label">Today's Lectures</span>
              <span className="stat-value">{todayClasses.filter(isActualLecture).length} Lectures</span>
            </div>
          </div>

          <div className="stat-card glass">
            <div className="stat-icon-bg bg-secondary-glow">
              <Layers size={18} style={{ color: 'var(--secondary)' }} />
            </div>
            <div className="stat-details">
              <span className="stat-label">Active Section</span>
              <div className="preset-chip-group">
                {['A', 'B', 'C'].map((sec) => (
                  <button 
                    key={sec} 
                    className={`preset-chip ${selectedSection === sec ? 'active' : ''}`}
                    onClick={() => onLoadPreset(sec)}
                  >
                    Sec {sec}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Replacement Teacher Alert Banner for Students */}
        {todaySubstitutedClasses.length > 0 && (
          <div className="admin-card glass card-featured" style={{ borderColor: '#f43f5e', background: 'rgba(244, 63, 94, 0.08)', padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <RefreshCw size={22} style={{ color: '#f43f5e', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#f43f5e' }}>
                  📢 Faculty Replacement Alert ({todaySubstitutedClasses.length} Today)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  {todaySubstitutedClasses.map(c => (
                    <div key={c.id} style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                      • <strong>{c.name}</strong> ({c.startTime} - {c.endTime}): 
                      <span style={{ color: '#f43f5e', fontWeight: 700, marginLeft: '4px' }}>
                        Prof. {c.substituteTeacher}
                      </span> 
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', textDecoration: 'line-through', marginLeft: '4px' }}>
                        (instead of {c.teacher})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning Banner if class is starting soon */}
        {isClose && nextClass && (
          <div className="warning-banner animate-pulse-glow">
            <AlertCircle className="warning-icon" size={22} />
            <div className="warning-text">
              <strong>{nextClass.name}</strong> starts in <strong>{nextClass.diffMinutes} mins</strong>!
              {nextClass.location && ` (${nextClass.location})`}
            </div>
          </div>
        )}

        {/* Current Class Status */}
        <div className="status-card glass">
          <div className="status-card-header">
            <h3 className="card-title">Ongoing Lecture</h3>
            {activeClass && <span className="badge badge-live"><span className="live-dot"></span> LIVE NOW</span>}
          </div>

          {activeClass ? (
            <div className="class-status-active">
              <div className="color-bar" style={{ backgroundColor: activeClass.color, boxShadow: `0 0 15px ${activeClass.color}` }}></div>
              <div className="active-details">
                <h2 className="class-name">{activeClass.name}</h2>
                <div className="metadata-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
                  {activeClass.substituteTeacher ? (
                    <span className="metadata-item" style={{ color: '#f43f5e', fontWeight: 700, background: 'rgba(244, 63, 94, 0.12)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                      <RefreshCw size={14} /> Sub: {activeClass.substituteTeacher} <span style={{ textDecoration: 'line-through', opacity: 0.65, fontWeight: 400, fontSize: '0.78rem' }}>({activeClass.teacher})</span>
                    </span>
                  ) : (
                    activeClass.teacher && (
                      <span className="metadata-item">
                        <User size={15} /> {activeClass.teacher}
                      </span>
                    )
                  )}
                  {activeClass.location && (
                    <span className="metadata-item">
                      <MapPin size={15} /> {activeClass.location}
                    </span>
                  )}
                </div>
                <div className="time-badge-row">
                  <span className="time-range">
                    <Clock size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    {show12h ? formatTimeTo12Hr(activeClass.startTime) : activeClass.startTime} - {show12h ? formatTimeTo12Hr(activeClass.endTime) : activeClass.endTime}
                  </span>
                  <span className="time-remaining">{activeRemaining} mins remaining</span>
                </div>
                
                {/* Progress bar */}
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${activeProgress}%`, backgroundColor: activeClass.color, boxShadow: `0 0 10px ${activeClass.color}` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="class-status-empty">
              <Clock size={28} style={{ color: 'var(--text-muted)', marginBottom: '4px' }} />
              <p>No ongoing lecture right now. Enjoy your break!</p>
            </div>
          )}
        </div>

        {/* Next Class Status */}
        <div className={`status-card glass ${isClose ? 'border-warning' : ''}`}>
          <div className="status-card-header">
            <h3 className="card-title">Up Next</h3>
            {nextClass && <span className="badge badge-primary">{nextClass.day}</span>}
          </div>

          {nextClass ? (
            <div className="next-class-content" onClick={() => onEditClick(nextClass)}>
              <div className="next-details">
                <div className="next-header">
                  <h2 className="class-name">{nextClass.name}</h2>
                </div>
                <div className="metadata-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
                  {nextClass.substituteTeacher ? (
                    <span className="metadata-item" style={{ color: '#f43f5e', fontWeight: 700, background: 'rgba(244, 63, 94, 0.12)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                      <RefreshCw size={14} /> Sub: {nextClass.substituteTeacher} <span style={{ textDecoration: 'line-through', opacity: 0.65, fontWeight: 400, fontSize: '0.78rem' }}>({nextClass.teacher})</span>
                    </span>
                  ) : (
                    nextClass.teacher && (
                      <span className="metadata-item">
                        <User size={15} /> {nextClass.teacher}
                      </span>
                    )
                  )}
                  {nextClass.location && (
                    <span className="metadata-item">
                      <MapPin size={15} /> {nextClass.location}
                    </span>
                  )}
                </div>
                <div className="next-footer">
                  <span className="time-range">
                    {show12h ? formatTimeTo12Hr(nextClass.startTime) : nextClass.startTime} - {show12h ? formatTimeTo12Hr(nextClass.endTime) : nextClass.endTime}
                  </span>
                  <div className="countdown-container">
                    <span className="countdown-label">Starts in</span>
                    <span className={`countdown-timer ${isClose ? 'text-warning' : ''}`}>
                      {countdownStr}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="class-status-empty">
              <p>No upcoming lectures found on schedule.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Today's Schedule */}
      <div className="dashboard-right glass">
        <div className="schedule-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} className="text-primary" />
            <h3 className="card-title" style={{ margin: 0 }}>Today's Timeline</h3>
          </div>
          <span className="badge badge-secondary">{currentDay}</span>
        </div>

        {todayClasses.length > 0 ? (
          <div className="timeline">
            {todayClasses.map((cls, idx) => {
              const isCurrent = activeClass && activeClass.id === cls.id;
              const isPast = !isCurrent && timeToMinutes(cls.endTime) <= currentMinutes;

              return (
                <div 
                  key={cls.id} 
                  className={`timeline-item ${isCurrent ? 'active' : ''} ${isPast ? 'past' : ''}`}
                  onClick={() => onEditClick(cls)}
                >
                  <div className="timeline-dot-container">
                    <div className="timeline-dot" style={{ backgroundColor: cls.color, boxShadow: isCurrent ? `0 0 12px ${cls.color}` : 'none' }}></div>
                    {idx < todayClasses.length - 1 && <div className="timeline-line"></div>}
                  </div>
                  
                  <div className="timeline-content">
                    <div className="timeline-time" style={{ color: cls.color }}>
                      {show12h ? formatTimeTo12Hr(cls.startTime) : cls.startTime} - {show12h ? formatTimeTo12Hr(cls.endTime) : cls.endTime}
                    </div>
                    <h4 className="timeline-title">{cls.name}</h4>
                    <div className="timeline-meta">
                      {cls.substituteTeacher ? (
                        <span style={{ color: '#f43f5e', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <RefreshCw size={12} /> Sub: {cls.substituteTeacher} <span style={{ textDecoration: 'line-through', opacity: 0.6, fontSize: '0.75rem', fontWeight: 400 }}>({cls.teacher})</span>
                        </span>
                      ) : (
                        cls.teacher && <span>{cls.teacher}</span>
                      )}
                      {(cls.teacher || cls.substituteTeacher) && cls.location && <span className="separator">•</span>}
                      {cls.location && <span>{cls.location}</span>}
                    </div>
                    {isCurrent && <span className="badge badge-live live-pill">ONGOING</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="class-status-empty h-full-center">
            <Calendar size={42} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
            <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>No lectures scheduled for {currentDay}.</p>
          </div>
        )}
      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 24px;
          align-items: start;
        }
        .dashboard-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .clock-card {
          padding: 26px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%);
          border: 1px solid rgba(99, 102, 241, 0.25);
          position: relative;
          overflow: hidden;
        }
        .date-badge-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--secondary);
          margin-bottom: 4px;
        }
        .date-badge {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .clock-time {
          font-size: 3rem;
          font-family: var(--font-heading);
          font-weight: 800;
          letter-spacing: -0.02em;
          background: var(--gradient-heading);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          color: var(--text-primary);
        }
        .live-clock-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: var(--success-glow);
          border: 1px solid var(--success);
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--success);
          letter-spacing: 0.05em;
        }

        .stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .stat-card {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .stat-icon-bg {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bg-primary-glow {
          background: var(--primary-glow);
          border: 1px solid var(--border-light);
        }
        .bg-secondary-glow {
          background: var(--secondary-glow);
          border: 1px solid var(--border-light);
        }
        .stat-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .stat-value {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .preset-chip-group {
          display: flex;
          gap: 6px;
        }
        .preset-chip {
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 600;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .preset-chip:hover, .preset-chip.active {
          background: var(--primary-gradient);
          color: white;
          border-color: transparent;
          box-shadow: 0 2px 10px var(--primary-glow);
        }

        .warning-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          background: var(--warning-glow);
          border: 1px solid var(--warning);
          border-radius: var(--radius-lg);
          padding: 16px 20px;
          color: var(--warning-text-color);
        }
        .warning-icon {
          color: var(--warning);
          flex-shrink: 0;
        }
        .warning-text {
          font-size: 0.95rem;
          color: var(--warning-text-color);
        }

        .status-card {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .status-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 10px;
        }
        .card-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .class-status-active {
          display: flex;
          gap: 18px;
        }
        .color-bar {
          width: 6px;
          border-radius: 99px;
          flex-shrink: 0;
        }
        .active-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .class-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .metadata-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          color: var(--text-secondary);
          font-size: 0.88rem;
        }
        .metadata-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .time-badge-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.92rem;
          font-weight: 600;
          margin-top: 4px;
        }
        .time-range {
          color: var(--text-primary);
        }
        .time-remaining {
          color: var(--secondary);
          background: var(--secondary-glow);
          border: 1px solid var(--border-light);
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 0.8rem;
        }
        .progress-container {
          height: 8px;
          background: var(--border-light);
          border-radius: 99px;
          overflow: hidden;
          margin-top: 6px;
        }
        .progress-bar {
          height: 100%;
          border-radius: 99px;
          transition: width 1s linear;
        }
        .class-status-empty {
          color: var(--text-muted);
          font-size: 0.95rem;
          padding: 20px 0;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .next-class-content {
          cursor: pointer;
          transition: transform var(--transition-fast);
        }
        .next-class-content:hover {
          transform: translateX(4px);
        }
        .next-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .next-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 8px;
        }
        .countdown-container {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .countdown-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
        }
        .countdown-timer {
          font-size: 1.6rem;
          font-family: var(--font-heading);
          font-weight: 800;
          color: var(--primary);
        }

        .dashboard-right {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 480px;
        }
        .schedule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 12px;
        }
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
        }
        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .timeline-item {
          display: flex;
          gap: 16px;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          cursor: pointer;
          border: 1px solid transparent;
        }
        .timeline-item:hover {
          background-color: var(--bg-card-hover);
          border-color: var(--border-light);
        }
        .timeline-dot-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          width: 16px;
        }
        .timeline-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          z-index: 2;
          margin-top: 4px;
          border: 2px solid var(--bg-surface);
        }
        .timeline-line {
          width: 2px;
          background: var(--border-light);
          flex-grow: 1;
          position: absolute;
          top: 18px;
          bottom: -18px;
          z-index: 1;
        }
        .timeline-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
        }
        .timeline-time {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--primary);
        }
        .timeline-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .timeline-meta {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }
        .separator {
          margin: 0 4px;
        }
        .live-pill {
          position: absolute;
          right: 0;
          top: 0;
        }
        .timeline-item.active {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.25);
        }
        .timeline-item.past {
          opacity: 0.45;
        }
        .h-full-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 12px;
        }
        .empty-dashboard {
          padding: 50px 24px;
          text-align: center;
          max-width: 540px;
          margin: 40px auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .empty-icon-wrapper {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--primary-glow);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(99, 102, 241, 0.3);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
        }
        .empty-dashboard p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .stats-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
