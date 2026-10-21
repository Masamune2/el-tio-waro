"use strict";

const SUPABASE_URL = 'https://ykiutnpwznbcqxaatqw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publisable_Isw96D1TSmlU0LgVVK20vw_QZqYhmtW';

// Cliente único y seguro
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const CLAVE_DATOS = "elTioWaroDatosV2";

const ADMIN_INICIAL = {
    id: "admin-master",
    nombre: "Administrador General",
    correo: "admin@eltiowaro.com",
    clave: "Waro2026!",
    rol: "administrador",
    tienda: "",
    activo: true
};

let datos = cargarDatos();
let usuarioActual = null;
let carrito = [];
let accionConfirmarAceptar = null;

function cargarDatos() {
    try {
        const guardados = localStorage.getItem(CLAVE_DATOS);
        if (guardados) {
            const parsed = JSON.parse(guardados);
            if (Array.isArray(parsed.usuarios) && Array.isArray(parsed.productos)) {
                if (!Array.isArray(parsed.ventas)) parsed.ventas = [];
                if (!Array.isArray(parsed.promociones)) parsed.promociones = [];
                return parsed;
            }
        }
    } catch (e) {
        console.error("Error al leer datos", e);
    }
    return {
        usuarios: [ADMIN_INICIAL],
        productos: [],
        ventas: [],
        promociones: []
    };
}

function guardarDatos() {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(datos));
}

function generarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function soles(num) {
    return Number(num || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN" });
}

function elemento(id) { return document.getElementById(id); }
function valor(id) { return elemento(id)?.value ?? ""; }
function ponerTexto(id, texto) { if (elemento(id)) elemento(id).textContent = texto; }
function ponerHTML(id, html) { if (elemento(id)) elemento(id).innerHTML = html; }
function escuchar(id, evento, fn) { if (elemento(id)) elemento(id).addEventListener(evento, fn); }

/* --- SISTEMA DE MODAL DE CONFIRMACIÓN PERSONALIZADO --- */
function abrirModalConfirmar(titulo, mensaje, funcionAceptar) {
    ponerTexto("modal-confirmar-titulo", titulo);
    ponerTexto("modal-confirmar-mensaje", mensaje);
    accionConfirmarAceptar = funcionAceptar;
    elemento("modal-confirmar")?.classList.remove("oculta");
}

escuchar("modal-confirmar-cancelar", "click", () => {
    elemento("modal-confirmar")?.classList.add("oculta");
    accionConfirmarAceptar = null;
});

escuchar("modal-confirmar-aceptar", "click", () => {
    if (accionConfirmarAceptar) accionConfirmarAceptar();
    elemento("modal-confirmar")?.classList.add("oculta");
    accionConfirmarAceptar = null;
});

/* --- LOGIN Y SEGURIDAD --- */
escuchar("ver-clave", "click", () => {
    const campo = elemento("login-clave");
    if (!campo) return;
    const mostrar = campo.type === "password";
    campo.type = mostrar ? "text" : "password";
    ponerTexto("ver-clave", mostrar ? "Ocultar" : "Ver");
});

escuchar("form-login", "submit", async e => {
    e.preventDefault();
    const correo = valor("login-correo").trim().toLowerCase();
    const clave = valor("login-clave");

    ponerTexto("error-login", "");

    if (!supabaseClient) {
        return ponerTexto("error-login", "Error: La librería de Supabase no cargó correctamente.");
    }

    try {
        // Consulta directa usando supabaseClient
        const { data: usuarios, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('correo electrónico', correo)
            .eq('contraseña', clave);

        if (error) {
            console.error("Error Supabase:", error);
            return ponerTexto("error-login", "Error al consultar la base de datos.");
        }

        if (!usuarios || usuarios.length === 0) {
            return ponerTexto("error-login", "Correo o contraseña incorrectos.");
        }

        const user = usuarios[0];

        usuarioActual = {
            id: user.id || "admin-master",
            nombre: user.nombre || "Administrador General",
            correo: user['correo electrónico'],
            rol: (user.rol || "").toLowerCase(),
            tienda: user.tienda || "",
            activo: true
        };

        carrito = [];
        elemento("pagina-acceso")?.classList.add("oculta");
        elemento("aplicacion")?.classList.remove("oculta");
        ponerTexto("sesion-nombre", usuarioActual.nombre);
        ponerTexto("sesion-rol", usuarioActual.rol === "administrador" ? "Administrador" : `Tienda: ${usuarioActual.tienda}`);

        const esAdmin = usuarioActual.rol === "administrador";
        elemento("menu-administrador")?.classList.toggle("oculta", !esAdmin);
        elemento("menu-tienda")?.classList.toggle("oculta", esAdmin);

    } catch (err) {
        console.error("Error inesperado:", err);
        ponerTexto("error-login", "Ocurrió un error inesperado al iniciar sesión.");
    }
});

        carrito = [];
        elemento("pagina-acceso")?.classList.add("oculta");
        elemento("aplicacion")?.classList.remove("oculta");
        ponerTexto("sesion-nombre", usuarioActual.nombre);
        ponerTexto("sesion-rol", usuarioActual.rol === "administrador" ? "Administrador" : `Tienda: ${usuarioActual.tienda}`);

        const esAdmin = usuarioActual.rol === "administrador";
        elemento("menu-administrador")?.classList.toggle("oculta", !esAdmin);
        elemento("menu-tienda")?.classList.toggle("oculta", esAdmin);

    } catch (err) {
        console.error("Error inesperado:", err);
        ponerTexto("error-login", "Ocurrió un error inesperado al iniciar sesión.");
    }
});

escuchar("cerrar-sesion", "click", () => {
    usuarioActual = null;
    carrito = [];
    elemento("aplicacion")?.classList.add("oculta");
    elemento("pagina-acceso")?.classList.remove("oculta");
    elemento("form-login")?.reset();
    ponerTexto("error-login", "");
});

/* --- NAVEGACIÓN --- */
document.querySelectorAll("[data-seccion]").forEach(b => {
    b.addEventListener("click", () => abrirSeccion(b.dataset.seccion));
});

function abrirSeccion(id) {
    document.querySelectorAll(".seccion-app").forEach(s => s.classList.toggle("oculta", s.id !== id));
    document.querySelectorAll(".opcion-menu").forEach(m => m.classList.toggle("activa", m.dataset.seccion === id));

    if (usuarioActual?.rol === "administrador" && id === "admin-usuarios") {
        renderizarUsuarios();
    }
    if (usuarioActual?.rol === "tienda") {
        if (id === "tienda-inicio") renderizarCatalogoVenta();
        if (id === "tienda-inventario") {
            renderizarInventarioTienda();
            prepararFilaCombo();
            renderizarPromocionesTienda();
        }
        if (id === "tienda-historial") {
            if (!elemento("filtro-fecha-ref").value) {
                elemento("filtro-fecha-ref").value = new Date().toISOString().slice(0, 10);
            }
            renderizarHistorialTienda();
        }
    }
}

/* --- ADMIN: GESTIÓN DE USUARIOS --- */
escuchar("nuevo-rol", "change", () => {
    const rol = valor("nuevo-rol");
    elemento("contenedor-tienda-nombre").style.display = rol === "administrador" ? "none" : "block";
});

escuchar("form-crear-usuario", "submit", e => {
    e.preventDefault();
    const nombre = valor("nuevo-nombre").trim();
    const correo = valor("nuevo-correo").trim().toLowerCase();
    const clave = valor("nuevo-clave");
    const rol = valor("nuevo-rol");
    const tienda = valor("nuevo-tienda").trim();

    if (datos.usuarios.some(u => u.correo.toLowerCase() === correo)) {
        return ponerTexto("mensaje-usuario", "Ya existe un usuario con este correo.");
    }
    if (rol === "tienda" && !tienda) {
        return ponerTexto("mensaje-usuario", "Indique el nombre de la tienda.");
    }

    datos.usuarios.push({
        id: generarId(),
        nombre,
        correo,
        clave,
        rol,
        tienda: rol === "tienda" ? tienda : "",
        activo: true
    });
    guardarDatos();
    e.target.reset();
    ponerTexto("mensaje-usuario", "Usuario creado con éxito.");
    renderizarUsuarios();
});

function renderizarUsuarios() {
    const tbody = elemento("tabla-usuarios");
    if (!tbody) return;

    tbody.innerHTML = datos.usuarios.map(u => `
        <tr>
            <td>${u.nombre}</td>
            <td>${u.correo}</td>
            <td>${u.rol === "administrador" ? "Administrador" : "Tienda"}</td>
            <td>${u.tienda || "—"}</td>
            <td><span style="color:${u.activo ? 'green' : 'red'}; font-weight:bold;">${u.activo ? 'Activo' : 'Deshabilitado'}</span></td>
            <td>
                ${u.id !== usuarioActual.id ? `
                    <button class="boton-secundario boton-pequeno" onclick="cambiarEstadoUsuario('${u.id}')">${u.activo ? 'Deshabilitar' : 'Activar'}</button>
                    <button class="boton-secundario boton-pequeno" onclick="abrirModalClave('${u.id}', '${u.nombre}')">Clave</button>
                    <button class="boton-peligro boton-pequeno" onclick="confirmarEliminarUsuario('${u.id}', '${u.nombre}')">Eliminar</button>
                ` : '<em>Tu cuenta</em>'}
            </td>
        </tr>
    `).join("");
}

window.cambiarEstadoUsuario = function(id) {
    const u = datos.usuarios.find(x => x.id === id);
    if (u) {
        u.activo = !u.activo;
        guardarDatos();
        renderizarUsuarios();
    }
};

window.confirmarEliminarUsuario = function(id, nombre) {
    abrirModalConfirmar(
        "Eliminar usuario",
        `¿Estás seguro de que deseas eliminar la cuenta de ${nombre}?`,
        () => {
            datos.usuarios = datos.usuarios.filter(x => x.id !== id);
            guardarDatos();
            renderizarUsuarios();
        }
    );
};

window.abrirModalClave = function(id, nombre) {
    elemento("modal-usuario-id").value = id;
    ponerTexto("modal-usuario-info", `Restablecer contraseña para: ${nombre}`);
    elemento("modal-clave").classList.remove("oculta");
};

escuchar("modal-cerrar-btn", "click", () => elemento("modal-clave").classList.add("oculta"));
escuchar("modal-guardar-clave-btn", "click", () => {
    const id = valor("modal-usuario-id");
    const nuevaClave = valor("modal-nueva-clave");
    if (nuevaClave.length < 6) {
        ponerTexto("mensaje-usuario", "La contraseña debe tener al menos 6 caracteres.");
        return;
    }
    const u = datos.usuarios.find(x => x.id === id);
    if (u) {
        u.clave = nuevaClave;
        guardarDatos();
        elemento("modal-clave").classList.add("oculta");
        elemento("modal-nueva-clave").value = "";
        ponerTexto("mensaje-usuario", "Contraseña restablecida con éxito.");
    }
});

/* --- TIENDA: INVENTARIO Y PROMOCIONES --- */
function productosDeMiTienda() {
    return datos.productos.filter(p => p.tienda === usuarioActual.tienda);
}

function promocionesDeMiTienda() {
    return datos.promociones.filter(p => p.tienda === usuarioActual.tienda);
}

escuchar("form-producto", "submit", e => {
    e.preventDefault();
    const id = valor("producto-id");
    const nombre = valor("prod-nombre").trim();
    const categoria = valor("prod-categoria");
    const precio = Number(valor("prod-precio"));
    const stock = Number(valor("prod-stock"));

    if (id) {
        const p = datos.productos.find(x => x.id === id);
        if (p) Object.assign(p, { nombre, categoria, precio, stock });
    } else {
        datos.productos.push({ id: generarId(), tienda: usuarioActual.tienda, nombre, categoria, precio, stock });
    }
    guardarDatos();
    e.target.reset();
    elemento("producto-id").value = "";
    ponerTexto("mensaje-producto", "Producto guardado correctamente.");
    renderizarInventarioTienda();
});

function renderizarInventarioTienda() {
    const prods = productosDeMiTienda();
    ponerHTML("tabla-inventario", prods.length ? prods.map(p => `
        <tr>
            <td>${p.nombre}</td>
            <td>${p.categoria}</td>
            <td>${soles(p.precio)}</td>
            <td>${p.stock}</td>
            <td><span style="color:${p.stock < 5 ? 'orange':'green'}; font-weight:bold;">${p.stock < 5 ? 'Stock bajo':'Disponible'}</span></td>
            <td>
                <button class="boton-secundario boton-pequeno" onclick="editarProducto('${p.id}')">Editar</button>
                <button class="boton-peligro boton-pequeno" onclick="confirmarEliminarProducto('${p.id}', '${p.nombre}')">Eliminar</button>
            </td>
        </tr>
    `).join("") : `<tr><td colspan="6">No hay productos registrados.</td></tr>`);
}

window.editarProducto = function(id) {
    const p = datos.productos.find(x => x.id === id);
    if (!p) return;
    elemento("producto-id").value = p.id;
    elemento("prod-nombre").value = p.nombre;
    elemento("prod-categoria").value = p.categoria;
    elemento("prod-precio").value = p.precio;
    elemento("prod-stock").value = p.stock;
};

window.confirmarEliminarProducto = function(id, nombre) {
    abrirModalConfirmar(
        "Eliminar producto",
        `¿Deseas eliminar el producto ${nombre}?`,
        () => {
            datos.productos = datos.productos.filter(x => x.id !== id);
            guardarDatos();
            renderizarInventarioTienda();
        }
    );
};

/* COMBOS Y PROMOCIONES */
function prepararFilaCombo() {
    const contenedor = elemento("promo-componentes-lista");
    if (contenedor && contenedor.children.length === 0) {
        agregarFilaCombo();
    } else {
        actualizarSelectsCombo();
    }
}

function agregarFilaCombo() {
    const contenedor = elemento("promo-componentes-lista");
    if (!contenedor) return;

    const prods = productosDeMiTienda();
    const opciones = prods.map(p => `<option value="${p.id}">${p.nombre} (Stock: ${p.stock})</option>`).join("");

    const div = document.createElement("div");
    div.style.cssText = "display:grid; grid-template-columns: 1fr 90px auto; gap:8px; margin-bottom:8px; align-items:center;";
    div.innerHTML = `
        <select class="combo-prod-select" required><option value="">Seleccionar producto</option>${opciones}</select>
        <input type="number" class="combo-cant-input" min="1" value="1" required>
        <button type="button" class="boton-peligro boton-pequeno" onclick="this.parentElement.remove()">X</button>
    `;
    contenedor.appendChild(div);
}

function actualizarSelectsCombo() {
    const prods = productosDeMiTienda();
    const opciones = prods.map(p => `<option value="${p.id}">${p.nombre} (Stock: ${p.stock})</option>`).join("");
    document.querySelectorAll(".combo-prod-select").forEach(sel => {
        const actual = sel.value;
        sel.innerHTML = `<option value="">Seleccionar producto</option>${opciones}`;
        sel.value = actual;
    });
}

escuchar("agregar-fila-combo", "click", agregarFilaCombo);

escuchar("form-promocion", "submit", e => {
    e.preventDefault();
    const nombre = valor("promo-nombre").trim();
    const precio = Number(valor("promo-precio"));
    const filas = document.querySelectorAll("#promo-componentes-lista > div");
    const componentes = [];

    filas.forEach(f => {
        const prodId = f.querySelector(".combo-prod-select").value;
        const cant = Number(f.querySelector(".combo-cant-input").value);
        if (prodId && cant > 0) {
            componentes.push({ productoId: prodId, cantidad: cant });
        }
    });

    if (componentes.length === 0) {
        ponerTexto("mensaje-promocion", "Agrega al menos un producto al combo.");
        return;
    }

    datos.promociones.push({
        id: generarId(),
        tienda: usuarioActual.tienda,
        nombre,
        precio,
        componentes
    });
    guardarDatos();
    e.target.reset();
    elemento("promo-componentes-lista").innerHTML = "";
    agregarFilaCombo();
    ponerTexto("mensaje-promocion", "Promoción creada correctamente.");
    renderizarPromocionesTienda();
});

function renderizarPromocionesTienda() {
    const promos = promocionesDeMiTienda();
    ponerHTML("tabla-promociones", promos.length ? promos.map(p => {
        const compTxt = p.componentes.map(c => {
            const prod = datos.productos.find(x => x.id === c.productoId);
            return `${prod ? prod.nombre : 'Prod'} x${c.cantidad}`;
        }).join(", ");

        return `
            <tr>
                <td><strong>${p.nombre}</strong></td>
                <td>${compTxt}</td>
                <td>${soles(p.precio)}</td>
                <td><button class="boton-peligro boton-pequeno" onclick="confirmarEliminarPromo('${p.id}', '${p.nombre}')">Eliminar</button></td>
            </tr>
        `;
    }).join("") : `<tr><td colspan="4">No hay promociones creadas.</td></tr>`);
}

window.confirmarEliminarPromo = function(id, nombre) {
    abrirModalConfirmar(
        "Eliminar promoción",
        `¿Deseas eliminar la promoción ${nombre}?`,
        () => {
            datos.promociones = datos.promociones.filter(p => p.id !== id);
            guardarDatos();
            renderizarPromocionesTienda();
        }
    );
};

/* --- TIENDA: INICIO Y VENTAS --- */
escuchar("buscar-catalogo", "input", renderizarCatalogoVenta);

function renderizarCatalogoVenta() {
    const filtro = valor("buscar-catalogo").trim().toLowerCase();
    const prods = productosDeMiTienda().filter(p => p.nombre.toLowerCase().includes(filtro) && p.stock > 0);
    const promos = promocionesDeMiTienda().filter(pr => pr.nombre.toLowerCase().includes(filtro));

    let html = "";
    promos.forEach(pr => {
        html += `
            <div class="item-catalogo">
                <div>
                    <strong style="color:var(--verde);">[PROMOCIÓN] ${pr.nombre}</strong>
                    <p style="font-size:12px; margin:2px 0; color:var(--texto-secundario);">Precio Combo</p>
                    <span style="font-weight:bold;">${soles(pr.precio)}</span>
                </div>
                <button class="boton-principal boton-pequeno" onclick="agregarAlCarrito('promo', '${pr.id}')">Agregar</button>
            </div>
        `;
    });

    prods.forEach(p => {
        html += `
            <div class="item-catalogo">
                <div>
                    <strong>${p.nombre}</strong>
                    <p style="font-size:12px; margin:2px 0; color:var(--texto-secundario);">Stock: ${p.stock} | ${p.categoria}</p>
                    <span style="font-weight:bold;">${soles(p.precio)}</span>
                </div>
                <button class="boton-principal boton-pequeno" onclick="agregarAlCarrito('prod', '${p.id}')">Agregar</button>
            </div>
        `;
    });

    ponerHTML("lista-catalogo", html || `<p>No se encontraron productos o promociones.</p>`);
}

window.agregarAlCarrito = function(tipo, id) {
    if (tipo === "prod") {
        const p = datos.productos.find(x => x.id === id);
        if (!p) return;
        const enCarrito = carrito.find(i => i.tipo === "prod" && i.id === id);
        const cantidadActual = enCarrito ? enCarrito.cantidad : 0;
        if (cantidadActual + 1 > p.stock) {
            ponerTexto("mensaje-venta", "No hay suficiente stock disponible.");
            return;
        }
        if (enCarrito) {
            enCarrito.cantidad++;
        } else {
            carrito.push({ tipo: "prod", id: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 });
        }
    } else {
        const pr = datos.promociones.find(x => x.id === id);
        if (!pr) return;
        for (const c of pr.componentes) {
            const prod = datos.productos.find(x => x.id === c.productoId);
            const enCarritoCant = carrito.filter(i => i.tipo === "promo").reduce((acc, item) => {
                const promoObj = datos.promociones.find(x => x.id === item.id);
                const compMatch = promoObj?.componentes.find(cm => cm.productoId === c.productoId);
                return acc + (compMatch ? compMatch.cantidad * item.cantidad : 0);
            }, 0);
            if (!prod || prod.stock < (enCarritoCant + c.cantidad)) {
                ponerTexto("mensaje-venta", `Stock insuficiente para: ${prod ? prod.nombre : 'Producto'}`);
                return;
            }
        }
        const enCarrito = carrito.find(i => i.tipo === "promo" && i.id === id);
        if (enCarrito) {
            enCarrito.cantidad++;
        } else {
            carrito.push({ tipo: "promo", id: pr.id, nombre: pr.nombre, precio: pr.precio, cantidad: 1, componentes: pr.componentes });
        }
    }
    ponerTexto("mensaje-venta", "");
    renderizarCarritoLateral();
};

function renderizarCarritoLateral() {
    const contenedor = elemento("lista-carrito-lateral");
    if (!contenedor) return;

    if (carrito.length === 0) {
        contenedor.innerHTML = `<p style="font-size: 13px; color: var(--texto-secundario);">El carrito está vacío.</p>`;
        ponerTexto("carrito-total-monto", soles(0));
        return;
    }

    let html = "";
    let total = 0;

    carrito.forEach((item, idx) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        html += `
            <div class="item-carrito-fila" style="font-size:13px;">
                <div>
                    <strong>${item.nombre}</strong><br>
                    <span>${item.cantidad} x ${soles(item.precio)} = <strong>${soles(subtotal)}</strong></span>
                </div>
                <button class="boton-peligro boton-pequeno" onclick="quitarDelCarrito(${idx})">X</button>
            </div>
        `;
    });

    contenedor.innerHTML = html;
    ponerTexto("carrito-total-monto", soles(total));
}

window.quitarDelCarrito = function(idx) {
    carrito.splice(idx, 1);
    renderizarCarritoLateral();
};

escuchar("metodo-pago", "change", () => {
    const esYape = valor("metodo-pago") === "yape";
    elemento("bloque-yape")?.classList.toggle("oculta", !esYape);
});

escuchar("confirmar-pago-btn", "click", () => {
    if (carrito.length === 0) {
        return ponerTexto("mensaje-venta", "Agrega al menos un producto al carrito.");
    }

    const metodo = valor("metodo-pago");
    const yapeDestinatario = valor("yape-destinatario").trim();

    if (metodo === "yape" && !yapeDestinatario) {
        ponerTexto("mensaje-venta", "Debes indicar el nombre de quien recibe el Yape.");
        elemento("yape-destinatario")?.focus();
        return;
    }

    for (const item of carrito) {
        if (item.tipo === "prod") {
            const p = datos.productos.find(x => x.id === item.id);
            if (p) p.stock -= item.cantidad;
        } else if (item.tipo === "promo") {
            item.componentes.forEach(c => {
                const p = datos.productos.find(x => x.id === c.productoId);
                if (p) p.stock -= (c.cantidad * item.cantidad);
            });
        }
    }

    const total = carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    const nuevaVenta = {
        id: generarId(),
        codigo: `WAR-${Math.floor(1000 + Math.random() * 9000)}`,
        fecha: new Date().toISOString(),
        tienda: usuarioActual.tienda,
        productos: [...carrito],
        metodoPago: metodo,
        destinatarioYape: metodo === "yape" ? yapeDestinatario : "",
        total
    };

    datos.ventas.push(nuevaVenta);
    guardarDatos();

    carrito = [];
    renderizarCarritoLateral();
    renderizarCatalogoVenta();
    elemento("yape-destinatario").value = "";
    elemento("bloque-yape")?.classList.add("oculta");
    elemento("metodo-pago").value = "efectivo";

    ponerTexto("mensaje-venta", `¡Venta registrada con éxito! Código: ${nuevaVenta.codigo}`);
    setTimeout(() => ponerTexto("mensaje-venta", ""), 4000);
});

/* --- TIENDA: HISTORIAL DE VENTAS --- */
escuchar("filtro-periodo", "change", renderizarHistorialTienda);
escuchar("filtro-fecha-ref", "change", renderizarHistorialTienda);

function renderizarHistorialTienda() {
    const periodo = valor("filtro-periodo");
    const refFechaStr = valor("filtro-fecha-ref") || new Date().toISOString().slice(0, 10);
    const refDate = new Date(refFechaStr + "T00:00:00");

    const ventasTienda = datos.ventas.filter(v => v.tienda === usuarioActual.tienda);

    const ventasFiltradas = ventasTienda.filter(v => {
        if (periodo === "todos") return true;
        const vDate = new Date(v.fecha);

        if (periodo === "dia") {
            return vDate.toDateString() === refDate.toDateString();
        }
        if (periodo === "mes") {
            return vDate.getFullYear() === refDate.getFullYear() && vDate.getMonth() === refDate.getMonth();
        }
        if (periodo === "anio") {
            return vDate.getFullYear() === refDate.getFullYear();
        }
        if (periodo === "semana") {
            const d = new Date(refDate);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const lunes = new Date(d.setDate(diff));
            lunes.setHours(0,0,0,0);
            const domingo = new Date(lunes);
            domingo.setDate(lunes.getDate() + 6);
            domingo.setHours(23,59,59,999);
            return vDate >= lunes && vDate <= domingo;
        }
        return true;
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const tbody = elemento("tabla-historial-tienda");
    if (!tbody) return;

    tbody.innerHTML = ventasFiltradas.length ? ventasFiltradas.map(v => {
        const prodResumen = v.productos.map(i => `${i.nombre} (x${i.cantidad})`).join(", ");
        const pagoTxt = v.metodoPago === "yape" ? `Yape (${v.destinatarioYape})` : "Efectivo";
        return `
            <tr>
                <td><strong>${v.codigo}</strong></td>
                <td>${new Date(v.fecha).toLocaleString("es-PE")}</td>
                <td>${prodResumen}</td>
                <td>${pagoTxt}</td>
                <td><strong>${soles(v.total)}</strong></td>
            </tr>
        `;
    }).join("") : `<tr><td colspan="5">No hay ventas registradas para este periodo.</td></tr>`;
}

if (datos.usuarios.length === 1) {
    datos.usuarios.push({
        id: generarId(),
        nombre: "Vendedor Ala",
        correo: "ala@eltiowaro.com",
        clave: "123456",
        rol: "tienda",
        tienda: "ala",
        activo: true
    });
    guardarDatos();
}
