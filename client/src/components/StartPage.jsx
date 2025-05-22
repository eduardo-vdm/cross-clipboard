import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../contexts/SessionContext';
import { useSessionHistory } from '../hooks/useSessionHistory';
import { useRequestQueue } from '../hooks/useRequestQueue';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useEmblaCarousel from 'embla-carousel-react';
import '../styles/custom.css';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { StartPageHeader } from './StartPageHeader';
import KeyLabel from '../utils/keyLabel';

const DEFAULT = {
  STATUS: 'idle',
  STATUS_MESSAGE: {
    code: 'idle',
    message: 'Type in the <b>6-digit code</b> to join a clipboard.',
    vars: {}
  },
}

function StartPage() {
  const { t } = useTranslation('common');
  const { createSession, joinSession, loading, checkSession, deviceId } = useSession();
  const { allHistoryCodes, refreshHistoryCache, isHistoryCodeValid } = useSessionHistory();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(DEFAULT.STATUS); // idle | checking | valid | invalid
  const [statusMessage, setStatusMessage] = useState(DEFAULT.STATUS_MESSAGE);
  const [currentStatusMessage, setCurrentStatusMessage] = useState('');
  const [emblaRef, emblaApi] = useEmblaCarousel({ axis: 'x', dragFree: true, containScroll: 'trimSnaps' });
  const inputRefs = useRef([]);
  const joinBtnRef = useRef(null);
  const createBtnRef = useRef(null);
  const lastCheckedCode = useRef('');

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
    if (createBtnRef.current) {
      createBtnRef.current.focus();
    }
  }, []);

  // Focus join button when status becomes valid
  useEffect(() => {
    if (status === 'idle') {
      setStatusMessage(DEFAULT.STATUS_MESSAGE);
      lastCheckedCode.current = '';
    }
    if (status === 'valid' && joinBtnRef.current) {
      setTimeout(() => {
        setStatusMessage({ code: status, message: t('startPage.valid.message'), vars: {} });
        joinBtnRef.current.focus();
      }, 200);
    } else if (status === 'invalid') {
      const currentCode = code.join('');
      const newCode = [...code];
      newCode[5] = '';
      setCode(newCode);
      setStatus('idle');
      // setCode(['', '', '', '', '', '']);
      setTimeout(() => {
        setStatusMessage({ code: status, message: t('startPage.invalid.message'), vars: { code: currentCode } });
        if (inputRefs.current[5]) inputRefs.current[5].focus();
      }, 200);
    }
  }, [status]);

  useEffect(() => {
    // console.log('status', status);
    // console.log('joinBtnRef.current', joinBtnRef.current);
    // console.log('document.activeElement', document.activeElement);

    if (status === 'valid') {
      const handleGlobalKeyDown = (e) => {
        if (
          e.key === 'Backspace' &&
          document.activeElement === joinBtnRef.current
        ) {
          e.preventDefault();
          const newCode = [...code];
          newCode[5] = '';
          setCode(newCode);
          setStatus('idle');
          if (inputRefs.current[5]) inputRefs.current[5].focus();
        }
      };
      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [status, code, inputRefs, joinBtnRef]);

  // Watch for code changes to handle status and re-check
  useEffect(() => {
    const codeStr = code.join('');
    if (codeStr.length < 6) {
      if (status !== 'idle') setStatus('idle');
      return;
    }
    // If code changed and is 6 digits, re-check
    if (codeStr.length === 6 && codeStr !== lastCheckedCode.current) {
      lastCheckedCode.current = codeStr;
      checkSessionCode(codeStr);
    }
  }, [code, status]);

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
    setCode(['', '', '', '', '', '']);
    setError('');
    setStatus('idle');
    if (createBtnRef.current) {
      createBtnRef.current.focus();
    }
  };

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // If Ctrl or Cmd is pressed, handle key combinations
    const isCtrlOrCmd = e?.ctrlKey || e?.metaKey;
    if (isCtrlOrCmd) return handleCtrlKeyCombinationDown(e);

    // Backspace: if valid, clear last input and go back to idle
    if (e.key === 'Backspace') {
      if (status === 'valid') {
        const newCode = [...code];
        newCode[5] = '';
        setCode(newCode);
        setStatus('idle');
        if (inputRefs.current[5]) inputRefs.current[5].focus();
        e.preventDefault();
        return;
      }
      if (!code[index] && index > 0) {
        inputRefs.current[index - 1].focus();
      }
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

  const handleCtrlKeyCombinationDown = (e) => {
    const isCtrlOrCmd = e?.ctrlKey || e?.metaKey;
    const isSoleCtrlOrCmd = isCtrlOrCmd && ['Control', 'Meta'].includes(e?.key);
    if (!isCtrlOrCmd || isSoleCtrlOrCmd) return;

    switch (e?.key?.toLowerCase()) {
      case 'n': // this needs to be reviewed, it's not working as expected and the browser's default behavior always wins
        e.preventDefault();
        createSession(deviceId);
        break;
      default:
        return;
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
  };

  const checkSessionCode = async (sessionCode) => {
    // Wait for 100ms to ensure the code is updated
    await new Promise(res => setTimeout(res, 100));
    setStatus('checking');
    setError('');
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
    } catch (err) {
      setStatus('invalid');
      setError(err.message || 'Invalid or expired session code');
      toast.error(err.message || 'Invalid or expired session code');
    }
  };

  const handleContainerClick = (e) => {
    if (status === 'checking') return;
    const target = e.target;
    const isInteractive = target.tagName === 'INPUT' || 
                         target.tagName === 'BUTTON' || 
                         target.closest('button') !== null;
    if (!isInteractive && createBtnRef.current) {
      e.preventDefault();
      e.stopPropagation();
      createBtnRef.current.focus();
    }
  };

  return (
    <>
      <StartPageHeader />
      <div 
        className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4"
        role="main"
        aria-label="CrossClip Start Page"
        onClick={handleContainerClick}
      >
        <div className="-mt-8">
          <div className="flex flex-col items-end w-full max-w-md mb-16">
            {/* <h1 className="w-full text-right text-3xl font-bold mb-2 text-gray-900 dark:text-white shadow-sm">{t('startPage.title')}</h1> */}
            <div className="flex gap-0">
              <h1 className="text-right text-3xl font-bold mb-2 text-amber-500 dark:text-amber-500 text-shadow-hard-black dark:text-shadow-hard-white">Cross</h1>
              <h1 className="text-right text-3xl font-bold mb-2 text-blue-500 dark:text-blue-500 text-shadow-hard-black dark:text-shadow-hard-white">Clip</h1>
            </div>

            <p className="w-full text-md md:text-large text-gray-500 dark:text-gray-300 text-right border-t border-dashed border-t-4 border-gray-300 dark:border-gray-700 pt-2 leading-tight" dangerouslySetInnerHTML={{ __html: t('startPage.titleDescription') }} />
          </div>
          <div
            className="flex flex-col items-center gap-4 w-full max-w-md"
            onPaste={handlePaste}
            role="group"
          >

            <div className="flex flex-col items-center gap-4 w-full relative group">
              <button
                ref={createBtnRef}
                autoFocus
                tabIndex={1}
                onClick={() => createSession(deviceId)}
                disabled={loading || status === 'checking'}
                className="w-full px-8 py-3 text-lg md:text-xl rounded border border-gray-300 hover:border-amber-400 dark:border-gray-700 hover:dark:border-amber-400 hover:bg-white hover:text-amber-600 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 dark:hover:text-amber-400 transition-colors font-semibold text-blue-800 dark:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed border-2 focus:outline-none focus:ring-4 focus:ring-amber-500 focus:text-amber-500 focus:dark:text-amber-500"
                aria-label={loading ? "Creating new clipboard..." : "Create a new clipboard"}
                dangerouslySetInnerHTML={{
                  __html: `${t('actions.createNewOne')} <span class='text-xs text-gray-500 dark:text-gray-300 font-medium'>(${t('actions.oneClick')})</span>`
                }}
              >
              </button>
              <p className="w-full text-right -mt-5 text-sm text-gray-500 dark:text-gray-300 relative opacity-0 group-focus-within:opacity-100 transition-opacity duration-200">
                <span className="absolute right-1 bottom-0 pointer-events-none z-0">
                  <span className='keyTip'><span className='keyTip-symbol'>⏎</span>Enter</span>
                </span>
              </p>
              <p className="w-full text-right text-sm text-gray-500 dark:text-gray-300 relative opacity-0 group-focus-within:opacity-80 transition-opacity duration-200"></p>
              {/* <p className="w-full text-right mt-4 text-sm text-gray-500 dark:text-gray-300 relative opacity-0 group-focus-within:opacity-80 transition-opacity duration-200">
                <span className="absolute right-1 bottom-0 pointer-events-none z-0">
                  <span className='keyTip'><span className='keyTip-symbol'>⇥</span>Tab</span>
                </span>
              </p> */}
              {/* <p className="w-full text-right -mt-5 text-sm text-gray-500 dark:text-gray-300 relative opacity-80 group-focus-within:opacity-0 transition-opacity duration-200">
                <span className="absolute right-1 bottom-0 pointer-events-none z-0">
                  <KeyLabel keyString='Shift+Tab' />
                </span>
              </p> */}
            </div>
            
            <div className="flex flex-col items-center gap-4 w-full">
              <span 
                className="text-lg md:text-xl text-blue-600 dark:text-blue-400 italic mb-2"
                aria-hidden="true"
              >
                {t('startPage.or')}
              </span>
            </div>

            <div className="w-full group">
              <div className="flex items-end mb-2 gap-2">
                <h2
                  className="text-xl md:text-2xl font-semibold text-blue-800 dark:text-blue-400 group-focus-within:text-amber-500 group-focus-within:dark:text-amber-400"
                  id="join-heading"
              >
                <span>{t('startPage.join.inputsHeading')}</span>
                </h2>
                <span className="opacity-70">
                  <KeyLabel keyString='Ctrl+V' />
                </span>
              </div>
              <div 
                className="flex gap-2 justify-center mb-2 relative"
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
                      'w-14 h-20 font-semibold text-4xl text-center rounded border-2 border-gray-300 dark:border-gray-700 focus:border-blue-600 dark:focus:border-blue-400 bg-transparent outline-none transition-colors duration-150',
                      'text-amber-500 dark:text-amber-400',
                      status === 'checking' && 'animate-pulse',
                      status === 'valid' && 'border-green-600 dark:border-green-400',
                    )}
                    tabIndex={i + 1}
                    aria-label={`Digit ${i + 1} of 6`}
                    aria-required="true"
                    aria-invalid={error ? "true" : "false"}
                    disabled={status === 'checking'}
                  />
                ))}
                {/* Create a wrapper div to avoid flashing when any of the status elements are rendered */}
                <div className="w-14 h-20 flex items-center justify-center ml-2 text-center rounded border-2 border-dashed border-transparent bg-transparent outline-none transition-colors duration-150">
                  {
                    status === 'idle' && code.join('').length < 6 && (
                      <ClipboardDocumentListIcon className="h-24 w-24 text-gray-300 dark:text-gray-700 select-none" />
                    )
                  }
                  {status === 'checking' && (
                    <div className="w-12 h-16 md:w-14 md:h-20 flex items-center justify-center ml-2 animate-spin">
                      <svg className="w-8 h-8 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                    </div>
                  )}
                  {status === 'invalid' && (
                    <div className="w-full h-full flex items-center justify-center bg-red-600 dark:bg-red-700 rounded border-2 border-white dark:border-gray-700 animate-fade-in-out" aria-label="Invalid code" tabIndex={-1}>
                      <span className="text-4xl font-bold text-white select-none">X</span>
                    </div>
                  )}
                  {status === 'valid' && (
                    <button
                      ref={joinBtnRef}
                      className="w-full h-full flex flex-col items-center justify-center bg-green-600 dark:bg-green-700 rounded border-2 border-white dark:border-gray-700 focus:outline-none focus:ring-4 focus:ring-amber-500 animate-pulse"
                      aria-label="Join session"
                      tabIndex={0}
                      onClick={handleJoin}
                      onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
                      disabled={status !== 'valid'}
                    >
                      <ClipboardDocumentListIcon className="h-10 w-10 text-white shadow-sm select-none" />
                      <span className="text-xxs font-bold text-white select-none mt-1 uppercase text-shadow-sm">{t('actions.join')}</span>
                    </button>
                  )}
                </div>
              </div>
              {currentStatusMessage && (
                <p 
                  id="status-message" 
                  className={clsx(
                    'text-md text-left mb-2',
                    statusMessage.code === 'invalid' && 'text-red-500 dark:text-red-400',
                    statusMessage.code === 'valid' && 'text-green-500 dark:text-green-400',
                    (statusMessage.code === 'checking' || statusMessage.code === 'idle') && 'text-gray-500 dark:text-gray-400'
                  )}
                  role={status === 'invalid' ? 'alert' : 'status'}
                  aria-live={status === 'invalid' ? 'assertive' : 'polite'}
                  dangerouslySetInnerHTML={{ __html: currentStatusMessage }}
                />
              )}
            </div>
            
            <div className="flex flex-col items-start gap-1 w-full mt-20">
              {allHistoryCodes.length > 0 ? (
                <>
                  <span className="text-sm text-gray-400 dark:text-gray-400 italic pb-2">{t('startPage.history.title')}:</span>
                  <div className="relative w-full">
                    {/* Left Arrow */}
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 dark:bg-gray-700 bg-opacity-50 rounded p-0 shadow hover:bg-opacity-90 transition"
                      onClick={() => emblaApi && emblaApi.scrollPrev()}
                      aria-label={t('actions.scrollLeft')}
                      style={{ display: allHistoryCodes.length > 1 ? 'block' : 'none' }}
                    >
                      <span className="sr-only">{t('actions.scrollLeft')}</span>
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    {/* Embla viewport */}
                    <div className={clsx(
                      "overflow-hidden px-8",
                      allHistoryCodes.length <= 4 && "px-0"
                    )} ref={emblaRef}>
                      <div className="flex gap-2">
                        {allHistoryCodes.map((code) => (
                          <a
                            key={code}
                            href={isHistoryCodeValid(code) ? `/${code}` : undefined}
                            className={clsx(
                              "session-code-dashed-box",
                              !isHistoryCodeValid(code) && "session-code-dashed-box-invalid",
                              !isHistoryCodeValid(code) && "cursor-not-allowed",
                              "select-none",
                              "embla__slide"
                            )}
                            role="button"
                            onClick={() => {
                              isHistoryCodeValid(code) && (window.location.href = `/${code}`);
                            }}
                            disabled={!isHistoryCodeValid(code)}
                          >
                            {code}
                          </a>
                        ))}
                      </div>
                    </div>
                    {/* Right Arrow */}
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 dark:bg-gray-700 bg-opacity-50 rounded p-0 shadow hover:bg-opacity-90 transition"
                      onClick={() => emblaApi && emblaApi.scrollNext()}
                      aria-label={t('actions.scrollRight')}
                      style={{ display: allHistoryCodes.length > 1 ? 'block' : 'none' }}
                    >
                      <span className="sr-only">{t('actions.scrollRight')}</span>
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                </>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-300 italic font-semibold">
                  {t('startPage.history.empty')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default StartPage; 