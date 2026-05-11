import { useState, useEffect } from 'react';
import AttendanceForm from './components/AttendanceForm';
import Recap from './components/Recap';
import { PenSquare, ClipboardList, BookOpen, Download } from 'lucide-react';
import clsx from 'clsx';
import logoSrc from './assets/logo.png';

function App() {
  const [activeTab, setActiveTab] = useState('form');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-navy text-white pt-6 pb-4 px-4 shadow-md sticky top-0 z-10">
        <div className="max-w-md mx-auto text-center flex flex-col items-center">
          
          {/* Logo Placeholder */}
          <div className="w-10 h-10 bg-white/10 rounded-full border-2 border-white/20 mb-3 overflow-hidden flex items-center justify-center shadow-lg relative">
            <BookOpen className="w-5 h-5 text-white/50 absolute z-0" />
            <img 
              src={logoSrc} 
              alt="Logo" 
              className="w-full h-full object-contain relative z-10 p-1"
              onError={(e) => {
                e.target.style.opacity = '0'; // Hide broken image if not found, showing icon underneath
              }} 
            />
          </div>

          <p className="text-[10px] font-semibold text-blue-200 tracking-wider uppercase mb-1 flex items-center justify-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>LBM PPHM LIRBOYO OFFICIAL</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          </p>
          <h1 className="text-xl font-bold">Absensi Peserta Fathul Qorib</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'form' ? <AttendanceForm /> : <Recap />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-20 pb-safe">
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => setActiveTab('form')}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center py-3 transition-colors",
              activeTab === 'form' ? "text-navy" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className={clsx(
              "p-1.5 rounded-xl transition-all mb-1",
              activeTab === 'form' ? "bg-navy/10" : "bg-transparent"
            )}>
              <PenSquare className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide">Input Absen</span>
          </button>
          
          <button
            onClick={() => setActiveTab('recap')}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center py-3 transition-colors",
              activeTab === 'recap' ? "text-navy" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className={clsx(
              "p-1.5 rounded-xl transition-all mb-1",
              activeTab === 'recap' ? "bg-navy/10" : "bg-transparent"
            )}>
              <ClipboardList className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide">Rekapan</span>
          </button>
        </div>
      </nav>

      {/* Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-20 left-4 right-4 bg-navy text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between border border-white/20 animate-in slide-in-from-bottom-5">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Download className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <p className="font-bold text-sm">Install Aplikasi</p>
              <p className="text-xs text-blue-200">Tambahkan ke layar utama</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowInstallBanner(false)}
              className="text-xs px-3 py-2 text-slate-300 hover:text-white"
            >
              Nanti
            </button>
            <button 
              onClick={handleInstallClick}
              className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-lg"
            >
              Install
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default App;
