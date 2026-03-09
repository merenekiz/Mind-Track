# 🧠 MindTrack
## Somatik Belirti & Duygu Analizi Yapan Akıllı Sağlık Günlüğü

MindTrack, kullanıcıların günlük sağlık verilerini kaydedebildiği ve bu verileri **yapay zeka ile analiz eden** akıllı bir sağlık günlüğü uygulamasıdır.

Sistem kullanıcıların:

- somatik belirtilerini
- duygu durumunu
- uyku düzenini
- stres seviyesini
- beslenme alışkanlıklarını

analiz ederek **bilimsel literatür destekli sağlık yorumları** üretir.

Platform olarak hem **web** hem **mobil** desteklenmektedir ve her iki platform aynı backend ile senkron çalışır.

---

# 🚀 Proje Hakkında

MindTrack kullanıcıların sağlık verilerini anlamlandırmayı amaçlayan **AI destekli bir sağlık analiz platformudur.**

Sistem farklı veri türlerini analiz eder:

🩺 Fiziksel belirtiler
😴 Uyku düzeni
😰 Stres seviyesi
🍽️ Beslenme alışkanlıkları
📝 Kullanıcı semptom açıklamaları
📷 Görsel veri (yemek / içecek)

Bu veriler **yapay zeka analiz sistemi** tarafından değerlendirilir ve kullanıcıya yorum olarak sunulur.

---

# ✨ Özellikler

## 📓 Akıllı Sağlık Günlüğü

Kullanıcılar günlük sağlık verilerini kaydedebilir.

Örnek veriler:

- ağrı seviyesi
- stres seviyesi
- uyku süresi
- duygu durumu
- genel sağlık notları

Bu veriler zaman içinde analiz edilerek sağlık trendleri çıkarılır.

---

## 🧠 Somatik Belirti Analizi

Kullanıcılar yaşadıkları belirtileri metin olarak yazabilir.

Örnek:

```text
Bugün başım ağrıyor ve midem bulanıyor.
```

AI tarafından çıkarılan semptomlar:

- baş ağrısı
- mide bulantısı

---

## 😊 Duygu Analizi

Kullanıcı yazdığı metinlerden duygu durumu analiz edilir.

Tespit edilebilen durumlar:

- stres
- kaygı
- yorgunluk
- duygu dalgalanmaları

---

## 📷 Görsel Veri Analizi

Kullanıcılar yemek veya içecek fotoğrafları yükleyebilir.

AI şu bilgileri çıkarabilir:

- yemek türü
- tahmini kalori
- kafein miktarı

---

## 🤖 Yapay Zeka Sağlık Analizi

AI kullanıcı verilerini analiz ederek şu ilişkileri inceleyebilir:

- stres ↔ baş ağrısı
- uyku eksikliği ↔ yorgunluk
- kafein tüketimi ↔ uyku kalitesi
- beslenme ↔ mide rahatsızlıkları

Bu analizler kullanıcıya **anlaşılır sağlık yorumları** olarak sunulur.

---

# 📚 Bilimsel Literatür Destekli AI (RAG)

MindTrack sadece AI modeline dayanmaz.

Sistem aynı zamanda **bilimsel sağlık makalelerini inceleyerek** yorum üretir.

Bu amaçla **Retrieval-Augmented Generation (RAG)** mimarisi kullanılır.

### RAG çalışma süreci

1. Bilimsel makaleler PubMed API'den alınır
2. Gemini Embedding API ile embedding oluşturulur
3. PostgreSQL pgvector'e kaydedilir
4. Kullanıcı verisi analiz edilir
5. İlgili bilimsel bilgiler cosine similarity ile çekilir
6. Gemini bu bilgileri kullanarak yorum üretir

Bu sayede AI yorumları **bilimsel verilere dayanır.**

---

# 🏗️ Sistem Mimarisi

```
Kullanıcı (Web veya Mobil)
         ↓
Next.js (Web) / React Native (Mobil)
         ↓
   FastAPI Backend
         ↓
 PostgreSQL + pgvector
         ↓
  Gemini AI Analiz Servisi
         ↓
  RAG (Bilimsel Literatür)
         ↓
   AI Sağlık Yorumu
```

---

# 🛠️ Kullanılan Teknolojiler

## 🌐 Web Frontend
- Next.js
- TypeScript

## 📱 Mobil Frontend
- React Native
- TypeScript

## ⚙️ Backend
- FastAPI (Python)
- Uvicorn
- SQLAlchemy
- Pydantic

## 🗄️ Veritabanı
- PostgreSQL
- pgvector (vektör arama)

## 🤖 Yapay Zeka
- Gemini API (LLM + Vision + Embedding)

## 🧪 Veri Analizi
- Python
- Pandas
- NumPy
- Scikit-learn

## 📚 Bilimsel Veri
- PubMed API

---

# 📂 Proje Yapısı

```
mindtrack/
├── web/          # Next.js web uygulaması
├── mobile/       # React Native mobil uygulama
├── backend/      # FastAPI backend
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

# ⚙️ Kurulum

## Repository'yi klonla

```bash
git clone https://github.com/kullaniciadi/mindtrack.git
```

## Backend kurulumu

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Web kurulumu

```bash
cd web
npm install
npm run dev
```

## Mobil uygulama kurulumu

```bash
cd mobile
npm install
npx react-native run-ios  # veya run-android
```

---

# 🔐 Environment Değişkenleri

`backend/.env` dosyasında aşağıdaki anahtarlar tanımlanmalıdır.

```env
GEMINI_API_KEY=
PUBMED_API_KEY=
DATABASE_URL=postgresql://user:password@localhost:5432/mindtrack
JWT_SECRET=
```

---

# ⚠️ Uyarı

MindTrack bir **tıbbi teşhis sistemi değildir.**

Sistem yalnızca sağlık verilerini analiz eder ve kullanıcıya öneriler sunar.

Herhangi bir sağlık sorunu için bir sağlık profesyoneline danışılmalıdır.

---

# 📌 Gelecek Geliştirmeler

- 📊 gelişmiş sağlık trend analizi
- ⌚ giyilebilir cihaz entegrasyonu
- 🧠 gelişmiş AI modelleri
- 📱 kullanıcı dashboard
- 🔔 sağlık uyarı sistemi

---

# 📜 Lisans

Bu proje eğitim ve araştırma amaçlı geliştirilmiştir.
