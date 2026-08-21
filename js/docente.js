// =========================================================
// DOCENTE.JS
// Sistema de Reserva de Maquetas CETA
// =========================================================


// =========================================================
// INICIALIZAR SUPABASE
// =========================================================

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =========================================================
// ELEMENTOS HTML
// =========================================================

const nombreDocente =
    document.getElementById("nombreDocente");

const maquetaReserva =
    document.getElementById("maquetaReserva");

const estadoMaqueta =
    document.getElementById("estadoMaqueta");

const btnCerrarSesionDocente =
    document.getElementById("btnCerrarSesionDocente");


// =========================================================
// COMPROBAR SESIÓN
// =========================================================

async function comprobarSesion() {

    const {
        data,
        error
    } = await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Error comprobando sesión:",
            error
        );

        window.location.href = "index.html";

        return false;
    }


    const session = data.session;


    if (!session) {

        console.log(
            "No existe una sesión activa."
        );

        window.location.href = "index.html";

        return false;
    }


    console.log(
        "Sesión activa:",
        session.user.email
    );


    await cargarDatosDocente(
        session.user.id
    );


    return true;
}


// =========================================================
// CARGAR DATOS DEL DOCENTE
// =========================================================

async function cargarDatosDocente(uid) {

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("perfiles")

            .select("*")

            .eq("id", uid)

            .single();


        if (error) {

            console.error(
                "Error cargando perfil:",
                error
            );


            nombreDocente.textContent =
                "Usuario";

            return;
        }


        console.log(
            "Perfil encontrado:",
            data
        );


        /*
         * Intentamos obtener el nombre.
         *
         * Si tu tabla utiliza "nombre", se mostrará
         * ese campo.
         *
         * Si no existe o está vacío, utilizamos
         * "usuario".
         */

        const nombre =
            data.nombre ||
            data.usuario ||
            "Usuario";


        nombreDocente.textContent =
            nombre;


    } catch (error) {

        console.error(
            "Error inesperado cargando perfil:",
            error
        );

    }

}


// =========================================================
// CARGAR MAQUETAS
// =========================================================

async function cargarMaquetas() {

    try {

        maquetaReserva.innerHTML = `
            <option value="">
                Cargando maquetas...
            </option>
        `;


        const {
            data,
            error
        } = await supabaseClient

            .from("maquetas")

            .select(`
                id,
                codigo,
                nombre,
                descripcion,
                disponible
            `)

            .eq(
                "disponible",
                true
            )

            .order(
                "nombre",
                {
                    ascending: true
                }
            );


        if (error) {

            console.error(
                "Error cargando maquetas:",
                error
            );


            maquetaReserva.innerHTML = `
                <option value="">
                    Error al cargar maquetas
                </option>
            `;


            estadoMaqueta.textContent =
                "No fue posible cargar las maquetas.";

            estadoMaqueta.className =
                "maqueta-ocupada";

            return;
        }


        console.log(
            "Maquetas disponibles:",
            data
        );


        maquetaReserva.innerHTML = `
            <option value="">
                Seleccione una maqueta
            </option>
        `;


        if (!data || data.length === 0) {

            maquetaReserva.innerHTML = `
                <option value="">
                    No hay maquetas disponibles
                </option>
            `;


            estadoMaqueta.textContent =
                "Actualmente no existen maquetas habilitadas.";

            estadoMaqueta.className =
                "maqueta-ocupada";

            return;
        }


        data.forEach(
            maqueta => {

                const option =
                    document.createElement(
                        "option"
                    );


                /*
                 * El value será el ID de la maqueta.
                 */

                option.value =
                    maqueta.id;


                /*
                 * Lo que verá el docente.
                 */

                option.textContent =
                    `${maqueta.codigo} - ${maqueta.nombre}`;


                /*
                 * Guardamos información adicional
                 * para utilizarla posteriormente.
                 */

                option.dataset.nombre =
                    maqueta.nombre;

                option.dataset.codigo =
                    maqueta.codigo;

                option.dataset.descripcion =
                    maqueta.descripcion || "";


                maquetaReserva.appendChild(
                    option
                );

            }
        );


        estadoMaqueta.textContent =
            `${data.length} maqueta(s) habilitada(s).`;

        estadoMaqueta.className =
            "maqueta-disponible";


    } catch (error) {

        console.error(
            "Error inesperado cargando maquetas:",
            error
        );


        maquetaReserva.innerHTML = `
            <option value="">
                Error inesperado
            </option>
        `;

    }

}


// =========================================================
// CAMBIO DE MAQUETA
// =========================================================

maquetaReserva.addEventListener(
    "change",
    function () {

        const option =
            maquetaReserva.options[
                maquetaReserva.selectedIndex
            ];


        if (
            !option ||
            !option.value
        ) {

            estadoMaqueta.textContent =
                "Seleccione una maqueta.";

            estadoMaqueta.className =
                "";

            return;
        }


        estadoMaqueta.textContent =
            `✓ ${option.textContent} seleccionada`;

        estadoMaqueta.className =
            "maqueta-disponible";

    }
);


// =========================================================
// CERRAR SESIÓN
// =========================================================

btnCerrarSesionDocente.addEventListener(
    "click",
    async function () {

        try {

            const {
                error
            } = await supabaseClient.auth.signOut();


            if (error) {

                console.error(
                    "Error cerrando sesión:",
                    error
                );

                return;
            }


            window.location.href =
                "index.html";


        } catch (error) {

            console.error(
                "Error inesperado cerrando sesión:",
                error
            );

        }

    }
);


// =========================================================
// INICIAR PÁGINA
// =========================================================

async function iniciarPagina() {

    console.log(
        "Iniciando página del docente..."
    );


    const sesionActiva =
        await comprobarSesion();


    if (!sesionActiva) {

        return;

    }


    await cargarMaquetas();


    console.log(
        "Página del docente iniciada correctamente."
    );

}


// =========================================================
// EJECUTAR
// =========================================================

iniciarPagina();
