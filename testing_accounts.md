# 🔑 Senarai Akaun Log Masuk untuk Ujian Sistem AIMS (Demo Logins)

Dokumen ini menyediakan senarai semua akaun demo, peranan (roles), skop akses, dan kelayakan log masuk yang telah dikonfigurasikan di dalam pangkalan data untuk menguji sistem **AIMS Enterprise V5**.

> [!IMPORTANT]
> **KATA LALUAN PERASi**: Semua akaun di bawah menggunakan kata laluan yang sama: **`Admin123!`**

---

## 👥 Akaun Pengguna & Skop Akses

Berikut adalah senarai lengkap 4 akaun utama yang mewakili peranan berbeza (Role-Based Access Control - RBAC) dalam sistem AIMS:

| Emel Log Masuk | Kata Laluan | Peranan (Role) | Skop Akses & Fungsi |
| :--- | :--- | :--- | :--- |
| **`superadmin@aims.com`** | `Admin123!` | **Super Administrator** (`super_admin`) | **Akses Penuh Tanpa Had**. Boleh melihat, mencipta, mengemas kini, dan memadam semua data (projek, aset, kontrak, vendor, log audit, dan tetapan global) merentasi seluruh organisasi. |
| **`kkm.admin@aims.com`** | `Admin123!` | **Project Administrator** (`project_admin`) | **Akses Terhad Projek KKM**. Mempunyai kuasa pentadbiran penuh tetapi disekat oleh RLS (Row Level Security) untuk projek **Kementerian Kesihatan Malaysia (KKM)** sahaja. Tidak boleh melihat data projek lain. |
| **`tech.kuantan@aims.com`** | `Admin123!` | **Technician** (`technician`) | **Akses Senggaraan/Pembaikan**. Boleh melihat aset KKM dan menguruskan serta mengemas kini status tiket penyelenggaraan/repair yang dibuka untuk Hospital Kuantan (Pahang). |
| **`user.emergency@aims.com`** | `Admin123!` | **Department User** (`department_user`) | **Akses Terhad Jabatan**. Hanya boleh melihat aset yang ditugaskan kepada **Jabatan Kecemasan (Emergency Department)** di **Hospital Kuantan** sahaja. Boleh melaporkan isu dan membuka tiket baharu. |

---

## 🛠️ Senarai Aset Ujian (Demo Assets)

Apabila anda log masuk menggunakan **Department User** (`user.emergency@aims.com`), anda akan melihat senarai aset khusus di bawah **Jabatan Kecemasan (Hospital Kuantan)** yang sedia untuk diuji:

1. 💻 **PC KKM-PC-001** (Dell OptiPlex 7090)
   * **Serial Number**: `SNDELL101`
   * **Status**: Aktif | **Health Score**: `95%`
2. 💻 **Laptop KKM-LPT-001** (HP EliteBook 840 G8)
   * **Serial Number**: `SNHP201`
   * **Status**: Aktif | **Health Score**: `88%`
3. 🖨️ **Printer KKM-PRT-001** (Brother MFC-L8900CDW)
   * **Serial Number**: `SNBR301`
   * **Status**: Dalam Pembaikan (*In Repair*) | **Health Score**: `45%`
4. 🖥️ **Server KKM-SVR-001** (HPE ProLiant DL380 Gen10)
   * **Serial Number**: `SNHPE401`
   * **Status**: Aktif | **Health Score**: `92%`

---

## 📋 Senarai Tiket Ujian (Seeded Maintenance Tickets)

Pangkalan data telah di-seed dengan tiket dummy penyelenggaraan bagi memudahkan ujian aliran kerja sistem (workflow):

* **Tiket #1**: *Laptop Battery Only Holds 45min Charge* (Medium) - Dibuka untuk Laptop HP EliteBook.
* **Tiket #2**: *Dell PC Shuts Down Randomly* (High) - Dibuka untuk Dell OptiPlex.
* **Tiket #3**: *Brother Printer Jamming on Double-Sided* (Low) - Dibuka untuk Printer Brother.

---

## 💡 Panduan Ujian Senario RBAC (Syor Aliran Ujian)

Untuk melihat kehebatan sistem **AIMS Enterprise V5**, anda disyorkan menguji senario berikut:

1. **Senario Pengguna Jabatan (Department User)**:
   * Log masuk sebagai `user.emergency@aims.com`.
   * Buka menu **Maintenance** dan klik **Create Ticket** untuk melaporkan isu laptop Dell.
   * *Perhatikan*: RLS menyekat anda hanya untuk melihat aset jabatan anda sahaja.
2. **Senario Juruteknik (Technician)**:
   * Log masuk sebagai `tech.kuantan@aims.com`.
   * Anda akan melihat tiket yang dibuka oleh pengguna jabatan tadi. Anda boleh menukar status tiket kepada `In Progress` atau `Resolved`.
3. **Senario Pentadbir (Project/Super Admin)**:
   * Log masuk sebagai `kkm.admin@aims.com` atau `superadmin@aims.com`.
   * Buka dashboard premium yang baharu, semak carta visual analitik aset dan tiket, serta lihat menu **Projects** yang baru kita tambahkan.
