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


    document.getElementById(
        "nombreAdministrador"
    ).textContent =
        `Bienvenido, ${perfil.nombre}`;


    return perfil;
}


/* =========================================================
   CARGAR USUARIOS
   ========================================================= */

async function cargarUsuarios() {

    const tabla =
        document.getElementById("tablaUsuarios");


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

        console.error(error);

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


    tabla.innerHTML = data.map(usuario => {

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

    const {
        data,
        error
    } =
        await supabaseClient
            .from("maquetas")
            .select("*")
            .order("id");


    const tabla =
        document.getElementById(
            "tablaMaquetas"
        );


    if (error) {

        console.error(error);

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


    tabla.innerHTML = data.map(maqueta => `

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
                ${maqueta.disponible
                    ? "Disponible"
                    : "No disponible"}
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


    const tabla =
        document.getElementById(
            "tablaReservas"
        );


    if (error) {

        console.error(error);

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


    tabla.innerHTML = data.map(reserva => `

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
                ${reserva.grupo}
            </td>

            <td>
                ${reserva.estado}
            </td>

        </tr>

    `).join("");
}


/* =========================================================
   CREAR USUARIO
   ========================================================= */

document
    .getElementById("formUsuario")
    .addEventListener("submit", async (event) => {

        event.preventDefault();


        const nombre =
            document
                .getElementById("nuevoNombre")
                .value
                .trim();


        const usuario =
            document
                .getElementById("nuevoUsuario")
                .value
                .trim()
                .toLowerCase();


        const password =
            document
                .getElementById("nuevaPassword")
                .value;


        const rol =
            document
                .getElementById("nuevoRol")
                .value;


        const mensaje =
            document
                .getElementById("mensajeUsuario");


        mensaje.textContent =
            "Creando usuario...";


        try {

            /*
             * Obtener sesión actual
             */

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


            /*
             * Llamar a Edge Function
             */

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

                        body: JSON.stringify({

                            nombre: nombre,

                            usuario: usuario,

                            password: password,

                            rol: rol

                        })

                    }
                );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                console.error(resultado);

                mensaje.textContent =
                    resultado.error ||
                    "No se pudo crear el usuario.";

                return;
            }


            /*
             * Usuario creado
             */

            mensaje.textContent =
                "Usuario creado correctamente.";


            /*
             * Limpiar formulario
             */

            document
                .getElementById("formUsuario")
                .reset();


            /*
             * Actualizar tabla
             */

            await cargarUsuarios();


            /*
             * Cerrar ventana después
             * de un momento
             */

            setTimeout(() => {

                document
                    .getElementById("modalUsuario")
                    .classList
                    .remove("active");

                mensaje.textContent = "";

            }, 1200);


        } catch (error) {

            console.error(error);

            mensaje.textContent =
                "Error de conexión con el servidor.";

        }

    });


/* =========================================================
   NUEVO USUARIO
   ========================================================= */

document
    .getElementById("btnNuevoUsuario")
    .addEventListener("click", () => {

        document
            .getElementById("modalUsuario")
            .classList
            .add("active");

    });


/* =========================================================
   NUEVA MAQUETA
   ========================================================= */

document
    .getElementById("btnNuevaMaqueta")
    .addEventListener("click", () => {

        document
            .getElementById("modalMaqueta")
            .classList
            .add("active");

    });


/* =========================================================
   CERRAR MODALES
   ========================================================= */

document
    .querySelectorAll(".btnCerrarModal")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const modal =
                    document.getElementById(
                        button.dataset.modal
                    );

                modal.classList
                    .remove("active");

            }
        );

    });


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

document
    .getElementById("btnCerrarSesion")
    .addEventListener(
        "click",
        async () => {

            await supabaseClient
                .auth
                .signOut();

            window.location.href =
                "index.html";

        }
    );


/* =========================================================
   INICIALIZAR
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
