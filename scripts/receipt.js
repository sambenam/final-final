/**
 * Receipt view.
 * URL parameters identify the order only. Payment status, amount, buyer,
 * products and download permissions must come from the backend order record.
 */
document.addEventListener("DOMContentLoaded", async function () {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");
  const card = document.getElementById("receiptCard");
  const icon = document.getElementById("iconElement");
  const title = document.getElementById("receiptTitle");
  const subtitle = document.getElementById("receiptSubtitle");
  const badge = document.getElementById("statusBadge");
  const actions = document.getElementById("receiptActions");

  function setState(kind, heading, description, statusText) {
    if (card) {
      card.classList.toggle("success", kind === "success");
      card.classList.toggle("failed", kind === "failed");
    }
    if (icon) icon.className = "fas " + (kind === "success" ? "fa-check" : kind === "failed" ? "fa-times" : "fa-circle-info");
    if (title) title.textContent = heading;
    if (subtitle) subtitle.textContent = description;
    if (badge) badge.textContent = statusText;
  }

  if (!orderId) {
    setState("failed", "سفارشی برای نمایش وجود ندارد", "برای مشاهده رسید، از مسیر سفارش‌های خود وارد شوید.", "نامشخص");
    if (actions) actions.innerHTML = '<a href="user-profile.html" class="btn-action-secondary">سفارش‌های من</a><a href="index.html" class="btn-action-primary">صفحه اصلی</a>';
    return;
  }

  const orderIdEl = document.getElementById("orderId");
  const trxIdEl = document.getElementById("trxId");
  if (orderIdEl) orderIdEl.textContent = orderId;
  if (trxIdEl) trxIdEl.textContent = "—";
  setState("pending", "در حال بررسی تراکنش...", "وضعیت پرداخت از سرور دریافت می‌شود؛ لطفاً صفحه را نبندید.", "در حال بررسی");

  try {
    const order = await appApi.commerce.getOrder(orderId);
    if (!order || !order.id) throw new Error("سفارش پیدا نشد.");

    const paid = order.paymentStatus === "paid" || order.status === "success";
    const failed = order.paymentStatus === "failed" || order.status === "failed" || order.status === "cancelled";
    setState(paid ? "success" : failed ? "failed" : "pending",
      paid ? "پرداخت با موفقیت تأیید شد" : failed ? "پرداخت تأیید نشد" : "وضعیت پرداخت مشخص نیست",
      paid ? "تراکنش توسط سرور تأیید شده است." : failed ? "برای ادامه، وضعیت سفارش را در حساب کاربری بررسی کنید." : "هنوز تأیید نهایی پرداخت از سرور دریافت نشده است.",
      paid ? "موفق و تأییدشده" : failed ? "ناموفق" : "در انتظار تأیید");

    const amount = document.getElementById("receiptAmount");
    const date = document.getElementById("receiptDate");
    const buyer = document.getElementById("receiptBuyer");
    const product = document.getElementById("receiptProduct");
    if (amount && Number.isFinite(Number(order.amount))) amount.textContent = Number(order.amount).toLocaleString("fa-IR") + " تومان";
    if (date && order.createdAt) date.textContent = new Date(order.createdAt).toLocaleString("fa-IR");
    if (buyer && order.customer) { buyer.textContent = order.customer; document.getElementById("receiptBuyerRow").hidden = false; }
    if (product && order.product) { product.textContent = order.product; document.getElementById("receiptProductRow").hidden = false; }
    if (trxIdEl && order.trackingCode) trxIdEl.textContent = order.trackingCode;

    if (actions) {
      actions.innerHTML = paid
        ? '<a href="user-profile.html" class="btn-action-primary">مشاهده سفارش‌ها و فایل‌های مجاز</a><button type="button" class="btn-action-secondary" id="printReceiptBtn">چاپ رسید</button>'
        : '<a href="user-profile.html" class="btn-action-secondary">مشاهده سفارش‌های من</a><a href="index.html" class="btn-action-primary">صفحه اصلی</a>';
      document.getElementById("printReceiptBtn")?.addEventListener("click", function () { window.print(); });
    }
  } catch (error) {
    setState("pending", "امکان تأیید سفارش وجود ندارد", "اتصال به سرویس سفارش برقرار نشد یا API هنوز توسط بک‌اند پیاده‌سازی نشده است. هیچ خرید یا مجوز دانلودی در مرورگر ثبت نشده است.", "تأییدنشده");
    if (actions) actions.innerHTML = '<a href="user-profile.html" class="btn-action-secondary">سفارش‌های من</a><a href="index.html" class="btn-action-primary">صفحه اصلی</a>';
  }
});
