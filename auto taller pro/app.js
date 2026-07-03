/* =========================================================
   AutoTallerPro - app.js
   Toda la data se guarda en localStorage del navegador.
========================================================= */

const DB_KEY = "autotaller_db";
const SESION_KEY = "autotaller_sesion";

function dbDefault(){
    return {
        clientes: [],
        vehiculos: [],
        reparaciones: [],
        inventario: [],
        movimientos: [],
        facturas: [],
        usuarios: [
            { id: uid(), nombre: "Administrador", correo: "admin@autotallerpro.com", rol: "Administrador", usuario: "owner", contrasena: "123456", estado: "Activo" },
            { id: uid(), nombre: "Yaison Rodríguez", correo: "yaison.rodriguez@autotallerpro.com", rol: "Coordinator", usuario: "yaison", contrasena: "1234", estado: "Activo" },
            { id: uid(), nombre: "Bladimir Junior Pérez Moya", correo: "bladimir.perez@autotallerpro.com", rol: "Supervisor", usuario: "bladimir", contrasena: "1234", estado: "Activo" }
        ],
        config: {
            nombre: "AutoTallerPro",
            telefono: "",
            correo: "",
            direccion: "",
            logo: "logo.png"
        },
        contadorFactura: 1
    };
}

function uid(){
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function cargarDB(){
    try{
        const raw = localStorage.getItem(DB_KEY);
        if(!raw) return dbDefault();
        const data = JSON.parse(raw);
        // asegurar que existan todas las llaves si vienen de una versión anterior
        const base = dbDefault();
        const merged = Object.assign(base, data);
        if(!merged.usuarios || merged.usuarios.length === 0){
            merged.usuarios = base.usuarios;
        }
        return merged;
    }catch(e){
        console.error("Error leyendo base de datos local:", e);
        return dbDefault();
    }
}

function guardarDB(){
    localStorage.setItem(DB_KEY, JSON.stringify(DB));
}

let DB = cargarDB();

/* =========================================================
   LOGIN / SESIÓN
========================================================= */

function alternarPassword(){
    const input = document.getElementById("loginPassword");
    const ojo = document.getElementById("loginOjo");
    if(input.type === "password"){
        input.type = "text";
        ojo.classList.remove("fa-eye");
        ojo.classList.add("fa-eye-slash");
    }else{
        input.type = "password";
        ojo.classList.remove("fa-eye-slash");
        ojo.classList.add("fa-eye");
    }
}

function iniciarSesion(){
    const usuario = document.getElementById("loginUsuario").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const errorEl = document.getElementById("loginError");

    if(!usuario || !password){
        errorEl.textContent = "Ingresa tu usuario y contraseña.";
        return;
    }

    const encontrado = DB.usuarios.find(u =>
        (u.usuario || "").toLowerCase() === usuario.toLowerCase() && u.contrasena === password
    );

    if(!encontrado){
        errorEl.textContent = "Usuario o contraseña incorrectos.";
        return;
    }

    errorEl.textContent = "";
    sessionStorage.setItem(SESION_KEY, JSON.stringify({ id: encontrado.id, nombre: encontrado.nombre, rol: encontrado.rol }));
    mostrarApp();
}

function cerrarSesion(){
    if(!confirm("¿Cerrar sesión?")) return;
    sessionStorage.removeItem(SESION_KEY);
    mostrarToast("Sesión cerrada.");
    setTimeout(mostrarLogin, 300);
}

function sesionActiva(){
    try{
        const raw = sessionStorage.getItem(SESION_KEY);
        return raw ? JSON.parse(raw) : null;
    }catch(e){
        return null;
    }
}

function mostrarApp(){
    const sesion = sesionActiva();
    document.getElementById("pantallaLogin").style.display = "none";
    document.getElementById("appContenedor").style.display = "block";
    document.getElementById("nombreUsuarioSesion").textContent = sesion ? sesion.nombre : "Administrador";
    document.getElementById("loginUsuario").value = "";
    document.getElementById("loginPassword").value = "";
    document.querySelector(".logo h3").textContent = DB.config.nombre || "AutoTallerPro";
    irAVista("inicio");
}

function mostrarLogin(){
    document.getElementById("appContenedor").style.display = "none";
    document.getElementById("pantallaLogin").style.display = "flex";
    document.getElementById("loginUsuario").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("loginError").textContent = "";
}

function verificarSesion(){
    if(sesionActiva()){
        mostrarApp();
    }else{
        mostrarLogin();
    }
}

/* =========================================================
   NAVEGACIÓN SPA
========================================================= */

const titulos = {
    inicio: "Dashboard",
    clientes: "Clientes",
    vehiculos: "Vehículos",
    reparaciones: "Reparaciones",
    inventario: "Inventario",
    facturacion: "Facturación",
    reportes: "Reportes",
    configuracion: "Mantenimiento",
    about: "About"
};

function irAVista(nombre){
    document.querySelectorAll(".vista").forEach(v => v.classList.remove("activa"));
    document.getElementById("vista-" + nombre).classList.add("activa");

    document.querySelectorAll(".sidebar li").forEach(li => li.classList.remove("activo"));
    const li = document.querySelector('.sidebar li[data-vista="' + nombre + '"]');
    if(li) li.classList.add("activo");

    document.getElementById("tituloVista").textContent = titulos[nombre] || "AutoTallerPro";

    // refrescar contenido al entrar
    if(nombre === "inicio") renderDashboard();
    if(nombre === "clientes") renderClientes();
    if(nombre === "vehiculos") renderVehiculos();
    if(nombre === "reparaciones") renderReparaciones();
    if(nombre === "inventario") renderInventario();
    if(nombre === "facturacion") renderFacturas();
    if(nombre === "reportes") renderReportes();
    if(nombre === "configuracion") cargarConfigEnFormulario();
}

document.querySelectorAll(".sidebar li[data-vista]").forEach(li => {
    li.addEventListener("click", (e) => {
        e.preventDefault();
        irAVista(li.getAttribute("data-vista"));
    });
});

/* =========================================================
   UTILIDADES GENERALES
========================================================= */

function moneda(n){
    n = Number(n) || 0;
    return "RD$" + n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fechaHoy(){
    return new Date().toISOString().slice(0,10);
}

function mostrarToast(mensaje){
    const toast = document.getElementById("toast");
    document.getElementById("toastMensaje").textContent = mensaje;
    toast.classList.add("mostrar");
    setTimeout(() => toast.classList.remove("mostrar"), 2500);
}

function cerrarModal(id){
    document.getElementById(id).classList.remove("activo");
}

function abrirModal(id){
    document.getElementById(id).classList.add("activo");
}

function pildoraEstado(estado){
    const mapa = {
        "Pendiente": "pendiente",
        "En proceso": "proceso",
        "Esperando repuestos": "espera",
        "Finalizada": "finalizada",
        "Entregada": "entregada"
    };
    const clase = mapa[estado] || "pendiente";
    return '<span class="pildora ' + clase + '">' + estado + '</span>';
}

function buscarCliente(id){ return DB.clientes.find(c => c.id === id); }
function buscarVehiculo(id){ return DB.vehiculos.find(v => v.id === id); }
function buscarRepuesto(id){ return DB.inventario.find(r => r.id === id); }

/* =========================================================
   DASHBOARD
========================================================= */

let chartIngresos = null;

function renderDashboard(){
    document.getElementById("totalClientes").textContent = DB.clientes.length;
    document.getElementById("totalVehiculos").textContent = DB.vehiculos.length;
    document.getElementById("totalReparaciones").textContent = DB.reparaciones.length;

    const ingresosTotales = DB.facturas.reduce((acc, f) => acc + f.total, 0);
    document.getElementById("totalIngresos").textContent = moneda(ingresosTotales);

    document.getElementById("actClientes").textContent = DB.clientes.length;
    document.getElementById("actVehiculos").textContent = DB.vehiculos.length;

    const pendientes = DB.reparaciones.filter(r => r.estado !== "Entregada" && r.estado !== "Finalizada").length;
    document.getElementById("actReparaciones").textContent = pendientes;

    const hoy = fechaHoy();
    const ingresosHoy = DB.facturas.filter(f => f.fecha === hoy).reduce((acc, f) => acc + f.total, 0);
    document.getElementById("actIngresos").textContent = moneda(ingresosHoy);

    // estado de órdenes
    document.getElementById("estadoProceso").textContent = DB.reparaciones.filter(r => r.estado === "En proceso").length;
    document.getElementById("estadoEspera").textContent = DB.reparaciones.filter(r => r.estado === "Esperando repuestos").length;
    document.getElementById("estadoCompletada").textContent = DB.reparaciones.filter(r => r.estado === "Finalizada" || r.estado === "Entregada").length;

    // tabla reparaciones recientes
    const tbody = document.getElementById("tablaReparaciones");
    const recientes = [...DB.reparaciones].sort((a,b) => b.fecha.localeCompare(a.fecha)).slice(0,6);
    if(recientes.length === 0){
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">No existen registros.</td></tr>';
    }else{
        tbody.innerHTML = recientes.map(r => {
            const cli = buscarCliente(r.clienteId);
            const veh = buscarVehiculo(r.vehiculoId);
            return '<tr>' +
                '<td>' + (cli ? cli.nombre + " " + cli.apellido : "—") + '</td>' +
                '<td>' + (veh ? veh.marca + " " + veh.modelo + " (" + veh.placa + ")" : "—") + '</td>' +
                '<td>' + pildoraEstado(r.estado) + '</td>' +
            '</tr>';
        }).join("");
    }

    // citas: usamos reparaciones pendientes con fecha futura como "próximas citas"
    const listaCitas = document.getElementById("listaCitas");
    const futuras = DB.reparaciones
        .filter(r => r.fecha >= hoy && r.estado === "Pendiente")
        .sort((a,b) => a.fecha.localeCompare(b.fecha))
        .slice(0,5);

    if(futuras.length === 0){
        listaCitas.innerHTML = '<p class="vacio">No hay citas programadas.</p>';
    }else{
        listaCitas.innerHTML = futuras.map(r => {
            const cli = buscarCliente(r.clienteId);
            const veh = buscarVehiculo(r.vehiculoId);
            const d = new Date(r.fecha + "T00:00:00");
            const dia = d.getDate();
            const mes = d.toLocaleDateString("es-DO", { month: "short" }).replace(".","");
            return '<div class="cita">' +
                '<div class="fecha"><strong>' + dia + '</strong><span>' + mes + '</span></div>' +
                '<div class="detalle">' + (cli ? cli.nombre : "Cliente") + ' — ' + (veh ? veh.marca + " " + veh.modelo : "Vehículo") + '</div>' +
            '</div>';
        }).join("");
    }

    renderGraficoIngresos();
}

function renderGraficoIngresos(){
    const ctx = document.getElementById("graficoIngresos");
    if(!ctx) return;

    const meses = [];
    const datos = [];
    const ahora = new Date();

    for(let i = 5; i >= 0; i--){
        const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        const etiqueta = d.toLocaleDateString("es-DO", { month: "short", year: "2-digit" });
        const yyyymm = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
        const total = DB.facturas
            .filter(f => f.fecha.startsWith(yyyymm))
            .reduce((acc, f) => acc + f.total, 0);
        meses.push(etiqueta);
        datos.push(total);
    }

    if(chartIngresos) chartIngresos.destroy();
    chartIngresos = new Chart(ctx, {
        type: "line",
        data: {
            labels: meses,
            datasets: [{
                label: "Ingresos",
                data: datos,
                borderColor: "#FF7A00",
                backgroundColor: "rgba(255,122,0,0.15)",
                fill: true,
                tension: 0.35
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

/* =========================================================
   CLIENTES
========================================================= */

function abrirModalCliente(id){
    document.getElementById("tituloModalCliente").textContent = id ? "Editar cliente" : "Registrar cliente";
    if(id){
        const c = buscarCliente(id);
        document.getElementById("clienteId").value = c.id;
        document.getElementById("clienteNombre").value = c.nombre;
        document.getElementById("clienteApellido").value = c.apellido;
        document.getElementById("clienteCedula").value = c.cedula;
        document.getElementById("clienteTelefono").value = c.telefono;
        document.getElementById("clienteCorreo").value = c.correo;
        document.getElementById("clienteDireccion").value = c.direccion;
    }else{
        limpiarModalCliente();
    }
    abrirModal("modalCliente");
}

function limpiarModalCliente(){
    document.getElementById("clienteId").value = "";
    ["clienteNombre","clienteApellido","clienteCedula","clienteTelefono","clienteCorreo","clienteDireccion"]
        .forEach(id => document.getElementById(id).value = "");
}

function guardarCliente(){
    const nombre = document.getElementById("clienteNombre").value.trim();
    const apellido = document.getElementById("clienteApellido").value.trim();

    if(!nombre || !apellido){
        alert("El nombre y apellido son obligatorios.");
        return;
    }

    const id = document.getElementById("clienteId").value;
    const datos = {
        nombre,
        apellido,
        cedula: document.getElementById("clienteCedula").value.trim(),
        telefono: document.getElementById("clienteTelefono").value.trim(),
        correo: document.getElementById("clienteCorreo").value.trim(),
        direccion: document.getElementById("clienteDireccion").value.trim()
    };

    if(id){
        const c = buscarCliente(id);
        Object.assign(c, datos);
    }else{
        DB.clientes.push({ id: uid(), ...datos });
    }

    guardarDB();
    cerrarModal("modalCliente");
    renderClientes();
    mostrarToast("Cliente guardado correctamente.");
}

function eliminarCliente(id){
    if(!confirm("¿Eliminar este cliente? También se eliminarán sus vehículos asociados.")) return;
    const vehiculosCliente = DB.vehiculos.filter(v => v.clienteId === id).map(v => v.id);
    DB.vehiculos = DB.vehiculos.filter(v => v.clienteId !== id);
    DB.reparaciones = DB.reparaciones.filter(r => !vehiculosCliente.includes(r.vehiculoId));
    DB.clientes = DB.clientes.filter(c => c.id !== id);
    guardarDB();
    renderClientes();
    mostrarToast("Cliente eliminado.");
}

function renderClientes(){
    const tbody = document.getElementById("tablaClientes");
    const texto = (document.getElementById("buscarCliente").value || "").toLowerCase();
    const campo = document.getElementById("filtroClienteCampo").value;

    let lista = DB.clientes;
    if(texto){
        lista = lista.filter(c => {
            if(campo === "cedula") return c.cedula.toLowerCase().includes(texto);
            if(campo === "telefono") return c.telefono.toLowerCase().includes(texto);
            return (c.nombre + " " + c.apellido).toLowerCase().includes(texto);
        });
    }

    if(lista.length === 0){
        tbody.innerHTML = '<tr><td colspan="4" class="texto-vacio">No existen registros.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(c => {
        const numVehiculos = DB.vehiculos.filter(v => v.clienteId === c.id).length;
        return '<tr>' +
            '<td>' + c.nombre + ' ' + c.apellido + '</td>' +
            '<td>' + (c.telefono || "—") + '</td>' +
            '<td>' + numVehiculos + '</td>' +
            '<td>' +
                '<button class="btn-icono ver" title="Ver" onclick="verPerfilCliente(\'' + c.id + '\')"><i class="fa-solid fa-eye"></i></button>' +
                '<button class="btn-icono editar" title="Editar" onclick="abrirModalCliente(\'' + c.id + '\')"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn-icono eliminar" title="Eliminar" onclick="eliminarCliente(\'' + c.id + '\')"><i class="fa-solid fa-trash"></i></button>' +
            '</td>' +
        '</tr>';
    }).join("");
}

function verPerfilCliente(id){
    const c = buscarCliente(id);
    if(!c) return;

    const vehiculos = DB.vehiculos.filter(v => v.clienteId === id);
    const reparaciones = DB.reparaciones.filter(r => vehiculos.some(v => v.id === r.vehiculoId));
    const facturas = DB.facturas.filter(f => f.clienteId === id);
    const totalGastado = facturas.reduce((acc, f) => acc + f.total, 0);

    const html = `
        <div class="perfil-header">
            <div class="perfil-avatar"><i class="fa-solid fa-user"></i></div>
            <div>
                <h3 style="margin:0;">${c.nombre} ${c.apellido}</h3>
                <p style="color:#9aa1ab;">${c.cedula || "Sin cédula"} • ${c.telefono || "Sin teléfono"}</p>
            </div>
        </div>

        <div class="perfil-grid">
            <div class="mini-stat"><strong>${vehiculos.length}</strong><span>Vehículos</span></div>
            <div class="mini-stat"><strong>${reparaciones.length}</strong><span>Reparaciones</span></div>
            <div class="mini-stat"><strong>${facturas.length}</strong><span>Facturas</span></div>
            <div class="mini-stat"><strong>${moneda(totalGastado)}</strong><span>Total gastado</span></div>
        </div>

        <h3 style="color:#0B1F4D; margin:20px 0 10px;">Información personal</h3>
        <p><strong>Correo:</strong> ${c.correo || "—"}</p>
        <p><strong>Dirección:</strong> ${c.direccion || "—"}</p>

        <h3 style="color:#0B1F4D; margin:20px 0 10px;">Vehículos registrados</h3>
        ${vehiculos.length ? vehiculos.map(v => `<p>• ${v.marca} ${v.modelo} (${v.placa})</p>`).join("") : '<p class="texto-vacio">Sin vehículos registrados.</p>'}

        <h3 style="color:#0B1F4D; margin:20px 0 10px;">Historial de reparaciones</h3>
        ${reparaciones.length ? reparaciones.map(r => `<p>• ${r.fecha} — ${r.estado} — ${moneda(r.total)}</p>`).join("") : '<p class="texto-vacio">Sin reparaciones registradas.</p>'}
    `;

    document.getElementById("contenidoPerfilCliente").innerHTML = html;
    abrirModal("modalPerfilCliente");
}

/* =========================================================
   VEHÍCULOS
========================================================= */

function llenarSelectClientes(selectId){
    const select = document.getElementById(selectId);
    select.innerHTML = DB.clientes.map(c => '<option value="' + c.id + '">' + c.nombre + ' ' + c.apellido + '</option>').join("");
}

function abrirModalVehiculo(id){
    llenarSelectClientes("vehiculoCliente");
    document.getElementById("tituloModalVehiculo").textContent = id ? "Editar vehículo" : "Registrar vehículo";

    if(id){
        const v = buscarVehiculo(id);
        document.getElementById("vehiculoId").value = v.id;
        document.getElementById("vehiculoCliente").value = v.clienteId;
        document.getElementById("vehiculoMarca").value = v.marca;
        document.getElementById("vehiculoModelo").value = v.modelo;
        document.getElementById("vehiculoAnio").value = v.anio;
        document.getElementById("vehiculoColor").value = v.color;
        document.getElementById("vehiculoPlaca").value = v.placa;
        document.getElementById("vehiculoVin").value = v.vin;
        document.getElementById("vehiculoKm").value = v.km;
        document.getElementById("vehiculoCombustible").value = v.combustible;
        document.getElementById("vehiculoTransmision").value = v.transmision;
    }else{
        document.getElementById("vehiculoId").value = "";
        ["vehiculoMarca","vehiculoModelo","vehiculoAnio","vehiculoColor","vehiculoPlaca","vehiculoVin","vehiculoKm"]
            .forEach(id => document.getElementById(id).value = "");
    }

    abrirModal("modalVehiculo");
}

function guardarVehiculo(){
    if(DB.clientes.length === 0){
        alert("Primero debes registrar al menos un cliente.");
        return;
    }

    const placa = document.getElementById("vehiculoPlaca").value.trim();
    const marca = document.getElementById("vehiculoMarca").value.trim();

    if(!placa || !marca){
        alert("La marca y la placa son obligatorias.");
        return;
    }

    const id = document.getElementById("vehiculoId").value;
    const datos = {
        clienteId: document.getElementById("vehiculoCliente").value,
        marca,
        modelo: document.getElementById("vehiculoModelo").value.trim(),
        anio: document.getElementById("vehiculoAnio").value,
        color: document.getElementById("vehiculoColor").value.trim(),
        placa,
        vin: document.getElementById("vehiculoVin").value.trim(),
        km: document.getElementById("vehiculoKm").value,
        combustible: document.getElementById("vehiculoCombustible").value,
        transmision: document.getElementById("vehiculoTransmision").value
    };

    if(id){
        Object.assign(buscarVehiculo(id), datos);
    }else{
        DB.vehiculos.push({ id: uid(), estado: "Activo", ...datos });
    }

    guardarDB();
    cerrarModal("modalVehiculo");
    renderVehiculos();
    mostrarToast("Vehículo guardado correctamente.");
}

function eliminarVehiculo(id){
    if(!confirm("¿Eliminar este vehículo?")) return;
    DB.reparaciones = DB.reparaciones.filter(r => r.vehiculoId !== id);
    DB.vehiculos = DB.vehiculos.filter(v => v.id !== id);
    guardarDB();
    renderVehiculos();
    mostrarToast("Vehículo eliminado.");
}

function renderVehiculos(){
    const tbody = document.getElementById("tablaVehiculos");
    const texto = (document.getElementById("buscarVehiculo").value || "").toLowerCase();

    let lista = DB.vehiculos;
    if(texto){
        lista = lista.filter(v =>
            v.placa.toLowerCase().includes(texto) ||
            v.marca.toLowerCase().includes(texto) ||
            (v.modelo || "").toLowerCase().includes(texto)
        );
    }

    if(lista.length === 0){
        tbody.innerHTML = '<tr><td colspan="6" class="texto-vacio">No existen registros.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(v => {
        const c = buscarCliente(v.clienteId);
        return '<tr>' +
            '<td>' + v.placa + '</td>' +
            '<td>' + (c ? c.nombre + " " + c.apellido : "—") + '</td>' +
            '<td>' + v.marca + '</td>' +
            '<td>' + (v.modelo || "—") + '</td>' +
            '<td><span class="pildora activo-pill">' + (v.estado || "Activo") + '</span></td>' +
            '<td>' +
                '<button class="btn-icono ver" title="Ver" onclick="verPerfilVehiculo(\'' + v.id + '\')"><i class="fa-solid fa-eye"></i></button>' +
                '<button class="btn-icono editar" title="Editar" onclick="abrirModalVehiculo(\'' + v.id + '\')"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn-icono eliminar" title="Eliminar" onclick="eliminarVehiculo(\'' + v.id + '\')"><i class="fa-solid fa-trash"></i></button>' +
            '</td>' +
        '</tr>';
    }).join("");
}

function verPerfilVehiculo(id){
    const v = buscarVehiculo(id);
    if(!v) return;
    const c = buscarCliente(v.clienteId);
    const reparaciones = DB.reparaciones.filter(r => r.vehiculoId === id);
    const facturas = DB.facturas.filter(f => f.vehiculoId === id);

    const html = `
        <div class="perfil-header">
            <div class="perfil-avatar"><i class="fa-solid fa-car"></i></div>
            <div>
                <h3 style="margin:0;">${v.marca} ${v.modelo} — ${v.placa}</h3>
                <p style="color:#9aa1ab;">Propietario: ${c ? c.nombre + " " + c.apellido : "—"}</p>
            </div>
        </div>

        <div class="perfil-grid">
            <div class="mini-stat"><strong>${v.anio || "—"}</strong><span>Año</span></div>
            <div class="mini-stat"><strong>${v.km || 0}</strong><span>Kilometraje</span></div>
            <div class="mini-stat"><strong>${reparaciones.length}</strong><span>Reparaciones</span></div>
            <div class="mini-stat"><strong>${facturas.length}</strong><span>Facturas</span></div>
        </div>

        <h3 style="color:#0B1F4D; margin:20px 0 10px;">Datos técnicos</h3>
        <p><strong>Color:</strong> ${v.color || "—"}</p>
        <p><strong>VIN:</strong> ${v.vin || "—"}</p>
        <p><strong>Combustible:</strong> ${v.combustible || "—"}</p>
        <p><strong>Transmisión:</strong> ${v.transmision || "—"}</p>

        <h3 style="color:#0B1F4D; margin:20px 0 10px;">Historial completo de reparaciones</h3>
        ${reparaciones.length ? reparaciones.map(r => `<p>• ${r.fecha} — ${r.estado} — ${moneda(r.total)}</p>`).join("") : '<p class="texto-vacio">Sin reparaciones registradas.</p>'}

        <h3 style="color:#0B1F4D; margin:20px 0 10px;">Próximo mantenimiento</h3>
        <p class="texto-vacio">No hay un mantenimiento programado.</p>
    `;

    document.getElementById("contenidoPerfilVehiculo").innerHTML = html;
    abrirModal("modalPerfilVehiculo");
}

/* =========================================================
   REPARACIONES
========================================================= */

let repuestosTemp = []; // repuestos agregados durante la edición de una reparación

function cargarVehiculosDeCliente(){
    const clienteId = document.getElementById("reparacionCliente").value;
    const select = document.getElementById("reparacionVehiculo");
    const vehiculos = DB.vehiculos.filter(v => v.clienteId === clienteId);
    select.innerHTML = vehiculos.map(v => '<option value="' + v.id + '">' + v.marca + ' ' + v.modelo + ' (' + v.placa + ')</option>').join("")
        || '<option value="">Sin vehículos para este cliente</option>';
}

function abrirModalReparacion(id){
    llenarSelectClientes("reparacionCliente");

    if(DB.clientes.length === 0){
        alert("Primero debes registrar al menos un cliente y un vehículo.");
        return;
    }

    document.getElementById("tituloModalReparacion").textContent = id ? "Editar reparación" : "Registrar reparación";

    // llenar select de repuestos disponibles
    document.getElementById("repuestoSeleccionado").innerHTML = DB.inventario
        .map(r => '<option value="' + r.id + '">' + r.nombre + ' (disp: ' + r.cantidad + ')</option>').join("")
        || '<option value="">Sin repuestos en inventario</option>';

    document.querySelectorAll('#checksServicios input').forEach(chk => chk.checked = false);
    repuestosTemp = [];

    if(id){
        const r = DB.reparaciones.find(x => x.id === id);
        document.getElementById("reparacionId").value = r.id;
        document.getElementById("reparacionCliente").value = r.clienteId;
        cargarVehiculosDeCliente();
        document.getElementById("reparacionVehiculo").value = r.vehiculoId;
        document.getElementById("reparacionFecha").value = r.fecha;
        document.getElementById("reparacionMecanico").value = r.mecanico;
        document.getElementById("reparacionProblema").value = r.problema;
        document.getElementById("reparacionDiagnostico").value = r.diagnostico;
        document.getElementById("reparacionObservaciones").value = r.observaciones;
        document.getElementById("reparacionEstado").value = r.estado;
        document.getElementById("reparacionManoObra").value = r.manoObra;

        document.querySelectorAll('#checksServicios input').forEach(chk => {
            if(r.servicios.includes(chk.value)) chk.checked = true;
        });

        repuestosTemp = JSON.parse(JSON.stringify(r.repuestos || []));
    }else{
        document.getElementById("reparacionId").value = "";
        document.getElementById("reparacionFecha").value = fechaHoy();
        document.getElementById("reparacionMecanico").value = "";
        document.getElementById("reparacionProblema").value = "";
        document.getElementById("reparacionDiagnostico").value = "";
        document.getElementById("reparacionObservaciones").value = "";
        document.getElementById("reparacionEstado").value = "Pendiente";
        document.getElementById("reparacionManoObra").value = 0;
        cargarVehiculosDeCliente();
    }

    renderRepuestosReparacion();
    calcularTotalReparacion();
    abrirModal("modalReparacion");
}

function agregarRepuestoAReparacion(){
    const repuestoId = document.getElementById("repuestoSeleccionado").value;
    const cantidad = Number(document.getElementById("repuestoCantidad").value) || 1;
    const repuesto = buscarRepuesto(repuestoId);

    if(!repuesto){
        alert("Selecciona un repuesto válido.");
        return;
    }

    const existente = repuestosTemp.find(r => r.repuestoId === repuestoId);
    if(existente){
        existente.cantidad += cantidad;
    }else{
        repuestosTemp.push({ repuestoId, nombre: repuesto.nombre, precio: repuesto.precioVenta, cantidad });
    }

    renderRepuestosReparacion();
    calcularTotalReparacion();
}

function quitarRepuestoDeReparacion(index){
    repuestosTemp.splice(index, 1);
    renderRepuestosReparacion();
    calcularTotalReparacion();
}

function renderRepuestosReparacion(){
    const cont = document.getElementById("listaRepuestosReparacion");
    if(repuestosTemp.length === 0){
        cont.innerHTML = '<p class="texto-vacio" style="padding:10px;">Sin repuestos agregados.</p>';
        return;
    }
    cont.innerHTML = repuestosTemp.map((r, i) => `
        <div class="item-linea">
            <span>${r.nombre} × ${r.cantidad} — ${moneda(r.precio * r.cantidad)}</span>
            <button class="eliminar-item" onclick="quitarRepuestoDeReparacion(${i})"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join("");
}

function calcularTotalReparacion(){
    const manoObra = Number(document.getElementById("reparacionManoObra").value) || 0;
    const totalRepuestos = repuestosTemp.reduce((acc, r) => acc + (r.precio * r.cantidad), 0);
    const total = manoObra + totalRepuestos;
    document.getElementById("totalReparacionCalculado").textContent = moneda(total);
    return total;
}

function guardarReparacion(){
    const clienteId = document.getElementById("reparacionCliente").value;
    const vehiculoId = document.getElementById("reparacionVehiculo").value;

    if(!clienteId || !vehiculoId){
        alert("Selecciona un cliente y un vehículo.");
        return;
    }

    const servicios = Array.from(document.querySelectorAll('#checksServicios input:checked')).map(c => c.value);
    const total = calcularTotalReparacion();
    const id = document.getElementById("reparacionId").value;
    const estado = document.getElementById("reparacionEstado").value;

    const datos = {
        clienteId,
        vehiculoId,
        fecha: document.getElementById("reparacionFecha").value || fechaHoy(),
        mecanico: document.getElementById("reparacionMecanico").value.trim(),
        problema: document.getElementById("reparacionProblema").value.trim(),
        diagnostico: document.getElementById("reparacionDiagnostico").value.trim(),
        observaciones: document.getElementById("reparacionObservaciones").value.trim(),
        estado,
        manoObra: Number(document.getElementById("reparacionManoObra").value) || 0,
        servicios,
        repuestos: repuestosTemp,
        total
    };

    let reparacionFinal;
    const esNueva = !id;

    if(id){
        // si ya existía, primero devolvemos el stock de los repuestos viejos para recalcular limpio
        const anterior = DB.reparaciones.find(r => r.id === id);
        if(anterior){
            anterior.repuestos.forEach(r => {
                const inv = buscarRepuesto(r.repuestoId);
                if(inv) inv.cantidad += r.cantidad;
            });
        }
        Object.assign(anterior, datos);
        reparacionFinal = anterior;
    }else{
        reparacionFinal = { id: uid(), ...datos };
        DB.reparaciones.push(reparacionFinal);
    }

    // descontar del inventario
    let stockInsuficiente = false;
    datos.repuestos.forEach(r => {
        const inv = buscarRepuesto(r.repuestoId);
        if(inv){
            inv.cantidad -= r.cantidad;
            if(inv.cantidad < 0) stockInsuficiente = true;
        }
    });

    // generar factura automáticamente si la reparación quedó Finalizada o Entregada
    if((estado === "Finalizada" || estado === "Entregada")){
        const facturaExistente = DB.facturas.find(f => f.reparacionId === reparacionFinal.id);
        if(!facturaExistente){
            generarFactura(reparacionFinal);
        }
    }

    guardarDB();
    cerrarModal("modalReparacion");
    renderReparaciones();
    renderDashboard();

    if(stockInsuficiente){
        mostrarToast("Reparación guardada. Aviso: stock insuficiente en algún repuesto.");
    }else{
        mostrarToast("Reparación guardada correctamente.");
    }
}

function eliminarReparacion(id){
    if(!confirm("¿Eliminar esta reparación?")) return;
    const r = DB.reparaciones.find(x => x.id === id);
    if(r){
        r.repuestos.forEach(rep => {
            const inv = buscarRepuesto(rep.repuestoId);
            if(inv) inv.cantidad += rep.cantidad;
        });
    }
    DB.reparaciones = DB.reparaciones.filter(r => r.id !== id);
    DB.facturas = DB.facturas.filter(f => f.reparacionId !== id);
    guardarDB();
    renderReparaciones();
    mostrarToast("Reparación eliminada.");
}

function renderReparaciones(){
    const tbody = document.getElementById("tablaReparacionesFull");
    const texto = (document.getElementById("buscarReparacion").value || "").toLowerCase();
    const filtroEstado = document.getElementById("filtroEstadoReparacion").value;

    let lista = DB.reparaciones;

    if(filtroEstado) lista = lista.filter(r => r.estado === filtroEstado);

    if(texto){
        lista = lista.filter(r => {
            const c = buscarCliente(r.clienteId);
            const v = buscarVehiculo(r.vehiculoId);
            const texto1 = c ? (c.nombre + " " + c.apellido).toLowerCase() : "";
            const texto2 = v ? (v.marca + " " + v.modelo + " " + v.placa).toLowerCase() : "";
            return texto1.includes(texto) || texto2.includes(texto);
        });
    }

    if(lista.length === 0){
        tbody.innerHTML = '<tr><td colspan="7" class="texto-vacio">No existen registros.</td></tr>';
        return;
    }

    lista = [...lista].sort((a,b) => b.fecha.localeCompare(a.fecha));

    tbody.innerHTML = lista.map(r => {
        const c = buscarCliente(r.clienteId);
        const v = buscarVehiculo(r.vehiculoId);
        return '<tr>' +
            '<td>' + (c ? c.nombre + " " + c.apellido : "—") + '</td>' +
            '<td>' + (v ? v.marca + " " + v.modelo + " (" + v.placa + ")" : "—") + '</td>' +
            '<td>' + (r.mecanico || "—") + '</td>' +
            '<td>' + r.fecha + '</td>' +
            '<td>' + moneda(r.total) + '</td>' +
            '<td>' + pildoraEstado(r.estado) + '</td>' +
            '<td>' +
                '<button class="btn-icono editar" title="Editar" onclick="abrirModalReparacion(\'' + r.id + '\')"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn-icono eliminar" title="Eliminar" onclick="eliminarReparacion(\'' + r.id + '\')"><i class="fa-solid fa-trash"></i></button>' +
            '</td>' +
        '</tr>';
    }).join("");
}

/* =========================================================
   INVENTARIO
========================================================= */

function abrirModalRepuesto(id){
    document.getElementById("tituloModalRepuesto").textContent = id ? "Editar repuesto" : "Registrar repuesto";

    if(id){
        const r = buscarRepuesto(id);
        document.getElementById("repuestoId").value = r.id;
        document.getElementById("repuestoNombre").value = r.nombre;
        document.getElementById("repuestoCodigo").value = r.codigo;
        document.getElementById("repuestoCategoria").value = r.categoria;
        document.getElementById("repuestoMarca").value = r.marca;
        document.getElementById("repuestoCantidadStock").value = r.cantidad;
        document.getElementById("repuestoPrecioCompra").value = r.precioCompra;
        document.getElementById("repuestoPrecioVenta").value = r.precioVenta;
        document.getElementById("repuestoProveedor").value = r.proveedor;
    }else{
        document.getElementById("repuestoId").value = "";
        ["repuestoNombre","repuestoCodigo","repuestoCategoria","repuestoMarca","repuestoProveedor"]
            .forEach(id => document.getElementById(id).value = "");
        document.getElementById("repuestoCantidadStock").value = 0;
        document.getElementById("repuestoPrecioCompra").value = 0;
        document.getElementById("repuestoPrecioVenta").value = 0;
    }

    abrirModal("modalRepuesto");
}

function guardarRepuesto(){
    const nombre = document.getElementById("repuestoNombre").value.trim();
    if(!nombre){
        alert("El nombre del repuesto es obligatorio.");
        return;
    }

    const id = document.getElementById("repuestoId").value;
    const datos = {
        nombre,
        codigo: document.getElementById("repuestoCodigo").value.trim(),
        categoria: document.getElementById("repuestoCategoria").value.trim(),
        marca: document.getElementById("repuestoMarca").value.trim(),
        cantidad: Number(document.getElementById("repuestoCantidadStock").value) || 0,
        precioCompra: Number(document.getElementById("repuestoPrecioCompra").value) || 0,
        precioVenta: Number(document.getElementById("repuestoPrecioVenta").value) || 0,
        proveedor: document.getElementById("repuestoProveedor").value.trim()
    };

    if(id){
        Object.assign(buscarRepuesto(id), datos);
    }else{
        DB.inventario.push({ id: uid(), ...datos });
    }

    guardarDB();
    cerrarModal("modalRepuesto");
    renderInventario();
    mostrarToast("Repuesto guardado correctamente.");
}

function eliminarRepuesto(id){
    if(!confirm("¿Eliminar este repuesto del inventario?")) return;
    DB.inventario = DB.inventario.filter(r => r.id !== id);
    guardarDB();
    renderInventario();
    mostrarToast("Repuesto eliminado.");
}

function renderInventario(){
    const tbody = document.getElementById("tablaInventario");
    const texto = (document.getElementById("buscarRepuesto").value || "").toLowerCase();

    let lista = DB.inventario;
    if(texto){
        lista = lista.filter(r => r.nombre.toLowerCase().includes(texto) || (r.codigo || "").toLowerCase().includes(texto));
    }

    if(lista.length === 0){
        tbody.innerHTML = '<tr><td colspan="9" class="texto-vacio">No existen registros.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(r => {
        const bajo = r.cantidad < 5;
        return '<tr>' +
            '<td>' + (r.codigo || "—") + '</td>' +
            '<td>' + r.nombre + '</td>' +
            '<td>' + (r.categoria || "—") + '</td>' +
            '<td>' + (r.marca || "—") + '</td>' +
            '<td>' + (bajo ? '<span class="stock-bajo"><i class="fa-solid fa-triangle-exclamation"></i>' + r.cantidad + '</span>' : r.cantidad) + '</td>' +
            '<td>' + moneda(r.precioCompra) + '</td>' +
            '<td>' + moneda(r.precioVenta) + '</td>' +
            '<td>' + (r.proveedor || "—") + '</td>' +
            '<td>' +
                '<button class="btn-icono editar" title="Editar" onclick="abrirModalRepuesto(\'' + r.id + '\')"><i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn-icono eliminar" title="Eliminar" onclick="eliminarRepuesto(\'' + r.id + '\')"><i class="fa-solid fa-trash"></i></button>' +
            '</td>' +
        '</tr>';
    }).join("");
}

function abrirModalMovimiento(){
    document.getElementById("movimientoRepuesto").innerHTML = DB.inventario
        .map(r => '<option value="' + r.id + '">' + r.nombre + ' (disp: ' + r.cantidad + ')</option>').join("")
        || '<option value="">Sin repuestos en inventario</option>';
    document.getElementById("movimientoFecha").value = fechaHoy();
    document.getElementById("movimientoCantidad").value = 1;
    abrirModal("modalMovimiento");
}

function guardarMovimiento(){
    const repuestoId = document.getElementById("movimientoRepuesto").value;
    const repuesto = buscarRepuesto(repuestoId);
    if(!repuesto){
        alert("Selecciona un repuesto válido.");
        return;
    }

    const tipo = document.getElementById("movimientoTipo").value;
    const cantidad = Number(document.getElementById("movimientoCantidad").value) || 0;

    if(tipo === "Salida" && cantidad > repuesto.cantidad){
        if(!confirm("La cantidad solicitada supera el stock disponible (" + repuesto.cantidad + "). ¿Continuar de todos modos?")) return;
    }

    repuesto.cantidad += (tipo === "Entrada" ? cantidad : -cantidad);

    DB.movimientos.push({
        id: uid(),
        repuestoId,
        tipo,
        cantidad,
        fecha: document.getElementById("movimientoFecha").value || fechaHoy(),
        usuario: document.getElementById("movimientoUsuario").value.trim() || "Administrador"
    });

    guardarDB();
    cerrarModal("modalMovimiento");
    renderInventario();
    mostrarToast("Movimiento registrado correctamente.");
}

/* =========================================================
   FACTURACIÓN
========================================================= */

function generarFactura(reparacion){
    const numero = DB.contadorFactura++;
    const factura = {
        id: uid(),
        numero,
        reparacionId: reparacion.id,
        clienteId: reparacion.clienteId,
        vehiculoId: reparacion.vehiculoId,
        fecha: reparacion.fecha,
        servicios: reparacion.servicios,
        repuestos: reparacion.repuestos,
        manoObra: reparacion.manoObra,
        subtotal: reparacion.total,
        itbis: Math.round(reparacion.total * 0.18 * 100) / 100,
        total: Math.round((reparacion.total * 1.18) * 100) / 100
    };
    DB.facturas.push(factura);
    return factura;
}

function renderFacturas(){
    const tbody = document.getElementById("tablaFacturas");
    const texto = (document.getElementById("buscarFactura").value || "").toLowerCase();

    let lista = DB.facturas;
    if(texto){
        lista = lista.filter(f => {
            const c = buscarCliente(f.clienteId);
            const nombreCliente = c ? (c.nombre + " " + c.apellido).toLowerCase() : "";
            return nombreCliente.includes(texto) || String(f.numero).includes(texto);
        });
    }

    if(lista.length === 0){
        tbody.innerHTML = '<tr><td colspan="6" class="texto-vacio">No existen facturas. Se generan automáticamente al finalizar una reparación.</td></tr>';
        return;
    }

    lista = [...lista].sort((a,b) => b.numero - a.numero);

    tbody.innerHTML = lista.map(f => {
        const c = buscarCliente(f.clienteId);
        const v = buscarVehiculo(f.vehiculoId);
        return '<tr>' +
            '<td>#' + String(f.numero).padStart(4,"0") + '</td>' +
            '<td>' + (c ? c.nombre + " " + c.apellido : "—") + '</td>' +
            '<td>' + (v ? v.marca + " " + v.modelo + " (" + v.placa + ")" : "—") + '</td>' +
            '<td>' + f.fecha + '</td>' +
            '<td>' + moneda(f.total) + '</td>' +
            '<td><button class="btn-icono ver" title="Ver factura" onclick="verFactura(\'' + f.id + '\')"><i class="fa-solid fa-eye"></i></button></td>' +
        '</tr>';
    }).join("");
}

function verFactura(id){
    const f = DB.facturas.find(x => x.id === id);
    if(!f) return;

    const c = buscarCliente(f.clienteId);
    const v = buscarVehiculo(f.vehiculoId);

    const filasServicios = f.servicios.map(s => `<div style="display:flex;justify-content:space-between;padding:6px 0;"><span>${s}</span></div>`).join("");
    const filasRepuestos = f.repuestos.map(r => `<div style="display:flex;justify-content:space-between;padding:6px 0;"><span>${r.nombre} × ${r.cantidad}</span><span>${moneda(r.precio * r.cantidad)}</span></div>`).join("");

    const html = `
        <div class="factura-top">
            <div>
                <h2>${DB.config.nombre || "AutoTallerPro"}</h2>
                <p style="color:#9aa1ab;">${DB.config.direccion || ""}</p>
                <p style="color:#9aa1ab;">${DB.config.telefono || ""}</p>
            </div>
            <div style="text-align:right;">
                <h3 style="color:#0B1F4D;">Factura #${String(f.numero).padStart(4,"0")}</h3>
                <p style="color:#9aa1ab;">${f.fecha}</p>
            </div>
        </div>

        <div class="factura-info">
            <div>
                <strong>Cliente</strong>
                <p>${c ? c.nombre + " " + c.apellido : "—"}</p>
                <p>${c ? c.telefono : ""}</p>
            </div>
            <div>
                <strong>Vehículo</strong>
                <p>${v ? v.marca + " " + v.modelo + " (" + v.placa + ")" : "—"}</p>
            </div>
        </div>

        <strong style="color:#0B1F4D;">Servicios realizados</strong>
        ${filasServicios || '<p class="texto-vacio">Sin servicios registrados.</p>'}

        <strong style="color:#0B1F4D; display:block; margin-top:15px;">Repuestos utilizados</strong>
        ${filasRepuestos || '<p class="texto-vacio">Sin repuestos utilizados.</p>'}

        <div class="factura-totales">
            <div><span>Mano de obra</span><span>${moneda(f.manoObra)}</span></div>
            <div><span>Subtotal</span><span>${moneda(f.subtotal)}</span></div>
            <div><span>ITBIS (18%)</span><span>${moneda(f.itbis)}</span></div>
            <div class="total-final"><span>Total</span><span>${moneda(f.total)}</span></div>
        </div>

        <div class="firma-linea">Firma autorizada</div>
    `;

    document.getElementById("contenidoFactura").innerHTML = html;
    abrirModal("modalFactura");
}

/* =========================================================
   REPORTES
========================================================= */

let rangoReporteActual = "hoy";
let chartsReportes = {};

function cambiarRangoReporte(rango, btn){
    rangoReporteActual = rango;
    document.querySelectorAll(".filtros-reporte button").forEach(b => b.classList.remove("activo"));
    btn.classList.add("activo");
    renderReportes();
}

function facturasEnRango(){
    const hoy = new Date();
    return DB.facturas.filter(f => {
        const fecha = new Date(f.fecha + "T00:00:00");
        if(rangoReporteActual === "hoy") return f.fecha === fechaHoy();
        if(rangoReporteActual === "semana"){
            const inicioSemana = new Date(hoy);
            inicioSemana.setDate(hoy.getDate() - hoy.getDay());
            return fecha >= inicioSemana;
        }
        if(rangoReporteActual === "mes") return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
        if(rangoReporteActual === "anio") return fecha.getFullYear() === hoy.getFullYear();
        return true; // todo / personalizado
    });
}

function renderReportes(){
    const facturas = facturasEnRango();

    // ingresos por día (últimos puntos dentro del rango)
    const ingresosPorFecha = {};
    facturas.forEach(f => {
        ingresosPorFecha[f.fecha] = (ingresosPorFecha[f.fecha] || 0) + f.total;
    });
    const fechasOrdenadas = Object.keys(ingresosPorFecha).sort();

    dibujarChart("graficoReporteIngresos", "line", fechasOrdenadas, fechasOrdenadas.map(f => ingresosPorFecha[f]), "Ingresos");

    // servicios más vendidos
    const conteoServicios = {};
    facturas.forEach(f => f.servicios.forEach(s => conteoServicios[s] = (conteoServicios[s] || 0) + 1));
    const serviciosOrdenados = Object.entries(conteoServicios).sort((a,b) => b[1]-a[1]).slice(0,6);
    dibujarChart("graficoServicios", "bar", serviciosOrdenados.map(s=>s[0]), serviciosOrdenados.map(s=>s[1]), "Veces vendido");

    // repuestos más usados
    const conteoRepuestos = {};
    facturas.forEach(f => f.repuestos.forEach(r => conteoRepuestos[r.nombre] = (conteoRepuestos[r.nombre] || 0) + r.cantidad));
    const repuestosOrdenados = Object.entries(conteoRepuestos).sort((a,b) => b[1]-a[1]).slice(0,6);
    dibujarChart("graficoRepuestos", "bar", repuestosOrdenados.map(r=>r[0]), repuestosOrdenados.map(r=>r[1]), "Unidades usadas");

    // vehículos atendidos por marca
    const conteoMarcas = {};
    facturas.forEach(f => {
        const v = buscarVehiculo(f.vehiculoId);
        if(v) conteoMarcas[v.marca] = (conteoMarcas[v.marca] || 0) + 1;
    });
    const marcasOrdenadas = Object.entries(conteoMarcas).sort((a,b) => b[1]-a[1]);
    dibujarChart("graficoMarcas", "doughnut", marcasOrdenadas.map(m=>m[0]), marcasOrdenadas.map(m=>m[1]), "Vehículos");

    // clientes frecuentes
    const conteoClientes = {};
    facturas.forEach(f => {
        if(!conteoClientes[f.clienteId]) conteoClientes[f.clienteId] = { visitas: 0, total: 0 };
        conteoClientes[f.clienteId].visitas++;
        conteoClientes[f.clienteId].total += f.total;
    });
    const tbody = document.getElementById("tablaClientesFrecuentes");
    const filas = Object.entries(conteoClientes).sort((a,b) => b[1].visitas - a[1].visitas).slice(0,8);
    if(filas.length === 0){
        tbody.innerHTML = '<tr><td colspan="3" class="texto-vacio">Sin datos.</td></tr>';
    }else{
        tbody.innerHTML = filas.map(([clienteId, datos]) => {
            const c = buscarCliente(clienteId);
            return '<tr>' +
                '<td>' + (c ? c.nombre + " " + c.apellido : "—") + '</td>' +
                '<td>' + datos.visitas + '</td>' +
                '<td>' + moneda(datos.total) + '</td>' +
            '</tr>';
        }).join("");
    }
}

function dibujarChart(canvasId, tipo, labels, data, etiqueta){
    const ctx = document.getElementById(canvasId);
    if(!ctx) return;
    if(chartsReportes[canvasId]) chartsReportes[canvasId].destroy();

    const colores = ["#0B1F4D","#FF7A00","#1a9e6c","#c0392b","#9aa1ab","#3a6ea5"];

    chartsReportes[canvasId] = new Chart(ctx, {
        type: tipo,
        data: {
            labels: labels.length ? labels : ["Sin datos"],
            datasets: [{
                label: etiqueta,
                data: data.length ? data : [0],
                backgroundColor: tipo === "line" ? "rgba(255,122,0,0.15)" : colores,
                borderColor: "#FF7A00",
                fill: tipo === "line"
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: tipo === "doughnut" } }
        }
    });
}

function exportarExcelReportes(){
    let csv = "Cliente,Visitas,Total Gastado\n";
    const facturas = facturasEnRango();
    const conteo = {};
    facturas.forEach(f => {
        if(!conteo[f.clienteId]) conteo[f.clienteId] = { visitas: 0, total: 0 };
        conteo[f.clienteId].visitas++;
        conteo[f.clienteId].total += f.total;
    });
    Object.entries(conteo).forEach(([clienteId, datos]) => {
        const c = buscarCliente(clienteId);
        csv += `"${c ? c.nombre + " " + c.apellido : "—"}",${datos.visitas},${datos.total}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reporte_autotallerpro.csv";
    link.click();
}

/* =========================================================
   MANTENIMIENTO (Configuración del sistema + Usuarios)
========================================================= */

function cambiarTabConfig(tab, btn){
    document.querySelectorAll(".config-tabs button").forEach(b => b.classList.remove("activo"));
    btn.classList.add("activo");
    document.querySelectorAll(".config-vista").forEach(v => v.classList.remove("activa"));
    document.getElementById("config-" + tab).classList.add("activa");
    if(tab === "usuarios") renderUsuarios();
}

function cargarConfigEnFormulario(){
    document.getElementById("tallerNombre").value = DB.config.nombre || "";
    document.getElementById("tallerTelefono").value = DB.config.telefono || "";
    document.getElementById("tallerCorreo").value = DB.config.correo || "";
    document.getElementById("tallerDireccion").value = DB.config.direccion || "";
    document.getElementById("tallerLogo").value = DB.config.logo || "";
    renderUsuarios();
}

function guardarConfigTaller(){
    DB.config = {
        nombre: document.getElementById("tallerNombre").value.trim() || "AutoTallerPro",
        telefono: document.getElementById("tallerTelefono").value.trim(),
        correo: document.getElementById("tallerCorreo").value.trim(),
        direccion: document.getElementById("tallerDireccion").value.trim(),
        logo: document.getElementById("tallerLogo").value.trim() || "logo.png"
    };
    guardarDB();
    document.querySelector(".logo h3").textContent = DB.config.nombre;
    mostrarToast("Información del taller actualizada.");
}

function abrirModalUsuario(id){
    document.getElementById("tituloModalUsuario").textContent = id ? "Editar usuario" : "Crear usuario";
    if(id){
        const u = DB.usuarios.find(x => x.id === id);
        document.getElementById("usuarioId").value = u.id;
        document.getElementById("usuarioNombre").value = u.nombre;
        document.getElementById("usuarioCorreo").value = u.correo;
        document.getElementById("usuarioRol").value = u.rol;
    }else{
        document.getElementById("usuarioId").value = "";
        document.getElementById("usuarioNombre").value = "";
        document.getElementById("usuarioCorreo").value = "";
        document.getElementById("usuarioRol").value = "Recepcionista";
    }
    abrirModal("modalUsuario");
}

function guardarUsuario(){
    const nombre = document.getElementById("usuarioNombre").value.trim();
    if(!nombre){
        alert("El nombre del usuario es obligatorio.");
        return;
    }

    const id = document.getElementById("usuarioId").value;
    const datos = {
        nombre,
        correo: document.getElementById("usuarioCorreo").value.trim(),
        rol: document.getElementById("usuarioRol").value
    };

    if(id){
        Object.assign(DB.usuarios.find(u => u.id === id), datos);
    }else{
        DB.usuarios.push({ id: uid(), usuario: nombre.split(" ")[0].toLowerCase(), contrasena: "1234", estado: "Activo", ...datos });
    }

    guardarDB();
    cerrarModal("modalUsuario");
    renderUsuarios();
    mostrarToast("Usuario guardado correctamente.");
}

function eliminarUsuario(id){
    if(!confirm("¿Eliminar este usuario?")) return;
    DB.usuarios = DB.usuarios.filter(u => u.id !== id);
    guardarDB();
    renderUsuarios();
    mostrarToast("Usuario eliminado.");
}

function renderUsuarios(){
    const tbody = document.getElementById("tablaUsuarios");
    if(!tbody) return;
    if(DB.usuarios.length === 0){
        tbody.innerHTML = '<tr><td colspan="5" class="texto-vacio">No existen registros.</td></tr>';
        return;
    }
    tbody.innerHTML = DB.usuarios.map(u => `
        <tr>
            <td>${u.nombre}</td>
            <td>${u.correo || "—"}</td>
            <td><span class="pildora taller">${u.rol}</span></td>
            <td><span class="pildora activo-pill">${u.estado || "Activo"}</span></td>
            <td>
                <button class="btn-icono editar" title="Editar" onclick="abrirModalUsuario('${u.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icono eliminar" title="Eliminar" onclick="eliminarUsuario('${u.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join("");
}

function cambiarPassword(){
    const actual = document.getElementById("passActual").value;
    const nueva = document.getElementById("passNueva").value;
    if(!actual || !nueva){
        alert("Completa ambos campos.");
        return;
    }

    const sesion = sesionActiva();
    const usuarioActual = sesion ? DB.usuarios.find(u => u.id === sesion.id) : DB.usuarios.find(u => u.usuario === "admin");

    if(!usuarioActual || usuarioActual.contrasena !== actual){
        alert("La contraseña actual no es correcta.");
        return;
    }

    usuarioActual.contrasena = nueva;
    guardarDB();

    document.getElementById("passActual").value = "";
    document.getElementById("passNueva").value = "";
    mostrarToast("Contraseña actualizada correctamente.");
}

function respaldarBaseDatos(){
    const blob = new Blob([JSON.stringify(DB, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "respaldo_autotallerpro_" + fechaHoy() + ".json";
    link.click();
    mostrarToast("Respaldo descargado correctamente.");
}

/* =========================================================
   INICIALIZACIÓN
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".logo h3").textContent = DB.config.nombre || "AutoTallerPro";
    verificarSesion();
});