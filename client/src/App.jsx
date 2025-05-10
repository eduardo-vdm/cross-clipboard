import { SessionProvider } from './contexts/SessionContext';
import { PasteSuppressProvider } from './contexts/PasteSuppressContext';
import { SessionHeader } from './components/SessionHeader';
import { AddItem } from './components/AddItem';
import { ClipboardItems } from './components/ClipboardItems';
import { ClipboardPermission } from './components/ClipboardPermission';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <SessionProvider>
      <PasteSuppressProvider>
        <div className="min-h-screen bg-gray-50">
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
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 2000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </PasteSuppressProvider>
    </SessionProvider>
  );
}

export default App;
