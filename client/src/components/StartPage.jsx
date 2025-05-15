import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import '../styles/custom.css';
import { useTranslation } from 'react-i18next';
const DEFAULT = {
  STATUS: 'idle',
  STATUS_MESSAGE: {
    code: 'idle',
    message: '',
    vars: {}
  },
}

function StartPage() {
  const { t } = useTranslation('common');
  const { createSession, joinSession, loading, checkSession } = useSession();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(DEFAULT.STATUS); // idle | checking | valid | invalid
  const [statusMessage, setStatusMessage] = useState(DEFAULT.STATUS_MESSAGE);
  const [currentStatusMessage, setCurrentStatusMessage] = useState('');
  const inputRefs = useRef([]);
  const joinBtnRef = useRef(null);
  const checkTimeout = useRef(null);

  // Not great to modify the default status message, but it needs to be translated
  DEFAULT.STATUS_MESSAGE = {
    code: 'idle',
    message: t('startPage.idle.message'),
    vars: {}
  };

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Focus join button when status becomes valid
  useEffect(() => {
    console.log('status', status);
    if (status === 'idle') {
      setStatusMessage(DEFAULT.STATUS_MESSAGE);
    }

    if (status === 'valid' && joinBtnRef.current) {
      setTimeout(() => {
        setStatusMessage({ code: status, message: t('startPage.valid.message'), vars: {} });
        joinBtnRef.current.focus();
      }, 200);
    } else if (status === 'invalid') {
      const currentCode = code.join('');
      setCode(['', '', '', '', '', '']);
      setTimeout(() => {
        setStatusMessage({ code: status, message: t('startPage.invalid.message'), vars: { code: currentCode } });
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 200);
    }
  }, [status]);

  // Reset error and status on code change
  useEffect(() => {
    // console.log('code', code);
    if (status !== 'idle') setStatus('idle');
    if (error) setError('');
    // resetStatusMessage();
    // eslint-disable-next-line
  }, [code.join('')]);

  // Set current status message when status message changes
  useEffect(() => {
    // if no code, set current status message to empty string
    if (!statusMessage.code) {
      setCurrentStatusMessage('');
    } else {
      // right now code doesn't matter, mostly for debugging
      let message = statusMessage.message;
      // if statusMessage.vars is not empty, replace the message with the vars
      if (Object.keys(statusMessage.vars).length > 0) {
        message = message.replace(/\{([^{}]+)\}/g, (match, p1) => statusMessage.vars[p1] || match);
      }
      setCurrentStatusMessage(message);
    }
  }, [statusMessage]);

  const resetCode = () => {
    // console.log('resetting code', code);
    setCode(['', '', '', '', '', '']);
    setError('');
    setStatus('idle');
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  };

  const resetStatusMessage = () => {
    setStatusMessage({ code: '', message: '', vars: {} });
  };

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    if (newCode.every(digit => digit) && newCode.join('').length === 6) {
      checkSessionCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
    // Allow Enter to trigger join if join button is visible and focused
    if (e.key === 'Enter' && status === 'valid' && joinBtnRef.current) {
      joinBtnRef.current.click();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) {
      setError('Please paste a valid 6-digit code');
      toast.error('Please paste a valid 6-digit code');
      return;
    }
    const digits = pastedData.split('');
    setCode(digits);
    inputRefs.current[5].focus();
    checkSessionCode(pastedData);
  };

  // Simulate async session code check (replace with real API call if needed)
  const checkSessionCode = async (sessionCode) => {
    // Wait for 100ms to ensure the code is updated
    await new Promise(res => setTimeout(res, 100));
    setStatus('checking');
    setError('');
    // Disable all inputs/buttons
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    try {
      // Simulate network delay
      await new Promise(res => setTimeout(res, 1500));
      // Check if the session is valid
      const sessionIsValid = await checkSession(sessionCode);
      setStatus(sessionIsValid ? 'valid' : 'invalid');
    } catch (err) {
      setStatus('invalid');
      setError(err.message || 'Invalid or expired session code');
      toast.error(err.message || 'Invalid or expired session code');
      // // Show red X for 0.5s, then reset
      // checkTimeout.current = setTimeout(() => {
      //   resetCode();
      // }, 500);
    }
  };

  const handleJoin = async () => {
    if (status !== 'valid') return;
    try {
      setStatus('checking');
      await joinSession(code.join(''));
      // Navigation should happen in joinSession
    } catch (err) {
      setStatus('invalid');
      setError(err.message || 'Invalid or expired session code');
      toast.error(err.message || 'Invalid or expired session code');
      checkTimeout.current = setTimeout(() => {
        resetCode();
      }, 500);
    }
  };

  const handleContainerClick = (e) => {
    if (status === 'checking') return;
    const target = e.target;
    const isInteractive = target.tagName === 'INPUT' || 
                         target.tagName === 'BUTTON' || 
                         target.closest('button') !== null;
    if (!isInteractive && inputRefs.current[0]) {
      e.preventDefault();
      e.stopPropagation();
      inputRefs.current[0].focus();
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeout.current) clearTimeout(checkTimeout.current);
    };
  }, []);

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4"
      role="main"
      aria-label="CrossClip Start Page"
      onClick={handleContainerClick}
    >
      <div className="flex flex-col items-center w-full max-w-md mb-16">
        <h1 className="w-full text-right text-3xl font-bold mb-2">{t('startPage.title')}</h1>
        <p className="w-full text-md md:text-large text-gray-500 text-right border-t border-dashed border-t-4 border-gray-700 pt-2" dangerouslySetInnerHTML={{ __html: t('startPage.titleDescription') }} />
      </div>
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <div className="w-full">
          <h2 
            className="text-xl md:text-2xl font-semibold text-blue-800 mb-4"
            id="join-heading"
          >
            {t('startPage.join.inputsHeading')}
          </h2>
          <div 
            className="flex gap-2 justify-center mb-4 relative"
            onPaste={handlePaste}
            role="group"
            aria-labelledby="join-heading"
            aria-describedby={error ? "error-message" : undefined}
          >
            {[0,1,2,3,4,5].map((i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={code[i]}
                onChange={(e) => handleInputChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={clsx(
                  'w-14 h-20 text-amber-500 font-semibold text-4xl text-center rounded border-2 border-white focus:border-blue-600 bg-transparent outline-none transition-colors duration-150',
                  status === 'checking' && 'animate-pulse',
                  status === 'valid' && 'border-green-600',
                )}
                tabIndex={0}
                aria-label={`Digit ${i + 1} of 6`}
                aria-required="true"
                aria-invalid={error ? "true" : "false"}
                disabled={status === 'checking' || status === 'valid'}
              />
            ))}
            {/* Create a wrapper div to avoid flashing when any of the status elements are rendered */}
            <div className="w-14 h-20 flex items-center justify-center ml-2 text-center rounded border-2 border-dashed border-transparent bg-transparent outline-none transition-colors duration-150">
              {
                status === 'idle' && code.join('').length < 6 && (
                  <span className="text-8xl font-bold text-primary-900 mb-8 select-none animate-pulse">&#8592;</span>
                )
              }
              {status === 'checking' && (
                <div className="w-12 h-16 md:w-14 md:h-20 flex items-center justify-center ml-2 animate-spin">
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                </div>
              )}
              {status === 'invalid' && (
                <div className="w-full h-full flex items-center justify-center bg-red-600 rounded border-2 border-white animate-fade-in-out" aria-label="Invalid code" tabIndex={-1}>
                  <span className="text-4xl font-bold text-white select-none">X</span>
                </div>
              )}
              {status === 'valid' && (
                <button
                  ref={joinBtnRef}
                  className="w-full h-full flex flex-col items-center justify-center bg-green-600 rounded border-2 border-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  aria-label="Join session"
                  tabIndex={0}
                  onClick={handleJoin}
                  onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
                  disabled={status !== 'valid'}
                >
                  <span className="text-4xl font-bold text-white select-none text-shadow-sm">↵</span>
                  <span className="text-xxs font-bold text-white select-none mt-1 uppercase text-shadow-sm">{t('actions.join')}</span>
                </button>
              )}
            </div>
          </div>
          {currentStatusMessage && (
            <p 
              id="status-message" 
              className={clsx(
                'text-md text-center mb-4',
                statusMessage.code === 'invalid' && 'text-red-500',
                statusMessage.code === 'valid' && 'text-green-500',
                (statusMessage.code === 'checking' || statusMessage.code === 'idle') && 'text-blue-500'
              )}
              role={status === 'invalid' ? 'alert' : 'status'}
              aria-live={status === 'invalid' ? 'assertive' : 'polite'}
              dangerouslySetInnerHTML={{ __html: currentStatusMessage }}
            />
          )}
        </div>
        <div className="flex flex-col items-center gap-4 w-full">
          <span 
            className="text-lg md:text-xl text-blue-600 italic mb-2"
            aria-hidden="true"
          >
            {t('startPage.or')}
          </span>
          <button
            onClick={createSession}
            disabled={loading || status === 'checking'}
            className="w-full md:w-auto px-8 py-3 text-lg md:text-xl rounded border border-white hover:bg-white hover:text-gray-900 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={loading ? "Creating new clipboard..." : "Create a new clipboard"}
          >
            {loading ? t('actions.loading') : t('actions.createNewOne')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StartPage; 