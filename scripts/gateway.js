/** Legacy route guard: payment creation now starts on checkout and redirects
 * directly to the HTTPS gateway URL returned by the backend. */
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("desktopPaymentForm");
  const button = form && form.querySelector('[type="submit"]');
  if (button) button.disabled = true;
  const message = form && form.querySelector(".gateway-message");
  if (message) {
    message.textContent = "برای امنیت پرداخت، فرایند پرداخت را از صفحه تسویه‌حساب آغاز کنید.";
    message.dataset.type = "info";
  }
});
