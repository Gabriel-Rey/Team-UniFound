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
    const cols = ['#3498db','#e74c3c','#9b59b6','#f39c12','#27ae60','#16a085','#e67e22','#2980b9'];
    let h = 0;
    for (let i = 0; i < (uid || '').length; i++) h = (h * 31 + uid.charCodeAt(i)) % cols.length;
    return cols[h];
}

/* ── AUTH UI ── */
window.showLogin = function () {
    document.getElementById('loginView').classList.add('active');
    document.getElementById('registerView').classList.remove('active');
};
function showRegister() {
    document.getElementById('loginView').classList.remove('active');
    document.getElementById('registerView').classList.add('active');
}
function showAuthMsg(el, txt, err) {
    if (!el) return;
    el.innerText = txt;
    el.style.backgroundColor = err ? '#bc5a3c' : '#2c5a70';
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
}

/* ── SIGN IN ── */
document.getElementById('signinForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!window._fb) { showAuthMsg(document.getElementById('formFeedback'), 'Firebase not ready yet, please wait.', true); return; }
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('signinBtn');
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
        showAuthMsg(document.getElementById('formFeedback'), msgs[err.code] || err.message, true);
    } finally {
        btn.disabled = false; btn.textContent = 'Sign In';
    }
});

/* ── REGISTER ── */
document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!window._fb) { showAuthMsg(document.getElementById('regFeedback'), 'Firebase not ready yet.', true); return; }
    const fn = document.getElementById('firstName').value.trim();
    const ln = document.getElementById('lastName').value.trim();
    const em = document.getElementById('regEmail').value.trim();
    const si = document.getElementById('studentId').value.trim();
    const fa = document.getElementById('faculty').value;
    const un = document.getElementById('regUsername').value.trim();
    const pw = document.getElementById('regPassword').value;
    const cf = document.getElementById('confirmPassword').value;
    const tc = document.getElementById('termsCheck').checked;
    const fb = document.getElementById('regFeedback');
    if (!fn) { showAuthMsg(fb, 'Please enter your first name.', true); return; }
    if (!ln) { showAuthMsg(fb, 'Please enter your last name.', true); return; }
    if (!em || !em.includes('@')) { showAuthMsg(fb, 'Please enter a valid email.', true); return; }
    if (!si) { showAuthMsg(fb, 'Please enter your Student/Staff ID.', true); return; }
    if (!fa) { showAuthMsg(fb, 'Please select your faculty.', true); return; }
    if (!un) { showAuthMsg(fb, 'Please choose a display name.', true); return; }
    if (pw.length < 8) { showAuthMsg(fb, 'Password must be at least 8 characters.', true); return; }
    if (pw !== cf) { showAuthMsg(fb, 'Passwords do not match.', true); return; }
    if (!tc) { showAuthMsg(fb, 'Please accept the Terms & Conditions.', true); return; }
    const btn = document.getElementById('registerBtn');
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
        showAuthMsg(document.getElementById('regFeedback'), msgs[err.code] || err.message, true);
    } finally {
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
});

/* ── FORGOT PASSWORD ── */
document.getElementById('forgotPasswordLink').addEventListener('click', async function (e) {
    e.preventDefault();
    if (!window._fb) return;
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) { showAuthMsg(document.getElementById('formFeedback'), 'Enter your email first.', true); return; }
    try {
        await window._fb.sendPasswordResetEmail(window._fb.auth, email);
        showAuthMsg(document.getElementById('formFeedback'), `Reset link sent to ${email}!`, false);
    } catch (err) {
        showAuthMsg(document.getElementById('formFeedback'), err.message, true);
    }
});

document.getElementById('signUpBtn').addEventListener('click', showRegister);
document.getElementById('backBtn').addEventListener('click', window.showLogin);
document.getElementById('goToLoginLink').addEventListener('click', e => { e.preventDefault(); window.showLogin(); });

/* ── PASSWORD STRENGTH ── */
document.getElementById('regPassword').addEventListener('input', function () {
    const v = this.value; let s = 0;
    if (v.length >= 8) s++; if (/[A-Z]/.test(v)) s++; if (/[0-9]/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++;
    const L = [
        { w: '0%', b: 'transparent', l: '' },
        { w: '25%', b: '#e05252', l: 'Weak' },
        { w: '50%', b: '#e2b13b', l: 'Fair' },
        { w: '75%', b: '#4fb3d4', l: 'Good' },
        { w: '100%', b: '#4caf7d', l: 'Strong' }
    ];
    document.getElementById('strengthBar').style.width = L[s].w;
    document.getElementById('strengthBar').style.background = L[s].b;
    document.getElementById('strengthLabel').textContent = L[s].l;
    document.getElementById('strengthLabel').style.color = L[s].b;
});

/* ── SIGN OUT ── */
function openSignOutModal() {
    document.getElementById('soSpinner').classList.remove('on');
    document.getElementById('soBtnRow').style.display = '';
    document.getElementById('soLeaveBtn').disabled = false;
    document.getElementById('soLeaveBtn').innerHTML = '<i class="fas fa-sign-out-alt"></i> Sign Out';
    const name = window._currentUser?.displayName || window._currentUser?.email || 'User';
    document.getElementById('soUsername').textContent = name;
    document.getElementById('signOutModal').classList.add('active');
}
function closeSignOutModal() { document.getElementById('signOutModal').classList.remove('active'); }
async function doSignOut() {
    const leaveBtn = document.getElementById('soLeaveBtn');
    const stayBtn = document.getElementById('soStayBtn');
    leaveBtn.disabled = true;
    leaveBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Signing out…';
    stayBtn.style.opacity = '0.4'; stayBtn.style.pointerEvents = 'none';
    document.getElementById('soSpinner').classList.add('on');
    try {
        await window._fb.signOut(window._fb.auth);
        allItems = [...SEED];
        closeSignOutModal();
        goHome();
    } catch (e) { showToast('Sign out failed. Try again.', 'error'); }
    stayBtn.style.opacity = ''; stayBtn.style.pointerEvents = '';
}
document.getElementById('signOutModal').addEventListener('click', e => { if (e.target === document.getElementById('signOutModal')) closeSignOutModal(); });

/* ── NAV ── */
function setActive(el) { document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active')); el.classList.add('active'); }
function goHome() {
    document.getElementById('homeContent').style.display = '';
    document.getElementById('lostContent').style.display = 'none';
    document.getElementById('foundContent').style.display = 'none';
    if(document.getElementById('profileContent')) document.getElementById('profileContent').style.display = 'none';
    document.getElementById('navHome').classList.add('active');
}
async function goLost() {
    document.getElementById('homeContent').style.display = 'none';
    document.getElementById('lostContent').style.display = '';
    document.getElementById('foundContent').style.display = 'none';
    if(document.getElementById('profileContent')) document.getElementById('profileContent').style.display = 'none';
    document.getElementById('navLost').classList.add('active');
    await loadFirestoreItems();
    renderLostCards();
}
async function goFound() {
    document.getElementById('homeContent').style.display = 'none';
    document.getElementById('lostContent').style.display = 'none';
    document.getElementById('foundContent').style.display = '';
    if(document.getElementById('profileContent')) document.getElementById('profileContent').style.display = 'none';
    document.getElementById('navFound').classList.add('active');
    await loadFoundItems();
    renderFoundCards();
}

/* ── FIRESTORE: LOAD ITEMS ── */
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
                owner: data.uid
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
function setChip(el, cat) { document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); el.classList.add('active'); activeChip = cat; renderLostCards(); }
function filterLostCards() { renderLostCards(); }
function sortCards(v) { currentSort = v; renderLostCards(); }

function isOwner(item) {
    const uid = window._currentUser?.uid || '';
    return uid && item.owner === uid;
}

function renderLostCards() {
    const q = (document.getElementById('lostSearchInput').value || '').toLowerCase();
    let items = [...allItems];
    if (activeChip !== 'all') items = items.filter(i => i.category === activeChip);
    if (q) items = items.filter(i => i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q));
    if (currentSort === 'alpha') items.sort((a, b) => a.title.localeCompare(b.title));
    else if (currentSort === 'oldest') items.reverse();
    const grid = document.getElementById('lostGrid'), empty = document.getElementById('emptyState'), count = document.getElementById('resultsCount');
    if (!items.length) { grid.innerHTML = ''; empty.style.display = ''; count.textContent = 'No items found'; return; }
    empty.style.display = 'none';
    count.textContent = `Showing ${items.length} item${items.length !== 1 ? 's' : ''}`;
    grid.innerHTML = items.map((item, idx) => {
        const mine = isOwner(item);
        const imgContent = item.photoBase64
            ? `<img src="${item.photoBase64}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`
            : `<div class="carousel-slide" style="font-size:4rem;">${item.emoji}</div>`;
        return `
        <div class="item-card" id="item-card-${item.id}" style="animation-delay:${idx * 0.07}s">
            <div class="card-head">
                <div class="avatar" style="background:${item.avatar}">${item.user[0].toUpperCase()}</div>
                <div class="card-meta">
                    <div class="uname">${item.user}</div>
                    <div class="udate">${item.date}</div>
                </div>
                ${mine ? '<span class="owner-badge">✦ Mine</span>' : ''}
            </div>
            <div class="carousel" id="car-${item.id}" style="overflow:hidden;border-radius:8px;">
                ${imgContent}
                ${!item.photoBase64 ? `<button class="car-btn prev" onclick="carPrev('${item.id}')">&#8249;</button><button class="car-btn next" onclick="carNext('${item.id}')">&#8250;</button><div class="carousel-dots"><div class="dot active"></div><div class="dot"></div><div class="dot"></div></div>` : ''}
            </div>
            <div class="card-body">
                <div class="card-title">${item.title}</div>
                <div class="card-loc"><i class="fas fa-map-marker-alt" style="color:#e74c3c;font-size:0.7rem;"></i> ${item.location}</div>
                <div class="card-badge">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</div>
                <p class="card-desc">${item.desc}</p>
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
function setFoundChip(el, cat) { document.querySelectorAll('#foundContent .chip').forEach(c => c.classList.remove('active')); el.classList.add('active'); activeFoundChip = cat; renderFoundCards(); }
function filterFoundCards() { renderFoundCards(); }
function sortFoundCards(v) { currentFoundSort = v; renderFoundCards(); }

function renderFoundCards() {
    const q = (document.getElementById('foundSearchInput').value || '').toLowerCase();
    let items = [...allFoundItems];
    if (activeFoundChip !== 'all') items = items.filter(i => i.category === activeFoundChip);
    if (q) items = items.filter(i => i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q));
    if (currentFoundSort === 'alpha') items.sort((a, b) => a.title.localeCompare(b.title));
    else if (currentFoundSort === 'oldest') items.reverse();
    const grid = document.getElementById('foundGrid'), empty = document.getElementById('foundEmptyState'), count = document.getElementById('foundResultsCount');
    if (!items.length) { grid.innerHTML = ''; empty.style.display = ''; count.textContent = 'No items found'; return; }
    empty.style.display = 'none';
    count.textContent = `Showing ${items.length} item${items.length !== 1 ? 's' : ''}`;
    grid.innerHTML = items.map((item, idx) => {
        const mine = isOwner(item);
        const imgContent = item.photoBase64
            ? `<img src="${item.photoBase64}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`
            : `<div class="carousel-slide" style="font-size:4rem;">${item.emoji}</div>`;
        return `
        <div class="item-card" id="found-card-${item.id}" style="animation-delay:${idx * 0.07}s">
            <div class="card-head">
                <div class="avatar" style="background:${item.avatar}">${item.user[0].toUpperCase()}</div>
                <div class="card-meta">
                    <div class="uname">${item.user}</div>
                    <div class="udate">${item.date}</div>
                </div>
                ${mine ? '<span class="owner-badge">✦ Mine</span>' : ''}
            </div>
            <div class="carousel" id="found-car-${item.id}" style="overflow:hidden;border-radius:8px;">
                ${imgContent}
            </div>
            <div class="card-body">
                <div class="card-title">${item.title}</div>
                <div class="card-loc"><i class="fas fa-map-marker-alt" style="color:#27ae60;font-size:0.7rem;"></i> ${item.location}</div>
                <div class="card-badge" style="background:#e8f5e9;color:#27ae60;">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</div>
                <p class="card-desc">${item.desc}</p>
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
    document.getElementById('contactModalBody').innerHTML = `<p><strong>Item:</strong> ${item.title}</p><p><strong>Found by:</strong> ${item.user}</p><p><strong>Contact:</strong> ${item.contact}</p><p style="margin-top:0.8rem;font-size:0.78rem;color:#aaa;">Please reach out respectfully. UniFound does not mediate disputes.</p>`;
    document.getElementById('contactModal').classList.add('active');
}

function openFoundDeleteModal(id, docId) {
    const item = allFoundItems.find(i => i.id == id); if (!item) return;
    pendingDeleteFoundId = id; pendingDeleteFoundDocId = docId;
    document.getElementById('delItemName').textContent = item.title;
    document.getElementById('delConfirmBtn').disabled = false;
    document.getElementById('delConfirmBtn').innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
    document.getElementById('delConfirmBtn').onclick = confirmFoundDelete;
    document.getElementById('deleteModal').classList.add('active');
}
async function confirmFoundDelete() {
    if (pendingDeleteFoundId === null) return;
    const id = pendingDeleteFoundId, docId = pendingDeleteFoundDocId;
    const btn = document.getElementById('delConfirmBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting…';
    try {
        if (window._fb && docId) {
            await window._fb.deleteDoc(window._fb.doc(window._fb.db, 'foundItems', docId));
        }
        const cardEl = document.getElementById(`found-card-${id}`);
        if (cardEl) { cardEl.classList.add('deleting'); await new Promise(r => setTimeout(r, 350)); }
        allFoundItems = allFoundItems.filter(i => i.id != id);
        closeDeleteModal(); renderFoundCards();
        showToast('🗑️ Report deleted successfully.', 'error');
    } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
    }
}


const carStates = {};
function carNext(id) { carStates[id] = ((carStates[id] || 0) + 1) % 3; updateCarousel(id); }
function carPrev(id) { carStates[id] = ((carStates[id] || 0) + 2) % 3; updateCarousel(id); }
function updateCarousel(id) {
    const item = allItems.find(i => i.id == id); if (!item) return;
    const car = document.getElementById(`car-${id}`); if (!car) return;
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
    document.getElementById('contactModalBody').innerHTML = `<p><strong>Item:</strong> ${item.title}</p><p><strong>Reported by:</strong> ${item.user}</p><p><strong>Contact:</strong> ${item.contact}</p><p style="margin-top:0.8rem;font-size:0.78rem;color:#aaa;">Please reach out respectfully. UniFound does not mediate disputes.</p>`;
    document.getElementById('contactModal').classList.add('active');
}
function closeContactModal() { document.getElementById('contactModal').classList.remove('active'); }

/* ── DELETE ── */
function openDeleteModal(id, docId) {
    const item = allItems.find(i => i.id == id); if (!item) return;
    pendingDeleteId = id; pendingDeleteDocId = docId;
    document.getElementById('delItemName').textContent = item.title;
    document.getElementById('delConfirmBtn').disabled = false;
    document.getElementById('delConfirmBtn').innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
    document.getElementById('delConfirmBtn').onclick = confirmDelete;
    document.getElementById('deleteModal').classList.add('active');
}
function closeDeleteModal() { document.getElementById('deleteModal').classList.remove('active'); pendingDeleteId = null; pendingDeleteDocId = null; }
async function confirmDelete() {
    if (pendingDeleteId === null) return;
    const id = pendingDeleteId, docId = pendingDeleteDocId;
    const btn = document.getElementById('delConfirmBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting…';
    try {
        if (window._fb && docId && !String(docId).startsWith('seed')) {
            await window._fb.deleteDoc(window._fb.doc(window._fb.db, 'lostItems', docId));
        }
        const cardEl = document.getElementById(`item-card-${id}`);
        if (cardEl) { cardEl.classList.add('deleting'); await new Promise(r => setTimeout(r, 350)); }
        allItems = allItems.filter(i => i.id != id);
        closeDeleteModal(); renderLostCards();
        showToast('🗑️ Report deleted successfully.', 'error');
    } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
    }
}
document.getElementById('deleteModal').addEventListener('click', e => { if (e.target === document.getElementById('deleteModal')) closeDeleteModal(); });

/* ── REPORT MODAL ── */
function openModal(type) {
    currentReportType = type;
    const t = document.getElementById('modalTitle');
    t.textContent = type === 'lost' ? 'Report Lost Item' : 'Report Found Item';
    t.style.color = type === 'lost' ? '#e74c3c' : '#27ae60';
    document.getElementById('reportModal').classList.add('active');
    const di = document.getElementById('date'); if (di) di.valueAsDate = new Date();
}
function closeModal() {
    document.getElementById('reportModal').classList.remove('active');
    document.getElementById('reportForm').reset();
    removePhoto();
}

/* ── PHOTO UPLOAD ── */
window._selectedPhotoBase64 = null;

window.handlePhotoSelect = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Photo must be under 5MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = function(ev) {
        window._selectedPhotoBase64 = ev.target.result;
        document.getElementById('photoPreview').src = ev.target.result;
        document.getElementById('photoPlaceholder').style.display = 'none';
        document.getElementById('photoPreviewWrap').style.display = 'block';
    };
    reader.readAsDataURL(file);
};

window.removePhoto = function(e) {
    if (e) e.stopPropagation();
    window._selectedPhotoBase64 = null;
    document.getElementById('itemPhoto').value = '';
    document.getElementById('photoPreview').src = '';
    document.getElementById('photoPlaceholder').style.display = 'flex';
    document.getElementById('photoPreviewWrap').style.display = 'none';
};

async function handleSubmit(e) {
    e.preventDefault();
    if (!window._currentUser) { showToast('Please sign in to report items.', 'error'); return; }
    const btn = document.getElementById('submitReportBtn');
    btn.textContent = 'Submitting…'; btn.disabled = true;
    const data = {
        type: currentReportType,
        itemName: document.getElementById('itemName').value,
        category: document.getElementById('category').value,
        location: document.getElementById('location').value,
        date: document.getElementById('date').value,
        description: document.getElementById('description').value,
        contact: document.getElementById('contact').value,
        uid: window._currentUser.uid,
        displayName: window._currentUser.displayName || window._currentUser.email,
        createdAt: window._fb.serverTimestamp(),
        photoBase64: window._selectedPhotoBase64 || null
    };
    try {
        const collectionName = data.type === 'lost' ? 'lostItems' : 'foundItems';
        const docRef = await window._fb.addDoc(window._fb.collection(window._fb.db, collectionName), data);
        if (data.type === 'lost') {
            allItems.unshift({
                id: docRef.id, docId: docRef.id,
                user: data.displayName,
                avatar: avatarColor(data.uid),
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                title: data.itemName, location: data.location, category: data.category,
                desc: data.description || '', emoji: catEmoji(data.category),
                contact: data.contact, saved: false, owner: data.uid,
                photoBase64: data.photoBase64 || null
            });
        } else {
            allFoundItems.unshift({
                id: docRef.id, docId: docRef.id,
                user: data.displayName,
                avatar: avatarColor(data.uid),
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                title: data.itemName, location: data.location, category: data.category,
                desc: data.description || '', emoji: catEmoji(data.category),
                contact: data.contact, saved: false, owner: data.uid,
                photoBase64: data.photoBase64 || null
            });
        }
        btn.textContent = 'Submit Report'; btn.disabled = false;
        closeModal();
        showToast(data.type === 'lost' ? '✅ Lost item saved to database!' : '✅ Found item saved! Thank you.');
        createConfetti();
        if (document.getElementById('lostContent').style.display !== 'none') renderLostCards();
        if (document.getElementById('foundContent').style.display !== 'none') renderFoundCards();
    } catch (err) {
        showToast('Submit failed: ' + err.message, 'error');
        btn.textContent = 'Submit Report'; btn.disabled = false;
    }
}

/* ── TOAST ── */
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast'); if (!t) return;
    t.className = `toast ${type}`;
    document.getElementById('toastIcon').textContent = type === 'success' ? '✓' : '✕';
    document.getElementById('toastMessage').textContent = msg;
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
document.addEventListener('mousemove', e => {
    document.querySelectorAll('.hero-img').forEach((img, i) => {
        const sp = (i + 1) * 0.5, x = (window.innerWidth - e.pageX * 2) / 100, y = (window.innerHeight - e.pageY * 2) / 100;
        img.style.transform = `translate(${x * sp}px,${y * sp}px) rotate(${i === 0 ? -5 : i === 1 ? 5 : -3}deg)`;
    });
});

/* ── ESC / OUTSIDE CLICK ── */
document.getElementById('reportModal').addEventListener('click', e => { if (e.target === document.getElementById('reportModal')) closeModal(); });
document.getElementById('contactModal').addEventListener('click', e => { if (e.target === document.getElementById('contactModal')) closeContactModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeContactModal(); closeSignOutModal(); closeDeleteModal(); } });
/* ── PROFILE PAGE ── */
async function goProfile() {
    document.getElementById('homeContent').style.display = 'none';
    document.getElementById('lostContent').style.display = 'none';
    document.getElementById('foundContent').style.display = 'none';
    document.getElementById('profileContent').style.display = '';
    if (document.getElementById('navProfile')) document.getElementById('navProfile').classList.add('active');
    await loadProfileData();
}

async function loadProfileData() {
    const user = window._currentUser;
    if (!user) return;

    // Set avatar
    const avatarEl = document.getElementById('profileAvatar');
    const color = avatarColor(user.uid);
    const initial = (user.displayName || user.email || '?')[0].toUpperCase();
    avatarEl.style.background = color;
    avatarEl.textContent = initial;

    // Basic info from auth
    document.getElementById('profileDisplayName').textContent = user.displayName || 'Anonymous';
    document.getElementById('profileEmail').textContent = user.email || '—';
    document.getElementById('detailDisplayName').textContent = user.displayName || '—';
    document.getElementById('detailEmail').textContent = user.email || '—';

    // Member since (from Firebase metadata)
    if (user.metadata?.creationTime) {
        const d = new Date(user.metadata.creationTime);
        document.getElementById('detailJoined').textContent = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    // Load extra profile data from Firestore users collection
    if (window._fb) {
        try {
            const snap = await window._fb.getDocs(window._fb.query(window._fb.collection(window._fb.db, 'users')));
            const userDoc = snap.docs.map(d => d.data()).find(d => d.uid === user.uid);
            if (userDoc) {
                if (userDoc.firstName && userDoc.lastName) {
                    document.getElementById('rowName').style.display = '';
                    document.getElementById('detailFullName').textContent = userDoc.firstName + ' ' + userDoc.lastName;
                }
                if (userDoc.studentId) {
                    document.getElementById('rowStudentId').style.display = '';
                    document.getElementById('detailStudentId').textContent = userDoc.studentId;
                }
                if (userDoc.faculty) {
                    document.getElementById('rowFaculty').style.display = '';
                    document.getElementById('detailFaculty').textContent = userDoc.faculty;
                    document.getElementById('profileFacultyBadge').style.display = '';
                    document.getElementById('profileFacultyText').textContent = userDoc.faculty;
                }
            }
        } catch (e) { /* silently fail */ }

        // Load user's lost & found reports
        try {
            const [lostSnap, foundSnap] = await Promise.all([
                window._fb.getDocs(window._fb.query(window._fb.collection(window._fb.db, 'lostItems'), window._fb.orderBy('createdAt', 'desc'))),
                window._fb.getDocs(window._fb.query(window._fb.collection(window._fb.db, 'foundItems'), window._fb.orderBy('createdAt', 'desc')))
            ]);
            const myLost = lostSnap.docs.filter(d => d.data().uid === user.uid).map(d => ({ ...d.data(), docId: d.id, type: 'lost' }));
            const myFound = foundSnap.docs.filter(d => d.data().uid === user.uid).map(d => ({ ...d.data(), docId: d.id, type: 'found' }));
            const all = [...myLost, ...myFound];

            document.getElementById('statLost').textContent = myLost.length;
            document.getElementById('statFound').textContent = myFound.length;
            document.getElementById('statTotal').textContent = all.length;

            const listEl = document.getElementById('myReportsList');
            if (!all.length) {
                listEl.innerHTML = `<div class="profile-empty"><span>📭</span><p>You haven't posted any reports yet.</p><button class="profile-report-btn" onclick="openModal('lost')"><i class="fas fa-plus"></i> Report an Item</button></div>`;
            } else {
                listEl.innerHTML = all.map(item => `
                    <div class="profile-report-item">
                        <div class="pri-emoji">${catEmoji(item.category)}</div>
                        <div class="pri-info">
                            <div class="pri-title">${item.itemName}</div>
                            <div class="pri-meta"><i class="fas fa-map-marker-alt"></i> ${item.location}</div>
                        </div>
                        <span class="pri-tag ${item.type === 'lost' ? 'tag-lost' : 'tag-found'}">${item.type === 'lost' ? 'Lost' : 'Found'}</span>
                    </div>
                `).join('');
            }
        } catch (e) {
            document.getElementById('myReportsList').innerHTML = `<div class="profile-loading">Could not load reports.</div>`;
        }
    }
}
