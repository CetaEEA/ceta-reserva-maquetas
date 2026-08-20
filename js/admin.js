const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================================================
   COMPROBAR ADMINISTRADOR
========================================================= */

async function comprobarAdministrador() {

    const {
        data: { user },
        error
    } =
        await supabaseClient.auth.getUser();

    if (error || !user) {

        window.location.href = "index.html";

        return null;
    }


    const {
        data: perfil,
        error: errorPerfil
    } =
        await supabaseClient
            .from("perfiles")
            .select("*")
            .eq("id", user.id)
            .single();


    if (
        errorPerfil ||
        !perfil ||
        perfil.rol !== "administrador" ||
        !perfil.activo
    ) {

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";

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


/* =========================================================
   CARGAR USUARIOS
========================================================= */

async function cargarUsuarios() {

    const tabla =
        document.getElementById(
            "tablaUsuarios"
        );


    if (!tabla) return;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("perfiles")
            .select(
                "id, usuario, nombre, rol, activo"
            )
            .order("nombre");


    if (error) {

        console.error(
            "Error cargando usuarios:",
            error
        );


        tabla.innerHTML = `
            <tr>
                <td colspan="5">
                    Error al cargar los usuarios.
                </td>
            </tr>
        `;

        return;
    }


    if (!data || !data.length) {

        tabla.innerHTML = `
            <tr>
                <td colspan="5">
                    No existen usuarios registrados.
                </td>
            </tr>
        `;

        return;
    }


    tabla.innerHTML =
        data.map(usuario => {

            return `
                <tr>

                    <td>
                        ${escapeHTML(usuario.usuario)}
                    </td>

                    <td>
                        ${escapeHTML(usuario.nombre)}
                    </td>

                    <td>
                        ${escapeHTML(usuario.rol)}
                    </td>

                    <td>
                        ${
                            usuario.activo
                                ? "Activo"
                                : "Desactivado"
                        }
                    </td>

                    <td>
                        Próximamente
                    </td>

                </tr>
            `;

        }).join("");
}


/* =========================================================
   CARGAR MAQUETAS
========================================================= */

async function cargarMaquetas() {

    const contenedor =
        document.getElementById(
            "tablaMaquetas"
        );


    if (!contenedor) return;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("maquetas")
            .select("*")
            .order("id");


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


    if (!data || !data.length) {

        contenedor.innerHTML = `
            <div class="loading-card">
                No existen maquetas registradas.
            </div>
        `;

        return;
    }


    /*
       =====================================================
       GENERAR TARJETAS
       =====================================================
    */

    contenedor.innerHTML =
        data.map(maqueta => {

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
                            data-nombre="${escapeHTML(maqueta.nombre)}"
                        >
                            🔴 Marcar no disponible
                        </button>
                    `

                    : `
                        <button
                            class="btn-activar-maqueta"
                            data-id="${maqueta.id}"
                            data-nombre="${escapeHTML(maqueta.nombre)}"
                        >
                            🟢 Habilitar maqueta
                        </button>
                    `;


            return `

                <div class="maqueta-card">

                    <div class="maqueta-card-header">

                        <div>

                            <div class="maqueta-codigo">

                                ${escapeHTML(
                                    maqueta.codigo || "SIN CÓDIGO"
                                )}

                            </div>


                            <h3>

                                ${escapeHTML(
                                    maqueta.nombre
                                )}

                            </h3>

                        </div>


                        <div>

                            ${estado}

                        </div>

                    </div>


                    <div class="maqueta-descripcion">

                        ${escapeHTML(
                            maqueta.descripcion || "Sin descripción."
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
                            ✏️ Editar maqueta
                        </button>


                        ${botonEstado}

                    </div>

                </div>

            `;

        }).join("");


    /* =====================================================
       EVENTO EDITAR
    ===================================================== */

    document
        .querySelectorAll(
            ".btn-editar-maqueta"
        )
        .forEach(button => {

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

        });


    /* =====================================================
       EVENTO DESACTIVAR
    ===================================================== */

    document
        .querySelectorAll(
            ".btn-desactivar-maqueta"
        )
        .forEach(button => {

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

        });


    /* =====================================================
       EVENTO ACTIVAR
    ===================================================== */

    document
        .querySelectorAll(
            ".btn-activar-maqueta"
        )
        .forEach(button => {

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

        });

}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escapeHTML(text) {

    return String(text)

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


/* =========================================================
   ABRIR EDICIÓN
========================================================= */

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


    const titulo =
        modal?.querySelector(
            ".modal-header h2"
        );


    const form =
        document.getElementById(
            "formMaqueta"
        );


    const inputCodigo =
        document.getElementById(
            "codigoMaqueta"
        );


    const inputNombre =
        document.getElementById(
            "nombreMaqueta"
        );


    const inputDescripcion =
        document.getElementById(
            "descripcionMaqueta"
        );


    const mensaje =
        document.getElementById(
            "mensajeMaqueta"
        );


    if (!modal || !form) return;


    /*
       Guardar ID que se está editando
    */

    form.dataset.editandoId =
        id;


    /*
       Cambiar título
    */

    if (titulo) {

        titulo.textContent =
            "Editar maqueta";

    }


    /*
       Cargar datos
    */

    inputCodigo.value =
        codigo || "";


    inputNombre.value =
        nombre || "";


    inputDescripcion.value =
        descripcion || "";


    /*
       Cambiar texto del botón
    */

    const boton =
        form.querySelector(
            'button[type="submit"]'
        );


    if (boton) {

        boton.textContent =
            "Guardar cambios";

    }


    mensaje.textContent =
        "";


    modal.classList.add(
        "active"
    );

}


/* =========================================================
   CAMBIAR ESTADO
========================================================= */

async function cambiarEstadoMaqueta(
    id,
    disponible,
    nombre
) {

    const accion =
        disponible
            ? "habilitar"
            : "marcar como no disponible";


    if (
        !confirm(
            `¿Deseas ${accion} la maqueta "${nombre}"?`
        )
    ) {

        return;

    }


    try {

        const {
            data: {
                session
            }
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

                    method: "POST",

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

                            disponible:
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


        alert(
            resultado.message ||
            "Estado actualizado correctamente."
        );


        await cargarMaquetas();


    } catch (error) {

        console.error(error);


        alert(
            "Error de conexión con el servidor."
        );

    }

}


/* =========================================================
   CREAR / EDITAR MAQUETA
========================================================= */

const formMaqueta =
    document.getElementById(
        "formMaqueta"
    );


if (formMaqueta) {

    formMaqueta.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const idEditando =
                formMaqueta.dataset.editandoId;


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
                idEditando
                    ? "Guardando cambios..."
                    : "Creando maqueta...";


            try {

                const {
                    data: {
                        session
                    }
                } =
                    await supabaseClient
                        .auth
                        .getSession();


                if (!session) {

                    mensaje.textContent =
                        "La sesión ha expirado.";

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

                            codigo:
                                codigo,

                            nombre:
                                nombre,

                            descripcion:
                                descripcion

                        }

                        : {

                            codigo:
                                codigo,

                            nombre:
                                nombre,

                            descripcion:
                                descripcion

                        };


                const respuesta =
                    await fetch(

                        `${SUPABASE_URL}/functions/v1/${funcion}`,

                        {

                            method: "POST",

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

                    console.error(
                        resultado
                    );


                    mensaje.textContent =
                        resultado.error ||
                        "No se pudo guardar la maqueta.";

                    return;

                }


                mensaje.textContent =
                    idEditando
                        ? "Maqueta actualizada correctamente."
                        : "Maqueta creada correctamente.";


                formMaqueta.reset();


                delete formMaqueta.dataset.editandoId;


                const boton =
                    formMaqueta.querySelector(
                        'button[type="submit"]'
                    );


                if (boton) {

                    boton.textContent =
                        "Agregar maqueta";

                }


                const titulo =
                    document
                        .querySelector(
                            "#modalMaqueta .modal-header h2"
                        );


                if (titulo) {

                    titulo.textContent =
                        "Nueva maqueta";

                }


                await cargarMaquetas();


                setTimeout(() => {

                    const modal =
                        document.getElementById(
                            "modalMaqueta"
                        );


                    if (modal) {

                        modal.classList.remove(
                            "active"
                        );

                    }


                    mensaje.textContent =
                        "";

                }, 1200);


            } catch (error) {

                console.error(error);


                mensaje.textContent =
                    "Error de conexión con el servidor.";

            }

        }
    );

}


/* =========================================================
   CREAR USUARIO
========================================================= */

const formUsuario =
    document.getElementById(
        "formUsuario"
    );


if (formUsuario) {

    formUsuario.addEventListener(
        "submit",
        async (event) => {

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
                    data: {
                        session
                    }
                } =
                    await supabaseClient
                        .auth
                        .getSession();


                if (!session) {

                    mensaje.textContent =
                        "La sesión ha expirado.";

                    return;

                }


                const respuesta =
                    await fetch(

                        `${SUPABASE_URL}/functions/v1/crear-usuario`,

                        {

                            method: "POST",

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


                setTimeout(() => {

                    const modal =
                        document.getElementById(
                            "modalUsuario"
                        );


                    if (modal) {

                        modal.classList.remove(
                            "active"
                        );

                    }


                    mensaje.textContent =
                        "";

                }, 1200);


            } catch (error) {

                console.error(error);


                mensaje.textContent =
                    "Error de conexión con el servidor.";

            }

        }
    );

}


/* =========================================================
   NUEVO USUARIO
========================================================= */

const btnNuevoUsuario =
    document.getElementById(
        "btnNuevoUsuario"
    );


if (btnNuevoUsuario) {

    btnNuevoUsuario.addEventListener(
        "click",
        () => {

            const modal =
                document.getElementById(
                    "modalUsuario"
                );


            if (modal) {

                modal.classList.add(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   NUEVA MAQUETA
========================================================= */

const btnNuevaMaqueta =
    document.getElementById(
        "btnNuevaMaqueta"
    );


if (btnNuevaMaqueta) {

    btnNuevaMaqueta.addEventListener(
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


            if (form) {

                form.reset();

                delete form.dataset.editandoId;


                const boton =
                    form.querySelector(
                        'button[type="submit"]'
                    );


                if (boton) {

                    boton.textContent =
                        "Agregar maqueta";

                }

            }


            const titulo =
                document.querySelector(
                    "#modalMaqueta .modal-header h2"
                );


            if (titulo) {

                titulo.textContent =
                    "Nueva maqueta";

            }


            if (modal) {

                modal.classList.add(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   CERRAR MODALES
========================================================= */

document
    .querySelectorAll(
        ".btnCerrarModal"
    )
    .forEach(button => {

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

    });


/* =========================================================
   CERRAR SESIÓN
========================================================= */

const btnCerrarSesion =
    document.getElementById(
        "btnCerrarSesion"
    );


if (btnCerrarSesion) {

    btnCerrarSesion.addEventListener(
        "click",
        async () => {

            await supabaseClient
                .auth
                .signOut();


            window.location.href =
                "index.html";

        }
    );

}


/* =========================================================
   RESERVAS
========================================================= */

async function cargarReservas() {

    const tabla =
        document.getElementById(
            "tablaReservas"
        );


    if (!tabla) return;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("reservas")
            .select("*")
            .order(
                "fecha",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error cargando reservas:",
            error
        );


        tabla.innerHTML = `
            <tr>
                <td colspan="6">
                    Error al cargar las reservas.
                </td>
            </tr>
        `;

        return;
    }


    if (!data || !data.length) {

        tabla.innerHTML = `
            <tr>
                <td colspan="6">
                    No existen reservas registradas.
                </td>
            </tr>
        `;

        return;
    }


    tabla.innerHTML =
        data.map(reserva => {

            return `
                <tr>

                    <td>
                        ${escapeHTML(
                            reserva.fecha || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            reserva.horario || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            reserva.maqueta || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            reserva.docente || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            reserva.grupo || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            reserva.estado || "-"
                        )}
                    </td>

                </tr>
            `;

        }).join("");
}


/* =========================================================
   INICIAR PANEL
========================================================= */

(async () => {

    const perfil =
        await comprobarAdministrador();


    if (!perfil) return;


    await cargarUsuarios();

    await cargarMaquetas();

    await cargarReservas();

})();
