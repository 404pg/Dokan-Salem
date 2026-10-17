const sections = [
  { id: "design", name: "العلامة ونظام التصميم", shortName: "نظام التصميم", icon: "✳", description: "الهوية البصرية ومكوّنات الواجهة", folder: "01-design-system" },
  { id: "customer", name: "تطبيق العملاء", shortName: "تطبيق العملاء", icon: "▣", description: "تجربة التسوق وخدمات العملاء", folder: "02-customer-app" },
  { id: "admin", name: "لوحة الإدارة", shortName: "لوحة الإدارة", icon: "▤", description: "إدارة المتجر والعمليات", folder: "03-admin-portal" },
  { id: "journeys", name: "الرحلات المتصلة", shortName: "الرحلات", icon: "↗", description: "تدفقات المستخدم بين الشاشات", folder: "04-user-journeys" }
];

const screens = [
  { id: "brand", section: "design", number: "00", name: "الغلاف والعلامة", folder: "00 · Cover, brand & quality gate-html", file: "Main.dc.html" },
  { id: "tokens", section: "design", number: "01", name: "رموز نظام التصميم", folder: "01 · Design system — tokens-html", file: "System.dc.html" },
  { id: "components", section: "design", number: "02", name: "مكوّنات نظام التصميم", folder: "02 · Design system — components-html", file: "Components.dc.html" },
  { id: "entry", section: "customer", number: "C1–2", name: "البداية والترحيب", folder: "C1–C2 · Splash & onboarding-html", file: "C01-Entry.dc.html" },
  { id: "home", section: "customer", number: "C3", name: "الصفحة الرئيسية", folder: "C3 · Home-html", file: "C02-Home.dc.html" },
  { id: "browse", section: "customer", number: "C4–5, 8", name: "الأقسام وقائمة المنتجات", folder: "C4, C5, C8 · Categories, listing, compatibility-html", file: "C03-Browse.dc.html" },
  { id: "search", section: "customer", number: "C6", name: "البحث", folder: "C6 · Search-html", file: "C04-Search.dc.html" },
  { id: "product", section: "customer", number: "C7, 9", name: "تفاصيل المنتج والمفضلة", folder: "C7, C9 · Product details & wishlist-html", file: "C05-Product.dc.html" },
  { id: "cart", section: "customer", number: "C10", name: "سلة التسوق", folder: "C10 · Cart-html", file: "C06-Cart.dc.html" },
  { id: "auth", section: "customer", number: "C11–12", name: "تسجيل الدخول والتحقق", folder: "C11–C12 · Login & OTP-html", file: "C07-Auth.dc.html" },
  { id: "checkout", section: "customer", number: "C13–16", name: "إتمام الطلب", folder: "C13–C16 · Checkout & success-html", file: "C08-Checkout.dc.html" },
  { id: "orders", section: "customer", number: "C17–18", name: "الطلبات والتتبع", folder: "C17–C18 · Orders & tracking-html", file: "C09-Orders.dc.html" },
  { id: "maintenance", section: "customer", number: "C19–21", name: "الصيانة", folder: "C19–C21 · Maintenance flow-html", file: "C10-Maintenance.dc.html" },
  { id: "account", section: "customer", number: "C22–24", name: "الحساب وطلبات الصيانة", folder: "C22–C24 · Requests, account, addresses-html", file: "C11-Account.dc.html" },
  { id: "branches", section: "customer", number: "C25–27", name: "الفروع والإشعارات والدعم", folder: "C25–C27 · Branches, notifications, support-html", file: "C12-Branches.dc.html" },
  { id: "states", section: "customer", number: "C28", name: "حالات النظام", folder: "C28 · System states-html", file: "C13-States.dc.html" },
  { id: "admin-login", section: "admin", number: "A1", name: "دخول الإدارة", folder: "A1 · Admin login-html", file: "A01-Login.dc.html" },
  { id: "dashboard", section: "admin", number: "A2", name: "لوحة التحكم", folder: "A2 · Dashboard-html", file: "A02-Dashboard.dc.html" },
  { id: "admin-orders", section: "admin", number: "A3", name: "الطلبات", folder: "A3 · Orders list-html", file: "A03-Orders.dc.html" },
  { id: "order-details", section: "admin", number: "A4", name: "تفاصيل الطلب", folder: "A4 · Order details (status confirmation shown)-html", file: "A04-OrderDetails.dc.html" },
  { id: "products", section: "admin", number: "A5", name: "المنتجات", folder: "A5 · Product catalog-html", file: "A05-Products.dc.html" },
  { id: "product-form", section: "admin", number: "A6", name: "إضافة وتعديل منتج", folder: "A6 · Add edit product-html", file: "A06-ProductForm.dc.html" },
  { id: "categories", section: "admin", number: "A7", name: "الأقسام", folder: "A7 · Categories-html", file: "A07-Categories.dc.html" },
  { id: "admin-branches", section: "admin", number: "A8", name: "إدارة الفروع", folder: "A8 · Branch management-html", file: "A08-Branches.dc.html" },
  { id: "inventory", section: "admin", number: "A9", name: "مخزون الفروع", folder: "A9 · Branch inventory (adjust dialog shown)-html", file: "A09-Inventory.dc.html" },
  { id: "delivery-settings", section: "admin", number: "A10", name: "إعدادات التوصيل", folder: "A10 · Delivery settings-html", file: "A10-Delivery.dc.html" },
  { id: "delivery-ops", section: "admin", number: "A11", name: "عمليات التوصيل", folder: "A11 · Delivery operations-html", file: "A11-DeliveryOps.dc.html" },
  { id: "admin-maintenance", section: "admin", number: "A12", name: "الصيانة", folder: "A12 · Maintenance overview-html", file: "A12-Maintenance.dc.html" },
  { id: "maintenance-request", section: "admin", number: "A13", name: "طلب صيانة", folder: "A13 · Maintenance request-html", file: "A13-MaintDetails.dc.html" },
  { id: "promotions", section: "admin", number: "A14", name: "العروض", folder: "A14 · Promotions-html", file: "A14-Promotions.dc.html" },
  { id: "customers", section: "admin", number: "A15", name: "العملاء", folder: "A15 · Customers-html", file: "A15-Customers.dc.html" },
  { id: "reports", section: "admin", number: "A16", name: "التقارير", folder: "A16 · Reports-html", file: "A16-Reports.dc.html" },
  { id: "users", section: "admin", number: "A17", name: "المستخدمون والصلاحيات", folder: "A17 · Users & permissions-html", file: "A17-Users.dc.html" },
  { id: "settings", section: "admin", number: "A18", name: "إعدادات المتجر", folder: "A18 · Store settings-html", file: "A18-Settings.dc.html" },
  { id: "tablet", section: "admin", number: "A19", name: "واجهة الإدارة على الجهاز اللوحي", folder: "Admin · tablet layout-html", file: "A19-Tablet.dc.html" },
  { id: "journey-map", section: "journeys", number: "A–I", name: "الرحلات المتصلة", folder: "Journeys A–I-html", file: "F01-Flows.dc.html" }
];

const sectionNav = document.querySelector("#section-nav");
const sectionCards = document.querySelector("#section-cards");
const screenGrid = document.querySelector("#screen-grid");
const searchInput = document.querySelector("#search");
const catalog = document.querySelector("#catalog");
const preview = document.querySelector("#preview");
const frame = document.querySelector("#screen-frame");
let activeSection = "all";
let searchTerm = "";

function screenPath(screen) {
  const section = sections.find((item) => item.id === screen.section);
  return `${section.folder}/${screen.folder}/${screen.file}`;
}

function buildCatalog() {
  const allLink = document.createElement("a");
  allLink.className = "nav-link";
  allLink.href = "#home";
  allLink.dataset.section = "all";
  allLink.innerHTML = '<span class="nav-icon" aria-hidden="true">⌂</span><span>كل الشاشات</span><span class="nav-count"></span>';
  sectionNav.append(allLink);

  sections.forEach((section) => {
    const count = screens.filter((screen) => screen.section === section.id).length;
    const link = document.createElement("a");
    link.className = "nav-link";
    link.href = `#section=${section.id}`;
    link.dataset.section = section.id;
    link.innerHTML = `<span class="nav-icon" aria-hidden="true">${section.icon}</span><span>${section.shortName}</span><span class="nav-count">${count}</span>`;
    sectionNav.append(link);

    const card = document.createElement("button");
    card.className = "section-card";
    card.type = "button";
    card.dataset.section = section.id;
    card.innerHTML = `<span class="section-card-icon" aria-hidden="true">${section.icon}</span><strong>${section.name}</strong><small>${section.description} · ${count} شاشات</small>`;
    card.addEventListener("click", () => { location.hash = `section=${section.id}`; });
    sectionCards.append(card);
  });

  document.querySelector("#screen-count").textContent = `${screens.length} شاشة`;
}

function renderScreens() {
  const visibleScreens = screens.filter((screen) => {
    const matchesSection = activeSection === "all" || screen.section === activeSection;
    const text = `${screen.name} ${screen.number} ${screen.folder}`.toLocaleLowerCase();
    return matchesSection && text.includes(searchTerm.toLocaleLowerCase());
  });
  screenGrid.replaceChildren();

  visibleScreens.forEach((screen) => {
    const card = document.createElement("a");
    card.className = "screen-card";
    card.href = `#screen=${screen.id}`;
    card.innerHTML = `<span class="screen-number">${screen.number}</span><span class="screen-card-copy"><strong>${screen.name}</strong><small>${sections.find((section) => section.id === screen.section).shortName}</small></span><span class="card-arrow" aria-hidden="true">←</span>`;
    screenGrid.append(card);
  });

  document.querySelector("#result-count").textContent = `${visibleScreens.length} من ${screens.length}`;
  document.querySelector("#empty-state").hidden = visibleScreens.length > 0;
}

function renderRoute() {
  const params = new URLSearchParams(location.hash.slice(1));
  const screen = screens.find((item) => item.id === params.get("screen"));
  const requestedSection = params.get("section");
  activeSection = sections.some((item) => item.id === requestedSection) ? requestedSection : "all";

  if (screen) {
    catalog.hidden = true;
    preview.hidden = false;
    document.querySelector("#preview-name").textContent = screen.name;
    document.querySelector("#preview-section").textContent = sections.find((item) => item.id === screen.section).shortName;
    const path = screenPath(screen);
    const url = new URL(path.split("/").map(encodeURIComponent).join("/"), location.href);
    if (frame.src !== url.href) frame.src = url.href;
    document.querySelector("#open-original").href = url.href;
  } else {
    catalog.hidden = false;
    preview.hidden = true;
    document.querySelector("#list-eyebrow").textContent = activeSection === "all" ? "المكتبة الكاملة" : sections.find((item) => item.id === activeSection).shortName;
    document.querySelector("#list-title").textContent = activeSection === "all" ? "استكشف الشاشات" : sections.find((item) => item.id === activeSection).name;
    sectionCards.hidden = activeSection !== "all" || searchTerm.length > 0;
    document.querySelectorAll(".nav-link").forEach((link) => {
      if (link.dataset.section === activeSection) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    renderScreens();
  }
}

buildCatalog();
renderRoute();
window.addEventListener("hashchange", renderRoute);
searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value.trim();
  if (location.hash.startsWith("#screen=")) location.hash = "#home";
  else renderRoute();
});
document.querySelector("#back-button").addEventListener("click", () => {
  const screen = screens.find((item) => item.id === new URLSearchParams(location.hash.slice(1)).get("screen"));
  location.hash = screen ? `section=${screen.section}` : "home";
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== searchInput && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape" && !preview.hidden) location.hash = "#home";
});
