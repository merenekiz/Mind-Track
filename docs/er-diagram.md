# MindTrack — ER (Entity Relationship) Diyagramı

---

## Tablo İlişkileri

```
┌──────────────────────┐
│        USERS         │
├──────────────────────┤
│ PK  id               │
│     email (unique)   │
│     hashed_password  │
│     full_name        │
│     is_active        │
│     created_at       │
│     updated_at       │
└──────────┬───────────┘
           │
           │ 1 ──── N
           │
     ┌─────┼──────────────────┬──────────────────┬──────────────────┐
     │     │                  │                  │                  │
     ▼     ▼                  ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ HEALTH_DATA  │  │   SYMPTOMS   │  │IMAGE_ANALYSIS│  │AI_ANALYSIS   │
│              │  │              │  │              │  │  _RESULTS    │
├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤
│PK id         │  │PK id         │  │PK id         │  │PK id         │
│FK user_id    │  │FK user_id    │  │FK user_id    │  │FK user_id    │
│   date       │  │   original   │  │   file_path  │  │   date       │
│   pain_level │  │   _text      │  │   category   │  │   summary    │
│   sleep_hours│  │   detected   │  │   analysis   │  │   recommend  │
│   sleep      │  │   _symptoms  │  │   _result    │  │   _ations    │
│   _quality   │  │   date       │  │   created_at │  │   scientific │
│   stress     │  │   created_at │  │              │  │   _references│
│   _level     │  │              │  │              │  │   data_used  │
│   mood       │  │              │  │              │  │   created_at │
│   notes      │  │              │  │              │  │              │
│   created_at │  │              │  │              │  │              │
│   updated_at │  │              │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

┌────────────────────────┐
│ SCIENTIFIC_DOCUMENTS   │
├────────────────────────┤
│ PK  id                 │
│     pubmed_id (unique) │
│     title              │
│     abstract           │
│     authors            │
│     published_date     │
│     embedding (vector) │  ◄── pgvector (1536 boyut)
│     created_at         │
└────────────────────────┘
```

---

## İlişki Özeti

| İlişki | Tip | Açıklama |
|--------|-----|----------|
| Users → HealthData | 1:N | Bir kullanıcının birçok günlük sağlık kaydı |
| Users → Symptoms | 1:N | Bir kullanıcının birçok semptom analizi |
| Users → ImageAnalysis | 1:N | Bir kullanıcının birçok görsel analizi |
| Users → AIAnalysisResults | 1:N | Bir kullanıcının birçok AI yorum kaydı |
| ScientificDocuments | Bağımsız | Kullanıcıya bağlı değil, RAG sistemi için |

---

## Veri Tipleri

| Sütun | PostgreSQL Tipi | Açıklama |
|-------|----------------|----------|
| id | SERIAL (PK) | Otomatik artan birincil anahtar |
| user_id | INTEGER (FK) | Users tablosuna foreign key |
| email | VARCHAR(255) | Benzersiz e-posta |
| hashed_password | VARCHAR(255) | bcrypt ile hashlenmiş şifre |
| date | DATE | Tarih |
| pain_level | INTEGER | 0-10 arası |
| sleep_hours | FLOAT | 0-24 arası |
| sleep_quality | INTEGER | 1-5 arası |
| stress_level | INTEGER | 0-10 arası |
| mood | VARCHAR(50) | Duygu durumu |
| notes | TEXT | Serbest metin (max 1000) |
| detected_symptoms | JSONB | Yapılandırılmış semptom listesi |
| analysis_result | JSONB | Görsel analiz sonucu |
| recommendations | JSONB | AI önerileri listesi |
| scientific_references | JSONB | Bilimsel referanslar |
| data_used | JSONB | Hangi veri kaynakları kullanıldı |
| embedding | VECTOR(768) | Gemini embedding vektörü |
| created_at | TIMESTAMPTZ | Oluşturulma zamanı |
| updated_at | TIMESTAMPTZ | Güncellenme zamanı |

---

## Index'ler

| Tablo | Index | Tip | Amaç |
|-------|-------|-----|------|
| users | email | UNIQUE | Hızlı login sorgusu |
| health_data | user_id, date | COMPOSITE | Kullanıcı + tarih bazlı sorgular |
| symptoms | user_id | BTREE | Kullanıcı bazlı filtreleme |
| image_analysis | user_id | BTREE | Kullanıcı bazlı filtreleme |
| ai_analysis_results | user_id, date | COMPOSITE | Kullanıcı + tarih bazlı sorgular |
| scientific_documents | pubmed_id | UNIQUE | Tekrar eklemeyi önleme |
| scientific_documents | embedding | IVFFlat / HNSW | Vektör benzerlik araması |
