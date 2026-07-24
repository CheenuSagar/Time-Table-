import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, PlusCircle, Edit3, Sparkles, Search, Grid, ListFilter, LayoutGrid, RefreshCw } from 'lucide-react';
import { formatTimeTo12Hr, isActualLecture } from '../utils/storageHelper';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function calculateDuration(startTime, endTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const diff = end - start;
  if (diff <= 0) return '';
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  return `${mins} mins`;
}

export default function TimetableGrid({ timetable, settings, onAddClick, onEditClick }) {
  const [selectedDayTab, setSelectedDayTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'timeline'
  
  const show12h = settings?.timeFormat12h !== false;
  const todayName = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  // Filter timetable by search query
  const filteredTimetable = timetable.filter(cls => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (cls.name && cls.name.toLowerCase().includes(q)) ||
      (cls.teacher && cls.teacher.toLowerCase().includes(q)) ||
      (cls.substituteTeacher && cls.substituteTeacher.toLowerCase().includes(q)) ||
      (cls.location && cls.location.toLowerCase().includes(q))
    );
  });

  // Group classes by day
  const groupedClasses = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = filteredTimetable
      .filter((cls) => cls.day === day)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    return acc;
  }, {});

  const renderClassCard = (cls) => {
    const durationStr = calculateDuration(cls.startTime, cls.endTime);
    const accent = cls.color || '#6366f1';

    return (
      <div 
        key={cls.id} 
        className="graphical-class-card glass glass-interactive"
        style={{ '--card-accent': accent }}
        onClick={() => onEditClick(cls)}
      >
        <div className="card-accent-strip" style={{ backgroundColor: accent, boxShadow: `0 0 12px ${accent}` }}></div>
        <div className="graphical-card-body">
          <div className="graphical-card-top">
            <h4 className="graphical-card-title">{cls.name}</h4>
            {durationStr && <span className="duration-pill">{durationStr}</span>}
          </div>

          <div className="graphical-time-chip">
            <Clock size={13} className="chip-icon" />
            <span>{show12h ? formatTimeTo12Hr(cls.startTime) : cls.startTime} - {show12h ? formatTimeTo12Hr(cls.endTime) : cls.endTime}</span>
          </div>

          {(cls.teacher || cls.substituteTeacher || cls.location) && (
            <div className="graphical-card-footer" style={{ flexWrap: 'wrap' }}>
              {cls.substituteTeacher ? (
                <div className="footer-chip" style={{ color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.1)', fontWeight: 700 }}>
                  <RefreshCw size={13} />
                  <span>Sub: {cls.substituteTeacher}</span>
                </div>
              ) : cls.teacher && (
                <div className="footer-chip">
                  <User size={13} />
                  <span>{cls.teacher}</span>
                </div>
              )}
              {cls.location && (
                <div className="footer-chip location-chip">
                  <MapPin size={13} />
                  <span>{cls.location}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="timetable-container animate-fade-in">
      {/* Control Bar: Search & View Mode Switcher */}
      <div className="timetable-top-bar glass">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Filter by subject, teacher, or lab room..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        <div className="view-mode-selector">
          <button 
            className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Graphical Grid View"
          >
            <LayoutGrid size={15} /> Grid
          </button>
          <button 
            className={`view-mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
            title="Timeline Schedule View"
          >
            <Clock size={15} /> Timeline
          </button>
          <button className="btn btn-primary btn-sm" onClick={onAddClick}>
            <PlusCircle size={15} /> Add Class
          </button>
        </div>
      </div>

      {/* Days Filter Pills */}
      <div className="tabs-wrapper glass">
        <button 
          className={`tab-btn ${selectedDayTab === 'All' ? 'active' : ''}`}
          onClick={() => setSelectedDayTab('All')}
        >
          All Week
        </button>
        {DAYS_OF_WEEK.map((day) => {
          const count = groupedClasses[day].filter(isActualLecture).length;
          const isToday = day === todayName;
          return (
            <button 
              key={day} 
              className={`tab-btn ${selectedDayTab === day ? 'active' : ''} ${isToday ? 'today-pill' : ''}`}
              onClick={() => setSelectedDayTab(day)}
            >
              {isToday && <span className="today-dot"></span>}
              {day.substring(0, 3)}
              {count > 0 && <span className="tab-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Main Timetable Content */}
      <div className="timetable-content-area">
        {viewMode === 'timeline' ? (
          /* Graphical Timeline View */
          <div className="graphical-timeline-view glass">
            <div className="timeline-header-row">
              <h3><Sparkles size={18} style={{ color: 'var(--primary)', display: 'inline', marginRight: '8px' }} /> Graphical Timeline</h3>
              <span className="badge badge-primary">{filteredTimetable.length} total classes</span>
            </div>

            <div className="timeline-days-stack">
              {DAYS_OF_WEEK.filter(day => selectedDayTab === 'All' || selectedDayTab === day).map((day) => {
                const dayClasses = groupedClasses[day];
                const isToday = day === todayName;
                return (
                  <div key={day} className={`timeline-day-row ${isToday ? 'is-today-row' : ''}`}>
                    <div className="timeline-day-label">
                      <span className="day-name">{day}</span>
                      {isToday && <span className="badge badge-live" style={{ fontSize: '0.7rem' }}>TODAY</span>}
                    </div>

                    <div className="timeline-slots-container">
                      {dayClasses.length > 0 ? (
                        dayClasses.map((cls) => {
                          const durationStr = calculateDuration(cls.startTime, cls.endTime);
                          return (
                            <div 
                              key={cls.id} 
                              className="timeline-slot-card"
                              style={{ borderLeftColor: cls.color || '#6366f1' }}
                              onClick={() => onEditClick(cls)}
                            >
                              <div className="slot-time-badge">
                                {show12h ? formatTimeTo12Hr(cls.startTime) : cls.startTime}
                              </div>
                              <div className="slot-details">
                                <div className="slot-name">{cls.name}</div>
                                <div className="slot-sub">
                                  {cls.substituteTeacher ? (
                                    <span style={{ color: '#f43f5e', fontWeight: 700 }}>
                                      🔄 Sub: {cls.substituteTeacher} <span style={{ textDecoration: 'line-through', opacity: 0.6, fontSize: '0.75rem', fontWeight: 400 }}>({cls.teacher})</span>
                                    </span>
                                  ) : (
                                    cls.teacher && <span>👤 {cls.teacher}</span>
                                  )}
                                  {cls.location && <span>📍 {cls.location}</span>}
                                  {durationStr && <span className="slot-dur">⌛ {durationStr}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="timeline-empty-slot">No lectures scheduled</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Graphical Grid View */
          selectedDayTab === 'All' ? (
            <div className="weekly-grid">
              {DAYS_OF_WEEK.map((day) => {
                const dayClasses = groupedClasses[day];
                const actualCount = dayClasses.filter(isActualLecture).length;
                const isToday = day === todayName;

                return (
                  <div key={day} className={`day-column glass ${isToday ? 'day-column-today' : ''}`}>
                    <div className="day-column-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3>{day}</h3>
                        {isToday && <span className="live-dot" title="Today"></span>}
                      </div>
                      <span className="badge badge-secondary">{actualCount} {actualCount === 1 ? 'lecture' : 'lectures'}</span>
                    </div>
                    
                    <div className="day-classes-list">
                      {dayClasses.length > 0 ? (
                        dayClasses.map(renderClassCard)
                      ) : (
                        <div className="day-empty-state">
                          <span>No classes</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="single-day-view glass">
              <div className="single-day-header">
                <h2>{selectedDayTab} Schedule</h2>
                <span className="badge badge-primary">
                  {groupedClasses[selectedDayTab].filter(isActualLecture).length} lectures
                </span>
              </div>
              
              {groupedClasses[selectedDayTab].length > 0 ? (
                <div className="single-day-grid">
                  {groupedClasses[selectedDayTab].map(renderClassCard)}
                </div>
              ) : (
                <div className="single-day-empty">
                  <Calendar size={44} style={{ color: 'var(--text-muted)' }} />
                  <h3>No classes scheduled for {selectedDayTab}</h3>
                  <button className="btn btn-secondary btn-sm" onClick={onAddClick}>
                    <PlusCircle size={14} /> Add Class
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </div>

      <style>{`
        .timetable-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .timetable-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 240px;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
        }

        .search-input {
          width: 100%;
          padding: 9px 36px 9px 38px;
          background: var(--form-input-bg);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          font-size: 0.88rem;
          color: var(--text-primary);
          transition: all var(--transition-fast);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }

        .clear-search-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.2rem;
          cursor: pointer;
        }

        .view-mode-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .view-mode-btn {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          color: var(--text-secondary);
          padding: 7px 14px;
          border-radius: var(--radius-md);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all var(--transition-fast);
        }

        .view-mode-btn:hover {
          color: var(--text-primary);
          background: var(--bg-card-hover);
        }

        .view-mode-btn.active {
          background: var(--primary-glow);
          color: var(--text-primary);
          border-color: var(--primary);
        }

        .tabs-wrapper {
          display: flex;
          padding: 5px;
          border-radius: var(--radius-md);
          overflow-x: auto;
          gap: 4px;
          scrollbar-width: none;
          background: var(--bg-card);
        }

        .tab-btn {
          background: transparent;
          border: none;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.86rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .tab-btn:hover {
          color: var(--text-primary);
          background: var(--bg-card-hover);
        }

        .tab-btn.active {
          color: white;
          background: var(--primary-gradient);
          box-shadow: 0 4px 12px var(--primary-glow);
        }

        .today-pill {
          position: relative;
        }

        .today-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .tab-badge {
          background: rgba(148, 163, 184, 0.25);
          color: var(--text-primary);
          font-size: 0.72rem;
          padding: 1px 7px;
          border-radius: 99px;
          font-weight: 700;
        }

        /* Graphical Cards */
        .weekly-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 18px;
        }

        .day-column {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: var(--bg-surface);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          box-shadow: var(--glass-shadow);
          min-height: 320px;
        }

        .day-column-today {
          border: 2px solid var(--primary);
          background: var(--bg-surface);
          box-shadow: 0 0 20px var(--primary-glow);
        }

        .day-column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 10px;
        }

        .day-classes-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .graphical-class-card {
          position: relative;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          overflow: hidden;
          cursor: pointer;
          background: var(--bg-card);
          transition: all var(--transition-fast);
          display: flex;
          box-shadow: var(--glass-shadow);
        }

        .graphical-class-card:hover {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12), 0 0 18px var(--card-accent);
          border-color: var(--card-accent);
          transform: translateY(-2px);
        }

        .card-accent-strip {
          width: 5px;
          flex-shrink: 0;
        }

        .graphical-card-body {
          flex: 1;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .graphical-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }

        .graphical-card-title {
          font-size: 0.98rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .duration-pill {
          background: var(--primary-glow);
          border: 1px solid var(--border-light);
          color: var(--text-primary);
          font-size: 0.72rem;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 99px;
          white-space: nowrap;
        }

        .graphical-time-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.83rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-base);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-light);
          width: fit-content;
        }

        .chip-icon {
          color: var(--primary);
        }

        .graphical-card-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 2px;
          padding-top: 6px;
          border-top: 1px solid var(--border-light);
        }

        .footer-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .location-chip {
          color: var(--secondary);
        }

        /* Timeline Graphical View */
        .graphical-timeline-view {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .timeline-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 12px;
        }

        .timeline-days-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .timeline-day-row {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 16px;
          padding: 12px;
          border-radius: var(--radius-lg);
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          align-items: center;
          box-shadow: var(--glass-shadow);
        }

        .timeline-day-row.is-today-row {
          border-color: var(--primary);
          background: var(--primary-glow);
        }

        .timeline-day-label {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .day-name {
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--text-primary);
        }

        .timeline-slots-container {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .timeline-slot-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-light);
          border-left: 4px solid var(--primary);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          min-width: 200px;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .timeline-slot-card:hover {
          background: var(--bg-card-hover);
          transform: translateY(-2px);
        }

        .slot-time-badge {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: 0.03em;
        }

        .slot-name {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .slot-sub {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .timeline-empty-slot {
          color: var(--text-muted);
          font-size: 0.85rem;
          font-style: italic;
          padding: 8px 0;
        }

        .day-empty-state {
          color: var(--text-muted);
          font-size: 0.82rem;
          text-align: center;
          padding: 36px 0;
          border: 1px dashed var(--border-light);
          border-radius: var(--radius-md);
        }

        @media (max-width: 768px) {
          .timetable-top-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .timeline-day-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}
