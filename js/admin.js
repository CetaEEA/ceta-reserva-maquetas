const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================================================
   COMPROBAR SESIÓN Y ADMINISTRADOR
   ========================================================= */

async function comprobarAdministrador() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();


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


    if (!tabla) {

        return;

    }


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

            const estado =
                usuario.activo
                    ? "Activo"
                    : "Desactivado";


            return `

                <tr>

                    <td>
                        ${usuario.usuario}
                    </td>

                    <td>
                        ${usuario.nombre}
                    </td>

                    <td>
                        ${usuario.rol}
                    </td>

                    <td>
                        ${estado}
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

    const tabla =
        document.getElementById(
            "tablaMaquetas"
        );


    if (!tabla) {

        return;

    }


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


        tabla.innerHTML = `
            <tr>
                <td colspan="5">
                    Error al cargar las maquetas.
                </td>
            </tr>
        `;

        return;
    }


    if (!data || !data.length) {

        tabla.innerHTML = `
            <tr>
                <td colspan="5">
                    No existen maquetas registradas.
                </td>
            </tr>
        `;

        return;
    }


    tabla.innerHTML =
        data.map(maqueta => `

            <tr>

                <td>
                    ${maqueta.codigo || "-"}
                </td>

                <td>
                    ${maqueta.nombre}
                </td>

                <td>
                    ${maqueta.descripcion || "-"}
                </td>

                <td>

                    ${
                        maqueta.disponible
                            ? "Disponible"
                            : "No disponible"
                    }

                </td>

                <td>
                    Próximamente
                </td>

            </tr>

        `).join("");
}


/* =========================================================
   CARGAR RESERVAS
   ========================================================= */

async function cargarReservas() {

    const tabla =
        document.getElementById(
            "tablaReservas"
        );


    if (!tabla) {

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("reservas")
            .select(`
                id,
                grupo,
                fecha,
                horario,
                estado,
                maquetas (
                    codigo,
                    nombre
                ),
                perfiles (
                    nombre,
                    usuario
                )
            `)
            .order("fecha", {
                ascending: true
            });


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
        data.map(reserva => `

            <tr>

                <td>
                    ${reserva.fecha}
                </td>

                <td>
                    ${reserva.horario}
                </td>

                <td>
                    ${reserva.maquetas?.nombre || "-"}
                </td>

                <td>
                    ${reserva.perfiles?.nombre || "-"}
                </td>

                <td>
                    ${reserva.grupo || "-"}
                </td>

                <td>
                    ${reserva.estado || "-"}
                </td>

            </tr>

        `).join("");
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

                    console.error(
                        resultado
                    );


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

                console.error(
                    "Error creando usuario:",
                    error
                );


                mensaje.textContent =
                    "Error de conexión con el servidor.";

            }

        }
    );

}


/* =========================================================
   CREAR MAQUETA
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
                "Creando maqueta...";


            try {

                /* =========================================
                   OBTENER SESIÓN
                   ========================================= */

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


                /* =========================================
                   LLAMAR EDGE FUNCTION
                   ========================================= */

                const respuesta =
                    await fetch(

                        `${SUPABASE_URL}/functions/v1/crear-maqueta`,

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

                                    codigo:
                                        codigo,

                                    nombre:
                                        nombre,

                                    descripcion:
                                        descripcion

                                })

                        }

                    );


                const resultado =
                    await respuesta.json();


                /* =========================================
                   COMPROBAR RESPUESTA
                   ========================================= */

                if (!respuesta.ok) {

                    console.error(
                        resultado
                    );


                    mensaje.textContent =
                        resultado.error ||
                        "No se pudo crear la maqueta.";

                    return;

                }


                /* =========================================
                   ÉXITO
                   ========================================= */

                mensaje.textContent =
                    "Maqueta creada correctamente.";


                formMaqueta.reset();


                /* =========================================
                   ACTUALIZAR TABLA
                   ========================================= */

                await cargarMaquetas();


                /* =========================================
                   CERRAR MODAL
                   ========================================= */

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

                console.error(
                    "Error creando maqueta:",
                    error
                );


                mensaje.textContent =
                    "Error de conexión con el servidor.";

            }

        }
    );

}


/* =========================================================
   BOTÓN NUEVO USUARIO
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
   BOTÓN NUEVA MAQUETA
   ========================================================= */

const btnNuevaMaqueta =
    document.getElementById(
        "btnNuevaMaqueta"
    );


if (btnNuevaMaqueta) {

    btnNuevaMaqueta.addEventListener(
        "click",
        () => {

            const modal =
                document.getElementById(
                    "modalMaqueta"
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
   INICIALIZAR PANEL
   ========================================================= */

(async () => {

    const perfil =
        await comprobarAdministrador();


    if (!perfil) {

        return;

    }


    await cargarUsuarios();

    await cargarMaquetas();

    await cargarReservas();

})();
