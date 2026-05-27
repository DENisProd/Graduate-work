document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const toggle = document.querySelector("[data-kc-theme-toggle]");
  const storageKey = "domovoy-kc-theme";

  const applyTheme = (theme) => {
    const resolvedTheme = theme === "dark" ? "dark" : "light";
    root.setAttribute("data-kc-theme", resolvedTheme);
    root.style.colorScheme = resolvedTheme;
    if (toggle) {
      const isDark = resolvedTheme === "dark";
      const lightLabel =
        toggle.getAttribute("data-label-light") || "Light theme";
      const darkLabel =
        toggle.getAttribute("data-label-dark") || "Dark theme";
      toggle.setAttribute("aria-checked", isDark ? "true" : "false");
      toggle.setAttribute("data-theme", resolvedTheme);
      toggle.setAttribute("aria-label", isDark ? lightLabel : darkLabel);
    }
  };

  const storedTheme = window.localStorage.getItem(storageKey);
  if (storedTheme === "light" || storedTheme === "dark") {
    applyTheme(storedTheme);
  } else {
    applyTheme(root.getAttribute("data-kc-theme") || "light");
  }

  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const nextTheme =
      root.getAttribute("data-kc-theme") === "dark" ? "light" : "dark";
    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  });
});
