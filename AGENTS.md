# Finszeka güncelleme kayıtları

Her uygulama güncellemesinde sürüm defterini koruyun. Planlanan Git commit başlığına karşılık kısa, kullanıcıya yönelik Türkçe açıklamayı `src/data/release-notes.json` dosyasına ekleyin. Önceki kayıtları silmeyin veya değiştirmeyin.

Yeni değişikliğe başlamadan önce mevcut Git geçmişindeki eksik kayıtları `src/data/release-history.json` dosyasına aynı şemayla aktarın; açıklamaları release-notes eşlemesinden, sürüm tabanını ilgili commit'in package.json dosyasından alın. Böylece kısa Git geçmişi olan dağıtımlarda da eski kayıtlar korunur. Sürüm numarası kullanılmadan önceki kayıtların version alanını null bırakın.

Uygulama sürümü package.json sürümü ve Git commit kimliğinden otomatik oluşur. Manuel commit kimliği yazmayın. Sürüm defterindeki tarih kodun kayıt tarihidir; dağıtım zamanı olarak sunmayın. Değişiklikleri build ile doğrulayın.
