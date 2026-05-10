# MindTrack Logo Dosyaları

Buraya logo dosyalarını şu adlarla koy (kod bunları otomatik kullanacak):

## Zorunlu dosyalar

| Dosya adı | Boyut | Format | Nerede kullanılır |
|---|---|---|---|
| `logo.svg` | vektör | SVG | Sidebar, login, AI insight kartları (her boyutta keskin) |
| `logo.png` | 512×512 | PNG (şeffaf) | SVG yoksa fallback |
| `logo-icon.svg` | vektör | SVG (sadece simge) | Sadece simge kısmı, yazı yok — küçük ikonlar için |

## Tarayıcı sekmesi (favicon) için

Bu dosyaları **`web/src/app/`** klasörüne koy (root, `logo/` değil):

| Dosya | Boyut | Açıklama |
|---|---|---|
| `icon.png` | 512×512 PNG | Modern favicon (Chrome/Firefox) |
| `apple-icon.png` | 180×180 PNG | iOS Safari home screen |

Next.js bunları otomatik algılar; ek konfigürasyon gerekmez.

> **Önemli:** Şu anda `web/src/app/favicon.ico` var. Yeni `icon.png` koyduğunda Next.js önce yenisini kullanır. İstersen `favicon.ico`'yu sil.

## Boyut önerileri

- Logo wordmark (logo + yazı): yatay, en az 800px genişlik
- Logo icon (simge): kare, 512×512
- PNG'lerin şeffaf arka planı olmalı
- Hem dark hem light tema üzerinde okunabilmeli (kontrast yüksek olsun)

## Nereye etkiyor (kod düzenlemesi olmadan)

✅ `logo.svg` → web sidebar, login sol panel
✅ `icon.png` → tarayıcı sekme ikonu, vercel logosunu değiştirir
✅ `apple-icon.png` → iOS Safari tab

## Mobil

Mobil için ayrıca `mobile/src/assets/logo/` klasörüne kopyala:

| Dosya | Boyut |
|---|---|
| `logo.png` | 512×512 (web ile aynı olabilir) |
| `logo@2x.png` | 1024×1024 |
| `logo@3x.png` | 1536×1536 |

iOS app icon için `mobile/ios/MindTrackMobile/Images.xcassets/AppIcon.appiconset/` içine Xcode üzerinden eklemen gerekir (ayrı bir adım).
