import { SessionProvider } from './contexts/SessionContext';
import { PasteSuppressProvider } from './contexts/PasteSuppressContext';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import StartPage from './components/StartPage';
import SessionPage from './components/SessionPage';

function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <PasteSuppressProvider>
          <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
          <Routes>
            <Route path="/" element={<Navigate to="/start" replace />} />
            <Route path="/start" element={<StartPage />} />
            <Route path="/:code" element={<SessionPage />} />
            <Route path="*" element={<Navigate to="/start" replace />} />
          </Routes>
            <Toaster 
              position="bottom-right"
              toastOptions={{
                duration: 3000,
                className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg',
                success: {
                  duration: 2000,
                  className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg',
                  iconTheme: {
                    primary: '#059669',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  duration: 4000,
                  className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg',
                  iconTheme: {
                    primary: '#dc2626',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </div>
        </PasteSuppressProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;