import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { generateWeeklyDates, formatDateID } from '../utils/dates';
import { CheckCircle2, UserX, Loader2 } from 'lucide-react';
import CustomSelect from './CustomSelect';
import clsx from 'clsx';

export default function AttendanceForm({ category = 'jamiyyah' }) {
  const dates = generateWeeklyDates();
  
  const [lokasi, setLokasi] = useState('');
  const [jamiyyah, setJamiyyah] = useState('');
  const [tanggal, setTanggal] = useState(dates[0]); // default to first schedule
  const [status, setStatus] = useState(''); // 'Hadir' or 'Tidak Hadir'
  const [keterlambatan, setKeterlambatan] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [filledJamiyyah, setFilledJamiyyah] = useState([]);
  const [pesertaDb, setPesertaDb] = useState([]);

  useEffect(() => {
    fetchPesertaDb();
  }, []);

  const fetchPesertaDb = async () => {
    const { data } = await supabase.from('peserta').select('*').order('nama', { ascending: true });
    if (data) {
      const uniqueData = [];
      const seen = new Set();
      data.forEach(p => {
        if (!seen.has(p.nama)) {
          seen.add(p.nama);
          uniqueData.push(p);
        }
      });
      setPesertaDb(uniqueData);
    }
  };

  useEffect(() => {
    if (tanggal && lokasi) {
      setFilledJamiyyah([]);
      fetchFilledJamiyyah(tanggal, lokasi);
    } else {
      setFilledJamiyyah([]);
    }
  }, [tanggal, lokasi]);

  // Reset jamiyyah when location changes to prevent stale selection
  useEffect(() => {
    setJamiyyah('');
  }, [lokasi]);

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
    if (status === 'Hadir' && category !== 'perumus' && !keterlambatan) {
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

    let finalKeterlambatan = status === 'Hadir' ? keterlambatan : null;
    if (finalKeterlambatan && finalKeterlambatan.includes('Telat')) {
      const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      finalKeterlambatan = `${keterlambatan} (${timeNow})`;
    }

    const { data, error } = await supabase
      .from('absensi')
      .insert([
        {
          jamiyyah,
          tanggal_jadwal: tanggal,
          status_kehadiran: status,
          detail_keterlambatan: finalKeterlambatan,
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
        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <div className="pb-3 flex items-center space-x-2 border-b border-slate-100">
            <span className="w-1 h-3 rounded-full bg-navy"></span>
            <h2 className="text-sm font-bold text-navy uppercase tracking-wider">Form Absensi</h2>
          </div>
          
          {/* Lokasi */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Lokasi</label>
            <CustomSelect 
              value={lokasi}
              onChange={setLokasi}
              options={[
                { value: "Lantai 2", label: "Lantai 2" },
                { value: "Lantai 3", label: "Lantai 3" }
              ]}
              placeholder="-- Pilih Lokasi --"
            />
          </div>

          {/* Tanggal */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Jadwal</label>
            <CustomSelect 
              value={tanggal}
              onChange={setTanggal}
              options={dates.map(d => ({ value: d, label: formatDateID(d) }))}
              placeholder="-- Pilih Tanggal --"
            />
          </div>

          {/* Peserta */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Peserta</label>
            <CustomSelect 
              value={jamiyyah}
              onChange={(val) => handleJamiyyahChange({ target: { value: val } })}
              options={pesertaDb
                .filter(p => p.kategori === category)
                .filter(p => p.lokasi === 'Semua' || p.lokasi === lokasi)
                .map(p => ({
                  value: p.nama,
                  label: p.kategori === 'perumus' ? `${p.nama} (${p.lokasi === 'Lantai 2' ? 'LT 2' : p.lokasi === 'Lantai 3' ? 'LT 3' : 'Umum'})` : p.nama,
                  disabled: filledJamiyyah.includes(p.nama),
                  helperText: filledJamiyyah.includes(p.nama) ? "(Sudah Terisi)" : ""
                }))
              }
              placeholder="-- Pilih Peserta --"
            />
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
          {status === 'Hadir' && category !== 'perumus' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Durasi Keterlambatan
                </label>
                <CustomSelect 
                  value={keterlambatan}
                  onChange={setKeterlambatan}
                  options={delayOptions.map(opt => ({ value: opt, label: opt }))}
                  placeholder="-- Pilih Durasi --"
                />
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
