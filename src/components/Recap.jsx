import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { JAMIYYAH_LIST } from '../constants';
import { generateWeeklyDates, formatDateID } from '../utils/dates';
import { BarChart3, Loader2, Edit2, CalendarDays, CheckCircle2, UserX, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export default function Recap() {
  const dates = generateWeeklyDates();
  
  const [filterDate, setFilterDate] = useState('Global');
  const [data, setData] = useState([]);
  const [globalSummary, setGlobalSummary] = useState([]);
  const [latestTakzirDate, setLatestTakzirDate] = useState(null);
  const [latestTakzirSummary, setLatestTakzirSummary] = useState([]);
  const [showTakzirPopup, setShowTakzirPopup] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editKeterlambatan, setEditKeterlambatan] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Modal State
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, [filterDate]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch all data always to compute the global summary for "Worst Jamiyyah" logic
    const { data: absensi, error: err } = await supabase.from('absensi').select('*');

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const summary = {};
    const LOCATIONS = ['Lantai 2', 'Lantai 3'];
    
    JAMIYYAH_LIST.forEach(j => {
      LOCATIONS.forEach(loc => {
        summary[`${j} - ${loc}`] = { namaJamiyyah: j, lokasi: loc, total: 0, hadir: 0, tidakHadir: 0, telatCount: 0, detail: {} };
      });
    });

    absensi.forEach(row => {
      const j = row.jamiyyah;
      const loc = row.lokasi || 'Lantai 2'; // Fallback for older data
      const key = `${j} - ${loc}`;
      
      if (summary[key]) {
        summary[key].total += 1;
        if (row.status_kehadiran === 'Hadir') {
          summary[key].hadir += 1;
          const k = row.detail_keterlambatan;
          if (k) {
            summary[key].detail[k] = (summary[key].detail[k] || 0) + 1;
            if (k.includes('Telat')) {
              summary[key].telatCount += 1;
            }
          }
        } else {
          summary[key].tidakHadir += 1;
        }
      }
    });
    
    const summaryArray = [];
    JAMIYYAH_LIST.forEach(j => {
      LOCATIONS.forEach(loc => {
        summaryArray.push({ 
          jamiyyah: `${j} ${loc}`, 
          ...summary[`${j} - ${loc}`] 
        });
      });
    });

    setGlobalSummary(summaryArray);

    // Latest Date Takziran Summary
    let latestDate = null;
    let popupSummaryArray = [];
    if (absensi.length > 0) {
      const datesInDb = [...new Set(absensi.map(a => a.tanggal_jadwal))].sort();
      latestDate = datesInDb[datesInDb.length - 1];
      
      const popupSummary = {};
      JAMIYYAH_LIST.forEach(j => {
        LOCATIONS.forEach(loc => {
          popupSummary[`${j} - ${loc}`] = { namaJamiyyah: j, lokasi: loc, tidakHadir: 0, telatCount: 0, rawTelat: '' };
        });
      });

      const latestAbsensi = absensi.filter(a => a.tanggal_jadwal === latestDate);
      latestAbsensi.forEach(row => {
        const j = row.jamiyyah;
        const loc = row.lokasi || 'Lantai 2';
        const key = `${j} - ${loc}`;
        if (popupSummary[key]) {
          if (row.status_kehadiran === 'Hadir') {
            const k = row.detail_keterlambatan;
            if (k && k.includes('Telat')) {
              popupSummary[key].telatCount = 1;
              popupSummary[key].rawTelat = k;
            }
          } else {
            popupSummary[key].tidakHadir = 1;
          }
        }
      });
      popupSummaryArray = Object.values(popupSummary);
    }
    setLatestTakzirDate(latestDate);
    setLatestTakzirSummary(popupSummaryArray);

    if (filterDate === 'Global') {
      setData(summaryArray);
    } else {
      setData(absensi.filter(a => a.tanggal_jadwal === filterDate));
    }
    setLoading(false);
  };

  const delayOptions = ['Tepat Waktu', 'Telat 5 Menit', 'Telat 10 Menit', 'Telat 15 Menit/Lebih'];

  const handleEditClick = (record) => {
    setEditingRecord(record);
    setEditStatus(record.status_kehadiran);
    setEditKeterlambatan(record.detail_keterlambatan || '');
  };

  const saveEdit = async () => {
    setSavingEdit(true);
    const updates = {
      status_kehadiran: editStatus,
      detail_keterlambatan: editStatus === 'Hadir' ? editKeterlambatan : null
    };

    const { error: err } = await supabase
      .from('absensi')
      .update(updates)
      .eq('id', editingRecord.id);

    setSavingEdit(false);
    if (err) {
      alert("Gagal merubah data: " + err.message);
    } else {
      setEditingRecord(null);
      fetchData(); // Refresh data
    }
  };

  const handleDeleteClick = (record) => {
    setDeletingRecord(record);
    setDeletePassword('');
    setDeleteErrorMsg('');
  };

  const confirmDelete = async () => {
    if (deletePassword !== 'cipuyganteng') {
      setDeleteErrorMsg('Password salah!');
      return;
    }

    setIsDeleting(true);
    setDeleteErrorMsg('');

    const { error: err } = await supabase
      .from('absensi')
      .delete()
      .eq('id', deletingRecord.id);

    setIsDeleting(false);

    if (err) {
      setDeleteErrorMsg("Gagal menghapus data: " + err.message);
    } else {
      setDeletingRecord(null);
      fetchData();
    }
  };

  if (error) {
    return (
      <div className="p-4 m-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full px-4 py-6 pb-24 relative">
      
      {/* Title & Filter */}
      <div className="flex flex-col space-y-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="bg-navy/10 p-3 rounded-full">
            {filterDate === 'Global' ? <BarChart3 className="w-6 h-6 text-navy" /> : <CalendarDays className="w-6 h-6 text-navy" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Rekapitulasi</h2>
            <p className="text-xs text-slate-500">Global & Harian</p>
          </div>
        </div>
        
        <div>
          <select 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-navy focus:border-transparent transition-all outline-none text-slate-800 text-sm font-semibold"
          >
            <option value="Global">Semua Jadwal (Global)</option>
            {dates.map(d => (
              <option key={d} value={d}>{formatDateID(d)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 text-navy">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="font-semibold text-slate-500 animate-pulse">Memuat data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {filterDate === 'Global' ? (
            /* ================= VIEW GLOBAL ================= */
            data.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-navy truncate pr-2">{item.jamiyyah}</h3>
                  <span className="text-[10px] font-bold bg-navy/10 text-navy px-2 py-1 rounded-full">
                    {item.total} Input
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex mb-4">
                    <div className="flex-1 text-center border-r border-slate-100">
                      <div className="text-2xl font-black text-navy">{item.hadir}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider pt-1">Hadir</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-black text-red-500">{item.tidakHadir}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider pt-1">Alpa</div>
                    </div>
                  </div>
                  {item.hadir > 0 && Object.keys(item.detail).length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 border border-slate-100 mt-2">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Statistik Keterlambatan:</p>
                      {Object.entries(item.detail).map(([k, v]) => (
                        <div key={k} className="flex justify-between items-center text-xs">
                          <span className="text-slate-600">{k}</span>
                          <span className="font-bold text-navy bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-sm">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            /* ================= VIEW SPECIFIC DATE (EDITABLE) ================= */
            <>
              {(() => {
                const LOCATIONS = ['Lantai 2', 'Lantai 3'];
                const missingJamiyyah = [];
                
                JAMIYYAH_LIST.forEach(j => {
                  LOCATIONS.forEach(loc => {
                    const hasRecord = data.some(record => record.jamiyyah === j && record.lokasi === loc);
                    if (!hasRecord) {
                      missingJamiyyah.push(`${j} ${loc === 'Lantai 2' ? 'LT 2' : 'LT 3'}`);
                    }
                  });
                });

                return (
                  <>
                    {missingJamiyyah.length > 0 && (
                      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs font-bold text-orange-800 mb-3 flex items-center">
                          <span className="w-2 h-2 rounded-full bg-orange-500 mr-2 animate-pulse"></span>
                          Belum Isi Absen ({missingJamiyyah.length} Peserta)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {missingJamiyyah.map(mj => (
                            <span key={mj} className="text-[10px] font-bold bg-white text-orange-600 px-2 py-1 rounded-lg shadow-sm border border-orange-100">
                              {mj}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {data.length === 0 ? (
                      <div className="text-center text-sm font-semibold text-slate-500 py-10 bg-white rounded-2xl border border-slate-100">Belum ada absen di tanggal ini.</div>
                    ) : (
                data.map((record) => (
                  <div key={record.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-bold text-navy">{record.jamiyyah}</h3>
                        {record.lokasi && (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {record.lokasi}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {record.status_kehadiran === 'Hadir' ? (
                          <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Hadir
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
                            <UserX className="w-3 h-3 mr-1" /> Alpa
                          </span>
                        )}
                        {record.detail_keterlambatan && (
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            {record.detail_keterlambatan}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleDeleteClick(record)}
                        className="p-2 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg border border-red-100 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditClick(record)}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-navy hover:bg-navy/5 rounded-lg border border-slate-200 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
              </>
                );
              })()}
            </>
          )}

        </div>
      )}

      {/* Edit Modal (Overlay) */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-navy mb-1">Edit Absensi</h3>
            <p className="text-xs text-slate-500 mb-5">{editingRecord.jamiyyah} • {formatDateID(editingRecord.tanggal_jadwal)}</p>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditStatus('Hadir')}
                  className={clsx(
                    "p-3 rounded-xl border-2 transition-all font-semibold text-sm",
                    editStatus === 'Hadir' ? "border-navy bg-navy/5 text-navy" : "border-slate-100 text-slate-400"
                  )}
                >
                  Hadir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditStatus('Tidak Hadir');
                    setEditKeterlambatan('');
                  }}
                  className={clsx(
                    "p-3 rounded-xl border-2 transition-all font-semibold text-sm",
                    editStatus === 'Tidak Hadir' ? "border-red-500 bg-red-50 text-red-600" : "border-slate-100 text-slate-400"
                  )}
                >
                  Tidak Hadir
                </button>
              </div>

              {editStatus === 'Hadir' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Status Keterlambatan</label>
                  <div className="grid grid-cols-2 gap-2">
                    {delayOptions.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setEditKeterlambatan(opt)}
                        className={clsx(
                          "p-2 text-xs font-medium rounded-lg border",
                          editKeterlambatan === opt ? "bg-navy text-white border-navy" : "bg-slate-50 border-slate-200 text-slate-600"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => setEditingRecord(null)}
                className="flex-1 py-3 font-semibold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Batal
              </button>
              <button 
                onClick={saveEdit}
                disabled={savingEdit || (editStatus === 'Hadir' && !editKeterlambatan)}
                className="flex-1 py-3 font-bold text-white bg-navy rounded-xl hover:bg-navy-light disabled:opacity-50 flex items-center justify-center"
              >
                {savingEdit ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal (Overlay) */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-1">Hapus Rekapan</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              Masukkan password untuk menghapus rekapan peserta <strong>{deletingRecord.jamiyyah}</strong>.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <input 
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="******"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-slate-800 text-center tracking-widest"
                />
              </div>
              {deleteErrorMsg && (
                <p className="text-xs font-semibold text-red-500 text-center">{deleteErrorMsg}</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => setDeletingRecord(null)}
                className="flex-1 py-3 font-semibold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting || !deletePassword}
                className="flex-1 py-3 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Takziran Popup */}
      {showTakzirPopup && !loading && latestTakzirSummary.length > 0 && (() => {
        const getOffenders = (lokasi, type) => {
          const items = latestTakzirSummary.filter(s => s.lokasi === lokasi);
          return items.filter(s => type === 'alpa' ? s.tidakHadir > 0 : s.telatCount > 0);
        };

        const alpaLt2 = getOffenders('Lantai 2', 'alpa');
        const alpaLt3 = getOffenders('Lantai 3', 'alpa');
        const telatLt2 = getOffenders('Lantai 2', 'telat');
        const telatLt3 = getOffenders('Lantai 3', 'telat');

        const hasAlpa = alpaLt2.length > 0 || alpaLt3.length > 0;
        const hasTelat = telatLt2.length > 0 || telatLt3.length > 0;

        if (!hasAlpa && !hasTelat) return null;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
              <div className="bg-red-600 p-5 text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500 rounded-full blur-2xl opacity-50"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-700 rounded-full blur-2xl opacity-50"></div>
                <h3 className="text-xl font-bold text-white relative z-10 flex items-center justify-center">
                  <UserX className="w-6 h-6 mr-2" />
                  Daftar Takziran
                </h3>
                <p className="text-xs text-red-100 mt-1 relative z-10">Minggu Ini: {formatDateID(latestTakzirDate)}</p>
              </div>
              
              <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
                
                {/* ALPA SECTION */}
                {hasAlpa && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
                      Daftar Alpa
                    </h4>
                    <div className="space-y-3">
                      {alpaLt2.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 mb-1.5">Lantai 2</p>
                          {alpaLt2.map(w => (
                            <div key={w.namaJamiyyah} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm mb-1.5 last:mb-0">
                              <span className="text-xs font-bold text-navy truncate pr-2">{w.namaJamiyyah}</span>
                              <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded shrink-0">Alpa</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {alpaLt3.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 mb-1.5">Lantai 3</p>
                          {alpaLt3.map(w => (
                            <div key={w.namaJamiyyah} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm mb-1.5 last:mb-0">
                              <span className="text-xs font-bold text-navy truncate pr-2">{w.namaJamiyyah}</span>
                              <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded shrink-0">Alpa</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TELAT SECTION */}
                {hasTelat && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2"></span>
                      Daftar Telat
                    </h4>
                    <div className="space-y-3">
                      {telatLt2.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 mb-1.5">Lantai 2</p>
                          {telatLt2.map(w => (
                            <div key={w.namaJamiyyah} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm mb-1.5 last:mb-0">
                              <span className="text-xs font-bold text-navy truncate pr-2">{w.namaJamiyyah}</span>
                              <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded shrink-0 max-w-[120px] text-right leading-tight">{w.rawTelat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {telatLt3.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 mb-1.5">Lantai 3</p>
                          {telatLt3.map(w => (
                            <div key={w.namaJamiyyah} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm mb-1.5 last:mb-0">
                              <span className="text-xs font-bold text-navy truncate pr-2">{w.namaJamiyyah}</span>
                              <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded shrink-0 max-w-[120px] text-right leading-tight">{w.rawTelat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={() => setShowTakzirPopup(false)}
                  className="w-full py-3 font-bold text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors shadow-md"
                >
                  Tutup & Lihat Rekapan
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
