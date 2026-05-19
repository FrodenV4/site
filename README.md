# KURSANT.SHOP

Темный матовый магазин цифровых товаров: коды, файлы, доступы и наборы.
Витрина, дропы и админ-панель разделены на отдельные экраны внутри статического Firebase Hosting.

## Что внутри

- `index.html`, `styles.css`, `app.js` - статический сайт без платного backend.
- Firebase Hosting для деплоя.
- Firebase Auth для покупателей и владельца.
- Cloud Firestore для товаров и заявок.
- Cloud Firestore для небольших цифровых файлов: файлы сохраняются чанками без Firebase Storage.
- `firestore.rules` - правила для публичной витрины, покупателей и закрытой админки.

## Локальный запуск

Открой проект через любой статический сервер:

```bash
python -m http.server 4173
```

Потом зайди на `http://localhost:4173`.

Админ-панель видна только аккаунту `businessmaildropship@gmail.com`.

## Настройка Firebase Spark

1. Создай проект в Firebase Console на бесплатном Spark plan.
2. Включи Authentication -> Email/Password.
3. Создай пользователя-владельца с email `businessmaildropship@gmail.com`.
4. Включи Firestore Database.
5. В Project settings -> Your apps создай Web app и скопируй config в начало `app.js`.
6. В `.firebaserc` замени `YOUR_PROJECT_ID` на id проекта.
7. Покупатели тоже используют Email/Password регистрацию на сайте.

## Деплой

```bash
firebase login
firebase use YOUR_PROJECT_ID
firebase deploy --only firestore:rules,hosting
```

Проект не использует Cloud Functions, Cloud Run, Pub/Sub, Firebase Storage или платные серверные интеграции. Заказ создается как заявка: покупатель входит в аккаунт, оставляет контакт, продавец подтверждает оплату внешним способом и вручную выдает код или файл.

Ограничение Firestore-режима: обложка до 260 KB, файл товара до 4 MB. Для больших архивов лучше использовать внешний бесплатный файловый хостинг и продавать ссылку/код как текстовый товар.

## GitHub

```bash
git init
git add .
git commit -m "Build neon digital goods storefront"
git branch -M main
git remote add origin https://github.com/USER/REPO.git
git push -u origin main
```

Если GitHub CLI уже авторизован:

```bash
gh repo create USER/REPO --public --source=. --remote=origin --push
```
