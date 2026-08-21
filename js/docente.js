// =========================================================
// DOCENTE.JS
// Sistema de Reserva de Maquetas CETA
// =========================================================


// =========================================================
// INICIALIZAR SUPABASE
// =========================================================

const { createClient } = supabase;

const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
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

        return;
    }


    const session = data.session;


    if (!session) {

        window.location.href = "index.html";

        return;
    }


    console.log(
        "Sesión iniciada:",
        session.user.email
    );


    await cargarDatosDocente(
        session.user.id
    );

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

            .select("usuario, nombre, rol")

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


        // Intentamos utilizar el campo nombre
        // y si no existe usamos usuario.

        const nombre =
            data.nombre ||
            data.usuario ||
            "Usuario";


        nombreDocente.textContent =
            nombre;


    } catch (error) {

        console.error(
            "Error:",
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

            .select(
                "id, codigo, nombre, descripcion, disponible"
            )

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


                option.value =
                    maqueta.id;


                option.textContent =
                    `${maqueta.codigo} - ${maqueta.nombre}`;


                option.dataset.nombre =
                    maqueta.nombre;


                option.dataset.codigo =
                    maqueta.codigo;


                maquetaReserva.appendChild(
                    option
                );

            }
        );


        estadoMaqueta.textContent =
            `${data.length} maqueta(s) disponible(s).`;

        estadoMaqueta.className =
            "maqueta-disponible";


    } catch (error) {

        console.error(
            "Error inesperado:",
            error
        );

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
            `Maqueta seleccionada: ${option.textContent}`;

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

    }
);


// =========================================================
// INICIAR
// =========================================================

async function iniciarPagina() {

    await comprobarSesion();

    await cargarMaquetas();

}


iniciarPagina();
