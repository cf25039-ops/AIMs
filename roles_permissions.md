# Panduan Peranan & Kebenaran Pengguna (AIMS RBAC)

Sistem AIMS Enterprise menggunakan **Kawalan Akses Berasaskan Peranan (Role-Based Access Control - RBAC)**. Setiap pengguna diberikan peranan spesifik yang menentukan apa yang mereka **boleh lihat** dan **boleh buat** dalam sistem.

Berikut adalah penjelasan terperinci untuk setiap peranan:

---

## 1. Super Admin
`superadmin@aims.com`

**Penerangan:** Pentadbir utama sistem yang mempunyai kawalan dan akses penuh secara global terhadap seluruh perisian dan pangkalan data.

*   **Apa yang Boleh Dilihat (Nampak):**
    *   **Semua data** dari semua lokasi/fasiliti tanpa sebarang sekatan.
    *   Semua menu navigasi: Dashboard, Assets (Hardware), Repair Tickets, Network Monitors, System Alerts, Laporan Audit, dan **User Management**.
*   **Apa yang Boleh Dibuat (Aksi):**
    *   Mencipta, mengemaskini, dan memadam (CRUD) apa-apa aset, tiket, atau lokasi.
    *   **Pengurusan Pengguna:** Boleh mencipta akaun baru, menukar kata laluan, dan menukar peranan untuk pengguna lain.
    *   Mengubah tetapan utama sistem.
*   **Apa yang TIDAK Boleh Dibuat:**
    *   Tiada sekatan. Boleh melakukan segalanya.

---

## 2. Project Admin
`admin@aims.com`

**Penerangan:** Pentadbir peringkat fasiliti atau projek. Mempunyai kuasa pengurusan yang tinggi tetapi biasanya terhad kepada projek/kawasan di bawah jagaan mereka sahaja (jika terdapat pengasingan data).

*   **Apa yang Boleh Dilihat (Nampak):**
    *   Aset, senarai penyelenggaraan, notifikasi dan data khusus untuk kawasan operasi mereka.
    *   Semua menu utama sistem (Dashboard, Assets, Tickets, Alerts).
*   **Apa yang Boleh Dibuat (Aksi):**
    *   Menambah, mengemaskini, dan memadam aset perkakasan.
    *   Mencipta tiket pembaikan dan menugaskannya (assign) kepada *Technician*.
    *   Melihat dan menganalisa laporan operasi.
*   **Apa yang TIDAK Boleh Dibuat:**
    *   Tidak boleh mengakses konfigurasi teknikal teras sistem.
    *   Dalam sesetengah senario pengasingan, tidak boleh melihat atau memadam akaun **Super Admin** yang lain.

---

## 3. Technician
`technician@aims.com`

**Penerangan:** Pasukan teknikal dan jurutera yang bekerja di lapangan. Peranan ini difokuskan kepada pelaksanaan kerja dan pembaikan.

*   **Apa yang Boleh Dilihat (Nampak):**
    *   Dashboard ringkasan teknikal.
    *   Senarai Aset untuk semakan status semasa.
    *   **Senarai Tugasan (Repair Tickets)** yang telah di-assign kepada mereka.
*   **Apa yang Boleh Dibuat (Aksi):**
    *   Menerima tugas / tiket pembaikan.
    *   Mengemas kini status tiket (Contoh: dari *Pending* ke *In Progress* atau *Resolved*).
    *   Menambah nota pembaikan, log kerja, dan memuat naik gambar bukti penyelenggaraan.
*   **Apa yang TIDAK Boleh Dibuat:**
    *   **Dihalang** daripada memadam rekod pangkalan data (tidak boleh *delete* aset atau tiket).
    *   **Dihalang** daripada mengakses menu Pengurusan Pengguna (User Management). Tidak boleh menambah/mengurus akaun pekerja lain.

---

## 4. Viewer
`viewer@aims.com`

**Penerangan:** Pengguna dengan akses pemerhati (Read-Only). Sesuai untuk pihak pengurusan atasan, klien, atau auditor luaran yang hanya perlu memantau prestasi tanpa membuat sebarang perubahan.

*   **Apa yang Boleh Dilihat (Nampak):**
    *   Dashboard analitik, status kelengkapan, dan kemajuan kerja (Repair Tickets).
*   **Apa yang Boleh Dibuat (Aksi):**
    *   Membaca dan memantau maklumat terkini sistem.
    *   (Jika disokong) Mengeksport data sebagai laporan PDF/Excel.
*   **Apa yang TIDAK Boleh Dibuat:**
    *   **Sama sekali tidak boleh mengubah data.** Semua fungsi seperti *Add, Edit, Delete* sama ada akan disembunyikan dari antaramuka pengguna (UI) atau akan disekat terus oleh pangkalan data (melalui RLS).
    *   Tidak boleh menukar status tiket dan tiada akses kepada tetapan sistem.

---

> **Maklumat Tambahan (Polisi RLS)**
> Polisi ini bukan sekadar disembunyikan melalui paparan (Frontend), tetapi dikuatkuasakan secara ketat di peringkat pangkalan data pelayan melalui *Supabase Row Level Security (RLS)*. Ini bermakna walaupun ada pengguna yang cuba menembusi sistem dengan API pihak ketiga, sekatan peranan ini akan tetap berfungsi dengan selamat.
