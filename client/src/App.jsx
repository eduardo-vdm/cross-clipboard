import { SessionProvider } from './contexts/SessionContext';
import { PasteSuppressProvider } from './contexts/PasteSuppressContext';
import { SessionHeader } from './components/SessionHeader';
import { AddItem } from './components/AddItem';
import { ClipboardItems } from './components/ClipboardItems';
import { ClipboardPermission } from './components/ClipboardPermission';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <PasteSuppressProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <SessionHeader />
          <main className="max-w-4xl mx-auto px-4 py-8">
            <AddItem />
            <ClipboardItems />
          </main>
          <ClipboardPermission />
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
            }}          />
          </div>
        </PasteSuppressProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;
