# CodeCollab

Editor kode real-time untuk tim kecil. Kolaborasi maksimal 5 orang per room, dengan sinkronisasi teks berbasis CRDT, chat room, dan eksekusi kode langsung dari editor.

## Fitur

- Kolaborasi real-time dengan Yjs (CRDT) + binding Monaco (`y-monaco`).
- Maksimal 5 user per room. User ke-6 ditolak dengan notifikasi room penuh.
- Kursor dan nama user muncul di editor (awareness).
- Chat room dengan daftar anggota online.
- Ganti bahasa pemrograman dan tema gelap/terang.
- Eksekusi kode (tombol Run) dengan output disiarkan ke semua user di room.
- Preview HTML/CSS live di panel Preview.
- Ekspor/download kode sesuai ekstensi bahasa.
- Responsif untuk layar kecil.

## Teknologi

- Frontend: React 18 + Vite, Tailwind CSS, Monaco Editor, lucide-react.
- Sinkronisasi: Yjs, y-websocket, y-monaco.
- Backend: Node.js, Express, Socket.IO, ws.
- Eksekusi kode: child_process server-side (Node, Python, TypeScript via transpile) dan iframe sandbox client-side (HTML/CSS).

## Struktur folder

```text
client/                  # React (Vite) + Tailwind
  src/
    components/          # JoinScreen, RoomHeader, CodeEditor, ChatPanel, FullRoomModal, RunConsole
    hooks/useYjsSocket.js# Hook manajemen Socket.IO, Yjs, dan state run
    utils/               # constants (bahasa, warna), downloadHelper, format
server/
  server.js              # Express + Socket.IO + y-websocket (WS /ws)
  codeRunner.js          # Eksekusi kode server-side (Node/Python/TS)
```

## Menjalankan lokal

Server (port default 3001):

```bash
cd server
npm install
node server.js
```

Client (dev server Vite di port 5173):

```bash
cd client
npm install
npm run dev
```

Buka `http://localhost:5173`, buat room, lalu bagikan kode room atau link undangan ke rekan.

## Fitur eksekusi kode

Bahasa yang bisa di-run:

- JavaScript: dieksekusi dengan Node di server, hasilnya disiarkan ke semua anggota room.
- TypeScript: ditranspile lalu dijalankan dengan Node.
- Python: dieksekusi dengan Python di server.
- HTML/CSS: tampil sebagai Preview di iframe sandbox, ter-update saat mengetik.

Pengamanan yang aktif:

- Timeout eksekusi 5 detik dengan kill (proses loop tak berujung dihentikan).
- Batas output 64 KB.
- Cooldown: satu eksekusi per user dengan jeda minimal 1,5 detik, dan satu eksekusi berjalan per user bersamaan (guard busy).
- Bahasa di luar daftar (JS, TS, Python) ditolak server dengan alasan `unsupported`.

Catatan pemutusan kebutuhan: eksekusi berjalan di komputer/host server tanpa sandbox container. Ini wajar untuk demo dan penggunaan lokal, tapi perlu pengamanan tambahan sebelum dipakai publik (lihat Keamanan).

## Deploy ke Render (gratis) + GitHub

Prinsip: Vercel/Netlify tidak dipakai karena fitur butuh koneksi WebSocket yang tahan lama. Render (atau VPS lain) bisa.

1. Push kode ke GitHub (private dulu tidak masalah).
2. Di dashboard Render, buat Web Service baru, hubungkan repo GitHub, pilih branch `main`.
3. Isi konfigurasi:

   - Runtime: Node
   - Root Directory: `server`
   - Build Command: `npm install && (cd ../client && npm install && npm run build)`
   - Start Command: `node server.js`
   - Health Check Path: `/api/health`
   - Plan: Free

4. Deploy. URL jadi `https://nama-app.onrender.com`. Server otomatis melayani frontend hasil build di `client/dist` dan semua endpoint (REST, Socket.IO, WebSocket `/ws`) dari satu port.

Catatan free tier:

- Instance menganggur setelah 15 menit tanpa traffic lalu cold start sekitar 1 menit saat ada permintaan baru. Selama ada koneksi/chat aktif, instance tetap hidup.
- Resource 0,1 CPU / 512 MB di free tier, jadi eksekusi kode lebih pelan daripada lokal.
- Data room dan chat disimpan di memori, hilang saat restart atau spin-down.

## Keamanan (sebelum dipakai publik)

- Tambahkan batas proses global (contoh: maksimal 2 eksekusi kode bersamaan di seluruh server) di `codeRunner.js`, di samping guard per-user yang sudah ada.
- Pertimbangkan jalankan di dalam container dengan limit CPU/memori (Docker + cgroup), karena `child_process` menjalankan kode user di host.
- Rate-limit per IP pada endpoint HTTP bila ditambahkan endpoint baru.

## Lisensi

Belum ditentukan. Sesuaikan sebelum distribusi publik.