# Borç Takip

Kişisel borç ve gelir takibi — mobil uyumlu web uygulaması.

## Faz 1 — Prototip (şu an)

- Veriler tarayıcıda `localStorage` ile saklanır
- Kredi kartları, banka kredileri, diğer ödemeler ve gelirler
- Aylık özet rapor (gelir − gider = bakiye)

```bash
cd borc-takip
npm install
npm run dev
```

Telefondan test: bilgisayarınızla aynı ağda `http://<bilgisayar-ip>:5180`

## Faz 2 — Supabase + Vercel (plan)

1. Supabase projesi oluşturun
2. `.env.example` dosyasını `.env` olarak kopyalayıp anahtarları girin
3. `supabase/schema.sql` tablolarını çalıştırın
4. Vercel'e deploy: root `borc-takip`, build `npm run build`, output `dist`

## Sekmeler

| Sekme | İçerik |
|-------|--------|
| Özet | Aylık gelir, gider, bakiye ve borç özeti |
| Kartlar | Banka adı, min. ödeme, toplam borç |
| Krediler | Aylık taksit, kalan vade, kapama tutarı |
| Ödemeler | Okul/Kur taksidi vb. — vade tarihli |
| Gelirler | Maaş, ek kazanç vb. |
