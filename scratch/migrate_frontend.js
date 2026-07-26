const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'index.html');
const destDir = path.join(__dirname, '..', 'public');
const destPath = path.join(destDir, 'index.html');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

let html = fs.readFileSync(srcPath, 'utf8');

// 1. Inject Socket.IO client and Google Sign-in GIS SDK into <head>
const scriptsToInject = `
    <!-- Google Identity Services (GIS) SDK -->
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <!-- Socket.IO Client -->
    <script src="/socket.io/socket.io.js"></script>
`;

html = html.replace('<!-- Google Fonts -->', scriptsToInject + '\n    <!-- Google Fonts -->');

// 2. Add Google Sign-in button markup in the Member Login tab (TAB 2)
const originalUserTab = `<div id="auth-tab-user" class="auth-tab-content" style="display: none;">`;
const targetUserTabReplacement = `
            <!-- TAB 2: USER LOGIN (Registered) -->
            <div id="auth-tab-user" class="auth-tab-content" style="display: none;">
                <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: var(--radius-sm); padding: 14px; color: #C4B5FD; font-size: 13px; margin-bottom: 20px;">
                    <i class="fa-solid fa-info-circle"></i> <strong>User Login Portal:</strong> Welcome Member! Log in below or use your Google account.
                </div>

                <div class="form-group">
                    <label class="form-label">Email / Customer ID</label>
                    <input type="email" id="user-email" class="form-input" placeholder="user@domain.com">
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" id="user-password" class="form-input" placeholder="••••••••••••">
                </div>
                <button class="btn-action btn-primary-action" style="width: 100%; justify-content: center; padding: 14px; margin-top: 10px;" onclick="submitUserLoginPreview()">
                    <i class="fa-solid fa-right-to-bracket"></i> Sign In to Member Account
                </button>

                <div style="display: flex; align-items: center; margin: 16px 0; gap: 10px;">
                    <div style="flex: 1; height: 1px; background: var(--border-glass);"></div>
                    <div style="font-size: 11px; color: var(--text-dim); text-transform: uppercase;">or sign in with</div>
                    <div style="flex: 1; height: 1px; background: var(--border-glass);"></div>
                </div>
                
                <div id="google-signin-btn" style="width: 100%; display: flex; justify-content: center; margin-bottom: 10px;"></div>
`;

// Replace User tab content (original has warning and inputs)
// We will replace from auth-tab-user up to the ending div of that tab.
// Let's do a targeted replace of the user tab.
const oldTabSection = `<div id="auth-tab-user" class="auth-tab-content" style="display: none;">
                <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: var(--radius-sm); padding: 14px; color: #C4B5FD; font-size: 13px; margin-bottom: 20px;">
                    <i class="fa-solid fa-info-circle"></i> <strong>User Login Portal:</strong> Welcome Member! User account settings & rewards will be configured in the next phase as requested. You can preview member login below or use Guest Login above.
                </div>

                <div class="form-group">
                    <label class="form-label">Email / Customer ID</label>
                    <input type="email" class="form-input" placeholder="user@domain.com">
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-input" placeholder="••••••••••••">
                </div>
                <button class="btn-action btn-primary-action" style="width: 100%; justify-content: center; padding: 14px; margin-top: 10px;" onclick="submitUserLoginPreview()">
                    <i class="fa-solid fa-right-to-bracket"></i> Sign In to Member Account
                </button>
            </div>`;

html = html.replace(oldTabSection, targetUserTabReplacement + '            </div>');

// 3. Replace Static HTML Dollar signs with Rupees (₹)
html = html.replace('<span>Subtotal</span>\n                        <span id="subtotal-val">$0.00</span>', '<span>Subtotal</span>\n                        <span id="subtotal-val">₹0.00</span>');
html = html.replace('<span>Service & Taxes (10%)</span>\n                        <span id="tax-val">$0.00</span>', '<span>Service & Taxes (10%)</span>\n                        <span id="tax-val">₹0.00</span>');
html = html.replace('<span>Total Bill</span>\n                        <span id="total-val" style="color: var(--primary);">$0.00</span>', '<span>Total Bill</span>\n                        <span id="total-val" style="color: var(--primary);">₹0.00</span>');

// Replace switch table click handler
html = html.replace('onclick="openAuthModal()"\n            style="padding: 6px 12px; font-size: 11px;"', 'onclick="switchOrRelocate()"\n            style="padding: 6px 12px; font-size: 11px;"');
html = html.replace('Switch / Relocate Table', 'Switch / Relocate Table');

// 4. Inject Full-Stack Script Logic (completely replacing original script tag content)
const startScriptTag = '<script>';
const endScriptTag = '</script>';

const scriptStartIndex = html.indexOf(startScriptTag);
const scriptEndIndex = html.lastIndexOf(endScriptTag);

if (scriptStartIndex === -1 || scriptEndIndex === -1) {
  console.error("Could not find script tags in index.html");
  process.exit(1);
}

const headHtml = html.substring(0, scriptStartIndex + startScriptTag.length);
const tailHtml = html.substring(scriptEndIndex);

const fullStackScript = `
        // State Management
        const menuData = [];
        let cart = [];
        let isWifiInRange = true;
        let selectedSeatCount = 2;
        let selectedTableId = null;
        let selectedTableNum = null;
        
        let activeCustomerSession = {
            isLoggedIn: false,
            customerName: "Guest Customer",
            tableNum: 8,
            seats: 4,
            status: "active_dining",
            loginType: "guest"
        };

        const restaurantTables = [];

        // Establish Socket Connection
        const socket = io();

        // Register global socket events
        socket.on('cart:updated', (updatedCart) => {
            console.log('Cart updated via socket:', updatedCart);
            cart = updatedCart.items || [];
            renderCart();
        });

        socket.on('user:joined', (data) => {
            showToast(\`👋 \${data.message}\`);
            fetchTables(); // Refresh floor plan
        });

        socket.on('user:left', (data) => {
            showToast(\`🚶 \${data.message}\`);
            fetchTables();
        });

        socket.on('table:status_changed', (data) => {
            console.log('Table status changed:', data);
            fetchTables();
        });

        socket.on('order:placed', (order) => {
            showToast(\`✨ Order successfully sent to Kitchen! Est. prep: 14 mins.\`);
            cart = [];
            renderCart();
        });

        socket.on('order:status_updated', (data) => {
            showToast(\`🔔 \${data.message}\`);
        });

        socket.on('waiter:call_acknowledged', (data) => {
            showToast(data.message);
        });

        socket.on('waiter:request_completed', (data) => {
            showToast(data.message);
        });

        // Initialize GIS and load initial data
        window.onload = async function() {
            // Check auth session
            await checkAuthSession();

            // Load menu and table data
            await fetchMenu();
            await fetchTables();

            // Initialize Google Sign-In
            google.accounts.id.initialize({
                client_id: '686445090372-17hhr1l6fsbjots3e8kuse904cv9rq72.apps.googleusercontent.com',
                callback: handleCredentialResponse
            });
            google.accounts.id.renderButton(
                document.getElementById("google-signin-btn"),
                { theme: "outline", size: "large", width: "340", text: "signin_with" }
            );
        };

        // Indian Currency Formatting Helper
        function formatIndianCurrency(amount) {
            const formatter = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            });
            return formatter.format(amount).replace('INR', '₹').trim();
        }

        // Fetch menu from backend
        async function fetchMenu() {
            try {
                const res = await fetch('/api/menu');
                const data = await res.json();
                if (data.success) {
                    menuData.length = 0;
                    menuData.push(...data.data);
                    renderMenu(menuData);
                }
            } catch (err) {
                console.error("Error fetching menu:", err);
            }
        }

        // Fetch tables from backend
        async function fetchTables() {
            try {
                const res = await fetch('/api/tables');
                const data = await res.json();
                if (data.success) {
                    restaurantTables.length = 0;
                    restaurantTables.push(...data.data);
                    updateFloorPlanUI();
                }
            } catch (err) {
                console.error("Error fetching tables:", err);
            }
        }

        // Render Menu Cards
        function renderMenu(items) {
            const container = document.getElementById('menu-container');
            if (items.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 40px; grid-column: 1/-1;">No menu items found.</div>';
                return;
            }
            container.innerHTML = items.map(item => \`
                <div class="food-card glass">
                    <div class="card-img-wrapper">
                        <img src="\${item.image}" alt="\${item.name}" class="card-img">
                        <span class="card-tag">\${item.tag || 'Popular'}</span>
                        <span class="card-prep"><i class="fa-regular fa-clock"></i> \${item.prep}</span>
                    </div>
                    <div class="card-body">
                        <div>
                            <div class="card-title-row">
                                <h3 class="card-title">\${item.name}</h3>
                                <div class="card-rating"><i class="fa-solid fa-star"></i> \${item.rating}</div>
                            </div>
                            <p class="card-desc">\${item.desc}</p>
                        </div>
                        <div class="card-footer">
                            <div class="card-price">\${formatIndianCurrency(item.price)}</div>
                            <button class="btn-add" onclick="addToCart('\${item._id}')" title="Add to Shared Cart">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        // Filter Categories
        async function filterCategory(cat, btn) {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            try {
                const queryParam = cat === 'all' ? '' : \`?category=\${cat}\`;
                const res = await fetch(\`/api/menu\${queryParam}\`);
                const data = await res.json();
                if (data.success) {
                    renderMenu(data.data);
                }
            } catch (err) {
                console.error(err);
            }
        }

        // Search Filter
        async function handleSearch() {
            const query = document.getElementById('search-input').value.trim();
            try {
                const queryParam = query ? \`?search=\${encodeURIComponent(query)}\` : '';
                const res = await fetch(\`/api/menu\${queryParam}\`);
                const data = await res.json();
                if (data.success) {
                    renderMenu(data.data);
                }
            } catch (err) {
                console.error(err);
            }
        }

        // Render Cart items
        function renderCart() {
            const cartItemsEl = document.getElementById('cart-items');
            let totalCount = 0;
            let subtotal = 0;

            if (cart.length === 0) {
                cartItemsEl.innerHTML = \`<div style="text-align: center; color: var(--text-dim); padding: 30px 0; font-size: 13px;">Your table cart is empty.<br>Select items from the menu to start!</div>\`;
            } else {
                cartItemsEl.innerHTML = cart.map(item => {
                    totalCount += item.qty;
                    subtotal += item.price * item.qty;
                    return \`
                        <div class="order-item">
                            <div>
                                <div class="item-name">\${item.name}</div>
                                <div class="item-by"><i class="fa-solid fa-user-group" style="font-size: 10px;"></i> Added by \${item.addedBy}</div>
                                <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-top: 4px;">\${formatIndianCurrency(item.price * item.qty)}</div>
                            </div>
                            <div class="item-qty-controls">
                                <button class="btn-qty" onclick="updateQty('\${item.menuItem._id || item.menuItem}', -1)">-</button>
                                <span style="font-size: 13px; font-weight: 700; min-width: 18px; text-align: center;">\${item.qty}</span>
                                <button class="btn-qty" onclick="updateQty('\${item.menuItem._id || item.menuItem}', 1)">+</button>
                            </div>
                        </div>
                    \`;
                }).join('');
            }

            const tax = subtotal * 0.10;
            const total = subtotal + tax;

            document.getElementById('cart-count').innerText = totalCount;
            document.getElementById('subtotal-val').innerText = formatIndianCurrency(subtotal);
            document.getElementById('tax-val').innerText = formatIndianCurrency(tax);
            document.getElementById('total-val').innerText = formatIndianCurrency(total);
        }

        // Add to collaborative Cart via Socket
        function addToCart(menuItemId) {
            if (!activeCustomerSession.isLoggedIn) {
                showToast("⚠️ Please login/allot a table first.");
                openAuthModal();
                return;
            }
            
            const itemObj = menuData.find(i => i._id === menuItemId);
            if (!itemObj) return;

            socket.emit('cart:add', {
                tableNum: activeCustomerSession.tableNum,
                menuItemId: itemObj._id,
                name: itemObj.name,
                price: itemObj.price,
                addedBy: activeCustomerSession.customerName
            });
        }

        // Update collaborative Qty via Socket
        function updateQty(menuItemId, delta) {
            socket.emit('cart:update', {
                tableNum: activeCustomerSession.tableNum,
                menuItemId,
                delta
            });
        }

        // Clear Cart
        function clearTableCart() {
            socket.emit('cart:clear', {
                tableNum: activeCustomerSession.tableNum
            });
        }

        // Modals & UI Actions
        function openWaiterModal() {
            document.getElementById('waiter-modal').classList.add('active');
        }

        // Close waiter modal
        function closeWaiterModal() {
            document.getElementById('waiter-modal').classList.remove('active');
        }

        // Call Waiter API
        async function requestService(serviceName) {
            closeWaiterModal();
            try {
                const res = await fetch('/api/waiter/call', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tableNum: activeCustomerSession.tableNum || 8,
                        serviceName
                    })
                });
                const data = await res.json();
                if (data.success) {
                    showToast(\`🛎️ Request "\${serviceName}" dispatched to Floor Host.\`);
                }
            } catch (err) {
                console.error(err);
                showToast("⚠️ Error requesting service.");
            }
        }

        // Place Order API
        async function placeOrder() {
            if (cart.length === 0) {
                showToast("⚠️ Cart is empty. Please select dishes first.");
                return;
            }
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': \`Bearer \${token}\`
                    },
                    body: JSON.stringify({ tableNum: activeCustomerSession.tableNum })
                });
                const data = await res.json();
                if (!data.success) {
                    showToast(\`⚠️ Order failed: \${data.message}\`);
                }
            } catch (err) {
                console.error(err);
                showToast("⚠️ Connection error placing order.");
            }
        }

        // Split Bill
        function splitBill() {
            const totalStr = document.getElementById('total-val').innerText;
            const totalNum = parseFloat(totalStr.replace(/[^\d.]/g, ''));
            if (!totalNum || totalNum === 0) {
                showToast("⚠️ Bill total is ₹0.00.");
                return;
            }
            const perPerson = (totalNum / 4).toFixed(0);
            showToast(\`💳 Split 4 ways: \${formatIndianCurrency(perPerson)} per diner.\`);
        }

        // AI recommendations
        function getRecommendation() {
            if (cart.length === 0) {
                showToast("🍷 Sommelier: Add items to your cart so I can recommend pairings!");
                return;
            }
            const itemsInCart = cart.map(i => i.name.toLowerCase());
            let recommendation = "🍷 Sommelier: Pair your dishes with our house vintage red wine.";
            if (itemsInCart.some(name => name.includes('steak') || name.includes('beef') || name.includes('salmon'))) {
                recommendation = "🍷 Sommelier: I recommend pairing the Wagyu / Salmon with our 2018 Napa Cabernet Sauvignon.";
            } else if (itemsInCart.some(name => name.includes('sushi') || name.includes('fish'))) {
                recommendation = "🍶 Sommelier: Enhance the sushi flavors with a glass of chilled Junmai Daiginjo Sake.";
            } else if (itemsInCart.some(name => name.includes('chocolate') || name.includes('dessert'))) {
                recommendation = "🥂 Sommelier: Finish your meal with a sparkling French Champagne or Sweet Port Wine.";
            }
            showToast(recommendation);
        }

        function scrollToOrder() {
            document.getElementById('order-section').scrollIntoView({ behavior: 'smooth' });
        }

        function openAuthModal() {
            document.getElementById('auth-modal').classList.add('active');
        }

        function closeAuthModal() {
            document.getElementById('auth-modal').classList.remove('active');
        }

        function switchAuthTab(tab) {
            const guestBtn = document.getElementById('tab-guest-btn');
            const userBtn = document.getElementById('tab-user-btn');
            const guestContent = document.getElementById('auth-tab-guest');
            const userContent = document.getElementById('auth-tab-user');

            if (tab === 'guest') {
                guestBtn.classList.add('active');
                userBtn.classList.remove('active');
                guestContent.style.display = 'block';
                userContent.style.display = 'none';
            } else {
                userBtn.classList.add('active');
                guestBtn.classList.remove('active');
                userContent.style.display = 'block';
                guestContent.style.display = 'none';
            }
        }

        function toggleWifiSimulation() {
            isWifiInRange = !isWifiInRange;
            const wifiCard = document.getElementById('wifi-card');
            const iconBox = document.getElementById('wifi-icon-box');
            const wifiIcon = document.getElementById('wifi-icon');
            const ssidText = document.getElementById('wifi-ssid-text');
            const badge = document.getElementById('wifi-badge');
            const subText = document.getElementById('wifi-sub-text');
            const toggleLabel = document.getElementById('wifi-toggle-label');
            const errorBanner = document.getElementById('wifi-error-banner');
            const formContainer = document.getElementById('guest-form-container');

            if (isWifiInRange) {
                wifiCard.classList.remove('out-of-range');
                iconBox.style.background = 'rgba(16, 185, 129, 0.2)';
                iconBox.style.color = 'var(--accent-emerald)';
                wifiIcon.className = 'fa-solid fa-wifi';
                ssidText.innerText = 'SSID: AURA_RESTAURANT_5G';
                badge.innerText = 'VERIFIED ON-SITE';
                badge.style.background = 'rgba(16, 185, 129, 0.2)';
                badge.style.color = 'var(--accent-emerald)';
                subText.innerHTML = 'Frequency: <strong>5.785 GHz (5G Band)</strong> &bull; Proximity: <strong>~4m (In Restaurant)</strong>';
                toggleLabel.innerText = 'Simulate Out of Range';
                errorBanner.style.display = 'none';
                formContainer.style.opacity = '1';
                formContainer.style.pointerEvents = 'all';
                showToast("📡 Wi-Fi Signal Verified: Connected to Aura 5 GHz Restaurant Network.");
            } else {
                wifiCard.classList.add('out-of-range');
                iconBox.style.background = 'rgba(230, 57, 70, 0.2)';
                iconBox.style.color = 'var(--secondary)';
                wifiIcon.className = 'fa-solid fa-wifi-slash';
                ssidText.innerText = 'SSID: Not Connected to Restaurant Wi-Fi';
                badge.innerText = 'OUT OF RANGE';
                badge.style.background = 'rgba(230, 57, 70, 0.2)';
                badge.style.color = 'var(--secondary)';
                subText.innerHTML = 'Frequency: <strong>Unknown / Off-Premises</strong> &bull; Proximity: <strong>> 250m Away</strong>';
                toggleLabel.innerText = 'Simulate Connected On-Site';
                errorBanner.style.display = 'block';
                formContainer.style.opacity = '0.4';
                formContainer.style.pointerEvents = 'none';
                showToast("⚠️ Guest Login blocked: You must be on-site connected to Restaurant Wi-Fi.");
            }
        }

        function selectSeatCount(count, el) {
            selectedSeatCount = count;
            document.querySelectorAll('.seat-pill').forEach(pill => pill.classList.remove('active'));
            el.classList.add('active');
        }

        // Proceed guest booking
        function proceedGuestBooking(mode) {
            if (!isWifiInRange) {
                showToast("⚠️ Guest login denied: Please connect to Restaurant Wi-Fi (5 GHz range).");
                return;
            }

            const nameInput = document.getElementById('guest-name').value.trim();
            const customerName = nameInput || "Guest Customer";

            if (mode === 'auto') {
                const freeTable = restaurantTables.find(t => t.status === 'free' && t.seats >= selectedSeatCount);
                if (freeTable) {
                    submitGuestLogin(customerName, freeTable.num, freeTable.seats, freeTable.zone);
                } else {
                    openQueueModal(customerName, selectedSeatCount);
                }
            } else if (mode === '2d') {
                closeAuthModal();
                openFloorplanModal(selectedSeatCount);
            }
        }

        async function submitGuestLogin(name, tableNum, seats, zone) {
            try {
                const res = await fetch('/api/auth/guest-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, tableNum })
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    allotTableToCustomer(data.user.name, data.user.tableNum, seats, zone);
                } else {
                    showToast(\`⚠️ Guest Login failed: \${data.message}\`);
                }
            } catch (err) {
                console.error(err);
                showToast("⚠️ Guest Login Error.");
            }
        }

        function openFloorplanModal(seats) {
            document.getElementById('fp-guest-count-display').innerText = \`\${seats} Guests\`;
            document.getElementById('floorplan-modal').classList.add('active');
        }

        function closeFloorplanModal() {
            document.getElementById('floorplan-modal').classList.remove('active');
        }

        function updateFloorPlanUI() {
            restaurantTables.forEach(table => {
                const node = document.getElementById(\`table-node-\${table.num}\`);
                if (node) {
                    node.classList.remove('status-free', 'status-occupied', 'status-reserved', 'status-selected');
                    node.classList.add(\`status-\${table.status}\`);
                    
                    const countText = node.querySelector('.table-seats-count');
                    const numText = node.querySelector('.table-num');
                    
                    if (table.status === 'free') {
                        if (countText) countText.innerHTML = \`\${table.seats} Seats &bull; Free\`;
                        if (numText) numText.innerHTML = \`Table #0\${table.num}\`;
                    } else if (table.status === 'occupied') {
                        if (countText) countText.innerHTML = \`\${table.seats} Seats &bull; Busy\`;
                        if (numText) numText.innerHTML = \`Table #0\${table.num} <span style="font-size: 10px; background: rgba(230,57,70,0.2); color: #F87171; padding: 2px 4px; border-radius: 4px;">BUSY</span>\`;
                    } else if (table.status === 'reserved') {
                        if (countText) countText.innerHTML = \`\${table.seats} Seats &bull; Reserved\`;
                        if (numText) numText.innerHTML = \`Table #0\${table.num} <span style="font-size: 10px; background: rgba(245,158,11,0.2); color: #F59E0B; padding: 2px 4px; border-radius: 4px;">QUEUED</span>\`;
                    }
                }
            });
        }

        function selectTableNode(tableNumSelected) {
            const table = restaurantTables.find(t => t.num === tableNumSelected);
            if (!table) return;

            document.querySelectorAll('.table-node').forEach(n => n.classList.remove('status-selected'));

            const targetNode = document.getElementById(\`table-node-\${table.num}\`);
            if (targetNode) targetNode.classList.add('status-selected');

            selectedTableId = table._id;
            selectedTableNum = table.num;

            const confirmBtn = document.getElementById('confirm-seat-btn');
            confirmBtn.disabled = false;

            if (table.status === 'free') {
                document.getElementById('fp-selected-table-label').innerHTML = \`Table #\${table.num} (\${table.seats} Seats, \${table.zone}) &bull; <span style="color: var(--accent-emerald);">FREE NOW</span>\`;
                confirmBtn.innerHTML = \`<i class="fa-solid fa-circle-check"></i> Allot Table #\${table.num} & Enter Customer Portal\`;
            } else {
                document.getElementById('fp-selected-table-label').innerHTML = \`Table #\${table.num} (\${table.seats} Seats, \${table.zone}) &bull; <span style="color: #F87171;">BUSY (Est. Wait ~\${table.estWait || 15} mins)</span>\`;
                confirmBtn.innerHTML = \`<i class="fa-solid fa-utensils"></i> Reserve Table #\${table.num} & Start Pre-Ordering\`;
            }
        }

        async function confirmSelectedSeat() {
            if (!selectedTableNum) return;
            const table = restaurantTables.find(t => t.num === selectedTableNum);
            const nameInput = document.getElementById('guest-name').value.trim();
            const customerName = nameInput || "Guest Customer";

            closeFloorplanModal();

            if (table.status === 'free') {
                await submitGuestLogin(customerName, table.num, table.seats, table.zone);
            } else {
                startPreOrderingSession(customerName, table.num, selectedSeatCount, table.zone, table.estWait || 15);
            }
        }

        function allotTableToCustomer(name, tableNum, seats, zone) {
            closeAuthModal();
            
            activeCustomerSession = {
                isLoggedIn: true,
                customerName: name,
                tableNum: tableNum,
                seats: seats,
                zone: zone,
                status: "active_dining",
                loginType: "guest"
            };

            // Join socket room
            socket.emit('table:join', { tableNum: tableNum, name: name });

            updateCustomerSessionUI();
            showToast(\`🎉 Table #\${tableNum} Allotted to \${name} (\${seats} Seats)! Welcome to Customer Portal.\`);
        }

        function startPreOrderingSession(name, tableNum, seats, zone, estWait) {
            closeAuthModal();

            activeCustomerSession = {
                isLoggedIn: true,
                customerName: name,
                tableNum: tableNum,
                seats: seats,
                zone: zone,
                status: "pre_ordering",
                estWait: estWait,
                loginType: "guest"
            };

            socket.emit('table:join', { tableNum: tableNum, name: name });

            updateCustomerSessionUI();
            showToast(\`⏳ Table #\${tableNum} is busy. Pre-Order Mode Activated! Select items now.\`);
        }

        function triggerTableFreedAlert() {
            const modal = document.getElementById('table-freed-modal');
            document.getElementById('tf-title').innerText = \`Table #\${activeCustomerSession.tableNum} is Free & Cleaned!\`;
            document.getElementById('tf-customer-name').innerText = activeCustomerSession.customerName;
            document.getElementById('tf-table-name').innerText = \`Table #\${activeCustomerSession.tableNum}\`;
            document.getElementById('tf-zone-name').innerText = activeCustomerSession.zone || "Main Hall";
            document.getElementById('tf-table-num').innerText = \`Table #\${activeCustomerSession.tableNum} (\${activeCustomerSession.seats} Seats)\`;

            const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
            document.getElementById('tf-preorder-count').innerText = itemCount > 0 ? \`\${itemCount} Dishes Pre-Ordered (Sending to Kitchen)\` : "No pre-orders (Menu Active)";

            modal.classList.add('active');
            showToast(\`🔔 ALERT: Table #\${activeCustomerSession.tableNum} is now Vacated & Sanitized!\`);
        }

        function closeTableFreedModal() {
            document.getElementById('table-freed-modal').classList.remove('active');
        }

        async function takeSeatAtFreedTable() {
            closeTableFreedModal();
            
            // Mark table occupied in DB
            try {
                const token = localStorage.getItem('token');
                await fetch(\`/api/tables/\${activeCustomerSession.tableNum}/status\`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': \`Bearer \${token}\`
                    },
                    body: JSON.stringify({ status: 'occupied' })
                });
            } catch(e) {}

            activeCustomerSession.status = "active_dining";
            updateCustomerSessionUI();
            
            // Send pre-orders to kitchen
            if (cart.length > 0) {
                await placeOrder();
            } else {
                showToast(\`🎉 You are seated at Table #\${activeCustomerSession.tableNum}! Start dining.\`);
            }
        }

        function openQueueModal(name, seats) {
            closeAuthModal();
            document.getElementById('queue-seats-text').innerText = \`\${seats} Guests\`;
            document.getElementById('queue-modal').classList.add('active');
        }

        function closeQueueModal() {
            document.getElementById('queue-modal').classList.remove('active');
        }

        async function simulateQueueClear() {
            closeQueueModal();
            const nameInput = document.getElementById('guest-name').value.trim();
            const customerName = nameInput || "Guest Customer";
            startPreOrderingSession(customerName, 2, selectedSeatCount, "Main Hall", 12);
            triggerTableFreedAlert();
        }

        // Custom User Login API Integration
        async function submitUserLoginPreview() {
            const email = document.getElementById('user-email').value.trim();
            const password = document.getElementById('user-password').value;

            if (!email || !password) {
                showToast("⚠️ Please fill in all fields.");
                return;
            }

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    showToast(\`👋 Welcome back, \${data.user.name}!\`);
                    closeAuthModal();
                    
                    // Allot table 8 by default or redirect based on role
                    if (data.user.role === 'waiter') {
                        showToast("💼 Staff Portal access logged. Active orders synchronized.");
                    } else if (data.user.role === 'admin') {
                        showToast("📊 Admin analytics dashboard unlocked.");
                    } else {
                        allotTableToCustomer(data.user.name, 8, 4, "Outdoor Patio");
                    }
                } else {
                    showToast(\`⚠️ Login failed: \${data.message}\`);
                }
            } catch (err) {
                console.error(err);
                showToast("⚠️ Error connecting to member login API.");
            }
        }

        // Google Sign-In Callback Handler
        async function handleCredentialResponse(response) {
            try {
                const res = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken: response.credential })
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    showToast(\`👋 Welcome back, \${data.user.name}!\`);
                    closeAuthModal();
                    allotTableToCustomer(data.user.name, 8, 2, "Outdoor Patio");
                } else {
                    showToast(\`⚠️ Google login failed: \${data.message}\`);
                }
            } catch (err) {
                console.error("Google auth error:", err);
                showToast("⚠️ Google Authentication failed.");
            }
        }

        // Authenticated Session Checker
        async function checkAuthSession() {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await fetch('/api/auth/profile', {
                    headers: { 'Authorization': \`Bearer \${token}\` }
                });
                const data = await res.json();
                if (data.success) {
                    const user = data.user;
                    activeCustomerSession = {
                        isLoggedIn: true,
                        customerName: user.name,
                        tableNum: user.tableNum || 8,
                        seats: 4,
                        status: "active_dining",
                        loginType: user.isGuest ? "guest" : "member"
                    };
                    
                    // Join table room via socket
                    socket.emit('table:join', { 
                        tableNum: activeCustomerSession.tableNum, 
                        name: activeCustomerSession.customerName 
                    });

                    updateCustomerSessionUI();
                } else {
                    localStorage.removeItem('token');
                }
            } catch (err) {
                console.error("Session restoration error:", err);
                localStorage.removeItem('token');
            }
        }

        // Logout
        async function logoutCustomer() {
            const token = localStorage.getItem('token');
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Authorization': \`Bearer \${token}\` }
                });
            } catch (e) {}

            socket.emit('table:leave');
            localStorage.removeItem('token');

            activeCustomerSession = {
                isLoggedIn: false,
                customerName: "Guest Customer",
                tableNum: 8,
                seats: 4,
                status: "active_dining",
                loginType: "guest"
            };

            document.getElementById('customer-session-bar').style.display = 'none';
            document.getElementById('login-btn-text').innerText = 'Guest Login / Book Table';
            
            const navTableSpan = document.querySelector('.status-pill span:last-child');
            if (navTableSpan) {
                navTableSpan.innerText = 'Table #08 • Synchronized';
            }
            
            cart = [];
            renderCart();
            showToast("🔒 Session logged out.");
        }

        function switchOrRelocate() {
            logoutCustomer();
            openAuthModal();
        }

        function updateCustomerSessionUI() {
            const sessionBar = document.getElementById('customer-session-bar');
            const nameEl = document.getElementById('session-customer-name');
            const tableEl = document.getElementById('session-table-name');
            const navTableSpan = document.querySelector('.status-pill span:last-child');
            const widgetTitleSpan = document.querySelector('.widget-title span:first-child');
            const loginBtnText = document.getElementById('login-btn-text');

            if (activeCustomerSession.isLoggedIn) {
                sessionBar.style.display = 'flex';
                nameEl.innerText = activeCustomerSession.customerName;

                if (activeCustomerSession.status === "pre_ordering") {
                    sessionBar.style.background = 'rgba(245, 158, 11, 0.15)';
                    sessionBar.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                    
                    tableEl.innerHTML = \`<span style="color: #F59E0B; font-weight: 700;"><i class="fa-solid fa-clock"></i> PRE-ORDER MODE: Waiting for Table #\${activeCustomerSession.tableNum} (Est. \${activeCustomerSession.estWait} mins)</span>\`;
                    
                    if (navTableSpan) {
                        navTableSpan.innerHTML = \`Table #\${activeCustomerSession.tableNum} &bull; Pre-Ordering\`;
                    }

                    if (loginBtnText) {
                        loginBtnText.innerText = \`\${activeCustomerSession.customerName} (Pre-Ordering T#\${activeCustomerSession.tableNum})\`;
                    }

                    if (!document.getElementById('sim-table-freed-btn')) {
                        const freedBtn = document.createElement('button');
                        freedBtn.id = 'sim-table-freed-btn';
                        freedBtn.className = 'btn-action btn-primary-action';
                        freedBtn.style.padding = '6px 12px';
                        freedBtn.style.fontSize = '11px';
                        freedBtn.innerHTML = \`<i class="fa-solid fa-bell"></i> [Simulate Table #\${activeCustomerSession.tableNum} Freed]\`;
                        freedBtn.onclick = triggerTableFreedAlert;
                        sessionBar.appendChild(freedBtn);
                    }
                } else {
                    sessionBar.style.background = 'rgba(255, 159, 28, 0.1)';
                    sessionBar.style.borderColor = 'var(--border-accent)';
                    tableEl.innerText = \`Table #\${activeCustomerSession.tableNum} (\${activeCustomerSession.seats} Seats)\`;
                    
                    if (navTableSpan) {
                        navTableSpan.innerText = \`Table #\${activeCustomerSession.tableNum} • Synchronized\`;
                    }

                    if (widgetTitleSpan) {
                        widgetTitleSpan.innerText = \`Table #\${activeCustomerSession.tableNum} Companions\`;
                    }

                    if (loginBtnText) {
                        loginBtnText.innerText = \`\${activeCustomerSession.customerName} (Table #\${activeCustomerSession.tableNum})\`;
                    }

                    const freedBtn = document.getElementById('sim-table-freed-btn');
                    if (freedBtn) freedBtn.remove();
                }
            }
        }

        // Show Toast Notifications
        function showToast(msg) {
            const container = document.getElementById('toast-box');
            const toast = document.createElement('div');
            toast.className = 'toast glass';
            toast.innerHTML = \`<i class="fa-solid fa-circle-check" style="color: var(--primary);"></i> \${msg}\`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.remove();
            }, 3500);
        }
`;

const finalHtml = headHtml + fullStackScript + tailHtml;

fs.writeFileSync(destPath, finalHtml, 'utf8');
console.log("Successfully created public/index.html with full-stack APIs, Google GIS OAuth, Socket.IO client, and Rupee currency formatting! 🚀");
