document.addEventListener("DOMContentLoaded", () => {
  const toggles = document.querySelectorAll("[data-password-toggle]");

  toggles.forEach((toggle) => {
    const fieldId = toggle.getAttribute("aria-controls");
    if (!fieldId) return;

    const input = document.getElementById(fieldId);
    if (!(input instanceof HTMLInputElement)) return;

    const labelNode = toggle.querySelector(".kc-toggle-password-text");
    const showLabel = toggle.getAttribute("data-label-show") || "Show";
    const hideLabel = toggle.getAttribute("data-label-hide") || "Hide";

    const sync = () => {
      const isPassword = input.type === "password";
      toggle.setAttribute("aria-label", isPassword ? showLabel : hideLabel);
      toggle.setAttribute("data-password-visible", isPassword ? "false" : "true");
      if (labelNode) {
        labelNode.textContent = isPassword ? showLabel : hideLabel;
      }
    };

    toggle.addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
      sync();
    });

    sync();
  });
});
