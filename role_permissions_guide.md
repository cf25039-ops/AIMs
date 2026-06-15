# 🔑 Panduan Peranan & Kawalan Akses (RBAC Guide) - AIMS Enterprise V5

Sistem **AIMS Enterprise V5** dilengkapi dengan **Kawalan Akses Berasaskan Peranan (Role-Based Access Control - RBAC)** yang ketat menggunakan **Supabase Row Level Security (RLS)** pada peringkat pangkalan data. 

Dokumen ini menjelaskan had kuasa, kebenaran akses (permissions), serta apa yang boleh/tidak boleh dilihat oleh 4 peranan utama sistem.

---

## 👥 Ringkasan Log Masuk Ujian (Demo Accounts)

Untuk tujuan ujian, kelayakan log masuk berikut telah di-seed di dalam sistem:

| Peranan (Role) | Emel Log Masuk | Kata Laluan | Peranan DB (Profile Role) | Skop Geografi / Projek |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@aims.com` | `Admin@123` | `super_admin` | Akses Penuh (Global) |
| **Project Admin** | `admin@aims.com` | `Admin@123` | `admin` / `project_admin` | Terhad Projek Terpilih (e.g. KKM) |
| **Technician** | `technician@aims.com` | `Tech@123` | `technician` | Terhad Fasiliti Ditugaskan (e.g. Hospital Kuantan) |
| **Viewer (Staff)** | `viewer@aims.com` | `View@123` | `viewer` / `department_user` | Terhad Jabatan Khusus (e.g. Kecemasan) |

---

## 1. 👑 Super Admin (`superadmin@aims.com`)
*Peranan pentadbir tertinggi organisasi dengan kuasa mutlak merentasi seluruh sistem.*

### 👁️ Apa yang Diorang Nampak (Menu Navigasi)
*   **Akses Penuh Tanpa Had**: Boleh melihat semua halaman utama:
    *   `Dashboard` (Realtime Overview & Global KPIs)
    *   `Projects` (Pendaftaran dan pengurusan kontrak projek)
    *   `Assets` (Inventori perkakasan global)
    *   `Contracts` (Butiran kontrak vendor & polisi SLA)
    *   `Maintenance` (Semua tiket kerosakan & pembaikan)
    *   `Vendors` (Direktori rakan kerjasama & pembekal)
    *   `Warehouse` (Stok barang ganti dan log pergerakan)
    *   `Reports` (Analitik data & metrik prestasi)
    *   `Intelligence` (Skor kesihatan AI untuk ramalan kerosakan)
    *   `Audit` (Log pematuhan keselamatan pangkalan data)
    *   `Settings` (Konfigurasi tema & kebenaran global)

### 🛠️ Apa yang Boleh Dibuat
*   **Bypass RLS**: RLS tidak dikenakan pada akaun ini; boleh membaca, mencipta, mengemas kini, dan memadam rekod dalam mana-mana jadual.
*   **Cipta Projek Baru**: Satu-satunya peranan yang dibenarkan mendaftar projek/kementerian baharu dalam sistem.
*   **Urus Pengguna & Peranan**: Menguruskan profil ahli projek dan menetapkan peranan (*assign roles*).
*   **Semakan Audit**: Memeriksa log audit penuh (`audit_logs`) untuk memantau semua aktiviti sisipan (*insert*), kemas kini (*update*), dan pemadaman (*delete*) oleh mana-mana pengguna.

### ❌ Apa yang Tidak Nampak / Tidak Boleh Dibuat
*   **Tiada Sekatan**: Tiada maklumat yang disembunyikan daripada peranan ini.

---

## 2. 🏢 Project Admin (`admin@aims.com`)
*Pengurus projek khusus (cth: Projek KKM) dengan kuasa pentadbiran yang dihadkan mengikut skop projek sahaja.*

### 👁️ Apa yang Diorang Nampak (Menu Navigasi)
*   Nampak menu utama: **Dashboard**, **Projects**, **Assets**, **Contracts**, **Maintenance**, **Warehouse**, **Reports**, dan **Settings**.

### 🛠️ Apa yang Boleh Dibuat
*   **Kawalan Pentadbiran Skop Projek**: Menguruskan semua maklumat aset, kontrak, fasiliti, jabatan, dan inventori gudang yang berada di bawah projek naungannya (cth: hanya KKM).
*   **Cipta & Kemaskini Aset**: Boleh menambah perkakasan (*hardware*) baharu dan mengemas kini spesifikasinya.
*   **Urus Kakitangan Projek**: Boleh menambah atau mengeluarkan juruteknik (*technicians*) atau kakitangan daripada projek naungannya.
*   **Pemadaman Aset**: Dibenarkan memadam aset (*delete hardware*) yang telah disahkan bersara atau dilupuskan.
*   **Urus Kontrak & SLA**: Menetapkan polisi SLA projek dan memantau status pematuhan vendor.

### ❌ Apa yang Tidak Nampak / Tidak Boleh Dibuat
*   **Sekatan Silang Projek (Cross-Project)**: RLS menghalang mereka daripada melihat, mencari, atau mengedit data bagi projek kementerian lain.
*   **Modul Khas Tersekat**: Tidak nampak menu **Vendors** (direktori global), **Intelligence** (AI health scoring), dan **Audit** (Compliance Logs).
*   **Sekatan Cipta Projek**: Tidak mempunyai kuasa untuk mendaftarkan projek global baru ke dalam sistem.

---

## 3. 🔧 Technician (`technician@aims.com`)
*Kakitangan teknikal lapangan yang bertanggungjawab untuk melakukan pembaikan dan menyelenggara perkakasan.*

### 👁️ Apa yang Diorang Nampak (Menu Navigasi)
*   Hanya nampak menu kerja teras:
    *   `Dashboard` (Ringkasan kerja & petunjuk operasi)
    *   `My Tickets` / `Maintenance` (Senarai tiket kerosakan/senggaraan)
    *   `Profile` (Untuk tetapan tema)

### 🛠️ Apa yang Boleh Dibuat
*   **Tindakan Tiket Kerosakan**: Boleh menukar status tiket pembaikan (cth: menukar daripada *Open* kepada *Investigation*, *In Repair*, atau *Resolved*).
*   **Log Senggaraan**: Boleh memasukkan nota pembaikan (*repair logs*), kos bahan ganti, dan memuat naik fail/gambar bukti pembaikan.
*   **Kemaskini Status Hardware**: Boleh mengubah status semasa perkakasan (cth: menukar status Dell PC daripada *Active* kepada *In Repair*).
*   **Amaran Pintar Tempatan (Notification Routing)**: Menerima notifikasi in-app serta-merta apabila pengguna jabatan melaporkan kerosakan **hanya jika perkakasan tersebut berada di dalam fasiliti tugasan mereka** (cth: Hospital Kuantan).

### ❌ Apa yang Tidak Nampak / Tidak Boleh Dibuat
*   **Modul Pengurusan Tersekat**: Tidak nampak menu **Projects**, **Assets** (inventori penuh), **Contracts**, **Vendors**, **Warehouse**, **Reports**, **Intelligence**, **Audit**, dan **Settings**.
*   **Tiada Kuasa Memadam**: Dihalang sepenuhnya oleh pangkalan data daripada memadam sebarang perkakasan, kontrak, atau tiket kerosakan.
*   **Sekatan Geografi**: Tidak boleh melihat atau mengakses tiket dari kawasan/fasiliti lain untuk menjaga privasi operasi.

---

## 4. 👁️ Viewer / Department User (`viewer@aims.com`)
*Kakitangan biasa (kakitangan jabatan) yang ditugaskan untuk menggunakan perkakasan dan melaporkan sebarang kerosakan.*

### 👁️ Apa yang Diorang Nampak (Menu Navigasi)
*   Hanya nampak menu asas pengguna:
    *   `Dashboard` (Overview ringkas - read-only)
    *   `My Assets` (Hanya menyenaraikan perkakasan yang ditugaskan di jabatan sendiri)
    *   `My Tickets` (Senarai aduan kerosakan yang mereka laporkan)
    *   `Profile` & `Help` (Bantuan & manual sistem)

### 🛠️ Apa yang Boleh Dibuat
*   **Melaporkan Isu**: Boleh membuka tiket penyelenggaraan (*create repair ticket*) sekiranya perkakasan jabatan mengalami kerosakan.
*   **Muat Naik Lampiran**: Boleh memuat naik gambar isu perkakasan semasa membuat aduan.
*   **Tinjauan Aset (Read-Only)**: Memantau spesifikasi perkakasan jabatan sendiri, status waranti, dan skor kesihatan semasa.

### ❌ Apa yang Tidak Nampak / Tidak Boleh Dibuat
*   **Tiada Capaian Global**: Tidak nampak menu **Projects**, **Assets** (global), **Contracts**, **Vendors**, **Warehouse**, **Reports**, **Intelligence**, **Audit**, dan **Settings**.
*   **Tiada Kuasa Mengedit Aset**: RLS menyekat sebarang cubaan mengemas kini maklumat asas perkakasan (seperti menukar nama PC, jenama, no. siri, dll.).
*   **Tiada Kuasa Status**: Tidak boleh menukar status tiket yang sedang berjalan (hanya Project Admin dan Technician dibenarkan).
*   **Akses Terpaku Jabatan**: Disekat daripada melihat rekod aset atau tiket aduan daripada jabatan, fasiliti, atau projek lain.
