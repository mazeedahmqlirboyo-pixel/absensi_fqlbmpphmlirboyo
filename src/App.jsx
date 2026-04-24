import { useState } from 'react';
import AttendanceForm from './components/AttendanceForm';
import Recap from './components/Recap';
import { PenSquare, ClipboardList, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import logoSrc from './assets/logo.png';

function App() {
  const [activeTab, setActiveTab] = useState('form');

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
      
    </div>
  );
}

export default App;
