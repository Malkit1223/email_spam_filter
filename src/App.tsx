import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'https://9fe5de3bb5ca.ngrok-free.app/api/';

interface Email {
  id: number;
  sender: string;
  subject: string;
  content: string;
  is_spam: boolean;
  user_feedback: boolean | null;
  created_at: string;
}

interface ApiResponse {
  status: string;
  is_spam?: boolean;
  id?: number;
  message?: string;
}

function App() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [sender, setSender] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchEmails();
  }, []);

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const fetchEmails = async () => {
    try {
      const res = await axios.get<Email[]>(API_BASE + 'emails/');
      setEmails(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post<ApiResponse>(API_BASE + 'submit/', {
        sender,
        subject,
        content,
      });
      if (res.data.status === 'success') {
        setAlertMessage(res.data.is_spam ? 'Email classified as SPAM!' : 'Email classified as HAM!');
        setSender('');
        setSubject('');
        setContent('');
        fetchEmails();
      }
    } catch (err) {
      console.error(err);
      setAlertMessage('Error submitting email');
    }
    setLoading(false);
  };

  const handleFeedback = async (emailId: number, feedback: boolean) => {
    try {
      const res = await axios.post<ApiResponse>(`${API_BASE}feedback/${emailId}/`, { feedback });
      if (res.data.status === 'success') {
        setAlertMessage('Feedback recorded!');
        fetchEmails();
      }
    } catch (err) {
      console.error(err);
      setAlertMessage('Error recording feedback');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Email Spam Filter with LDA</h1>
        <p>Submit an email to classify it live using Linear Discriminant Analysis.</p>
      </header>

      {alertMessage && <div className="custom-alert">{alertMessage}</div>}

      <div className="container">
        <form onSubmit={handleSubmit} className="submit-form">
          <h2>Send Test Email</h2>
          <input
            type="email"
            placeholder="Sender Email"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <textarea
            placeholder="Email Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Classifying...' : 'Send & Classify'}
          </button>
        </form>

        <div className="emails-list">
          <h2>Recent Emails ({emails.length})</h2>
          {emails.map((email) => (
            <div key={email.id} className={`email-item ${email.is_spam ? 'spam' : 'ham'}`}>
              <h3>{email.subject}</h3>
              <p><strong>From:</strong> {email.sender}</p>
              <p><strong>Content:</strong> {email.content.substring(0, 100)}...</p>
              <p><strong>Classified:</strong> {email.is_spam ? 'SPAM' : 'HAM'}</p>
              <p><strong>Feedback:</strong> {email.user_feedback === null ? 'Not provided' : email.user_feedback ? 'Correct' : 'Incorrect'}</p>
              <button onClick={() => handleFeedback(email.id, true)}>Mark Correct</button>
              <button onClick={() => handleFeedback(email.id, false)}>Mark Incorrect</button>
              <small>{new Date(email.created_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;