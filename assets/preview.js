"use strict";

const products = {
  473: { label: "1 Kg Taste Indrayani", price: 199, url: "product-1kg.html" },
  470: { label: "5 Kg Taste Indrayani", price: 849, url: "product-5kg.html" }
};
const storageKey = "taste-indrayani-preview-cart";
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const quantity = (input) => Math.max(1, Math.min(99, Math.floor(Number(input)) || 1));
let cart = {};
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
  for (const id of Object.keys(products)) {
    if (Number(saved?.[id]) > 0) cart[id] = quantity(saved[id]);
  }
} catch { /* Leave the cart empty if storage is unavailable. */ }

const menu = document.querySelector(".ti-menu");
menu.addEventListener("click", () => {
  const opened = document.querySelector(".ti-nav").classList.toggle("is-open");
  menu.setAttribute("aria-expanded", String(opened));
});

const cartItems = document.querySelector("#ti-cart-items");
function updateCart() {
  const count = Object.values(cart).reduce((sum, amount) => sum + amount, 0);
  document.querySelector("[data-cart-count]").textContent = count;
  const checkout = document.querySelector("[data-preview-checkout]");
  if (checkout) checkout.hidden = count === 0;
  if (!cartItems) return;
  const readonly = cartItems.hasAttribute("data-readonly");
  const rows = Object.entries(cart);
  if (!rows.length) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }
  const rowsHtml = rows.map(([id, amount]) => {
    const {label, price, url} = products[id];
    const heading = '<li><div><a href="' + url + '">' + label + '</a><br>' + money.format(price * amount) + '</div>';
    if (readonly) return heading + '<span>Qty ' + amount + '</span></li>';
    return heading + '<input data-cart-quantity="' + id + '" type="number" min="1" max="99" value="' + amount
      + '" aria-label="Quantity for ' + label + '"><button type="button" data-cart-remove="' + id + '" aria-label="Remove ' + label + '">Remove</button></li>';
  }).join("");
  const total = rows.reduce((sum, [id, amount]) => sum + products[id].price * amount, 0);
  cartItems.innerHTML = '<ul>' + rowsHtml + '</ul><p class="ti-cart-total">Subtotal <strong>' + money.format(total) + '</strong></p>';
}
function saveCart() {
  try { localStorage.setItem(storageKey, JSON.stringify(cart)); } catch {}
  updateCart();
}
let feedbackTimeout;
const feedback = document.querySelector("#ti-feedback");
function addProduct(id, amount) {
  if (!Object.hasOwn(products, id)) return;
  cart[id] = quantity((cart[id] || 0) + amount);
  saveCart();
  feedback.hidden = false;
  feedback.textContent = products[id].label + " added to the preview cart.";
  clearTimeout(feedbackTimeout);
  feedbackTimeout = setTimeout(() => { feedback.hidden = true; }, 3200);
}

const orderBy = document.querySelector(".woocommerce-ordering select");
const productsList = document.querySelector("ul.products");
if (orderBy && productsList) {
  const original = [...productsList.children];
  const price = (item) => item.classList.contains("post-473") ? 199 : 849;
  orderBy.addEventListener("change", () => {
    const ordered = [...original];
    if (orderBy.value === "price") ordered.sort((a,b) => price(a) - price(b));
    if (["price-desc","date"].includes(orderBy.value)) ordered.sort((a,b) => price(b) - price(a));
    productsList.append(...ordered);
  });
}

document.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = event.target.dataset.previewProduct;
  if (id) addProduct(id, quantity(event.target.querySelector(".qty")?.value));
});
document.addEventListener("click", (event) => {
  const video = event.target.closest("[data-youtube-id]");
  if (video && /^[\w-]{11}$/.test(video.dataset.youtubeId)) {
    const frame = document.createElement("iframe");
    frame.src = "https://www.youtube-nocookie.com/embed/" + video.dataset.youtubeId + "?autoplay=1";
    frame.title = video.getAttribute("aria-label");
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    video.replaceWith(frame);
    frame.focus();
  }
  const add = event.target.closest("[data-preview-add]");
  if (add) {
    event.preventDefault();
    addProduct(add.dataset.previewAdd, quantity(add.closest("form")?.querySelector(".qty")?.value));
  }
  const remove = event.target.closest("[data-cart-remove]");
  if (remove) {
    delete cart[remove.dataset.cartRemove];
    saveCart();
    (cartItems.querySelector("button") || document.querySelector(".ti-demo-cart .ti-button")).focus();
  }
  const plusMinus = event.target.closest(".quantity .plus, .quantity .minus");
  if (plusMinus) {
    event.preventDefault();
    const input = plusMinus.closest(".quantity").querySelector(".qty");
    input.value = quantity(quantity(input.value) + (plusMinus.matches(".plus") ? 1 : -1));
  }
  const reviews = event.target.closest('a[href="#customer-reviews"]');
  if (reviews) document.querySelector("#customer-reviews").open = true;
});
cartItems?.addEventListener("change", (event) => {
  const id = event.target.dataset.cartQuantity;
  if (!id || !Object.hasOwn(cart, id)) return;
  cart[id] = quantity(event.target.value);
  saveCart();
  cartItems.querySelector('[data-cart-quantity="' + id + '"]').focus();
});
updateCart();
if (location.hash === "#customer-reviews") {
  const reviews = document.querySelector("#customer-reviews");
  if (reviews) reviews.open = true;
}
