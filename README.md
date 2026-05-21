# Neon Vault

Темный матовый магазин цифровых товаров: коды, файлы, доступы и наборы. Товары добавляются через админ-панель на сайте, а не через редактирование кода.

## Что внутри

- `index.html`, `styles.css`, `app.js` - статический сайт без платного backend.
- Firebase Hosting для деплоя.
- Firebase Auth для входа продавца и пользовательских аккаунтов.
- Cloud Firestore для товаров и заявок.
- Cloud Firestore для небольших цифровых файлов: файлы сохраняются чанками без Firebase Storage.
- `firestore.rules` и `storage.rules` - правила для публичной витрины и закрытой админки.

## Локальный запуск

Открой проект через любой статический сервер:

```bash
python -m http.server 4173
```

Потом зайди на `http://localhost:4173`.

Пока Firebase config не заполнен, сайт работает в demo-режиме. Пароль админки: `demo`.

## Настройка Firebase Spark

1. Создай проект в Firebase Console на бесплатном Spark plan.
2. Включи Authentication -> Email/Password.
3. Создай пользователя-продавца в Authentication.
4. Для покупателей отдельные аккаунты будут создаваться прямо на сайте через раздел авторизации.
5. Включи Firestore Database.
6. В Project settings -> Your apps создай Web app и скопируй config в начало `app.js`.
7. В `.firebaserc` замени `YOUR_PROJECT_ID` на id проекта.
8. Узнай UID продавца в Authentication и создай документ `admins/{UID}` в Firestore. Внутри можно оставить поле `role: "owner"`.

## Деплой

```bash
firebase login
firebase use YOUR_PROJECT_ID
firebase deploy --only firestore:rules,hosting
```

Проект не использует Cloud Functions, Cloud Run, Pub/Sub, Firebase Storage или платные серверные интеграции. Заказ создается как заявка: покупатель оставляет контакт, продавец подтверждает оплату внешним способом и вручную выдает код или файл.

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
