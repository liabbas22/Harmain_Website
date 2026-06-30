import { dateTime, money, shortId, titleCase } from "./format";

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#039;",
}[character]));

const addressMarkup = (address = {}) => [address.line1, address.line2, address.area, address.city].filter(Boolean).map(escapeHtml).join("<br />") || "-";

const printStyles = `
  @page{margin:12mm}
  *{box-sizing:border-box}
  body{margin:0;color:#172033;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.45;background:#fff}
  .document{max-width:720px;margin:0 auto}
  .header{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #b91c1c;padding-bottom:16px}
  .brand{font-size:22px;font-weight:800;color:#991b1b}
  .eyebrow{color:#64748b;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
  .title{margin:4px 0 0;font-size:18px}
  .order-number{text-align:right;font-size:16px;font-weight:800}
  .muted{color:#64748b}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:22px 0}
  .panel{border:1px solid #dbe1ea;border-radius:6px;padding:13px}
  .label{display:block;color:#64748b;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
  .panel strong{display:block;margin-top:6px}
  .items{width:100%;border-collapse:collapse;margin-top:20px}
  .items th{border-bottom:1px solid #cbd5e1;color:#64748b;font-size:10px;letter-spacing:.08em;padding:9px 6px;text-align:left;text-transform:uppercase}
  .items td{border-bottom:1px solid #e2e8f0;padding:11px 6px;vertical-align:top}
  .right{text-align:right!important}
  .note{margin-top:5px;color:#92400e;font-size:11px}
  .totals{margin:20px 0 0 auto;width:260px}
  .total-line{display:flex;justify-content:space-between;padding:5px 0}
  .grand{border-top:1px solid #cbd5e1;margin-top:5px;padding-top:10px;color:#991b1b;font-size:16px;font-weight:800}
  .footer{border-top:1px solid #dbe1ea;margin-top:28px;padding-top:12px;color:#64748b;font-size:11px}
  .kitchen{font-size:15px}
  .kitchen .header{align-items:stretch;border:0;border-radius:10px;background:#111827;color:#fff;padding:16px 18px}
  .kitchen .brand{color:#fff;font-size:24px}
  .kitchen .eyebrow{color:#fecaca}
  .kitchen .title{font-size:20px}
  .kitchen .order-number{border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:10px 12px;text-align:right}
  .kitchen .muted{color:#cbd5e1}
  .kitchen .grid{margin:18px 0;gap:12px}
  .kitchen .panel{border-color:#cbd5e1;border-radius:8px;background:#f8fafc}
  .kitchen-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0 0}
  .summary-card{border:1px solid #cbd5e1;border-radius:8px;padding:10px;background:#fff}
  .summary-card b{display:block;margin-top:3px;font-size:16px;color:#111827}
  .kitchen-section-title{margin:20px 0 8px;color:#111827;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
  .kitchen-items{list-style:none;margin:0;padding:0}
  .kitchen-items>li{break-inside:avoid;border:2px solid #111827;border-radius:10px;margin-bottom:10px;padding:12px;background:#fff}
  .kitchen-item-main{display:grid;grid-template-columns:58px minmax(0,1fr);gap:12px;align-items:start}
  .quantity{display:grid;min-height:46px;place-items:center;border-radius:8px;background:#111827;color:#fff;font-size:20px;font-weight:900}
  .item-name{display:block;font-size:18px;font-weight:900;color:#111827}
  .option{display:inline-block;margin-top:6px;border:1px solid #cbd5e1;border-radius:999px;background:#f8fafc;padding:3px 9px;color:#475569;font-size:12px;font-weight:800}
  .combo-includes{margin:10px 0 0 70px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;padding:10px}
  .combo-includes strong{display:block;margin-bottom:6px;color:#111827;font-size:11px;letter-spacing:.1em;text-transform:uppercase}
  .combo-includes ul{list-style:none;margin:0;padding:0}
  .combo-includes li{display:flex;gap:9px;border:0;padding:4px 0}
  .combo-includes span{font-weight:900;min-width:38px;color:#111827}
  .combo-includes em{color:#475569;font-style:normal;font-weight:700}
  .kitchen-note{margin:8px 0 0 70px;border:1px solid #fed7aa;border-left:5px solid #b91c1c;border-radius:8px;background:#fff7ed;padding:8px 10px;color:#7f1d1d;font-weight:800}
  .delivery-note{margin-top:14px;border:1px solid #f59e0b;border-radius:8px;background:#fffbeb;padding:12px;color:#78350f}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
`;

const printDocument = (title, content) => {
  const printWindow = window.open("", "_blank", "width=760,height=900");
  if (!printWindow) {
    window.alert("Please allow pop-ups to print this receipt.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>${printStyles}</style></head><body>${content}</body></html>`);
  printWindow.document.close();
  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);
};

export const printOrderInvoice = (order) => {
  const address = order.deliveryAddress || {};
  const items = order.items || [];
  const itemRows = items.map((item) => {
    const paidQuantity = Number(item.quantity || 0);
    const freeQuantity = Number(item.freeQuantity || 0);
    const totalQuantity = paidQuantity + freeQuantity;
    const addOns = (item.addOns || []).length ? `<div class="muted">Add-ons: ${(item.addOns || []).map((addOn) => `${escapeHtml(addOn.name)} (+${escapeHtml(money(addOn.price))})`).join(", ")}</div>` : "";
    return `<tr><td><strong>${escapeHtml(item.name || "Menu item")}</strong>${item.optionName ? `<div class="muted">${escapeHtml(item.optionName)}</div>` : ""}${addOns}${freeQuantity > 0 ? `<div class="muted">+ ${freeQuantity} free item${freeQuantity > 1 ? "s" : ""}</div>` : ""}${item.specialInstructions ? `<div class="note">Note: ${escapeHtml(item.specialInstructions)}</div>` : ""}</td><td class="right">${paidQuantity}${freeQuantity > 0 ? ` + ${freeQuantity} free` : ""}</td><td class="right">${escapeHtml(money(item.price))}</td><td class="right"><strong>${escapeHtml(money(Number(item.price || 0) * totalQuantity))}</strong></td></tr>`;
  }).join("");
  const hasOfferBreakdownLine = (order.offerBreakdown || []).some((detail) => order.offer?.name && detail.offerName === order.offer.name && Number(detail.discount || 0) > 0);
  const couponLine = order.coupon?.code ? `<div class="total-line muted"><span>Coupon (${escapeHtml(order.coupon.code)})</span><strong>- ${escapeHtml(money(order.coupon.discount))}</strong></div>` : "";
  const offerLine = order.offer?.name && !hasOfferBreakdownLine ? `<div class="total-line muted"><span>Offer (${escapeHtml(order.offer.name)})</span><strong>- ${escapeHtml(money(order.offer.discount))}</strong></div>` : "";
  const loyaltyLine = order.loyaltyDiscount ? `<div class="total-line muted"><span>${escapeHtml(order.loyaltyDiscount.label)}</span><strong>- ${escapeHtml(money(order.loyaltyDiscount.discount))}</strong></div>` : "";
  const offerBreakdown = (order.offerBreakdown || []).map((detail) => `<div class="total-line muted"><span>${Number(detail.quantity || 0)} x ${escapeHtml(detail.productName || "Menu item")}${Number(detail.freeQuantity || 0) > 0 ? ` + ${Number(detail.freeQuantity || 0)} free` : ""} - ${escapeHtml(detail.offerName || "Offer")}</span><strong>- ${escapeHtml(money(detail.discount))}</strong></div>`).join("");
  const discountLine = Number(order.discount) > 0 ? `<div class="total-line"><span>Total savings</span><strong>- ${escapeHtml(money(order.discount))}</strong></div>${couponLine}${offerLine}${loyaltyLine}${offerBreakdown}` : "";
  const content = `<main class="document"><header class="header"><div><div class="brand">Harmain Restaurant</div><div class="eyebrow">Customer invoice</div><h1 class="title">Order receipt</h1></div><div><div class="order-number">${escapeHtml(shortId(order._id))}</div><div class="muted">${escapeHtml(dateTime(order.createdAt))}</div></div></header><section class="grid"><div class="panel"><span class="label">Customer</span><strong>${escapeHtml(order.user?.name || address.fullName || "Customer")}</strong><div class="muted">${escapeHtml(order.user?.email || "")}</div><div class="muted">${escapeHtml(address.phone || "")}</div></div><div class="panel"><span class="label">Delivery address</span><strong>${escapeHtml(address.fullName || "-")}</strong><div class="muted">${addressMarkup(address)}</div>${address.instructions ? `<div class="note">Delivery note: ${escapeHtml(address.instructions)}</div>` : ""}</div></section><table class="items"><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Total</th></tr></thead><tbody>${itemRows}</tbody></table><section class="totals"><div class="total-line"><span>Subtotal</span><strong>${escapeHtml(money(order.subtotal))}</strong></div>${discountLine}<div class="total-line"><span>Delivery fee</span><strong>${escapeHtml(money(order.deliveryFee))}</strong></div><div class="total-line grand"><span>Grand total</span><span>${escapeHtml(money(order.total))}</span></div></section><footer class="footer">Payment: ${escapeHtml(titleCase(order.paymentStatus || "pending"))} | Method: ${escapeHtml(titleCase(order.paymentMethod || "cash_on_delivery"))}</footer></main>`;
  printDocument(`Invoice ${shortId(order._id)}`, content);
};

export const printKitchenReceipt = (order) => {
  const address = order.deliveryAddress || {};
  const items = order.items || [];
  const comboIncludesMarkup = (item, parentQuantity) => {
    const comboItems = item.comboItems || [];
    if (!comboItems.length) return "";
    const rows = comboItems.map((comboItem) => {
      const quantity = Math.max(1, Number(comboItem.quantity || 1)) * parentQuantity;
      const optionName = comboItem.optionName
        ? ` <em>Size: ${escapeHtml(comboItem.optionName)}</em>`
        : "";
      return `<li><span>x${quantity}</span><b>${escapeHtml(comboItem.name || "Combo item")}${optionName}</b></li>`;
    }).join("");
    return `<div class="combo-includes"><strong>Deal includes</strong><ul>${rows}</ul></div>`;
  };
  const itemRows = items.map((item) => {
    const paidQuantity = Number(item.quantity || 0);
    const freeQuantity = Number(item.freeQuantity || 0);
    const totalQuantity = paidQuantity + freeQuantity;
    const addOns = (item.addOns || []).length ? `<div class="kitchen-note">Add-ons: ${(item.addOns || []).map((addOn) => escapeHtml(addOn.name)).join(", ")}</div>` : "";
    const comboItems = comboIncludesMarkup(item, totalQuantity);
    return `<li><div class="kitchen-item-main"><span class="quantity">x${totalQuantity}</span><div><span class="item-name">${escapeHtml(item.name || "Menu item")}</span>${item.optionName ? `<span class="option">Size: ${escapeHtml(item.optionName)}</span>` : ""}${freeQuantity > 0 ? `<span class="option">${freeQuantity} free included</span>` : ""}</div></div>${comboItems}${addOns}${item.specialInstructions ? `<div class="kitchen-note">Special instruction: ${escapeHtml(item.specialInstructions)}</div>` : ""}</li>`;
  }).join("");
  const totalPrepItems = items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0) + Number(item.freeQuantity || 0),
    0,
  );
  const content = `<main class="document kitchen"><header class="header"><div><div class="brand">Harmain Restaurant</div><div class="eyebrow">Kitchen receipt</div><h1 class="title">Prepare this order</h1></div><div><div class="order-number">${escapeHtml(shortId(order._id))}</div><div class="muted">${escapeHtml(dateTime(order.createdAt))}</div></div></header><section class="kitchen-summary"><div class="summary-card"><span class="label">Status</span><b>${escapeHtml(titleCase(order.orderStatus || "placed"))}</b></div><div class="summary-card"><span class="label">Prep items</span><b>${totalPrepItems}</b></div><div class="summary-card"><span class="label">Payment</span><b>${escapeHtml(titleCase(order.paymentStatus || "pending"))}</b></div></section><section class="grid"><div class="panel"><span class="label">Customer</span><strong>${escapeHtml(order.user?.name || address.fullName || "Customer")}</strong><div class="muted">${escapeHtml(address.phone || "")}</div></div><div class="panel"><span class="label">Delivery</span><strong>${addressMarkup(address)}</strong></div></section><div class="kitchen-section-title">Items to prepare</div><ol class="kitchen-items">${itemRows}</ol>${address.instructions ? `<div class="delivery-note"><strong>Delivery instruction:</strong> ${escapeHtml(address.instructions)}</div>` : ""}<footer class="footer">Printed for kitchen operations. Check quantity, size, add-ons and special instructions before dispatch.</footer></main>`;
  printDocument(`Kitchen receipt ${shortId(order._id)}`, content);
};
