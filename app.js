const $ = (s) => document.querySelector(s),
  $$ = (s) => document.querySelectorAll(s);
const raw = `Samarqand palovi|Milliy|hero|45000;To'y palovi|Milliy|hero|55000;Qo'y go'shtli manti|Milliy|manti|38000;Qovurma lag'mon|Milliy|lagmon|42000;Uy lag'moni|Milliy|lagmon|40000;Qozon kabob|Milliy|qozon|68000;Chuchvara|Milliy|chuchvara|35000;Tandir somsa|Milliy|somsa|12000;Go'shtli somsa|Milliy|somsa|15000;Mol go'shtli shashlik|Kaboblar|shashlik|24000;Qo'y go'shtli shashlik|Kaboblar|shashlik|28000;Qiyma kabob|Kaboblar|shashlik|22000;Sabzavotli kabob|Kaboblar|qozon|18000;Qaynatma sho'rva|Sho'rvalar|shurpa|32000;Ko'za sho'rva|Sho'rvalar|shurpa|38000;Chuchvarali sho'rva|Sho'rvalar|chuchvara|30000;Milliy shirinliklar|Shirinliklar|shirinlik|25000;Asalli pishiriq|Shirinliklar|shirinlik|28000;Ko'k choy|Ichimliklar|choy|8000;Limonli choy|Ichimliklar|choy|12000;Qora choy|Ichimliklar|choy|8000`;
const dishes = raw.split(";").map((r, id) => {
  const [name, cat, img, price] = r.split("|");
  return { id, name, cat, img: `img/${img}.jpg`, price: +price };
});
const fmt = (n) => n.toLocaleString("uz-UZ") + " so'm";
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
let cart = read("taom-cart", []),
  category = "Barchasi",
  slide = 0,
  notice;
cart = Array.isArray(cart)
  ? cart.filter((id) => Number.isInteger(id) && dishes[id])
  : [];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const io = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("v");
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.08 },
);
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").classList.add("show");
  clearTimeout(notice);
  notice = setTimeout(() => $("#toast").classList.remove("show"), 3500);
}
function render() {
  const list = dishes.filter(
    (d) => category === "Barchasi" || d.cat === category,
  );
  $("#grid").innerHTML = list
    .map(
      (d) =>
        `<article class="dish"><div class="im"><img src="${d.img}" alt="${d.name}" loading="lazy"><b class="pr">${fmt(d.price)}</b></div><div class="in"><small>${d.cat}</small><h3>${d.name}</h3><p>Milliy oshxonamizdan, yangi tayyorlangan.</p><div class="row"><span>1 porsiya</span><button class="add" data-add="${d.id}" aria-label="${d.name} — savatga qo'shish">Savatga</button></div></div></article>`,
    )
    .join("");
  $("#found").textContent = `${list.length} ta taom`;
  $$(".dish").forEach((el, i) => {
    el.style.setProperty("--delay", `${(i % 3) * 80}ms`);
    io.observe(el);
  });
}
function updateCart() {
  save("taom-cart", cart);
  $("#count").textContent = cart.length;
  $("#items").innerHTML =
    cart
      .map((id, i) => {
        const d = dishes[id];
        return `<li><img src="${d.img}" alt="${d.name}"><div>${d.name}<br><small>${fmt(d.price)}</small></div><button data-remove="${i}" aria-label="${d.name} — savatdan o'chirish">O'chirish</button></li>`;
      })
      .join("") || "<li>Savat hozircha bo'sh</li>";
  $("#sum").textContent = fmt(
    cart.reduce((sum, id) => sum + dishes[id].price, 0),
  );
  $("#buy").disabled = !cart.length;
}
function openCart(open) {
  $("#cart").classList.toggle("open", open);
  $("#cart").setAttribute("aria-hidden", String(!open));
  $("#cart").inert = !open;
  $("#veil").hidden = !open;
  document.body.classList.toggle("cart-open", open);
  if (open) $("#close").focus();
  else $("#cartBtn").focus();
}
$("#filters").innerHTML = ["Barchasi", ...new Set(dishes.map((d) => d.cat))]
  .map(
    (c, i) =>
      `<button class="${i ? "" : "on"}" aria-pressed="${!i}">${c}</button>`,
  )
  .join("");
$("#filters").onclick = (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  category = b.textContent;
  $$("#filters button").forEach((el) => {
    el.classList.toggle("on", el === b);
    el.setAttribute("aria-pressed", String(el === b));
  });
  render();
};
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.add !== undefined) {
    cart.push(+b.dataset.add);
    updateCart();
    toast("Taom savatga qo'shildi");
    $("#count").animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.35)" },
        { transform: "scale(1)" },
      ],
      { duration: reduced ? 0 : 300 },
    );
  }
  if (b.dataset.remove !== undefined) {
    cart.splice(+b.dataset.remove, 1);
    updateCart();
  }
});
$("#cartBtn").onclick = () => openCart(true);
$("#close").onclick = () => openCart(false);
$("#veil").onclick = () => openCart(false);
document.addEventListener("keydown", (e) => {
  if (!$("#cart").classList.contains("open")) return;
  if (e.key === "Escape") openCart(false);
  if (e.key === "Tab") {
    const els = [...$("#cart").querySelectorAll("button:not(:disabled)")],
      first = els[0],
      last = els.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
$("#buy").onclick = () =>
  toast(
    "Bu namuna sayt. Buyurtma uchun +998 50 030 54 50 raqamiga qo'ng'iroq qiling.",
  );
$("#form").onsubmit = (e) => {
  e.preventDefault();
  $("#msg").textContent =
    "Bu namuna shakl — bron yuborilmadi. Stol band qilish uchun bizga qo'ng'iroq qiling.";
};
function theme(dark) {
  document.body.classList.toggle("dark", dark);
  $("#theme").textContent = dark ? "Kunduz" : "Tun";
  $("#theme").setAttribute(
    "aria-label",
    dark ? "Kunduzgi rejim" : "Tungi rejim",
  );
  save("taom-theme", dark);
}
$("#theme").onclick = () => theme(!document.body.classList.contains("dark"));
function progress() {
  const height = document.documentElement.scrollHeight - innerHeight;
  $("#bar").style.width = `${height > 0 ? (scrollY / height) * 100 : 0}%`;
  $("header").classList.toggle("s", scrollY > 40);
}
window.addEventListener("scroll", progress, { passive: true });
function timer() {
  const now = new Date(),
    end = new Date();
  end.setHours(18, 0, 0, 0);
  const secs = Math.max(0, Math.floor((end - now) / 1000));
  $("#timer").textContent = [
    Math.floor(secs / 3600),
    Math.floor(secs / 60) % 60,
    secs % 60,
  ]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}
if (!reduced)
  setInterval(() => {
    const img = $("#slide");
    img.classList.add("fade");
    setTimeout(() => {
      const d = dishes[[0, 9, 3][++slide % 3]];
      img.src = d.img;
      img.alt = d.name;
      img.classList.remove("fade");
    }, 450);
  }, 4500);
setInterval(timer, 1000);
timer();
theme(read("taom-theme", false));
render();
updateCart();
progress();
$$(".r").forEach((el) => io.observe(el));
$("#cart").inert = true;
setTimeout(
  () => {
    document.body.classList.add("go");
    $("#intro").setAttribute("aria-hidden", "true");
  },
  reduced ? 0 : 1100,
);
