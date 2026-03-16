# MindTrack — API Tasarım Dokümanı

Tüm endpoint'ler `/api/v1` prefix'i altındadır.
Veri formatı: JSON. Authentication: JWT Bearer token.

---

## 1. Authentication — `/api/v1/auth`

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | /auth/register | Yeni kullanıcı kaydı | Hayır |
| POST | /auth/login | Kullanıcı girişi, token döner | Hayır |
| POST | /auth/refresh | Access token yenileme | Refresh token |
| GET | /auth/me | Mevcut kullanıcı bilgisi | Evet |

### POST /auth/register

Request:
```json
{
  "email": "kullanici@mail.com",
  "password": "sifre123",
  "full_name": "Ad Soyad"
}
```

Response (201):
```json
{
  "id": 1,
  "email": "kullanici@mail.com",
  "full_name": "Ad Soyad",
  "created_at": "2026-03-16T10:00:00Z"
}
```

### POST /auth/login

Request:
```json
{
  "email": "kullanici@mail.com",
  "password": "sifre123"
}
```

Response (200):
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

---

## 2. Health Data — `/api/v1/health-data`

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | /health-data | Günlük sağlık verisi ekle | Evet |
| GET | /health-data | Kullanıcının tüm verilerini listele | Evet |
| GET | /health-data/{id} | Tek bir kaydı getir | Evet |
| PUT | /health-data/{id} | Kaydı güncelle | Evet |
| DELETE | /health-data/{id} | Kaydı sil | Evet |

### POST /health-data

Request:
```json
{
  "date": "2026-03-16",
  "pain_level": 4,
  "sleep_hours": 6.5,
  "sleep_quality": 3,
  "stress_level": 7,
  "mood": "anxious",
  "notes": "Bugün çok yorgunum"
}
```

Response (201):
```json
{
  "id": 1,
  "user_id": 1,
  "date": "2026-03-16",
  "pain_level": 4,
  "sleep_hours": 6.5,
  "sleep_quality": 3,
  "stress_level": 7,
  "mood": "anxious",
  "notes": "Bugün çok yorgunum",
  "created_at": "2026-03-16T10:00:00Z"
}
```

### Veri Doğrulama Kuralları

| Alan | Tip | Kural |
|------|-----|-------|
| date | date | Zorunlu |
| pain_level | int | 0-10 arası |
| sleep_hours | float | 0-24 arası |
| sleep_quality | int | 1-5 arası |
| stress_level | int | 0-10 arası |
| mood | string | Opsiyonel |
| notes | string | Opsiyonel, max 1000 karakter |

---

## 3. Image Analysis — `/api/v1/images`

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | /images/analyze | Görsel yükle ve analiz et | Evet |
| GET | /images | Kullanıcının görsel analizlerini listele | Evet |
| GET | /images/{id} | Tek bir analiz sonucu | Evet |

### POST /images/analyze

Request: `multipart/form-data`
- `file`: görsel dosyası (jpg, png)
- `category`: "food" | "drink" | "other"

Response (200):
```json
{
  "id": 1,
  "user_id": 1,
  "category": "drink",
  "analysis": {
    "item": "Türk kahvesi",
    "caffeine_mg": 80,
    "calories": 15
  },
  "created_at": "2026-03-16T10:00:00Z"
}
```

---

## 4. Symptom Analysis — `/api/v1/symptoms`

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | /symptoms/analyze | Semptom metni gönder ve analiz et | Evet |
| GET | /symptoms | Kullanıcının semptom geçmişi | Evet |
| GET | /symptoms/{id} | Tek bir semptom analizi | Evet |

### POST /symptoms/analyze

Request:
```json
{
  "text": "Bugün başım ağrıyor ve midem bulanıyor",
  "date": "2026-03-16"
}
```

Response (200):
```json
{
  "id": 1,
  "user_id": 1,
  "original_text": "Bugün başım ağrıyor ve midem bulanıyor",
  "detected_symptoms": [
    {"symptom": "Baş ağrısı", "severity": "moderate"},
    {"symptom": "Mide bulantısı", "severity": "mild"}
  ],
  "date": "2026-03-16",
  "created_at": "2026-03-16T10:00:00Z"
}
```

---

## 5. AI Analysis — `/api/v1/analysis`

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | /analysis/generate | AI sağlık yorumu üret | Evet |
| GET | /analysis | Kullanıcının AI yorum geçmişi | Evet |
| GET | /analysis/{id} | Tek bir AI yorumu | Evet |

### POST /analysis/generate

Request:
```json
{
  "date": "2026-03-16"
}
```

Response (200):
```json
{
  "id": 1,
  "user_id": 1,
  "date": "2026-03-16",
  "summary": "Uyku düzeninizdeki düzensizlik ve yüksek stres seviyesi baş ağrısı ile ilişkili olabilir.",
  "recommendations": [
    "Uyku sürenizi 7-8 saate çıkarmayı deneyin",
    "Kafein tüketiminizi öğleden sonra sınırlandırın",
    "Bir sağlık profesyoneline danışmanız önerilir"
  ],
  "scientific_references": [
    {
      "title": "Sleep deprivation and headache disorders",
      "pubmed_id": "12345678",
      "relevance": "Uyku eksikliği ve baş ağrısı ilişkisi"
    }
  ],
  "data_used": {
    "health_data": true,
    "image_analysis": true,
    "symptom_analysis": true
  },
  "created_at": "2026-03-16T10:00:00Z"
}
```

---

## 6. Hata Yanıtları

Tüm endpoint'ler hata durumunda aşağıdaki formatta yanıt döner:

```json
{
  "detail": "Hata açıklaması"
}
```

| HTTP Kodu | Anlamı |
|-----------|--------|
| 400 | Geçersiz istek (validation hatası) |
| 401 | Yetkisiz (token yok veya geçersiz) |
| 403 | Erişim reddedildi (başka kullanıcının verisi) |
| 404 | Kayıt bulunamadı |
| 422 | Validation hatası (Pydantic) |
| 500 | Sunucu hatası |

---

## 7. Authentication Akışı

```
1. Kullanıcı POST /auth/register ile kayıt olur
2. POST /auth/login ile giriş yapar → access_token + refresh_token alır
3. Her istekte Authorization: Bearer <access_token> header'ı gönderir
4. Access token süresi dolduğunda POST /auth/refresh ile yeniler
```

Access token süresi: 30 dakika
Refresh token süresi: 7 gün
