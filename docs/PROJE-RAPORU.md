# 🧠 MindTrack — Proje Raporu

## Somatik Belirti & Duygu Analizi Yapan Akıllı Sağlık Günlüğü

---

## 1. Özet

MindTrack, kullanıcıların günlük sağlık verilerini (uyku, stres, ağrı, beslenme, semptom metni, görsel) toplayan, yapay zeka ile analiz eden ve PubMed bilimsel literatürüyle desteklenen yorumlar üreten **AI tabanlı sağlık günlüğü** sistemidir.

Platform: **Web (Next.js) + Mobil (React Native) + Backend (FastAPI) + PostgreSQL/pgvector + Gemini API**

---

## 2. Sistem Mimarisi

```
┌─────────────┐  ┌─────────────┐
│  Web (Next) │  │ Mobil (RN)  │
└──────┬──────┘  └──────┬──────┘
       │                │
       └────────┬───────┘
                ▼
       ┌─────────────────┐
       │ FastAPI Backend │
       │  (JWT, async)   │
       └────────┬────────┘
                │
   ┌────────────┼─────────────┐
   ▼            ▼             ▼
┌──────┐  ┌──────────┐  ┌────────────┐
│ DB   │  │ Gemini   │  │  PubMed    │
│ +pgv │  │ AI       │  │  E-utils   │
└──────┘  └──────────┘  └────────────┘
```

---

## 3. Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Web | Next.js 16 + TypeScript + Turbopack |
| Mobil | React Native (bare) + TypeScript |
| Backend | FastAPI + Uvicorn + SQLAlchemy + Pydantic |
| Veritabanı | PostgreSQL 17 + pgvector 0.8 (Supabase) |
| AI LLM | Gemini 2.5 Flash |
| Embedding | gemini-embedding-001 (768 dim, Matryoshka) |
| Bilimsel veri | PubMed E-utilities (esearch + efetch) |
| Auth | JWT (access + refresh) + bcrypt |
| Migration | Alembic |
| Test | pytest + pytest-asyncio + httpx |

---

## 4. Modüller

### 4.1 Authentication
- `POST /api/v1/auth/register`, `/login`, `/refresh`
- JWT access (60 dk) + refresh (7 gün)
- bcrypt şifre hashleme

### 4.2 Sağlık Verisi (Health Data)
- `POST/GET/PUT/DELETE /api/v1/health-data`
- Alanlar: pain, sleep, stress, water, activity, mood, notes
- Pydantic doğrulama (min/max)

### 4.3 Görsel Analiz (Image Analysis)
- `POST /api/v1/image-analysis` (multipart/form-data)
- Gemini Vision (gemini-2.5-flash) ile yemek/kahve tanıma
- Kalori + kafein tahmini
- Öğün bazlı (`meal_type`: breakfast/lunch/dinner/snack)

### 4.4 Semptom Metin Analizi
- `POST /api/v1/symptoms/`
- Türkçe metin → Gemini ile yapılandırılmış JSON
- Semptom adı, şiddet, vücut bölgesi, süre, kategori

### 4.5 RAG (PubMed + pgvector)
- `POST /api/v1/scientific/ingest` — PubMed araması + Gemini özetleme + 768-dim embedding
- `GET /api/v1/scientific/search` — Cosine similarity arama (HNSW index)
- TR→EN semptom kelime haritası (20+ terim)

### 4.6 AI Analiz Pipeline (RAG-augmented)
- `POST /api/v1/ai-analysis/generate`
- Adımlar:
  1. Son N gün sağlık + semptom + görsel verisi toplama
  2. RAG ile en alakalı 5 PubMed makalesi (cosine similarity)
  3. Gemini'ye birleşik prompt
  4. JSON yorum: özet, öncelikli öneriler, örüntüler, doktor uyarısı, bilimsel referanslar
  5. `ai_analysis_results` tablosuna kayıt

---

## 5. Veritabanı Şeması

| Tablo | Amaç |
|---|---|
| `users` | Kullanıcı kimlik bilgileri |
| `health_data` | Günlük sağlık metrikleri |
| `symptoms` | Semptom metinleri + Gemini analizi (JSONB) |
| `image_analyses` | Görsel analiz sonuçları (JSONB) |
| `scientific_documents` | PubMed makaleleri + 768-dim embedding |
| `ai_analysis_results` | AI yorumları + öneriler + referanslar (JSONB) |

**Index'ler:**
- `scientific_documents_embedding_hnsw_idx` (HNSW + vector_cosine_ops)
- `ix_ai_analysis_user_date` (kullanıcı bazlı tarih erişimi)

---

## 6. Test Sonuçları

### Backend (pytest)
**15/15 test PASSED**

```
tests/test_auth.py            4/4  ✅
tests/test_health_data.py     3/3  ✅
tests/test_symptom.py         3/3  ✅
tests/test_rag.py             3/3  ✅
tests/test_ai_analysis.py     2/2  ✅ (full pipeline)
```

### Web
- `npx next build` ✅ (Turbopack, statik sayfalar)
- TypeScript strict mode temiz

### Mobil
- `npx tsc --noEmit` ✅
- iOS Simulator (iPhone 16 Pro) build + launch başarılı

### AI Doğruluk Doğrulama
- Semptom analizi: "Baş ağrısı ve uykusuzluk" → 3+ semptom doğru tespit
- RAG: "headache" sorgusu → similarity ≥0.70 alakalı PubMed makaleleri
- AI Analiz: 7 günlük veri → 3 öncelikli öneri + örüntü tespiti + 5 bilimsel referans

---

## 7. Güvenlik

- ✅ Bcrypt şifre hashleme
- ✅ JWT kısa ömürlü access + refresh
- ✅ API anahtarları `.env` (Gemini, PubMed, JWT_SECRET)
- ✅ Tüm endpoint'ler JWT korumalı (auth hariç)
- ✅ CORS sadece `localhost:3000` ve `localhost:8081`
- ✅ Pydantic giriş doğrulaması (SQL injection imkansız — ORM)
- ✅ AI yorumları "tıbbi tanı koymaz" disclaimer'ı içerir

---

## 8. Geliştirme Aşamaları (11 Hafta)

| Hafta | Konu | Durum |
|---|---|---|
| 1 | Geliştirme Ortamı Kurulumu | ✅ |
| 2 | Sistem Mimarisi Tasarımı | ✅ |
| 3 | Veritabanı Tasarımı | ✅ |
| 4 | Backend Core (Auth) | ✅ |
| 5 | Sağlık Veri Yönetimi | ✅ |
| 6 | Web + Mobil UI | ✅ |
| 7 | Görsel Analiz Sistemi | ✅ |
| 8 | Semptom Metin Analizi | ✅ |
| 9 | RAG (PubMed + pgvector) | ✅ |
| 10 | AI Analiz Pipeline | ✅ |
| 11 | Test ve Final | ✅ |

---

## 9. Geliştirici Notları — Çalıştırma

### Backend
```bash
cd backend && source venv/bin/activate && uvicorn app.main:app --reload
```

### Web
```bash
cd web && npm run dev
```

### Mobil
```bash
cd mobile && npx react-native start          # Terminal 1
cd mobile && npx react-native run-ios        # Terminal 2
```

### Test
```bash
cd backend && pytest -v                       # Tüm testler
cd backend && pytest -v -m "not slow"         # Hızlı testler (AI/RAG hariç)
```

---

## 10. Etik Çerçeve

- Yapay zeka **tıbbi tanı koymaz**, yalnızca veri örüntüleri ve genel öneriler sunar.
- Bilimsel referansa dayalı ifadeler "araştırmalar gösteriyor ki" kalıbıyla işaretlenir.
- Gerekli durumlarda kullanıcıya "doktora danışmanız önerilir" notu otomatik eklenir.
- Tüm kullanıcı verileri kişiseldir, üçüncü taraflarla paylaşılmaz.

---

## 11. Sonuç

MindTrack, **bilimsel literatürle desteklenmiş AI tabanlı sağlık takibi** sunan, web ve mobil platformlarda senkron çalışan, modern teknoloji yığınıyla geliştirilmiş bir sistemdir.

**Toplam test kapsamı:** 15 backend smoke testi (auth, CRUD, semptom AI, RAG, full AI pipeline)
**AI doğruluk:** Türkçe semptom + sağlık verisi → bilimsel referanslı yapılandırılmış yorum
**Performans:** RAG retrieval HNSW ile <100ms, full AI analizi ~15-30s (Gemini bağımlı)
