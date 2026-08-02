# Gelir Raporu

Ekteki Google Sheets gelir raporunu (Holimer/FW/STB Vital gibi firmalar için
aylık FAALİYET / kategori / kalem kırılımlı gelir tablosu) aynı görünüm ve
formatta gösteren, "Güncelle" butonuyla veriyi FastAPI backend'inizden
(satzeka / Logo entegrasyonu) yeniden çeken bir Next.js uygulaması.

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın. `FASTAPI_BASE_URL`
tanımlanmadığı sürece uygulama, tabloyu göstermek için örnek (mock) veri
kullanır — ekranın sağ üstünde "○ Örnek Veri" rozeti bunu belirtir.

Not: uygulama artık Google ile giriş gerektiriyor (aşağıya bakın) —
`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` doldurulmadan hiçbir sayfa açılmaz.

## Google ile giriş (erişim kısıtlama)

Site artık herkese açık değil — sadece `.env.local`'daki `ALLOWED_EMAILS`
listesinde olan Google hesapları giriş yapabilir. Şu an listede
`sansel@nutramol.com` ve `agunes@nutramol.com` var; kendi hesabınızı ya da
başkalarını eklemek isterseniz aynı satıra virgülle ekleyin:

```
ALLOWED_EMAILS=sansel@nutramol.com,agunes@nutramol.com,siz@nutramol.com
```

### Google Cloud Console tarafında yapılacaklar (bir kereye mahsus)

1. https://console.cloud.google.com/apis/credentials adresine gidin (gerekirse
   önce bir proje oluşturun).
2. "OAuth consent screen" (OAuth izin ekranı) ayarlayın — User type "Internal"
   (sadece nutramol.com Workspace hesapları) ya da "External" seçebilirsiniz;
   External seçerseniz test kullanıcıları kısmına yukarıdaki 2 e-postayı da
   ekleyin (yoksa Google onaylanmamış uygulama uyarısı verir).
3. "Create Credentials" → "OAuth client ID" → Application type: **Web
   application**.
4. **Authorized redirect URIs** kısmına şunları ekleyin:
   - `http://localhost:3000/api/auth/callback/google` (yerel geliştirme)
   - `https://<vercel-domaininiz>/api/auth/callback/google` (canlı — Vercel
     domainini öğrendikten sonra buraya ekleyip kaydedin)
5. Oluşan **Client ID** ve **Client Secret**'ı kopyalayıp `.env.local`'a
   (yerel için) ve Vercel projesinin Environment Variables kısmına (canlı
   için) `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` olarak girin.

### Vercel'de ayarlanması gereken ortam değişkenleri

```
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_SECRET=...          # openssl rand -base64 32
ALLOWED_EMAILS=sansel@nutramol.com,agunes@nutramol.com
AUTH_TRUST_HOST=true    # Vercel gibi proxy arkasında zorunlu
FASTAPI_BASE_URL=https://api.nutramolai.com
```

Redirect URI'yi Vercel domaininiz netleşince (ör. `ciro-dashboard.vercel.app`
ya da kendi domaininiz) Google Cloud Console'daki adıma geri dönüp
eklemeyi unutmayın — aksi halde giriş "redirect_uri_mismatch" hatası verir.

## Gerçek FastAPI backend'ini bağlama

`satzeka` sisteminiz zaten Logo'dan veri çekiyor; bu Next.js uygulaması o
veriyi göstermek için iki basit REST uç noktası bekler. `.env.example`
dosyasını `.env.local` olarak kopyalayıp `FASTAPI_BASE_URL` değerini
FastAPI adresinize ayarlamanız yeterli:

```bash
cp .env.example .env.local
# .env.local içinde:
# FASTAPI_BASE_URL=https://sizin-fastapi-adresiniz.com
```

Bu değişken tanımlandığı anda uygulama otomatik olarak mock veriden gerçek
veriye geçer ve rozet "● Canlı Veri" olur.

### Gerçek veri kaynağı (Logo / satzeka)

Uygulama artık `api.nutramolai.com` üzerindeki gerçek FastAPI'nin **kendi**
uç noktalarını kullanıyor (varsayımsal `/companies` ve `/gelir-raporu`
değil):

- `GET /logo/durum` → firma listesi (`sirketler[]`). Şu an canlı veride
  sadece **Holimer** ve **Fw İlaç** var — "STB Vital" gerçek bir "sirket"
  değil (bkz. aşağıdaki not).
- `GET /logo/satislar/ozet?baslangic=...&bitis=...&sirket=...&ilk_n=40` →
  bir ay için gerçek toplam ciro (`genel.toplam_tutar`) + en çok satış
  yapılan ilk 40 cari (`en_cok_alan_cariler`). `src/lib/logo-report.ts` bu
  uç noktayı yıl içindeki her ay için paralel çağırıp `CompanyReport`'a
  dönüştürüyor.

**GİRDİLER TOPLAM satırı %100 gerçektir** (doğrudan `genel.toplam_tutar`).
**Kategori kırılımı (Pazaryeri / E-Ticaret / Cari Satış / Grup Firmalar) en
iyi çaba (best-effort) bir tahmindir**: Logo'da satır bazlı veride ayrı bir
"kategori" alanı yok, bu yüzden `src/lib/logo-category.ts` içindeki anahtar
kelime kuralları cari unvanına bakarak (Trendyol/Hepsiburada/Amazon →
Pazaryeri, Anfora/Vital/Fw İlaç → Grup Firmalar, vb.) kategori tahmini
yapıyor. İlk 40 cari dışında kalan tutar otomatik olarak "Diğer
(sınıflandırılmamış cariler)" kalemine yazılır — böylece kategori
toplamları her zaman gerçek aya eşit kalır, hiçbir tutar kaybolmaz.
Anahtar kelimeleri gerçek cari unvanlarınıza göre `logo-category.ts`
içinde güncelleyebilirsiniz.

Ödemeler/Tahsilatlar/Borçlar/Alacaklar/Banka/Harcamalar/Hata için Logo'da
veri olsa da, bunları dışarı veren bir FastAPI uç noktası **henüz yok** —
bu yüzden "Finans Özeti" sekmesi aşağıda anlatıldığı gibi dummy veriyle
çalışıyor.

Backend bir Bearer token bekliyorsa `.env.local` içine
`FASTAPI_API_KEY=...` ekleyin; istekler `Authorization: Bearer <token>`
başlığıyla gönderilir.

FastAPI'ye ulaşılamazsa (kapalı/hatalı/timeout) uygulama otomatik olarak
mock veriye düşer ve konsola hatayı loglar — arayüz hiçbir zaman boş
kalmaz.

## Yeni özellikler (grafik, sıralama, Excel)

- Firma başlığının altında aylık toplam geliri gösteren bir trend grafiği
  var (recharts).
- Tablo başlığındaki "Gelir Kalemi" ve "Toplam {yıl}" sütunlarına tıklayarak
  kategorileri alfabetik ya da tutara göre sıralayabilirsiniz.
- Alt bilgi çubuğundaki "Excel'e Aktar" butonu, görünen raporu (tüm
  kategori/kalem satırları + aylık tutarlar) bir `.xlsx` dosyası olarak
  indirir (xlsx/SheetJS, tarayıcıda çalışır).

Bu iki paket (`recharts`, `xlsx`) yeni eklendi — mevcut kurulumunuzda
sadece `npm install` çalıştırmanız yeterli, `node_modules`'ü silmenize
gerek yok (native/platforma özel bir bileşenleri yok).

## Finans Özeti (dummy)

Üstteki "Gelir Raporu / Finans Özeti" menüsündeki **Finans Özeti**
sekmesinin tamamı — Ödemeler, Tahsilatlar, Borçlar, Alacaklar, Banka,
Harcamalar ve Hata (mutabakat farkı) kartları, Günlük/Aylık/Yıllık
seçici, ve detay paneli — **örnek/dummy veridir**
(`src/lib/finance-mock.ts`). Sekmenin üstünde bunu açıkça belirten sarı
bir uyarı şeridi var, sayfa başlığında da "(Dummy)" ibaresi görünür,
karıştırmamanız için.

satzeka/FastAPI tarafında bu 7 alan için gerçek bir uç nokta eklendiğinde
tek yapmanız gereken `finance-mock.ts`'i gerçek bir API çağrısıyla
(ör. yeni bir `src/app/api/finans/route.ts`) değiştirmek —
`FinanceOverview.tsx` bileşeni aynı `FinanceMetric[]` tipini beklediği
için arayüzde değişiklik gerekmez.

## Yeni firma eklemek

Firma listesi tamamen `/logo/durum`'dan geldiği için Logo'da yeni bir
"sirket" tanımlandığında Next.js tarafında hiçbir değişiklik gerekmez;
sekmelerde otomatik görünür.

## Klasör yapısı

```
src/
  app/
    api/companies/route.ts   -> firma listesi (proxy + mock fallback)
    api/report/route.ts      -> firma raporu (proxy + mock fallback)
    page.tsx                 -> ana ekran (sekmeler, Güncelle butonu, tablo)
  components/
    ReportTable.tsx           -> Sheets görünümündeki tablo
    CompanyTabs.tsx           -> alttaki firma sekmeleri
  lib/
    types.ts                  -> veri sözleşmesi (CompanyReport, ReportRow...)
    mock-data.ts               -> geliştirme/demo verisi
    format.ts                  -> TR sayı/tarih formatlama
```

## Dağıtım (deploy)

En pratik yol Vercel: repoyu Vercel'e bağlayın, `FASTAPI_BASE_URL` (ve
varsa `FASTAPI_API_KEY`) ortam değişkenlerini proje ayarlarından girin,
deploy edin. FastAPI'nizin bu adresten erişilebilir (public veya Vercel'in
IP'lerine izinli) olması gerekir.
