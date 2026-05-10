# MindTrack Mobil Logo

Buraya logo dosyalarını şu adlarla koy (kod bunları otomatik kullanacak):

## Zorunlu dosyalar

| Dosya adı | Boyut | Açıklama |
|---|---|---|
| `logo.png` | 256×256+ | Düşük yoğunluk ekranlar için (1x) |
| `logo@2x.png` | 512×512 | Retina ekranlar (2x) — iPhone çoğu model |
| `logo@3x.png` | 768×768 | iPhone Plus/Pro Max (3x) |

> React Native, ekran piksel yoğunluğuna göre `@2x` veya `@3x` versiyonunu otomatik seçer.
> Sadece `logo.png` koysan da çalışır ama yüksek çözünürlüklü ekranlarda bulanık görünebilir.

## Format

- PNG, **şeffaf arka planlı** olmalı
- Logo kare alana sığmalı (centered, padding bırak)
- Hem dark hem light tema üzerinde okunabilmeli

## iOS App Icon (sistem ikonu)

iOS uygulama simgesini değiştirmek için:

1. Logo'nu **1024×1024 PNG** olarak hazırla (App Store kuralı, şeffaflık YOK)
2. Xcode'da projeyi aç:
   ```
   open mobile/ios/MindTrackMobile.xcworkspace
   ```
3. Sol panelde **MindTrackMobile** → `Images.xcassets` → `AppIcon`
4. 1024 yuvasına logo'yu sürükle (Xcode diğer boyutları otomatik üretir)

VEYA terminal'den (daha hızlı):
- https://www.appicon.co adresine 1024×1024 PNG'yi yükle
- AppIcon.appiconset.zip'i indir, içindeki dosyaları
  `mobile/ios/MindTrackMobile/Images.xcassets/AppIcon.appiconset/` içine kopyala

## Android App Icon

Android için:
1. Logo'nu **512×512 PNG** olarak hazırla
2. https://easyappicon.com adresine yükle veya Android Studio'da Image Asset Studio kullan
3. Üretilen `mipmap-*` klasörlerini `mobile/android/app/src/main/res/` içine kopyala
