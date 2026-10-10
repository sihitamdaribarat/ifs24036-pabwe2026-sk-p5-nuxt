# if24036-pabwe2026-sk-p5-nuxt

Aplikasi pencatatan arus kas (cash flow) berbasis **Nuxt 4 (SPA)**, **TypeScript**, **Pinia**, dan **Tailwind CSS v4**, menggunakan [Delcom Open API](https://open-api.delcom.org/docs/1.0/api-cash-flows) sebagai sumber data.

## Menjalankan

```bash
bun install
cp .env.example .env      # VITE_DELCOM_BASEURL dan APP_PORT
bun run dev               # mode pengembangan
bun run build && bun run start   # build + preview (start.mjs membaca APP_PORT dari .env)
bun run test:coverage     # pengujian Vitest dengan threshold coverage 100%
```

## Rute

| Jenis | Path | Halaman |
| --- | --- | --- |
| Publik | `/login` | `LoginPage.vue` (input `#login-email-input`, `#login-password-input`, tombol `#login-submit-button`) |
| Publik | `/register` | `RegisterPage.vue` |
| Terproteksi | `/` | `HomePage.vue` — dashboard arus kas |
| Terproteksi | `/cash-flows/:cashFlowId` | `DetailPage.vue` |
| Terproteksi | `/users` | `UsersPage.vue` |
| Terproteksi | `/profile` | `ProfilePage.vue` |
| Wildcard | `/:pathMatch(.*)*` | `NotFoundPage.vue` |

`/auth`, `/auth/login`, dan `/auth/register` dialihkan ke halaman publik. Rute didefinisikan di `src/routes.ts` dan dipasang melalui `src/router.options.ts`. Halaman terproteksi dibungkus `CashFlowLayout.vue`, yang mengalihkan ke `/login` bila belum ada token.

## Struktur

```
src/
├── helpers/        apiHelper.ts (fetch + Bearer token), toolsHelper.ts (SweetAlert2, formatRupiah, tanggal)
├── hooks/          useInput.ts
├── features/
│   ├── auth/       api, states (useAuthStore), layouts (AuthLayout), pages (Login, Register)
│   ├── users/      api, states (useUsersStore), pages (Users, Profile)
│   ├── cashflows/  api, states (useCashFlowsStore), layouts, components, modals, pages
│   └── common/     pages/NotFoundPage.vue
├── routes.ts, router.options.ts, app.vue
└── setupTests.ts, test-utils.ts
```

## Catatan API

- Ubah password memakai `PUT /users/password` (endpoint `PUT /users/me/password` mengembalikan 404 di server Delcom).
- `PUT /users/me` menerima `name` dan `email`.
