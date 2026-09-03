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


    tabla.innerHTML =
        data.map(
            usuario => {

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


                let acciones =
                    "";


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

                } else {

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
                "codigo",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error cargando maquetas:",
            error
        );


        contenedor.innerHTML = `

            <div class="loading-card">
                Error al cargar maquetas.
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
                            <span class="badge-activo">
                                Disponible
                            </span>
                        `

                        : `
                            <span class="badge-inactivo">
                                No disponible
                            </span>
                        `;


                return `

                    <div class="maqueta-card">


                        ${
                            maqueta.imagen_url

                                ? `

                                    <div class="maqueta-imagen-admin">

                                        <img
                                            src="${escapeHTML(
                                                maqueta.imagen_url
                                            )}"
                                            alt="${escapeHTML(
                                                maqueta.nombre
                                            )}"
                                            loading="lazy"
                                        >

                                    </div>

                                `

                                : ""
                        }


                        <div class="maqueta-card-header">

                            <div>

                                <span class="maqueta-codigo">

                                    ${
                                        escapeHTML(
                                            maqueta.codigo ||
                                            "Sin código"
                                        )
                                    }

                                </span>


                                <h3>

                                    ${escapeHTML(
                                        maqueta.nombre
                                    )}

                                </h3>

                            </div>


                            ${estado}

                        </div>


                        <p class="maqueta-descripcion">

                            ${
                                escapeHTML(
                                    maqueta.descripcion ||
                                    "Sin descripción."
                                )
                            }

                        </p>


                        <div class="maqueta-actions">

                            <button
                                type="button"
                                class="btn-editar-maqueta"

                                data-id="${maqueta.id}"

                                data-codigo="${escapeHTML(
                                    maqueta.codigo ||
                                    ""
                                )}"

                                data-nombre="${escapeHTML(
                                    maqueta.nombre
                                )}"

                                data-descripcion="${escapeHTML(
                                    maqueta.descripcion ||
                                    ""
                                )}"

                                data-imagen-url="${escapeHTML(
                                    maqueta.imagen_url ||
                                    ""
                                )}"
                            >
                                ✏️ Editar
                            </button>


                            <button
                                type="button"
                                class="btn-disponibilidad-maqueta"

                                data-id="${maqueta.id}"

                                data-disponible="${maqueta.disponible}"
                            >

                                ${
                                    maqueta.disponible

                                        ? "⛔ Desactivar"

                                        : "✅ Activar"
                                }

                            </button>

                        </div>

                    </div>

                `;

            }
        )
        .join("");


    // =====================================================
    // BOTONES EDITAR
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

                            button.dataset.descripcion,

                            button.dataset.imagenUrl

                        );

                    }
                );

            }
        );


    // =====================================================
    // BOTONES DISPONIBILIDAD
    // =====================================================

    document
        .querySelectorAll(
            ".btn-disponibilidad-maqueta"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            Number(
                                button.dataset.id
                            );


                        const disponibleActual =
                            button.dataset
                                .disponible ===
                            "true";


                        await cambiarDisponibilidadMaqueta(

                            id,

                            !disponibleActual

                        );

                    }
                );

            }
        );
}


// =========================================================
// ABRIR EDICIÓN DE MAQUETA
// =========================================================

function abrirEditarMaqueta(
    id,
    codigo,
    nombre,
    descripcion,
    imagenUrl
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


    // Guardar ID que estamos editando

    form.dataset.editandoId =
        id;


    // Guardar imagen actual

    form.dataset.imagenActual =
        imagenUrl || "";


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


    const inputImagen =
        document.getElementById(
            "imagenMaqueta"
        );


    if (inputImagen) {

        inputImagen.value =
            "";

    }


    // =====================================================
    // MOSTRAR IMAGEN ACTUAL
    // =====================================================

    const preview =
        document.getElementById(
            "previewImagenMaqueta"
        );


    const previewImg =
        document.getElementById(
            "previewImagenMaquetaImg"
        );


    if (
        imagenUrl &&
        preview &&
        previewImg
    ) {

        previewImg.src =
            imagenUrl;


        preview.hidden =
            false;

    } else if (preview) {

        preview.hidden =
            true;

    }


    // =====================================================
    // CAMBIAR TÍTULO DEL MODAL
    // =====================================================

    const titulo =
        modal.querySelector(
            ".modal-header h2"
        );


    if (titulo) {

        titulo.textContent =
            "Editar maqueta";

    }


    // =====================================================
    // CAMBIAR TEXTO DEL BOTÓN
    // =====================================================

    const boton =
        form.querySelector(
            'button[type="submit"]'
        );


    if (boton) {

        boton.textContent =
            "Guardar cambios";

    }


    const mensaje =
        document.getElementById(
            "mensajeMaqueta"
        );


    if (mensaje) {

        mensaje.textContent =
            "";

    }


    modal.classList.add(
        "active"
    );
}


// =========================================================
// CAMBIAR DISPONIBILIDAD DE MAQUETA
// =========================================================

async function cambiarDisponibilidadMaqueta(
    id,
    disponible
) {

    const accion =
        disponible

            ? "activar"

            : "desactivar";


    const confirmar =
        confirm(
            `¿Desea ${accion} esta maqueta?`
        );


    if (!confirmar) {

        return;
    }


    const {
        error
    } =
        await supabaseClient

            .from("maquetas")

            .update({

                disponible:
                    disponible

            })

            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Error cambiando disponibilidad:",
            error
        );


        alert(
            "No se pudo cambiar el estado de la maqueta."
        );


        return;
    }


    await cargarMaquetas();
}


// =========================================================
// SUBIR IMAGEN DE MAQUETA
// =========================================================

async function subirImagenMaqueta(
    archivo
) {

    if (!archivo) {

        return null;

    }


    const tiposPermitidos = [

        "image/jpeg",

        "image/png",

        "image/webp"

    ];


    // =====================================================
    // VALIDAR FORMATO
    // =====================================================

    if (
        !tiposPermitidos.includes(
            archivo.type
        )
    ) {

        throw new Error(
            "La imagen debe ser JPG, PNG o WEBP."
        );

    }


    // =====================================================
    // VALIDAR TAMAÑO
    // =====================================================

    const maximoBytes =
        5 * 1024 * 1024;


    if (
        archivo.size >
        maximoBytes
    ) {

        throw new Error(
            "La imagen no puede superar los 5 MB."
        );

    }


    // =====================================================
    // OBTENER EXTENSIÓN
    // =====================================================

    let extension =
        archivo.name
            .split(".")
            .pop()
            ?.toLowerCase();


    if (
        !extension ||
        ![
            "jpg",
            "jpeg",
            "png",
            "webp"
        ].includes(
            extension
        )
    ) {

        if (
            archivo.type ===
            "image/png"
        ) {

            extension =
                "png";

        } else if (
            archivo.type ===
            "image/webp"
        ) {

            extension =
                "webp";

        } else {

            extension =
                "jpg";

        }

    }


    // =====================================================
    // CREAR NOMBRE ÚNICO
    // =====================================================

    const nombreArchivo =
        `maqueta-${Date.now()}-${crypto.randomUUID()}.${extension}`;


    // =====================================================
    // SUBIR AL BUCKET
    // =====================================================

    const {
        error
    } =
        await supabaseClient

            .storage

            .from(
                "maquetas"
            )

            .upload(

                nombreArchivo,

                archivo,

                {

                    cacheControl:
                        "3600",

                    upsert:
                        false

                }

            );


    if (error) {

        console.error(
            "Error subiendo imagen:",
            error
        );


        throw new Error(
            "No se pudo subir la imagen de la maqueta."
        );

    }


    // =====================================================
    // OBTENER URL PÚBLICA
    // =====================================================

    const {
        data
    } =
        supabaseClient

            .storage

            .from(
                "maquetas"
            )

            .getPublicUrl(
                nombreArchivo
            );


    if (
        !data ||
        !data.publicUrl
    ) {

        throw new Error(
            "No se pudo obtener la URL de la imagen."
        );

    }


    return data.publicUrl;
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


            const inputImagen =
                document.getElementById(
                    "imagenMaqueta"
                );


            const archivoImagen =
                inputImagen?.files?.[0] ||
                null;


            const mensaje =
                document.getElementById(
                    "mensajeMaqueta"
                );


            if (!mensaje) {

                return;
            }


            if (!nombre) {

                mensaje.textContent =
                    "El nombre de la maqueta es obligatorio.";

                return;
            }


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


                // =================================================
                // IMAGEN ACTUAL
                // =================================================

                let imagenUrl =
                    formMaqueta
                        .dataset
                        .imagenActual ||
                    null;


                // =================================================
                // SI HAY NUEVA IMAGEN, SUBIRLA
                // =================================================

                if (archivoImagen) {

                    mensaje.textContent =
                        "Subiendo imagen...";


                    imagenUrl =
                        await subirImagenMaqueta(
                            archivoImagen
                        );

                }


                mensaje.textContent =
                    "Guardando maqueta...";


                // =================================================
                // ELEGIR EDGE FUNCTION
                // =================================================

                const funcion =
                    idEditando

                        ? "editar-maqueta"

                        : "crear-maqueta";


                // =================================================
                // ARMAR DATOS
                // =================================================

                const datos =
                    idEditando

                        ? {

                            id:
                                Number(
                                    idEditando
                                ),

                            codigo:
                                codigo,

                            nombre:
                                nombre,

                            descripcion:
                                descripcion,

                            imagen_url:
                                imagenUrl

                        }

                        : {

                            codigo:
                                codigo,

                            nombre:
                                nombre,

                            descripcion:
                                descripcion,

                            imagen_url:
                                imagenUrl

                        };


                // =================================================
                // LLAMAR EDGE FUNCTION
                // =================================================

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
                        "No se pudo guardar la maqueta.";

                    return;
                }


                mensaje.textContent =
                    idEditando

                        ? "Maqueta actualizada correctamente."

                        : "Maqueta creada correctamente.";


                // =================================================
                // LIMPIAR FORMULARIO
                // =================================================

                formMaqueta.reset();


                delete formMaqueta
                    .dataset
                    .editandoId;


                delete formMaqueta
                    .dataset
                    .imagenActual;


                // =================================================
                // OCULTAR PREVISUALIZACIÓN
                // =================================================

                const preview =
                    document.getElementById(
                        "previewImagenMaqueta"
                    );


                const previewImg =
                    document.getElementById(
                        "previewImagenMaquetaImg"
                    );


                if (preview) {

                    preview.hidden =
                        true;

                }


                if (previewImg) {

                    previewImg.src =
                        "";

                }


                // =================================================
                // RECARGAR MAQUETAS
                // =================================================

                await cargarMaquetas();


                // =================================================
                // CERRAR MODAL
                // =================================================

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
                    error?.message ||
                    "Error de conexión.";

            }

        }
    );
}


// =========================================================
// PREVISUALIZAR IMAGEN ANTES DE SUBIR
// =========================================================

document
    .getElementById(
        "imagenMaqueta"
    )
    ?.addEventListener(
        "change",
        event => {

            const archivo =
                event.target
                    .files?.[0];


            const preview =
                document.getElementById(
                    "previewImagenMaqueta"
                );


            const imagen =
                document.getElementById(
                    "previewImagenMaquetaImg"
                );


            if (
                !preview ||
                !imagen
            ) {

                return;
            }


            if (!archivo) {

                preview.hidden =
                    true;


                imagen.src =
                    "";


                return;
            }


            const tiposPermitidos = [

                "image/jpeg",

                "image/png",

                "image/webp"

            ];


            if (
                !tiposPermitidos.includes(
                    archivo.type
                )
            ) {

                alert(
                    "Seleccione una imagen JPG, PNG o WEBP."
                );


                event.target.value =
                    "";


                preview.hidden =
                    true;


                imagen.src =
                    "";


                return;
            }


            if (
                archivo.size >
                5 * 1024 * 1024
            ) {

                alert(
                    "La imagen no puede superar los 5 MB."
                );


                event.target.value =
                    "";


                preview.hidden =
                    true;


                imagen.src =
                    "";


                return;
            }


            imagen.src =
                URL.createObjectURL(
                    archivo
                );


            preview.hidden =
                false;

        }
    );


// =========================================================
// BOTÓN NUEVA MAQUETA
// =========================================================

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


            const modal =
                document.getElementById(
                    "modalMaqueta"
                );


            if (
                !form ||
                !modal
            ) {

                return;
            }


            // =================================================
            // LIMPIAR FORMULARIO
            // =================================================

            form.reset();


            delete form
                .dataset
                .editandoId;


            delete form
                .dataset
                .imagenActual;


            // =================================================
            // OCULTAR PREVISUALIZACIÓN
            // =================================================

            const preview =
                document.getElementById(
                    "previewImagenMaqueta"
                );


            const previewImg =
                document.getElementById(
                    "previewImagenMaquetaImg"
                );


            if (preview) {

                preview.hidden =
                    true;

            }


            if (previewImg) {

                previewImg.src =
                    "";

            }


            // =================================================
            // TÍTULO
            // =================================================

            const titulo =
                modal.querySelector(
                    ".modal-header h2"
                );


            if (titulo) {

                titulo.textContent =
                    "Nueva maqueta";

            }


            // =================================================
            // BOTÓN
            // =================================================

            const boton =
                form.querySelector(
                    'button[type="submit"]'
                );


            if (boton) {

                boton.textContent =
                    "Agregar maqueta";

            }


            // =================================================
            // MENSAJE
            // =================================================

            const mensaje =
                document.getElementById(
                    "mensajeMaqueta"
                );


            if (mensaje) {

                mensaje.textContent =
                    "";

            }


            modal.classList.add(
                "active"
            );

        }
    );
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


            if (
                !nombre ||
                !usuario ||
                !password ||
                !rol
            ) {

                mensaje.textContent =
                    "Complete todos los campos.";

                return;
            }


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

                                    nombre:
                                        nombre,

                                    usuario:
                                        usuario,

                                    password:
                                        password,

                                    rol:
                                        rol

                                })

                        }

                    );


                const resultado =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mensaje.textContent =
                        resultado.error ||
                        "No se pudo crear el usuario.";

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


                        mensaje.textContent =
                            "";

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
// BOTÓN NUEVO USUARIO
// =========================================================

document
    .getElementById(
        "btnNuevoUsuario"
    )
    ?.addEventListener(
        "click",
        () => {

            const form =
                document.getElementById(
                    "formUsuario"
                );


            const mensaje =
                document.getElementById(
                    "mensajeUsuario"
                );


            if (form) {

                form.reset();

            }


            if (mensaje) {

                mensaje.textContent =
                    "";

            }


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

                    const modal =
                        document.getElementById(
                            button.dataset.modal
                        );


                    if (modal) {

                        modal.classList.remove(
                            "active"
                        );

                    }

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
        new Date(
            fecha
        );


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
// ACTUALIZAR ENCABEZADOS DE LA SEMANA
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

async function cargarReservasSemanaAdmin() {

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


    if (!tbody) {

        return;
    }


    tbody.innerHTML = `

        <tr>

            <td colspan="6">
                Cargando reservas...
            </td>

        </tr>

    `;


    // =====================================================
    // FECHAS DE LA SEMANA
    // =====================================================

    const lunes =
        inicioSemanaAdmin;


    const viernes =
        sumarDiasAdmin(
            lunes,
            4
        );


    const fechaInicio =
        fechaLocalISOAdmin(
            lunes
        );


    const fechaFin =
        fechaLocalISOAdmin(
            viernes
        );


    // =====================================================
    // TEXTO DE SEMANA
    // =====================================================

    const textoSemana =
        document.getElementById(
            "textoSemanaAdmin"
        );


    if (textoSemana) {

        textoSemana.textContent =
            `${formatearFechaAdmin(lunes)} al ${formatearFechaAdmin(viernes)}`;

    }


    actualizarEncabezadosAdmin(
        lunes
    );


    // =====================================================
    // CARGAR RESERVAS
    // =====================================================

    const {
        data: reservas,
        error: errorReservas
    } =
        await supabaseClient

            .from("reservas")

            .select(`
                id,
                usuario_id,
                grupo,
                fecha,
                horario,
                area_codigo,
                titulo_tema,
                maqueta_id,
                maqueta_id_2,
                maqueta_id_3,
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

            .neq(
                "estado",
                "cancelada"
            )

            .order(
                "fecha",
                {
                    ascending: true
                }
            );


    if (errorReservas) {

        console.error(
            "Error cargando reservas:",
            errorReservas
        );


        tbody.innerHTML = `

            <tr>

                <td colspan="6">
                    Error al cargar las reservas.
                </td>

            </tr>

        `;


        return;
    }


    // =====================================================
    // CARGAR PERFILES
    // =====================================================

    const {
        data: perfiles,
        error: errorPerfiles
    } =
        await supabaseClient

            .from("perfiles")

            .select(`
                id,
                nombre,
                usuario
            `);


    if (errorPerfiles) {

        console.error(
            "Error cargando perfiles:",
            errorPerfiles
        );

    }


    // =====================================================
    // CARGAR MAQUETAS
    // =====================================================

    const {
        data: maquetas,
        error: errorMaquetas
    } =
        await supabaseClient

            .from("maquetas")

            .select(`
                id,
                codigo,
                nombre
            `);


    if (errorMaquetas) {

        console.error(
            "Error cargando maquetas:",
            errorMaquetas
        );

    }


    // =====================================================
    // CREAR MAPAS
    // =====================================================

    const mapaPerfiles =
        new Map();


    (
        perfiles ||
        []
    )
        .forEach(
            perfil => {

                mapaPerfiles.set(
                    String(
                        perfil.id
                    ),
                    perfil
                );

            }
        );


    const mapaMaquetas =
        new Map();


    (
        maquetas ||
        []
    )
        .forEach(
            maqueta => {

                mapaMaquetas.set(
                    String(
                        maqueta.id
                    ),
                    maqueta
                );

            }
        );


    // =====================================================
    // GUARDAR DATOS PARA PDF
    // =====================================================

    reservasSemanaPDF =
        reservas ||
        [];


    mapaPerfilesPDF =
        mapaPerfiles;


    mapaMaquetasPDF =
        mapaMaquetas;


    // =====================================================
    // HORARIOS
    // =====================================================

    const horarios = [

        "09:00-12:00",

        "14:00-17:00",

        "19:00-21:30"

    ];


    // =====================================================
    // CREAR FILAS
    // =====================================================

    tbody.innerHTML =
        horarios
            .map(
                horario => {

                    let fila = `

                        <tr>

                            <td class="horario-cell">

                                <strong>
                                    ${escapeHTML(
                                        horario
                                    )}
                                </strong>

                            </td>

                    `;


                    // =========================================
                    // LUNES A VIERNES
                    // =========================================

                    for (
                        let i = 0;
                        i < 5;
                        i++
                    ) {

                        const fecha =
                            fechaLocalISOAdmin(
                                sumarDiasAdmin(
                                    lunes,
                                    i
                                )
                            );


                        const reservasCelda =
                            (
                                reservas ||
                                []
                            )
                                .filter(
                                    reserva =>

                                        reserva.fecha ===
                                            fecha &&

                                        reserva.horario ===
                                            horario

                                );


                        // =====================================
                        // SIN RESERVAS
                        // =====================================

                        if (
                            reservasCelda.length ===
                            0
                        ) {

                            fila += `

                                <td>

                                    <div class="celda-libre">

                                        Libre

                                    </div>

                                </td>

                            `;


                            continue;
                        }


                        // =====================================
                        // CON RESERVAS
                        // =====================================

                        const contenido =
                            reservasCelda
                                .map(
                                    reserva => {

                                        const perfil =
                                            mapaPerfiles.get(
                                                String(
                                                    reserva.usuario_id
                                                )
                                            );


                                        const docente =
                                            perfil?.nombre ||
                                            perfil?.usuario ||
                                            "Docente";


                                        // =================================
                                        // MAQUETAS
                                        // =================================

                                        const idsMaquetas = [

                                            reserva.maqueta_id,

                                            reserva.maqueta_id_2,

                                            reserva.maqueta_id_3

                                        ]
                                            .filter(
                                                Boolean
                                            );


                                        const nombresMaquetas =
                                            idsMaquetas
                                                .map(
                                                    id => {

                                                        const maqueta =
                                                            mapaMaquetas.get(
                                                                String(
                                                                    id
                                                                )
                                                            );


                                                        if (!maqueta) {

                                                            return `Maqueta ${id}`;

                                                        }


                                                        return (

                                                            maqueta.codigo

                                                                ? `${maqueta.codigo} - ${maqueta.nombre}`

                                                                : maqueta.nombre

                                                        );

                                                    }
                                                );


                                        const textoMaquetas =
                                            nombresMaquetas.length

                                                ? nombresMaquetas.join(
                                                    "<br>"
                                                )

                                                : "Sin maqueta";


                                        const grupo =
                                            reserva.grupo ||
                                            "Sin grupo";


                                        const area =
                                            reserva.area_codigo ||
                                            "Sin área";


                                        const tema =
                                            reserva.titulo_tema ||
                                            "Sin tema";


                                        return `

                                            <div class="reserva-admin-card">

                                                <div class="reserva-admin-docente">

                                                    👤
                                                    ${escapeHTML(
                                                        docente
                                                    )}

                                                </div>


                                                <div>

                                                    <strong>
                                                        Grupo:
                                                    </strong>

                                                    ${escapeHTML(
                                                        grupo
                                                    )}

                                                </div>


                                                <div>

                                                    <strong>
                                                        Maqueta:
                                                    </strong>

                                                    <br>

                                                    ${textoMaquetas}

                                                </div>


                                                <div>

                                                    <strong>
                                                        Área:
                                                    </strong>

                                                    ${escapeHTML(
                                                        area
                                                    )}

                                                </div>


                                                <div>

                                                    <strong>
                                                        Tema:
                                                    </strong>

                                                    ${escapeHTML(
                                                        tema
                                                    )}

                                                </div>


                                                <button
                                                    type="button"
                                                    class="btn-cancelar-reserva-admin"
                                                    data-id="${reserva.id}"
                                                >
                                                    Cancelar reserva
                                                </button>

                                            </div>

                                        `;

                                    }
                                )
                                .join("");


                        fila += `

                            <td>

                                ${contenido}

                            </td>

                        `;

                    }


                    fila += `

                        </tr>

                    `;


                    return fila;

                }
            )
            .join("");


    // =====================================================
    // BOTONES CANCELAR RESERVA
    // =====================================================

    document
        .querySelectorAll(
            ".btn-cancelar-reserva-admin"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            Number(
                                button.dataset.id
                            );


                        await cancelarReservaAdmin(
                            id
                        );

                    }
                );

            }
        );
}


// =========================================================
// CANCELAR RESERVA DESDE ADMINISTRACIÓN
// =========================================================

async function cancelarReservaAdmin(
    id
) {

    const confirmar =
        confirm(
            "¿Desea cancelar esta reserva? La maqueta y el área quedarán nuevamente disponibles."
        );


    if (!confirmar) {

        return;
    }


    const {
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
                id
            );


    if (error) {

        console.error(
            "Error cancelando reserva:",
            error
        );


        alert(
            "No se pudo cancelar la reserva."
        );


        return;
    }


    await cargarReservasSemanaAdmin();
}


// =========================================================
// CONTROLES DE SEMANA
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


            await cargarReservasSemanaAdmin();

        }
    );


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


            await cargarReservasSemanaAdmin();

        }
    );


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


            await cargarReservasSemanaAdmin();

        }
    );
// =========================================================
// PDF
// =========================================================

function descargarTablaPDF() {

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        alert(
            "No se pudo cargar la librería PDF."
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


    // =====================================================
    // FECHAS
    // =====================================================

    const lunes =
        inicioSemanaAdmin;


    const viernes =
        sumarDiasAdmin(
            lunes,
            4
        );


    // =====================================================
    // TÍTULO
    // =====================================================

    doc.setFontSize(
        18
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.text(
        "INSTITUTO CETA",
        148.5,
        13,
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
        148.5,
        21,
        {
            align:
                "center"
        }
    );


    doc.setFontSize(
        10
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.text(
        `Reporte semanal: ${formatearFechaAdmin(lunes)} al ${formatearFechaAdmin(viernes)}`,
        148.5,
        28,
        {
            align:
                "center"
        }
    );


    // =====================================================
    // ENCABEZADO DE TABLA
    // =====================================================

    const head = [[

        "HORARIO",

        `LUNES\n${formatearFechaAdmin(
            lunes
        )}`,

        `MARTES\n${formatearFechaAdmin(
            sumarDiasAdmin(
                lunes,
                1
            )
        )}`,

        `MIÉRCOLES\n${formatearFechaAdmin(
            sumarDiasAdmin(
                lunes,
                2
            )
        )}`,

        `JUEVES\n${formatearFechaAdmin(
            sumarDiasAdmin(
                lunes,
                3
            )
        )}`,

        `VIERNES\n${formatearFechaAdmin(
            sumarDiasAdmin(
                lunes,
                4
            )
        )}`

    ]];


    // =====================================================
    // HORARIOS
    // =====================================================

    const horarios = [

        "09:00-12:00",

        "14:00-17:00",

        "19:00-21:30"

    ];


    // =====================================================
    // CUERPO DEL PDF
    // =====================================================

    const body =
        horarios.map(
            horario => {

                const fila = [

                    horario

                ];


                for (
                    let i = 0;
                    i < 5;
                    i++
                ) {

                    const fecha =
                        fechaLocalISOAdmin(
                            sumarDiasAdmin(
                                lunes,
                                i
                            )
                        );


                    const reservasCelda =
                        (
                            reservasSemanaPDF ||
                            []
                        )
                            .filter(
                                reserva =>

                                    reserva.fecha ===
                                        fecha &&

                                    reserva.horario ===
                                        horario

                            );


                    if (
                        reservasCelda.length ===
                        0
                    ) {

                        fila.push(
                            "LIBRE"
                        );


                        continue;
                    }


                    const textos =
                        reservasCelda
                            .map(
                                reserva => {

                                    const perfil =
                                        mapaPerfilesPDF.get(
                                            String(
                                                reserva.usuario_id
                                            )
                                        );


                                    const docente =
                                        perfil?.nombre ||
                                        perfil?.usuario ||
                                        "Docente";


                                    // =================================
                                    // MAQUETAS
                                    // Incluye tercer campo histórico
                                    // =================================

                                    const idsMaquetas = [

                                        reserva.maqueta_id,

                                        reserva.maqueta_id_2,

                                        reserva.maqueta_id_3

                                    ]
                                        .filter(
                                            Boolean
                                        );


                                    const maquetas =
                                        idsMaquetas
                                            .map(
                                                id => {

                                                    const maqueta =
                                                        mapaMaquetasPDF.get(
                                                            String(
                                                                id
                                                            )
                                                        );


                                                    if (!maqueta) {

                                                        return `Maqueta ${id}`;

                                                    }


                                                    return (

                                                        maqueta.codigo

                                                            ? `${maqueta.codigo} - ${maqueta.nombre}`

                                                            : maqueta.nombre

                                                    );

                                                }
                                            )
                                            .join(
                                                ", "
                                            );


                                    const grupo =
                                        reserva.grupo ||
                                        "-";


                                    const area =
                                        reserva.area_codigo ||
                                        "-";


                                    const tema =
                                        reserva.titulo_tema ||
                                        "-";


                                    return [

                                        `Docente: ${docente}`,

                                        `Grupo: ${grupo}`,

                                        `Maqueta: ${maquetas || "-"}`,

                                        `Área: ${area}`,

                                        `Tema: ${tema}`

                                    ]
                                        .join(
                                            "\n"
                                        );

                                }
                            );


                    fila.push(
                        textos.join(
                            "\n\n"
                        )
                    );

                }


                return fila;

            }
        );


    // =====================================================
    // GENERAR TABLA
    // =====================================================

    doc.autoTable({

        head:
            head,

        body:
            body,

        startY:
            39,

        theme:
            "grid",

        styles: {

            // LETRA AUMENTADA DE 7 A 8
            fontSize:
                11,

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
    // PIE DE PÁGINA
    // =====================================================

    const numeroPaginas =
        doc.internal
            .getNumberOfPages();


    for (
        let pagina = 1;
        pagina <= numeroPaginas;
        pagina++
    ) {

        doc.setPage(
            pagina
        );


        doc.setFontSize(
            8
        );


        doc.setFont(
            "helvetica",
            "normal"
        );


        doc.text(

            "Sistema de Reserva de Maquetas · CETA",

            8,

            202

        );


        doc.text(

            `Página ${pagina} de ${numeroPaginas}`,

            289,

            202,

            {
                align:
                    "right"
            }

        );

    }


    // =====================================================
    // NOMBRE DEL ARCHIVO
    // =====================================================

    const nombreArchivo =

        `reservas-ceta-${fechaLocalISOAdmin(
            lunes
        )}-${fechaLocalISOAdmin(
            viernes
        )}.pdf`;


    doc.save(
        nombreArchivo
    );
}


// =========================================================
// BOTÓN DESCARGAR PDF
// =========================================================

document
    .getElementById(
        "btnDescargarPDF"
    )
    ?.addEventListener(
        "click",
        () => {

            descargarTablaPDF();

        }
    );
// =========================================================
// GESTIÓN ACADÉMICA
// =========================================================

let gestionesAcademicas = [];

let areasTallerGestion = [];


// =========================================================
// CARGAR GESTIONES ACADÉMICAS
// =========================================================

async function cargarGestionesAcademicas() {

    const lista =
        document.getElementById(
            "listaGestiones"
        );


    const selector =
        document.getElementById(
            "configGestion"
        );


    const gestionActivaTexto =
        document.getElementById(
            "gestionActivaTexto"
        );


    const gestionActivaFechas =
        document.getElementById(
            "gestionActivaFechas"
        );


    const {
        data,
        error
    } =
        await supabaseClient

            .from(
                "gestiones_academicas"
            )

            .select("*")

            .order(
                "fecha_inicio",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Error cargando gestiones:",
            error
        );


        if (lista) {

            lista.innerHTML =
                "Error al cargar gestiones.";

        }


        if (gestionActivaTexto) {

            gestionActivaTexto.textContent =
                "No disponible";

        }


        return;
    }


    gestionesAcademicas =
        data || [];


    // =====================================================
    // GESTIÓN ACTIVA
    // =====================================================

    const activa =
        gestionesAcademicas.find(
            gestion =>
                gestion.activa === true
        );


    if (gestionActivaTexto) {

        gestionActivaTexto.textContent =
            activa
                ? activa.nombre
                : "Ninguna gestión activa";

    }


    if (gestionActivaFechas) {

        gestionActivaFechas.textContent =
            activa

                ? `${formatearFechaBD(
                    activa.fecha_inicio
                )} al ${formatearFechaBD(
                    activa.fecha_fin
                )}`

                : "";

    }


    // =====================================================
    // LISTA DE GESTIONES
    // =====================================================

    if (lista) {

        if (
            gestionesAcademicas.length ===
            0
        ) {

            lista.innerHTML =
                "No existen gestiones registradas.";

        } else {

            lista.innerHTML =
                gestionesAcademicas
                    .map(
                        gestion => {

                            return `

                                <div class="gestion-item">

                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                gestion.nombre
                                            )}
                                        </strong>

                                        <span>

                                            ${formatearFechaBD(
                                                gestion.fecha_inicio
                                            )}

                                            al

                                            ${formatearFechaBD(
                                                gestion.fecha_fin
                                            )}

                                        </span>

                                    </div>


                                    <div>

                                        ${
                                            gestion.activa

                                                ? `

                                                    <span class="badge-activo">
                                                        Activa
                                                    </span>

                                                `

                                                : `

                                                    <button
                                                        type="button"
                                                        class="btn-activar-gestion"
                                                        data-id="${gestion.id}"
                                                    >
                                                        Activar
                                                    </button>

                                                `
                                        }

                                    </div>

                                </div>

                            `;

                        }
                    )
                    .join("");

        }

    }


    // =====================================================
    // BOTONES ACTIVAR GESTIÓN
    // =====================================================

    document
        .querySelectorAll(
            ".btn-activar-gestion"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await activarGestionAcademica(
                            Number(
                                button.dataset.id
                            )
                        );

                    }
                );

            }
        );


    // =====================================================
    // SELECTOR DE CONFIGURACIÓN
    // =====================================================

    if (selector) {

        const valorAnterior =
            selector.value;


        selector.innerHTML =
            gestionesAcademicas
                .map(
                    gestion => `

                        <option
                            value="${gestion.id}"
                        >

                            ${escapeHTML(
                                gestion.nombre
                            )}

                            ${
                                gestion.activa
                                    ? " — ACTIVA"
                                    : ""
                            }

                        </option>

                    `
                )
                .join("");


        // Intentar conservar selección

        if (
            valorAnterior &&
            gestionesAcademicas.some(
                gestion =>
                    String(
                        gestion.id
                    ) ===
                    String(
                        valorAnterior
                    )
            )
        ) {

            selector.value =
                valorAnterior;

        } else if (activa) {

            selector.value =
                String(
                    activa.id
                );

        }


        await cargarAreasLibresGestion();

    }
}


// =========================================================
// FORMATEAR FECHA DE BASE DE DATOS
// =========================================================

function formatearFechaBD(
    fechaTexto
) {

    if (!fechaTexto) {

        return "-";

    }


    const partes =
        fechaTexto.split("-");


    if (
        partes.length !== 3
    ) {

        return fechaTexto;

    }


    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


// =========================================================
// CREAR NUEVA GESTIÓN
// =========================================================

const formNuevaGestion =
    document.getElementById(
        "formNuevaGestion"
    );


formNuevaGestion
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const nombre =
                document
                    .getElementById(
                        "gestionNombre"
                    )
                    .value
                    .trim();


            const fechaInicio =
                document
                    .getElementById(
                        "gestionFechaInicio"
                    )
                    .value;


            const fechaFin =
                document
                    .getElementById(
                        "gestionFechaFin"
                    )
                    .value;


            const mensaje =
                document.getElementById(
                    "mensajeGestion"
                );


            if (
                !nombre ||
                !fechaInicio ||
                !fechaFin
            ) {

                mensaje.textContent =
                    "Complete todos los campos.";

                return;
            }


            if (
                fechaFin <
                fechaInicio
            ) {

                mensaje.textContent =
                    "La fecha final no puede ser anterior a la fecha inicial.";

                return;
            }


            mensaje.textContent =
                "Creando gestión...";


            const {
                error
            } =
                await supabaseClient

                    .from(
                        "gestiones_academicas"
                    )

                    .insert({

                        nombre:
                            nombre,

                        fecha_inicio:
                            fechaInicio,

                        fecha_fin:
                            fechaFin,

                        activa:
                            false

                    });


            if (error) {

                console.error(
                    "Error creando gestión:",
                    error
                );


                if (
                    error.message
                        ?.toLowerCase()
                        .includes(
                            "superponen"
                        )
                ) {

                    mensaje.textContent =
                        "Las fechas se superponen con otra gestión existente.";

                } else {

                    mensaje.textContent =
                        error.message ||
                        "No se pudo crear la gestión.";

                }


                return;
            }


            mensaje.textContent =
                "Gestión creada correctamente.";


            formNuevaGestion.reset();


            await cargarGestionesAcademicas();


            setTimeout(
                () => {

                    mensaje.textContent =
                        "";

                },
                2000
            );

        }
    );


// =========================================================
// ACTIVAR GESTIÓN ACADÉMICA
// =========================================================

async function activarGestionAcademica(
    id
) {

    const gestion =
        gestionesAcademicas.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    id
                )
        );


    const nombre =
        gestion?.nombre ||
        "esta gestión";


    if (
        !confirm(
            `¿Desea activar la gestión "${nombre}"?`
        )
    ) {

        return;
    }


    const {
        error
    } =
        await supabaseClient

            .rpc(
                "activar_gestion_academica",
                {
                    p_gestion_id:
                        id
                }
            );


    if (error) {

        console.error(
            "Error activando gestión:",
            error
        );


        alert(
            error.message ||
            "No se pudo activar la gestión."
        );


        return;
    }


    await cargarGestionesAcademicas();
}


// =========================================================
// CARGAR ÁREAS DEL TALLER
// =========================================================

async function cargarAreasTallerGestion() {

    const {
        data,
        error
    } =
        await supabaseClient

            .from(
                "areas_taller"
            )

            .select(`
                codigo,
                nombre,
                activo
            `)

            .eq(
                "activo",
                true
            )

            .order(
                "codigo",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error cargando áreas del taller:",
            error
        );


        areasTallerGestion =
            [];


        return;
    }


    areasTallerGestion =
        data || [];
}


// =========================================================
// CARGAR ÁREAS LIBRES DE UNA GESTIÓN
// =========================================================

async function cargarAreasLibresGestion() {

    const selectorGestion =
        document.getElementById(
            "configGestion"
        );


    const selectorDia =
        document.getElementById(
            "configDia"
        );


    const selectorHorario =
        document.getElementById(
            "configHorario"
        );


    const contenedor =
        document.getElementById(
            "areasGestionChecks"
        );


    const mensaje =
        document.getElementById(
            "mensajeAreasGestion"
        );


    if (
        !selectorGestion ||
        !selectorDia ||
        !selectorHorario ||
        !contenedor
    ) {

        return;
    }


    const gestionId =
        Number(
            selectorGestion.value
        );


    const dia =
        selectorDia.value;


    const horario =
        selectorHorario.value;


    if (
        !gestionId ||
        !dia ||
        !horario
    ) {

        contenedor.innerHTML = `

            <span class="config-cargando">
                Seleccione gestión, día y horario.
            </span>

        `;


        return;
    }


    if (mensaje) {

        mensaje.textContent =
            "";

    }


    contenedor.innerHTML = `

        <span class="config-cargando">
            Cargando áreas...
        </span>

    `;


    // =====================================================
    // ASEGURAR QUE TENEMOS LAS ÁREAS
    // =====================================================

    if (
        areasTallerGestion.length ===
        0
    ) {

        await cargarAreasTallerGestion();

    }


    // =====================================================
    // CONSULTAR CONFIGURACIÓN
    // =====================================================

    const {
        data,
        error
    } =
        await supabaseClient

            .from(
                "areas_libres_gestion"
            )

            .select(
                "area_codigo"
            )

            .eq(
                "gestion_id",
                gestionId
            )

            .eq(
                "dia_semana",
                dia
            )

            .eq(
                "horario",
                horario
            );


    if (error) {

        console.error(
            "Error cargando áreas libres:",
            error
        );


        contenedor.innerHTML = `

            <span class="config-cargando">
                Error al cargar configuración.
            </span>

        `;


        return;
    }


    const areasSeleccionadas =
        new Set(
            (
                data ||
                []
            )
                .map(
                    item =>
                        item.area_codigo
                )
        );


    // =====================================================
    // DIBUJAR CHECKBOXES
    // =====================================================

    if (
        areasTallerGestion.length ===
        0
    ) {

        contenedor.innerHTML = `

            <span class="config-cargando">
                No existen áreas activas.
            </span>

        `;


        return;
    }


    contenedor.innerHTML =
        areasTallerGestion
            .map(
                area => {

                    const seleccionado =
                        areasSeleccionadas.has(
                            area.codigo
                        );


                    return `

                        <label class="area-check-card">

                            <input
                                type="checkbox"
                                class="area-gestion-check"
                                value="${escapeHTML(
                                    area.codigo
                                )}"
                                ${
                                    seleccionado
                                        ? "checked"
                                        : ""
                                }
                            >

                            <span>

                                ${escapeHTML(
                                    area.codigo
                                )}

                            </span>

                        </label>

                    `;

                }
            )
            .join("");
}


// =========================================================
// CAMBIAR SELECTORES DE CONFIGURACIÓN
// =========================================================

document
    .getElementById(
        "configGestion"
    )
    ?.addEventListener(
        "change",
        cargarAreasLibresGestion
    );


document
    .getElementById(
        "configDia"
    )
    ?.addEventListener(
        "change",
        cargarAreasLibresGestion
    );


document
    .getElementById(
        "configHorario"
    )
    ?.addEventListener(
        "change",
        cargarAreasLibresGestion
    );


// =========================================================
// GUARDAR ÁREAS LIBRES
// =========================================================

document
    .getElementById(
        "btnGuardarAreasGestion"
    )
    ?.addEventListener(
        "click",
        async () => {

            const selectorGestion =
                document.getElementById(
                    "configGestion"
                );


            const selectorDia =
                document.getElementById(
                    "configDia"
                );


            const selectorHorario =
                document.getElementById(
                    "configHorario"
                );


            const mensaje =
                document.getElementById(
                    "mensajeAreasGestion"
                );


            const gestionId =
                Number(
                    selectorGestion?.value
                );


            const dia =
                selectorDia?.value;


            const horario =
                selectorHorario?.value;


            if (
                !gestionId ||
                !dia ||
                !horario
            ) {

                if (mensaje) {

                    mensaje.textContent =
                        "Seleccione gestión, día y horario.";

                }


                return;
            }


            const seleccionadas =
                Array.from(
                    document.querySelectorAll(
                        ".area-gestion-check:checked"
                    )
                )
                    .map(
                        checkbox =>
                            checkbox.value
                    );


            if (mensaje) {

                mensaje.textContent =
                    "Guardando configuración...";

            }


            // =================================================
            // ELIMINAR CONFIGURACIÓN ANTERIOR
            // =================================================

            const {
                error: errorEliminar
            } =
                await supabaseClient

                    .from(
                        "areas_libres_gestion"
                    )

                    .delete()

                    .eq(
                        "gestion_id",
                        gestionId
                    )

                    .eq(
                        "dia_semana",
                        dia
                    )

                    .eq(
                        "horario",
                        horario
                    );


            if (errorEliminar) {

                console.error(
                    "Error eliminando configuración:",
                    errorEliminar
                );


                if (mensaje) {

                    mensaje.textContent =
                        "No se pudo guardar la configuración.";

                }


                return;
            }


            // =================================================
            // INSERTAR NUEVA CONFIGURACIÓN
            // =================================================

            if (
                seleccionadas.length >
                0
            ) {

                const registros =
                    seleccionadas.map(
                        codigo => ({

                            gestion_id:
                                gestionId,

                            dia_semana:
                                dia,

                            horario:
                                horario,

                            area_codigo:
                                codigo

                        })
                    );


                const {
                    error: errorInsertar
                } =
                    await supabaseClient

                        .from(
                            "areas_libres_gestion"
                        )

                        .insert(
                            registros
                        );


                if (errorInsertar) {

                    console.error(
                        "Error insertando configuración:",
                        errorInsertar
                    );


                    if (mensaje) {

                        mensaje.textContent =
                            "No se pudo guardar la configuración.";

                    }


                    return;
                }

            }


            if (mensaje) {

                mensaje.textContent =
                    "Configuración guardada correctamente.";

            }


            await cargarAreasLibresGestion();


            if (mensaje) {

                mensaje.textContent =
                    "Configuración guardada correctamente.";

            }

        }
    );
// =========================================================
// INICIALIZAR PANEL ADMINISTRATIVO
// =========================================================

async function inicializarAdmin() {

    try {

        // =================================================
        // COMPROBAR SESIÓN Y ADMINISTRADOR
        // =================================================

        const perfil =
            await comprobarAdministrador();


        if (!perfil) {

            return;

        }


        // =================================================
        // CARGAR USUARIOS
        // =================================================

        await cargarUsuarios();


        // =================================================
        // CARGAR MAQUETAS
        // =================================================

        await cargarMaquetas();


        // =================================================
        // CARGAR RESERVAS SEMANALES
        // =================================================

        await cargarReservasSemanaAdmin();


        // =================================================
        // CARGAR ÁREAS DEL TALLER
        // =================================================

        await cargarAreasTallerGestion();


        // =================================================
        // CARGAR GESTIONES ACADÉMICAS
        // =================================================

        await cargarGestionesAcademicas();


    } catch (error) {

        console.error(
            "Error inicializando panel administrativo:",
            error
        );

    }

}


// =========================================================
// EJECUTAR
// =========================================================

inicializarAdmin();
