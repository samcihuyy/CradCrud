/*******************************
 *  UTILITIES
 *******************************/

const STORAGE_KEY = 'crud_app_data_v1';
const q = (s, el = document) => el.querySelector(s);
const qs = (s, el = document) => Array.from(el.querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function escapeHtml(str = '') {
    return str.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>' : '&gt;',
        '"' : '&quot;', "'" : '&#39;'
    }[m]));
}

function escapeAttr(str = '') {
    return escapeHtml(str).replace(/"/g, '&quot;');
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : seedData();
    } catch (e) {
        return [];
    }
}

function seedData() {
    const s = [
        { id: uid(), name: 'Sam', email: 'oiisamz76@gmail.com', role: 'Admin', notes: 'lorem ipsum', createdAt: Date.now() },
        { id: uid(), name: 'Sambalado', email: 'hyysamz@gmail.com', role: 'User', notes: 'lorem ipsum', createdAt: Date.now() }
    ];
    saveData(s);
    return s;
}


/*******************************
 *  VIEWS MAP
 *******************************/
const Views = {
    dashboard: renderDashboard,
    home: renderHome,
    add: renderAdd,
    edit: renderEdit,
    setting: renderSettings,
    about: renderAbout,
};


/*******************************
 *  ROUTER
 *******************************/
function setActive(routeHash) {
    qs('#main-nav a').forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === routeHash);
    });
}

function router() {
    const hash = location.hash || '#/dashboard';

    // Edit route special case
    if (hash.startsWith('#/edit/')) {
        const id = hash.split('/')[2];
        setActive('#/edit');
        return renderEdit(id);
    }

    const path = hash.slice(2).split('/')[0];
    const viewFn = Views[path] || Views.dashboard;

    setActive('#/' + path);
    viewFn();
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);


/*******************************
 *  RENDER: DASHBOARD
 *******************************/
function renderDashboard() {
    const data = loadData();
    const root = q('#view-root');

    root.innerHTML = `
    <header class="hdr">
        <h2>Dashboard</h2>
        <div class="muted">Ringkasan</div>
    </header>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
        <div class="card">
            <div class="muted">Total items</div>
            <div style="font-size:28px;font-weight:700">${data.length}</div>
        </div>
        
        <div class="card">
            <div class="muted">Admin</div>
            <div style="font-size:22px;font-weight:700">${data.filter(d => d.role === 'Admin').length}</div>
        </div>

        <div class="card">
            <div class="muted">User</div>
            <div style="font-size:22px;font-weight:700">${data.filter(d => d.role === 'User').length}</div>
        </div>
    </div>

    <div style="margin-top:16px" class="card">
        <div style="font-weight:600;margin-bottom:8px">Recent entries</div>
        ${ data
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5)
            .map(d => `
            <div style="padding:8px 0;border-bottom:1px solid #f1f5f9">
                <div style="display:flex;justify-content:space-between">
                    <div><strong>${escapeHtml(d.name)}</strong> <span class="muted">(${d.role})</span></div>
                    <div class="muted">${new Date(d.createdAt).toLocaleString()}</div>
                </div>
                <div class="muted" style="font-size:13px">${escapeHtml(d.email)} — ${escapeHtml(d.notes)}</div>
            </div>
        `).join('') }
    </div>`;
}


/*******************************
 *  RENDER: HOME (LIST)
 *******************************/
function renderHome() {
    const data = loadData();
    const root = q('#view-root');

    root.innerHTML = `
    <header class="hdr">
        <h2>Home — Tabel</h2>
        <div>
            <input id="search" placeholder="Cari nama atau email..." style="padding:8px;border-radius:8px;border:1px solid #e6e9f2;margin-right:8px">
            <button class="btn" id="btn-add">➕ Tambah</button>
        </div>
    </header>

    <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="muted">Tabel data sekarang</div>
            <div class="muted">Total: <strong>${data.length}</strong></div>
        </div>

        <table id="table-main">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Catatan</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${data.map((d, i) => `
                <tr data-id="${d.id}">
                    <td>${i + 1}</td>
                    <td>${escapeHtml(d.name)}</td>
                    <td>${escapeHtml(d.email)}</td>
                    <td>${escapeHtml(d.role)}</td>
                    <td>${escapeHtml(d.notes)}</td>
                    <td>
                        <button class="btn ghost btn-edit" data-id="${d.id}">Edit</button>
                        <button class="btn danger btn-delete small" data-id="${d.id}">Hapus</button>
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    `;

    // Search
    q('#search').addEventListener('input', (e) => {
        const qstr = e.target.value.toLowerCase();
        qs('#table-main tbody tr').forEach(tr => {
            const name = tr.children[1].textContent.toLowerCase();
            const email = tr.children[2].textContent.toLowerCase();
            tr.style.display = (name.includes(qstr) || email.includes(qstr)) ? '' : 'none';
        });
    });

    // Button tambah
    q('#btn-add').addEventListener('click', () => location.hash = '#/add');

    // Edit
    qs('.btn-edit').forEach(b => b.addEventListener('click', e => {
        const id = e.currentTarget.getAttribute('data-id');
        location.hash = '#/edit/' + id;
    }));

    // Delete
    qs('.btn-delete').forEach(b => b.addEventListener('click', e => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Yakin ingin menghapus data ini?')) {
            let arr = loadData().filter(x => x.id !== id);
            saveData(arr);
            renderHome();
        }
    }));
}


/*******************************
 *  RENDER: ADD
 *******************************/
function renderAdd() {
    const root = q('#view-root');

    root.innerHTML = `
    <header class="hdr">
        <h2>Tambah Data</h2>
        <div class="muted">Isi form di bawah</div>
    </header>

    <div class="card">
        <form id="form-add" class="row">

            <div>
                <label>Nama</label>
                <input type="text" id="f-name" required />
            </div>

            <div>
                <label>Email</label>
                <input type="text" id="f-email" />
            </div>

            <div>
                <label>Role</label>
                <select id="f-role">
                    <option>Admin</option>
                    <option selected>User</option>
                </select>
            </div>

            <div>
                <label>Umur (optional)</label>
                <input type="number" id="f-age" />
            </div>

            <div class="full">
                <label>Catatan</label>
                <textarea id="f-notes" rows="3"></textarea>
            </div>

            <div class="controls full">
                <button class="btn" type="submit">Simpan</button>
                <button class="btn ghost" id="cancel-add" type="button">Batal</button>
            </div>

        </form>
    </div>
    `;

    q('#cancel-add').addEventListener('click', () => location.hash = '#/home');

    q('#form-add').addEventListener('submit', (ev) => {
        ev.preventDefault();

        const item = {
            id: uid(),
            name: q('#f-name').value.trim(),
            email: q('#f-email').value.trim(),
            role: q('#f-role').value,
            notes: q('#f-notes').value.trim(),
            createdAt: Date.now()
        };

        const arr = loadData();
        arr.push(item);
        saveData(arr);

        location.hash = '#/home';
    });
}


/*******************************
 *  RENDER: EDIT
 *******************************/
function renderEdit(id) {
    const arr = loadData();
    const item = arr.find(x => x.id === id);

    const root = q('#view-root');

    if (!item) {
        root.innerHTML = `
        <div class="muted">
            Data tidak ditemukan. 
            <button class="btn" onclick="location.hash='#/home'">Kembali</button>
        </div>`;
        return;
    }

    root.innerHTML = `
    <header class="hdr">
        <h2>Edit Data</h2>
        <div class="muted">Mengubah: <strong>${escapeHtml(item.name)}</strong></div>
    </header>

    <div class="card">
        <form id="form-edit" class="row">

            <div>
                <label>Nama</label>
                <input type="text" id="f-name" value="${escapeAttr(item.name)}" required />
            </div>

            <div>
                <label>Email</label>
                <input type="text" id="f-email" value="${escapeAttr(item.email)}" />
            </div>

            <div>
                <label>Role</label>
                <select id="f-role">
                    <option ${item.role === 'Admin' ? 'selected' : ''}>Admin</option>
                    <option ${item.role === 'User' ? 'selected' : ''}>User</option>
                </select>
            </div>

            <div>
                <label>Umur (optional)</label>
                <input type="number" id="f-age" />
            </div>

            <div class="full">
                <label>Catatan</label>
                <textarea id="f-notes" rows="3">${escapeAttr(item.notes)}</textarea>
            </div>

            <div class="controls full">
                <button class="btn" type="submit">Update</button>
                <button class="btn ghost" id="cancel-edit" type="button">Batal</button>
                <button class="btn danger" id="btn-delete" type="button">Hapus</button>
            </div>

        </form>
    </div>
    `;

    q('#cancel-edit').addEventListener('click', () => location.hash = '#/home');

    q('#form-edit').addEventListener('submit', (ev) => {
        ev.preventDefault();

        const idx = arr.findIndex(x => x.id === id);

        if (idx >= 0) {
            arr[idx] = {
                ...arr[idx],
                name: q('#f-name').value.trim(),
                email: q('#f-email').value.trim(),
                role: q('#f-role').value,
                notes: q('#f-notes').value.trim(),
            };

            saveData(arr);
            location.hash = '#/home';
        }
    });

    q('#btn-delete').addEventListener('click', () => {
        if (confirm('Hapus data ini permanen?')) {
            saveData(arr.filter(x => x.id !== id));
            location.hash = '#/home';
        }
    });
}


/*******************************
 *  RENDER: SETTINGS
 *******************************/
function renderSettings() {
    const root = q('#view-root');

    root.innerHTML = `
    <header class="hdr">
        <h2>Settings</h2>
        <div class="muted">Import / Export</div>
    </header>

    <div class="card">

        <div style="margin-bottom:12px">
            <div class="muted">Reset data</div>
            <div class="small">Hapus semua data dan kembalikan ke sample default.</div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn danger" id="btn-reset">Reset Data</button>
            <button class="btn ghost" id="btn-export-csv">Export CSV</button>
            <button class="btn ghost" id="btn-export-json">Export JSON</button>
        </div>

    </div>
    `;

    q('#btn-reset').addEventListener('click', () => {
        if (confirm('Yakin ingin menghapus semua data dan mengembalikan default?')) {
            localStorage.removeItem(STORAGE_KEY);
            seedData();
            alert('Data direset!');
            router();
        }
    });

    q('#btn-export-json').addEventListener('click', () => {
        const data = loadData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'crud-data.json';
        a.click();

        URL.revokeObjectURL(url);
    });

    q('#btn-export-csv').addEventListener('click', () => {
        const data = loadData();
        const csv = data.map(d => 
            `${d.id},${d.name},${d.email},${d.role},${d.notes},${d.createdAt}`
        ).join("\n");

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'crud-data.csv';
        a.click();

        URL.revokeObjectURL(url);
    });
}


/*******************************
 *  RENDER: ABOUT (EMPTY)
 *******************************/
function renderAbout() {
    q('#view-root').innerHTML = `
    <div class="card">
        <h2>About</h2>
        <p class="muted">Halaman about masih kosong.</p>
    </div>`;
}
