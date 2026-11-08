# 📋 DoriScan: To'liq Loyiha Blueprint & Strategik Hujjat

Ushbu hujjat **DoriScan** ("Smart Farmatsevt") loyihasining biznes modeli, foydalanuvchi yo'li (UX), texnik arxitekturasi, brending va marketing strategiyasining to'liq tahlilini o'z ichiga oladi.

---

## 1. Loyiha Xulosasi va Missiyasi

- **Loyiha nomi:** DoriScan (talaffuzi: *DoriSkan*)
- **Muqobil nomlar:** DoriTop, Retseptim
- **Format:** Telegram Mini App + Veb platforma
- **Asosiy shiorlar:**
  - *«Retseptni skanerlang — 70% gacha tejang!»*
  - *«Shifokor xatini o‘qiydi, ortiqcha xarajatdan saqlaydi.»*
- **Missiya:** O‘zbekistonda har bir oilaga shifokorlar yozgan tushunarsiz retseptlarni tushunishga ko‘maklashish, qimmat dori vositalarining sifatli mahalliy va arzon analoglarini taqdim etish orqali aholining oylik xarajatlarini sezilarli darajada tejash.

---

## 2. Bozor Tahlili va Mavjud Muammolar (Pain Points)

### 2.1. O‘zbekiston Bozoridagi Asosiy Og‘riqlar
1. **Shifokorlar qo‘lyozmasi ("Vrach xati"):**
   - Retseptlar deyarli har doim qo‘lda, shoshilinch va tushunarsiz yoziladi.
   - Oddiy aholi u yoqda tursin, ko‘pincha dorixonachilar ham xatni xato o‘qiydi yoki taxmin qiladi.
2. **Dorixonalardagi asossiz narx va xaridorlarni aldash:**
   - Dorixona xodimlari farmatsevtika kompaniyalari bilan tuzilgan bonus/foiz tizimi tufayli xaridorga birinchi navbatda eng qimmat import brendni taklif qiladi.
3. **Arzon analoglar (generiklar) haqida ma'lumotsizlik:**
   - Masalan: 130 000 – 150 000 so‘mlik import dori o‘rniga, xuddi shu ta’sir qiluvchi moddaga (XPN) ega mahalliy O‘zbekiston yoki Yevropa sertifikatlangan analogi 20 000 – 30 000 so‘m turadi.
   - Aholi bu haqda bilmagani uchun har bir kasallik kursida yuz minglab ortiqcha mablag‘ sarflaydi.

### 2.2. Raqobatchilar Tahlili
- **ArzonApteka, Apteka.uz, Tabletka.uz:**
  - 2010-yillar uslubidagi statik dori kataloglari.
  - Sun'iy intellekt, rasm/qo‘lyozmani skanerlash yoki analoglarni avtomatik hisoblash mexanizmlari mavjud emas.
  - Interfeysi eskirgan va yoshlar hamda ommaviy foydalanuvchi uchun murakkab.
- **Med24, TezMed:**
  - Asosan klinika va shifokorlar qabuliga yozilish yoki hamshira chaqirish xizmatlari. Retsept va dori tejash yo‘nalishida ishlamaydi.
- **DoriScan ustunligi:**
  - 2 soniyada qo‘lyozma retseptni OCR/AI orqali o‘qish.
  - Dori tarkibini (XPN) avtomatik ajratib, tejamkor analoglarini ko‘rsatish.
  - Telegram Mini App orqali ilova o‘rnatmasdan (0 to‘siq bilan) darhol foydalanish.

---

## 3. Foydalanuvchi Tajribasi (UX User Journey)

1. **Kirish:** Foydalanuvchi Telegram'da `@DoriScanBot` orqali Mini App'ni ochadi (ro‘yxatdan o‘tish shart emas, 1 bosishda start).
2. **Kamera/Yuklash:** Kamerada qog‘oz retseptni rasmga oladi yoki galereyadan yuklaydi.
3. **AI Vision Tahlili:** Tizim 1-2 soniyada qo‘lyozma xatni tahlil qilib, toza matn ko‘rinishida chiqaradi:
   - *Dorilar ro‘yxati, dozasi, qabul qilish tartibi.*
4. **"Tejamkor Analoglar" Blok:**
   - Shifokor yozgan dori: *Masalan, Klatsid 500 mg (~420 000 so‘m)*
   - Tavsiya etiladigan analoglar: *Klaritromitsin mahalliy (~115 000 so‘m)*
   - **💰 Tejalgan mablag‘: ~305 000 so‘m!**
5. **Xalqona Tushuntirish:** Dori nima uchun buyurilgani, och yoki to‘q qoringa ichilishi, muhim qarshi ko‘rsatmalar.
6. **Xaritada Ko‘rish va Buyurtma:** Eng arzon va eng yaqin dorixonalarni ko‘rsatish, kuryer orqali buyurtma berish tugmasi.

---

## 4. Brend Identifikatsiyasi (Brand Identity)

- **Asosiy ranglar:**
  - 🟢 Tibbiyot Yashili (`#10B981`): Salomatlik, tabiiylik va xavfsizlik ramzi.
  - 🔵 Texnologik Ko‘k (`#3B82F6`): Ishonch, aniqlik va sun’iy intellekt.
- **Logotip Konseptsiyasi:**
  - Kapsula shakli, o‘rtasidan gorizontal skaner nuri o‘tgan zamonaviy minimalistik belgi.
- **Raqamli Manzillar:**
  - Telegram Bot: `@DoriScanBot`
  - Veb-sayt: `doriscan.uz`
  - Ijtimoiy tarmoqlar: `@doriscan.uz` / `@doriscan_ai`

---

## 5. Texnik Arxitektura va Tizim Tuzilishi

### 5.1. Tizim Komponentlari
1. **Frontend (Telegram Mini App):**
   - React 18 / Vite / TailwindCSS
   - Telegram WebApp SDK (`@twa-dev/sdk`)
   - Lucide React piktogrammalar to‘plami
   - Kamera integratsiyasi (HTML5 Camera / File Input)
2. **Backend API:**
   - Python 3.11+, FastAPI (asinxron, yuqori tezlik)
   - Uvicorn / Gunicorn
   - Pydantic v2 ma'lumotlar validatsiyasi
3. **AI Vision Dvigateli:**
   - Google Gemini Multimodal Vision API (`gemini-3.8-flash`, `google-genai >= 2.30.1` Interactions API, `store=False`)
   - Shifokor xatini o‘qish uchun ixtisoslashgan `System Instruction` va `response_format` JSON Schema output
4. **Ma'lumotlar Bazasi:**
   - PostgreSQL (yoki dastlabki MVP uchun SQLite)
   - O‘zbekiston Farmatsevtika Agentligi (UzPharm) Davlat Reyestri
   - Maydonlar: `savdo_nomi`, `xpn` (xalqaro patentlanmagan nomi), `ishlab_chiqaruvchi`, `mamlakat`, `doza`, `shakl`, `taxminiy_narx`

---

## 6. Monetizatsiya Strategiyasi (Daromad Manbalari)

1. **B2B Farmatsevtika Zavodlari Reklamasi (Asosiy tushum):**
   - Mahalliy dori ishlab chiqaruvchilari (Jurabek Laboratories, Nobel Pharmsanoat, Dentafill, Radiks, Uzgermed).
   - Ularning sifatli va arzon analoglarini ilova yuqorisida "Tasdiqlangan milliy mahsulot" belgisi bilan ko‘rsatish.
   - Bitta korxona bilan shartnoma: $2 000 – $5 000/oy.
2. **Dorixonalardan Lead Generation Komissiyasi:**
   - Foydalanuvchi "Dorixonadan bron qilish" yoki "Xarid qilish" tugmasini bosganda, sherik dorixonaga tayyor xaridor yo‘naltiriladi (har bir muvaffaqiyatli savdodan 5–10% komissiya).
3. **Onlayn Yetkazib Berish (Agregator Xizmati):**
   - Yandex Delivery yoki shaxsiy kuryerlar tarmog‘i orqali bemorning uyigacha yetkazish ustamasi.
4. **Premium Obuna (Bemorlar va Keksalar uchun):**
   - Oyiga 10 000 – 15 000 so‘m.
   - Cheksiz retseptlar tarixi, oila a’zolari sog‘liq profili, "Dori ichish vaqti" aqlli eslatmasi (Telegram push/xabarnoma).

---

## 7. Yuridik Himoya va Qoidalar (Medical Disclaimer)

Tizim qonuniy javobgarlikdan to‘liq himoyalangan bo‘lishi lozim:
> **Qat'iy ogohlantirish:** «DoriScan — axborot beruvchi intellektual tizim. Dori vositalarini yoki ularning analoglarini qabul qilishdan oldin davolovchi shifokoringiz yoki malakali farmatsevt bilan maslahatlashing.»

---

## 8. Ishga Tushirish Yo‘l Xaritasi (Roadmap)

| Bosqich | Vazifalar |
| :--- | :--- |
| **1-bosqich: Prototip (MVP)** | Loyiha skeleti, FastAPI backend, Gemini AI Vision orqali retseptni o‘qish testi, Mini App prototipi |
| **2-bosqich: Baza Integratsiyasi** | O‘zbekiston dorilar reyestri ma'lumotlarini yuklash, XPN bo‘yicha analoglar qidiruv algoritmini ulash |
| **3-bosqich: Telegram Mini App** | Dizaynni sozlash, Telegram botga ulash, foydalanuvchi testlari |
| **4-bosqich: Viral Marketing** | Instagram / TikTok uchun ko‘rgazmali solishtirish videolari ("Vrach xati vs DoriScan") |
| **5-bosqich: Monetizatsiya** | Dorixonalar va mahalliy zavodlar bilan B2B hamkorlikni boshlash |
