let CHECKOUT_TOTAL = 0;

document.addEventListener("DOMContentLoaded", () => {
  // Remove legacy checkout copies that could contain buyer PII. Current
  // checkout details are submitted directly to the backend and not cached.
  ["benamacademyBuyerName", "benamacademyBuyerPhone", "benamacademyBuyerEmail", "benamacademyCheckout"].forEach((key) => localStorage.removeItem(key));

  // Dynamically calculate total from benamacademyCart
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("benamacademyCart") || "[]");
  } catch (error) {
    cart = [];
  }

  if (Array.isArray(cart) && cart.length > 0) {
    CHECKOUT_TOTAL = cart.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1),
      0,
    );
  } else {
    CHECKOUT_TOTAL = 0;
  }

  renderCheckoutItems();

  const checkoutSubmit = document.querySelector('#checkoutForm [type="submit"]');
  if (!CHECKOUT_TOTAL || !Array.isArray(cart) || cart.length === 0) {
    if (checkoutSubmit) checkoutSubmit.disabled = true;
    const emptyNotice = document.createElement("p");
    emptyNotice.className = "checkout-message";
    emptyNotice.textContent = "سبد خرید شما خالی است. ابتدا محصولی به سبد خرید اضافه کنید.";
    emptyNotice.dataset.type = "error";
    document.querySelector("#checkoutForm")?.prepend(emptyNotice);
  }

  const discountInput = document.getElementById("discountInput");
  const discountButton = document.getElementById("discountBtn");
  const discountRow = document.getElementById("discountRow");
  const discountAmount = document.getElementById("discountAmount");
  const subtotalPrice = document.getElementById("cartSubtotalPrice");
  const finalPrice = document.getElementById("cartFinalPrice");
  let finalAmount = CHECKOUT_TOTAL;

  const formatMoney = (value) =>
    `${Number(value).toLocaleString("fa-IR")} تومان`;

  if (subtotalPrice) {
    subtotalPrice.textContent = formatMoney(CHECKOUT_TOTAL);
  }
  if (finalPrice) {
    finalPrice.textContent = formatMoney(finalAmount);
  }

  const showMessage = (message, type) => {
    let messageEl = document.querySelector(".checkout-message");
    if (!messageEl) {
      messageEl = document.createElement("p");
      messageEl.className = "checkout-message";
      discountInput.closest(".form-group").after(messageEl);
    }
    messageEl.textContent = message;
    messageEl.dataset.type = type || "info";
  };


  discountButton?.addEventListener("click", async () => {
    const code = discountInput.value.trim();
    if (!code) {
      showMessage("کد تخفیف را وارد کنید.", "error");
      return;
    }

    discountButton.disabled = true;
    try {
      const result = await appApi.commerce.validateCoupon({ code });
      const discount = Math.round((CHECKOUT_TOTAL * result.percent) / 100);
      finalAmount = CHECKOUT_TOTAL - discount;
      discountRow.hidden = false;
      discountAmount.textContent = formatMoney(discount);
      finalPrice.textContent = formatMoney(finalAmount);
      sessionStorage.setItem("benamacademyCouponCode", result.code || code);
      showMessage(result.message, "success");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      discountButton.disabled = false;
    }
  });

  // Submit buyer details and product IDs directly to the backend. Do not
  // persist personal data, line-item prices or a client-calculated total.
  const checkoutForm = document.getElementById("checkoutForm");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = document.getElementById("billingName").value.trim();
      const phone = document.getElementById("billingPhone").value.trim();
      const email = document.getElementById("billingEmail").value.trim();
      if (!CHECKOUT_TOTAL || !Array.isArray(cart) || cart.length === 0) {
        alert("سبد خرید خالی است. ابتدا محصولی انتخاب کنید.");
        return;
      }
      if (!name || !phone || !email) {
        alert("لطفاً کلیه مشخصات خریدار را به درستی پر کنید.");
        return;
      }

      const submit = checkoutForm.querySelector('[type="submit"]');
      if (submit) {
        submit.disabled = true;
        submit.textContent = "در حال ایجاد سفارش...";
      }
      try {
        const result = await appApi.commerce.createPayment({
          buyer: { name, phone, email },
          items: cart.map((item) => ({
            id: item.id,
            qty: Number(item.qty) > 0 ? Number(item.qty) : 1,
          })),
          couponCode: sessionStorage.getItem("benamacademyCouponCode") || null,
        });
        if (!result || typeof result.redirectUrl !== "string" || !/^https:\/\//i.test(result.redirectUrl)) {
          throw new Error("آدرس معتبر درگاه از سرور دریافت نشد.");
        }
        sessionStorage.removeItem("benamacademyCouponCode");
        window.location.assign(result.redirectUrl);
      } catch (error) {
        showMessage(error && error.message ? error.message : "ایجاد سفارش انجام نشد.", "error");
        if (submit) {
          submit.disabled = false;
          submit.textContent = "ثبت سفارش و پرداخت";
        }
      }
    });
  }
});

function renderCheckoutItems() {
  const container = document.querySelector(".cart-items-list");
  if (!container) return;

  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("benamacademyCart") || "[]");
  } catch (error) {
    cart = [];
  }

  if (!Array.isArray(cart) || !cart.length) {
    const empty = document.createElement("p");
    empty.className = "cart-empty-message";
    empty.textContent = "سبد خرید شما خالی است.";
    container.replaceChildren(empty);
    return;
  }

  container.replaceChildren();
  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    const image = document.createElement("img");
    image.src = item.img || "../images/ravin.png";
    image.alt = item.name || "محصول";
    const info = document.createElement("div");
    info.className = "cart-item-info";
    const title = document.createElement("h4");
    title.textContent = item.name || "محصول بدون نام";
    const price = document.createElement("p");
    price.className = "price";
    price.textContent = `${Number(item.price || 0).toLocaleString("fa-IR")} تومان (تعداد: ${item.qty || 1})`;
    info.append(title, price);
    row.append(image, info);
    container.appendChild(row);
  });
}
