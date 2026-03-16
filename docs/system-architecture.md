# MindTrack — Sistem Mimarisi

## Genel Bakış

MindTrack, kullanıcı sağlık verilerini analiz eden yapay zeka destekli bir platformdur.
Sistem üç ana frontend/backend katmanından ve AI servislerinden oluşur.

---

## Mimari Diyagramı

```
┌─────────────────────────────────────────────────────────┐
│                      KULLANICILAR                       │
│                                                         │
│         ┌──────────────┐    ┌──────────────┐            │
│         │   Next.js    │    │ React Native │            │
│         │  Web App     │    │  Mobile App  │            │
│         │  (port 3000) │    │  (iOS/AND)   │            │
│         └──────┬───────┘    └──────┬───────┘            │
│                │                   │                    │
└────────────────┼───────────────────┼────────────────────┘
                 │   HTTPS / JSON    │
                 └─────────┬─────────┘
                           │
┌──────────────────────────┼──────────────────────────────┐
│                    BACKEND LAYER                        │
│                          │                              │
│              ┌───────────▼───────────┐                  │
│              │    FastAPI Backend    │                  │
│              │    (Uvicorn ASGI)     │                  │
│              │    /api/v1/...        │                  │
│              └───────────┬───────────┘                  │
│                          │                              │
│    ┌─────────────────────┼─────────────────────┐        │
│    │                     │                     │        │
│    ▼                     ▼                     ▼        │
│ ┌──────────┐    ┌──────────────┐    ┌──────────────┐    │
│ │  Auth    │    │ Health Data  │    │  AI Analysis │    │
│ │ Module   │    │   Module     │    │   Module     │    │
│ │ (JWT)    │    │  (CRUD)      │    │  (Pipeline)  │    │
│ └──────────┘    └──────────────┘    └──────────────┘    │
│                                                         │
│ ┌──────────────┐    ┌──────────────┐                    │
│ │   Image      │    │  Symptom     │                    │
│ │  Analysis    │    │  Analysis    │                    │
│ │   Module     │    │   Module     │                    │
│ └──────────────┘    └──────────────┘                    │
│                                                         │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────┐
│                    DATA LAYER                           │
│                          │                              │
│              ┌───────────▼───────────┐                  │
│              │  PostgreSQL + pgvector│                  │
│              │                       │                  │
│              │  - Users              │                  │
│              │  - HealthData         │                  │
│              │  - Symptoms           │                  │
│              │  - ImageAnalysis      │                  │
│              │  - AIAnalysisResults  │                  │
│              │  - ScientificDocs     │                  │
│              │    (vector embedding) │                  │
│              └───────────────────────┘                  │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                       │
│                                                         │
│    ┌──────────────┐    ┌──────────────┐                 │
│    │  Gemini API  │    │  PubMed API  │                 │
│    │              │    │              │                  │
│    │  - LLM       │    │  - Makale    │                 │
│    │  - Vision    │    │    arama     │                 │
│    │  - Embedding │    │  - Özet      │                 │
│    └──────────────┘    └──────────────┘                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Katman Açıklamaları

### 1. Frontend Layer

| Platform | Teknoloji | Açıklama |
|----------|-----------|----------|
| Web | Next.js (TypeScript) | Tarayıcı tabanlı web uygulaması |
| Mobil | React Native (TypeScript) | iOS ve Android mobil uygulama |

Her iki platform aynı backend API'yi kullanır. Kullanıcı verisi her iki platformda senkron kalır.

### 2. Backend Layer — FastAPI

FastAPI (Python) üzerinde çalışan REST API. Modüller:

| Modül | Sorumluluk |
|-------|------------|
| Auth | Kayıt, giriş, JWT token yönetimi |
| Health Data | Günlük sağlık verisi CRUD işlemleri |
| Image Analysis | Görsel yükleme ve Gemini Vision ile analiz |
| Symptom Analysis | Metin tabanlı semptom çıkarımı |
| AI Analysis | Tüm verileri birleştirip sağlık yorumu üretme |
| RAG | Bilimsel literatür arama ve vektör eşleştirme |

### 3. Data Layer — PostgreSQL + pgvector

Tek bir PostgreSQL veritabanı tüm verileri saklar. pgvector extension'ı sayesinde bilimsel makale embedding'leri aynı veritabanında vektör olarak tutulur. Ayrı bir vektör DB'ye gerek yoktur.

### 4. External Services

| Servis | Kullanım |
|--------|----------|
| Gemini API | LLM (metin analizi/yorum), Vision (görsel analiz), Embedding (RAG vektörleri) |
| PubMed API | Bilimsel sağlık makalelerinin aranması ve çekilmesi |

---

## Teknoloji Özeti

| Katman | Teknoloji |
|--------|-----------|
| Web Frontend | Next.js, TypeScript, Tailwind CSS |
| Mobile Frontend | React Native, TypeScript |
| Backend | FastAPI, Python 3.11+, Uvicorn |
| ORM | SQLAlchemy (async) |
| Migration | Alembic |
| Veritabanı | PostgreSQL 15 + pgvector |
| Auth | JWT (access + refresh token), bcrypt |
| AI | Gemini API (gemini-1.5-pro) |
| Bilimsel Veri | PubMed E-utilities API |

---

## İletişim Protokolleri

- Frontend → Backend: HTTPS, JSON (REST API)
- Backend → PostgreSQL: SQLAlchemy async session (asyncpg driver)
- Backend → Gemini API: HTTPS (google-generativeai SDK)
- Backend → PubMed API: HTTPS (REST/JSON)
