"use client";

import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, BookOpen, MessageSquare, PhoneCall, ShieldAlert } from "lucide-react";

export default function HelpPage() {
  const faqs = [
    {
      question: "Bagaimanakah cara untuk melaporkan kerosakan aset?",
      answer:
        "Buka menu 'My Tickets' di sidebar sebelah kiri, klik butang 'Create Ticket', isi butiran kerosakan berserta tahap keutamaan (priority), kemudian klik hantar. Juruteknik kami akan segera dihubungi.",
    },
    {
      question: "Di manakah saya boleh menyemak status waranti perkakasan?",
      answer:
        "Buka menu 'My Assets' atau 'Assets' untuk pentadbir. Senarai grid perkakasan memaparkan kolum 'Warranty' secara langsung. Lencana kelabu menunjukkan tiada waranti manakala lencana biru/hijau menandakan waranti yang aktif.",
    },
    {
      question: "Apakah perbezaan antara peranan pengakses (roles) dalam AIMS?",
      answer:
        "Super Admin memegang kawalan organisasi penuh, manakala Project Admin terhad mengurus projek tertentu. Juruteknik berfokus kepada tiket penyelenggaraan. Department User dan Staff hanya mempunyai hak melihat aset jabatan masing-masing.",
    },
    {
      question: "Bagaimanakah tag aset (Asset Tag) dijana?",
      answer:
        "Sistem menjana tag secara dinamik berdasarkan kombinasi singkatan Projek, nombor Kontrak, kod jenis perkakasan (contoh: PC, LPT, PRT, SVR) dan nombor giliran yang dimasukkan semasa pendaftaran.",
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <FadeIn className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Pusat Bantuan & Panduan</h2>
            <p className="text-sm text-muted-foreground">
              Ketahui cara menggunakan sistem AIMS dan dapatkan sokongan teknikal
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Support contacts */}
        <FadeIn delay={0.1} className="md:col-span-1 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-emerald-500" />
                Hubungi Kami
              </CardTitle>
              <CardDescription>
                Sokongan teknikal 24/7 untuk hospital & tapak pejabat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b border-border/40 pb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Talian Am (HQ)
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">+60 3-2178 4000</p>
                <p className="text-xs text-muted-foreground">Talian utama AIMS Control Center</p>
              </div>

              <div className="border-b border-border/40 pb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Sokongan WhatsApp
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">+60 12-345 6789</p>
                <p className="text-xs text-muted-foreground">
                  Maklum balas pantas untuk kes kecemasan
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Emel Rasmi Bantuan
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">support@aims.com.my</p>
                <p className="text-xs text-muted-foreground">
                  Masa tindak balas dalam tempoh 4 jam
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card bg-primary/[0.01] border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <ShieldAlert className="h-5 w-5" />
                SLA Komitmen
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                AIMS mematuhi Standard Perjanjian Tahap Perkhidmatan (SLA) organisasi untuk
                memastikan kebolehcapaian sistem dan perkakasan perubatan/IT sentiasa di tahap
                maksimum.
              </p>
              <p className="font-semibold text-foreground">
                Tindakan segera diambil mengikut keutamaan tiket (Critical, High, Medium, Low).
              </p>
            </CardContent>
          </Card>
        </FadeIn>

        {/* FAQs */}
        <FadeIn delay={0.2} className="md:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Soalan Lazim (FAQ)
              </CardTitle>
              <CardDescription>
                Jawapan pantas bagi persoalan biasa mengenai sistem pendaftaran perkakasan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="space-y-2 border-b border-border/40 pb-4 last:border-0 last:pb-0"
                >
                  <h4 className="text-sm font-semibold text-foreground flex items-start gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary font-bold">
                      Q
                    </span>
                    {faq.question}
                  </h4>
                  <p className="text-xs text-muted-foreground pl-7 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-sky-500" />
                Maklum Balas Sistem
              </CardTitle>
              <CardDescription>
                Adakah anda menghadapi masalah atau ingin memberi cadangan peningkatan?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kami sentiasa berusaha meningkatkan pengalaman pengguna sistem AIMS. Jika anda
                mempunyai cadangan ciri baharu atau ingin melaporkan isu antaramuka (UI/UX Bug),
                sila hubungi pentadbir sistem anda atau e-mel kepada pasukan kejuruteraan sistem
                kami secara langsung di{" "}
                <span className="text-foreground font-semibold">dev@aims.com.my</span>.
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
