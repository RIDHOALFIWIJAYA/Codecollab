# 🤖 AI Agent Coding Rules & Protocol

## 1. Project Context
- **Project Name:** Real-time Collaborative Code Editor
- **Role:** Elite Full-Stack & System Engineer
- **Goal:** Membangun aplikasi collaborative editor real-time dengan batas max 5 user/room, fitur chat, dan export code.
- **Tech Stack:**
  - **Frontend:** React (Vite), Tailwind CSS, `@monaco-editor/react`, `yjs`, `y-monaco`, `y-websocket`, `socket.io-client`
  - **Backend:** Node.js, Express.js, `ws`, `y-websocket`, `socket.io`

---

## 2. Core Constraints & Business Logic (STRICT)
1. **Room Capacity Limit (Max 5 Users):**
   - Server HARUS menolak koneksi user ke-6 yang mencoba masuk ke room yang sama dan mengirimkan signal `ROOM_FULL`.
2. **Conflict-Free Data Sync:**
   - Semua perubahan teks editor WAJIB menggunakan **Yjs (CRDT)** dengan Monaco Editor binding (`y-monaco`).
3. **Clean React Architecture:**
   - Gunakan **Functional Components** dan **Custom Hooks** untuk pemisahan logika WebSocket/Yjs dari UI Component.
   - Hindari memory leak pada WebSocket connection/listener (selalu jalankan cleanup function di `useEffect` / `unmount`).

---

## 3. Workflow & Execution Protocol
Sebelum menulis atau mengubah kode, Agent WAJIB mengikuti langkah berikut:
1. **Analyze File Structure:** Periksa struktur folder React yang ada sebelum menambahkan file baru.
2. **Step-by-Step Execution:** Kerjakan komponen secara modular (Header -> Editor -> Chat Panel -> Logic Sync).
3. **No Placeholders:** Selalu berikan kode utuh (*complete working code*), hindari potongan kode seperti `// rest of code goes here`.
4. **Self-Correction:** Pastikan semua `import` React, Lucide Icons, dan Tailwind classes sudah valid.

---

## 4. Code Style Guide (React & Tailwind)
- **React Standards:** Functional Component + ES6+ (Arrow functions, destructured props, `useState`, `useEffect`, `useRef`).
- **Styling:** Gunakan Tailwind CSS murni. Hindari custom CSS file berlebihan atau inline style (`style={{...}}`).
- **Icons:** Gunakan `lucide-react` untuk icon UI (Chat, Download, Users, Settings, dll).
- **Error Handling:** Bungkus proses async & WebSocket connection dengan `try-catch` serta sediakan status UI yang jelas (Connecting, Connected, Full, Error).

---

## 5. Directory Structure Target
```text
client/
├── src/
│   ├── components/
│   │   ├── RoomHeader.jsx     # Status room (X/5), Lang & Theme switcher, Download button
│   │   ├── CodeEditor.jsx     # Monaco Editor + Yjs Binding + Awareness cursor
│   │   ├── ChatPanel.jsx      # Chat room real-time & user list
│   │   └── FullRoomModal.jsx  # Warning UI jika slot room (5/5) penuh
│   ├── hooks/
│   │   └── useYjsSocket.js    # Custom hook manajemen Yjs & Socket connection
│   ├── utils/
│   │   └── downloadHelper.js  # Utility export file sesuai ekstensi bahasa
│   ├── App.jsx
│   └── main.jsx

## 6. Build & Dev Optimization Rules
- **DURING DEVELOPMENT:** DILARANG menjalankan `npm run build` atau `vite build` untuk pengujian lokal.
- Gunakan `npm run dev` / Vite dev server untuk testing frontend.
- Cukup lakukan `npm run build` HANYA ketika seluruh fitur selesai dan masuk ke tahap final delivery.