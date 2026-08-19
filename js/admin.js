const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================================================
   COMPROBAR SESIÓN
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


    const { data: perfil, error: errorPerfil } =
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
   CARGAR MAQUETAS
   ========================================================= */

async function cargarMaquetas() {

    const { data, error } =
        await supabaseClient
            .from("maquetas")
            .select("*")
            .order("id");


    const tabla =
        document.getElementById("tablaMaquetas");


    if (error) {

        tabla.innerHTML = `
            <tr>
                <td colspan="5">
                    Error al cargar las maquetas.
                </td>
            </tr>
        `;

        console.error(error);

        return;
    }


    if (!data.length) {

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

    const { data, error } =
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
            .order("fecha", { ascending: true });


    const tabla =
        document.getElementById("tablaReservas");


    if (error) {

        tabla.innerHTML = `
            <tr>
                <td colspan="6">
                    Error al cargar las reservas.
                </td>
            </tr>
        `;

        console.error(error);

        return;
    }


    if (!data.length) {

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
   CERRAR SESIÓN
   ========================================================= */

document
    .getElementById("btnCerrarSesion")
    .addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";

    });


/* =========================================================
   MODALES
   ========================================================= */

document
    .getElementById("btnNuevoUsuario")
    .addEventListener("click", () => {

        document
            .getElementById("modalUsuario")
            .classList.add("active");

    });


document
    .getElementById("btnNuevaMaqueta")
    .addEventListener("click", () => {

        document
            .getElementById("modalMaqueta")
            .classList.add("active");

    });


document
    .querySelectorAll(".btnCerrarModal")
    .forEach(button => {

        button.addEventListener("click", () => {

            const modal =
                document.getElementById(
                    button.dataset.modal
                );

            modal.classList.remove("active");

        });

    });


/* =========================================================
   INICIALIZAR
   ========================================================= */

(async () => {

    const perfil =
        await comprobarAdministrador();


    if (!perfil) return;


    await cargarMaquetas();

    await cargarReservas();

})();
