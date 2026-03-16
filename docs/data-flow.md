# MindTrack — Veri Akış Diyagramları

---

## 1. Kullanıcı Veri Akışı (Web / Mobil → Backend → DB)

```
Kullanıcı (Web veya Mobil)
        │
        │  Veri girer (ağrı, uyku, stres, mood, notlar)
        │
        ▼
┌──────────────────┐
│  Next.js / RN    │
│  Frontend        │
│                  │
│  Form → JSON     │
│  + JWT Token     │
└────────┬─────────┘
         │
         │  POST /api/v1/health-data
         │  Authorization: Bearer <token>
         │
         ▼
┌──────────────────┐
│  FastAPI Backend  │
│                  │
│  1. JWT doğrula  │
│  2. Pydantic     │
│     validation   │
│  3. DB'ye kaydet │
└────────┬─────────┘
         │
         │  SQLAlchemy INSERT
         │
         ▼
┌──────────────────┐
│   PostgreSQL     │
│   HealthData     │
│   tablosu        │
└──────────────────┘
```

---

## 2. Görsel Analiz Veri Akışı

```
Kullanıcı
        │
        │  Fotoğraf çeker/seçer (yemek, içecek)
        │
        ▼
┌──────────────────┐
│  Frontend        │
│                  │
│  multipart/      │
│  form-data       │
└────────┬─────────┘
         │
         │  POST /api/v1/images/analyze
         │
         ▼
┌──────────────────┐
│  FastAPI Backend  │
│                  │
│  1. Görseli al   │
│  2. Gemini       │
│     Vision API   │──────────┐
│     ile analiz   │          │
│  3. Sonucu parse │          ▼
│  4. DB'ye kaydet │   ┌──────────────┐
└────────┬─────────┘   │  Gemini API  │
         │             │  Vision      │
         │             │              │
         ▼             │  "Bu bir     │
┌──────────────────┐   │   Türk       │
│   PostgreSQL     │   │   kahvesi,   │
│   ImageAnalysis  │   │   ~80mg      │
│   tablosu        │   │   kafein"    │
└──────────────────┘   └──────────────┘
```

---

## 3. Semptom Metin Analiz Veri Akışı

```
Kullanıcı
        │
        │  "Bugün başım ağrıyor ve midem bulanıyor"
        │
        ▼
┌──────────────────┐
│  Frontend        │
│  Metin input     │
└────────┬─────────┘
         │
         │  POST /api/v1/symptoms/analyze
         │
         ▼
┌──────────────────┐
│  FastAPI Backend  │
│                  │
│  1. Metni al     │
│  2. Gemini LLM   │──────────┐
│     ile analiz   │          │
│  3. Semptomları  │          ▼
│     çıkar (JSON) │   ┌──────────────┐
│  4. DB'ye kaydet │   │  Gemini API  │
└────────┬─────────┘   │  LLM         │
         │             │              │
         ▼             │  → Baş ağrısı│
┌──────────────────┐   │  → Mide      │
│   PostgreSQL     │   │    bulantısı │
│   Symptoms       │   └──────────────┘
│   tablosu        │
└──────────────────┘
```

---

## 4. RAG (Bilimsel Literatür) Veri Akışı

```
┌──────────────────────────────────────────────────────┐
│                 INDEXLEME (ARKA PLAN)                 │
│                                                       │
│  PubMed API ──► Makale çek ──► Gemini Embedding API  │
│                                       │               │
│                                       ▼               │
│                              PostgreSQL pgvector      │
│                              ScientificDocuments      │
│                              (embedding sütunu)       │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              SORGULAMA (ANALİZ SIRASINDA)            │
│                                                       │
│  Kullanıcı semptomları                               │
│         │                                             │
│         ▼                                             │
│  Gemini Embedding API ile sorgu vektörü oluştur      │
│         │                                             │
│         ▼                                             │
│  pgvector cosine similarity ile en yakın makaleler   │
│         │                                             │
│         ▼                                             │
│  İlgili bilimsel bilgiler → AI Analysis Pipeline     │
└──────────────────────────────────────────────────────┘
```

---

## 5. AI Analiz Pipeline — Tam Veri Akışı

Bu akış tüm verileri birleştirerek kullanıcıya sağlık yorumu üretir.

```
POST /api/v1/analysis/generate
              │
              ▼
┌──────────────────────────────────────────┐
│         VERİ TOPLAMA AŞAMASI            │
│                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Health  │  │  Image  │  │ Symptom │ │
│  │  Data   │  │ Analysis│  │ Analysis│ │
│  │ (DB)    │  │  (DB)   │  │  (DB)   │ │
│  └────┬────┘  └────┬────┘  └────┬────┘ │
│       │            │            │       │
│       └────────────┼────────────┘       │
│                    │                    │
│                    ▼                    │
│         Kullanıcı veri özeti            │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│         RAG RETRIEVAL AŞAMASI           │
│                                          │
│  Semptomlar → Embedding → pgvector      │
│  cosine similarity → İlgili makaleler   │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│         YORUM ÜRETME AŞAMASI            │
│                                          │
│  Gemini LLM'e gönderilen prompt:        │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Kullanıcı verileri:               │  │
│  │   - Ağrı: 4/10                    │  │
│  │   - Uyku: 6.5 saat               │  │
│  │   - Stres: 7/10                   │  │
│  │   - Kahve: 80mg kafein            │  │
│  │   - Semptomlar: baş ağrısı       │  │
│  │                                    │  │
│  │ Bilimsel referanslar:             │  │
│  │   - [Makale 1 özet]              │  │
│  │   - [Makale 2 özet]              │  │
│  │                                    │  │
│  │ Görev: Sağlık yorumu üret.       │  │
│  │ Kesin teşhis verme.              │  │
│  └────────────────────────────────────┘  │
│                    │                     │
│                    ▼                     │
│            Gemini LLM yanıtı            │
│                    │                     │
│                    ▼                     │
│         AIAnalysisResults tablosu        │
│                    │                     │
│                    ▼                     │
│         Kullanıcıya JSON yanıt          │
└──────────────────────────────────────────┘
```

---

## 6. Authentication Akışı

```
┌─────────┐                    ┌──────────┐                ┌──────────┐
│ Frontend│                    │  FastAPI │                │PostgreSQL│
└────┬────┘                    └────┬─────┘                └────┬─────┘
     │                              │                           │
     │  POST /auth/register         │                           │
     │  {email, password, name}     │                           │
     │─────────────────────────────►│                           │
     │                              │  bcrypt hash password     │
     │                              │  INSERT INTO users        │
     │                              │──────────────────────────►│
     │                              │◄──────────────────────────│
     │  201 {id, email, name}       │                           │
     │◄─────────────────────────────│                           │
     │                              │                           │
     │  POST /auth/login            │                           │
     │  {email, password}           │                           │
     │─────────────────────────────►│                           │
     │                              │  SELECT user              │
     │                              │──────────────────────────►│
     │                              │◄──────────────────────────│
     │                              │  bcrypt verify            │
     │                              │  JWT token üret           │
     │  200 {access, refresh}       │                           │
     │◄─────────────────────────────│                           │
     │                              │                           │
     │  GET /health-data            │                           │
     │  Authorization: Bearer xxx   │                           │
     │─────────────────────────────►│                           │
     │                              │  JWT decode + verify      │
     │                              │  SELECT health_data       │
     │                              │──────────────────────────►│
     │                              │◄──────────────────────────│
     │  200 [{...}, {...}]          │                           │
     │◄─────────────────────────────│                           │
```
