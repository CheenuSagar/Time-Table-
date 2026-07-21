import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, User, ArrowRight, AlertCircle, PlusCircle, Sparkles, Upload } from 'lucide-react';
import { formatTimeTo12Hr } from '../utils/storageHelper';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToHoursAndMins(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h > 0 ? `${h}h ` : ''}${m}m`;
}

export default function Dashboard({ timetable, settings, onAddClick, onEditClick, onLoadPreset }) {
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
      <div className="empty-dashboard glass animate-fade-in">
        <AlertCircle size={48} className="empty-icon" />
        <h2>Your timetable is empty</h2>
        <p>Add your class schedule manually or load a predefined section preset.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', width: '100%', marginTop: '8px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={onAddClick}>
              <PlusCircle size={18} /> Add Manually
            </button>
          </div>
          
          <div style={{ width: '100%', height: '1px', background: 'var(--border-light)', margin: '8px 0' }} />
          
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>Load Pre-compiled MCA III Presets:</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => onLoadPreset('A')}>
                Section III-A
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => onLoadPreset('B')}>
                Section III-B
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => onLoadPreset('C')}>
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
    // If it is the currently active class, skip it
    if (activeClass && cls.id === activeClass.id) return;

    const classDayIndex = DAYS.indexOf(cls.day);
    const startMins = timeToMinutes(cls.startTime);
    const endMins = timeToMinutes(cls.endTime);

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
  let isClose = false; // less than 15 minutes

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
    activeRemaining = end - currentMinutes; // minutes remaining
  }

  // Get Today's Timeline
  const todayClasses = timetable
    .filter((cls) => cls.day === currentDay)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  return (
    <div className="dashboard-grid animate-fade-in">
      {/* Left Column: Now and Next */}
      <div className="dashboard-left">
        {/* Clock Card */}
        <div className="clock-card glass">
          <div className="clock-info">
            <span className="date-badge">{formattedDate}</span>
            <h1 className="clock-time">{formattedTime}</h1>
          </div>
          <div className="pulse-dot"></div>
        </div>

        {/* Section Preset Switcher */}
        <div className="status-card glass" style={{ padding: '16px 20px' }}>
          <h3 className="card-title" style={{ paddingBottom: '6px', marginBottom: '8px' }}>Select Timetable Option</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '4px' }}>Load Preset:</span>
            <button className="btn btn-secondary btn-sm" onClick={() => onLoadPreset('A')}>Section A</button>
            <button className="btn btn-secondary btn-sm" onClick={() => onLoadPreset('B')}>Section B</button>
            <button className="btn btn-secondary btn-sm" onClick={() => onLoadPreset('C')}>Section C</button>
          </div>
        </div>

        {/* Pulsing Warning Banner if class is starting soon */}
        {isClose && nextClass && (
          <div className="warning-banner animate-pulse-glow">
            <AlertCircle className="warning-icon" />
            <div className="warning-text">
              <strong>{nextClass.name}</strong> starts in <strong>{nextClass.diffMinutes} minutes</strong>!
              {nextClass.location && ` Go to ${nextClass.location}`}
            </div>
          </div>
        )}

        {/* Current Class Status */}
        <div className="status-card glass">
          <h3 className="card-title">Ongoing Lecture</h3>
          {activeClass ? (
            <div className="class-status-active">
              <div className="color-bar" style={{ backgroundColor: activeClass.color }}></div>
              <div className="active-details">
                <h2 className="class-name">{activeClass.name}</h2>
                <div className="metadata-row">
                  {activeClass.teacher && (
                    <span className="metadata-item">
                      <User size={14} /> {activeClass.teacher}
                    </span>
                  )}
                  {activeClass.location && (
                    <span className="metadata-item">
                      <MapPin size={14} /> {activeClass.location}
                    </span>
                  )}
                </div>
                <div className="time-badge-row">
                  <span className="time-range">{show12h ? formatTimeTo12Hr(activeClass.startTime) : activeClass.startTime} - {show12h ? formatTimeTo12Hr(activeClass.endTime) : activeClass.endTime}</span>
                  <span className="time-remaining">{activeRemaining} mins remaining</span>
                </div>
                
                {/* Progress bar */}
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${activeProgress}%`, backgroundColor: activeClass.color }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="class-status-empty">
              <p>No active lecture right now. Relax!</p>
            </div>
          )}
        </div>

        {/* Next Class Status */}
        <div className={`status-card glass ${isClose ? 'border-warning' : ''}`}>
          <h3 className="card-title">Up Next</h3>
          {nextClass ? (
            <div className="next-class-content" onClick={() => onEditClick(nextClass)}>
              <div className="next-details">
                <div className="next-header">
                  <h2 className="class-name">{nextClass.name}</h2>
                  <span className="day-badge">{nextClass.day}</span>
                </div>
                <div className="metadata-row">
                  {nextClass.teacher && (
                    <span className="metadata-item">
                      <User size={14} /> {nextClass.teacher}
                    </span>
                  )}
                  {nextClass.location && (
                    <span className="metadata-item">
                      <MapPin size={14} /> {nextClass.location}
                    </span>
                  )}
                </div>
                <div className="next-footer">
                  <span className="time-range">{show12h ? formatTimeTo12Hr(nextClass.startTime) : nextClass.startTime} - {show12h ? formatTimeTo12Hr(nextClass.endTime) : nextClass.endTime}</span>
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
              <p>No upcoming lectures found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Today's Schedule */}
      <div className="dashboard-right glass">
        <div className="schedule-header">
          <h3 className="card-title">Today's Schedule</h3>
          <span className="schedule-day">{currentDay}</span>
        </div>

        {todayClasses.length > 0 ? (
          <div className="timeline">
            {todayClasses.map((cls, idx) => {
              const isCurrent = activeClass && activeClass.id === cls.id;
              const isPast = !isCurrent && timeToMinutes(cls.endTime) <= currentMinutes;
              const isFuture = !isCurrent && !isPast;

              return (
                <div 
                  key={cls.id} 
                  className={`timeline-item ${isCurrent ? 'active' : ''} ${isPast ? 'past' : ''}`}
                  onClick={() => onEditClick(cls)}
                >
                  <div className="timeline-dot-container">
                    <div className="timeline-dot" style={{ backgroundColor: cls.color }}></div>
                    {idx < todayClasses.length - 1 && <div className="timeline-line"></div>}
                  </div>
                  
                  <div className="timeline-content">
                    <div className="timeline-time" style={{ color: cls.color }}>
                      {show12h ? formatTimeTo12Hr(cls.startTime) : cls.startTime} - {show12h ? formatTimeTo12Hr(cls.endTime) : cls.endTime}
                    </div>
                    <h4 className="timeline-title">{cls.name}</h4>
                    <div className="timeline-meta">
                      {cls.teacher && <span>{cls.teacher}</span>}
                      {cls.teacher && cls.location && <span className="separator">•</span>}
                      {cls.location && <span>{cls.location}</span>}
                    </div>
                    {isCurrent && <span className="live-pill">ONGOING</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="class-status-empty h-full-center">
            <Calendar size={36} className="muted-icon" />
            <p>No lectures scheduled for today!</p>
          </div>
        )}
      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 20px;
          align-items: start;
        }
        .dashboard-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .clock-card {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(6, 182, 212, 0.05));
          border-color: rgba(99, 102, 241, 0.2);
        }
        .clock-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .date-badge {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .clock-time {
          font-size: 2.8rem;
          font-family: var(--font-heading);
          font-weight: 800;
          letter-spacing: -0.01em;
          background: linear-gradient(to right, #ffffff, #9ca3af);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .pulse-dot {
          width: 12px;
          height: 12px;
          background-color: var(--secondary);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--secondary);
          animation: pulse 1.5s infinite alternate;
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 16px var(--secondary); }
        }
        .warning-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid var(--warning);
          border-radius: var(--radius-md);
          padding: 14px 18px;
          color: #fbd38d;
        }
        .warning-icon {
          color: var(--warning);
          flex-shrink: 0;
          animation: shake 0.5s infinite;
        }
        .warning-text {
          font-size: 0.95rem;
        }
        .status-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .border-warning {
          border-color: rgba(245, 158, 11, 0.4);
        }
        .card-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 8px;
        }
        .class-status-active {
          display: flex;
          gap: 16px;
        }
        .color-bar {
          width: 5px;
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
          font-size: 1.4rem;
          font-weight: 700;
          color: white;
        }
        .metadata-row {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          color: var(--text-secondary);
          font-size: 0.85rem;
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
          font-size: 0.9rem;
          font-weight: 500;
        }
        .time-range {
          color: var(--text-primary);
        }
        .time-remaining {
          color: var(--secondary);
          background: rgba(6, 182, 212, 0.1);
          padding: 2px 8px;
          border-radius: 99px;
        }
        .progress-container {
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 99px;
          overflow: hidden;
          margin-top: 4px;
        }
        .progress-bar {
          height: 100%;
          border-radius: 99px;
          transition: width 1s linear;
        }
        .class-status-empty {
          color: var(--text-muted);
          font-size: 0.95rem;
          padding: 16px 0;
          text-align: center;
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
        .next-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .day-badge {
          font-size: 0.75rem;
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 8px;
          border-radius: 99px;
          color: var(--text-secondary);
        }
        .next-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 4px;
        }
        .countdown-container {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .countdown-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .countdown-timer {
          font-size: 1.5rem;
          font-family: var(--font-heading);
          font-weight: 800;
          color: var(--primary);
        }
        .text-warning {
          color: var(--warning) !important;
          text-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
        }
        .dashboard-right {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 400px;
        }
        .schedule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 10px;
        }
        .schedule-header .card-title {
          border-bottom: none;
          padding-bottom: 0;
        }
        .schedule-day {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--primary);
        }
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
          position: relative;
        }
        .timeline-item {
          display: flex;
          gap: 16px;
          cursor: pointer;
          padding: 12px 8px;
          border-radius: var(--radius-md);
          transition: background-color var(--transition-fast);
        }
        .timeline-item:hover {
          background-color: rgba(255, 255, 255, 0.02);
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
          top: 16px;
          bottom: -16px;
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
        }
        .timeline-title {
          font-size: 1rem;
          font-weight: 600;
          color: white;
        }
        .timeline-meta {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .separator {
          margin: 0 4px;
        }
        .live-pill {
          position: absolute;
          right: 0;
          top: 0;
          font-size: 0.7rem;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.15);
          color: var(--success);
          border: 1px solid var(--success);
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }
        .timeline-item.active {
          background-color: rgba(16, 185, 129, 0.04);
        }
        .timeline-item.active .timeline-dot {
          box-shadow: 0 0 10px currentColor;
          animation: pulse-live 1.5s infinite alternate;
        }
        @keyframes pulse-live {
          0% { transform: scale(1); }
          100% { transform: scale(1.2); }
        }
        .timeline-item.past {
          opacity: 0.4;
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
          padding: 48px 24px;
          text-align: center;
          max-width: 500px;
          margin: 40px auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .empty-icon {
          color: var(--text-muted);
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
        }
      `}</style>
    </div>
  );
}
