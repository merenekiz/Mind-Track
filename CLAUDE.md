# 🧠 MindTrack
## Somatik Belirti & Duygu Analizi Yapan Akıllı Sağlık Günlüğü

Bu doküman projede kullanılacak yapay zekanın sistemi geliştirirken izlemesi gereken kuralları, mimariyi ve uygulanması gereken teknikleri açıklamak amacıyla hazırlanmıştır.

Yapay zeka bu projede yalnızca kod üretmek için değil aynı zamanda sistem mimarisini kurmak, gerekli teknolojileri bağlamak, bilimsel verileri analiz etmek ve kullanıcı verilerini yorumlamak için kullanılacaktır.

Bu doküman her geliştirme aşamasında referans alınmalıdır.

---

# 1. Projenin Amacı

Bu projenin amacı kullanıcıların sağlık verilerini analiz eden yapay zeka destekli bir sistem geliştirmektir.

Sistem kullanıcıdan aşağıdaki veri türlerini alacaktır:

- Günlük sağlık verileri
- Ağrı seviyesi
- Uyku durumu
- Stres seviyesi
- Beslenme bilgisi
- Görsel veriler (kahve, yemek vb.)
- Kullanıcının yazdığı semptom metni

Yapay zeka bu verileri analiz ederek kullanıcıya sağlık durumu hakkında yorum ve öneriler sunacaktır.

---

# 2. Sistem Mimarisi

Proje aşağıdaki katmanlardan oluşacaktır.

Web Uygulaması (Next.js)
Mobil Uygulama (React Native)
Backend API (FastAPI)
Veritabanı (PostgreSQL + pgvector)
AI Analiz Servisi (Gemini API)
Bilimsel Bilgi Katmanı (RAG)

Web ve mobil uygulama aynı backend API'yi paylaşır ve veriler her iki platformda senkron çalışır.

Veri akışı şu şekilde çalışacaktır.

Kullanıcı veri girer (web veya mobil)
Uygulama veriyi FastAPI backend'e gönderir
Backend veriyi veritabanına kaydeder
AI analiz servisi verileri işler
RAG sistemi bilimsel literatür ile destek sağlar
LLM kullanıcıya yorum üretir

---

# 3. Kullanılacak Teknolojiler

Yapay zeka projeyi geliştirirken aşağıdaki teknolojileri kullanmalıdır.

## Frontend — Web

Next.js (React tabanlı web uygulaması)
TypeScript

## Frontend — Mobil

React Native
TypeScript

## Backend

FastAPI (Python)
Uvicorn (ASGI sunucu)
Pydantic (veri doğrulama)
SQLAlchemy (ORM)

## Veritabanı

PostgreSQL
pgvector (vektör arama için PostgreSQL extension — ayrı vektör DB gerekmez)

## Yapay Zeka

Gemini API (LLM + Vision)
Google Generative AI Python SDK

## Makine Öğrenmesi & Veri İşleme

Python
Pandas
NumPy
Scikit-learn

## Bilimsel Veri

PubMed API

## Embedding

Gemini Embedding API (text-embedding-004 modeli)

---

# 4. Backend Geliştirme Kuralları

Backend FastAPI framework kullanılarak Python ile geliştirilecektir.

Backend aşağıdaki modüllere sahip olacaktır.

Authentication modülü (JWT tabanlı)
Health data modülü
Image analysis modülü
Symptom analysis modülü
AI analysis modülü
RAG modülü

Backend API REST mimarisine uygun olmalıdır.

Veri alışverişi JSON formatında yapılacaktır.

Tüm endpoint'ler prefix olarak /api/v1 kullanmalıdır.

Async endpoint'ler tercih edilmelidir (async def).

---

# 5. Veritabanı Yapısı

Veritabanı PostgreSQL olacaktır.

pgvector extension aktif edilmelidir.

Aşağıdaki tablolar oluşturulmalıdır.

Users
HealthData
Symptoms
ImageAnalysis
AIAnalysisResults
ScientificDocuments (vektör embeddingler dahil)

Her kullanıcı verisi kullanıcı ID ile ilişkilendirilmelidir.

Veriler normalize edilmiş şekilde saklanmalıdır.

ScientificDocuments tablosunda embedding sütunu pgvector tipinde olmalıdır.

---

# 6. Görsel Analiz Sistemi

Kullanıcı web veya mobil uygulama üzerinden fotoğraf yükleyebilecektir.

Fotoğraflar backend'e multipart/form-data olarak gönderilecektir.

Yapay zeka Gemini Vision API (gemini-1.5-pro modeli) kullanarak görselleri analiz edecektir.

Görsellerden şu bilgiler çıkarılabilir.

Kahve türü
Kafein tahmini
Yemek türü
Kalori tahmini

Bu analiz sonuçları veritabanına kaydedilmelidir.

---

# 7. Semptom Metin Analizi

Kullanıcı ek semptom bilgisini metin olarak girebilir.

Örneğin:

"Bugün başım ağrıyor ve midem bulanıyor."

Yapay zeka bu metni analiz ederek semptomları tespit etmelidir.

Örnek çıktı:

Baş ağrısı
Mide bulantısı

Bu semptomlar yapılandırılmış veri olarak veritabanına kaydedilmelidir.

---

# 8. Bilimsel Sağlık Bilgi Katmanı

Sistem bilimsel sağlık çalışmalarını inceleyerek yorum yapmalıdır.

Bu amaçla PubMed API kullanılacaktır.

Yapay zeka ilgili sağlık makalelerini aramalı ve analiz etmelidir.

Makale içerikleri özetlenmeli ve önemli bilgiler çıkarılmalıdır.

Bu bilgiler Gemini Embedding API ile vektöre çevrilmeli ve PostgreSQL pgvector'e kaydedilmelidir.

---

# 9. RAG Sistemi

Bu projede Retrieval Augmented Generation kullanılacaktır.

Bu sistem şu şekilde çalışacaktır.

Bilimsel makaleler PubMed API'den alınır
Gemini Embedding API ile embedding oluşturulur
PostgreSQL pgvector'e kaydedilir

Kullanıcı verisi analiz edilirken ilgili bilimsel bilgiler pgvector cosine similarity ile çekilir.

LLM (Gemini) bu bilgileri kullanarak yorum üretir.

Bu sayede yapay zekanın yorumları bilimsel veriye dayalı olur.

---

# 10. Yapay Zeka Yorumlama Kuralları

Yapay zeka kullanıcıya kesin tıbbi teşhis vermemelidir.

Yorumlar öneri ve analiz şeklinde olmalıdır.

Örnek yorum:

Uyku düzeninizdeki düzensizlik ve yüksek stres seviyesi baş ağrısı ile ilişkili olabilir.

Bilimsel çalışmalara göre stres ve uyku eksikliği baş ağrısı riskini artırabilir.

Kullanıcıya gerekirse doktora danışması önerilmelidir.

---

# 11. AI Analiz Pipeline

Yapay zeka yorum üretmeden önce şu verileri analiz etmelidir.

Kullanıcı sağlık verileri
Görsel analiz sonuçları
Semptom metin analizi
Bilimsel literatür verileri (RAG ile çekilmiş)

Bu veriler birleştirilerek tek bir prompt ile Gemini'ye gönderilmelidir.

---

# 12. API Entegrasyon Kuralları

Yapay zeka API entegrasyonu yaparken aşağıdaki kuralları takip etmelidir.

API anahtarları environment dosyasında saklanmalıdır.

Örnek .env:

GEMINI_API_KEY=
PUBMED_API_KEY=
DATABASE_URL=
JWT_SECRET=

Kod içinde doğrudan API anahtarı kullanılmamalıdır.

Python tarafında python-dotenv kullanılmalıdır.

---

# 13. Proje Klasör Yapısı

```
mindtrack/
├── web/          # Next.js web uygulaması (TypeScript)
├── mobile/       # React Native mobil uygulama (TypeScript)
├── backend/      # FastAPI backend (Python)
│   ├── app/
│   │   ├── api/          # endpoint router'ları
│   │   ├── models/       # SQLAlchemy modelleri
│   │   ├── schemas/      # Pydantic şemaları
│   │   ├── services/     # iş mantığı servisleri
│   │   └── core/         # config, auth, db bağlantısı
│   ├── requirements.txt
│   └── .env
└── docs/         # proje dokümantasyonu
```

---

# 14. Git Branching Stratejisi

Proje aşağıdaki branch yapısını kullanacaktır.

- **main** — Stabil, çalışan sürüm. Sadece test edilmiş kod merge edilir.
- **dev** — Aktif geliştirme branch'i. Tüm feature branch'ler buraya merge edilir.
- **feature/xxx** — Her yeni özellik için ayrı branch açılır. Örnek: feature/auth, feature/health-data, feature/image-analysis

Geliştirme akışı:

1. dev branch'inden yeni feature branch açılır
2. Geliştirme feature branch'inde yapılır
3. Tamamlanan feature dev'e merge edilir
4. Hafta sonunda stabil dev, main'e merge edilir

---

# 15. Geliştirme Yaklaşımı

Yapay zeka geliştirme sürecinde aşağıdaki adımları izlemelidir.

Önce sistem mimarisini oluşturmalıdır.
Ardından veritabanı yapısını kurmalıdır.
FastAPI backend API geliştirilmelidir.
Next.js web uygulaması geliştirilmelidir.
React Native mobil uygulama geliştirilmelidir.
AI analiz sistemi entegre edilmelidir.

---

# 16. Geliştirme Sırasında İyileştirme

Yapay zeka proje geliştirirken sistemi geliştirebilir.

Yeni analiz yöntemleri önerebilir.

Yeni veri analiz algoritmaları ekleyebilir.

Sistemin doğruluğunu artıracak öneriler sunabilir.

---

# 17. Güvenlik ve Etik Kurallar

Kullanıcı verileri güvenli şekilde saklanmalıdır.

Kullanıcı verileri üçüncü taraflarla paylaşılmamalıdır.

Yapay zeka kesin teşhis vermemelidir.

Sistem yalnızca analiz ve öneri üretmelidir.

Şifreler bcrypt ile hash'lenmelidir.

JWT token'lar kısa ömürlü (access) ve uzun ömürlü (refresh) olarak yönetilmelidir.

---

# 18. Sonuç

Bu proje kullanıcı sağlık verilerini analiz eden ve bilimsel sağlık literatürü ile desteklenen yapay zeka tabanlı bir analiz sistemidir.

Platform: Web (Next.js) + Mobil (React Native) — senkron, aynı backend
Backend: FastAPI (Python)
Veritabanı: PostgreSQL + pgvector
AI: Gemini API (LLM + Vision + Embedding)

Yapay zeka bu dokümanı referans alarak sistemi geliştirmeli, analiz modüllerini oluşturmalı ve kullanıcıya anlamlı sağlık yorumları üretmelidir.
