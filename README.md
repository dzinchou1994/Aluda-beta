# AludaAI - AI ასისტენტი ქართულ ენაზე

AludaAI არის Next.js 14-ზე დაფუძნებული AI ასისტენტი, რომელიც ინტეგრირებულია Flowise-თან და მუშაობს ქართულ ენაზე.

## ✨ მთავარი ფუნქციები

- 🤖 **Flowise ინტეგრაცია** - პირდაპირი API კავშირი
- 🌍 **ქართული ენა** - მთლიანი UI ქართულ ენაზე
- 🔐 **ავტორიზაცია** - Google, Apple და Guest მომხმარებლებისთვის
- 💬 **ChatGPT-ის მსგავსი ინტერფეისი** - მოქნილი და მარტივი
- 📱 **Responsive Design** - Tailwind CSS + shadcn/ui
- 🚀 **Next.js 14 App Router** - თანამედროვე ტექნოლოგიები

## 🚀 სწრაფი დაწყება

### 1. დამოკიდებულებების ინსტალაცია

```bash
npm install
```

### 2. გარემოს კონფიგურაცია

შექმენით `.env.local` ფაილი:

```bash
cp env.example .env.local
```

და შეავსეთ შემდეგი ცვლადები:

```env
# Flowise Integration
FLOWISE_HOST=https://flowise-eden.onrender.com
FLOWISE_CHATFLOW_ID=9a1520d5-52e3-4365-9c47-27c89f40ddeb
FLOWISE_API_KEY=your-api-key-here

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/aluda_ai"

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### 3. ბაზის მიგრაცია

```bash
npx prisma generate
npx prisma db push
```

### 4. დეველოპმენტის სერვერის გაშვება

```bash
npm run dev
```

გახსენით [http://localhost:3000](http://localhost:3000) ბრაუზერში.

## 🏗️ პროექტის სტრუქტურა

```
aluda-ai/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── chat/          # Chat API endpoint
│   ├── chat/              # Main chat interface
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   └── ChatComposer.tsx   # Main chat component
├── lib/                    # Utility libraries
│   ├── flowise.ts         # Flowise integration
│   ├── session.ts         # Session management
│   └── utils.ts           # Helper functions
├── prisma/                 # Database schema
│   └── schema.prisma      # Prisma models
├── __tests__/              # Test files
└── package.json            # Dependencies
```

## 🔧 კონფიგურაცია

### Flowise ინტეგრაცია

AludaAI იყენებს Flowise-ის პირდაპირ API-ს:
- მომხმარებლები იყენებენ `/api/chat` endpoint-ს
- სერვერის მხარეს პროქსი Flowise-თან
- უსაფრთხო და კონტროლირებადი

### გარემოს ცვლადები

| ცვლადი | აღწერა | დეფოლტი |
|---------|---------|----------|
| `FLOWISE_HOST` | Flowise სერვერის URL | - |
| `FLOWISE_CHATFLOW_ID` | Chatflow ID | - |
| `FLOWISE_API_KEY` | API გასაღები (ოფციონალური) | - |

## 📱 გამოყენება

### მთავარი ჩატი
1. გადადით `/chat` გვერდზე
2. დაწერეთ შეკითხვა ქართულ ენაზე
3. დააჭირეთ Enter ან Send ღილაკს
4. მიიღეთ AI-ის პასუხი

### კლავიატურის შორტკატები
- `Enter` - შეტყობინების გაგზავნა
- `Shift + Enter` - ახალი ხაზი

## 🧪 ტესტირება

### Unit ტესტები
```bash
npm test
```

### E2E ტესტები
```bash
npm run test:e2e
```

## 🔒 უსაფრთხოება

- **Rate Limiting** - 10 მოთხოვნა წუთში
- **Session Management** - უსაფრთხო cookie-ები
- **CORS** - მხოლოდ დაშვებული origins
- **Input Validation** - ყველა მოთხოვნის შემოწმება
- **Error Handling** - უსაფრთხო შეცდომების დამალვა

## 📊 ტელემეტრია

სისტემა აგზავნის მინიმალურ ტელემეტრიას:
- მომხმარებლის ID/guest ID
- Chat ID
- მოთხოვნის ხანგრძლივობა
- სტატუსი (წარმატება/შეცდომა)

## 🚀 დეპლოიმენტი

### Vercel
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t aluda-ai .
docker run -p 3000:3000 aluda-ai
```

## 🤝 წვლილის შეტანა

1. Fork-ი გაუკეთეთ პროექტს
2. შექმენით feature branch
3. Commit-ი გაუკეთეთ ცვლილებებს
4. Push-ი გაუკეთეთ branch-ს
5. Pull Request-ი შექმენით

## 📄 ლიცენზია

MIT License - იხილეთ [LICENSE](LICENSE) ფაილი დეტალებისთვის.

## 📞 კონტაქტი

- **GitHub Issues**: [პროექტის გვერდი](https://github.com/your-username/aluda-ai)
- **Email**: your-email@example.com

---

**AludaAI** - თქვენი AI ასისტენტი ქართულ ენაზე 🚀
# Last updated: Sat Aug 23 02:06:02 CEST 2025
