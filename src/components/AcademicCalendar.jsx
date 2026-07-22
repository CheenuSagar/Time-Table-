import React, { useState } from 'react';
import { 
  CalendarDays, Calendar, Clock, AlertCircle, PlusCircle, Search, 
  Award, ShieldAlert, Sparkles, CheckCircle2, PartyPopper, BookOpen, FileText, Check, Trash2, X, List, Table, Filter
} from 'lucide-react';

const CATEGORIES = ['All', 'Exams', 'Assignments & Reviews', 'Holidays', 'Lab & Viva', 'Sem Commencement'];

export default function AcademicCalendar({ events, onSaveEvents, isAdmin, verifyAdminAction }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'official-table' | 'holidays'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Form State for Add/Edit
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Exams');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [details, setDetails] = useState('');
  const [badgeColor, setBadgeColor] = useState('#ef4444');

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to calculate days remaining
  const getDaysDiff = (targetDateStr) => {
    const today = new Date(todayStr);
    const target = new Date(targetDateStr);
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper to format date string nicely
  const formatDateNice = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const matchesCategory = selectedCategory === 'All' || ev.category === selectedCategory;
    const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ev.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  // Group events by Month
  const eventsByMonth = filteredEvents.reduce((acc, ev) => {
    const dateObj = new Date(ev.startDate);
    const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(ev);
    return acc;
  }, {});

  // Find next upcoming critical event
  const upcomingEvents = events
    .filter(ev => getDaysDiff(ev.startDate) >= 0)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
  const nextEvent = upcomingEvents[0];

  // Holidays List
  const holidaysList = events.filter(e => e.category === 'Holidays').sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const handleOpenAdd = async () => {
    if (verifyAdminAction) {
      await verifyAdminAction(() => {
        setEditingEvent(null);
        setTitle('');
        setCategory('Exams');
        setStartDate(todayStr);
        setEndDate(todayStr);
        setDetails('');
        setBadgeColor('#ef4444');
        setIsAddModalOpen(true);
      });
    }
  };

  const handleOpenEdit = async (ev) => {
    if (verifyAdminAction) {
      await verifyAdminAction(() => {
        setEditingEvent(ev);
        setTitle(ev.title);
        setCategory(ev.category);
        setStartDate(ev.startDate);
        setEndDate(ev.endDate || ev.startDate);
        setDetails(ev.details || '');
        setBadgeColor(ev.badgeColor || '#ef4444');
        setIsAddModalOpen(true);
      });
    }
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    let updatedList;
    if (editingEvent) {
      updatedList = events.map(ev => ev.id === editingEvent.id ? {
        ...ev,
        title: title.trim(),
        category,
        startDate,
        endDate: endDate || startDate,
        details: details.trim(),
        badgeColor
      } : ev);
    } else {
      const newEv = {
        id: 'custom-ev-' + Date.now(),
        title: title.trim(),
        category,
        startDate,
        endDate: endDate || startDate,
        details: details.trim(),
        badgeColor
      };
      updatedList = [...events, newEv];
    }

    onSaveEvents(updatedList);
    setIsAddModalOpen(false);
  };

  const handleDeleteEvent = (id) => {
    if (confirm('Are you sure you want to delete this event?')) {
      const updated = events.filter(ev => ev.id !== id);
      onSaveEvents(updated);
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="academic-container animate-fade-in">
      {/* Top Banner & Title */}
      <div className="academic-header glass">
        <div className="header-info">
          <div className="official-ref-pill">
            <Sparkles size={14} /> ABES Engineering College • Ref: ABES/Acad.cal/RO-A/ 311 /2026
          </div>
          <h1 className="header-title gradient-text">Academic Calendar (ODD Sem 2026-27)</h1>
          <p className="header-subtitle">Official schedule for Exams, Assignments, Project Reviews, and Holidays for MCA Students.</p>
        </div>

        <div className="header-right-actions">
          {/* View Mode Switcher */}
          <div className="view-mode-buttons glass">
            <button 
              className={`mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              <List size={15} /> Monthly Timeline
            </button>
            <button 
              className={`mode-btn ${viewMode === 'official-table' ? 'active' : ''}`}
              onClick={() => setViewMode('official-table')}
            >
              <Table size={15} /> Official Table
            </button>
            <button 
              className={`mode-btn ${viewMode === 'holidays' ? 'active' : ''}`}
              onClick={() => setViewMode('holidays')}
            >
              <PartyPopper size={15} /> Holidays ({holidaysList.length})
            </button>
          </div>

          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              <PlusCircle size={15} /> Add Event
            </button>
          )}
        </div>
      </div>

      {/* Mandatory Attendance Notice */}
      <div className="notice-banner glass">
        <ShieldAlert size={20} className="text-warning" />
        <div className="notice-text">
          <strong>Mandatory Regulation:</strong> Minimum <strong>75% Attendance</strong> is required to appear in STs / MTs / PUEs / Make-up Exams / End Term Exams.
        </div>
      </div>

      {/* Next Upcoming Milestone Hero Card */}
      {nextEvent && (
        <div className="next-milestone-card glass">
          <div className="milestone-badge-row">
            <span className="badge badge-live"><span className="live-dot"></span> UPCOMING MILESTONE</span>
            <span className="milestone-cat" style={{ backgroundColor: `${nextEvent.badgeColor}20`, color: nextEvent.badgeColor, border: `1px solid ${nextEvent.badgeColor}40` }}>
              {nextEvent.category}
            </span>
          </div>

          <div className="milestone-content">
            <div>
              <h2 className="milestone-title">{nextEvent.title}</h2>
              <p className="milestone-details">{nextEvent.details}</p>
            </div>

            <div className="milestone-countdown">
              <span className="countdown-days">{getDaysDiff(nextEvent.startDate)}</span>
              <span className="countdown-unit">Days Remaining</span>
              <span className="milestone-date-text">
                <Calendar size={14} /> {formatDateNice(nextEvent.startDate)} {nextEvent.endDate && nextEvent.endDate !== nextEvent.startDate ? ` - ${formatDateNice(nextEvent.endDate)}` : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: MONTHLY TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="timeline-view-wrapper animate-fade-in">
          {/* Controls Bar */}
          <div className="controls-row">
            <div className="category-tabs glass">
              {CATEGORIES.map((cat) => (
                <button 
                  key={cat} 
                  className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="search-box glass">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search exam, holiday, date..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Grouped Month Sections */}
          {Object.keys(eventsByMonth).length > 0 ? (
            Object.keys(eventsByMonth).map((monthYear) => (
              <div key={monthYear} className="month-group-section">
                <div className="month-header-bar">
                  <CalendarDays size={18} className="text-primary" />
                  <h2>{monthYear}</h2>
                  <span className="month-count-badge">{eventsByMonth[monthYear].length} Events</span>
                </div>

                <div className="events-list-readable">
                  {eventsByMonth[monthYear].map((ev) => {
                    const diffDays = getDaysDiff(ev.startDate);
                    const isPast = diffDays < 0;
                    const isToday = diffDays === 0;

                    return (
                      <div 
                        key={ev.id} 
                        className={`readable-event-row glass ${isPast ? 'past-row' : ''}`}
                        onClick={() => isAdmin && handleOpenEdit(ev)}
                      >
                        {/* Date Pill */}
                        <div className="event-date-box" style={{ borderLeftColor: ev.badgeColor || '#6366f1' }}>
                          <span className="date-main-text">
                            {new Date(ev.startDate).getDate()}
                          </span>
                          <span className="date-sub-text">
                            {new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                        </div>

                        {/* Title & Details */}
                        <div className="event-main-info">
                          <div className="event-top-tags">
                            <span 
                              className="cat-pill" 
                              style={{ backgroundColor: `${ev.badgeColor || '#6366f1'}20`, color: ev.badgeColor || '#6366f1', border: `1px solid ${ev.badgeColor || '#6366f1'}40` }}
                            >
                              {ev.category}
                            </span>
                            {ev.endDate && ev.endDate !== ev.startDate && (
                              <span className="range-pill">Duration: {formatDateNice(ev.startDate)} to {formatDateNice(ev.endDate)}</span>
                            )}
                          </div>
                          <h3 className="readable-event-title">{ev.title}</h3>
                          <p className="readable-event-desc">{ev.details}</p>
                        </div>

                        {/* Countdown Pill */}
                        <div className="event-countdown-box">
                          <span className={`status-badge-big ${isToday ? 'status-today' : isPast ? 'status-past' : 'status-future'}`}>
                            {isToday ? 'TODAY' : isPast ? 'PAST' : `${diffDays} DAYS LEFT`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-events glass">
              <Calendar size={40} style={{ color: 'var(--text-muted)' }} />
              <p>No academic events found matching your filter criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: OFFICIAL ABES PDF TABLE VIEW */}
      {viewMode === 'official-table' && (
        <div className="official-table-wrapper glass animate-scale-in">
          <div className="table-header-info">
            <h2 className="table-heading">ABES MCA Official Semester Calendar (Side-by-Side Comparison)</h2>
            <p className="table-subtext">Exact schedule comparing MCA 3rd Semester and MCA 1st Semester dates.</p>
          </div>

          <div className="table-responsive">
            <table className="official-mca-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Particulars</th>
                  <th style={{ width: '30%', color: '#60a5fa' }}>MCA 3rd Sem (Current)</th>
                  <th style={{ width: '30%', color: '#34d399' }}>MCA 1st Sem</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Induction / Commencement of Classes</strong></td>
                  <td><span className="table-highlight-green">16/07/2026</span></td>
                  <td>17/08/2026</td>
                </tr>
                <tr>
                  <td><strong>Assessment 1 / Project Review-1</strong></td>
                  <td>Last week of July</td>
                  <td>First week of Sept</td>
                </tr>
                <tr>
                  <td><strong>Assessment 2 / Project Review-2</strong></td>
                  <td>Second week of Aug</td>
                  <td>Third week of Sept</td>
                </tr>
                <tr className="exam-row-highlight">
                  <td><strong className="text-danger">MT-1 / ST-1 Theory Exam</strong></td>
                  <td><strong className="text-danger">21/09/2026 to 25/09/2026</strong></td>
                  <td><strong className="text-danger">21/09/2026 to 25/09/2026</strong></td>
                </tr>
                <tr>
                  <td><strong>Evaluation of MT-1/ST-1 Answer Sheets</strong></td>
                  <td>30/09/2026</td>
                  <td>30/09/2026</td>
                </tr>
                <tr>
                  <td><strong>Practical Assessment-I (In regular labs)</strong></td>
                  <td>14-18/09/2026</td>
                  <td>5-9/10/2026</td>
                </tr>
                <tr>
                  <td><strong>Assessment 3 / Project Review-3</strong></td>
                  <td>Last week of Sept</td>
                  <td>Second week of Oct</td>
                </tr>
                <tr>
                  <td><strong>Assessment 4 / Project Review-4</strong></td>
                  <td>Second week of Oct</td>
                  <td>Third week of Oct</td>
                </tr>
                <tr className="exam-row-highlight">
                  <td><strong className="text-danger">MT-2 / ST-2 Theory Exam</strong></td>
                  <td><strong className="text-danger">29/10/2026 to 05/11/2026</strong></td>
                  <td><strong className="text-danger">29/10/2026 to 05/11/2026</strong></td>
                </tr>
                <tr>
                  <td><strong>Evaluation of MT-2/ST-2 Answer Sheets</strong></td>
                  <td>18/11/2026</td>
                  <td>18/11/2026</td>
                </tr>
                <tr>
                  <td><strong>Practical Assessment-II (In regular labs)</strong></td>
                  <td>16-20/11/2026</td>
                  <td>16-20/11/2026</td>
                </tr>
                <tr>
                  <td><strong>Assessment 5</strong></td>
                  <td>Last week of Nov</td>
                  <td>Last week of Nov</td>
                </tr>
                <tr>
                  <td><strong>Make-up / ST-3 Theory Exam</strong></td>
                  <td>7-12/12/2026</td>
                  <td>7-12/12/2026</td>
                </tr>
                <tr className="final-exam-row">
                  <td><strong className="text-danger-bright">End Term / End Semester Theory Exam</strong></td>
                  <td><strong className="text-danger-bright">21 Dec 2026 - 15 Jan 2027</strong></td>
                  <td><strong className="text-danger-bright">21 Dec 2026 - 15 Jan 2027</strong></td>
                </tr>
                <tr className="final-exam-row">
                  <td><strong className="text-danger-bright">End Term / Practical & Viva Exam</strong></td>
                  <td><strong className="text-danger-bright">21 Dec 2026 - 15 Jan 2027</strong></td>
                  <td><strong className="text-danger-bright">21 Dec 2026 - 15 Jan 2027</strong></td>
                </tr>
                <tr>
                  <td><strong>Registration & EVEN Semester Commencement</strong></td>
                  <td colSpan="2" style={{ textAlign: 'center', fontWeight: 700, color: 'var(--secondary)' }}>
                    --- January 2027 (Tentative) ---
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: HOLIDAYS DIRECTORY */}
      {viewMode === 'holidays' && (
        <div className="holidays-view-wrapper glass animate-scale-in">
          <div className="holidays-header">
            <PartyPopper size={24} className="text-primary" />
            <div>
              <h2>Official ABES College Holidays List (Session 2026-27)</h2>
              <p>Total {holidaysList.length} gazetted festival breaks and national holidays.</p>
            </div>
          </div>

          <div className="holidays-grid-list">
            {holidaysList.map((hol) => (
              <div key={hol.id} className="holiday-item-card glass">
                <div className="holiday-date-badge">
                  <Calendar size={16} />
                  <span>{formatDateNice(hol.startDate)} {hol.endDate && hol.endDate !== hol.startDate ? ` - ${formatDateNice(hol.endDate)}` : ''}</span>
                </div>
                <h3 className="holiday-name">{hol.title}</h3>
                <span className="holiday-desc">{hol.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official Examination Rules Table */}
      <div className="weightage-card glass">
        <h3 className="weightage-title">
          <Award size={18} className="text-primary" /> Examination Weightage & Syllabus Rules (Under Autonomy)
        </h3>

        <div className="table-responsive">
          <table className="weightage-table">
            <thead>
              <tr>
                <th>Name of Exam</th>
                <th>MT-1 / ST-1</th>
                <th>MT-2 / ST-2</th>
                <th>Make-up Exam</th>
                <th>End Term Exam</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Duration</strong></td>
                <td>1 hr 15 min</td>
                <td>1 hr 15 min</td>
                <td>1 hr 15 min</td>
                <td>2 hrs</td>
              </tr>
              <tr>
                <td><strong>Syllabus Coverage</strong></td>
                <td>1.5 Units</td>
                <td>1.5 Units</td>
                <td>3 Units</td>
                <td>5 Units (Full)</td>
              </tr>
              <tr>
                <td><strong>Weightage</strong></td>
                <td>15 Marks</td>
                <td>15 Marks</td>
                <td>15 Marks</td>
                <td>40 Marks</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Event Modal (Admin Mode) */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container glass animate-scale-in">
            <div className="modal-header">
              <h3>{editingEvent ? 'Edit Academic Event' : 'Add New Academic Event'}</h3>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="modal-body">
              <div className="form-group">
                <label className="form-label">Event Title *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sessional-1 Exam, Project Viva"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Color Accent</label>
                  <input 
                    type="color" 
                    className="form-input" 
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    style={{ height: '42px', padding: '2px 6px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Start Date *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">End Date (Optional)</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Event Details & Notes</label>
                <textarea 
                  className="form-input" 
                  rows="3"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Add details, room numbers, or guidelines..."
                ></textarea>
              </div>

              <div className="modal-footer">
                {editingEvent && (
                  <button 
                    type="button" 
                    className="btn btn-danger btn-sm mr-auto"
                    onClick={() => handleDeleteEvent(editingEvent.id)}
                  >
                    <Trash2 size={14} /> Delete Event
                  </button>
                )}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .academic-container {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .academic-header {
          padding: 24px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .official-ref-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--secondary);
          letter-spacing: 0.06em;
          margin-bottom: 6px;
        }
        .header-title {
          font-size: 1.8rem;
          font-weight: 800;
        }
        .header-subtitle {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        .header-right-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .view-mode-buttons {
          display: flex;
          padding: 4px;
          border-radius: var(--radius-md);
        }
        .mode-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .mode-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        .mode-btn.active {
          color: white;
          background: var(--primary-gradient);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .notice-banner {
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .notice-text {
          font-size: 0.88rem;
          color: #fef08a;
        }

        .next-milestone-card {
          padding: 24px 28px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%);
          border: 1px solid rgba(99, 102, 241, 0.3);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .milestone-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .milestone-cat {
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .milestone-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          flex-wrap: wrap;
        }
        .milestone-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 6px;
        }
        .milestone-details {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        .milestone-countdown {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .countdown-days {
          font-size: 2.6rem;
          font-weight: 900;
          font-family: var(--font-heading);
          color: #f87171;
          line-height: 1;
        }
        .countdown-unit {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 700;
        }
        .milestone-date-text {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: var(--text-primary);
          margin-top: 6px;
          font-weight: 600;
        }

        .controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .category-tabs {
          display: flex;
          gap: 6px;
          padding: 4px;
          border-radius: var(--radius-md);
          overflow-x: auto;
        }
        .cat-tab {
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .cat-tab:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        .cat-tab.active {
          color: white;
          background: var(--primary-gradient);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        .search-box {
          display: flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: var(--radius-md);
          gap: 8px;
          min-width: 260px;
        }
        .search-icon {
          color: var(--text-muted);
        }
        .search-input {
          background: transparent;
          border: none;
          color: white;
          font-size: 0.88rem;
          width: 100%;
        }
        .search-input:focus {
          outline: none;
        }

        /* Readable Month Group Section */
        .month-group-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 10px;
        }
        .month-header-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(99, 102, 241, 0.3);
        }
        .month-header-bar h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
        }
        .month-count-badge {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--secondary);
          background: rgba(6, 182, 212, 0.12);
          padding: 2px 8px;
          border-radius: 99px;
        }

        /* Readable Event Row */
        .events-list-readable {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .readable-event-row {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 14px 20px;
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
          cursor: pointer;
        }
        .readable-event-row:hover {
          background: rgba(30, 41, 69, 0.7);
          transform: translateX(4px);
        }
        .readable-event-row.past-row {
          opacity: 0.5;
        }
        .event-date-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 64px;
          padding: 6px 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: var(--radius-md);
          border-left: 4px solid var(--primary);
        }
        .date-main-text {
          font-size: 1.4rem;
          font-weight: 900;
          font-family: var(--font-heading);
          color: white;
          line-height: 1;
        }
        .date-sub-text {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        .event-main-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .event-top-tags {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cat-pill {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 99px;
        }
        .range-pill {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .readable-event-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
        }
        .readable-event-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .event-countdown-box {
          min-width: 100px;
          text-align: right;
        }
        .status-badge-big {
          font-size: 0.78rem;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 99px;
          letter-spacing: 0.04em;
        }
        .status-today {
          background: rgba(16, 185, 129, 0.18);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.35);
        }
        .status-future {
          background: rgba(99, 102, 241, 0.18);
          color: #a5b4fc;
          border: 1px solid rgba(99, 102, 241, 0.35);
        }
        .status-past {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
        }

        /* Official Table Mode */
        .official-table-wrapper {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .table-heading {
          font-size: 1.2rem;
          font-weight: 800;
          color: white;
        }
        .table-subtext {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .official-mca-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.9rem;
        }
        .official-mca-table th, .official-mca-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-light);
        }
        .official-mca-table th {
          background: rgba(255, 255, 255, 0.05);
          font-weight: 700;
        }
        .table-highlight-green {
          color: #34d399;
          font-weight: 700;
        }
        .exam-row-highlight {
          background: rgba(239, 68, 68, 0.1);
        }
        .final-exam-row {
          background: rgba(239, 68, 68, 0.18);
        }
        .text-danger-bright {
          color: #f87171 !important;
        }

        /* Holidays Mode */
        .holidays-view-wrapper {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .holidays-header {
          display: flex;
          align-items: center;
          gap: 14px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 14px;
        }
        .holidays-header h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
        }
        .holidays-header p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .holidays-grid-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .holiday-item-card {
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-left: 4px solid #ec4899;
        }
        .holiday-date-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #f472b6;
          font-weight: 700;
        }
        .holiday-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
        }
        .holiday-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .weightage-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .weightage-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .table-responsive {
          overflow-x: auto;
        }
        .weightage-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.88rem;
        }
        .weightage-table th, .weightage-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-light);
        }
        .weightage-table th {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-secondary);
          font-weight: 700;
        }
        .weightage-table td {
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .readable-event-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .event-countdown-box {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
