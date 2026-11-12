import { useEffect, useRef, useState } from 'react';
import './QuestionBank.css';
import { useAuth } from '../hooks/useAuth';
import { createBookJob, getBookQuestions, listBooks } from '../services/questionBankService';

const QuestionBank = ({ onBack, onLaunchPractice }) => {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    listBooks(user.uid).then(setBooks);
  }, [user?.uid]);

  const handleUpload = async (file) => {
    if (!file || !user?.uid) return;
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const result = await createBookJob(user.uid, file);
      setInfo(result.reused ? 'This book was already processed. Reusing the saved artifact.' : 'Book processed and saved.');
      setBooks(await listBooks(user.uid));
    } catch (err) {
      setError(err.message || 'Could not process this book.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sub-dashboard vault-dashboard fade-in-anim">
      <button className="back-home-tab-btn" onClick={onBack}>← Back to Dashboard</button>

      <div className="vault-header">
        <h2>📚 My Personal <span className="highlight-green">Vault</span></h2>
        <p>One upload creates one book. Already processed files are reused instead of being sent through AI again.</p>
      </div>

      {error && <p className="error-text">{error}</p>}
      {info && <p>{info}</p>}
      {loading && <p>Processing book...</p>}

      <div className="vault-grid">
        <div className="vault-card upload-card" onClick={() => inputRef.current?.click()}>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={(event) => handleUpload(event.target.files?.[0])}
          />
          <div className="upload-icon">➕</div>
          <h3>Upload Book / PDF</h3>
          <p>Max file size: 50MB • One book per processing job</p>
          <button className="btn-outline-green" type="button">Browse Files</button>
        </div>

        {!books.length && !loading && (
          <div className="vault-card saved-book-card">
            <h3>No books yet</h3>
            <p className="book-meta">Upload a question bank PDF to create your first vault item.</p>
          </div>
        )}

        {books.map((book) => (
          <div className="vault-card saved-book-card" key={book.id}>
            <div className="book-cover physics-cover">📘</div>
            <div className="book-details">
              <h3>{book.title || book.fileName}</h3>
              <p className="book-meta">{book.status} • {book.questionCount || 0} questions</p>
              <div className="progress-bar"><div className="fill green-fill" style={{width: book.status === 'ready' ? '100%' : '35%'}}></div></div>
              <p className="progress-text">{book.status === 'ready' ? 'Processed' : book.status}</p>
            </div>
            <button
              className="btn-primary w-100 vault-btn"
              disabled={book.status !== 'ready'}
              onClick={async () => {
                const questions = await getBookQuestions(user.uid, book);
                if (!questions.length) {
                  setError('This book has no saved questions yet.');
                  return;
                }
                onLaunchPractice?.(questions, {
                  examPattern: 'custom',
                  testDurationMinutes: 60,
                  verificationMethod: 'question-bank',
                  sourceLabel: book.title,
                  artifactId: book.artifactId || null,
                });
              }}
            >
              Practice Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionBank;
