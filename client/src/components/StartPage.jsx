import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';

function StartPage() {
  const { createSession, joinSession, loading } = useSession();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

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

  const handleInputChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input if a number was entered
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    // If all inputs are filled, try to join the session
    if (newCode.every(digit => digit) && newCode.join('').length === 6) {
      handleJoinSession(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only proceed if we have a 6-digit number
    if (!/^\d{6}$/.test(pastedData)) {
      toast.error('Please paste a valid 6-digit code');
      return;
    }

    // Split the pasted code into digits and update state
    const digits = pastedData.split('');
    setCode(digits);
    
    // Focus the last input
    inputRefs.current[5].focus();
    
    // Try to join the session
    handleJoinSession(digits.join(''));
  };

  const handleJoinSession = async (sessionCode) => {
    try {
      await joinSession(sessionCode);
    } catch (err) {
      // Reset the code inputs on error
      setCode(['', '', '', '', '', '']);
      // Focus the first input
      inputRefs.current[0].focus();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">Welcome to CrossClip</h1>
        <p className="text-lg md:text-xl text-gray-300">Just copy and paste to and from anywhere.</p>
      </div>
      <div className="flex flex-col items-center gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-blue-600 mb-4 italic">Join a Clipboard</h2>
          <div 
            className="flex gap-2 justify-center mb-6"
            onPaste={handlePaste}
          >
            {[0,1,2,3,4,5].map((i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code[i]}
                onChange={(e) => handleInputChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-14 h-20 text-3xl md:text-4xl text-center rounded border-2 border-white focus:border-blue-600 bg-transparent outline-none transition-colors duration-150"
                tabIndex={0}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <span className="text-xl text-blue-600 italic mb-2">or</span>
          <button
            onClick={createSession}
            disabled={loading}
            className="px-8 py-3 text-xl rounded border border-white hover:bg-white hover:text-gray-900 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create a new one'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StartPage; 