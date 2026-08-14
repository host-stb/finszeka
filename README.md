# Gelir Raporu

Ekteki Google Sheets gelir raporunu (Holimer/FW/STB Vital gibi firmalar için
aylık FAALİYET / kategori / kalem kırılımlı gelir tablosu) aynı görünüm ve
formatta gösteren, "Güncelle" butonuyla veriyi FastAPI backend'inizden
(satzeka / Logo entegrasyonu) yeniden çeken bir Next.js uygulaması.

**Canlı:** https://finszeka.com (Vercel — sadece `ALLOWED_EMAILS` listesindeki
Google hesapları girebilir).

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

**İstisna — Tahsilatlar:** Danışman SQL Server'da `VW_100_TAHSILATLAR`
görünümünü paylaştı ve 03.08.2026 tarihinde bu view'den 2026 Ocak-Ağustos
aylık toplamlarını sorguladı. `src/lib/finance-mock.ts` içindeki
`TAHSILAT_2026_GERCEK` dizisi artık bu **gerçek** rakamlardır (Ağustos
kısmi ay). FastAPI'de bu view'i dönen bir uç nokta henüz yok, o yüzden
veri hâlâ `finance-mock.ts` içinde duruyor — ama artık uydurma değil.
Fiş bazlı satır verisi (hangi cari, ne zaman, ne kadar) için gerçek bir
kaynak yok; "Son İşlemler" tablosundaki satırlar (`TAHSILAT_ORNEK_SATIRLAR`)
gerçek şemaya (`IslemKod`/`FisTur`/`FisNo`/`FisTarih`/`CariAd`/`Tutar`/
`ISYERI` vb., bkz. `TahsilatSatiri` tipi `finance-types.ts`) uygun ama
içerik hâlâ illüstratif örnektir. Arayüzde Tahsilatlar kartında yeşil bir
nokta ve detay panelinde "(Kısmen Gerçek)" etiketi bunu ayırt eder.
Diğer alanların (Ödemeler, Borçlar, Alacaklar, Banka, Harcamalar, Hata)
SQL şeması geldikçe aynı yöntemle tek tek gerçek veriye taşınabilir.

## Web Mağaza (holistikmarket.com)

Üstteki menüde üçüncü sekme: **Web Mağaza**. Bu, GERÇEK Logo verisiyle
çalışan bir bölüm (dummy değil) — holistikmarket.com'un Bugün / Bu Hafta /
Bu Ay / Yılbaşından Bugüne cirosunu, kendi site + pazaryeri kanalları
kalem kalem kırılımıyla gösterir.

**Kanal eşlemesi** (`src/lib/webstore-report.ts`, 2026-08-04'te
`/logo/cariler` ile doğrulandı — hepsi `Holimer` şirketi altında):

- **Kendi Sitem**: `9.HOLISTIK.COM` (HOLİSTİKMARKET.COM) + `9.TICIMAX`
  (HOLİSTİK MARKET.COM) — ikisi de aynı sitenin farklı tahsilat kanalı,
  toplanıyor.
- **Pazaryerleri** (ayrı ayrı listelenir): Trendyol (`9.H.TRENDYOL`),
  Hepsiburada (`9.H.HEPSIBURADA`), Amazon (`9.H.AMAZON`), Pazarama
  (`9.H.PAZARAMA`), PTT AVM (`9.H.PTT`), N11 (`9.H.N11`), Idefix
  (`9.H.IDEFIX`).
- **Genel Toplam** = Kendi Sitem + tüm pazaryerlerinin toplamı.

**Hesaplama yöntemi**: `/logo/satislar/ozet` (sirket=Holimer, ilk_n=50) tek
çağrıda hem genel toplamı hem "en çok alan cariler" listesini veriyor; kısa
dönemlerde (bugün/hafta/ay) bu liste 9 kanalın tamamını güvenle yakalıyor.
Yılbaşından bugüne gibi uzun dönemlerde düşük hacimli kanallar (N11, Idefix)
top-50 dışında kalabiliyor — bu durumda o kanal için `/logo/satislar`'ı
`cari_kodu` filtresiyle çekip ham satırlardan topluyoruz (hacimleri küçük
olduğu için tek sayfada bitiyor, doğrulandı).

**Bekleyen iyileştirme**: Danışmana `/logo/satislar/ozet`'e bir `cari_kodu`
(tekli/çoklu) filtresi eklemesi rica edildi — eklenince yukarıdaki "ham
veriden tamamla" adımına hiç gerek kalmayacak, tüm dönemler için tek çağrı
yeterli olacak. Ayrıca ürün bazlı en çok/en az satan liste bu filtre
eklenince kolayca yapılabilecek (`/logo/satislar/ozet` zaten
`en_cok_satan_urunler` döndürüyor, sadece kanal bazlı filtrelenmesi lazım).

FASTAPI_BASE_URL tanımsızsa veya istek tamamen başarısız olursa
`src/lib/webstore-mock.ts`'teki örnek veriye düşülür (rozette "○ Örnek
Veri" görünür).

### Geçmiş dönemle kıyaslama

Her dönem kartı (Bugün/Bu Hafta/Bu Ay/Yılbaşından Bugüne) artık bir önceki
eşdeğer dönemle otomatik kıyaslanır — Bugün → Dün, Bu Hafta → Geçen Hafta
(aynı gün sayısı), Bu Ay → Geçen Ay (aynı gün sayısı), Yılbaşından Bugüne →
Geçen Yıl (yılbaşı – aynı tarih). Genel toplamda ve her kanalda (Kendi
Sitem, her pazaryeri ayrı ayrı) yüzde değişim ok/renk rozetiyle gösterilir
(`src/lib/webstore-report.ts` → `oncekiDonemAraligi`,
`src/components/WebstoreOverview.tsx` → `DeltaBadge`).

### KDV dahil / hariç (matrah)

Gösterilen tüm tutarlar **KDV dahildir** (Logo'nun `toplami`/`toplam_tutar`
alanı). Bugün/Bu Hafta/Bu Ay gibi kısa dönemlerde ayrıca satır bazlı veriden
(`satir_matrahi` + `kdv` alanları) gerçek **Matrah (KDV hariç)** ve **KDV**
tutarları da hesaplanıp kartta ayrı bir satırda gösterilir. Yılbaşından
Bugüne gibi uzun dönemlerde bu kırılım hesaplanmaz (veri hacmi çok
büyüdüğü için performans amaçlı atlanır) — kart bunu açıkça belirtir,
rakam uydurulmaz (bkz. `WebstoreMatrahKirilimi.matrahHesaplandi`).

### Kanal Bazlı Karşılaştırma (pazaryerleri çubuk grafik)

Dönem kartlarının altında `WebstorePazaryeriKarsilastirma.tsx`: seçilen
dönem (Bugün/Bu Hafta/Bu Ay/Yılbaşından Bugüne) için Kendi Site + her
pazaryeri, güncel dönem vs bir önceki eşdeğer dönem gruplu çubuk grafikte
karşılaştırılır. Ek bir API çağrısı gerekmez — zaten `/api/webstore`'dan
gelen `karsilastirma` verisini kullanır.

### Trend Grafikleri (ayrı sayfa: `/trend`)

Ana sayfadaki "Trend Grafikleri" kartına tıklayınca `/trend` sayfasına
gidilir (aynı Google girişiyle korunur, `proxy.ts` tüm rotaları kapsar).
Orada iki bölüm var:

1. **Günlük / Haftalık / Aylık / Yıllık sekmeleri**
   (`src/components/WebstoreTrendSection.tsx`): Günlük (ay seçici ile gün
   gün detay), Haftalık (son 12 hafta), Aylık (seçilen yılın 12 ayı, yıl
   seçici ile) ve Yıllık (Logo'daki en eski faturadan bugüne, en fazla son
   6 yıl) — her biri çubuk grafik + tablo ile (`WebstoreSeriChart.tsx`).
   Yeni uç nokta: `GET /api/webstore/seri?granularite=haftalik|aylik|yillik&yil=`
   → `src/lib/webstore-report.ts` içindeki `fetchWebstoreHaftalikSeri` /
   `fetchWebstoreAylikSeri` / `fetchWebstoreYillikSeri`. Bu üçü "hızlı
   yol"u kullanır (matrah/KDV kırılımı yok, sadece KDV dahil toplam) — çok
   sayıda nokta çekildiği için performans amaçlı. Tek bir dönemin verisi
   alınamazsa (ağ/HTTP hatası) o nokta `veriAlinamadi: true` ile
   işaretlenir ve grafikte/tabloda gri/"Veri alınamadı" olarak ayrı
   gösterilir — gerçek bir sıfırla karıştırılmaz, tüm seri mock'a düşmez.
2. **Yıl Yıla Karşılaştırma** (`WebstoreYilKarsilastirma.tsx`): iki yıl
   seçin, Ocak–Aralık ay ay ciro yan yana çubuk grafikte karşılaştırılır
   (aynı `/api/webstore/seri?granularite=aylik` uç noktası iki farklı yıl
   için paralel çağrılır).

### Günlük Detay (ay seçici + grafik)

Web Mağaza sekmesinin altında "Günlük Detay" bölümü, seçilen bir ay için gün
gün ciro serisini (kendi site / pazaryerleri kırılımlı) çizgi grafik ve
tablo olarak gösterir; aynı ayın geçen yılıyla otomatik kıyaslanır (ikinci,
kesikli çizgi). Yeni uç nokta: `GET /api/webstore/gunluk?yil=&ay=` →
`src/lib/webstore-report.ts` içindeki `fetchWebstoreGunlukSeri` her bir
web mağaza kanalı için o ayın ham satırlarını çekip güne göre gruplar
(`src/components/WebstoreDailyBreakdown.tsx`). FASTAPI_BASE_URL tanımsızsa
ya da istek başarısız olursa `getMockWebstoreGunlukSeri` ile örnek veriye
düşülür.

## Kutu Trendi (TÜM şirketler, konsolide + şirket kırılımı + web mağaza payı)

Üst menüdeki **Kutu Trendi** bağlantısı ayrı bir sayfaya (`/kutu-trend`) götürür.
Web Mağaza'dan farklı olarak burada kanal ayrımı değil ŞİRKET ayrımı vardır —
Logo'daki TÜM satışları kapsar (bugün için Holimer + Fw İlaç; liste
`/logo/durum`'dan dinamik gelir, hardcode değil).

Gösterilen: Günlük / Haftalık / Aylık / Yıllık sekmelerinde toplam satılan
**kutu adedi** (`/logo/satislar/ozet` → `genel.toplam_miktar` — fatura
satırlarındaki miktar/birim toplamı) ve **kutu başına ciro** (`toplam_tutar /
toplam_miktar`), TL / EUR / USD olarak — hem TÜMÜ toplamı hem şirket bazlı
kırılım (yığılmış çubuk grafik + ayrı tablo).

- Yeni dosyalar: `src/lib/kutu-types.ts` (veri sözleşmesi), `src/lib/kur-api.ts`
  (TCMB `today.xml`'den günlük gösterge kuru — sunucu tarafında, CORS
  nedeniyle tarayıcıdan çekilemez), `src/lib/kutu-report.ts` (dönem
  serilerini hesaplar — her dönem noktası, seçilen şirket listesindeki HER
  şirket için ayrı bir `/logo/satislar/ozet` çağrısıyla paralel hesaplanır ve
  toplanır), `src/lib/kutu-mock.ts` (mock fallback),
  `src/app/api/kutu-trend/seri/route.ts`
  (`?granularite=gunluk|haftalik|aylik|yillik&yil=&ay=`),
  `src/components/KutuTrendSection.tsx` + `KutuSeriChart.tsx`,
  `src/app/kutu-trend/page.tsx`.
- **Şirket kırılımı:** Şirketlerden biri bile veri alınamazsa (ağ/HTTP hatası)
  TÜM nokta `veriAlinamadi: true` ile işaretlenir — kısmi bir toplamı gerçekmiş
  gibi göstermemek için (webstore-report.ts'teki "hata yutma" deseninden daha
  katı).
- **Web mağaza (e-ticaret) payı:** Holimer'ın toplamının ne kadarının web
  mağaza kanallarından (holistikmarket.com + 7 pazaryeri — bkz.
  `webstore-report.ts` içindeki `TUM_KANAL_KODLARI`) geldiği, SADECE Günlük ve
  Haftalık sekmelerinde hesaplanıp gösterilir ("└ Web Mağaza" alt satırları,
  çubuk grafikte koyu/açık ton ayrımı). `/logo/satislar/ozet` kanal bazlı
  miktar (kutu) vermediği için bu kırılım ham fatura satırlarının
  (`/logo/satislar`, `cari_kodu` filtresiyle) sayfalanmasıyla hesaplanır — tüm
  dönem aralığı için TEK seferde (nokta başına değil) çekilip güne göre
  yeniden dağıtılır. Aylık (tam yıl) ve Yıllık (çoklu yıl) için bu hacim çok
  büyüyeceğinden performans nedeniyle BİLEREK hesaplanmaz —
  `KutuSeri.webMagazaHesaplandi` bayrağı bunu arayüze bildirir, o durumda bir
  uyarı notu gösterilir (rakam uydurmamak için 0 değil, alan hiç doldurulmaz).
- **Çift sayım notu:** "TÜMÜ" toplamı tüm şirketleri toplar; şirketler arası
  satış varsa konsolide toplamda çift sayılmış olabilir (bkz. proje genelindeki
  SOUL.md kuralı). Şirket bazlı kırılım en azından hangi şirketin ne kadar
  katkı yaptığını görünür kılıyor.
- **Kur:** TCMB'nin günlük gösterge niteliğindeki döviz kuru kullanılır
  (alış/satış ortalaması). Hafta sonu/tatilde TCMB güncellemediği için son
  yayınlanan kur kullanılır — kartta hangi tarihe ait olduğu gösterilir. TCMB
  servisine hiç ulaşılamazsa TL rakamları yine gerçek ve güncel kalır, sadece
  EUR/USD kolonları "kur alınamadı" uyarısıyla boş gösterilir (rakam
  uydurulmaz).
- **Yıllık sekme sınırlaması:** Logo mirror veritabanında şu an yalnızca
  belirli bir tarihten (bkz. `/logo/durum` → `en_eski_fatura`) sonrası veri
  varsa, yıllık karşılaştırma o kadar geriye gidebilir — kart bunu açıkça
  belirtir.

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
