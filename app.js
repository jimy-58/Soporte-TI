// ==========================================
// Configuración de Supabase
// ==========================================

const SUPABASE_URL = "https://nuagglgfcdikrnoybytj.supabase.co";

const SUPABASE_KEY = "sb_publishable_coMxmvx0xr1aVXxqustQew_lYc3lHRv";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
// ==========================================
// Prueba de conexión con Supabase
// ==========================================

async function probarConexion() {
    const { data, error } = await supabaseClient
        .from("tickets")
        .select("*")
        .limit(1);

    if (error) {
        console.error("❌ Error de conexión:", error);
    } else {
        console.log("✅ Conexión exitosa con Supabase");
        console.log(data);
    }
}

probarConexion();

const $ = (s) => document.querySelector(s);
const today = new Date().toISOString().slice(0, 10);
// const read = (key, fallback) => JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
let tickets = [];
let projects = [];
// Temporalmente desactivamos localStorage 
const save = () => {};
//const save = () => { localStorage.setItem('soporte-ti-tickets', JSON.stringify(tickets)); localStorage.setItem('soporte-ti-projects', JSON.stringify(projects)); };
const fmt = (date) => date ? new Intl.DateTimeFormat('es-MX', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(`${date}T12:00:00`)) : 'Sin fecha';
const code = (n) => `TI-${String(n).padStart(4, '0')}`;
const className = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s/g,'-');

function renderStats() { const active = tickets.filter(x => x.status !== 'Resuelto'); const resolved = tickets.filter(x => x.status === 'Resuelto'); const inProgress = projects.filter(x => x.status !== 'Completado'); $('#stats').innerHTML = [['Tickets activos', active.length], ['Resueltos', resolved.length], ['Proyectos en curso', inProgress.length], ['Total actividades', tickets.length + projects.length]].map(([a,b]) => `<article class="stat"><p>${a}</p><strong>${b}</strong></article>`).join(''); }
function renderDashboard() { const recent = [...tickets].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5); $('#recent-list').innerHTML = recent.length ? recent.map(x => `<div class="activity-row"><span class="ticket-icon">#</span><div><b>${escapeHtml(x.subject)}</b><small>${escapeHtml(x.requester)} · ${fmt(x.date)}</small></div><span class="badge status-${className(x.status)}">${x.status}</span></div>`).join('') : '<p class="empty">Aún no hay tickets registrados.</p>'; const statuses = ['Abierto','En proceso','En espera','Resuelto']; const total = tickets.length || 1; $('#status-summary').innerHTML = statuses.map(s => { const n = tickets.filter(x=>x.status===s).length; return `<div class="status-row"><span>${s}</span><div class="bar"><i style="width:${n/total*100}%"></i></div><b>${n}</b></div>`; }).join(''); }
function renderTickets() { const search = $('#ticket-search').value.toLowerCase(); const status = $('#ticket-status-filter').value; const list = tickets.filter(x => (!status || x.status === status) && `${x.subject} ${x.requester} ${x.area} ${code(x.number)}`.toLowerCase().includes(search)).sort((a,b)=>b.date.localeCompare(a.date)); $('#tickets-table').innerHTML = list.length ? list.map(x => `<tr data-id="${x.id}"><td><b>${code(x.number)}</b></td><td>${escapeHtml(x.subject)}</td><td>${escapeHtml(x.requester)}<small>${x.area ? `<br>${escapeHtml(x.area)}`:''}</small></td><td class="priority-${className(x.priority)}">${x.priority}</td><td><span class="badge status-${className(x.status)}">${x.status}</span></td><td>${fmt(x.date)}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">No hay tickets que coincidan con la búsqueda.</td></tr>'; document.querySelectorAll('tr[data-id]').forEach(el=>el.onclick=()=>openTicket(tickets.find(x=>x.id===el.dataset.id))); }
function renderProjects() { $('#projects-grid').innerHTML = projects.length ? projects.map(x => `<article class="project-card" data-id="${x.id}"><div class="panel-heading"><h2>${escapeHtml(x.name)}</h2><span class="badge status-${className(x.status)}">${x.status}</span></div><p class="project-meta">${x.type} · ${x.owner || 'Sin responsable'}</p><p>${escapeHtml(x.update || 'Sin avance registrado.')}</p><div class="project-footer"><div class="progress"><i style="width:${x.progress}%"></i></div><b>${x.progress}%</b></div></article>`).join('') : '<p class="empty">Aún no hay proyectos registrados.</p>'; document.querySelectorAll('.project-card[data-id]').forEach(el=>el.onclick=()=>openProject(projects.find(x=>x.id===el.dataset.id))); }
function renderReport() { const from=$('#report-from').value, to=$('#report-to').value; const filtered=tickets.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to)); const resolved=filtered.filter(x=>x.status==='Resuelto').length; $('#report-preview').innerHTML=`<b>${filtered.length}</b> tickets registrados${from||to ? ' en el periodo seleccionado':''}; <b>${resolved}</b> resueltos y <b>${projects.filter(x=>x.status!=='Completado').length}</b> proyectos activos.<br><br>El archivo incluye los tickets del periodo y el estado actual de todos los proyectos.`; }
function render() { renderStats(); renderDashboard(); renderTickets(); renderProjects(); renderReport(); }

async function loadTicketsFromSupabase() { const { data, error } = await supabaseClient .from('tickets') .select('*') .order('Folio', { ascending: false }); if (error) { console.error('❌ Error cargando tickets:', error); return; } tickets = (data || []).map(t => ({ id: t.Folio, number: Number(String(t.Folio).replace('TI-', '')) || 0, company: t.Empresa || '', subject: t.Asunto || '', requester: t.Solicitante || '', area: t['Área'] || '', priority: t.Prioridad || 'Media', status: t.Estado || 'Abierto', date: t.Fecha || today, notes: t.Detalle || '' })); render(); }

console.log("Tickets cargados:", tickets);

async function loadProjectsFromSupabase() {
    const { data, error } = await supabaseClient
        .from("projects")
        .select("*")
        .order("Proyecto", { ascending: true });

    if (error) {
        console.error("❌ Error cargando proyectos:", error);
        return;
    }

    console.log("📦 Proyectos desde Supabase:", data);

    projects = (data || []).map(p => ({
        id: p.Proyecto,
        name: p.Proyecto || "",
        company: p.Empresa || "",
        type: p.Tipo || "",
        owner: p.Responsable || "",
        progress: parseInt(String(p.Avance).replace("%", "")) || 0,
        status: p.Estado || "",
        eta: p["Fecha estimada"] || "",
        update: p["Último avance"] || ""
    }));

    console.log("Proyectos cargados:", projects);

    render();
}

//async function loadTicketsFromSupabase() { const { data, error } = await supabaseClient .from('tickets') .select('*'); //console.log('📦 Datos crudos desde Supabase:', data); if (error) { console.error('❌ Error cargando tickets:', error); return; } 
//console.table(data);
//console.log(data[0]);
                                          
function openTicket(item) { const f=$('#ticket-form'); f.reset(); $('#ticket-id').value=item?.id||''; $('#ticket-dialog-title').textContent=item?'Editar ticket':'Nuevo ticket'; $('#ticket-date').value=item?.date||today; ['subject','requester','area','priority','status','notes'].forEach(k=> $(`#ticket-${k}`).value=item?.[k]|| (k==='priority'?'Media':k==='status'?'Abierto':'')); $('#ticket-dialog').showModal(); }
function openProject(item) { const f=$('#project-form'); f.reset(); $('#project-id').value=item?.id||''; ['name','type','owner','progress','status','date','update'].forEach(k=> $(`#project-${k}`).value=item?.[k] ?? (k==='type'?'Base de datos':k==='progress'?0:k==='status'?'Planeación':'')); $('#project-dialog').showModal(); }
function escapeHtml(v='') { const d=document.createElement('div'); d.textContent=v; return d.innerHTML; }
function csv(rows) { return rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n'); }
function download(name, content) { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([`\ufeff${content.replaceAll('"Área"','"Equipo"')}`],{type:'text/csv;charset=utf-8'})); a.download=name; a.click(); URL.revokeObjectURL(a.href); }

$('#today').textContent = new Intl.DateTimeFormat('es-MX',{weekday:'long', day:'numeric', month:'long'}).format(new Date());
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>{ document.querySelectorAll('.nav-item,.view').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $(`#${b.dataset.view}`).classList.add('active'); $('#view-title').textContent={dashboard:'Resumen de actividades',tickets:'Tickets de soporte',projects:'Avance de proyectos',reports:'Reportes'}[b.dataset.view]; $('#new-item').style.display=b.dataset.view==='projects'?'none':''; });
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>document.querySelector(`[data-view="${b.dataset.go}"]`).click());
$('#new-item').onclick=()=>openTicket(); $('#new-project').onclick=()=>openProject();

//$('#ticket-form').addEventListener('submit',e=>{e.preventDefault(); const id=$('#ticket-id').value; const item={id:id||crypto.randomUUID(),number:id?tickets.find(x=>x.id===id).number:Math.max(0,...tickets.map(x=>x.number))+1,subject:$('#ticket-subject').value.trim(),requester:$('#ticket-requester').value.trim(),area:$('#ticket-area').value.trim(),priority:$('#ticket-priority').value,status:$('#ticket-status').value,date:$('#ticket-date').value,notes:$('#ticket-notes').value.trim()}; tickets=id?tickets.map(x=>x.id===id?item:x):[...tickets,item]; save(); $('#ticket-dialog').close(); render(); });
$('#ticket-form').addEventListener('submit', async e => {
    e.preventDefault();

    const folio = `TI-${String(tickets.length + 1).padStart(4, '0')}`;

    const nuevoTicket = {
        Folio: folio,
        Empresa: $('#ticket-company').value,
        Asunto: $('#ticket-subject').value.trim(),
        Solicitante: $('#ticket-requester').value.trim(),
        Área: $('#ticket-area').value.trim(),
        Prioridad: $('#ticket-priority').value,
        Estado: $('#ticket-status').value,
        Fecha: $('#ticket-date').value,
        Detalle: $('#ticket-notes').value.trim()
    };

    const { error } = await supabaseClient
        .from('tickets')
        .insert([nuevoTicket]);

    if (error) {
        console.error('Error guardando ticket:', error);
        alert('Error al guardar ticket');
        return;
    }

    $('#ticket-dialog').close();

    await loadTicketsFromSupabase();
});

//$('#project-form').addEventListener('submit',e=>{e.preventDefault(); const id=$('#project-id').value; const item={id:id||crypto.randomUUID(),name:$('#project-name').value.trim(),type:$('#project-type').value,owner:$('#project-owner').value.trim(),progress:Math.min(100,Math.max(0,Number($('#project-progress').value))),status:$('#project-status').value,date:$('#project-date').value,update:$('#project-update').value.trim()}; projects=id?projects.map(x=>x.id===id?item:x):[...projects,item]; save(); $('#project-dialog').close(); render(); });
$('#project-form').addEventListener('submit', async e => {
    e.preventDefault();

    const nuevoProyecto = {
        Proyecto: $('#project-name').value.trim(),
        Empresa: $('#project-company').value,
        Tipo: $('#project-type').value,
        Responsable: $('#project-owner').value.trim(),
        Avance: $('#project-progress').value + '%',
        Estado: $('#project-status').value,
        "Fecha estimada": $('#project-date').value,
        "Último avance": $('#project-update').value.trim()
    };

    const { error } = await supabaseClient
        .from('projects')
        .insert([nuevoProyecto]);

    if (error) {
        console.error('Error guardando proyecto:', error);
        alert('Error al guardar el proyecto');
        return;
    }

    $('#project-dialog').close();

    await loadProjectsFromSupabase();
});

$('#ticket-search').oninput=renderTickets; $('#ticket-status-filter').onchange=renderTickets; ['report-from','report-to'].forEach(id=>$( `#${id}`).addEventListener('change',renderReport));
$('#export-tickets').onclick=()=>download(`tickets-${today}.csv`,csv([['Folio','Asunto','Solicitante','Área','Prioridad','Estado','Fecha','Detalle'],...tickets.map(x=>[code(x.number),x.subject,x.requester,x.area,x.priority,x.status,x.date,x.notes])]));
$('#download-report').onclick=()=>{const from=$('#report-from').value,to=$('#report-to').value;const selected=tickets.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to));const rows=[['REPORTE DE ACTIVIDADES TI'],['Periodo',`${from||'Inicio'} a ${to||'Hoy'}`],[],['TICKETS'],['Folio','Asunto','Solicitante','Área','Prioridad','Estado','Fecha','Detalle'],...selected.map(x=>[code(x.number),x.subject,x.requester,x.area,x.priority,x.status,x.date,x.notes]),[],['PROYECTOS'],['Proyecto','Tipo','Responsable','Avance','Estado','Fecha estimada','Último avance'],...projects.map(x=>[x.name,x.type,x.owner,`${x.progress}%`,x.status,x.date,x.update])];download(`reporte-soporte-ti-${today}.csv`,csv(rows));};
document.querySelectorAll('dialog [value="cancel"]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();button.closest('dialog').close();}));
const companies=['KINIK','SERVERINT','D3G','ASURATEC','AEGIS','ADMINISTRACIÓN','GERENCIA'];
function addCompanyField(companyId,beforeId){const input=$(beforeId);const label=document.createElement('label');label.innerHTML=`Empresa<select id="${companyId}" required><option value="">Selecciona una empresa</option>${companies.map(company=>`<option>${company}</option>`).join('')}</select>`;input.closest('label').before(label);}
addCompanyField('ticket-company','#ticket-area');
addCompanyField('project-company','#project-owner');
$('#ticket-form').addEventListener('submit',()=>{const item=$('#ticket-id').value?tickets.find(x=>x.id===$('#ticket-id').value):tickets.at(-1);if(item){item.company=$('#ticket-company').value;save();}});
$('#project-form').addEventListener('submit',()=>{const item=$('#project-id').value?projects.find(x=>x.id===$('#project-id').value):projects.at(-1);if(item){item.company=$('#project-company').value;save();}});
$('#export-tickets').addEventListener('click',event=>{event.stopImmediatePropagation();download(`tickets-${today}.csv`,csv([['Folio','Empresa','Asunto','Solicitante','Área','Prioridad','Estado','Fecha','Detalle'],...tickets.map(x=>[code(x.number),x.company||'',x.subject,x.requester,x.area,x.priority,x.status,x.date,x.notes])]));},{capture:true});
$('#download-report').addEventListener('click',event=>{event.stopImmediatePropagation();const from=$('#report-from').value,to=$('#report-to').value,selected=tickets.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to));const rows=[['REPORTE DE ACTIVIDADES TI'],['Periodo',`${from||'Inicio'} a ${to||'Hoy'}`],[],['TICKETS'],['Folio','Empresa','Asunto','Solicitante','Área','Prioridad','Estado','Fecha','Detalle'],...selected.map(x=>[code(x.number),x.company||'',x.subject,x.requester,x.area,x.priority,x.status,x.date,x.notes]),[],['PROYECTOS'],['Proyecto','Empresa','Tipo','Responsable','Avance','Estado','Fecha estimada','Último avance'],...projects.map(x=>[x.name,x.company||'',x.type,x.owner,`${x.progress}%`,x.status,x.date,x.update])];download(`reporte-soporte-ti-${today}.csv`,csv(rows));},{capture:true});
let currentRole = null;

function addHistoryFields() {
    const ticketLabel = document.createElement('label');
    ticketLabel.className = 'full';
    ticketLabel.innerHTML = 'Nueva observación<textarea id="ticket-observation" rows="3" placeholder="Agrega una actualización; se guardará con fecha y hora."></textarea><div class="history-list" id="ticket-history"></div>';
    $('#ticket-notes').closest('label').after(ticketLabel);
    const projectLabel = document.createElement('label');
    projectLabel.className = 'full';
    projectLabel.innerHTML = 'Nueva observación<textarea id="project-observation" rows="3" placeholder="Registra el avance de hoy; se guardará con fecha y hora."></textarea><div class="history-list" id="project-history"></div>';
    $('#project-update').closest('label').after(projectLabel);
}

async function loadHistory(table, foreignKey, recordId, target) {
    if (!recordId) { $(target).innerHTML = ''; return; }
    const { data, error } = await supabaseClient.from(table).select('comment,created_at').eq(foreignKey, recordId).order('created_at', { ascending: false });
    if (error) { $(target).innerHTML = '<small>El historial estará disponible al crear las tablas de observaciones.</small>'; return; }
    $(target).innerHTML = data.length ? `<b>Historial</b>${data.map(row => `<article><small>${fmt(row.created_at.slice(0,10))} · ${new Date(row.created_at).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</small><p>${escapeHtml(row.comment)}</p></article>`).join('')}` : '<small>Aún no hay observaciones.</small>';
}

function setReadOnly(formId, saveButtonId, readOnly) { const form=$(formId); form.querySelectorAll('input,select,textarea').forEach(field=>field.disabled=readOnly); $(saveButtonId).hidden=readOnly; }
const baseOpenTicket = openTicket;
openTicket = async item => { baseOpenTicket(item); $('#ticket-company').value = item?.company || ''; $('#ticket-observation').value = ''; const readOnly=currentRole==='supervisor'; setReadOnly('#ticket-form','#save-ticket',readOnly); if(readOnly) $('#ticket-dialog-title').textContent='Detalle del ticket'; await loadHistory('ticket_updates', 'ticket_folio', item?.id, '#ticket-history'); };
const baseOpenProject = openProject;
openProject = async item => { baseOpenProject(item); $('#project-company').value = item?.company || ''; $('#project-date').value = item?.eta || item?.date || ''; $('#project-observation').value = ''; const readOnly=currentRole==='supervisor'; setReadOnly('#project-form','#save-project',readOnly); if(readOnly) $('#project-dialog h2').textContent='Detalle del proyecto'; await loadHistory('project_updates', 'project_name', item?.id, '#project-history'); };

async function saveTicket(event) {
    event.preventDefault();
    const originalFolio = $('#ticket-id').value;
    const folio = originalFolio || `TI-${String(Math.max(0,...tickets.map(ticket=>ticket.number))+1).padStart(4,'0')}`;
    const record = { Folio: folio, Empresa: $('#ticket-company').value, Asunto: $('#ticket-subject').value.trim(), Solicitante: $('#ticket-requester').value.trim(), Área: $('#ticket-area').value.trim(), Prioridad: $('#ticket-priority').value, Estado: $('#ticket-status').value, Fecha: $('#ticket-date').value, Detalle: $('#ticket-notes').value.trim() };
    const request = originalFolio ? supabaseClient.from('tickets').update(record).eq('Folio', originalFolio) : supabaseClient.from('tickets').insert([record]);
    const { error } = await request;
    if (error) { alert('Error al guardar ticket'); console.error(error); return; }
    const comment = $('#ticket-observation').value.trim();
    if (comment) await supabaseClient.from('ticket_updates').insert([{ ticket_folio: folio, comment }]);
    $('#ticket-dialog').close(); await loadTicketsFromSupabase();
}

async function saveProject(event) {
    event.preventDefault();
    const originalName = $('#project-id').value;
    const name = $('#project-name').value.trim();
    const record = { Proyecto: name, Empresa: $('#project-company').value, Tipo: $('#project-type').value, Responsable: $('#project-owner').value.trim(), Avance: `${$('#project-progress').value}%`, Estado: $('#project-status').value, 'Fecha estimada': $('#project-date').value, 'Último avance': $('#project-update').value.trim() };
    const request = originalName ? supabaseClient.from('projects').update(record).eq('Proyecto', originalName) : supabaseClient.from('projects').insert([record]);
    const { error } = await request;
    if (error) { alert('Error al guardar proyecto'); console.error(error); return; }
    const comment = $('#project-observation').value.trim();
    if (comment) await supabaseClient.from('project_updates').insert([{ project_name: name, comment }]);
    $('#project-dialog').close(); await loadProjectsFromSupabase();
}

async function observationMap(table, foreignKey) {
    const { data, error } = await supabaseClient.from(table).select(`${foreignKey},comment,created_at`).order('created_at', { ascending: true });
    if (error) { console.error(`Error cargando ${table}:`, error); return new Map(); }
    const grouped = data.reduce((map, row) => {
        const entry = `${fmt(row.created_at.slice(0, 10))} ${new Date(row.created_at).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}: ${row.comment}`;
        map.set(row[foreignKey], [...(map.get(row[foreignKey]) || []), entry]);
        return map;
    }, new Map());
    return new Map([...grouped].map(([recordId, entries]) => [recordId, entries.join('\n')]));
}

function setupCsvExports() {
    const ticketsButton = $('#export-tickets');
    ticketsButton.replaceWith(ticketsButton.cloneNode(true));
    $('#export-tickets').onclick = async () => {
        const histories = await observationMap('ticket_updates', 'ticket_folio');
        download(`tickets-${today}.csv`, csv([['Folio','Empresa','Asunto','Solicitante','Área','Prioridad','Estado','Fecha','Detalle','Observaciones'], ...tickets.map(ticket => [code(ticket.number),ticket.company||'',ticket.subject,ticket.requester,ticket.area,ticket.priority,ticket.status,ticket.date,ticket.notes,histories.get(ticket.id)||''])]));
    };
    const reportButton = $('#download-report');
    reportButton.replaceWith(reportButton.cloneNode(true));
    $('#download-report').onclick = async () => {
        const from = $('#report-from').value, to = $('#report-to').value;
        const selectedTickets = tickets.filter(ticket => (!from || ticket.date >= from) && (!to || ticket.date <= to));
        const [ticketHistories, projectHistories] = await Promise.all([observationMap('ticket_updates', 'ticket_folio'), observationMap('project_updates', 'project_name')]);
        const rows = [['REPORTE DE ACTIVIDADES TI'],['Periodo',`${from||'Inicio'} a ${to||'Hoy'}`],[],['TICKETS'],['Folio','Empresa','Asunto','Solicitante','Área','Prioridad','Estado','Fecha','Detalle','Observaciones'],...selectedTickets.map(ticket=>[code(ticket.number),ticket.company||'',ticket.subject,ticket.requester,ticket.area,ticket.priority,ticket.status,ticket.date,ticket.notes,ticketHistories.get(ticket.id)||'']),[],['PROYECTOS'],['Proyecto','Empresa','Tipo','Responsable','Avance','Estado','Fecha estimada','Último avance','Observaciones'],...projects.map(project=>[project.name,project.company||'',project.type,project.owner,`${project.progress}%`,project.status,project.eta||project.date,project.update,projectHistories.get(project.id)||''])];
        download(`reporte-soporte-ti-${today}.csv`, csv(rows));
    };
}

function mountLogin() {
    document.head.insertAdjacentHTML('beforeend', '<style>.login-screen[hidden]{display:none}</style>');
    document.head.insertAdjacentHTML('beforeend', '<style>.login-screen{position:fixed;inset:0;z-index:20;display:grid;place-items:center;background:linear-gradient(135deg,#0d1b32,#1e3c70);padding:22px}.login-card{width:min(420px,100%);padding:34px;background:#fff;border-radius:16px;box-shadow:0 24px 70px #06112480}.login-brand{display:flex;align-items:center;gap:11px;color:#12213b;font:600 20px Outfit}.login-brand small{display:block;color:#6c778b;font:400 12px DM Sans;margin-top:3px}.login-card h1{margin:29px 0 5px}.login-card p{color:#6c778b;margin:0 0 22px}.login-card label{display:grid;gap:6px;color:#536078;font-size:13px;font-weight:600;margin:14px 0}.login-card .primary{width:100%;margin-top:9px}.login-error{color:#c23e4c!important;min-height:18px;margin:3px 0 0!important;font-size:13px}.logout-button{margin-left:auto}.is-supervisor #new-item,.is-supervisor #new-project{display:none}.is-supervisor .project-card,.is-supervisor tr[data-id]{cursor:default}</style>');
    document.body.insertAdjacentHTML('afterbegin', `<section class="login-screen" id="login-screen"><form class="login-card" id="login-form"><div class="login-brand"><span class="brand-mark">S</span><div><b>Soporte TI</b><small>Acceso al portal de actividades</small></div></div><h1>Iniciar sesión</h1><p>Ingresa con tu cuenta autorizada.</p><label>Correo electrónico<input id="login-email" type="email" required autocomplete="email" placeholder="nombre@empresa.com" /></label><label>Contraseña<input id="login-password" type="password" required autocomplete="current-password" placeholder="••••••••" /></label><p class="login-error" id="login-error" role="alert"></p><button class="primary" type="submit">Entrar</button></form></section>`);
    $('#login-form').addEventListener('submit', async event => {
        event.preventDefault();
        $('#login-error').textContent = '';
        const { error } = await supabaseClient.auth.signInWithPassword({ email: $('#login-email').value.trim(), password: $('#login-password').value });
        if (error) $('#login-error').textContent = 'Correo o contraseña incorrectos.';
    });
    document.querySelector('header').insertAdjacentHTML('beforeend', '<button class="secondary logout-button" id="logout-button">Cerrar sesión</button>');
    $('#logout-button').onclick = () => supabaseClient.auth.signOut();
}

async function applySession(session) {
    const login = $('#login-screen');
    if (!session) {
        currentRole = null;
        document.body.classList.remove('authenticated', 'is-admin', 'is-supervisor');
        login.hidden = false;
        return;
    }
    const { data: profile, error } = await supabaseClient.from('profiles').select('role,email').eq('id', session.user.id).single();
    if (error || !['admin', 'supervisor'].includes(profile?.role)) {
        await supabaseClient.auth.signOut();
        $('#login-error').textContent = 'Tu cuenta no cuenta con un rol autorizado.';
        return;
    }
    currentRole = profile.role;
    document.body.classList.add('authenticated', `is-${currentRole}`);
    login.hidden = true;
    $('#logout-button').textContent = `Cerrar sesión (${profile.email})`;
    await loadTicketsFromSupabase();
    await loadProjectsFromSupabase();
}

window.addEventListener('DOMContentLoaded', async () => {
    mountLogin();
    addHistoryFields();
    setupCsvExports();
    document.head.insertAdjacentHTML('beforeend', '<style>.history-list{margin-top:10px;padding:10px;background:#f5f7fb;border-radius:7px;max-height:175px;overflow:auto}.history-list b,.history-list small{font-size:12px;color:#536078}.history-list article{padding:8px 0;border-bottom:1px solid #e5eaf1}.history-list article:last-child{border:0}.history-list p{margin:3px 0 0;font-weight:400;color:#172033}</style>');
    document.addEventListener('submit', event => { if (event.target.id === 'ticket-form') { event.stopImmediatePropagation(); saveTicket(event); } if (event.target.id === 'project-form') { event.stopImmediatePropagation(); saveProject(event); } }, true);
    const { data: { session } } = await supabaseClient.auth.getSession();
    await applySession(session);
    supabaseClient.auth.onAuthStateChange((_event, session) => { setTimeout(() => applySession(session), 0); });
});
