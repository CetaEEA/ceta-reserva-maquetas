// =========================================================
// ADMIN.JS
// Sistema de Reserva de Maquetas CETA
// =========================================================


// =========================================================
// SUPABASE
// =========================================================

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =========================================================
// VARIABLES GLOBALES
// =========================================================

let inicioSemanaAdmin =
    obtenerLunesAdmin(
        new Date()
    );

let reservasSemanaPDF = [];

let mapaPerfilesPDF =
    new Map();

let mapaMaquetasPDF =
    new Map();


// =========================================================
// COMPROBAR ADMINISTRADOR
// =========================================================

async function comprobarAdministrador() {

    const {
        data: { user },
        error
    } =
        await supabaseClient
            .auth
            .getUser();


    if (
        error ||
        !user
    ) {

        window.location.href =
            "index.html";

        return null;
    }


    const {
        data: perfil,
        error: errorPerfil
    } =
        await supabaseClient

            .from("perfiles")

            .select("*")

            .eq(
                "id",
                user.id
            )

            .single();


    if (
        errorPerfil ||
        !perfil ||
        perfil.rol !== "administrador" ||
        !perfil.activo ||
        perfil.eliminado === true
    ) {

        await supabaseClient
            .auth
            .signOut();


        window.location.href =
            "index.html";


        return null;
    }


    const nombreAdministrador =
        document.getElementById(
            "nombreAdministrador"
        );


    if (nombreAdministrador) {

        nombreAdministrador.textContent =
            `Bienvenido, ${perfil.nombre}`;

    }


    return perfil;
}


// =========================================================
// ESCAPAR HTML
// =========================================================

function escapeHTML(text) {

    return String(
        text ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// =========================================================
// USUARIOS
// =========================================================
async function cargarUsuarios() {

    const tabla =
        document.getElementById(
            "tablaUsuarios"
        );


    if (!tabla) {
        return;
    }


    // =====================================================
    // CARGAR USUARIOS
    // =====================================================

    const {
        data,
        error
    } =
        await supabaseClient

            .from("perfiles")

            .select(`
                id,
                usuario,
                nombre,
                rol,
                activo,
                eliminado,
                es_superadmin
            `)

            .eq(
                "eliminado",
                false
            )

            .order(
                "nombre"
            );


    if (error) {

        console.error(
            "Error cargando usuarios:",
            error
        );


        tabla.innerHTML = `

            <tr>
                <td colspan="5">
                    Error al cargar usuarios.
                </td>
            </tr>

        `;

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        tabla.innerHTML = `

            <tr>
                <td colspan="5">
                    No existen usuarios.
                </td>
            </tr>

        `;

        return;
    }


    // =====================================================
    // GENERAR TABLA
    // =====================================================

    tabla.innerHTML =
        data.map(
            usuario => {

                // =================================================
                // ESTADO
                // =================================================

                const estado =
                    usuario.activo

                        ? `
                            <span class="badge-activo">
                                Activo
                            </span>
                        `

                        : `
                            <span class="badge-inactivo">
                                Desactivado
                            </span>
                        `;


                // =================================================
                // ROL VISIBLE
                // =================================================

                const rolVisible =
                    usuario.es_superadmin === true

                        ? `
                            <span class="badge-superadmin">
                                🔒 SUPERADMIN
                            </span>
                        `

                        : escapeHTML(
                            usuario.rol
                        );


                // =================================================
                // ACCIONES
                // =================================================

                let acciones = "";


                // -------------------------------------------------
                // SUPERADMIN
                // -------------------------------------------------

                if (
                    usuario.es_superadmin === true
                ) {

                    acciones = `

                        <div class="acciones-usuario">

                            <span class="cuenta-protegida">
                                🔒 Cuenta protegida
                            </span>

                        </div>

                    `;

                }


                // -------------------------------------------------
                // USUARIO NORMAL / ADMINISTRADOR
                // -------------------------------------------------

                else {

                    acciones = `

                        <div class="acciones-usuario">

                            <button
                                type="button"
                                class="btn-editar-usuario"

                                data-id="${usuario.id}"

                                data-usuario="${escapeHTML(
                                    usuario.usuario
                                )}"

                                data-nombre="${escapeHTML(
                                    usuario.nombre
                                )}"

                                data-rol="${escapeHTML(
                                    usuario.rol
                                )}"

                                data-activo="${usuario.activo}"
                            >
                                ✏️ Editar
                            </button>


                            <button
                                type="button"
                                class="btn-eliminar-usuario"

                                data-id="${usuario.id}"

                                data-nombre="${escapeHTML(
                                    usuario.nombre ||
                                    usuario.usuario
                                )}"
                            >
                                🗑️ Eliminar
                            </button>

                        </div>

                    `;

                }


                // =================================================
                // FILA
                // =================================================

                return `

                    <tr>

                        <td>

                            ${escapeHTML(
                                usuario.usuario
                            )}

                        </td>


                        <td>

                            ${escapeHTML(
                                usuario.nombre
                            )}

                        </td>


                        <td>

                            ${rolVisible}

                        </td>


                        <td>

                            ${estado}

                        </td>


                        <td>

                            ${acciones}

                        </td>

                    </tr>

                `;

            }
        )
        .join("");


    // =====================================================
    // BOTONES EDITAR
    // =====================================================

    document
        .querySelectorAll(
            ".btn-editar-usuario"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        abrirEditarUsuario(
                            button.dataset
                        );

                    }
                );

            }
        );


    // =====================================================
    // BOTONES ELIMINAR
    // =====================================================

    document
        .querySelectorAll(
            ".btn-eliminar-usuario"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        eliminarUsuario(

                            button.dataset.id,

                            button.dataset.nombre

                        );

                    }
                );

            }
        );
}

// =========================================================
// ABRIR EDITAR USUARIO
// =========================================================

function abrirEditarUsuario(
    usuario
) {

    document.getElementById(
        "editarUsuarioId"
    ).value =
        usuario.id;


    document.getElementById(
        "editarNombre"
    ).value =
        usuario.nombre || "";


    document.getElementById(
        "editarUsuario"
    ).value =
        usuario.usuario || "";


    document.getElementById(
        "editarRol"
    ).value =
        usuario.rol || "docente";


    document.getElementById(
        "editarEstado"
    ).value =
        String(
            usuario.activo === "true"
        );


    document.getElementById(
        "editarPassword"
    ).value =
        "";


    document.getElementById(
        "mensajeEditarUsuario"
    ).textContent =
        "";


    document
        .getElementById(
            "modalEditarUsuario"
        )
        ?.classList
        .add(
            "active"
        );
}


// =========================================================
// GUARDAR EDICIÓN USUARIO
// =========================================================

const formEditarUsuario =
    document.getElementById(
        "formEditarUsuario"
    );


formEditarUsuario
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const mensaje =
                document.getElementById(
                    "mensajeEditarUsuario"
                );


            mensaje.textContent =
                "Guardando cambios...";


            const {
                data: { session }
            } =
                await supabaseClient
                    .auth
                    .getSession();


            if (!session) {

                mensaje.textContent =
                    "Sesión expirada.";

                return;
            }


            const payload = {

                id:
                    document
                        .getElementById(
                            "editarUsuarioId"
                        )
                        .value,

                nombre:
                    document
                        .getElementById(
                            "editarNombre"
                        )
                        .value
                        .trim(),

                usuario:
                    document
                        .getElementById(
                            "editarUsuario"
                        )
                        .value
                        .trim()
                        .toLowerCase(),

                rol:
                    document
                        .getElementById(
                            "editarRol"
                        )
                        .value,

                activo:
                    document
                        .getElementById(
                            "editarEstado"
                        )
                        .value === "true",

                password:
                    document
                        .getElementById(
                            "editarPassword"
                        )
                        .value

            };


            try {

                const respuesta =
                    await fetch(

                        `${SUPABASE_URL}/functions/v1/editar-usuario`,

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${session.access_token}`

                            },

                            body:
                                JSON.stringify(
                                    payload
                                )

                        }

                    );


                const resultado =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mensaje.textContent =
                        resultado.error ||
                        "No se pudo editar.";

                    return;
                }


                mensaje.textContent =
                    "Usuario actualizado correctamente.";


                await cargarUsuarios();


                setTimeout(
                    () => {

                        document
                            .getElementById(
                                "modalEditarUsuario"
                            )
                            ?.classList
                            .remove(
                                "active"
                            );

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "Error editando usuario:",
                    error
                );


                mensaje.textContent =
                    "Error de conexión.";
            }

        }
    );


// =========================================================
// ELIMINAR USUARIO
// =========================================================

async function eliminarUsuario(
    id,
    nombre
) {

    if (
        !confirm(
            `¿Desea eliminar al usuario "${nombre}"?`
        )
    ) {

        return;
    }


    const {
        data: { session }
    } =
        await supabaseClient
            .auth
            .getSession();


    if (!session) {

        alert(
            "Sesión expirada."
        );

        return;
    }


    try {

        const respuesta =
            await fetch(

                `${SUPABASE_URL}/functions/v1/eliminar-usuario`,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${session.access_token}`

                    },

                    body:
                        JSON.stringify({
                            id
                        })

                }

            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            alert(
                resultado.error ||
                "No se pudo eliminar."
            );

            return;
        }


        await cargarUsuarios();


    } catch (error) {

        console.error(
            "Error eliminando usuario:",
            error
        );


        alert(
            "Error de conexión."
        );
    }
}


// =========================================================
// MAQUETAS
// =========================================================

async function cargarMaquetas() {

    const contenedor =
        document.getElementById(
            "tablaMaquetas"
        );


    if (!contenedor) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient

            .from("maquetas")

            .select("*")

            .order(
                "id"
            );


    if (error) {

        console.error(
            "Error cargando maquetas:",
            error
        );


        contenedor.innerHTML = `

            <div class="loading-card">
                Error al cargar las maquetas.
            </div>

        `;

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        contenedor.innerHTML = `

            <div class="loading-card">
                No existen maquetas registradas.
            </div>

        `;

        return;
    }


    contenedor.innerHTML =
        data.map(
            maqueta => {

                const estado =
                    maqueta.disponible

                        ? `
                            <span class="estado-disponible">
                                🟢 Disponible
                            </span>
                        `

                        : `
                            <span class="estado-no-disponible">
                                🔴 No disponible
                            </span>
                        `;


                const botonEstado =
                    maqueta.disponible

                        ? `
                            <button
                                class="btn-desactivar-maqueta"

                                data-id="${maqueta.id}"

                                data-nombre="${escapeHTML(
                                    maqueta.nombre
                                )}"
                            >
                                🔴 No disponible
                            </button>
                        `

                        : `
                            <button
                                class="btn-activar-maqueta"

                                data-id="${maqueta.id}"

                                data-nombre="${escapeHTML(
                                    maqueta.nombre
                                )}"
                            >
                                🟢 Habilitar
                            </button>
                        `;


                return `

                    <div class="maqueta-card">

                        <div class="maqueta-card-header">

                            <div>

                                <div class="maqueta-codigo">

                                    ${escapeHTML(
                                        maqueta.codigo ||
                                        "SIN CÓDIGO"
                                    )}

                                </div>


                                <h3>

                                    ${escapeHTML(
                                        maqueta.nombre
                                    )}

                                </h3>

                            </div>


                            ${estado}

                        </div>


                        <div class="maqueta-descripcion">

                            ${escapeHTML(
                                maqueta.descripcion ||
                                "Sin descripción."
                            )}

                        </div>


                        <div class="maqueta-acciones">

                            <button
                                class="btn-editar-maqueta"

                                data-id="${maqueta.id}"

                                data-codigo="${escapeHTML(
                                    maqueta.codigo || ""
                                )}"

                                data-nombre="${escapeHTML(
                                    maqueta.nombre
                                )}"

                                data-descripcion="${escapeHTML(
                                    maqueta.descripcion || ""
                                )}"
                            >
                                ✏️ Editar
                            </button>


                            ${botonEstado}

                        </div>

                    </div>

                `;

            }
        )
        .join("");


    // =====================================================
    // EDITAR
    // =====================================================

    document
        .querySelectorAll(
            ".btn-editar-maqueta"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        abrirEditarMaqueta(

                            button.dataset.id,

                            button.dataset.codigo,

                            button.dataset.nombre,

                            button.dataset.descripcion

                        );

                    }
                );

            }
        );


    // =====================================================
    // DESACTIVAR
    // =====================================================

    document
        .querySelectorAll(
            ".btn-desactivar-maqueta"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        cambiarEstadoMaqueta(

                            button.dataset.id,

                            false,

                            button.dataset.nombre

                        );

                    }
                );

            }
        );


    // =====================================================
    // ACTIVAR
    // =====================================================

    document
        .querySelectorAll(
            ".btn-activar-maqueta"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        cambiarEstadoMaqueta(

                            button.dataset.id,

                            true,

                            button.dataset.nombre

                        );

                    }
                );

            }
        );
}


// =========================================================
// ABRIR EDITAR MAQUETA
// =========================================================

function abrirEditarMaqueta(
    id,
    codigo,
    nombre,
    descripcion
) {

    const modal =
        document.getElementById(
            "modalMaqueta"
        );


    const form =
        document.getElementById(
            "formMaqueta"
        );


    if (
        !modal ||
        !form
    ) {

        return;
    }


    form.dataset.editandoId =
        id;


    document.getElementById(
        "codigoMaqueta"
    ).value =
        codigo || "";


    document.getElementById(
        "nombreMaqueta"
    ).value =
        nombre || "";


    document.getElementById(
        "descripcionMaqueta"
    ).value =
        descripcion || "";


    const titulo =
        modal.querySelector(
            ".modal-header h2"
        );


    if (titulo) {

        titulo.textContent =
            "Editar maqueta";

    }


    const boton =
        form.querySelector(
            'button[type="submit"]'
        );


    if (boton) {

        boton.textContent =
            "Guardar cambios";

    }


    document.getElementById(
        "mensajeMaqueta"
    ).textContent =
        "";


    modal.classList.add(
        "active"
    );
}


// =========================================================
// CAMBIAR ESTADO MAQUETA
// =========================================================

async function cambiarEstadoMaqueta(
    id,
    disponible,
    nombre
) {

    const accion =
        disponible
            ? "habilitar"
            : "deshabilitar";


    if (
        !confirm(
            `¿Deseas ${accion} "${nombre}"?`
        )
    ) {

        return;
    }


    try {

        const {
            data: { session }
        } =
            await supabaseClient
                .auth
                .getSession();


        if (!session) {

            alert(
                "La sesión ha expirado."
            );


            window.location.href =
                "index.html";


            return;
        }


        const respuesta =
            await fetch(

                `${SUPABASE_URL}/functions/v1/cambiar-estado-maqueta`,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${session.access_token}`

                    },


                    body:
                        JSON.stringify({

                            id:
                                Number(id),

                            disponible

                        })

                }

            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            alert(
                resultado.error ||
                "No se pudo cambiar el estado."
            );

            return;
        }


        await cargarMaquetas();


    } catch (error) {

        console.error(
            "Error cambiando estado:",
            error
        );


        alert(
            "Error de conexión."
        );
    }
}


// =========================================================
// CREAR / EDITAR MAQUETA
// =========================================================

const formMaqueta =
    document.getElementById(
        "formMaqueta"
    );


if (formMaqueta) {

    formMaqueta.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const idEditando =
                formMaqueta
                    .dataset
                    .editandoId;


            const codigo =
                document
                    .getElementById(
                        "codigoMaqueta"
                    )
                    .value
                    .trim();


            const nombre =
                document
                    .getElementById(
                        "nombreMaqueta"
                    )
                    .value
                    .trim();


            const descripcion =
                document
                    .getElementById(
                        "descripcionMaqueta"
                    )
                    .value
                    .trim();


            const mensaje =
                document.getElementById(
                    "mensajeMaqueta"
                );


            mensaje.textContent =
                "Guardando...";


            try {

                const {
                    data: { session }
                } =
                    await supabaseClient
                        .auth
                        .getSession();


                if (!session) {

                    mensaje.textContent =
                        "Sesión expirada.";

                    return;
                }


                const funcion =
                    idEditando

                        ? "editar-maqueta"

                        : "crear-maqueta";


                const datos =
                    idEditando

                        ? {

                            id:
                                Number(
                                    idEditando
                                ),

                            codigo,

                            nombre,

                            descripcion

                        }

                        : {

                            codigo,

                            nombre,

                            descripcion

                        };


                const respuesta =
                    await fetch(

                        `${SUPABASE_URL}/functions/v1/${funcion}`,

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${session.access_token}`

                            },

                            body:
                                JSON.stringify(
                                    datos
                                )

                        }

                    );


                const resultado =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mensaje.textContent =
                        resultado.error ||
                        "No se pudo guardar.";

                    return;
                }


                mensaje.textContent =
                    "Guardado correctamente.";


                formMaqueta.reset();


                delete formMaqueta
                    .dataset
                    .editandoId;


                await cargarMaquetas();


                setTimeout(
                    () => {

                        document
                            .getElementById(
                                "modalMaqueta"
                            )
                            ?.classList
                            .remove(
                                "active"
                            );

                    },
                    800
                );


            } catch (error) {

                console.error(
                    "Error guardando maqueta:",
                    error
                );


                mensaje.textContent =
                    "Error de conexión.";
            }

        }
    );
}


// =========================================================
// CREAR USUARIO
// =========================================================

const formUsuario =
    document.getElementById(
        "formUsuario"
    );


if (formUsuario) {

    formUsuario.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const nombre =
                document
                    .getElementById(
                        "nuevoNombre"
                    )
                    .value
                    .trim();


            const usuario =
                document
                    .getElementById(
                        "nuevoUsuario"
                    )
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                document
                    .getElementById(
                        "nuevaPassword"
                    )
                    .value;


            const rol =
                document
                    .getElementById(
                        "nuevoRol"
                    )
                    .value;


            const mensaje =
                document.getElementById(
                    "mensajeUsuario"
                );


            mensaje.textContent =
                "Creando usuario...";


            try {

                const {
                    data: { session }
                } =
                    await supabaseClient
                        .auth
                        .getSession();


                if (!session) {

                    mensaje.textContent =
                        "Sesión expirada.";

                    return;
                }


                const respuesta =
                    await fetch(

                        `${SUPABASE_URL}/functions/v1/crear-usuario`,

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${session.access_token}`

                            },


                            body:
                                JSON.stringify({

                                    nombre,

                                    usuario,

                                    password,

                                    rol

                                })

                        }

                    );


                const resultado =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mensaje.textContent =
                        resultado.error ||
                        "No se pudo crear.";

                    return;
                }


                mensaje.textContent =
                    "Usuario creado correctamente.";


                formUsuario.reset();


                await cargarUsuarios();


                setTimeout(
                    () => {

                        document
                            .getElementById(
                                "modalUsuario"
                            )
                            ?.classList
                            .remove(
                                "active"
                            );

                    },
                    800
                );


            } catch (error) {

                console.error(
                    "Error creando usuario:",
                    error
                );


                mensaje.textContent =
                    "Error de conexión.";
            }

        }
    );
}


// =========================================================
// BOTONES NUEVO
// =========================================================

document
    .getElementById(
        "btnNuevoUsuario"
    )
    ?.addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "modalUsuario"
                )
                ?.classList
                .add(
                    "active"
                );

        }
    );


document
    .getElementById(
        "btnNuevaMaqueta"
    )
    ?.addEventListener(
        "click",
        () => {

            const form =
                document.getElementById(
                    "formMaqueta"
                );


            if (form) {

                form.reset();

                delete form
                    .dataset
                    .editandoId;

            }


            document
                .getElementById(
                    "modalMaqueta"
                )
                ?.classList
                .add(
                    "active"
                );

        }
    );


// =========================================================
// CERRAR MODALES
// =========================================================

document
    .querySelectorAll(
        ".btnCerrarModal"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .getElementById(
                            button.dataset.modal
                        )
                        ?.classList
                        .remove(
                            "active"
                        );

                }
            );

        }
    );


// =========================================================
// CERRAR SESIÓN
// =========================================================

document
    .getElementById(
        "btnCerrarSesion"
    )
    ?.addEventListener(
        "click",
        async () => {

            await supabaseClient
                .auth
                .signOut();


            window.location.href =
                "index.html";

        }
    );


// =========================================================
// FUNCIONES DE FECHA
// =========================================================

function obtenerLunesAdmin(
    fecha
) {

    const resultado =
        new Date(
            fecha.getFullYear(),
            fecha.getMonth(),
            fecha.getDate()
        );


    const dia =
        resultado.getDay();


    resultado.setDate(

        resultado.getDate() +

        (
            dia === 0
                ? -6
                : 1 - dia
        )

    );


    resultado.setHours(
        0,
        0,
        0,
        0
    );


    return resultado;
}


function sumarDiasAdmin(
    fecha,
    dias
) {

    const resultado =
        new Date(fecha);


    resultado.setDate(
        resultado.getDate() +
        dias
    );


    return resultado;
}


function fechaLocalISOAdmin(
    fecha
) {

    const anio =
        fecha.getFullYear();


    const mes =
        String(
            fecha.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        );


    const dia =
        String(
            fecha.getDate()
        )
        .padStart(
            2,
            "0"
        );


    return `${anio}-${mes}-${dia}`;
}


function formatearFechaAdmin(
    fecha
) {

    return fecha.toLocaleDateString(
        "es-BO",
        {

            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric"

        }
    );
}


// =========================================================
// ENCABEZADOS SEMANA
// =========================================================

function actualizarEncabezadosAdmin(
    lunes
) {

    const tabla =
        document.getElementById(
            "tablaSemanaAdmin"
        );


    if (!tabla) {
        return;
    }


    const encabezados =
        tabla.querySelectorAll(
            "thead th"
        );


    const nombres = [

        "LUNES",

        "MARTES",

        "MIÉRCOLES",

        "JUEVES",

        "VIERNES"

    ];


    for (
        let i = 0;
        i < 5;
        i++
    ) {

        const fecha =
            sumarDiasAdmin(
                lunes,
                i
            );


        if (
            encabezados[
                i + 1
            ]
        ) {

            encabezados[
                i + 1
            ].innerHTML = `

                ${nombres[i]}

                <br>

                <small>
                    ${formatearFechaAdmin(fecha)}
                </small>

            `;

        }
    }
}


// =========================================================
// CARGAR RESERVAS SEMANALES
// =========================================================

async function cargarReservasAdmin() {

    const tabla =
        document.getElementById(
            "tablaSemanaAdmin"
        );


    const textoSemana =
        document.getElementById(
            "textoSemanaAdmin"
        );


    if (
        !tabla ||
        !textoSemana
    ) {

        return;
    }


    const lunes =
        new Date(
            inicioSemanaAdmin
        );


    const viernes =
        sumarDiasAdmin(
            lunes,
            4
        );


    textoSemana.textContent =
        `${formatearFechaAdmin(lunes)} al ${formatearFechaAdmin(viernes)}`;


    actualizarEncabezadosAdmin(
        lunes
    );


    const fechaInicio =
        fechaLocalISOAdmin(
            lunes
        );


    const fechaFin =
        fechaLocalISOAdmin(
            viernes
        );


    const tbody =
        tabla.querySelector(
            "tbody"
        );


    tbody.innerHTML = `

        <tr>

            <td colspan="6">
                Cargando reservas...
            </td>

        </tr>

    `;


    try {

        // =================================================
        // RESERVAS
        // =================================================

        const {
            data: reservas,
            error
        } =
            await supabaseClient

                .from("reservas")

                .select(`
                    id,
                    usuario_id,
                    grupo,
                    fecha,
                    horario,
                    maqueta_id,
                    maqueta_id_2,
                    maqueta_id_3,
                    area_codigo,
                    titulo_tema,
                    estado
                `)

                .gte(
                    "fecha",
                    fechaInicio
                )

                .lte(
                    "fecha",
                    fechaFin
                )

                .eq(
                    "estado",
                    "activa"
                )

                .order(
                    "fecha"
                );


        if (error) {

            console.error(
                "Error cargando reservas:",
                error
            );


            tbody.innerHTML = `

                <tr>
                    <td colspan="6">
                        Error al cargar.
                    </td>
                </tr>

            `;


            return;
        }


        const listaReservas =
            reservas || [];


        // =================================================
        // IDS DE DOCENTES
        // =================================================

        const idsUsuarios =
            [
                ...new Set(

                    listaReservas

                        .map(
                            reserva =>
                                reserva.usuario_id
                        )

                        .filter(
                            Boolean
                        )

                )
            ];


        // =================================================
        // IDS DE TODAS LAS MAQUETAS
        // =================================================

        const idsMaquetas =
            [
                ...new Set(

                    listaReservas

                        .flatMap(
                            reserva => [

                                reserva.maqueta_id,

                                reserva.maqueta_id_2,

                                reserva.maqueta_id_3

                            ]
                        )

                        .filter(
                            Boolean
                        )

                )
            ];


        let perfiles = [];

        let maquetas = [];


        // =================================================
        // CARGAR DOCENTES
        // =================================================

        if (
            idsUsuarios.length > 0
        ) {

            const {
                data,
                error: errorPerfiles
            } =
                await supabaseClient

                    .from("perfiles")

                    .select(
                        "id, nombre, usuario"
                    )

                    .in(
                        "id",
                        idsUsuarios
                    );


            if (errorPerfiles) {

                console.error(
                    "Error cargando docentes:",
                    errorPerfiles
                );

            } else {

                perfiles =
                    data || [];

            }
        }


        // =================================================
        // CARGAR MAQUETAS
        // =================================================

        if (
            idsMaquetas.length > 0
        ) {

            const {
                data,
                error: errorMaquetas
            } =
                await supabaseClient

                    .from("maquetas")

                    .select(
                        "id, codigo, nombre"
                    )

                    .in(
                        "id",
                        idsMaquetas
                    );


            if (errorMaquetas) {

                console.error(
                    "Error cargando nombres de maquetas:",
                    errorMaquetas
                );

            } else {

                maquetas =
                    data || [];

            }
        }


        // =================================================
        // MAPA DOCENTES
        // =================================================

        const mapaPerfiles =
            new Map();


        perfiles.forEach(
            perfil => {

                mapaPerfiles.set(

                    perfil.id,

                    perfil.nombre ||
                    perfil.usuario ||
                    "Docente"

                );

            }
        );


        // =================================================
        // MAPA MAQUETAS
        // =================================================

        const mapaMaquetas =
            new Map();


        maquetas.forEach(
            maqueta => {

                const codigo =
                    maqueta.codigo

                        ? `${maqueta.codigo} - `

                        : "";


                mapaMaquetas.set(

                    String(
                        maqueta.id
                    ),

                    `${codigo}${maqueta.nombre}`

                );

            }
        );


        // =================================================
        // DATOS PARA PDF
        // =================================================

        reservasSemanaPDF =
            listaReservas;


        mapaPerfilesPDF =
            mapaPerfiles;


        mapaMaquetasPDF =
            mapaMaquetas;


        // =================================================
        // DIBUJAR TABLA
        // =================================================

        renderizarTablaAdmin(

            listaReservas,

            mapaPerfiles,

            mapaMaquetas,

            lunes

        );


    } catch (error) {

        console.error(
            "Error inesperado cargando reservas:",
            error
        );


        tbody.innerHTML = `

            <tr>

                <td colspan="6">
                    Error inesperado.
                </td>

            </tr>

        `;
    }
}


// =========================================================
// OBTENER NOMBRES DE LAS MAQUETAS DE UNA RESERVA
// =========================================================

function obtenerNombresMaquetas(
    reserva,
    mapaMaquetas
) {

    const ids =
        [

            reserva.maqueta_id,

            reserva.maqueta_id_2,

            reserva.maqueta_id_3

        ]
        .filter(
            Boolean
        );


    return ids.map(
        id =>

            mapaMaquetas.get(
                String(id)
            ) ||
            "Maqueta"

    );
}


// =========================================================
// RENDERIZAR TABLA
// =========================================================

function renderizarTablaAdmin(
    reservas,
    mapaPerfiles,
    mapaMaquetas,
    lunes
) {

    const tabla =
        document.getElementById(
            "tablaSemanaAdmin"
        );


    if (!tabla) {
        return;
    }


    const tbody =
        tabla.querySelector(
            "tbody"
        );


    const horarios = [

        "09:00-12:00",

        "14:00-17:00",

        "19:00-21:30"

    ];


    const visibles = {

        "09:00-12:00":
            "09:00 - 12:00",

        "14:00-17:00":
            "14:00 - 17:00",

        "19:00-21:30":
            "19:00 - 21:30"

    };


    tbody.innerHTML =
        "";


    horarios.forEach(
        horario => {

            const fila =
                document.createElement(
                    "tr"
                );


            const th =
                document.createElement(
                    "th"
                );


            th.textContent =
                visibles[
                    horario
                ];


            fila.appendChild(
                th
            );


            for (
                let dia = 0;
                dia < 5;
                dia++
            ) {

                const fecha =
                    sumarDiasAdmin(
                        lunes,
                        dia
                    );


                const fechaISO =
                    fechaLocalISOAdmin(
                        fecha
                    );


                const celda =
                    document.createElement(
                        "td"
                    );


                const lista =
                    reservas.filter(
                        reserva =>

                            reserva.fecha ===
                                fechaISO &&

                            reserva.horario ===
                                horario
                    );


                // =================================================
                // SIN RESERVAS
                // =================================================

                if (
                    lista.length === 0
                ) {

                    celda.innerHTML = `

                        <span class="reserva-libre">
                            Sin reservas
                        </span>

                    `;

                }


                // =================================================
                // CON RESERVAS
                // =================================================

                else {

                    lista.forEach(
                        reserva => {

                            const tarjeta =
                                document.createElement(
                                    "div"
                                );


                            tarjeta.className =
                                "reserva-card";


                            const docente =
                                mapaPerfiles.get(
                                    reserva.usuario_id
                                ) ||
                                "Docente";


                            const nombresMaquetas =
                                obtenerNombresMaquetas(

                                    reserva,

                                    mapaMaquetas

                                );


                            const listaMaquetasHTML =
                                nombresMaquetas

                                    .map(
                                        (
                                            nombre,
                                            indice
                                        ) => `

                                            <strong
                                                class="maqueta-reservada-item"
                                            >

                                                🔧 ${indice + 1}.
                                                ${escapeHTML(nombre)}

                                            </strong>

                                        `
                                    )

                                    .join("");


                            tarjeta.innerHTML = `

                                <div
                                    class="lista-maquetas-reserva"
                                >

                                    ${listaMaquetasHTML}

                                </div>


                                <span>

                                    👤
                                    ${escapeHTML(
                                        docente
                                    )}

                                </span>


                                <span>

                                    👥 Grupo:
                                    ${escapeHTML(
                                        reserva.grupo ||
                                        "-"
                                    )}

                                </span>


                                <span>

                                    📍 Área:
                                    ${escapeHTML(
                                        reserva.area_codigo ||
                                        "-"
                                    )}

                                </span>


                                <span
                                    class="reserva-tema-admin"
                                >

                                    📚 Tema:

                                    ${escapeHTML(
                                        reserva.titulo_tema ||
                                        "Sin tema"
                                    )}

                                </span>

                            `;


                            // =================================================
                            // CANCELAR
                            // =================================================

                            const botonCancelar =
                                document.createElement(
                                    "button"
                                );


                            botonCancelar.type =
                                "button";


                            botonCancelar.className =
                                "btn-cancelar-reserva";


                            botonCancelar.textContent =
                                "✖ Cancelar reserva";


                            botonCancelar.addEventListener(
                                "click",
                                () => {

                                    cancelarReservaAdmin(
                                        reserva.id
                                    );

                                }
                            );


                            tarjeta.appendChild(
                                botonCancelar
                            );


                            celda.appendChild(
                                tarjeta
                            );

                        }
                    );
                }


                fila.appendChild(
                    celda
                );
            }


            tbody.appendChild(
                fila
            );

        }
    );
}


// =========================================================
// CANCELAR RESERVA
// =========================================================

async function cancelarReservaAdmin(
    reservaId
) {

    const confirmar =
        confirm(
            "¿Desea cancelar esta reserva? Todas las maquetas seleccionadas y el área volverán a quedar disponibles."
        );


    if (!confirmar) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from("reservas")

                .update({

                    estado:
                        "cancelada",

                    updated_at:
                        new Date()
                            .toISOString()

                })

                .eq(
                    "id",
                    reservaId
                )

                .eq(
                    "estado",
                    "activa"
                )

                .select("id");


        if (error) {

            throw error;
        }


        if (
            !data ||
            data.length === 0
        ) {

            alert(
                "No se pudo cancelar o ya estaba cancelada."
            );

            return;
        }


        await cargarReservasAdmin();


    } catch (error) {

        console.error(
            "Error cancelando reserva:",
            error
        );


        alert(
            "No fue posible cancelar la reserva."
        );
    }
}


// =========================================================
// SEMANA ANTERIOR
// =========================================================

document
    .getElementById(
        "btnSemanaAnteriorAdmin"
    )
    ?.addEventListener(
        "click",
        async () => {

            inicioSemanaAdmin =
                sumarDiasAdmin(
                    inicioSemanaAdmin,
                    -7
                );


            await cargarReservasAdmin();

        }
    );


// =========================================================
// SEMANA ACTUAL
// =========================================================

document
    .getElementById(
        "btnSemanaActualAdmin"
    )
    ?.addEventListener(
        "click",
        async () => {

            inicioSemanaAdmin =
                obtenerLunesAdmin(
                    new Date()
                );


            await cargarReservasAdmin();

        }
    );


// =========================================================
// SEMANA SIGUIENTE
// =========================================================

document
    .getElementById(
        "btnSemanaSiguienteAdmin"
    )
    ?.addEventListener(
        "click",
        async () => {

            inicioSemanaAdmin =
                sumarDiasAdmin(
                    inicioSemanaAdmin,
                    7
                );


            await cargarReservasAdmin();

        }
    );


// =========================================================
// CARGAR IMAGEN COMO DATA URL
// =========================================================

async function cargarImagenDataURL(
    ruta
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const img =
                new Image();


            img.crossOrigin =
                "anonymous";


            img.onload =
                () => {

                    try {

                        const canvas =
                            document.createElement(
                                "canvas"
                            );


                        canvas.width =
                            img.naturalWidth;


                        canvas.height =
                            img.naturalHeight;


                        const ctx =
                            canvas.getContext(
                                "2d"
                            );


                        ctx.drawImage(
                            img,
                            0,
                            0
                        );


                        resolve(
                            canvas.toDataURL(
                                "image/png"
                            )
                        );


                    } catch (error) {

                        reject(
                            error
                        );
                    }

                };


            img.onerror =
                reject;


            img.src =
                `${ruta}?v=${Date.now()}`;

        }
    );
}


// =========================================================
// BOTÓN PDF
// =========================================================

document
    .getElementById(
        "btnDescargarPDF"
    )
    ?.addEventListener(
        "click",
        descargarTablaPDF
    );


// =========================================================
// DESCARGAR PDF
// =========================================================

async function descargarTablaPDF() {

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        alert(
            "No se pudo cargar el generador PDF."
        );

        return;
    }


    const {
        jsPDF
    } =
        window.jspdf;


    const doc =
        new jsPDF({

            orientation:
                "landscape",

            unit:
                "mm",

            format:
                "a4"

        });


    const lunes =
        new Date(
            inicioSemanaAdmin
        );


    const viernes =
        sumarDiasAdmin(
            lunes,
            4
        );


    // =====================================================
    // LOGO
    // =====================================================

    try {

        const logo =
            await cargarImagenDataURL(
                "img/logo-ceta-transparente.png"
            );


        doc.addImage(

            logo,

            "PNG",

            12,

            8,

            25,

            25

        );


    } catch (error) {

        console.warn(
            "No se pudo incluir el logo en el PDF.",
            error
        );
    }


    // =====================================================
    // CABECERA
    // =====================================================

    doc.setFontSize(
        18
    );


    doc.text(

        "INSTITUTO CETA",

        148,

        14,

        {
            align:
                "center"
        }

    );


    doc.setFontSize(
        14
    );


    doc.text(

        "Sistema de Reserva de Maquetas",

        148,

        21,

        {
            align:
                "center"
        }

    );


    doc.setFontSize(
        10
    );


    doc.text(

        "Reporte semanal de reservas",

        148,

        27,

        {
            align:
                "center"
        }

    );


    doc.text(

        `Semana: ${formatearFechaAdmin(lunes)} al ${formatearFechaAdmin(viernes)}`,

        148,

        32,

        {
            align:
                "center"
        }

    );


    // =====================================================
    // DÍAS
    // =====================================================

    const dias = [

        "LUNES",

        "MARTES",

        "MIÉRCOLES",

        "JUEVES",

        "VIERNES"

    ];


    const fechasDias =
        dias.map(
            (
                _,
                indice
            ) =>

                sumarDiasAdmin(
                    lunes,
                    indice
                )
        );


    // =====================================================
    // HORARIOS
    // =====================================================

    const horarios = [

        "09:00-12:00",

        "14:00-17:00",

        "19:00-21:30"

    ];


    const horariosVisibles = {

        "09:00-12:00":
            "09:00 - 12:00",

        "14:00-17:00":
            "14:00 - 17:00",

        "19:00-21:30":
            "19:00 - 21:30"

    };


    // =====================================================
    // ENCABEZADO TABLA PDF
    // =====================================================

    const head = [[

        "Horario",

        ...fechasDias.map(
            (
                fecha,
                indice
            ) =>

                `${dias[indice]}\n${formatearFechaAdmin(fecha)}`
        )

    ]];


    // =====================================================
    // CONTENIDO TABLA PDF
    // =====================================================

    const body =
        horarios.map(
            horario => {

                const fila = [

                    horariosVisibles[
                        horario
                    ]

                ];


                fechasDias.forEach(
                    fecha => {

                        const fechaISO =
                            fechaLocalISOAdmin(
                                fecha
                            );


                        const reservas =
                            reservasSemanaPDF
                                .filter(
                                    reserva =>

                                        reserva.fecha ===
                                            fechaISO &&

                                        reserva.horario ===
                                            horario
                                );


                        // =================================================
                        // SIN RESERVAS
                        // =================================================

                        if (
                            reservas.length === 0
                        ) {

                            fila.push(
                                "Sin reservas"
                            );

                            return;
                        }


                        // =================================================
                        // RESERVAS DE LA CELDA
                        // =================================================

                        const contenido =
                            reservas

                                .map(
                                    reserva => {

                                        const docente =
                                            mapaPerfilesPDF.get(
                                                reserva.usuario_id
                                            ) ||
                                            "Docente";


                                        const nombresMaquetas =
                                            obtenerNombresMaquetas(

                                                reserva,

                                                mapaMaquetasPDF

                                            );


                                        const textoMaquetas =
                                            nombresMaquetas

                                                .map(
                                                    (
                                                        nombre,
                                                        indice
                                                    ) =>

                                                        `Maqueta ${indice + 1}: ${nombre}`
                                                )

                                                .join(
                                                    "\n"
                                                );


                                        return [

                                            textoMaquetas,

                                            `Docente: ${docente}`,

                                            `Grupo: ${reserva.grupo || "-"}`,

                                            `Área: ${reserva.area_codigo || "-"}`,

                                            `Tema: ${reserva.titulo_tema || "Sin tema"}`

                                        ]
                                        .join(
                                            "\n"
                                        );

                                    }
                                )

                                .join(
                                    "\n\n"
                                );


                        fila.push(
                            contenido
                        );

                    }
                );


                return fila;

            }
        );


    // =====================================================
    // GENERAR TABLA
    // =====================================================

    doc.autoTable({

        head,

        body,

        startY:
            39,

        theme:
            "grid",

        styles: {

            fontSize:
                7,

            cellPadding:
                2,

            valign:
                "top",

            overflow:
                "linebreak"

        },

        headStyles: {

            halign:
                "center",

            fontStyle:
                "bold"

        },

        columnStyles: {

            0: {

                cellWidth:
                    25,

                halign:
                    "center",

                fontStyle:
                    "bold"

            }

        },

        margin: {

            left:
                8,

            right:
                8

        }

    });


    // =====================================================
    // FOOTER PDF
    // =====================================================

    const paginas =
        doc.internal
            .getNumberOfPages();


    for (
        let pagina = 1;
        pagina <= paginas;
        pagina++
    ) {

        doc.setPage(
            pagina
        );


        const altura =
            doc.internal
                .pageSize
                .height;


        doc.setFontSize(
            8
        );


        doc.text(

            "Desarrollado por Andres Vega",

            10,

            altura - 6

        );


        doc.text(

            `Página ${pagina} de ${paginas}`,

            287,

            altura - 6,

            {
                align:
                    "right"
            }

        );
    }


    // =====================================================
    // NOMBRE ARCHIVO
    // =====================================================

    const archivo =

        `CETA_Reservas_${fechaLocalISOAdmin(lunes)}_${fechaLocalISOAdmin(viernes)}.pdf`;


    doc.save(
        archivo
    );
}


// =========================================================
// INICIAR PANEL
// =========================================================

(async () => {

    console.log(
        "Iniciando panel administrador..."
    );


    const perfil =
        await comprobarAdministrador();


    if (!perfil) {
        return;
    }


    await cargarUsuarios();

    await cargarMaquetas();

    await cargarReservasAdmin();


    console.log(
        "Panel administrador iniciado correctamente."
    );

})();
