import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { JAMIYYAH_LIST } from '../constants';
import { generateWeeklyDates, formatDateID } from '../utils/dates';
import { CheckCircle2, UserX, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function AttendanceForm() {
  const dates = generateWeeklyDates();
  
  const [lokasi, setLokasi] = useState('');
  const [jamiyyah, setJamiyyah] = useState('');
  const [tanggal, setTanggal] = useState(dates[0]); // default to first schedule
  const [status, setStatus] = useState(''); // 'Hadir' or 'Tidak Hadir'
  const [keterlambatan, setKeterlambatan] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [filledJamiyyah, setFilledJamiyyah] = useState([]);

  useEffect(() => {
    // Reset form when date changes
    setLokasi('');
    setJamiyyah('');
    setStatus('');
    setKeterlambatan('');
  }, [tanggal]);

  useEffect(() => {
    if (tanggal && lokasi) {
      setFilledJamiyyah([]);
      fetchFilledJamiyyah(tanggal, lokasi);
    } else {
      setFilledJamiyyah([]);
    }
  }, [tanggal, lokasi]);

  const fetchFilledJamiyyah = async (selectedDate, selectedLokasi) => {
    const { data } = await supabase
      .from('absensi')
      .select('jamiyyah')
      .eq('tanggal_jadwal', selectedDate)
      .eq('lokasi', selectedLokasi);
    
    if (data) {
      setFilledJamiyyah(data.map(d => d.jamiyyah));
    }
  };

  const handleJamiyyahChange = (e) => {
    const selected = e.target.value;
    if (filledJamiyyah.includes(selected)) {
      setJamiyyah('');
      setMessage(`❌ Absen ${selected} sudah terisi! Silakan edit/hapus di tab Rekapan.`);
      setTimeout(() => setMessage(''), 4000);
      return;
    }
    setJamiyyah(selected);
  };

  const delayOptions = [
    'Tepat Waktu',
    'Telat 5 Menit',
    'Telat 10 Menit',
    'Telat 15 Menit/Lebih'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lokasi || !jamiyyah || !tanggal || !status) {
      setMessage('Lengkapi semua data utama.');
      return;
    }
    if (status === 'Hadir' && !keterlambatan) {
      setMessage('Pilih status keterlambatan.');
      return;
    }
    if (filledJamiyyah.includes(jamiyyah)) {
      setMessage(`❌ Absen ${jamiyyah} sudah terisi! Silakan edit di tab Rekapan.`);
      setTimeout(() => setMessage(''), 4000);
      return;
    }

    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('absensi')
      .insert([
        {
          jamiyyah,
          tanggal_jadwal: tanggal,
          status_kehadiran: status,
          detail_keterlambatan: status === 'Hadir' ? keterlambatan : null,
          lokasi: lokasi,
        }
      ]);

    setLoading(false);

    if (error) {
      console.error(error);
      setMessage('Gagal menyimpan data: ' + error.message);
    } else {
      setMessage('✅ Berhasil disimpan!');
      // Reset form but keeping last date as it makes bulk entry easier
      setJamiyyah('');
      setStatus('');
      setKeterlambatan('');
      fetchFilledJamiyyah(tanggal, lokasi); // Refresh data
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 py-6 pb-24">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-navy p-5 text-center">
          <h2 className="text-xl font-bold text-white mb-1">Form Absensi</h2>
          <p className="text-navy-lighter text-sm text-slate-300">Input kehadiran mingguan Peserta</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          
          {/* Lokasi */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Lokasi</label>
            <select 
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-navy focus:border-transparent transition-all outline-none text-slate-800"
            >
              <option value="">-- Pilih Lokasi --</option>
              <option value="Lantai 2">Lantai 2</option>
              <option value="Lantai 3">Lantai 3</option>
            </select>
          </div>

          {/* Tanggal */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Jadwal</label>
            <select 
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-navy focus:border-transparent transition-all outline-none text-slate-800"
            >
              {dates.map(d => (
                <option key={d} value={d}>{formatDateID(d)}</option>
              ))}
            </select>
          </div>

          {/* Peserta */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Peserta</label>
            <select 
              value={jamiyyah}
              onChange={handleJamiyyahChange}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-navy focus:border-transparent transition-all outline-none text-slate-800"
            >
              <option value="">-- Pilih Peserta --</option>
              {JAMIYYAH_LIST.map(j => (
                <option key={j} value={j} className={filledJamiyyah.includes(j) ? "text-slate-400" : ""}>
                  {j} {filledJamiyyah.includes(j) ? '(Sudah Terisi)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Kehadiran */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Status Kehadiran</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('Hadir')}
                className={clsx(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all h-24",
                  status === 'Hadir' 
                    ? "border-navy bg-navy/5 text-navy shadow-sm" 
                    : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                )}
              >
                <CheckCircle2 className={clsx("w-8 h-8 mb-2", status === 'Hadir' ? "text-navy" : "text-slate-300")} />
                <span className="font-semibold text-sm">Hadir</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus('Tidak Hadir');
                  setKeterlambatan('');
                }}
                className={clsx(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all h-24",
                  status === 'Tidak Hadir' 
                    ? "border-red-500 bg-red-50 text-red-600 shadow-sm" 
                    : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                )}
              >
                <UserX className={clsx("w-8 h-8 mb-2", status === 'Tidak Hadir' ? "text-red-500" : "text-slate-300")} />
                <span className="font-semibold text-sm">Tidak Hadir</span>
              </button>
            </div>
          </div>

          {/* Sub Opsi Hadir */}
          {status === 'Hadir' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Detail Kehadiran</label>
              <div className="grid grid-cols-2 gap-2">
                {delayOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setKeterlambatan(opt)}
                    className={clsx(
                      "p-3 rounded-lg border text-sm font-medium transition-all",
                      keterlambatan === opt 
                        ? "bg-navy text-white border-navy shadow-md"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alert Message */}
          {message && (
            <div className={clsx(
              "p-4 rounded-xl text-sm font-medium flex items-center justify-center text-center",
              message.includes('✅') ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            )}>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-xl bg-navy text-white font-bold text-lg hover:bg-navy-light focus:ring-4 focus:ring-navy/30 transition-all flex items-center justify-center disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Simpan Absensi"}
          </button>
          
        </form>
      </div>
    </div>
  );
}
