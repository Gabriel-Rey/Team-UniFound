/* ── PASSWORD VISIBILITY TOGGLE ── */
function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    const icon = btn.querySelector('i');
    if (icon) {
        icon.classList.toggle('fa-eye', !isHidden);
        icon.classList.toggle('fa-eye-slash', isHidden);
    }
}

/* ── SEED DATA (always shown as base) ── */
const SEED = [];
let allItems = [];
let allFoundItems = [];
let activeChip = 'all', currentSort = 'newest', currentReportType = '';
let activeFoundChip = 'all', currentFoundSort = 'newest';
let pendingDeleteId = null, pendingDeleteDocId = null;
let pendingDeleteFoundId = null, pendingDeleteFoundDocId = null;

/* ── HELPERS ── */
function catEmoji(c) {
    return { electronics: '💻', documents: '🪪', accessories: '⌚', clothing: '👕', other: '📦' }[c] || '📦';
}
function avatarColor(uid) {
    const cols = ['#3498db', '#e74c3c', '#9b59b6', '#f39c12', '#27ae60', '#16a085', '#e67e22', '#2980b9'];
    let h = 0;
    for (let i = 0; i < (uid || '').length; i++) h = (h * 31 + uid.charCodeAt(i)) % cols.length;
    return cols[h];
}

/* FIX: Safe helper to get element — avoids repeated getElementById + null crashes */
function $id(id) {
    return document.getElementById(id);
}

/* ── AUTH UI ── */
window.showLogin = function () {
    $id('loginView')?.classList.add('active');
    $id('registerView')?.classList.remove('active');
};
function showRegister() {
    $id('loginView')?.classList.remove('active');
    $id('registerView')?.classList.add('active');
}
function showAuthMsg(el, txt, err) {
    if (!el) return;
    el.innerText = txt;
    el.style.backgroundColor = err ? '#bc5a3c' : '#2c5a70';
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
}

/* ── SIGN IN ── */
$id('signinForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!window._fb) { showAuthMsg($id('formFeedback'), 'Firebase not ready yet, please wait.', true); return; }
    const email = $id('loginEmail').value.trim();
    const password = $id('loginPassword').value;
    const btn = $id('signinBtn');
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
        await window._fb.signInWithEmailAndPassword(window._fb.auth, email, password);
    } catch (err) {
        const msgs = {
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/invalid-credential': 'Incorrect email or password.'
        };
        showAuthMsg($id('formFeedback'), msgs[err.code] || err.message, true);
    } finally {
        btn.disabled = false; btn.textContent = 'Sign In';
    }
});

/* ── REGISTER ── */
$id('registerForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!window._fb) { showAuthMsg($id('regFeedback'), 'Firebase not ready yet.', true); return; }
    const fn = $id('firstName').value.trim();
    const ln = $id('lastName').value.trim();
    const em = $id('regEmail').value.trim();
    const si = $id('studentId').value.trim();
    const fa = $id('faculty').value;
    const un = $id('regUsername').value.trim();
    const pw = $id('regPassword').value;
    const cf = $id('confirmPassword').value;
    const tc = $id('termsCheck').checked;
    const fb = $id('regFeedback');
    if (!fn) { showAuthMsg(fb, 'Please enter your first name.', true); return; }
    if (!ln) { showAuthMsg(fb, 'Please enter your last name.', true); return; }
    if (!em || !em.includes('@')) { showAuthMsg(fb, 'Please enter a valid email.', true); return; }
    if (!si) { showAuthMsg(fb, 'Please enter your Student/Staff ID.', true); return; }
    if (!fa) { showAuthMsg(fb, 'Please select your faculty.', true); return; }
    if (!un) { showAuthMsg(fb, 'Please choose a display name.', true); return; }
    if (pw.length < 8) { showAuthMsg(fb, 'Password must be at least 8 characters.', true); return; }
    if (pw !== cf) { showAuthMsg(fb, 'Passwords do not match.', true); return; }
    if (!tc) { showAuthMsg(fb, 'Please accept the Terms & Conditions.', true); return; }
    const btn = $id('registerBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating…';
    try {
        const cred = await window._fb.createUserWithEmailAndPassword(window._fb.auth, em, pw);
        await window._fb.updateProfile(cred.user, { displayName: un });
        await window._fb.addDoc(window._fb.collection(window._fb.db, 'users'), {
            uid: cred.user.uid, firstName: fn, lastName: ln, email: em,
            studentId: si, faculty: fa, displayName: un, createdAt: window._fb.serverTimestamp()
        });
        showToast(`Welcome, ${fn}! Account created. 🎉`);
    } catch (err) {
        const msgs = {
            'auth/email-already-in-use': 'An account already exists with this email.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/weak-password': 'Password should be at least 6 characters.'
        };
        showAuthMsg($id('regFeedback'), msgs[err.code] || err.message, true);
    } finally {
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
});

/* ── FORGOT PASSWORD ── */
$id('forgotPasswordLink')?.addEventListener('click', async function (e) {
    e.preventDefault();
    if (!window._fb) return;
    const email = $id('loginEmail').value.trim();
    if (!email) { showAuthMsg($id('formFeedback'), 'Enter your email first.', true); return; }
    try {
        await window._fb.sendPasswordResetEmail(window._fb.auth, email);
        showAuthMsg($id('formFeedback'), `Reset link sent to ${email}!`, false);
    } catch (err) {
        showAuthMsg($id('formFeedback'), err.message, true);
    }
});

$id('signUpBtn')?.addEventListener('click', showRegister);
$id('backBtn')?.addEventListener('click', window.showLogin);
$id('goToLoginLink')?.addEventListener('click', e => { e.preventDefault(); window.showLogin(); });

/* ── PASSWORD STRENGTH ── */
$id('regPassword')?.addEventListener('input', function () {
    const v = this.value; let s = 0;
    if (v.length >= 8) s++; if (/[A-Z]/.test(v)) s++; if (/[0-9]/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++;
    const L = [
        { w: '0%', b: 'transparent', l: '' },
        { w: '25%', b: '#e05252', l: 'Weak' },
        { w: '50%', b: '#e2b13b', l: 'Fair' },
        { w: '75%', b: '#4fb3d4', l: 'Good' },
        { w: '100%', b: '#4caf7d', l: 'Strong' }
    ];
    $id('strengthBar').style.width = L[s].w;
    $id('strengthBar').style.background = L[s].b;
    $id('strengthLabel').textContent = L[s].l;
    $id('strengthLabel').style.color = L[s].b;
});

/* ── SIGN OUT ── */
function openSignOutModal() {
    $id('soSpinner')?.classList.remove('on');
    const soBtnRow = $id('soBtnRow');
    if (soBtnRow) soBtnRow.style.display = '';
    const leaveBtn = $id('soLeaveBtn');
    if (leaveBtn) { leaveBtn.disabled = false; leaveBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sign Out'; }
    const name = window._currentUser?.displayName || window._currentUser?.email || 'User';
    const soUsername = $id('soUsername');
    if (soUsername) soUsername.textContent = name;
    $id('signOutModal')?.classList.add('active');
}
function closeSignOutModal() { $id('signOutModal')?.classList.remove('active'); }

async function doSignOut() {
    const leaveBtn = $id('soLeaveBtn');
    const stayBtn = $id('soStayBtn');
    if (leaveBtn) { leaveBtn.disabled = true; leaveBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Signing out…'; }
    if (stayBtn) { stayBtn.style.opacity = '0.4'; stayBtn.style.pointerEvents = 'none'; }
    $id('soSpinner')?.classList.add('on');
    try {
        await window._fb.signOut(window._fb.auth);
        allItems = [...SEED];
        closeSignOutModal();
        goHome();
    } catch (e) {
        showToast('Sign out failed. Try again.', 'error');
    } finally {
        /* FIX: always restore stayBtn regardless of success/failure */
        if (stayBtn) { stayBtn.style.opacity = ''; stayBtn.style.pointerEvents = ''; }
    }
}

$id('signOutModal')?.addEventListener('click', e => { if (e.target === $id('signOutModal')) closeSignOutModal(); });

/* ── NAV ── */
function setActive(el) { document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active')); el.classList.add('active'); }

function hideAllSections() {
    $id('homeContent').style.display = 'none';
    $id('lostContent').style.display = 'none';
    $id('foundContent').style.display = 'none';
    if ($id('profileContent')) $id('profileContent').style.display = 'none';
    /* FIX: remove active from all nav links when switching sections */
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
}

function goHome() {
    hideAllSections();
    $id('homeContent').style.display = '';
    $id('navHome')?.classList.add('active');
}
async function goLost() {
    hideAllSections();
    $id('lostContent').style.display = '';
    $id('navLost')?.classList.add('active');
    await loadFirestoreItems();
    renderLostCards();
}
async function goFound() {
    hideAllSections();
    $id('foundContent').style.display = '';
    $id('navFound')?.classList.add('active');
    await loadFoundItems();
    renderFoundCards();
}

/* ── FIRESTORE: LOAD LOST ITEMS ── */
async function loadFirestoreItems() {
    if (!window._fb) return;
    try {
        const q = window._fb.query(
            window._fb.collection(window._fb.db, 'lostItems'),
            window._fb.orderBy('createdAt', 'desc')
        );
        const snap = await window._fb.getDocs(q);
        const firestoreItems = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                docId: d.id,
                user: data.displayName || 'Anonymous',
                avatar: avatarColor(data.uid),
                date: data.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Recently',
                title: data.itemName,
                location: data.location,
                category: data.category,
                desc: data.description || '',
                emoji: catEmoji(data.category),
                contact: data.contact,
                saved: false,
                owner: data.uid,
                photoBase64: data.photoBase64 || null
            };
        });
        allItems = [...firestoreItems, ...SEED];
    } catch (err) {
        console.error('Firestore load error:', err);
        showToast('Could not load items from database.', 'error');
        allItems = [...SEED];
    }
}

/* ── LOST PAGE RENDER ── */
function setChip(el, cat) {
    document.querySelectorAll('#lostContent .chip').forEach(c => c.classList.remove('active')); /* FIX: scope to lostContent */
    el.classList.add('active');
    activeChip = cat;
    renderLostCards();
}
function filterLostCards() { renderLostCards(); }
function sortCards(v) { currentSort = v; renderLostCards(); }

function isOwner(item) {
    const uid = window._currentUser?.uid || '';
    return uid && item.owner === uid;
}

function renderLostCards() {
    const q = ($id('lostSearchInput')?.value || '').toLowerCase();
    let items = [...allItems];
    if (activeChip !== 'all') items = items.filter(i => i.category === activeChip);
    if (q) items = items.filter(i =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.location || '').toLowerCase().includes(q) ||
        (i.desc || '').toLowerCase().includes(q)
    );
    /* FIX: sort 'newest' correctly — Firestore already returns desc; 'oldest' needs reverse */
    if (currentSort === 'alpha') items.sort((a, b) => a.title.localeCompare(b.title));
    else if (currentSort === 'oldest') items.reverse();
    const grid = $id('lostGrid'), empty = $id('emptyState'), count = $id('resultsCount');
    if (!items.length) { grid.innerHTML = ''; empty.style.display = ''; count.textContent = 'No items found'; return; }
    empty.style.display = 'none';
    count.textContent = `Showing ${items.length} item${items.length !== 1 ? 's' : ''}`;
    grid.innerHTML = items.map((item, idx) => {
        const mine = isOwner(item);
        /* FIX: safe fallback for item.user being empty string */
        const userInitial = (item.user || '?')[0].toUpperCase();
        const imgContent = item.photoBase64
            ? `<img src="${item.photoBase64}" alt="${escapeHtml(item.title)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`
            : `<div class="carousel-slide" style="font-size:4rem;">${item.emoji}</div>`;
        return `
        <div class="item-card" id="item-card-${item.id}" style="animation-delay:${idx * 0.07}s">
            <div class="card-head">
                <div class="avatar" style="background:${item.avatar}">${userInitial}</div>
                <div class="card-meta">
                    <div class="uname">${escapeHtml(item.user)}</div>
                    <div class="udate">${item.date}</div>
                </div>
                ${mine ? '<span class="owner-badge">✦ Mine</span>' : ''}
            </div>
            <div class="carousel" id="car-${item.id}" style="overflow:hidden;border-radius:8px;">
                ${imgContent}
                ${!item.photoBase64 ? `<button class="car-btn prev" onclick="carPrev('${item.id}')">&#8249;</button><button class="car-btn next" onclick="carNext('${item.id}')">&#8250;</button><div class="carousel-dots"><div class="dot active"></div><div class="dot"></div><div class="dot"></div></div>` : ''}
            </div>
            <div class="card-body">
                <div class="card-title">${escapeHtml(item.title)}</div>
                <div class="card-loc"><i class="fas fa-map-marker-alt" style="color:#e74c3c;font-size:0.7rem;"></i> ${escapeHtml(item.location)}</div>
                <div class="card-badge">${(item.category || '').charAt(0).toUpperCase() + (item.category || '').slice(1)}</div>
                <p class="card-desc">${escapeHtml(item.desc)}</p>
            </div>
            <div class="card-foot">
                <button class="btn-save ${item.saved ? 'saved' : ''}" onclick="toggleSave('${item.id}',this)">${item.saved ? '❤️' : '🤍'}</button>
                <div class="card-foot-actions">
                    <button class="btn-contact" onclick="showContact('${item.id}')">Contact</button>
                    ${mine ? `<button class="btn-delete-card" onclick="openDeleteModal('${item.id}','${item.docId || item.id}')"><i class="fas fa-trash-alt"></i> Delete</button>` : ''}
                </div>
            </div>
        </div>`;
    }).join('');
}

/* ── FIRESTORE: LOAD FOUND ITEMS ── */
async function loadFoundItems() {
    if (!window._fb) return;
    try {
        const q = window._fb.query(
            window._fb.collection(window._fb.db, 'foundItems'),
            window._fb.orderBy('createdAt', 'desc')
        );
        const snap = await window._fb.getDocs(q);
        allFoundItems = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                docId: d.id,
                user: data.displayName || 'Anonymous',
                avatar: avatarColor(data.uid),
                date: data.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Recently',
                title: data.itemName,
                location: data.location,
                category: data.category,
                desc: data.description || '',
                emoji: catEmoji(data.category),
                contact: data.contact,
                saved: false,
                owner: data.uid,
                photoBase64: data.photoBase64 || null
            };
        });
    } catch (err) {
        console.error('Firestore found load error:', err);
        showToast('Could not load found items from database.', 'error');
        allFoundItems = [];
    }
}

/* ── FOUND PAGE RENDER ── */
function setFoundChip(el, cat) {
    document.querySelectorAll('#foundContent .chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    activeFoundChip = cat;
    renderFoundCards();
}
function filterFoundCards() { renderFoundCards(); }
function sortFoundCards(v) { currentFoundSort = v; renderFoundCards(); }

function renderFoundCards() {
    const q = ($id('foundSearchInput')?.value || '').toLowerCase();
    let items = [...allFoundItems];
    if (activeFoundChip !== 'all') items = items.filter(i => i.category === activeFoundChip);
    if (q) items = items.filter(i =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.location || '').toLowerCase().includes(q) ||
        (i.desc || '').toLowerCase().includes(q)
    );
    if (currentFoundSort === 'alpha') items.sort((a, b) => a.title.localeCompare(b.title));
    else if (currentFoundSort === 'oldest') items.reverse();
    const grid = $id('foundGrid'), empty = $id('foundEmptyState'), count = $id('foundResultsCount');
    if (!items.length) { grid.innerHTML = ''; empty.style.display = ''; count.textContent = 'No items found'; return; }
    empty.style.display = 'none';
    count.textContent = `Showing ${items.length} item${items.length !== 1 ? 's' : ''}`;
    grid.innerHTML = items.map((item, idx) => {
        const mine = isOwner(item);
        /* FIX: safe fallback for item.user being empty string */
        const userInitial = (item.user || '?')[0].toUpperCase();
        const imgContent = item.photoBase64
            ? `<img src="${item.photoBase64}" alt="${escapeHtml(item.title)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`
            : `<div class="carousel-slide" style="font-size:4rem;">${item.emoji}</div>`;
        return `
        <div class="item-card" id="found-card-${item.id}" style="animation-delay:${idx * 0.07}s">
            <div class="card-head">
                <div class="avatar" style="background:${item.avatar}">${userInitial}</div>
                <div class="card-meta">
                    <div class="uname">${escapeHtml(item.user)}</div>
                    <div class="udate">${item.date}</div>
                </div>
                ${mine ? '<span class="owner-badge">✦ Mine</span>' : ''}
            </div>
            <div class="carousel" id="found-car-${item.id}" style="overflow:hidden;border-radius:8px;">
                ${imgContent}
            </div>
            <div class="card-body">
                <div class="card-title">${escapeHtml(item.title)}</div>
                <div class="card-loc"><i class="fas fa-map-marker-alt" style="color:#27ae60;font-size:0.7rem;"></i> ${escapeHtml(item.location)}</div>
                <div class="card-badge" style="background:#e8f5e9;color:#27ae60;">${(item.category || '').charAt(0).toUpperCase() + (item.category || '').slice(1)}</div>
                <p class="card-desc">${escapeHtml(item.desc)}</p>
            </div>
            <div class="card-foot">
                <button class="btn-save ${item.saved ? 'saved' : ''}" onclick="toggleFoundSave('${item.id}',this)">${item.saved ? '❤️' : '🤍'}</button>
                <div class="card-foot-actions">
                    <button class="btn-contact" style="background:#27ae60;" onclick="showFoundContact('${item.id}')">Contact</button>
                    ${mine ? `<button class="btn-delete-card" onclick="openFoundDeleteModal('${item.id}','${item.docId}')"><i class="fas fa-trash-alt"></i> Delete</button>` : ''}
                </div>
            </div>
        </div>`;
    }).join('');
}

function toggleFoundSave(id, btn) {
    const item = allFoundItems.find(i => i.id == id); if (!item) return;
    item.saved = !item.saved; btn.classList.toggle('saved', item.saved); btn.textContent = item.saved ? '❤️' : '🤍';
    showToast(item.saved ? 'Item saved!' : 'Removed from saved.');
}
function showFoundContact(id) {
    const item = allFoundItems.find(i => i.id == id); if (!item) return;
    $id('contactModalBody').innerHTML = `
        <p><strong>Item:</strong> ${escapeHtml(item.title)}</p>
        <p><strong>Found by:</strong> ${escapeHtml(item.user)}</p>
        <p><strong>Contact:</strong> ${escapeHtml(item.contact)}</p>
        <p style="margin-top:0.8rem;font-size:0.78rem;color:#aaa;">Please reach out respectfully. UniFound does not mediate disputes.</p>`;
    $id('contactModal')?.classList.add('active');
}

function openFoundDeleteModal(id, docId) {
    const item = allFoundItems.find(i => i.id == id); if (!item) return;
    pendingDeleteFoundId = id; pendingDeleteFoundDocId = docId;
    const delItemName = $id('delItemName');
    if (delItemName) delItemName.textContent = item.title;
    const btn = $id('delConfirmBtn');
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
        btn.onclick = confirmFoundDelete;
    }
    $id('deleteModal')?.classList.add('active');
}

async function confirmFoundDelete() {
    if (pendingDeleteFoundId === null) return;
    const id = pendingDeleteFoundId, docId = pendingDeleteFoundDocId;
    const btn = $id('delConfirmBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting…';
    try {
        if (window._fb && docId) {
            await window._fb.deleteDoc(window._fb.doc(window._fb.db, 'foundItems', docId));
        }
        const cardEl = $id(`found-card-${id}`);
        if (cardEl) { cardEl.classList.add('deleting'); await new Promise(r => setTimeout(r, 350)); }
        allFoundItems = allFoundItems.filter(i => i.id != id);
        closeDeleteModal(); renderFoundCards();
        showToast('🗑️ Report deleted successfully.');
    } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
    }
}

/* ── CAROUSEL ── */
const carStates = {};
function carNext(id) { carStates[id] = ((carStates[id] || 0) + 1) % 3; updateCarousel(id); }
function carPrev(id) { carStates[id] = ((carStates[id] || 0) + 2) % 3; updateCarousel(id); }
function updateCarousel(id) {
    const item = allItems.find(i => i.id == id); if (!item) return;
    const car = $id(`car-${id}`); if (!car) return;
    const idx = carStates[id] || 0;
    const slides = [
        `<div class="carousel-slide" style="font-size:4rem;">${item.emoji}</div>`,
        `<div class="carousel-slide" style="background:#dde;font-size:0.85rem;color:#999;flex-direction:column;gap:4px;display:flex;align-items:center;justify-content:center;">📷<span>No image 2</span></div>`,
        `<div class="carousel-slide" style="background:#eed;font-size:0.85rem;color:#999;flex-direction:column;gap:4px;display:flex;align-items:center;justify-content:center;">📷<span>No image 3</span></div>`
    ];
    car.innerHTML = slides[idx] + `<button class="car-btn prev" onclick="carPrev('${id}')">&#8249;</button><button class="car-btn next" onclick="carNext('${id}')">&#8250;</button><div class="carousel-dots">${[0, 1, 2].map(i => `<div class="dot${i === idx ? ' active' : ''}"></div>`).join('')}</div>`;
}

function toggleSave(id, btn) {
    const item = allItems.find(i => i.id == id); if (!item) return;
    item.saved = !item.saved; btn.classList.toggle('saved', item.saved); btn.textContent = item.saved ? '❤️' : '🤍';
    showToast(item.saved ? 'Item saved!' : 'Removed from saved.');
}
function showContact(id) {
    const item = allItems.find(i => i.id == id); if (!item) return;
    $id('contactModalBody').innerHTML = `
        <p><strong>Item:</strong> ${escapeHtml(item.title)}</p>
        <p><strong>Reported by:</strong> ${escapeHtml(item.user)}</p>
        <p><strong>Contact:</strong> ${escapeHtml(item.contact)}</p>
        <p style="margin-top:0.8rem;font-size:0.78rem;color:#aaa;">Please reach out respectfully. UniFound does not mediate disputes.</p>`;
    $id('contactModal')?.classList.add('active');
}
function closeContactModal() { $id('contactModal')?.classList.remove('active'); }

/* ── DELETE (LOST) ── */
function openDeleteModal(id, docId) {
    const item = allItems.find(i => i.id == id); if (!item) return;
    pendingDeleteId = id; pendingDeleteDocId = docId;
    const delItemName = $id('delItemName');
    if (delItemName) delItemName.textContent = item.title;
    const btn = $id('delConfirmBtn');
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
        btn.onclick = confirmDelete;
    }
    $id('deleteModal')?.classList.add('active');
}
function closeDeleteModal() {
    $id('deleteModal')?.classList.remove('active');
    pendingDeleteId = null; pendingDeleteDocId = null;
    /* FIX: also reset found delete state when modal closes generically */
    pendingDeleteFoundId = null; pendingDeleteFoundDocId = null;
}
async function confirmDelete() {
    if (pendingDeleteId === null) return;
    const id = pendingDeleteId, docId = pendingDeleteDocId;
    const btn = $id('delConfirmBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting…';
    try {
        if (window._fb && docId && !String(docId).startsWith('seed')) {
            await window._fb.deleteDoc(window._fb.doc(window._fb.db, 'lostItems', docId));
        }
        const cardEl = $id(`item-card-${id}`);
        if (cardEl) { cardEl.classList.add('deleting'); await new Promise(r => setTimeout(r, 350)); }
        allItems = allItems.filter(i => i.id != id);
        closeDeleteModal(); renderLostCards();
        showToast('🗑️ Report deleted successfully.');
    } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
    }
}
$id('deleteModal')?.addEventListener('click', e => { if (e.target === $id('deleteModal')) closeDeleteModal(); });

/* ── REPORT MODAL ── */
function openModal(type) {
    currentReportType = type;
    const t = $id('modalTitle');
    if (t) {
        t.textContent = type === 'lost' ? 'Report Lost Item' : 'Report Found Item';
        t.style.color = type === 'lost' ? '#e74c3c' : '#27ae60';
    }
    $id('reportModal')?.classList.add('active');
    const di = $id('date'); if (di) di.valueAsDate = new Date();
}
function closeModal() {
    $id('reportModal')?.classList.remove('active');
    $id('reportForm')?.reset();
    removePhoto();
}

/* ── PHOTO UPLOAD ── */
window._selectedPhotoBase64 = null;

window.handlePhotoSelect = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Photo must be under 5MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = function (ev) {
        window._selectedPhotoBase64 = ev.target.result;
        $id('photoPreview').src = ev.target.result;
        $id('photoPlaceholder').style.display = 'none';
        $id('photoPreviewWrap').style.display = 'block';
    };
    reader.readAsDataURL(file);
};

window.removePhoto = function (e) {
    if (e) e.stopPropagation();
    window._selectedPhotoBase64 = null;
    const itemPhoto = $id('itemPhoto');
    if (itemPhoto) itemPhoto.value = '';
    $id('photoPreview').src = '';
    $id('photoPlaceholder').style.display = 'flex';
    $id('photoPreviewWrap').style.display = 'none';
};

/* FIX: expose removePhoto as a plain function too (called from closeModal) */
function removePhoto(e) { window.removePhoto(e); }

async function handleSubmit(e) {
    e.preventDefault();
    if (!window._currentUser) { showToast('Please sign in to report items.', 'error'); return; }
    if (!window._fb) { showToast('Firebase not ready yet.', 'error'); return; }
    const btn = $id('submitReportBtn');
    btn.textContent = 'Submitting…'; btn.disabled = true;
    const data = {
        type: currentReportType,
        itemName: $id('itemName').value,
        category: $id('category').value,
        location: $id('location').value,
        date: $id('date').value,
        description: $id('description').value,
        contact: $id('contact').value,
        uid: window._currentUser.uid,
        displayName: window._currentUser.displayName || window._currentUser.email,
        createdAt: window._fb.serverTimestamp(),
        photoBase64: window._selectedPhotoBase64 || null
    };
    try {
        const collectionName = data.type === 'lost' ? 'lostItems' : 'foundItems';
        const docRef = await window._fb.addDoc(window._fb.collection(window._fb.db, collectionName), data);
        const newCard = {
            id: docRef.id, docId: docRef.id,
            user: data.displayName,
            avatar: avatarColor(data.uid),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            title: data.itemName, location: data.location, category: data.category,
            desc: data.description || '', emoji: catEmoji(data.category),
            contact: data.contact, saved: false, owner: data.uid,
            photoBase64: data.photoBase64 || null
        };
        if (data.type === 'lost') {
            allItems.unshift(newCard);
        } else {
            allFoundItems.unshift(newCard);
        }
        btn.textContent = 'Submit Report'; btn.disabled = false;
        closeModal();
        showToast(data.type === 'lost' ? '✅ Lost item saved to database!' : '✅ Found item saved! Thank you.');
        createConfetti();
        if ($id('lostContent').style.display !== 'none') renderLostCards();
        if ($id('foundContent').style.display !== 'none') renderFoundCards();
    } catch (err) {
        showToast('Submit failed: ' + err.message, 'error');
        btn.textContent = 'Submit Report'; btn.disabled = false;
    }
}

/* ── TOAST ── */
function showToast(msg, type = 'success') {
    const t = $id('toast'); if (!t) return;
    t.className = `toast ${type}`;
    const icon = $id('toastIcon');
    const message = $id('toastMessage');
    if (icon) icon.textContent = type === 'success' ? '✓' : '✕';
    if (message) message.textContent = msg;
    t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500);
}

/* ── CONFETTI ── */
function createConfetti() {
    const cols = ['#e74c3c', '#27ae60', '#f39c12', '#3498db', '#9b59b6'];
    for (let i = 0; i < 40; i++) {
        const c = document.createElement('div');
        c.style.cssText = `position:fixed;width:9px;height:9px;background:${cols[Math.floor(Math.random() * cols.length)]};left:${Math.random() * 100}vw;top:-10px;border-radius:50%;z-index:9999;pointer-events:none;`;
        document.body.appendChild(c);
        const a = c.animate([
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], { duration: Math.random() * 3000 + 2000, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)' });
        a.onfinish = () => c.remove();
    }
}

/* ── PARALLAX ── */
/* FIX: throttle mousemove with requestAnimationFrame to avoid layout thrashing */
let _rafPending = false;
document.addEventListener('mousemove', e => {
    if (_rafPending) return;
    _rafPending = true;
    requestAnimationFrame(() => {
        document.querySelectorAll('.hero-img').forEach((img, i) => {
            const sp = (i + 1) * 0.5;
            const x = (window.innerWidth - e.pageX * 2) / 100;
            const y = (window.innerHeight - e.pageY * 2) / 100;
            img.style.transform = `translate(${x * sp}px,${y * sp}px) rotate(${i === 0 ? -5 : i === 1 ? 5 : -3}deg)`;
        });
        _rafPending = false;
    });
});

/* ── ESC / OUTSIDE CLICK ── */
$id('reportModal')?.addEventListener('click', e => { if (e.target === $id('reportModal')) closeModal(); });
$id('contactModal')?.addEventListener('click', e => { if (e.target === $id('contactModal')) closeContactModal(); });
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeContactModal(); closeSignOutModal(); closeDeleteModal(); closeEditProfileModal(); }
});

/* ── PROFILE PAGE ── */
async function goProfile() {
    hideAllSections();
    const profileContent = $id('profileContent');
    if (profileContent) profileContent.style.display = '';
    $id('navProfile')?.classList.add('active');
    await loadProfileData();
}

async function loadProfileData() {
    const user = window._currentUser;
    if (!user) return;

    const avatarEl = $id('profileAvatar');
    if (avatarEl) {
        avatarEl.style.background = avatarColor(user.uid);
        avatarEl.textContent = (user.displayName || user.email || '?')[0].toUpperCase();
        // Try to load saved profile photo from Firestore
        try {
            const snap = await window._fb.getDocs(window._fb.query(
                window._fb.collection(window._fb.db, 'users'),
                window._fb.where('uid', '==', user.uid),
                window._fb.limit(1)
            ));
            const uDoc = snap.docs[0]?.data();
            if (uDoc?.photoBase64) {
                avatarEl.textContent = '';
                avatarEl.style.background = 'none';
                avatarEl.style.backgroundImage = `url(${uDoc.photoBase64})`;
                avatarEl.style.backgroundSize = 'cover';
                avatarEl.style.backgroundPosition = 'center';
            }
        } catch (_) { /* silently fail */ }
    }

    const setText = (id, val) => { const el = $id(id); if (el) el.textContent = val; };
    setText('profileDisplayName', user.displayName || 'Anonymous');
    setText('profileEmail', user.email || '—');
    setText('detailDisplayName', user.displayName || '—');
    setText('detailEmail', user.email || '—');

    if (user.metadata?.creationTime) {
        const d = new Date(user.metadata.creationTime);
        setText('detailJoined', d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    }

    if (!window._fb) return;

    /* Load extra profile data from Firestore */
    try {
        const snap = await window._fb.getDocs(
            window._fb.query(window._fb.collection(window._fb.db, 'users'),
                window._fb.where('uid', '==', user.uid),
                window._fb.limit(1))   /* FIX: query only this user's doc instead of all users */
        );
        const userDoc = snap.docs[0]?.data();
        if (userDoc) {
            if (userDoc.firstName && userDoc.lastName) {
                const rowName = $id('rowName');
                if (rowName) rowName.style.display = '';
                setText('detailFullName', `${userDoc.firstName} ${userDoc.lastName}`);
            }
            if (userDoc.studentId) {
                const rowStudentId = $id('rowStudentId');
                if (rowStudentId) rowStudentId.style.display = '';
                setText('detailStudentId', userDoc.studentId);
            }
            if (userDoc.faculty) {
                const rowFaculty = $id('rowFaculty');
                if (rowFaculty) rowFaculty.style.display = '';
                setText('detailFaculty', userDoc.faculty);
                const badge = $id('profileFacultyBadge');
                if (badge) badge.style.display = '';
                setText('profileFacultyText', userDoc.faculty);
            }
        }
    } catch (e) { /* silently fail */ }

    /* Load user's lost & found reports */
    try {
        /* NOTE: orderBy('createdAt') + where('uid') requires a Firestore composite index.
           To avoid that dependency, we filter by uid only and sort client-side. */
        const [lostSnap, foundSnap] = await Promise.all([
            window._fb.getDocs(window._fb.query(
                window._fb.collection(window._fb.db, 'lostItems'),
                window._fb.where('uid', '==', user.uid)
            )),
            window._fb.getDocs(window._fb.query(
                window._fb.collection(window._fb.db, 'foundItems'),
                window._fb.where('uid', '==', user.uid)
            ))
        ]);
        const sortByDate = (a, b) => {
            const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return tb - ta;
        };
        const myLost = lostSnap.docs.map(d => ({ ...d.data(), docId: d.id, type: 'lost' })).sort(sortByDate);
        const myFound = foundSnap.docs.map(d => ({ ...d.data(), docId: d.id, type: 'found' })).sort(sortByDate);
        const all = [...myLost, ...myFound].sort(sortByDate);

        const setNum = (id, n) => { const el = $id(id); if (el) el.textContent = n; };
        setNum('statLost', myLost.length);
        setNum('statFound', myFound.length);
        setNum('statTotal', all.length);

        const listEl = $id('myReportsList');
        if (!listEl) return;
        if (!all.length) {
            listEl.innerHTML = `<div class="profile-empty"><span>📭</span><p>You haven't posted any reports yet.</p><button class="profile-report-btn" onclick="openModal('lost')"><i class="fas fa-plus"></i> Report an Item</button></div>`;
        } else {
            listEl.innerHTML = all.map(item => `
                <div class="profile-report-item">
                    <div class="pri-emoji">${catEmoji(item.category)}</div>
                    <div class="pri-info">
                        <div class="pri-title">${escapeHtml(item.itemName)}</div>
                        <div class="pri-meta"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.location)}</div>
                    </div>
                    <span class="pri-tag ${item.type === 'lost' ? 'tag-lost' : 'tag-found'}">${item.type === 'lost' ? 'Lost' : 'Found'}</span>
                </div>
            `).join('');
        }
    } catch (e) {
        const listEl = $id('myReportsList');
        if (listEl) listEl.innerHTML = `<div class="profile-loading">Could not load reports.</div>`;
    }
}

/* ── AVATAR PHOTO UPLOAD ── */
async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }

    const MAX_SIZE = 200; // px — keep base64 small for Firestore
    const reader = new FileReader();
    reader.onload = async (ev) => {
        const img = new Image();
        img.onload = async () => {
            // Resize to MAX_SIZE via canvas
            const canvas = document.createElement('canvas');
            const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height, 1);
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.82);

            // Update avatar UI immediately
            const avatarEl = $id('profileAvatar');
            if (avatarEl) {
                avatarEl.textContent = '';
                avatarEl.style.background = 'none';
                avatarEl.style.backgroundImage = `url(${base64})`;
                avatarEl.style.backgroundSize = 'cover';
                avatarEl.style.backgroundPosition = 'center';
            }

            // Save to Firestore user doc
            try {
                const user = window._currentUser;
                const snap = await window._fb.getDocs(window._fb.query(
                    window._fb.collection(window._fb.db, 'users'),
                    window._fb.where('uid', '==', user.uid),
                    window._fb.limit(1)
                ));
                if (snap.docs[0]) {
                    await window._fb.updateDoc(snap.docs[0].ref, { photoBase64: base64 });
                } else {
                    // Create user doc if missing
                    await window._fb.addDoc(window._fb.collection(window._fb.db, 'users'), {
                        uid: user.uid, photoBase64: base64,
                        displayName: user.displayName || '', email: user.email,
                        createdAt: window._fb.serverTimestamp()
                    });
                }
            } catch (err) {
                console.error('Failed to save avatar:', err);
                alert('Photo shown but could not be saved: ' + (err.message || err));
            }
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ── EDIT PROFILE ── */
function openEditProfileModal() {
    const user = window._currentUser;
    if (!user) return;
    const modal = $id('editProfileModal');
    if (!modal) return;
    const nameInput = $id('editDisplayName');
    if (nameInput) nameInput.value = user.displayName || '';
    $id('editProfileError').textContent = '';
    $id('editProfileSuccess').textContent = '';
    $id('editSaveBtn').disabled = false;
    $id('editSaveBtn').textContent = 'Save Changes';
    $id('editNewPassword').value = '';
    $id('editConfirmPassword').value = '';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEditProfileModal() {
    const modal = $id('editProfileModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

async function saveProfileChanges() {
    const user = window._currentUser;
    if (!user) return;
    const newName = ($id('editDisplayName').value || '').trim();
    const newPassword = ($id('editNewPassword').value || '').trim();
    const confirmPassword = ($id('editConfirmPassword').value || '').trim();
    const errEl = $id('editProfileError');
    const okEl = $id('editProfileSuccess');
    const btn = $id('editSaveBtn');

    errEl.textContent = '';
    okEl.textContent = '';

    if (!newName) { errEl.textContent = 'Display name cannot be empty.'; return; }
    if (newPassword && newPassword.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }
    if (newPassword && newPassword !== confirmPassword) { errEl.textContent = 'Passwords do not match.'; return; }

    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
        // Update display name in Firebase Auth
        await window._fb.updateProfile(user, { displayName: newName });

        // Update display name in Firestore users collection
        try {
            const snap = await window._fb.getDocs(window._fb.query(
                window._fb.collection(window._fb.db, 'users'),
                window._fb.where('uid', '==', user.uid),
                window._fb.limit(1)
            ));
            if (snap.docs[0]) {
                await window._fb.updateDoc(snap.docs[0].ref, { displayName: newName });
            }
        } catch (_) { /* non-critical */ }

        // Update password if provided
        if (newPassword) {
            await window._fb.updatePassword(user, newPassword);
        }

        // Refresh displayed name
        setText('profileDisplayName', newName);
        setText('detailDisplayName', newName);
        const avatarEl = $id('profileAvatar');
        if (avatarEl) avatarEl.textContent = newName[0].toUpperCase();

        okEl.textContent = '✅ Profile updated successfully!';
        btn.textContent = 'Saved!';
        $id('editNewPassword').value = '';
        $id('editConfirmPassword').value = '';
        setTimeout(closeEditProfileModal, 1500);
    } catch (e) {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
        if (e.code === 'auth/requires-recent-login') {
            errEl.textContent = 'Please sign out and sign back in before changing your password.';
        } else {
            errEl.textContent = e.message || 'Failed to update profile.';
        }
    }
}