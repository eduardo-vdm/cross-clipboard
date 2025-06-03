import { SessionProvider } from './contexts/SessionContext';
import { PasteSuppressProvider } from './contexts/PasteSuppressContext';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import StartPage from './components/StartPage';
import SessionPage from './components/SessionPage';
import AppOnlineStatus from './components/AppOnlineStatus';
import { AppFooter } from './components/AppFooter';
import { StartPageHeader } from './components/StartPageHeader';
import { SessionHeader } from './components/SessionHeader';
import clsx from 'clsx';


function App() {
  const location = useLocation();

  const renderHeader = () => {
    if (location.pathname.startsWith('/start')) return <StartPageHeader />;
    return <SessionHeader />;
  };

  return (
    <ThemeProvider>
      <SessionProvider>
        <PasteSuppressProvider>
          <AppOnlineStatus>
            <div className={clsx(
              'flex flex-col h-screen',
              // 'outline outline-red-500 outline-2 border-4 border-dashed border-red-500', // debug
            )}>
              {renderHeader()}
              <main role="main" className={clsx(
                'flex-1 overflow-auto bg-primary-50 dark:bg-gray-900',
                // 'outline outline-blue-500 outline-2 border-4 border-dashed border-blue-500', // debug
              )}>
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
                    style: {
                      marginBottom: '36px',
                    },
                    success: {
                      duration: 2000,
                      className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg',
                      iconTheme: {
                        primary: '#059669',
                        secondary: '#ffffff',
                      },
                    },
                    error: {
                      duration: 5000,
                      className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg',
                      iconTheme: {
                        primary: '#dc2626',
                        secondary: '#ffffff',
                      },
                    },
                  }}
                />
              </main>
              <AppFooter />
            </div>
          </AppOnlineStatus>
        </PasteSuppressProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;