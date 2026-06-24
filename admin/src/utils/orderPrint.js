import { dateTime, money, shortId, titleCase } from "./format";

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#039;",
}[character]));

const addressMarkup = (address = {}) => [address.line1, address.line2, address.area, address.city].filter(Boolean).map(escapeHtml).join("<br />") || "-";

const printDocument = (title, content) => {
  const printWindow = window.open("", "_blank", "width=760,height=900");
  if (!printWindow) {
    window.alert("Please allow pop-ups to print this receipt.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>@page{margin:12mm}*{box-sizing:border-box}body{margin:0;color:#172033;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.45}.document{max-width:720px;margin:0 auto}.header{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #b91c1c;padding-bottom:16px}.brand{font-size:22px;font-weight:800;color:#991b1b}.eyebrow{color:#64748b;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.title{margin:4px 0 0;font-size:18px}.order-number{text-align:right;font-size:16px;font-weight:800}.muted{color:#64748b}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:22px 0}.panel{border:1px solid #dbe1ea;border-radius:6px;padding:13px}.label{display:block;color:#64748b;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.panel strong{display:block;margin-top:6px}.items{width:100%;border-collapse:collapse;margin-top:20px}.items th{border-bottom:1px solid #cbd5e1;color:#64748b;font-size:10px;letter-spacing:.08em;padding:9px 6px;text-align:left;text-transform:uppercase}.items td{border-bottom:1px solid #e2e8f0;padding:11px 6px;vertical-align:top}.right{text-align:right!important}.note{margin-top:5px;color:#92400e;font-size:11px}.totals{margin:20px 0 0 auto;width:260px}.total-line{display:flex;justify-content:space-between;padding:5px 0}.grand{border-top:1px solid #cbd5e1;margin-top:5px;padding-top:10px;color:#991b1b;font-size:16px;font-weight:800}.footer{border-top:1px solid #dbe1ea;margin-top:28px;padding-top:12px;color:#64748b;font-size:11px}.kitchen{font-size:15px}.kitchen .header{border-color:#172033}.kitchen .brand{color:#172033}.kitchen-items{list-style:none;margin:22px 0 0;padding:0}.kitchen-items li{border-bottom:2px solid #172033;padding:14px 0}.quantity{display:inline-block;min-width:38px;font-size:20px;font-weight:800}.item-name{font-size:18px;font-weight:800}.option{margin-left:8px;color:#475569;font-size:13px}.kitchen-note{margin:9px 0 0 46px;border-left:3px solid #b91c1c;padding-left:9px;color:#7f1d1d;font-weight:700}.delivery-note{margin-top:14px;border:1px solid #f59e0b;background:#fffbeb;padding:10px;color:#78350f}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>${content}</body></html>`);
  printWindow.document.close();
  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);
};

export const printOrderInvoice = (order) => {
  const address = order.deliveryAddress || {};
  const items = order.items || [];
  const itemRows = items.map((item) => `<tr><td><strong>${escapeHtml(item.name || "Menu item")}</strong>${item.optionName ? `<div class="muted">${escapeHtml(item.optionName)}</div>` : ""}${item.specialInstructions ? `<div class="note">Note: ${escapeHtml(item.specialInstructions)}</div>` : ""}</td><td class="right">${Number(item.quantity || 0)}</td><td class="right">${escapeHtml(money(item.price))}</td><td class="right"><strong>${escapeHtml(money(Number(item.price || 0) * Number(item.quantity || 0)))}</strong></td></tr>`).join("");
  const content = `<main class="document"><header class="header"><div><div class="brand">Harmain Restaurant</div><div class="eyebrow">Customer invoice</div><h1 class="title">Order receipt</h1></div><div><div class="order-number">${escapeHtml(shortId(order._id))}</div><div class="muted">${escapeHtml(dateTime(order.createdAt))}</div></div></header><section class="grid"><div class="panel"><span class="label">Customer</span><strong>${escapeHtml(order.user?.name || address.fullName || "Customer")}</strong><div class="muted">${escapeHtml(order.user?.email || "")}</div><div class="muted">${escapeHtml(address.phone || "")}</div></div><div class="panel"><span class="label">Delivery address</span><strong>${escapeHtml(address.fullName || "-")}</strong><div class="muted">${addressMarkup(address)}</div>${address.instructions ? `<div class="note">Delivery note: ${escapeHtml(address.instructions)}</div>` : ""}</div></section><table class="items"><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Total</th></tr></thead><tbody>${itemRows}</tbody></table><section class="totals"><div class="total-line"><span>Subtotal</span><strong>${escapeHtml(money(order.subtotal))}</strong></div><div class="total-line"><span>Delivery fee</span><strong>${escapeHtml(money(order.deliveryFee))}</strong></div><div class="total-line grand"><span>Grand total</span><span>${escapeHtml(money(order.total))}</span></div></section><footer class="footer">Payment: ${escapeHtml(titleCase(order.paymentStatus || "pending"))} | Method: ${escapeHtml(titleCase(order.paymentMethod || "cash_on_delivery"))}</footer></main>`;
  printDocument(`Invoice ${shortId(order._id)}`, content);
};

export const printKitchenReceipt = (order) => {
  const address = order.deliveryAddress || {};
  const items = order.items || [];
  const itemRows = items.map((item) => `<li><span class="quantity">x${Number(item.quantity || 0)}</span><span class="item-name">${escapeHtml(item.name || "Menu item")}</span>${item.optionName ? `<span class="option">${escapeHtml(item.optionName)}</span>` : ""}${item.specialInstructions ? `<div class="kitchen-note">Special instruction: ${escapeHtml(item.specialInstructions)}</div>` : ""}</li>`).join("");
  const content = `<main class="document kitchen"><header class="header"><div><div class="brand">Harmain Restaurant</div><div class="eyebrow">Kitchen receipt</div><h1 class="title">Prepare this order</h1></div><div><div class="order-number">${escapeHtml(shortId(order._id))}</div><div class="muted">${escapeHtml(dateTime(order.createdAt))}</div></div></header><section class="grid"><div class="panel"><span class="label">Customer</span><strong>${escapeHtml(order.user?.name || address.fullName || "Customer")}</strong><div class="muted">${escapeHtml(address.phone || "")}</div></div><div class="panel"><span class="label">Delivery</span><strong>${addressMarkup(address)}</strong></div></section><ol class="kitchen-items">${itemRows}</ol>${address.instructions ? `<div class="delivery-note"><strong>Delivery instruction:</strong> ${escapeHtml(address.instructions)}</div>` : ""}<footer class="footer">Order status: ${escapeHtml(titleCase(order.orderStatus || "placed"))}</footer></main>`;
  printDocument(`Kitchen receipt ${shortId(order._id)}`, content);
};
