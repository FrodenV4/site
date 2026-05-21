const firebaseConfig = {
  apiKey: "AIzaSyAqtsnXdb_Q9stTEQh-L3puhSoM79iMVJU",
  authDomain: "codeshop-f5a1c.firebaseapp.com",
  projectId: "codeshop-f5a1c",
  storageBucket: "codeshop-f5a1c.firebasestorage.app",
  messagingSenderId: "418304437516",
  appId: "1:418304437516:web:4f18d243016b1889cbed29",
  measurementId: "G-HP93DJJEKP",
};

const USERNAME_PATTERN = /^[a-z0-9._-]{3,24}$/;
const INTERNAL_AUTH_DOMAIN = "codeshop.user";
const ADMIN_PANEL_TOKEN = "HASH#root";
const THEME_STORAGE_KEY = "codeshop_theme";
const SURFACE_MODE_STORAGE_KEY = "codeshop_surface_mode";
const CURRENCY_STORAGE_KEY = "codeshop_currency";
const USD_EXCHANGE_RATE = 40;
const ADMIN_EMAILS = ["rootadmin@codeshop.user"];
const THEME_PRESETS = {
  green: {
    label: "Matrix",
    accentRgb: "124, 255, 107",
    accent2Rgb: "16, 244, 155",
  },
  cyan: {
    label: "Signal",
    accentRgb: "86, 217, 255",
    accent2Rgb: "0, 255, 208",
  },
  amber: {
    label: "Pulse",
    accentRgb: "255, 196, 94",
    accent2Rgb: "255, 117, 61",
  },
  magenta: {
    label: "Flux",
    accentRgb: "238, 92, 255",
    accent2Rgb: "255, 75, 154",
  },
};

const demoProducts = [
  {
    id: "demo-1",
    title: "Neon Access Key",
    price: 1290,
    category: "Коды",
    type: "Код",
    stock: 18,
    description: "Цифровой ключ доступа с моментальной выдачей после подтверждения заказа.",
    tags: ["key", "access", "instant"],
    coverUrl: "",
    active: true,
    createdAt: Date.now() - 40000,
  },
  {
    id: "demo-2",
    title: "Creator File Pack",
    price: 2490,
    category: "Файлы",
    type: "Файл",
    stock: 7,
    description: "Архив с шаблонами, пресетами и рабочими файлами для быстрой сборки проекта.",
    tags: ["zip", "templates", "preset"],
    coverUrl: "",
    active: true,
    createdAt: Date.now() - 24000,
  },
  {
    id: "demo-3",
    title: "Private Bundle",
    price: 3990,
    category: "Наборы",
    type: "Набор",
    stock: 5,
    description: "Набор цифровых материалов: код, инструкция, файлы и закрытый доступ.",
    tags: ["bundle", "premium", "vault"],
    coverUrl: "",
    active: true,
    createdAt: Date.now() - 12000,
  },
];

const state = {
  firebaseReady: false,
  admin: false,
  adminUnlocked: false,
  user: null,
  view: "store",
  authOpen: false,
  profileOpen: false,
  productOpen: false,
  authMode: "login",
  theme: "green",
  surfaceMode: "dark",
  currency: "UAH",
  category: "Все",
  search: "",
  sort: "new",
  products: [],
  orders: [],
  userOrders: [],
  cart: [],
  pendingCheckout: false,
  pendingProfileUid: null,
  checkoutAutofill: "",
  activeProductId: null,
  activeProductImageIndex: 0,
  productMediaLoading: false,
  productMediaCache: {},
  unsubProducts: null,
  unsubOrders: null,
  unsubUserOrders: null,
};

const services = {};
const els = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  cacheElements();
  applyAccentTheme(readStoredTheme(), { persist: false });
  applySurfaceMode(readStoredSurfaceMode(), { persist: false });
  applyCurrency(readStoredCurrency(), { persist: false });
  renderThemeOptions();
  bindEvents();
  syncAdminNavigation();
  setAuthMode("login");
  syncViewFromHash();
  startAmbientCanvas();
  await initFirebase();
  if (!state.firebaseReady) {
    loadDemoData();
  }
  renderAll();
}

function cacheElements() {
  Object.assign(els, {
    productGrid: document.querySelector("#product-grid"),
    productTemplate: document.querySelector("#product-template"),
    categoryTabs: document.querySelector("#category-tabs"),
    searchInput: document.querySelector("#search-input"),
    sortSelect: document.querySelector("#sort-select"),
    resetFilters: document.querySelector("#reset-filters"),
    catalogCount: document.querySelector("#catalog-count"),
    emptyState: document.querySelector("#empty-state"),
    cartDrawer: document.querySelector("#cart-drawer"),
    openCart: document.querySelector("#open-cart"),
    closeCart: document.querySelector("#close-cart"),
    authDrawer: document.querySelector("#auth-drawer"),
    authPanel: document.querySelector(".auth-panel"),
    closeAuth: document.querySelector("#close-auth"),
    profileDrawer: document.querySelector("#profile-drawer"),
    closeProfile: document.querySelector("#close-profile"),
    productDrawer: document.querySelector("#product-drawer"),
    closeProduct: document.querySelector("#close-product"),
    cartCount: document.querySelector("#cart-count"),
    cartItems: document.querySelector("#cart-items"),
    cartTotal: document.querySelector("#cart-total"),
    checkoutForm: document.querySelector("#checkout-form"),
    checkoutStatus: document.querySelector("#checkout-status"),
    checkoutAuthLink: document.querySelector("#checkout-auth-link"),
    checkoutSubmit: document.querySelector("#checkout-form button[type='submit']"),
    currencyButtons: [...document.querySelectorAll("[data-currency]")],
    surfaceButtons: [...document.querySelectorAll("[data-surface]")],
    adminToken: document.querySelector("#admin-token"),
    adminLogin: document.querySelector("#admin-login"),
    adminLogout: document.querySelector("#admin-logout"),
    adminContent: document.querySelector("#admin-content"),
    productForm: document.querySelector("#product-form"),
    formStatus: document.querySelector("#form-status"),
    ordersList: document.querySelector("#orders-list"),
    ordersCount: document.querySelector("#orders-count"),
    statProducts: document.querySelector("#stat-products"),
    statDigital: document.querySelector("#stat-digital"),
    statOrders: document.querySelector("#stat-orders"),
    modeNote: document.querySelector("#mode-note"),
    themeToggle: document.querySelector("#theme-toggle"),
    pageViews: [...document.querySelectorAll(".page-view")],
    navLinks: [...document.querySelectorAll(".nav-link")],
    routeLinks: [...document.querySelectorAll("[data-route]")],
    adminNavLink: document.querySelector(".nav-admin"),
    openAuth: document.querySelector("#open-auth"),
    authEntryText: document.querySelector("#auth-entry-text"),
    sessionPill: document.querySelector("#session-pill"),
    sessionLabel: document.querySelector("#session-label"),
    openProfile: document.querySelector("#open-profile"),
    sessionLogout: document.querySelector("#session-logout"),
    authTabs: [...document.querySelectorAll(".auth-tab")],
    loginForm: document.querySelector("#login-form"),
    registerForm: document.querySelector("#register-form"),
    authStatus: document.querySelector("#auth-status"),
    profileName: document.querySelector("#profile-name"),
    profileEmail: document.querySelector("#profile-email"),
    profileRoleLabel: document.querySelector("#profile-role-label"),
    profileUsername: document.querySelector("#profile-username"),
    profileAccess: document.querySelector("#profile-access"),
    profileOrdersCount: document.querySelector("#profile-orders-count"),
    profileCartCount: document.querySelector("#profile-cart-count"),
    profileOrdersCaption: document.querySelector("#profile-orders-caption"),
    profileOrdersList: document.querySelector("#profile-orders-list"),
    profileOpenCart: document.querySelector("#profile-open-cart"),
    profileOpenAdmin: document.querySelector("#profile-open-admin"),
    profileThemeCaption: document.querySelector("#profile-theme-caption"),
    themeOptions: document.querySelector("#theme-options"),
    profileSettingsNote: document.querySelector("#profile-settings-note"),
    usernameForm: document.querySelector("#username-form"),
    passwordForm: document.querySelector("#password-form"),
    profileStatus: document.querySelector("#profile-status"),
    productPreviewImage: document.querySelector("#product-preview-image"),
    productPreviewType: document.querySelector("#product-preview-type"),
    productPreviewTitle: document.querySelector("#product-preview-title"),
    productPreviewMeta: document.querySelector("#product-preview-meta"),
    productPreviewDescription: document.querySelector("#product-preview-description"),
    productPreviewTags: document.querySelector("#product-preview-tags"),
    productPreviewPrice: document.querySelector("#product-preview-price"),
    productPreviewStock: document.querySelector("#product-preview-stock"),
    productPreviewThumbs: document.querySelector("#product-preview-thumbs"),
    productPreviewAdd: document.querySelector("#product-preview-add"),
    productPreviewStatus: document.querySelector("#product-preview-status"),
  });
}

function bindEvents() {
  window.addEventListener("hashchange", syncViewFromHash);

  els.routeLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const route = link.dataset.route;
      if (!route) return;
      event.preventDefault();
      navigateToView(route);
    });
  });

  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderCatalog();
  });

  els.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderCatalog();
  });

  els.resetFilters.addEventListener("click", () => {
    state.category = "Все";
    state.search = "";
    state.sort = "new";
    els.searchInput.value = "";
    els.sortSelect.value = "new";
    renderAll();
  });

  els.openCart.addEventListener("click", () => toggleCart(true));
  els.closeCart.addEventListener("click", () => toggleCart(false));
  els.cartDrawer.addEventListener("click", (event) => {
    if (event.target === els.cartDrawer) toggleCart(false);
  });
  els.closeAuth.addEventListener("click", () => toggleAuth(false));
  els.authDrawer.addEventListener("click", (event) => {
    if (event.target === els.authDrawer) toggleAuth(false);
  });
  els.closeProfile.addEventListener("click", () => toggleProfile(false));
  els.profileDrawer.addEventListener("click", (event) => {
    if (event.target === els.profileDrawer) toggleProfile(false);
  });
  els.closeProduct.addEventListener("click", () => toggleProduct(false));
  els.productDrawer.addEventListener("click", (event) => {
    if (event.target === els.productDrawer) toggleProduct(false);
  });

  els.openAuth.addEventListener("click", () => {
    setAuthStatus("");
    toggleProfile(false);
    toggleCart(false);
    toggleAuth(true);
  });

  els.openProfile.addEventListener("click", () => toggleProfile(true));
  els.sessionLogout.addEventListener("click", logoutCurrentSession);
  els.checkoutAuthLink.addEventListener("click", () => {
    state.pendingCheckout = true;
    toggleProfile(false);
    toggleCart(false);
    setAuthStatus("Войди или создай аккаунт, чтобы оформить заявку.");
    toggleAuth(true);
  });
  els.profileOpenCart.addEventListener("click", () => {
    toggleProfile(false);
    toggleCart(true);
  });
  els.profileOpenAdmin.addEventListener("click", () => {
    toggleProfile(false);
    navigateToView("admin");
  });

  els.authTabs.forEach((button) => {
    button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
  });

  els.currencyButtons.forEach((button) => {
    button.addEventListener("click", () => applyCurrency(button.dataset.currency));
  });
  els.surfaceButtons.forEach((button) => {
    button.addEventListener("click", () => applySurfaceMode(button.dataset.surface));
  });
  els.themeOptions.addEventListener("click", handleThemeOptionClick);
  els.loginForm.addEventListener("submit", userLogin);
  els.registerForm.addEventListener("submit", userRegister);
  els.usernameForm.addEventListener("submit", updateUsernameSettings);
  els.passwordForm.addEventListener("submit", updatePasswordSettings);
  els.checkoutForm.addEventListener("submit", submitOrder);
  els.adminLogin.addEventListener("click", adminLogin);
  els.adminLogout.addEventListener("click", adminLogout);
  els.productForm.addEventListener("submit", addProduct);
  els.productPreviewThumbs.addEventListener("click", handleProductThumbClick);
  els.productPreviewAdd.addEventListener("click", () => {
    if (state.activeProductId) addToCart(state.activeProductId);
  });
  els.themeToggle.addEventListener("click", () => {
    applySurfaceMode(state.surfaceMode === "dark" ? "light" : "dark");
  });
}

function syncViewFromHash() {
  const hashToken = getHashToken(window.location.hash);
  const scrollTarget = hashToken === "catalog" ? "catalog" : null;
  setView(getViewFromHash(window.location.hash), { scrollTarget });
}

function getViewFromHash(hash) {
  const route = getHashToken(hash);

  if (route === "deals") return "deals";
  if (route === "admin") return "admin";
  return "store";
}

function getHashToken(hash) {
  return String(hash || "")
    .replace(/^#/, "")
    .trim()
    .toLowerCase();
}

function navigateToView(view) {
  const nextHash = `#${view}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
  setView(view);
}

function setView(view, options = {}) {
  state.view = view;
  document.body.dataset.view = view;

  els.pageViews.forEach((page) => {
    const active = page.dataset.view === view;
    page.hidden = !active;
    page.classList.toggle("is-active", active);
  });

  els.navLinks.forEach((link) => {
    const active = link.dataset.viewLink === view;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  toggleCart(false);
  toggleAuth(false);
  toggleProfile(false);
  toggleProduct(false);

  if (options.scrollTarget === "catalog" && view === "store") {
    requestAnimationFrame(() => {
      document.querySelector("#catalog")?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    return;
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function setAuthMode(mode) {
  state.authMode = mode === "register" ? "register" : "login";
  const isRegister = state.authMode === "register";
  els.loginForm.hidden = isRegister;
  els.registerForm.hidden = !isRegister;
  els.authTabs.forEach((button) => {
    const active = button.dataset.authMode === state.authMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

function readStoredTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return THEME_PRESETS[stored] ? stored : "green";
}

function readStoredSurfaceMode() {
  const stored = localStorage.getItem(SURFACE_MODE_STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

function readStoredCurrency() {
  const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
  return stored === "USD" ? "USD" : "UAH";
}

function applyAccentTheme(themeName, options = {}) {
  const nextTheme = THEME_PRESETS[themeName] ? themeName : "green";
  const preset = THEME_PRESETS[nextTheme];
  state.theme = nextTheme;

  document.documentElement.style.setProperty("--accent-rgb", preset.accentRgb);
  document.documentElement.style.setProperty("--accent-2-rgb", preset.accent2Rgb);

  if (options.persist !== false) {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }

  renderThemeOptions();
  if (els.profileThemeCaption) {
    els.profileThemeCaption.textContent = `${preset.label.toLowerCase()} accent`;
  }
}

function applySurfaceMode(mode, options = {}) {
  const nextMode = mode === "light" ? "light" : "dark";
  state.surfaceMode = nextMode;
  document.body.dataset.surface = nextMode;

  if (options.persist !== false) {
    localStorage.setItem(SURFACE_MODE_STORAGE_KEY, nextMode);
  }

  renderSurfaceControls();
}

function applyCurrency(currency, options = {}) {
  const nextCurrency = currency === "USD" ? "USD" : "UAH";
  state.currency = nextCurrency;

  if (options.persist !== false) {
    localStorage.setItem(CURRENCY_STORAGE_KEY, nextCurrency);
  }

  renderCurrencyControls();
  renderCatalog();
  renderCart();
  renderProfile();
  renderOrders();
  renderProductModal();
}

function renderThemeOptions() {
  if (!els.themeOptions) return;

  els.themeOptions.replaceChildren();

  Object.entries(THEME_PRESETS).forEach(([themeName, preset]) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `theme-chip${state.theme === themeName ? " active" : ""}`;
    chip.dataset.theme = themeName;
    chip.innerHTML = `
      <div class="theme-chip-swatch">
        <i style="background: rgb(${preset.accentRgb});"></i>
        <b style="background: rgb(${preset.accent2Rgb});"></b>
      </div>
      <strong>${escapeHtml(preset.label)}</strong>
      <span>${escapeHtml(themeName)}</span>
    `;
    els.themeOptions.append(chip);
  });
}

function renderSurfaceControls() {
  els.surfaceButtons.forEach((button) => {
    const active = button.dataset.surface === state.surfaceMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const icon = state.surfaceMode === "dark" ? "sun-medium" : "moon-star";
  const label = state.surfaceMode === "dark" ? "Включить светлую тему" : "Вернуть темную тему";
  els.themeToggle.innerHTML = `<i data-lucide="${icon}"></i>`;
  els.themeToggle.setAttribute("aria-label", label);
  els.themeToggle.setAttribute("title", label);
  refreshIcons();
}

function renderCurrencyControls() {
  els.currencyButtons.forEach((button) => {
    const active = button.dataset.currency === state.currency;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

async function handleThemeOptionClick(event) {
  const button = event.target.closest("[data-theme]");
  if (!button) return;

  const nextTheme = button.dataset.theme;
  applyAccentTheme(nextTheme);

  if (!state.firebaseReady || !state.user || state.user.isAdmin) {
    renderProfile();
    return;
  }

  try {
    await persistUserProfile({
      theme: nextTheme,
    });
    setProfileStatus("Тема обновлена.");
  } catch (error) {
    console.error(error);
    setProfileStatus("Не удалось сохранить тему в профиле.", true);
  }
}

function syncAdminNavigation() {
  els.adminNavLink.hidden = !state.admin;
}

function isAdminAccount(firebaseUser, adminDocExists = false) {
  const email = String(firebaseUser?.email || "").trim().toLowerCase();
  return adminDocExists || ADMIN_EMAILS.includes(email);
}

function getAdminDisplayName(firebaseUser) {
  const email = String(firebaseUser?.email || "").trim().toLowerCase();
  if (email === "rootadmin@codeshop.user") return "rootAdmin";
  return firebaseUser?.email || "admin";
}

async function initFirebase() {
  if (!isFirebaseConfigured()) {
    state.firebaseReady = false;
    return;
  }

  try {
    const appMod = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
    const authMod = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");
    const dbMod = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

    services.app = appMod.initializeApp(firebaseConfig);
    services.auth = authMod.getAuth(services.app);
    services.db = dbMod.getFirestore(services.app);
    services.authApi = authMod;
    services.dbApi = dbMod;
    state.firebaseReady = true;

    authMod.onAuthStateChanged(services.auth, handleAuthState);
    listenProducts();
  } catch (error) {
    console.error(error);
    state.firebaseReady = false;
  }
}

function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every((value) => value && !String(value).includes("YOUR_"));
}

async function handleAuthState(firebaseUser) {
  if (!state.firebaseReady || !firebaseUser) {
    state.pendingProfileUid = null;
    state.unsubUserOrders?.();
    state.unsubUserOrders = null;
    state.userOrders = [];
    state.adminUnlocked = false;
    setAdmin(false);
    setSessionUser(null);
    return;
  }

  const { doc, getDoc } = services.dbApi;
  let userSnap = await getDoc(doc(services.db, "users", firebaseUser.uid));
  const adminSnap = await getDoc(doc(services.db, "admins", firebaseUser.uid));
  const adminAccess = isAdminAccount(firebaseUser, adminSnap.exists());

  if (!userSnap.exists() && state.pendingProfileUid === firebaseUser.uid) {
    userSnap = await waitForUserProfile(firebaseUser.uid);
  }

  if (userSnap.exists()) {
    const profile = userSnap.data();
    state.pendingProfileUid = null;
    setAdmin(adminAccess);
    applyAccentTheme(profile.theme || readStoredTheme());
    setSessionUser({
      uid: firebaseUser.uid,
      username: profile.username || profile.usernameKey || "user",
      usernameKey: profile.usernameKey || profile.username || "user",
      email: profile.email || "",
      theme: profile.theme || state.theme,
      isAdmin: adminAccess,
    });
    listenUserOrders(firebaseUser.uid);
    listenOrders();
    handlePostAuthSuccess();
    return;
  }

  if (adminAccess) {
    state.pendingProfileUid = null;
    setAdmin(true);
    setSessionUser({
      uid: firebaseUser.uid,
      username: getAdminDisplayName(firebaseUser),
      usernameKey: normalizeUsername(getAdminDisplayName(firebaseUser)).key,
      email: firebaseUser.email || "",
      theme: readStoredTheme(),
      isAdmin: true,
    });
    state.unsubUserOrders?.();
    state.unsubUserOrders = null;
    state.userOrders = [];
    listenOrders();
    handlePostAuthSuccess();
    return;
  }

  await services.authApi.signOut(services.auth);
  state.adminUnlocked = false;
  setAdmin(false);
  setSessionUser(null);
  setAuthStatus("Аккаунт не настроен. Повтори вход или регистрацию.", true);
}

async function waitForUserProfile(uid) {
  const { doc, getDoc } = services.dbApi;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const snapshot = await getDoc(doc(services.db, "users", uid));
    if (snapshot.exists()) return snapshot;
    await wait(200);
  }
  return { exists: () => false };
}

function listenProducts() {
  const { collection, onSnapshot, orderBy, query } = services.dbApi;
  const productsQuery = query(collection(services.db, "products"), orderBy("createdAt", "desc"));
  state.unsubProducts?.();
  state.unsubProducts = onSnapshot(productsQuery, (snapshot) => {
    state.products = snapshot.docs.map((docSnap) => normalizeProduct({ id: docSnap.id, ...docSnap.data() }));
    renderAll();
  });
}

function listenOrders() {
  if (!state.admin || !state.firebaseReady) {
    state.unsubOrders?.();
    state.unsubOrders = null;
    state.orders = [];
    return;
  }
  const { collection, onSnapshot, orderBy, query } = services.dbApi;
  const ordersQuery = query(collection(services.db, "orders"), orderBy("createdAt", "desc"));
  state.unsubOrders?.();
  state.unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
    state.orders = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    renderOrders();
    renderStats();
  });
}

function listenUserOrders(uid) {
  if (!state.firebaseReady || !uid || state.admin) {
    state.unsubUserOrders?.();
    state.unsubUserOrders = null;
    state.userOrders = [];
    return;
  }

  const { collection, onSnapshot, query, where } = services.dbApi;
  const userOrdersQuery = query(collection(services.db, "orders"), where("userId", "==", uid));
  state.unsubUserOrders?.();
  state.unsubUserOrders = onSnapshot(userOrdersQuery, (snapshot) => {
    state.userOrders = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
    renderProfile();
  });
}

function loadDemoData() {
  state.products = readJson("nv_products", demoProducts).map(normalizeProduct);
  state.orders = readJson("nv_orders", []);
  els.modeNote.textContent = "Demo: пароль админки demo. Пользовательская регистрация и оформление заявок доступны после подключения Firebase Auth и Firestore.";
  setAuthStatus("В demo-режиме регистрация отключена. Подключи Firebase, чтобы включить пользовательские аккаунты.");
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function renderAll() {
  renderCategories();
  renderCatalog();
  renderCart();
  renderOrders();
  renderStats();
  renderSessionControls();
  renderProfile();
  renderProductModal();
  renderCurrencyControls();
  renderSurfaceControls();
  syncCheckoutContact();
  renderCheckoutAccess();
  refreshIcons();
}

function renderCategories() {
  const categories = ["Все", ...new Set(state.products.filter((item) => item.active !== false).map((item) => item.category || "Другое"))];
  els.categoryTabs.replaceChildren();
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.className = `chip${state.category === category ? " active" : ""}`;
    button.type = "button";
    button.textContent = category;
    button.addEventListener("click", () => {
      state.category = category;
      renderAll();
    });
    els.categoryTabs.append(button);
  });
}

function renderCatalog() {
  const products = getFilteredProducts();
  els.productGrid.replaceChildren();
  els.catalogCount.textContent = `${products.length} ${plural(products.length, ["позиция", "позиции", "позиций"])}`;
  els.emptyState.hidden = products.length > 0;

  products.forEach((product) => {
    const card = els.productTemplate.content.firstElementChild.cloneNode(true);
    const media = card.querySelector(".product-media");
    const img = card.querySelector("img");
    const title = card.querySelector("h2");
    const description = card.querySelector("p");
    const badge = card.querySelector(".badge");
    const tags = card.querySelector(".tag-list");
    const price = card.querySelector("strong");
    const openButton = card.querySelector("[data-product-open]");
    const addButton = card.querySelector("[data-add-cart]");

    img.src = product.coverUrl || "";
    img.alt = product.title;
    title.textContent = product.title;
    description.textContent = product.description;
    badge.textContent = product.type || product.category || "Digital";
    price.textContent = formatMoney(product.price);
    media.addEventListener("click", () => openProduct(product.id));
    title.addEventListener("click", () => openProduct(product.id));
    title.style.cursor = "pointer";
    openButton.addEventListener("click", () => openProduct(product.id));
    addButton.addEventListener("click", () => addToCart(product.id));

    (product.tags || []).slice(0, 4).forEach((tag) => {
      const tagEl = document.createElement("span");
      tagEl.textContent = `#${tag}`;
      tags.append(tagEl);
    });

    els.productGrid.append(card);
  });

  refreshIcons();
}

function getFilteredProducts() {
  const search = state.search;
  return state.products
    .filter((product) => product.active !== false)
    .filter((product) => state.category === "Все" || product.category === state.category)
    .filter((product) => {
      if (!search) return true;
      return [product.title, product.description, product.category, product.type, ...(product.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(search);
    })
    .sort((a, b) => {
      if (state.sort === "priceLow") return a.price - b.price;
      if (state.sort === "priceHigh") return b.price - a.price;
      if (state.sort === "name") return a.title.localeCompare(b.title, "ru");
      return getTime(b.createdAt) - getTime(a.createdAt);
    });
}

function openProduct(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  state.activeProductId = productId;
  state.activeProductImageIndex = 0;
  state.productMediaLoading = true;
  renderProductModal();
  toggleProduct(true);

  loadProductMedia(product).catch((error) => {
    console.error(error);
    state.productMediaLoading = false;
    els.productPreviewStatus.textContent = "Не удалось загрузить фото примеров.";
  });
}

async function loadProductMedia(product) {
  const cacheKey = product.id;
  if (state.productMediaCache[cacheKey]) {
    state.productMediaLoading = false;
    renderProductModal();
    return;
  }

  const media = [];
  if (product.coverUrl) media.push(product.coverUrl);
  if (Array.isArray(product.previewUrls)) {
    media.push(...product.previewUrls.filter(Boolean));
  }

  if (state.firebaseReady && product.previewCount) {
    const { collection, getDocs, orderBy, query } = services.dbApi;
    const previewsSnap = await getDocs(query(collection(services.db, "products", product.id, "previews"), orderBy("index", "asc")));
    previewsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data?.url) media.push(data.url);
    });
  }

  state.productMediaCache[cacheKey] = [...new Set(media.filter(Boolean))];
  state.productMediaLoading = false;
  renderProductModal();
}

function handleProductThumbClick(event) {
  const button = event.target.closest("[data-image-index]");
  if (!button) return;
  state.activeProductImageIndex = Number(button.dataset.imageIndex || 0);
  renderProductModal();
}

function renderProductModal() {
  const product = state.products.find((item) => item.id === state.activeProductId);
  if (!product) return;

  const images = state.productMediaCache[product.id] || (product.coverUrl ? [product.coverUrl] : []);
  const nextIndex = Math.min(state.activeProductImageIndex, Math.max(images.length - 1, 0));
  const selectedImage = images[nextIndex] || "";
  state.activeProductImageIndex = nextIndex;

  els.productPreviewImage.src = selectedImage;
  els.productPreviewImage.alt = product.title;
  els.productPreviewType.textContent = product.type || product.category || "Digital";
  els.productPreviewTitle.textContent = product.title;
  els.productPreviewMeta.textContent = [product.category || "Каталог", product.fileName || "Цифровой товар"]
    .filter(Boolean)
    .join(" / ");
  els.productPreviewDescription.textContent = product.description || "Описание появится после загрузки товара.";
  els.productPreviewPrice.textContent = formatMoney(product.price);
  els.productPreviewStock.textContent = product.stock > 0 ? `В наличии: ${product.stock}` : "Под заказ";
  els.productPreviewStatus.textContent = state.productMediaLoading
    ? "Загружаю фото примеров..."
    : images.length > 1
      ? `Доступно ${images.length} изображения`
      : "Пока доступна только обложка товара.";

  els.productPreviewTags.replaceChildren();
  (product.tags || []).forEach((tag) => {
    const tagEl = document.createElement("span");
    tagEl.textContent = `#${tag}`;
    els.productPreviewTags.append(tagEl);
  });

  els.productPreviewThumbs.replaceChildren();
  images.forEach((image, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `product-thumb${index === state.activeProductImageIndex ? " active" : ""}`;
    button.dataset.imageIndex = String(index);
    button.innerHTML = `<img src="${image}" alt="${escapeHtml(`${product.title} ${index + 1}`)}" />`;
    els.productPreviewThumbs.append(button);
  });

  refreshIcons();
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  const existing = state.cart.find((item) => item.id === productId);
  if (existing) existing.qty += 1;
  else state.cart.push({ id: productId, qty: 1 });
  renderCart();
  toggleCart(true);
}

function renderCart() {
  els.cartItems.replaceChildren();
  let total = 0;
  let count = 0;

  state.cart.forEach((line) => {
    const product = state.products.find((item) => item.id === line.id);
    if (!product) return;
    total += product.price * line.qty;
    count += line.qty;

    const row = document.createElement("article");
    row.className = "cart-line";
    row.innerHTML = `
      <div>
        <h3>${escapeHtml(product.title)}</h3>
        <p>${line.qty} x ${formatMoney(product.price)}</p>
      </div>
      <button class="icon-button" type="button" aria-label="Удалить" title="Удалить">
        <i data-lucide="trash-2"></i>
      </button>
    `;
    row.querySelector("button").addEventListener("click", () => {
      state.cart = state.cart.filter((item) => item.id !== line.id);
      renderCart();
    });
    els.cartItems.append(row);
  });

  if (!state.cart.length) {
    const empty = document.createElement("p");
    empty.className = "filter-note";
    empty.textContent = "Корзина пуста.";
    els.cartItems.append(empty);
  }

  els.cartTotal.textContent = formatMoney(total);
  els.cartCount.textContent = count;
  renderProfile();
  renderCheckoutAccess();
  refreshIcons();
}

function renderSessionControls() {
  const loggedIn = Boolean(state.user);
  els.openAuth.hidden = loggedIn;
  els.sessionPill.hidden = !loggedIn;
  els.authEntryText.textContent = state.authOpen ? "Авторизация" : "Вход";
  if (loggedIn) {
    els.sessionLabel.textContent = state.user.username || state.user.email || "user";
  }
}

function renderProfile() {
  const user = state.user;
  const isAdmin = Boolean(user?.isAdmin || state.admin);
  const orders = isAdmin ? state.orders : state.userOrders;
  const recentOrders = orders.slice(0, 4);
  const guest = !user;

  els.profileName.textContent = user?.username || "Гость";
  els.profileEmail.textContent = user?.email || "Войди в аккаунт, чтобы видеть данные профиля и свои заявки.";
  els.profileRoleLabel.textContent = isAdmin ? "admin access" : "buyer profile";
  els.profileUsername.textContent = user?.username || "-";
  els.profileAccess.textContent = isAdmin ? "Администратор" : "Покупатель";
  els.profileOrdersCount.textContent = String(orders.length);
  els.profileCartCount.textContent = String(state.cart.reduce((sum, item) => sum + item.qty, 0));
  els.profileOrdersCaption.textContent = `${orders.length} ${plural(orders.length, ["запись", "записи", "записей"])}`;
  els.profileOpenAdmin.hidden = !isAdmin;
  els.profileThemeCaption.textContent = `${(THEME_PRESETS[state.theme]?.label || "Accent").toLowerCase()} accent`;
  renderThemeOptions();
  els.usernameForm.hidden = guest || isAdmin;
  els.passwordForm.hidden = guest;

  if (guest) {
    els.profileSettingsNote.textContent = "Войди в аккаунт, чтобы менять логин и пароль. Тему можно переключать уже сейчас.";
  } else if (isAdmin) {
    els.profileSettingsNote.textContent = "Панель продавца открывается по статичному токену HASH#root. Здесь можно менять пароль и тему интерфейса.";
  } else {
    els.profileSettingsNote.textContent = "После смены логина вход в аккаунт будет выполняться уже по новому логину.";
  }

  const usernameInput = els.usernameForm.elements.username;
  if (usernameInput && !usernameInput.matches(":focus")) {
    usernameInput.placeholder = user?.username || "neo.user";
  }

  els.profileOrdersList.replaceChildren();
  if (!recentOrders.length) {
    const empty = document.createElement("p");
    empty.className = "filter-note";
    empty.textContent = user ? "Заявок пока нет." : "Сначала войди в аккаунт, затем здесь появится история покупок.";
    els.profileOrdersList.append(empty);
    return;
  }

  recentOrders.forEach((order) => {
    const card = document.createElement("article");
    const items = (order.items || []).map((item) => `${item.title} x${item.qty}`).join(", ");
    card.innerHTML = `
      <h4>${escapeHtml(order.status === "delivered" ? "Заявка выдана" : "Новая заявка")}</h4>
      <p>${escapeHtml(items || "Без товаров")}</p>
      <p>${formatMoney(order.total || 0)}</p>
    `;
    els.profileOrdersList.append(card);
  });
}

function renderCheckoutAccess() {
  const guest = !state.user;
  const hasItems = state.cart.length > 0;
  els.checkoutAuthLink.hidden = !guest || !hasItems;
  els.checkoutAuthLink.disabled = !state.firebaseReady;
  els.checkoutSubmit.disabled = !hasItems || guest;
}

function syncCheckoutContact() {
  const input = els.checkoutForm.elements.contact;
  if (!input) return;

  if (state.checkoutAutofill && input.value === state.checkoutAutofill) {
    input.value = "";
  }

  const nextAutofill = state.user?.email || "";
  if (nextAutofill && !input.value) {
    input.value = nextAutofill;
  }

  state.checkoutAutofill = nextAutofill;
}

function toggleCart(open) {
  if (open) {
    toggleAuth(false);
    toggleProfile(false);
    toggleProduct(false);
  }
  els.cartDrawer.classList.toggle("open", open);
  els.cartDrawer.setAttribute("aria-hidden", String(!open));
}

function toggleAuth(open) {
  state.authOpen = open;
  if (open) {
    toggleCart(false);
    toggleProfile(false);
    toggleProduct(false);
  }
  els.authDrawer.classList.toggle("open", open);
  els.authDrawer.setAttribute("aria-hidden", String(!open));
  els.openAuth.classList.toggle("active", open && !state.user);
  renderSessionControls();
}

function toggleProfile(open) {
  state.profileOpen = open;
  if (open) {
    toggleCart(false);
    toggleAuth(false);
    toggleProduct(false);
  }
  els.profileDrawer.classList.toggle("open", open);
  els.profileDrawer.setAttribute("aria-hidden", String(!open));
}

function toggleProduct(open) {
  state.productOpen = open;
  if (open) {
    toggleCart(false);
    toggleAuth(false);
    toggleProfile(false);
  }
  if (!open) {
    state.productMediaLoading = false;
  }
  els.productDrawer.classList.toggle("open", open);
  els.productDrawer.setAttribute("aria-hidden", String(!open));
}

async function submitOrder(event) {
  event.preventDefault();
  if (!state.cart.length) {
    setCheckoutStatus("Добавь товар в корзину.", true);
    return;
  }

  if (!state.user) {
    state.pendingCheckout = true;
    setCheckoutStatus("Войди в аккаунт, чтобы оформить заявку.", true);
    els.checkoutAuthLink.hidden = false;
    return;
  }

  const formData = new FormData(els.checkoutForm);
  const orderUsername = state.user.usernameKey || normalizeUsername(state.user.username).key;
  const orderItems = state.cart
    .map((line) => {
      const product = state.products.find((item) => item.id === line.id);
      if (!product) return null;
      return {
        productId: product.id,
        title: product.title,
        price: product.price,
        qty: line.qty,
      };
    })
    .filter(Boolean);

  const order = {
    userId: state.user.uid,
    username: orderUsername,
    email: state.user.email,
    contact: String(formData.get("contact")).trim(),
    comment: String(formData.get("comment") || "").trim(),
    items: orderItems,
    total: orderItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    status: "new",
  };

  try {
    if (state.firebaseReady) {
      const { addDoc, collection, serverTimestamp } = services.dbApi;
      await addDoc(collection(services.db, "orders"), { ...order, createdAt: serverTimestamp() });
    } else {
      state.orders.unshift({ ...order, id: crypto.randomUUID(), createdAt: Date.now() });
      writeJson("nv_orders", state.orders);
    }

    state.cart = [];
    els.checkoutForm.reset();
    syncCheckoutContact();
    renderAll();
    setCheckoutStatus("Заявка создана. Продавец свяжется по указанному контакту.");
  } catch (error) {
    console.error(error);
    setCheckoutStatus(mapCheckoutError(error), true);
  }
}

async function userLogin(event) {
  event.preventDefault();
  if (!state.firebaseReady) {
    setAuthStatus("Firebase Auth пока не активен для этой сборки.", true);
    return;
  }

  const formData = new FormData(els.loginForm);
  const normalized = normalizeUsername(formData.get("username"));
  const password = String(formData.get("password") || "").trim();

  if (!validateUsername(normalized.key)) {
    setAuthStatus("Логин должен быть 3-24 символа и содержать только a-z, 0-9, точку, дефис или нижнее подчеркивание.", true);
    return;
  }

  if (password.length < 6) {
    setAuthStatus("Пароль должен быть не короче 6 символов.", true);
    return;
  }

  try {
    await services.authApi.signInWithEmailAndPassword(services.auth, buildInternalEmail(normalized.key), password);
    setAuthStatus("Вход выполнен.");
    els.loginForm.reset();
  } catch (error) {
    console.error(error);
    setAuthStatus(mapAuthError(error, "Не удалось войти. Проверь логин и пароль."), true);
  }
}

async function userRegister(event) {
  event.preventDefault();
  if (!state.firebaseReady) {
    setAuthStatus("Firebase Auth пока не активен для этой сборки.", true);
    return;
  }

  const formData = new FormData(els.registerForm);
  const normalized = normalizeUsername(formData.get("username"));
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const confirmPassword = String(formData.get("confirmPassword") || "").trim();

  if (!validateUsername(normalized.key)) {
    setAuthStatus("Логин должен быть 3-24 символа и содержать только a-z, 0-9, точку, дефис или нижнее подчеркивание.", true);
    return;
  }

  if (!isValidEmail(email)) {
    setAuthStatus("Укажи корректную почту.", true);
    return;
  }

  if (password.length < 6) {
    setAuthStatus("Пароль должен быть не короче 6 символов.", true);
    return;
  }

  if (password !== confirmPassword) {
    setAuthStatus("Пароли не совпадают.", true);
    return;
  }

  try {
    const credential = await services.authApi.createUserWithEmailAndPassword(
      services.auth,
      buildInternalEmail(normalized.key),
      password,
    );

    state.pendingProfileUid = credential.user.uid;
    const { doc, serverTimestamp, setDoc } = services.dbApi;
    await setDoc(doc(services.db, "users", credential.user.uid), {
      uid: credential.user.uid,
      username: normalized.key,
      usernameKey: normalized.key,
      email,
      role: "user",
      theme: state.theme,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    state.pendingProfileUid = null;
    setAuthStatus("Аккаунт создан. Вход выполнен.");
    els.registerForm.reset();
  } catch (error) {
    console.error(error);
    setAuthStatus(mapAuthError(error, "Не удалось создать аккаунт. Попробуй позже."), true);
  }
}

async function updateUsernameSettings(event) {
  event.preventDefault();

  if (!state.firebaseReady || !state.user || state.user.isAdmin) {
    setProfileStatus("Смена логина доступна только для обычного пользовательского аккаунта.", true);
    return;
  }

  const currentUser = services.auth.currentUser;
  if (!currentUser?.email) {
    setProfileStatus("Сессия устарела. Войди заново и повтори.", true);
    return;
  }

  const formData = new FormData(els.usernameForm);
  const normalized = normalizeUsername(formData.get("username"));
  const currentPassword = String(formData.get("currentPassword") || "").trim();

  if (!validateUsername(normalized.key)) {
    setProfileStatus("Новый логин должен быть 3-24 символа и содержать только a-z, 0-9, точку, дефис или нижнее подчеркивание.", true);
    return;
  }

  if (normalized.key === state.user.username) {
    setProfileStatus("Этот логин уже установлен.", true);
    return;
  }

  if (currentPassword.length < 6) {
    setProfileStatus("Подтверди текущий пароль.", true);
    return;
  }

  try {
    const credential = services.authApi.EmailAuthProvider.credential(currentUser.email, currentPassword);
    await services.authApi.reauthenticateWithCredential(currentUser, credential);
    await services.authApi.updateEmail(currentUser, buildInternalEmail(normalized.key));
    await persistUserProfile({
      username: normalized.key,
      usernameKey: normalized.key,
    });
    els.usernameForm.reset();
    setProfileStatus("Логин обновлен. Теперь вход выполняется по новому логину.");
  } catch (error) {
    console.error(error);
    setProfileStatus(mapAuthError(error, "Не удалось обновить логин."), true);
  }
}

async function updatePasswordSettings(event) {
  event.preventDefault();

  if (!state.firebaseReady || !state.user) {
    setProfileStatus("Сначала войди в аккаунт.", true);
    return;
  }

  const currentUser = services.auth.currentUser;
  if (!currentUser?.email) {
    setProfileStatus("Сессия устарела. Войди заново и повтори.", true);
    return;
  }

  const formData = new FormData(els.passwordForm);
  const currentPassword = String(formData.get("currentPassword") || "").trim();
  const newPassword = String(formData.get("newPassword") || "").trim();
  const confirmPassword = String(formData.get("confirmPassword") || "").trim();

  if (currentPassword.length < 6) {
    setProfileStatus("Укажи текущий пароль.", true);
    return;
  }

  if (newPassword.length < 6) {
    setProfileStatus("Новый пароль должен быть не короче 6 символов.", true);
    return;
  }

  if (newPassword !== confirmPassword) {
    setProfileStatus("Новые пароли не совпадают.", true);
    return;
  }

  try {
    const credential = services.authApi.EmailAuthProvider.credential(currentUser.email, currentPassword);
    await services.authApi.reauthenticateWithCredential(currentUser, credential);
    await services.authApi.updatePassword(currentUser, newPassword);
    els.passwordForm.reset();
    setProfileStatus("Пароль обновлен.");
  } catch (error) {
    console.error(error);
    setProfileStatus(mapAuthError(error, "Не удалось обновить пароль."), true);
  }
}

async function adminLogin() {
  const token = els.adminToken.value.trim();

  if (!state.user?.isAdmin) {
    setFormStatus("Сначала войди в аккаунт rootAdmin.", true);
    return;
  }

  if (state.firebaseReady) {
    if (token !== ADMIN_PANEL_TOKEN) {
      setFormStatus("Неверный токен доступа.", true);
      return;
    }
    state.adminUnlocked = true;
    syncAdminAccessState();
    setFormStatus("Панель продавца активирована.");
    return;
  }

  if (token === ADMIN_PANEL_TOKEN) {
    setAdmin(true);
    state.adminUnlocked = true;
    syncAdminAccessState();
    setSessionUser({
      uid: "demo-admin",
      username: "admin",
      email: "demo@codeshop.user",
      isAdmin: true,
    });
    setFormStatus("Demo-админка активна.");
  } else {
    setFormStatus("Неверный токен доступа.", true);
  }
}

async function adminLogout() {
  await logoutCurrentSession();
}

async function logoutCurrentSession() {
  if (state.firebaseReady) {
    await services.authApi.signOut(services.auth);
  }
  state.pendingProfileUid = null;
  state.pendingCheckout = false;
  state.adminUnlocked = false;
  state.unsubUserOrders?.();
  state.unsubUserOrders = null;
  state.userOrders = [];
  toggleAuth(false);
  toggleProfile(false);
  setAdmin(false);
  setSessionUser(null);
  setCheckoutStatus("");
  setAuthStatus("");
  setProfileStatus("");
}

function setAdmin(value) {
  state.admin = value;
  syncAdminAccessState();
  if (!value) {
    state.unsubOrders?.();
    state.unsubOrders = null;
    state.orders = [];
    state.adminUnlocked = false;
  }
  if (value) {
    state.unsubUserOrders?.();
    state.unsubUserOrders = null;
    state.userOrders = [];
  }
  syncAdminNavigation();
  renderOrders();
  renderSessionControls();
  renderProfile();
}

function syncAdminAccessState() {
  const canOpen = Boolean(state.admin);
  const unlocked = canOpen && state.adminUnlocked;
  els.adminContent.hidden = !unlocked;
  els.adminLogout.hidden = !unlocked;
  els.adminLogin.hidden = unlocked;
  els.adminToken.hidden = unlocked;
}

function setSessionUser(user) {
  state.user = user;
  renderSessionControls();
  renderProfile();
  syncCheckoutContact();
  renderCheckoutAccess();
}

async function persistUserProfile(partial) {
  if (!state.firebaseReady || !state.user || state.user.isAdmin) return;

  const { doc, serverTimestamp, updateDoc } = services.dbApi;
  await updateDoc(doc(services.db, "users", state.user.uid), {
    ...partial,
    updatedAt: serverTimestamp(),
  });

  state.user = {
    ...state.user,
    ...partial,
  };
  renderSessionControls();
  renderProfile();
}

function handlePostAuthSuccess() {
  if (state.pendingCheckout) {
    state.pendingCheckout = false;
    toggleAuth(false);
    navigateToView("store");
    toggleCart(true);
    setCheckoutStatus("Аккаунт подключен. Теперь можно оформить заявку.");
    return;
  }

  toggleAuth(false);
}

async function addProduct(event) {
  event.preventDefault();
  if (!state.admin || !state.adminUnlocked) return;
  setFormStatus("Добавляю товар...");

  const formData = new FormData(els.productForm);
  const file = formData.get("file");
  const cover = formData.get("cover");
  const exampleFiles = formData
    .getAll("examples")
    .filter((entry) => entry instanceof File && entry.size);
  const title = String(formData.get("title")).trim();
  const price = Number(formData.get("price"));

  const product = {
    title,
    price,
    category: String(formData.get("category")).trim(),
    type: String(formData.get("type")).trim(),
    stock: Number(formData.get("stock") || 0),
    description: String(formData.get("description")).trim(),
    tags: String(formData.get("tags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    active: true,
    fileName: file?.name || "",
    previewCount: exampleFiles.length,
  };

  try {
    if (state.firebaseReady) {
      await addFirebaseProduct(product, cover, file, exampleFiles);
    } else {
      await addDemoProduct(product, cover, file, exampleFiles);
    }

    els.productForm.reset();
    setFormStatus("Товар добавлен.");
    renderAll();
  } catch (error) {
    console.error(error);
    setFormStatus(mapProductError(error), true);
  }
}

async function addFirebaseProduct(product, cover, file, exampleFiles = []) {
  const { collection, doc, serverTimestamp, setDoc } = services.dbApi;
  const productRef = doc(collection(services.db, "products"));
  const productId = productRef.id;
  let coverUrl = "";
  let fileStored = false;

  if (cover && cover.size) {
    if (cover.size > 600 * 1024) {
      throw new Error("COVER_TOO_LARGE");
    }
    coverUrl = await fileToDataUrl(cover);
  }

  if (file && file.size) {
    await saveFirestoreFile(productId, file);
    fileStored = true;
  }

  if (exampleFiles.length > 4) {
    throw new Error("PREVIEW_LIMIT");
  }

  if (exampleFiles.length) {
    await saveProductPreviews(productId, exampleFiles);
  }

  await setDoc(productRef, {
    ...product,
    coverUrl,
    fileStored,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function saveProductPreviews(productId, files) {
  const { doc, serverTimestamp, setDoc } = services.dbApi;

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (file.size > 350 * 1024) {
      throw new Error("PREVIEW_TOO_LARGE");
    }

    const url = await fileToDataUrl(file);
    await setDoc(doc(services.db, "products", productId, "previews", String(index).padStart(4, "0")), {
      index,
      name: file.name,
      url,
      createdAt: serverTimestamp(),
    });
  }
}

async function saveFirestoreFile(productId, file) {
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("FILE_TOO_LARGE");
  }

  const { doc, serverTimestamp, setDoc } = services.dbApi;
  const dataUrl = await fileToDataUrl(file);
  const [, base64 = ""] = dataUrl.split(",");
  const chunkSize = 700000;
  const chunkCount = Math.ceil(base64.length / chunkSize);

  await setDoc(doc(services.db, "productFiles", productId), {
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    chunkCount,
    createdAt: serverTimestamp(),
  });

  for (let index = 0; index < chunkCount; index += 1) {
    await setDoc(doc(services.db, "productFiles", productId, "chunks", String(index).padStart(4, "0")), {
      index,
      data: base64.slice(index * chunkSize, (index + 1) * chunkSize),
    });
  }
}

async function addDemoProduct(product, cover, file, exampleFiles = []) {
  if (exampleFiles.length > 4) {
    throw new Error("PREVIEW_LIMIT");
  }

  for (const example of exampleFiles) {
    if (example.size > 350 * 1024) {
      throw new Error("PREVIEW_TOO_LARGE");
    }
  }

  const coverUrl = cover && cover.size ? await fileToDataUrl(cover) : "";
  const previewUrls = [];
  for (const example of exampleFiles) {
    previewUrls.push(await fileToDataUrl(example));
  }
  const next = normalizeProduct({
    ...product,
    id: crypto.randomUUID(),
    coverUrl,
    previewUrls,
    previewCount: previewUrls.length,
    fileName: file?.name || "",
    fileSize: file?.size || 0,
    createdAt: Date.now(),
  });
  state.products.unshift(next);
  writeJson("nv_products", state.products);
}

function renderOrders() {
  els.ordersList.replaceChildren();
  els.ordersCount.textContent = String(state.orders.length);
  if (!state.admin) return;

  if (!state.orders.length) {
    const empty = document.createElement("p");
    empty.className = "filter-note";
    empty.textContent = "Заявок пока нет.";
    els.ordersList.append(empty);
    return;
  }

  state.orders.forEach((order) => {
    const card = document.createElement("article");
    card.className = "order-card";
    const items = (order.items || []).map((item) => `${item.title} x${item.qty}`).join(", ");
    const headline = order.username ? `${order.username} | ${order.contact || "Без контакта"}` : order.contact || "Без контакта";
    card.innerHTML = `
      <h3>${escapeHtml(headline)}</h3>
      <p>${escapeHtml(items || "Без товаров")}</p>
      <p>${formatMoney(order.total || 0)} | ${escapeHtml(order.status || "new")}</p>
      <p>${escapeHtml(order.comment || "")}</p>
      <button class="text-button download-files" type="button">Скачать файлы</button>
      <button class="text-button" type="button">Отметить как выдано</button>
    `;
    card.querySelector(".download-files").addEventListener("click", () => downloadOrderFiles(order));
    card.querySelector("button:not(.download-files)").addEventListener("click", () => markOrderDone(order.id));
    els.ordersList.append(card);
  });
}

async function downloadOrderFiles(order) {
  if (!state.admin || !state.adminUnlocked) return;
  if (!state.firebaseReady) {
    setFormStatus("В demo-режиме файл хранится только локально в браузере.", true);
    return;
  }

  const productIds = [...new Set((order.items || []).map((item) => item.productId).filter(Boolean))];
  for (const productId of productIds) {
    await downloadFirestoreFile(productId);
  }
}

async function downloadFirestoreFile(productId) {
  const { collection, doc, getDoc, getDocs, orderBy, query } = services.dbApi;
  const metaSnap = await getDoc(doc(services.db, "productFiles", productId));
  if (!metaSnap.exists()) return;

  const meta = metaSnap.data();
  const chunksSnap = await getDocs(query(collection(services.db, "productFiles", productId, "chunks"), orderBy("index", "asc")));
  const base64 = chunksSnap.docs.map((chunk) => chunk.data().data || "").join("");
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: meta.type || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = meta.name || "digital-file";
  link.click();
  URL.revokeObjectURL(url);
}

async function markOrderDone(orderId) {
  if (!state.admin || !state.adminUnlocked) return;
  if (state.firebaseReady) {
    const { doc, serverTimestamp, updateDoc } = services.dbApi;
    await updateDoc(doc(services.db, "orders", orderId), {
      status: "delivered",
      updatedAt: serverTimestamp(),
    });
    return;
  }

  state.orders = state.orders.map((order) => (order.id === orderId ? { ...order, status: "delivered" } : order));
  writeJson("nv_orders", state.orders);
  renderOrders();
}

function renderStats() {
  const activeProducts = state.products.filter((item) => item.active !== false);
  els.statProducts.textContent = String(activeProducts.length);
  els.statDigital.textContent = String(activeProducts.filter((item) => ["Код", "Файл", "Набор", "Доступ"].includes(item.type)).length);
  els.statOrders.textContent = String(state.orders.length);
}

function normalizeProduct(product) {
  return {
    ...product,
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    tags: Array.isArray(product.tags) ? product.tags : [],
    previewCount: Number(product.previewCount || 0),
    previewUrls: Array.isArray(product.previewUrls) ? product.previewUrls.filter(Boolean) : [],
  };
}

function normalizeUsername(value) {
  const key = String(value || "").trim().toLowerCase();
  return { key, username: key };
}

function validateUsername(username) {
  return USERNAME_PATTERN.test(username);
}

function buildInternalEmail(usernameKey) {
  return `${usernameKey}@${INTERNAL_AUTH_DOMAIN}`;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function mapAuthError(error, fallback) {
  const code = error?.code || "";
  if (code === "auth/email-already-in-use") return "Этот логин уже занят.";
  if (code === "auth/invalid-email") return "Не удалось обработать логин или почту.";
  if (code === "auth/weak-password") return "Пароль слишком простой.";
  if (code === "auth/invalid-credential") return "Неверный логин или пароль.";
  if (code === "auth/user-disabled") return "Аккаунт отключен.";
  if (code === "auth/requires-recent-login") return "Подтверди текущий пароль и повтори попытку.";
  if (code === "auth/too-many-requests") return "Слишком много попыток. Подожди немного и попробуй снова.";
  return fallback;
}

function mapProductError(error) {
  const code = error?.code || "";
  const message = String(error?.message || "");

  if (message.includes("COVER_TOO_LARGE")) {
    return "Обложка слишком большая. Загрузи изображение до 600 КБ.";
  }

  if (message.includes("PREVIEW_TOO_LARGE")) {
    return "Фото примера слишком большое. Каждое изображение должно быть до 350 КБ.";
  }

  if (message.includes("PREVIEW_LIMIT")) {
    return "Можно добавить до 4 фото примеров на один товар.";
  }

  if (message.includes("FILE_TOO_LARGE")) {
    return "Файл товара слишком большой. Для бесплатного режима нужен файл до 4 МБ.";
  }

  if (code === "permission-denied") {
    return "Нет доступа на запись. Войди как rootAdmin и активируй панель токеном HASH#root.";
  }

  if (code === "unauthenticated") {
    return "Сессия истекла. Войди заново и повтори.";
  }

  return "Не удалось добавить товар. Проверь размер файлов и активность админ-сессии.";
}

function mapCheckoutError(error) {
  const code = error?.code || "";

  if (code === "permission-denied") {
    return "Не удалось создать заявку. Проверь логин аккаунта и заполнение формы.";
  }

  if (code === "unauthenticated") {
    return "Сессия истекла. Войди заново и повтори.";
  }

  return "Не удалось создать заявку. Попробуй ещё раз.";
}

function setFormStatus(message, error = false) {
  els.formStatus.textContent = message;
  els.formStatus.style.color = error ? "var(--danger)" : "var(--muted)";
}

function setCheckoutStatus(message, error = false) {
  els.checkoutStatus.textContent = message;
  els.checkoutStatus.style.color = error ? "var(--danger)" : "var(--muted)";
}

function setAuthStatus(message, error = false) {
  els.authStatus.textContent = message;
  els.authStatus.style.color = error ? "var(--danger)" : "var(--muted)";
}

function setProfileStatus(message, error = false) {
  els.profileStatus.textContent = message;
  els.profileStatus.style.color = error ? "var(--danger)" : "var(--muted)";
}

function formatMoney(value) {
  const amount = Number(value || 0);

  if (state.currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount / USD_EXCHANGE_RATE);
  }

  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(amount);
}

function plural(value, forms) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

function getTime(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  return Number(new Date(value)) || 0;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function startAmbientCanvas() {
  const canvas = document.querySelector("#ambient-canvas");
  const ctx = canvas.getContext("2d");
  const dots = [];
  const dotCount = 70;
  let width = 0;
  let height = 0;
  let frame = 0;

  function resize() {
    width = canvas.width = Math.floor(window.innerWidth * window.devicePixelRatio);
    height = canvas.height = Math.floor(window.innerHeight * window.devicePixelRatio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  }

  function seed() {
    dots.length = 0;
    for (let index = 0; index < dotCount; index += 1) {
      dots.push({
        x: Math.random(),
        y: Math.random(),
        speed: 0.00018 + Math.random() * 0.00036,
        size: 1 + Math.random() * 2,
      });
    }
  }

  function draw() {
    frame += 1;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(124, 255, 107, 0.42)";
    ctx.strokeStyle = "rgba(124, 255, 107, 0.08)";
    ctx.lineWidth = 1;

    dots.forEach((dot) => {
      dot.y += dot.speed * (1 + Math.sin(frame * 0.01 + dot.x * 8) * 0.35);
      if (dot.y > 1.04) dot.y = -0.04;
      const x = dot.x * width;
      const y = dot.y * height;
      ctx.beginPath();
      ctx.arc(x, y, dot.size * window.devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    });

    for (let i = 0; i < dots.length; i += 1) {
      for (let j = i + 1; j < dots.length; j += 1) {
        const ax = dots[i].x * width;
        const ay = dots[i].y * height;
        const bx = dots[j].x * width;
        const by = dots[j].y * height;
        const distance = Math.hypot(ax - bx, ay - by);
        if (distance < 135 * window.devicePixelRatio) {
          ctx.globalAlpha = 1 - distance / (135 * window.devicePixelRatio);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  seed();
  draw();
}
