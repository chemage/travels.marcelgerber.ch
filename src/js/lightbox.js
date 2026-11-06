// Click a photo in a story to view it large. Arrow keys / buttons move between photos, Esc closes.
(() => {
  const photos = [...document.querySelectorAll(".content img")].filter((i) => !i.closest("a"));
  if (!photos.length || !window.HTMLDialogElement) return;

  const big = (img) => {
    const set = img.closest("picture")?.querySelector('source[type="image/webp"]')?.srcset || img.srcset;
    if (!set) return img.currentSrc || img.src;
    return set.split(",").map((s) => s.trim().split(/\s+/)).sort((a, b) => parseInt(a[1]) - parseInt(b[1])).pop()[0];
  };
  const caption = (img) => img.closest("figure")?.querySelector("figcaption")?.textContent.trim() || "";

  const dlg = document.createElement("dialog");
  dlg.className = "lightbox";
  dlg.setAttribute("aria-label", "Photo viewer");
  dlg.innerHTML =
    '<button class="lb-close" aria-label="Close">×</button>' +
    '<button class="lb-prev" aria-label="Previous photo">‹</button>' +
    '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<button class="lb-next" aria-label="Next photo">›</button>';
  document.body.append(dlg);
  const view = dlg.querySelector("img");
  const cap = dlg.querySelector("figcaption");
  let i = 0;

  const show = (n) => {
    i = (n + photos.length) % photos.length;
    view.src = big(photos[i]);
    view.alt = photos[i].alt || "";
    cap.textContent = [caption(photos[i]), `${i + 1} / ${photos.length}`].filter(Boolean).join("   ");
  };

  photos.forEach((p, n) => {
    p.classList.add("zoomable");
    p.tabIndex = 0;
    p.setAttribute("role", "button");
    const open = () => { show(n); dlg.showModal(); };
    p.addEventListener("click", open);
    p.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });

  dlg.querySelector(".lb-prev").addEventListener("click", (e) => { e.stopPropagation(); show(i - 1); });
  dlg.querySelector(".lb-next").addEventListener("click", (e) => { e.stopPropagation(); show(i + 1); });
  dlg.querySelector(".lb-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target === view) dlg.close(); });
  dlg.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(i - 1);
    if (e.key === "ArrowRight") show(i + 1);
  });
})();
