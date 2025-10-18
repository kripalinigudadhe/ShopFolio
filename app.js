document.addEventListener("DOMContentLoaded", () => {
  // ==== API CONFIG ====
  const API_URL = "http://127.0.0.1:5000"; // Flask backend URL

  // ==== ELEMENT SELECTORS ====
  const openLoginBtn = document.getElementById("open-login");
  const logoutBtn = document.getElementById("logout");
  const userBadge = document.getElementById("user-badge");

  const authModal = document.getElementById("auth-modal");
  const closeAuthBtn = document.getElementById("close-auth");
  const authTitle = document.getElementById("auth-title");
  const authSwitch = document.getElementById("auth-switch");
  const authSubmit = document.getElementById("auth-submit");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const orderModal = document.getElementById("order-modal");
  const closeOrderBtn = document.getElementById("close-order");

  const cartPanel = document.getElementById("cart-panel");
  const cartBtn = document.getElementById("view-cart");
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const cartCount = document.getElementById("cart-count");
  const checkoutBtn = document.getElementById("checkout-btn");

  const productGrid = document.getElementById("product-grid");
  const placeOrderSection = document.getElementById("place-order");
  const orderForm = document.getElementById("order-form");
  const welcomeMsg = document.getElementById("welcome-msg");

  // ==== STATE VARIABLES ====
  let loggedInUser = localStorage.getItem("shopfolio_user") || null;
  let isRegisterMode = false;
  let cart = JSON.parse(localStorage.getItem("shopfolio_cart") || "[]");

  // ==== PRODUCTS DATA ====
  const products = [
    { name: "Noise-Cancelling Headphones", price: 89.99, img: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f" },
    { name: "Comfort Runner Sneakers", price: 59.99, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" },
    { name: "Pulse Smart Watch", price: 129.0, img: "https://th.bing.com/th?id=OPAC.owty%2bG%2bOU84hig474C474&w=592&h=550&o=5&cb=12&dpr=1.3&pid=21.1" },
    { name: "UrbanFlex Backpack", price: 49.5, img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc" },
    { name: "ProShot Camera", price: 399.0, img: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f" },
  ];

  // ==== UTILITY FUNCTIONS ====
  function showModal(modal) { if(modal) { modal.classList.remove("hidden"); modal.style.display = "flex"; } }
  function hideModal(modal) { if(modal) { modal.classList.add("hidden"); modal.style.display = "none"; } }

  function updateWelcomeMessage() {
    if (welcomeMsg) {
      if (loggedInUser) {
        const name = loggedInUser.split("@")[0];
        welcomeMsg.textContent = `Welcome back, ${name}! 👋`;
      } else {
        welcomeMsg.textContent = "Hello! Explore our latest products below.";
      }
    }
  }

  function updateAuthUI() {
    if (loggedInUser) {
      openLoginBtn.classList.add("hidden");
      logoutBtn.classList.remove("hidden");
      if(userBadge) {
        userBadge.textContent = loggedInUser.split("@")[0];
        userBadge.classList.remove("hidden");
      }
    } else {
      openLoginBtn.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
      if(userBadge) userBadge.classList.add("hidden");
    }
    updateWelcomeMessage();
  }

  function saveCart() { localStorage.setItem("shopfolio_cart", JSON.stringify(cart)); }

  function updateCartUI() {
    cartItemsContainer.innerHTML = "";
    let total = 0;
    cart.forEach((item, index) => {
      total += item.price * item.qty;
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <span>${item.name} (${item.qty})</span>
        <strong>$${(item.price * item.qty).toFixed(2)}</strong>
        <button class="remove-item" data-index="${index}">✕</button>
      `;
      cartItemsContainer.appendChild(div);
    });
    cartTotal.textContent = total.toFixed(2);
    cartCount.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  }

  // ==== PRODUCT GRID ====
  function loadProducts() {
    productGrid.innerHTML = "";
    products.forEach((p) => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.img}" alt="${p.name}">
        <h4>${p.name}</h4>
        <p>Premium product curated for you.</p>
        <p class="price">$${p.price.toFixed(2)}</p>
        <button class="add-to-cart">Add to Cart</button>
      `;
      productGrid.appendChild(card);
    });
  }

  // ==== EVENT LISTENERS ====
  openLoginBtn.addEventListener("click", () => showModal(authModal));
  closeAuthBtn.addEventListener("click", () => hideModal(authModal));

  authSwitch.addEventListener("click", () => {
    isRegisterMode = !isRegisterMode;
    authTitle.textContent = isRegisterMode ? "Register on ShopFolio" : "Sign in to ShopFolio";
    authSwitch.textContent = isRegisterMode ? "Already have an account? Login" : "New user? Register";
  });

  authSubmit.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) { alert("Please fill all fields."); return; }

    try {
      if (isRegisterMode) {
        const res = await fetch(`${API_URL}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        alert("Registration successful! Please login.");
        isRegisterMode = false;
        authTitle.textContent = "Sign in to ShopFolio";
        authSwitch.textContent = "New user? Register";
      } else {
        const res = await fetch(`${API_URL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include"
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        loggedInUser = email;
        localStorage.setItem("shopfolio_user", email);
        updateAuthUI();
        hideModal(authModal);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }

    emailInput.value = "";
    passwordInput.value = "";
  });

  logoutBtn.addEventListener("click", async () => {
    try { await fetch(`${API_URL}/api/logout`, { method: "POST", credentials: "include" }); } catch (e) {}
    loggedInUser = null;
    localStorage.removeItem("shopfolio_user");
    updateAuthUI();
  });

  productGrid.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-to-cart")) {
      const card = e.target.closest(".product-card");
      const name = card.querySelector("h4").textContent;
      const price = parseFloat(card.querySelector(".price").textContent.replace("$", ""));
      const existing = cart.find((i) => i.name === name);
      if (existing) existing.qty++;
      else cart.push({ name, price, qty: 1 });
      saveCart();
      updateCartUI();
    }
  });

  cartItemsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-item")) {
      const idx = e.target.dataset.index;
      cart.splice(idx, 1);
      saveCart();
      updateCartUI();
    }
  });

  cartBtn.addEventListener("click", () => cartPanel.classList.toggle("visible"));

  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) { alert("Cart is empty!"); return; }
    if (!loggedInUser) { alert("Please login to checkout."); showModal(authModal); return; }
    placeOrderSection.classList.remove("hidden");
    placeOrderSection.scrollIntoView({ behavior: "smooth" });
  });

  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("order-name").value.trim();
    const address = document.getElementById("order-address").value.trim();
    const payment_method = document.getElementById("payment-method").value;

    if (!name || !address || !payment_method) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          address,
          payment_method,
          items: cart,
          total: cart.reduce((sum, i) => sum + i.price * i.qty, 0)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      cart = [];
      saveCart();
      updateCartUI();
      orderForm.reset();
      placeOrderSection.classList.add("hidden");
      showModal(orderModal);
    } catch (err) {
      alert("Error: " + err.message);
    }
  });

  closeOrderBtn.addEventListener("click", () => hideModal(orderModal));

  // ==== INITIAL LOAD ====
  loadProducts();
  updateAuthUI();
  updateCartUI();
});