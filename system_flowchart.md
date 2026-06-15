# AIMS (Advanced Inventory Management System) Workflow

Below is the complete architectural workflow of how your AIMS system operates from start to finish, mapped out from user login to asset maintenance and reporting.

```mermaid
graph TD
    %% 1. Authentication & Roles
    A([User Access System]) --> B{Role Check}
    B -->|Super Admin| C1[Full Access & System Setup]
    B -->|Technician| C2[Maintenance & Audits]
    B -->|Asset Owner| C3[View Assets & Create Tickets]

    %% 2. Master Data Setup (Admin Level)
    C1 --> D[Master Data Configuration]
    D --> E[1. Register Vendors & SLAs]
    D --> F[2. Create Projects]
    E -.-> G
    F -.-> G
    G[3. Bind Vendors + Projects into Contracts]

    %% 3. Asset Registration Flow
    G --> H[Asset Registration Wizard]
    H --> I(Step 1: Select Project)
    I --> J(Step 2: Select Associated Contract)
    J --> K(Step 3: Define Geography)
    K --> L[Region -> State -> Daerah]
    L --> M(Step 4: Hardware Registration)
    
    %% Dynamic Hardware Splitting
    M --> N{Hardware Type?}
    N -->|PC/Laptop| O1[CPU, RAM, MAC, IP]
    N -->|Printer| O2[Toner Model, Printer Type, IP]
    N -->|Server| O3[OS, Rack Unit, Storage, IP]
    
    O1 --> P[(Saved to AIMS Database)]
    O2 --> P
    O3 --> P

    %% 4. Maintenance & Lifecycle
    C2 --> Q[Asset Lifecycle Management]
    C3 --> Q
    P -.-> Q
    
    Q --> R1[Create Maintenance Ticket]
    Q --> R2[Update Asset Status: Active/In Repair]
    Q --> R3[Log Audit Compliance]
    
    R1 --> S{Issue Resolved?}
    S -->|Yes| T1[Close Ticket & Restore Asset Status]
    S -->|No| T2[Flag for Disposal / Replacement]

    %% 5. Intelligence & Reporting
    P -.-> U
    T1 -.-> U
    T2 -.-> U
    
    U[[AIMS Intelligence Engine]]
    U --> V1[Dashboard Metrics]
    U --> V2[Contract Expiry Warnings]
    U --> V3[Export Enterprise Reports CSV]
    
    classDef highlight fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff;
    classDef db fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef user fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff;
    
    class A,B user;
    class P,U db;
    class H,M,N highlight;
```

## System Phases Explained

1. **Access Control (Roles):** Sistem membezakan kuasa antara *Super Admin* (untuk konfigurasi), *Technician* (untuk selenggara aset), dan *User* biasa.
2. **Setup Data Induk (Master Data):** Sebelum aset dimasukkan, pentadbir (Admin) perlu membina asas organisasi. Vendor dan Polisi SLA didaftarkan, Projek diwujudkan, dan kedua-duanya diikat menghasilkan **Kontrak (Contracts)**.
3. **Pendaftaran Aset (Hardware Wizard):** Ini adalah jantung operasi AIMS. Sistem memaksa pendaftaran dilakukan mengikut hierarki yang ketat: `Projek ➔ Kontrak ➔ Lokasi Geografi ➔ Borang Aset Dinamik`. Data tidak relevan (seperti *Toner* untuk Laptop) disembunyikan.
4. **Kitaran Hayat & Penyelenggaraan:** Aset yang telah hidup di pangkalan data boleh diselenggara menerusi fungsi **Maintenance Tickets**. Juruteknik akan membaik pulih dan mengubah status aset.
5. **Analitik & Kepintaran (Intelligence):** Segala data dari kontrak tamat tempoh, jumlah aset, hinggalah ke kekerapan kerosakan akan disedut oleh pemuka *Dashboard* dan *Reports* untuk menjana data CSV dan amaran awal.
