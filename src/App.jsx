import { useState, useEffect } from 'react';
import AttendanceForm from './components/AttendanceForm';
import Recap from './components/Recap';
import AdminPanel from './components/AdminPanel';
import { PenSquare, ClipboardList, BookOpen, Download, Lock, Settings } from 'lucide-react';
import clsx from 'clsx';
import logoSrc from './assets/logo.png';

function App() {
  const [activeTab, setActiveTab] = useState('form');
  const [category, setCategory] = useState('jamiyyah'); // 'jamiyyah' or 'perumus'
  const [isAdmin, setIsAdmin] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  
  // Custom Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
      return;
    }
    setAdminPassword('');
    setLoginError('');
    setShowLoginModal(true);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === "adminganteng") {
      setIsAdmin(true);
      setShowLoginModal(false);
    } else {
      setLoginError("Password salah!");
    }
  };

  useEffect(() => {
    // Return to form if admin mode disabled while in admin tab
    if (!isAdmin && activeTab === 'admin') setActiveTab('form');
  }, [isAdmin, activeTab]);

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
      <header className="bg-navy text-white pt-4 pb-3 px-4 shadow-md sticky top-0 z-10 relative">
        <button 
          onClick={handleAdminToggle} 
          className="absolute top-0 right-0 w-12 h-12 opacity-0 z-50"
          aria-label="Admin Login"
        >
          <Lock className="w-5 h-5" />
        </button>
        <div className="max-w-md mx-auto flex flex-col space-y-3">
          
          {/* Top Row: Logo + Title */}
          <div className="flex items-center justify-center space-x-3 pr-4">
            <div className="w-8 h-8 bg-white/10 rounded-full border border-white/20 overflow-hidden flex items-center justify-center shadow-sm shrink-0 relative">
              <BookOpen className="w-4 h-4 text-white/50 absolute z-0" />
              <img 
                src={logoSrc} 
                alt="Logo" 
                className="w-full h-full object-contain relative z-10 p-0.5"
                onError={(e) => { e.target.style.opacity = '0'; }} 
              />
            </div>
            <div className="text-left">
              <h1 className="text-sm font-bold leading-tight">
                {category === 'jamiyyah' ? 'Absensi Fathul Qorib' : 'Absensi Perumus LBM'}
              </h1>
              <p className="text-[9px] font-medium text-blue-200 tracking-wide uppercase mt-0.5">
                LBM PPHM Lirboyo Official
              </p>
            </div>
          </div>
          
          {/* Category Toggle */}
          <div className="flex bg-navy-light/30 rounded-lg p-0.5 border border-white/10 mx-auto w-full max-w-[240px]">
            <button
              onClick={() => setCategory('jamiyyah')}
              className={clsx(
                "flex-1 text-[11px] py-1.5 px-2 rounded-md font-semibold transition-all",
                category === 'jamiyyah' ? "bg-white text-navy shadow-sm" : "text-slate-300 hover:text-white"
              )}
            >
              Fathul Qorib
            </button>
            <button
              onClick={() => setCategory('perumus')}
              className={clsx(
                "flex-1 text-[11px] py-1.5 px-2 rounded-md font-semibold transition-all",
                category === 'perumus' ? "bg-white text-navy shadow-sm" : "text-slate-300 hover:text-white"
              )}
            >
              Perumus
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'form' ? <AttendanceForm category={category} isAdmin={isAdmin} /> : 
         activeTab === 'recap' ? <Recap category={category} isAdmin={isAdmin} /> :
         activeTab === 'admin' && isAdmin ? <AdminPanel /> : null}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-max bg-white/90 backdrop-blur-xl z-50 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-200/50">
        <div className="flex justify-center items-center px-3 py-2 space-x-2">
          <button
            onClick={() => setActiveTab('form')}
            className={clsx(
              "flex flex-col items-center justify-center w-20 h-14 rounded-full transition-all",
              activeTab === 'form' ? "text-navy bg-navy/5 scale-105" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <PenSquare className={clsx("w-5 h-5 mb-1 transition-all", activeTab === 'form' ? "fill-navy/10" : "")} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Input</span>
          </button>
          
          <button
            onClick={() => setActiveTab('recap')}
            className={clsx(
              "flex flex-col items-center justify-center w-20 h-14 rounded-full transition-all",
              activeTab === 'recap' ? "text-navy bg-navy/5 scale-105" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <ClipboardList className={clsx("w-5 h-5 mb-1 transition-all", activeTab === 'recap' ? "fill-navy/10" : "")} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Rekap</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={clsx(
                "flex flex-col items-center justify-center w-20 h-14 rounded-full transition-all",
                activeTab === 'admin' ? "text-navy bg-navy/5 scale-105" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              <Settings className={clsx("w-5 h-5 mb-1 transition-all", activeTab === 'admin' ? "fill-navy/10" : "")} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Admin</span>
            </button>
          )}
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

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl w-[90%] max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-navy" />
            </div>
            <h3 className="font-bold text-navy text-xl text-center mb-1">Login Admin</h3>
            <p className="text-xs text-slate-500 text-center mb-6">
              Masukkan password untuk mengelola data.
            </p>
            
            <form onSubmit={handleAdminLogin}>
              <div className="mb-2">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setLoginError('');
                  }}
                  autoFocus
                  placeholder="Password..."
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl border text-center tracking-widest transition-all focus:outline-none focus:ring-2",
                    loginError ? "border-red-300 focus:ring-red-200 bg-red-50 text-red-700" : "border-slate-200 focus:ring-navy/20 focus:border-navy bg-slate-50 text-slate-700"
                  )}
                />
                {loginError && (
                  <p className="text-xs text-red-500 text-center mt-2 font-medium animate-in slide-in-from-top-1">{loginError}</p>
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={!adminPassword}
                  className="flex-1 py-3 font-bold text-white bg-navy rounded-xl hover:bg-navy-light disabled:opacity-50 transition-colors"
                >
                  Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default App;
