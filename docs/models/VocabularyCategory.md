# VocabularyCategory modeli

**Kısa özet:** Kelime listelerini raflara bölmek için kullanılır. Her kategoriye isim, seviye ve isteğe bağlı üst kategori tanımlarız.

## Temel alanlar

- `name`: Gösterilecek isim.
- `slug`: URL dostu benzersiz kısa ad.
- `description`: Kısa tanım (isteğe bağlı).
- `level`: CEFR seviyesi ya da `unknown`.
- `color`: Arayüzde kategori rengi.
- `icon`: İkon adı veya yolu.
- `order`: Sıralama için kullanılan sayı.
- `isActive`: Kategori listede gözüksün mü?
- `parent`: Varsa üst kategori referansı.
- `metadata.deckTypes`: Hangi oyun desteleriyle ilişkilendirildiği.
- `metadata.tags`: Ek etiketler.
- `createdAt` / `updatedAt`: Otomatik zaman damgaları.

## Neden önemli?

- Kelime listesi ekranında filtreleme yaparken kullanılır.
- Kategori ağacı (ana/alt kategori) kurmamıza izin verir.
