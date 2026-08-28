import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { JAMIYYAH_LIST, PERUMUS_LIST } from '../constants';
import { Users, UserPlus, Trash2, Loader2, ArrowRightLeft } from 'lucide-react';
import CustomSelect from './CustomSelect';
import clsx from 'clsx';

export default function AdminPanel() {
  const [peserta, setPeserta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newNama, setNewNama] = useState('');
  const [newKategori, setNewKategori] = useState('jamiyyah');
  const [newLokasi, setNewLokasi] = useState('Semua');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPeserta();
  }, []);

  const fetchPeserta = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('peserta').select('*').order('nama', { ascending: true });
    
    if (error) {
      if (error.code === '42P01') { // relation does not exist
        setError('Tabel "peserta" belum dibuat di Supabase! Harap jalankan kode SQL terlebih dahulu.');
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    if (data.length === 0) {
      await seedData();
    } else {
      // Check for duplicates
      const nameCounts = {};
      const duplicatesToDelete = [];
      const uniquePeserta = [];

      data.forEach(p => {
        if (!nameCounts[p.nama]) {
          nameCounts[p.nama] = 1;
          uniquePeserta.push(p);
        } else {
          duplicatesToDelete.push(p.id);
        }
      });

      if (duplicatesToDelete.length > 0) {
        // Delete duplicates from DB
        await supabase.from('peserta').delete().in('id', duplicatesToDelete);
        setPeserta(uniquePeserta);
      } else {
        setPeserta(data);
      }
    }
    setLoading(false);
  };

  const seedData = async () => {
    setLoading(true);
    const insertData = [];
    JAMIYYAH_LIST.forEach(j => {
      insertData.push({ nama: j, kategori: 'jamiyyah', lokasi: 'Semua' });
    });
    PERUMUS_LIST.forEach(p => {
      insertData.push({ nama: p, kategori: 'perumus', lokasi: 'Lantai 2' }); // Default to Lantai 2
    });

    const { data, error } = await supabase.from('peserta').insert(insertData).select();
    if (error) {
      setError('Gagal inisialisasi data: ' + error.message);
    } else {
      setPeserta(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newNama || !newKategori || !newLokasi) return;

    setIsSubmitting(true);
    const { data, error } = await supabase.from('peserta').insert([{
      nama: newNama,
      kategori: newKategori,
      lokasi: newLokasi
    }]).select();

    if (error) {
      alert("Gagal menambah: " + error.message);
    } else if (data) {
      setPeserta(prev => [...prev, data[0]].sort((a, b) => a.nama.localeCompare(b.nama)));
      setNewNama('');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus ${nama}?`)) return;
    
    const { error } = await supabase.from('peserta').delete().eq('id', id);
    if (error) {
      alert("Gagal menghapus: " + error.message);
    } else {
      setPeserta(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleToggleLokasi = async (p) => {
    // Only perumus usually changes floors, but we can allow it generally.
    const nextLokasi = p.lokasi === 'Lantai 2' ? 'Lantai 3' : (p.lokasi === 'Lantai 3' ? 'Lantai 2' : 'Lantai 2');
    
    const { error } = await supabase.from('peserta').update({ lokasi: nextLokasi }).eq('id', p.id);
    if (error) {
      alert("Gagal merubah lokasi: " + error.message);
    } else {
      setPeserta(prev => prev.map(item => item.id === p.id ? { ...item, lokasi: nextLokasi } : item));
    }
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto p-4 m-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
        <h3 className="font-bold mb-2">Error</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const jamiyyahList = peserta.filter(p => p.kategori === 'jamiyyah');
  const perumusList = peserta.filter(p => p.kategori === 'perumus');

  return (
    <div className="max-w-md mx-auto w-full px-4 py-6 pb-24">
      
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="bg-navy/10 p-3 rounded-full">
          <Users className="w-6 h-6 text-navy" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kelola Peserta</h2>
          <p className="text-xs text-slate-500">Manajemen Database Dinamis</p>
        </div>
      </div>

      {/* Form Add */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
        <h3 className="font-bold text-navy mb-4 flex items-center">
          <UserPlus className="w-4 h-4 mr-2" /> Tambah Peserta Baru
        </h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Kategori</label>
            <CustomSelect 
              value={newKategori}
              onChange={(val) => {
                setNewKategori(val);
                if (val === 'jamiyyah') setNewLokasi('Semua');
                if (val === 'perumus' && newLokasi === 'Semua') setNewLokasi('Lantai 2');
              }}
              options={[
                { value: 'jamiyyah', label: 'Peserta Fathul Qorib' },
                { value: 'perumus', label: 'Perumus LBM HM' }
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Lengkap</label>
            <input 
              type="text" 
              value={newNama}
              onChange={(e) => setNewNama(e.target.value)}
              placeholder="Masukkan nama..."
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-navy focus:border-transparent transition-all outline-none text-slate-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tugas Lantai</label>
            <CustomSelect 
              value={newLokasi}
              onChange={setNewLokasi}
              options={[
                { value: 'Semua', label: 'Semua Lantai (Umum)' },
                { value: 'Lantai 2', label: 'Khusus Lantai 2' },
                { value: 'Lantai 3', label: 'Khusus Lantai 3' }
              ]}
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting || !newNama}
            className="w-full py-3 bg-navy text-white rounded-xl font-bold hover:bg-navy-light transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Peserta"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-navy" /></div>
      ) : (
        <div className="space-y-6">
          
          {/* List Perumus */}
          <div>
            <h3 className="font-bold text-slate-700 mb-3 flex justify-between items-center px-1">
              <span>Perumus LBM HM</span>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{perumusList.length}</span>
            </h3>
            <div className="space-y-2">
              {perumusList.map(p => (
                <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="pr-2">
                    <p className="font-semibold text-sm text-slate-800">{p.nama}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-bold">
                      {p.lokasi}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => handleToggleLokasi(p)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Rolling Lantai"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id, p.nama)}
                      className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* List Jamiyyah */}
          <div>
            <h3 className="font-bold text-slate-700 mb-3 flex justify-between items-center px-1">
              <span>Peserta Fathul Qorib</span>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{jamiyyahList.length}</span>
            </h3>
            <div className="space-y-2">
              {jamiyyahList.map(p => (
                <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{p.nama}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-bold">{p.lokasi}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(p.id, p.nama)}
                    className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
