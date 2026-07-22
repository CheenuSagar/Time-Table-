import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, PlusCircle, Edit3, Sparkles } from 'lucide-react';
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
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export default function TimetableGrid({ timetable, settings, onAddClick, onEditClick }) {
  const [selectedDayTab, setSelectedDayTab] = useState('All');
  const show12h = settings?.timeFormat12h !== false;

  // Group classes by day
  const groupedClasses = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = timetable
      .filter((cls) => cls.day === day)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    return acc;
  }, {});

  const renderClassCard = (cls) => {
    return (
      <div 
        key={cls.id} 
        className="class-card glass glass-interactive"
        style={{ '--card-accent': cls.color || '#6366f1' }}
        onClick={() => onEditClick(cls)}
      >
        <div className="card-accent-bar" style={{ backgroundColor: cls.color || '#6366f1', boxShadow: `0 0 10px ${cls.color || '#6366f1'}` }}></div>
        <div className="card-body">
          <div className="card-header">
            <h4 className="card-subject">{cls.name}</h4>
            <button className="card-edit-btn" aria-label={`Edit ${cls.name}`}>
              <Edit3 size={14} />
            </button>
          </div>
          
          <div className="card-time-row">
            <Clock size={13} className="card-icon" />
            <span>{show12h ? formatTimeTo12Hr(cls.startTime) : cls.startTime} - {show12h ? formatTimeTo12Hr(cls.endTime) : cls.endTime}</span>
          </div>

          {(cls.teacher || cls.location) && (
            <div className="card-details">
              {cls.teacher && (
                <div className="card-detail-item">
                  <User size={13} className="card-icon" />
                  <span>{cls.teacher}</span>
                </div>
              )}
              {cls.location && (
                <div className="card-detail-item">
                  <MapPin size={13} className="card-icon" />
                  <span className="location-text">{cls.location}</span>
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
      {/* Header & Tabs Control */}
      <div className="tab-control-row">
        <div className="tabs-wrapper glass">
          <button 
            className={`tab-btn ${selectedDayTab === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedDayTab('All')}
          >
            All Week
          </button>
          {DAYS_OF_WEEK.map((day) => {
            const count = groupedClasses[day].filter(isActualLecture).length;
            return (
              <button 
                key={day} 
                className={`tab-btn ${selectedDayTab === day ? 'active' : ''}`}
                onClick={() => setSelectedDayTab(day)}
              >
                {day.substring(0, 3)}
                {count > 0 && <span className="tab-badge">{count}</span>}
              </button>
            );
          })}
        </div>

        <button className="btn btn-primary" onClick={onAddClick}>
          <PlusCircle size={16} /> Add Class
        </button>
      </div>

      {/* Grid Content Area */}
      <div className="timetable-content-area">
        {selectedDayTab === 'All' ? (
          <div className="weekly-grid">
            {DAYS_OF_WEEK.map((day) => {
              const dayClasses = groupedClasses[day];
              const actualCount = dayClasses.filter(isActualLecture).length;
              return (
                <div key={day} className="day-column glass">
                  <div className="day-column-header">
                    <h3>{day}</h3>
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
                {groupedClasses[selectedDayTab].filter(isActualLecture).length} {groupedClasses[selectedDayTab].filter(isActualLecture).length === 1 ? 'lecture' : 'lectures'}
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
                <p>Add classes to plan your {selectedDayTab} schedule and receive automatic alerts.</p>
                <button className="btn btn-secondary btn-sm" onClick={onAddClick}>
                  <PlusCircle size={14} /> Add Class
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .timetable-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .tab-control-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .tabs-wrapper {
          display: flex;
          padding: 4px;
          border-radius: var(--radius-md);
          overflow-x: auto;
          max-width: 100%;
        }
        .tab-btn {
          background: transparent;
          border: none;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.88rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .tab-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        .tab-btn.active {
          color: white;
          background: var(--primary-gradient);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        .tab-badge {
          background: rgba(255, 255, 255, 0.18);
          color: white;
          font-size: 0.72rem;
          padding: 1px 7px;
          border-radius: 99px;
          font-weight: 700;
        }
        .timetable-content-area {
          width: 100%;
        }
        .weekly-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 18px;
          align-items: start;
        }
        .day-column {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: rgba(12, 18, 34, 0.5);
          min-height: 300px;
        }
        .day-column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 10px;
        }
        .day-column-header h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: white;
        }
        .day-classes-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .day-empty-state {
          color: var(--text-muted);
          font-size: 0.82rem;
          text-align: center;
          padding: 36px 0;
          border: 1px dashed var(--border-light);
          border-radius: var(--radius-md);
        }
        
        /* Class Card */
        .class-card {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          cursor: pointer;
          background: rgba(20, 29, 48, 0.6);
          transition: all var(--transition-fast);
        }
        .class-card:hover {
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5), 0 0 16px var(--card-accent);
          border-color: var(--card-accent);
          transform: translateY(-2px);
        }
        .card-accent-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 5px;
        }
        .card-body {
          padding: 12px 14px 12px 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }
        .card-subject {
          font-size: 0.98rem;
          font-weight: 700;
          color: white;
          line-height: 1.25;
        }
        .card-edit-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all var(--transition-fast);
          display: flex;
        }
        .class-card:hover .card-edit-btn {
          color: var(--text-primary);
        }
        .card-edit-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .card-time-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: var(--text-secondary);
          font-weight: 600;
        }
        .card-icon {
          color: var(--text-muted);
        }
        .class-card:hover .card-icon {
          color: var(--text-secondary);
        }
        .card-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 6px;
          margin-top: 4px;
        }
        .card-detail-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: var(--text-muted);
        }
        .location-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }

        /* Single Day View */
        .single-day-view {
          padding: 26px;
        }
        .single-day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 14px;
        }
        .single-day-header h2 {
          font-size: 1.4rem;
          color: white;
        }
        .single-day-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 18px;
        }
        .single-day-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          gap: 14px;
        }
        .single-day-empty h3 {
          font-size: 1.15rem;
          color: var(--text-primary);
        }
        .single-day-empty p {
          font-size: 0.92rem;
          color: var(--text-secondary);
          max-width: 360px;
          line-height: 1.5;
        }
        
        @media (max-width: 768px) {
          .tab-control-row {
            flex-direction: column;
            align-items: stretch;
          }
          .tabs-wrapper {
            order: 2;
          }
          .btn-primary {
            order: 1;
            width: 100%;
          }
          .weekly-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
