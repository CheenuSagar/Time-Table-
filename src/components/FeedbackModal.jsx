import React, { useState } from 'react';
import { MessageSquare, X, Send, CheckCircle2, AlertCircle, Loader2, User, Mail, Tag } from 'lucide-react';

export default function FeedbackModal({ isOpen, onClose }) {
  const [senderName, setSenderName] = useState('');
  const [senderRole, setSenderRole] = useState('Student');
  const [category, setCategory] = useState('Bug Report');
  const [message, setMessage] = useState('');
  const [replyEmail, setReplyEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' }); // 'success' | 'error'

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setStatus({ type: 'error', text: 'Please enter details in the message field.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: '', text: '' });

    try {
      const response = await fetch('https://formsubmit.co/ajax/cheenusagar4@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `[LecAlert Feedback] ${category} from ${senderName || 'Anonymous'} (${senderRole})`,
          _template: 'table',
          _captcha: 'false',
          'User Name': senderName.trim() || 'Anonymous',
          'User Role': senderRole,
          'Feedback Category': category,
          'Message / Issue': message.trim(),
          'Reply Email': replyEmail.trim() || 'Not provided',
          'Submitted At': new Date().toLocaleString()
        })
      });

      if (response.ok) {
        setStatus({ 
          type: 'success', 
          text: 'Thank you! Your feedback has been sent directly to the support team.' 
        });
        setMessage('');
        setSenderName('');
        setReplyEmail('');
      } else {
        throw new Error('Failed to dispatch feedback.');
      }
    } catch (err) {
      console.error('Feedback submit error:', err);
      setStatus({ 
        type: 'error', 
        text: 'Could not send feedback. Please check your connection and try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setStatus({ type: '', text: '' });
    onClose();
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={handleModalClose}>
      <div 
        className="modal-content glass feedback-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '90%' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="icon-badge-primary">
              <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Send Feedback & Support</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Report an issue, request a feature, or share suggestions directly with the developer.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleModalClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px' }}>
          {status.type === 'success' ? (
            <div className="feedback-success-card animate-scale-up" style={{ textAlign: 'center', padding: '30px 10px' }}>
              <CheckCircle2 size={48} style={{ color: 'var(--success)', marginBottom: '12px', margin: '0 auto' }} />
              <h4>Feedback Submitted Successfully!</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                {status.text}
              </p>
              <button className="btn btn-primary btn-sm" onClick={handleModalClose}>
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Row 1: Name & Role */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} /> Your Name (Optional):
                  </label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">I am a:</label>
                  <select 
                    className="form-select"
                    value={senderRole}
                    onChange={(e) => setSenderRole(e.target.value)}
                  >
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty / Teacher</option>
                    <option value="Staff">College Staff</option>
                    <option value="Other">Guest / Other</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Category */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={14} /> Feedback Type / Category:
                </label>
                <div className="feedback-type-pills">
                  {[
                    { id: 'Bug Report', label: '🐛 Bug Report' },
                    { id: 'Schedule Error', label: '📅 Timetable Issue' },
                    { id: 'Feature Request', label: '💡 Feature Request' },
                    { id: 'General Feedback', label: '💬 General Feedback' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`feedback-pill ${category === cat.id ? 'active' : ''}`}
                      onClick={() => setCategory(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Message */}
              <div className="form-group">
                <label className="form-label">
                  Message / Issue Details <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea 
                  className="form-input"
                  rows={4}
                  placeholder="Describe your issue or feedback in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              {/* Row 4: Reply Email (Optional) */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} /> Your Email (Optional for reply):
                </label>
                <input 
                  type="email"
                  className="form-input"
                  placeholder="your.email@example.com"
                  value={replyEmail}
                  onChange={(e) => setReplyEmail(e.target.value)}
                />
              </div>

              {/* Error Alert */}
              {status.type === 'error' && (
                <div className="pin-error-msg" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={15} /> {status.text}
                </div>
              )}

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleModalClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spin-icon" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Send Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
