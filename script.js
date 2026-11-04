const BOT_TOKEN = "9138978422:AAH7w6LuaT47oKdbqR_uGuRZnoVatAaeItk";
        const CHAT_ID = "-1004313492726";
        const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwz1l1VrVNEKqRzjGUQUboQM518DUgMSZB6IBGUD0B0sovKzfSVTKP-wij8MDk1GSR3nw/exec";

        let discount = 0;
        let appliedCouponCode = '';
        let isTrashOpen = false;
        let countdownInterval = null;
        let currentOrderType = 'manga';
        const COUPON_USAGE_KEY = 'lumen_coupon_usage';
        const COUPONS = {
            WELCOME500: { discount: 500, expiry: "2026-12-31", usageType: "one_time" },
            COHORT1000: { discount: 1000, expiry: "2026-12-31", usageType: "limited", maxUses: 20 },
            FAN1500: { discount: 1500, expiry: "2026-12-31", usageType: "multi" }
        };

        const PLAN_DATA = {
            manga: {
                label: 'Doujinshi',
                icon: 'fa-book-open',
                plans: [
                    { value: '5000', days: 30, label: 'Doujinshi Basic — 5,000 Ks' },
                    { value: '12000', days: 90, label: 'Doujinshi Pro — 12,000 Ks' },
                    { value: '24000', days: 180, label: 'Doujinshi Premium — 24,000 Ks' },
                    { value: '55000', days: 3650, label: 'Doujinshi Lifetime — 55,000 Ks' }
                ]
            },
            manhwa: {
                label: 'Manhwa',
                icon: 'fa-book',
                plans: [
                    { value: '5000', days: 30, label: 'Manhwa Basic — 5,000 Ks' },
                    { value: '12000', days: 90, label: 'Manhwa Pro — 12,000 Ks' },
                    { value: '24000', days: 180, label: 'Manhwa Premium — 24,000 Ks' },
                    { value: '55000', days: 3650, label: 'Manhwa Lifetime — 55,000 Ks' }
                ]
            },
            hentai: {
                label: 'Hentai',
                icon: 'fa-film',
                plans: [
                    { value: '6000', days: 30, label: 'Hentai Basic — 6,000 Ks' },
                    { value: '15000', days: 90, label: 'Hentai Pro — 15,000 Ks' },
                    { value: '28000', days: 180, label: 'Hentai Premium — 28,000 Ks' },
                    { value: '50000', days: 3650, label: 'Hentai Golden — 50,000 Ks' }
                ]
            }
        };

        const PAYMENT_METHODS = {
            kpay: {
                label: "K Pay",
                number: "09956726051",
                accountName: "ThaDoeThura (K Pay)",
                note: "ကျောင်းသားများအတွက် K Pay ဖြင့် ငွေလွှဲနိုင်ပါသည်။",
                qrSrc: "https://i.postimg.cc/m2Rjxyjf/photo-2026-06-29-22-32-04.jpg",
                hasQr: true
            },
            aya: {
                label: "AYA Pay",
                number: "09956726051",
                accountName: "ThaDoeThura (AYA Pay)",
                note: "ကျောင်းသားများအတွက် AYA Pay ဖြင့် ငွေလွှဲနိုင်ပါသည်။",
                qrSrc: "https://i.postimg.cc/PrhyGQ4B/photo-2026-06-29-22-32-06.jpg",
                hasQr: true
            },
            wave: {
                label: "Wave Pay",
                number: "09956726051",
                accountName: "ThaDoeThura (Wave Pay)",
                note: "ကျောင်းသားများအတွက် Wave Pay ဖြင့် ငွေလွှဲနိုင်ပါသည်။",
                qrSrc: "https://i.postimg.cc/NfYDhk43/photo-2026-06-29-22-32-05.jpg",
                hasQr: true
            }
        };

        // SELECT ORDER TYPE
        function selectOrderType(type) {
            currentOrderType = type;

            $('#btnManga').removeClass('active-manga active-manhwa active-hentai');
            $('#btnManhwa').removeClass('active-manga active-manhwa active-hentai');
            $('#btnHentai').removeClass('active-manga active-manhwa active-hentai');

            if (type === 'manga') {
                $('#btnManga').addClass('active-manga');
            } else if (type === 'manhwa') {
                $('#btnManhwa').addClass('active-manhwa');
            } else if (type === 'hentai') {
                $('#btnHentai').addClass('active-hentai');
            }

            if (type === 'manga') {
                $('.manga-plan').show();
                $('.manhwa-plan').hide();
                $('.hentai-plan').hide();
            } else if (type === 'manhwa') {
                $('.manga-plan').hide();
                $('.manhwa-plan').show();
                $('.hentai-plan').hide();
            } else if (type === 'hentai') {
                $('.manga-plan').hide();
                $('.manhwa-plan').hide();
                $('.hentai-plan').show();
            }

            const data = PLAN_DATA[type];
            $('#orderTypeIcon').removeClass('fa-book-open fa-book fa-film').addClass(data.icon);
            $('#orderTypeText').text(data.label);

            let borderColor = 'var(--manga-color)';
            if (type === 'manhwa') borderColor = 'var(--manhwa-color)';
            else if (type === 'hentai') borderColor = 'var(--hentai-color)';
            $('#displayOrderType').css('border-color', borderColor);

            updatePlanDropdown(type);
            $('.ticket-grid .ticket').removeClass('selected');
            updatePrice();
        }

        function updatePlanDropdown(type) {
            const data = PLAN_DATA[type];
            const $select = $('#plan');
            $select.empty();
            data.plans.forEach((p, index) => {
                const selected = index === 0 ? 'selected' : '';
                $select.append(`<option value="${p.value}" data-days="${p.days}" data-type="${type}" ${selected}>${p.label}</option>`);
            });
            updatePrice();
        }

        $(document).ready(function () {
            selectOrderType('manga');

            displayOrderHistory();
            displayTrashHistory();
            displayStats();
            updateShopStatus();
            updatePrice();
            updatePaymentInfo();

            if (countdownInterval) clearInterval(countdownInterval);
            countdownInterval = setInterval(function () {
                updateAllCountdowns();
            }, 1000);

            setInterval(syncHistoryWithServer, 10000);
            setInterval(displayStats, 5000);

            $(window).on('scroll', function () {
                if ($(window).scrollTop() > 50) {
                    $('#topbar').addClass('scrolled');
                } else {
                    $('#topbar').removeClass('scrolled');
                }
            });

            $('.ticket-grid .ticket').on('click', function () {
                const plan = $(this).data('plan');
                const type = $(this).data('type');
                if (type && type !== currentOrderType) return;
                selectPlan(plan, true);
            });
            $('.ticket-grid .ticket').on('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const plan = $(this).data('plan');
                    const type = $(this).data('type');
                    if (type && type !== currentOrderType) return;
                    selectPlan(plan, true);
                }
            });
            $('#paymentMethod').on('change', updatePaymentInfo);
            $('#couponInput').on('input', handleCouponInputChange);

            $('.nav-tab').on('click', function () {
                const targetId = $(this).data('target');
                $('.nav-tab').removeClass('active');
                $(this).addClass('active');
                const el = document.getElementById(targetId);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                if (targetId === 'profile-heading-wrap') {
                    isTrashOpen = false;
                    $('#trashBox').hide();
                    displayOrderHistory();
                }
            });

            $('.faq-q').click(function () { $(this).parent().toggleClass('active').siblings().removeClass('active'); });
            $('#togglePass').click(function () {
                const input = $('#pass');
                if (input.attr('type') === 'password') {
                    input.attr('type', 'text');
                    $(this).removeClass('fa-eye-slash').addClass('fa-eye').css('color', 'var(--text-primary)');
                } else {
                    input.attr('type', 'password');
                    $(this).removeClass('fa-eye').addClass('fa-eye-slash').css('color', 'var(--text-muted)');
                }
            });
        });

        function updateShopStatus() {
            const hour = new Date().getHours();
            const isOpen = (hour >= 9 && hour < 24);
            if (isOpen) {
                $('#shop-status-ui').html('<div class="status-chip status-on">● Open</div>');
                $('#submitBtn').prop('disabled', false).text("Confirm enrollment");
            } else {
                $('#shop-status-ui').html('<div class="status-chip status-off">● Closed · 9AM–11PM</div>');
                $('#submitBtn').prop('disabled', true).text("Enrollment closed");
            }
        }

        function syncSelectedPlanCard() {
            const selectedPlan = String($('#plan').val() || '');
            $('.ticket-grid .ticket').each(function () {
                $(this).toggleClass('selected', String($(this).data('plan')) === selectedPlan && $(this).data('type') === currentOrderType);
            });
        }

        function selectPlan(planValue, shouldScroll) {
            const v = String(planValue || '');
            if (!$(`#plan option[value="${v}"]`).length) return;
            $('#plan').val(v);
            updatePrice();
            if (shouldScroll) {
                $('.nav-tab').removeClass('active');
                $('.nav-tab[data-target="order-heading"]').addClass('active');
                const el = document.getElementById('order-heading');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        function getPlanDaysByValue(planValue) {
            const v = String(planValue || '');
            const opt = $(`#plan option[value="${v}"]`);
            const d = parseInt(opt.attr('data-days'), 10);
            if (!Number.isNaN(d)) return d;
            return 30;
        }

        function getSelectedPayment() {
            return PAYMENT_METHODS[$('#paymentMethod').val()] || PAYMENT_METHODS.kpay;
        }

        function updatePaymentInfo() {
            const p = getSelectedPayment();
            $('#paymentLabel').text(`${p.label} Transfer`);
            $('#paymentNumber').text(p.number);
            $('#paymentName').text(p.accountName);
            $('#paymentNote').text(p.note);
            $('#paymentDetail').toggleClass('no-qr', !p.hasQr);
            if (p.hasQr && p.qrSrc) {
                $('#paymentQr').attr('src', p.qrSrc).attr('alt', `${p.label} QR Code`).show();
            } else {
                $('#paymentQr').hide();
            }
        }

        function copySelectedPayment() {
            copyToClipboard(getSelectedPayment().number);
        }

        function openTrashBox() {
            isTrashOpen = true;
            $('#trashBox').show();
            displayTrashHistory();
            setTimeout(function () {
                const el = document.getElementById('trashBox');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }

        function updatePrice() {
            let base = parseInt($('#plan').val(), 10) || 0;
            let final = Math.max(base - discount, 0);
            $('#price-display').html(discount > 0 ? `<span class="strike">${base.toLocaleString()} Ks</span> ${final.toLocaleString()} Ks` : `Total: ${final.toLocaleString()} Ks`);
            $('#formCard').toggleClass('glow', base >= 10000);
            syncSelectedPlanCard();
        }

        function getFinalAmount() {
            const basePrice = parseInt($('#plan').val()) || 0;
            const discountAmount = Math.max(discount, 0);
            return { basePrice, discountAmount, finalPrice: Math.max(basePrice - discountAmount, 0) };
        }

        function normalizeCouponCode(code) { return String(code || '').trim().toUpperCase(); }

        function getCouponUsageStore() { return JSON.parse(localStorage.getItem(COUPON_USAGE_KEY)) || {}; }

        function saveCouponUsageStore(s) { localStorage.setItem(COUPON_USAGE_KEY, JSON.stringify(s)); }

        function getCouponMaxUses(c) {
            if (!c) return 0;
            if (c.usageType === 'one_time') return 1;
            if (c.usageType === 'limited') return Math.max(parseInt(c.maxUses, 10) || 0, 0);
            return Infinity;
        }

        function getCouponUsedCount(code) {
            const n = normalizeCouponCode(code);
            return Math.max(parseInt(getCouponUsageStore()[n], 10) || 0, 0);
        }

        function getCouponRemainingUses(code, c) {
            const m = getCouponMaxUses(c);
            if (!Number.isFinite(m)) return Infinity;
            return Math.max(m - getCouponUsedCount(code), 0);
        }

        function isCouponExpired(c) {
            if (!c || !c.expiry) return false;
            return Date.now() > new Date(`${c.expiry}T23:59:59`).getTime();
        }

        function getCouponStatus(code) {
            const n = normalizeCouponCode(code);
            if (!n) return { valid: false, reason: 'empty' };
            const c = COUPONS[n];
            if (!c) return { valid: false, reason: 'invalid', code: n };
            if (isCouponExpired(c)) return { valid: false, reason: 'expired', code: n, coupon: c };
            const remaining = getCouponRemainingUses(n, c);
            if (c.usageType === 'one_time' && remaining <= 0) return { valid: false, reason: 'used', code: n, coupon: c, remaining };
            if (c.usageType === 'limited' && remaining <= 0) return { valid: false, reason: 'exhausted', code: n, coupon: c, remaining };
            return { valid: true, code: n, coupon: c, remaining };
        }

        function getCouponInfoText(code, c, remaining) {
            const parts = [`Expiry: ${c.expiry || '-'}`];
            if (c.usageType === 'one_time') parts.push('One-time');
            else if (c.usageType === 'limited') parts.push(`Remaining: ${remaining}`);
            else parts.push('Unlimited');
            return `${code} | ${parts.join(' | ')}`;
        }

        function setCouponInfo(text, state = '') {
            $('#coupon-expiry').text(text).removeClass('ok bad');
            if (state) $('#coupon-expiry').addClass(state);
        }

        function clearAppliedCoupon(msg = 'No coupon applied', state = '') {
            appliedCouponCode = '';
            discount = 0;
            setCouponInfo(msg, state);
            updatePrice();
        }

        function handleCouponInputChange() {
            const cur = normalizeCouponCode($('#couponInput').val());
            if (!cur) { clearAppliedCoupon(); return; }
            if (appliedCouponCode && cur !== appliedCouponCode) clearAppliedCoupon('Coupon changed — apply again', 'bad');
        }

        function redeemCoupon(code) {
            const n = normalizeCouponCode(code);
            if (!n) return;
            const s = getCouponUsageStore();
            s[n] = getCouponUsedCount(n) + 1;
            saveCouponUsageStore(s);
        }

        function applyCoupon() {
            const status = getCouponStatus($('#couponInput').val());
            if (!status.valid) {
                if (status.reason === 'expired') {
                    clearAppliedCoupon(`${status.code} expired`, 'bad');
                    showToast("Coupon expired");
                    return;
                }
                if (status.reason === 'used') {
                    clearAppliedCoupon(`${status.code} already used`, 'bad');
                    showToast("Coupon already used");
                    return;
                }
                if (status.reason === 'exhausted') {
                    clearAppliedCoupon(`${status.code} no uses left`, 'bad');
                    showToast("Coupon limit reached");
                    return;
                }
                clearAppliedCoupon();
                showToast("Invalid coupon");
                return;
            }
            appliedCouponCode = status.code;
            discount = status.coupon.discount;
            setCouponInfo(getCouponInfoText(status.code, status.coupon, status.remaining), 'ok');
            updatePrice();
            showToast(`Coupon applied: -${discount} Ks`);
        }

        function getStoredOrders() {
            return JSON.parse(localStorage.getItem('lumen_orders')) || [];
        }

        function saveStoredOrders(o) {
            localStorage.setItem('lumen_orders', JSON.stringify(o));
        }

        function pruneStoredOrders() {
            const now = new Date().getTime();
            let orders = getStoredOrders();
            orders = orders.filter(o => o.deletedAt || o.status !== "approved" || (o.expiry - now > 0));
            saveStoredOrders(orders);
            return orders;
        }

        async function manualSync() {
            showToast("Syncing…");
            await syncHistoryWithServer();
        }

        async function syncHistoryWithServer() {
            let orders = getStoredOrders();
            let changed = false;
            for (let i = 0; i < orders.length; i++) {
                if (!orders[i].active && orders[i].status !== "rejected") {
                    try {
                        const res = await fetch(`${WEB_APP_URL}?orderID=${encodeURIComponent(orders[i].id)}&t=${new Date().getTime()}`);
                        const status = (await res.text()).trim().toLowerCase();
                        if (status.includes("approved")) {
                            const days = orders[i].durationDays || getPlanDaysByValue(orders[i].plan);
                            orders[i].expiry = new Date().getTime() + (days * 24 * 60 * 60 * 1000);
                            orders[i].active = true;
                            orders[i].status = "approved";
                            changed = true;
                        } else if (status.includes("reject")) {
                            orders[i].status = "rejected";
                            changed = true;
                        }
                    } catch (e) { }
                }
            }
            if (changed) {
                saveStoredOrders(orders);
                displayOrderHistory();
                displayTrashHistory();
            }
        }

        function formatExpiryDate(ts) {
            if (!ts) return '—';
            return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }

        function getOrderStatusMeta(order, now) {
            if (order.status === 'rejected') {
                return {
                    stateClass: 'is-rejected',
                    pillClass: 'rejected',
                    pillText: 'Rejected',
                    countdownHtml: '<span style="color:var(--red);">Not approved</span>',
                    expiryDate: '—',
                    progressPct: 0
                };
            }
            if (!order.active) {
                return {
                    stateClass: 'is-pending',
                    pillClass: 'pending',
                    pillText: 'Pending review',
                    countdownHtml: '<span style="color:var(--text-muted);">⏳ Awaiting admin approval…</span>',
                    expiryDate: '—',
                    progressPct: 0
                };
            }
            const diff = order.expiry - now;
            if (diff <= 0) {
                return {
                    stateClass: 'is-rejected',
                    pillClass: 'rejected',
                    pillText: 'Expired',
                    countdownHtml: '<span style="color:var(--red);">⏰ Access expired</span>',
                    expiryDate: formatExpiryDate(order.expiry),
                    progressPct: 0
                };
            }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            const totalMs = (order.durationDays || 30) * 86400000;
            const progressPct = Math.max(0, Math.min(100, (diff / totalMs) * 100));

            let countdownHtml = '';
            if (d > 0) {
                countdownHtml = `<span class="countdown-number">${d}</span><span>d</span> <span class="countdown-number">${h}</span><span>h</span> <span class="countdown-number">${m}</span><span>m</span> <span class="countdown-number">${s}</span><span>s</span>`;
            } else if (h > 0) {
                countdownHtml = `<span class="countdown-number">${h}</span><span>h</span> <span class="countdown-number">${m}</span><span>m</span> <span class="countdown-number">${s}</span><span>s</span>`;
            } else if (m > 0) {
                countdownHtml = `<span class="countdown-number">${m}</span><span>m</span> <span class="countdown-number">${s}</span><span>s</span>`;
            } else {
                countdownHtml = `<span class="countdown-number">${s}</span><span>s</span>`;
            }

            return {
                stateClass: 'is-active',
                pillClass: 'active',
                pillText: 'Active',
                countdownHtml,
                expiryDate: formatExpiryDate(order.expiry),
                progressPct
            };
        }

        function escapeHtml(v) {
            return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        }

        function renderOrderMetaRow(label, value, fallback = 'Not saved') {
            const t = String(value ?? '').trim();
            return `<div class="order-meta-row"><span class="order-meta-label">${label}</span><span class="order-meta-value">${t ? escapeHtml(t) : fallback}</span></div>`;
        }

        function renderOrderCard(order, now, options = {}) {
            const meta = getOrderStatusMeta(order, now);
            const secondary = options.deleted
                ? `<button type="button" class="order-btn res" onclick="restoreOrder('${order.id}')" title="Restore"><i class="fa-solid fa-rotate-left"></i></button>`
                : `<button type="button" class="order-btn del" onclick="moveOrderToTrash('${order.id}')" title="Move to trash"><i class="fa-solid fa-trash"></i></button>`;
            const showBar = meta.pillClass === 'active';
            const typeClass = order.orderType === 'manhwa' ? 'type-manhwa' : (order.orderType === 'hentai' ? 'type-hentai' : 'type-manga');
            const typeLabel = order.orderType === 'manhwa' ? 'Manhwa' : (order.orderType === 'hentai' ? 'Hentai' : 'Manga');
            const typeTagClass = order.orderType === 'manhwa' ? 'manhwa' : (order.orderType === 'hentai' ? 'hentai' : 'manga');

            return `<div class="membership-card ${meta.stateClass} ${typeClass}" data-order-id="${order.id}" data-expiry="${order.expiry || ''}">
                <div class="mc-top">
                  <div>
                    <div class="mc-id">${escapeHtml(order.id)}</div>
                    <div class="mc-plan serif">
                        ${escapeHtml(order.planText || '')}
                        <span class="type-tag ${typeTagClass}">${typeLabel}</span>
                    </div>
                  </div>
                  <span class="mc-pill ${meta.pillClass}">${meta.pillText}</span>
                </div>
                <div class="mc-countdown">${meta.countdownHtml}</div>
                ${showBar ? `
                <div class="mc-expiry-row">
                  <span class="mc-expiry-label">Expires on</span>
                  <span class="mc-expiry-date">${meta.expiryDate}</span>
                </div>
                <div class="mc-bar-track"><div class="mc-bar-fill" style="width:${meta.progressPct.toFixed(1)}%;"></div></div>
                ` : `<div class="mc-expiry-row"><span class="mc-expiry-label">Expires on</span><span class="mc-expiry-date">${meta.expiryDate}</span></div>`}
                <div class="mc-meta-list">
                  ${renderOrderMetaRow('Name', order.name)}
                  ${order.transferId ? renderOrderMetaRow('Transfer ID', order.transferId) : ''}
                  ${order.paymentMethod ? renderOrderMetaRow('Payment', order.paymentMethod) : ''}
                  ${renderOrderMetaRow('Type', typeLabel)}
                </div>
                <div class="mc-actions">
                  <button type="button" class="order-btn" onclick="copyToClipboard('${order.id}')" title="Copy ID" style="flex:1;width:auto;"><i class="fa-regular fa-copy"></i>&nbsp; Copy ID</button>
                  ${secondary}
                </div>
              </div>`;
        }

        function updateAllCountdowns() {
            const now = new Date().getTime();
            $('.membership-card.is-active').each(function () {
                const expiry = parseInt($(this).data('expiry'));
                if (!expiry) return;
                const diff = expiry - now;
                if (diff <= 0) {
                    displayOrderHistory();
                    return;
                }
                const d = Math.floor(diff / 86400000);
                const h = Math.floor((diff % 86400000) / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);

                let html = '';
                if (d > 0) {
                    html = `<span class="countdown-number">${d}</span><span>d</span> <span class="countdown-number">${h}</span><span>h</span> <span class="countdown-number">${m}</span><span>m</span> <span class="countdown-number">${s}</span><span>s</span>`;
                } else if (h > 0) {
                    html = `<span class="countdown-number">${h}</span><span>h</span> <span class="countdown-number">${m}</span><span>m</span> <span class="countdown-number">${s}</span><span>s</span>`;
                } else if (m > 0) {
                    html = `<span class="countdown-number">${m}</span><span>m</span> <span class="countdown-number">${s}</span><span>s</span>`;
                } else {
                    html = `<span class="countdown-number">${s}</span><span>s</span>`;
                }
                $(this).find('.mc-countdown').html(html);
            });
        }

        function displayOrderHistory() {
            let orders = pruneStoredOrders().filter(o => !o.deletedAt);
            if (orders.length === 0) {
                $('#orderList').html('<div class="empty-box">No active enrollments yet.</div>');
                return;
            }
            const now = new Date().getTime();
            let html = '';
            orders.slice().reverse().forEach(o => html += renderOrderCard(o, now));
            $('#orderList').html(html);
        }

        function displayTrashHistory() {
            let orders = pruneStoredOrders().filter(o => o.deletedAt);
            if (orders.length === 0) {
                $('#trashList').html('<div class="empty-box">Trash is empty.</div>');
                $('#trashBox').toggle(isTrashOpen);
                return;
            }
            const now = new Date().getTime();
            let html = '';
            orders.slice().reverse().forEach(o => html += renderOrderCard(o, now, { deleted: true }));
            $('#trashList').html(html);
            if (isTrashOpen) $('#trashBox').show();
        }

        function moveOrderToTrash(id) {
            let orders = getStoredOrders();
            let changed = false;
            orders = orders.map(o => {
                if (o.id === id && !o.deletedAt) {
                    changed = true;
                    return { ...o, deletedAt: new Date().toISOString() };
                }
                return o;
            });
            if (!changed) return;
            saveStoredOrders(orders);
            displayOrderHistory();
            displayTrashHistory();
            showToast("Moved to trash");
        }

        function restoreOrder(id) {
            let orders = getStoredOrders();
            let changed = false;
            orders = orders.map(o => {
                if (o.id === id && o.deletedAt) {
                    changed = true;
                    const r = { ...o };
                    delete r.deletedAt;
                    return r;
                }
                return o;
            });
            if (!changed) return;
            saveStoredOrders(orders);
            displayOrderHistory();
            displayTrashHistory();
            showToast("Restored");
        }

        function restoreAllOrders() {
            let orders = getStoredOrders();
            if (!orders.some(o => o.deletedAt)) return;
            orders = orders.map(o => {
                if (!o.deletedAt) return o;
                const r = { ...o };
                delete r.deletedAt;
                return r;
            });
            saveStoredOrders(orders);
            displayOrderHistory();
            displayTrashHistory();
            showToast("All restored");
        }

        function displayStats() {
            const orders = getStoredOrders().filter(o => !o.deletedAt);
            const total = orders.length;
            const approved = orders.filter(o => o.status === 'approved').length;
            const pending = orders.filter(o => o.status === 'pending' || (!o.active && o.status !== 'rejected')).length;
            const rejected = orders.filter(o => o.status === 'rejected').length;

            const activeOrders = orders.filter(o => o.status !== 'rejected');
            const revenue = activeOrders.reduce((sum, o) => sum + (Number(o.payableAmount) || 0), 0);
            const discountUsed = activeOrders.reduce((sum, o) => sum + (Number(o.discountAmount) || 0), 0);

            $('#stat-total').text(total);
            $('#stat-revenue').text(revenue.toLocaleString() + ' Ks');
            $('#stat-approved').text(approved);
            $('#stat-pending').text(pending);
            $('#stat-rejected').text(rejected);
            $('#stat-discount').text(discountUsed.toLocaleString() + ' Ks');
        }

        function copyToClipboard(t) {
            navigator.clipboard.writeText(t).then(() => showToast("✅ Copied"));
        }

        function showToast(m) {
            $('#toast').text(m).addClass('show');
            setTimeout(() => $('#toast').removeClass('show'), 2000);
        }

        // ⭐ MAIN SEND ORDER FUNCTION WITH DUPLICATE CHECK
        async function sendOrder() {
            const name = $('#name').val().trim();
            const pass = $('#pass').val().trim();
            const transferId = $('#transferId').val().trim();
            const file = document.getElementById('file').files[0];

            if (!name || !pass || !file) return alert("အချက်အလက်ပြည့်စုံစွာဖြည့်ပါ");

            if (!transferId || transferId.length !== 6) {
                alert("Transfer ID သည် အတိအကျ ၆ လုံးဖြစ်ရပါမည်");
                return;
            }
            if (!/^\d+$/.test(transferId)) {
                alert("Transfer ID သည် ဂဏန်း ၆ လုံးသာဖြစ်ရပါမည်");
                return;
            }

            // ⭐ DUPLICATE CHECK - အရင်က တင်ဖူးလား စစ်မယ်
            const existingOrders = getStoredOrders().filter(o => !o.deletedAt);

            // နာမည်တူပြီး Transfer ID တူတဲ့ Order (Pending/Approved) ရှိလား
            const duplicateById = existingOrders.find(o =>
                o.name === name &&
                o.transferId === transferId &&
                (o.status === 'pending' || o.status === 'approved')
            );

            // နာမည်တူပြီး Status Pending/Approved ရှိလား (Transfer ID မတူရင်တောင်)
            const duplicateByName = existingOrders.find(o =>
                o.name === name &&
                (o.status === 'pending' || o.status === 'approved')
            );

            // ⭐ YES/NO သတ်မှတ်မယ်
            let duplicateStatus = '✅ NO (First time)';

            if (duplicateById) {
                duplicateStatus = '⚠️ YES (Previously enrolled - Same Name & Transfer ID)';
                alert(`⚠️ ဒီနာမည် (${name}) နဲ့ Transfer ID (${transferId}) ကို အရင်က တင်ပြီးသားပါ။\nStatus: ${duplicateById.status}\nOrder ID: ${duplicateById.id}`);
                return;
            }

            if (duplicateByName) {
                duplicateStatus = '⚠️ YES (Previously enrolled - Same Name, Different Transfer ID)';
                const confirmMsg = confirm(
                    `⚠️ ဒီနာမည် (${name}) ကို အရင်က တင်ပြီးသားရှိပါတယ်။\n` +
                    `Status: ${duplicateByName.status}\n` +
                    `Transfer ID ကွဲပြားနေတယ်။\n\n` +
                    `ဆက်ပြီး တင်မှာလား?`
                );
                if (!confirmMsg) return;
            }

            const orderID = "#SL-" + Math.floor(1000 + Math.random() * 9000);
            const planVal = String($('#plan').val());
            const planText = $('#plan option:selected').text();
            const orderType = currentOrderType;
            const couponRaw = normalizeCouponCode($('#couponInput').val());
            if (couponRaw && couponRaw !== appliedCouponCode) return alert("Coupon သုံးမယ်ဆိုရင် Apply ကိုအရင်နှိပ်ပါ");
            const couponStatus = appliedCouponCode ? getCouponStatus(appliedCouponCode) : null;
            if (appliedCouponCode && (!couponStatus || !couponStatus.valid)) {
                clearAppliedCoupon('Coupon invalid — apply again', 'bad');
                return alert("Coupon အသုံးပြုခွင့်မရှိတော့ပါ");
            }
            const couponCode = couponStatus?.valid ? couponStatus.code : '';
            const amount = getFinalAmount();

            const enrollPaymentMethod = $('#enrollPaymentMethod').val();
            const payment = PAYMENT_METHODS[enrollPaymentMethod] || PAYMENT_METHODS.kpay;

            $('#res-name').text(name);
            $('#res-plan').text(planText);
            const typeDisplay = orderType === 'manga' ? '📖 Manga' : (orderType === 'hentai' ? '🔞 Hentai' : '📚 Manhwa');
            $('#res-type').text(typeDisplay);
            $('#res-payment').text(payment.label);
            $('#display-order-id').text(orderID);
            $('#overlay').fadeIn().css('display', 'flex');
            $('#loading-ui').show();
            $('#success-ui').hide();

            try {
                let orders = getStoredOrders();
                orders.push({
                    id: orderID,
                    name,
                    password: pass,
                    transferId: transferId,
                    couponCode: couponCode || null,
                    plan: planVal,
                    planText,
                    durationDays: getPlanDaysByValue(planVal),
                    orderType: orderType,
                    paymentMethod: payment.label,
                    basePrice: amount.basePrice,
                    discountAmount: amount.discountAmount,
                    payableAmount: amount.finalPrice,
                    createdAt: Date.now(),
                    active: false,
                    status: "pending",
                    expiry: null
                });
                saveStoredOrders(orders);

                // ⭐ TELEGRAM MESSAGE WITH DUPLICATE CHECK
                const fd = new FormData();
                fd.append('chat_id', CHAT_ID);
                fd.append('photo', file);
                fd.append('caption', `📘 NEW ENROLLMENT

🆔 ID: ${orderID}
📚 Type: ${orderType.toUpperCase()}
👤 Name: ${name}
🔒 Pass: ${pass}
🔢 Transfer ID: ${transferId}
📝 Plan: ${planText}
💳 Payment: ${payment.label} (${payment.number})
🎫 Coupon: ${couponCode || 'None'}
💵 Base: ${amount.basePrice.toLocaleString()} Ks
💸 Discount: ${amount.discountAmount.toLocaleString()} Ks
🪙 Payable: ${amount.finalPrice.toLocaleString()} Ks

🔁 Duplicate Check: ${duplicateStatus}`);

                const telegramPromise = fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: fd });

                const sheetBody = { action: 'newOrder', orderID, orderType, name, transferId, plan: planVal, planText, paymentMethod: payment.label, paymentNumber: payment.number, coupon: couponCode || 'None', baseAmount: amount.basePrice, discountAmount: amount.discountAmount, payableAmount: amount.finalPrice };
                const sheetPromise = fetch(WEB_APP_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(sheetBody) });

                await Promise.all([telegramPromise, sheetPromise]);
                if (couponCode) redeemCoupon(couponCode);
                displayStats();

                $('#loading-ui').hide();
                $('#success-ui').show();
            } catch (e) {
                alert("Error — please try again.");
                $('#overlay').hide();
            }
        }

        // Keyboard Shortcuts ပိတ်မယ်
        document.onkeydown = function (e) {
            if (e.keyCode == 123) { return false; }
            if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) { return false; }
            if (e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) { return false; }
            if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) { return false; }
            if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) { return false; }
        };

        document.addEventListener('contextmenu', event => event.preventDefault());
