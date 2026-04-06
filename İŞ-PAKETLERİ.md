# 🧠 MindTrack
## Somatik Belirti & Duygu Analizi Yapan Akıllı Sağlık Günlüğü
### 11 Haftalık Proje İş Paketleri (Gerçek Proje Formatı)

---

# 1. Hafta — Geliştirme Ortamı ve Altyapı Kurulumu

Bu hafta proje geliştirme sürecinde kullanılacak tüm araçlar ve geliştirme ortamları kurulacaktır.

## Development Environment Setup

- [x] Python 3.11+ kurulumu ve sanal ortam (venv) yapılandırması
- [x] Node.js kurulumu ve versiyon yönetimi yapılandırması
- [x] React Native geliştirme ortamının kurulması
- [x] Next.js geliştirme ortamının kurulması
- [x] FastAPI ve bağımlılıklarının kurulması
- [x] PostgreSQL veritabanı kurulumu
- [x] pgvector extension kurulumu

## Development Tools

- [x] Git kurulumu
- [x] GitHub repository oluşturulması
- [x] Git branching stratejisinin belirlenmesi (main / dev / feature branches)
- [x] VS Code geliştirme ortamının hazırlanması
- [x] Monorepo klasör yapısının oluşturulması (web / mobile / backend)

## AI Platform Setup

- [x] Google AI Studio hesabının oluşturulması
- [x] Gemini API erişiminin oluşturulması
- [x] API anahtarlarının .env dosyasında güvenli şekilde saklanması
- [x] PubMed API erişiminin test edilmesi

**Deliverable**

- Çalışan geliştirme ortamı
- Proje repository yapısı

---

# 2. Hafta — Sistem Mimarisinin Tasarlanması

Bu hafta sistemin genel mimarisi ve veri akışı tasarlanacaktır.

## System Architecture

- [x] Sistem mimarisinin belirlenmesi
- [x] Web (Next.js) ve mobil (React Native) uygulama mimarisinin planlanması
- [x] FastAPI backend servis mimarisinin tasarlanması
- [x] AI analiz servis mimarisinin planlanması

## API Design

- [x] REST API endpoint yapısının belirlenmesi (/api/v1 prefix)
- [x] API request ve response modellerinin (Pydantic şemaları) tasarlanması
- [x] Authentication akışının planlanması (JWT access + refresh token)

## Data Flow

- [x] Kullanıcı veri akışının tasarlanması (web/mobil → FastAPI → PostgreSQL)
- [x] AI analiz veri akışının belirlenmesi
- [x] RAG sistem veri akışının planlanması (PubMed → Embedding → pgvector)

**Deliverable**

- Sistem mimari diyagramı
- API tasarım dokümanı

---

# 3. Hafta — Veritabanı Tasarımı

Bu hafta veri saklama mimarisi ve veritabanı yapısı oluşturulacaktır.

## Database Schema Design

- [x] Kullanıcı veri modeli tasarlanması (Users)
- [x] Sağlık veri modeli tasarlanması (HealthData)
- [x] Semptom veri modeli tasarlanması (Symptoms)
- [x] Görsel analiz veri modeli tasarlanması (ImageAnalysis)
- [x] AI analiz sonuç veri modeli tasarlanması (AIAnalysisResults)
- [x] Bilimsel döküman veri modeli tasarlanması (ScientificDocuments — pgvector embedding dahil)

## Database Implementation

- [x] PostgreSQL veritabanı oluşturulması
- [x] pgvector extension aktif edilmesi
- [x] SQLAlchemy ORM modelleri oluşturulması
- [x] Alembic migration sistemi kurulması
- [x] Foreign key ilişkilerinin kurulması
- [x] Index optimizasyonlarının yapılması

**Deliverable**

- Çalışan veritabanı
- ER diyagramı

---

# 4. Hafta — Backend Core Servisleri

Bu hafta FastAPI backend uygulamasının temel servisleri geliştirilecektir.

## Backend Project Setup

- [x] FastAPI proje yapısının oluşturulması (app/api, app/models, app/schemas, app/services, app/core)
- [x] Uvicorn ASGI sunucu yapılandırması
- [x] Environment configuration (python-dotenv)
- [x] CORS ayarlarının yapılması (web ve mobil için)

## Authentication System

- [x] Kullanıcı kayıt endpoint'inin geliştirilmesi (POST /api/v1/auth/register)
- [x] Kullanıcı giriş endpoint'inin geliştirilmesi (POST /api/v1/auth/login)
- [x] JWT access token ve refresh token sisteminin kurulması
- [x] Bcrypt ile şifre hashleme mekanizmasının uygulanması
- [x] Auth middleware (dependency injection ile korumalı route'lar)

## Database Integration

- [x] SQLAlchemy async session yapılandırması
- [x] FastAPI ve PostgreSQL bağlantısının kurulması

**Deliverable**

- Çalışan backend authentication sistemi

---

# 5. Hafta — Sağlık Veri Yönetim Servisleri

Bu hafta kullanıcı sağlık verilerinin sisteme kaydedilmesi ve yönetilmesi sağlanacaktır.

## Health Data APIs

- [x] Günlük sağlık verisi ekleme endpoint'i (POST /api/v1/health-data)
- [x] Kullanıcı sağlık verilerini listeleme endpoint'i (GET /api/v1/health-data)
- [x] Sağlık verisi güncelleme endpoint'i (PUT /api/v1/health-data/{id})
- [x] Sağlık verisi silme endpoint'i (DELETE /api/v1/health-data/{id})

## Data Validation

- [x] Pydantic şemaları ile input validation
- [x] Veri doğrulama kurallarının uygulanması (min/max değerler, zorunlu alanlar)

**Deliverable**

- Sağlık verisi yönetim API'leri

---

# 6. Hafta — Web ve Mobil Uygulama Geliştirme

Bu hafta hem web hem mobil uygulamanın temel arayüzleri geliştirilecektir.

## Web App Setup (Next.js)

- [ ] Next.js projesi oluşturulması (TypeScript)
- [ ] Sayfa ve layout yapısının oluşturulması
- [ ] Authentication sayfaları (kayıt / giriş)

## Mobile App Setup (React Native)

- [ ] React Native projesi oluşturulması (TypeScript)
- [ ] Navigasyon yapısının oluşturulması (React Navigation)
- [ ] Authentication ekranları

## UI Development — Ortak Özellikler

- [ ] Ana ekran tasarımı
- [ ] Günlük veri giriş ekranı
- [ ] Ağrı seviyesi giriş arayüzü
- [ ] Uyku ve stres veri giriş ekranları

## API Integration

- [ ] FastAPI backend entegrasyonu (axios / fetch)
- [ ] JWT token yönetimi (web: cookie / mobil: AsyncStorage)
- [ ] Kullanıcı veri gönderme işlemleri

**Deliverable**

- Çalışan web ve mobil veri giriş uygulamaları (senkron)

---

# 7. Hafta — Görsel Analiz Sistemi

Bu hafta görseller üzerinden veri analiz sistemi geliştirilecektir.

## Image Capture System

- [ ] Web uygulamasına dosya yükleme özelliğinin eklenmesi
- [ ] Mobil uygulamaya kamera ve galeri erişiminin eklenmesi
- [ ] Görsellerin multipart/form-data olarak backend'e gönderilmesi

## AI Vision Integration

- [ ] Gemini Vision API entegrasyonu
- [ ] Backend'de görsel analiz servisinin yazılması
- [ ] Görsellerden kahve türü, kafein miktarı, yemek türü, kalori çıkarımı

## Data Storage

- [ ] Görsel analiz sonuçlarının ImageAnalysis tablosuna kaydedilmesi

**Deliverable**

- Görsel analiz sistemi

---

# 8. Hafta — Semptom Metin Analizi

Bu hafta kullanıcıların metin olarak semptom girebilmesi sağlanacaktır.

## Text Input System

- [ ] Web ve mobil uygulamada semptom metin giriş alanı oluşturulması
- [ ] Metin verisinin backend'e gönderilmesi

## LLM Text Analysis

- [ ] Gemini API ile metin analiz pipeline oluşturulması
- [ ] Semptom çıkarımı için prompt mühendisliği
- [ ] Yapılandırılmış semptom verisi (JSON) oluşturulması
- [ ] Semptomların Symptoms tablosuna kaydedilmesi

**Deliverable**

- Çalışan semptom metin analiz sistemi

---

# 9. Hafta — Bilimsel Literatür Entegrasyonu (RAG)

Bu hafta yapay zekanın bilimsel literatüre dayalı analiz yapabilmesi sağlanacaktır.

## Scientific Data Retrieval

- [ ] PubMed API entegrasyonu
- [ ] Semptom bazlı sağlık makalelerinin çekilmesi

## Document Processing

- [ ] Makalelerin Gemini ile özetlenmesi
- [ ] Bilimsel çıkarımların oluşturulması

## Vector Database

- [ ] Gemini Embedding API (text-embedding-004) ile embedding oluşturulması
- [ ] PostgreSQL pgvector'e embedding kaydedilmesi
- [ ] Cosine similarity ile benzer makale arama fonksiyonunun yazılması

**Deliverable**

- Çalışan bilimsel veri bilgi tabanı

---

# 10. Hafta — AI Analiz ve Yorumlama Sistemi

Bu hafta tüm verileri birleştiren AI analiz sistemi geliştirilecektir.

## Data Aggregation

- [ ] Kullanıcı sağlık verilerinin toplanması
- [ ] Görsel analiz verilerinin eklenmesi
- [ ] Semptom analiz verilerinin eklenmesi

## AI Analysis Pipeline

- [ ] pgvector ile ilgili bilimsel belgelerin RAG retrieval işlemi
- [ ] Tüm verilerin tek prompt'ta birleştirilmesi
- [ ] Gemini LLM ile sağlık yorumu üretilmesi
- [ ] Yorumların AIAnalysisResults tablosuna kaydedilmesi
- [ ] Web ve mobil arayüzde yorum gösterimi

**Deliverable**

- Çalışan AI analiz sistemi

---

# 11. Hafta — Test ve Final Hazırlığı

Bu hafta sistemin testleri ve final hazırlıkları yapılacaktır.

## System Testing

- [ ] Web uygulama testleri
- [ ] Mobil uygulama testleri
- [ ] FastAPI backend endpoint testleri (pytest)
- [ ] AI analiz doğruluğunun kontrolü

## Bug Fixing

- [ ] Tespit edilen hataların düzeltilmesi
- [ ] Performans iyileştirmeleri

## Final Preparation

- [ ] Proje raporunun hazırlanması
- [ ] Sunum hazırlanması

**Deliverable**

- Tam çalışan sistem
- Proje sunumu
