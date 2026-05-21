const firebaseConfig = {
  apiKey: "AIzaSyAqtsnXdb_Q9stTEQh-L3puhSoM79iMVJU",
  authDomain: "codeshop-f5a1c.firebaseapp.com",
  projectId: "codeshop-f5a1c",
  storageBucket: "codeshop-f5a1c.firebasestorage.app",
  messagingSenderId: "418304437516",
  appId: "1:418304437516:web:4f18d243016b1889cbed29",
  measurementId: "G-HP93DJJEKP",
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
  view: "store",
  category: "Все",
  search: "",
  sort: "new",
  products: [],
  orders: [],
  cart: [],
  unsubProducts: null,
  unsubOrders: null,
};

const services = {};
const els = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheElements();
  bindEvents();
  syncAdminNavigation();
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
    drawerPanel: document.querySelector(".drawer-panel"),
    openCart: document.querySelector("#open-cart"),
    closeCart: document.querySelector("#close-cart"),
    cartCount: document.querySelector("#cart-count"),
    cartItems: document.querySelector("#cart-items"),
    cartTotal: document.querySelector("#cart-total"),
    checkoutForm: document.querySelector("#checkout-form"),
    checkoutStatus: document.querySelector("#checkout-status"),
    adminEmail: document.querySelector("#admin-email"),
    adminPassword: document.querySelector("#admin-password"),
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
    adminNavLink: document.querySelector(".nav-admin"),
  });
}

function bindEvents() {
  window.addEventListener("hashchange", syncViewFromHash);

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

  els.checkoutForm.addEventListener("submit", submitOrder);
  els.adminLogin.addEventListener("click", adminLogin);
  els.adminLogout.addEventListener("click", adminLogout);
  els.productForm.addEventListener("submit", addProduct);
  els.themeToggle.addEventListener("click", () => document.body.classList.toggle("high-contrast"));
}

function syncViewFromHash() {
  setView(getViewFromHash(window.location.hash));
}

function getViewFromHash(hash) {
  const route = String(hash || "")
    .replace(/^#/, "")
    .trim()
    .toLowerCase();

  if (route === "deals") return "deals";
  if (route === "admin") return "admin";
  return "store";
}

function setView(view) {
  state.view = view;

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
}

function syncAdminNavigation() {
  els.adminNavLink.hidden = !state.admin;
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

async function handleAuthState(user) {
  if (!state.firebaseReady || !user) {
    setAdmin(false);
    return;
  }

  const { doc, getDoc } = services.dbApi;
  const adminSnap = await getDoc(doc(services.db, "admins", user.uid));
  if (!adminSnap.exists()) {
    await services.authApi.signOut(services.auth);
    setAdmin(false);
    setFormStatus("UID не найден в admins. Добавь его в Firestore.", true);
    return;
  }

  setAdmin(true);
  listenOrders();
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
  if (!state.admin || !state.firebaseReady) return;
  const { collection, onSnapshot, orderBy, query } = services.dbApi;
  const ordersQuery = query(collection(services.db, "orders"), orderBy("createdAt", "desc"));
  state.unsubOrders?.();
  state.unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
    state.orders = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    renderOrders();
    renderStats();
  });
}

function loadDemoData() {
  state.products = readJson("nv_products", demoProducts).map(normalizeProduct);
  state.orders = readJson("nv_orders", []);
  els.modeNote.textContent = "Demo: пароль админки demo. После вставки Firebase config данные будут храниться в Firebase.";
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
    const img = card.querySelector("img");
    const title = card.querySelector("h2");
    const description = card.querySelector("p");
    const badge = card.querySelector(".badge");
    const tags = card.querySelector(".tag-list");
    const price = card.querySelector("strong");
    const button = card.querySelector("button");

    img.src = product.coverUrl || "";
    img.alt = product.title;
    title.textContent = product.title;
    description.textContent = product.description;
    badge.textContent = product.type || product.category || "Digital";
    price.textContent = formatMoney(product.price);
    button.addEventListener("click", () => addToCart(product.id));

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
  refreshIcons();
}

function toggleCart(open) {
  els.cartDrawer.classList.toggle("open", open);
  els.cartDrawer.setAttribute("aria-hidden", String(!open));
  els.drawerPanel.style.right = open ? "0" : "-100%";
}

async function submitOrder(event) {
  event.preventDefault();
  if (!state.cart.length) {
    setCheckoutStatus("Добавь товар в корзину.", true);
    return;
  }

  const formData = new FormData(els.checkoutForm);
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
    renderAll();
    setCheckoutStatus("Заявка создана. Продавец свяжется по указанному контакту.");
  } catch (error) {
    console.error(error);
    setCheckoutStatus("Не удалось создать заявку. Проверь Firebase rules.", true);
  }
}

async function adminLogin() {
  const email = els.adminEmail.value.trim();
  const password = els.adminPassword.value.trim();

  if (state.firebaseReady) {
    try {
      await services.authApi.signInWithEmailAndPassword(services.auth, email, password);
      setFormStatus("Вход выполнен.");
    } catch (error) {
      console.error(error);
      setFormStatus("Не удалось войти. Проверь email/password.", true);
    }
    return;
  }

  if (password === "demo") {
    setAdmin(true);
    setFormStatus("Demo-админка активна.");
  } else {
    setFormStatus("Для demo-режима пароль: demo", true);
  }
}

async function adminLogout() {
  if (state.firebaseReady) {
    await services.authApi.signOut(services.auth);
  }
  setAdmin(false);
}

function setAdmin(value) {
  state.admin = value;
  els.adminContent.hidden = !value;
  els.adminLogout.hidden = !value;
  els.adminLogin.hidden = value;
  syncAdminNavigation();
  renderOrders();
}

async function addProduct(event) {
  event.preventDefault();
  if (!state.admin) return;
  setFormStatus("Добавляю товар...");

  const formData = new FormData(els.productForm);
  const file = formData.get("file");
  const cover = formData.get("cover");
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
  };

  try {
    if (state.firebaseReady) {
      await addFirebaseProduct(product, cover, file);
    } else {
      await addDemoProduct(product, cover, file);
    }

    els.productForm.reset();
    setFormStatus("Товар добавлен.");
    renderAll();
  } catch (error) {
    console.error(error);
    setFormStatus("Не удалось добавить товар. Проверь Firebase Storage/Firestore rules.", true);
  }
}

async function addFirebaseProduct(product, cover, file) {
  const { collection, doc, serverTimestamp, setDoc } = services.dbApi;
  const productRef = doc(collection(services.db, "products"));
  const productId = productRef.id;
  let coverUrl = "";
  let fileStored = false;

  if (cover && cover.size) {
    if (cover.size > 260 * 1024) {
      throw new Error("Cover image is too large for Firestore mode.");
    }
    coverUrl = await fileToDataUrl(cover);
  }

  if (file && file.size) {
    await saveFirestoreFile(productId, file);
    fileStored = true;
  }

  await setDoc(productRef, {
    ...product,
    coverUrl,
    fileStored,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function saveFirestoreFile(productId, file) {
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("File is too large for Firestore mode.");
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

async function addDemoProduct(product, cover, file) {
  const coverUrl = cover && cover.size ? await fileToDataUrl(cover) : "";
  const next = normalizeProduct({
    ...product,
    id: crypto.randomUUID(),
    coverUrl,
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
    card.innerHTML = `
      <h3>${escapeHtml(order.contact || "Без контакта")}</h3>
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
  };
}

function setFormStatus(message, error = false) {
  els.formStatus.textContent = message;
  els.formStatus.style.color = error ? "var(--danger)" : "var(--muted)";
}

function setCheckoutStatus(message, error = false) {
  els.checkoutStatus.textContent = message;
  els.checkoutStatus.style.color = error ? "var(--danger)" : "var(--muted)";
}

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
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

function safeName(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
