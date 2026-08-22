// =========================================================
// DOCENTE.JS
// Sistema de Reserva de Maquetas CETA
// Hasta 3 maquetas por reserva
// =========================================================


// =========================================================
// SUPABASE
// =========================================================

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =========================================================
// VARIABLES
// =========================================================

let usuarioActual = null;

let perfilActual = null;

let inicioSemanaActual =
    obtenerLunes(
        new Date()
    );

let listaMaquetas = [];

let maquetasOcupadasHorario =
    new Set();


// =========================================================
// ELEMENTOS
// =========================================================

const nombreDocente =
    document.getElementById(
        "nombreDocente"
    );

const formReserva =
    document.getElementById(
        "formReserva"
    );

const grupoReserva =
    document.getElementById(
        "grupoReserva"
    );

const tituloTema =
    document.getElementById(
        "tituloTema"
    );

const fechaReserva =
    document.getElementById(
        "fechaReserva"
    );

const diaSeleccionado =
    document.getElementById(
        "diaSeleccionado"
    );

const horarioReserva =
    document.getElementById(
        "horarioReserva"
    );


// =========================================================
// MAQUETAS
// =========================================================

const maquetaReserva =
    document.getElementById(
        "maquetaReserva"
    );

const maquetaReserva2 =
    document.getElementById(
        "maquetaReserva2"
    );

const maquetaReserva3 =
    document.getElementById(
        "maquetaReserva3"
    );

const bloqueMaqueta2 =
    document.getElementById(
        "bloqueMaqueta2"
    );

const bloqueMaqueta3 =
    document.getElementById(
        "bloqueMaqueta3"
    );

const btnAgregarMaqueta2 =
    document.getElementById(
        "btnAgregarMaqueta2"
    );

const btnAgregarMaqueta3 =
    document.getElementById(
        "btnAgregarMaqueta3"
    );

const btnQuitarMaqueta2 =
    document.getElementById(
        "btnQuitarMaqueta2"
    );

const btnQuitarMaqueta3 =
    document.getElementById(
        "btnQuitarMaqueta3"
    );

const estadoMaqueta =
    document.getElementById(
        "estadoMaqueta"
    );


// =========================================================
// ÁREA
// =========================================================

const areaReserva =
    document.getElementById(
        "areaReserva"
    );

const listaAreasLibres =
    document.getElementById(
        "listaAreasLibres"
    );


// =========================================================
// OTROS
// =========================================================

const mensajeReserva =
    document.getElementById(
        "mensajeReserva"
    );

const btnReservar =
    document.getElementById(
        "btnReservar"
    );

const btnCerrarSesionDocente =
    document.getElementById(
        "btnCerrarSesionDocente"
    );

const btnSemanaAnterior =
    document.getElementById(
        "btnSemanaAnterior"
    );

const btnSemanaActual =
    document.getElementById(
        "btnSemanaActual"
    );

const btnSemanaSiguiente =
    document.getElementById(
        "btnSemanaSiguiente"
    );

const textoSemana =
    document.getElementById(
        "textoSemana"
    );

const tablaSemana =
    document.getElementById(
        "tablaSemana"
    );


// =========================================================
// FECHAS
// =========================================================

function fechaLocalISO(fecha) {

    const anio =
        fecha.getFullYear();

    const mes =
        String(
            fecha.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const dia =
        String(
            fecha.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${anio}-${mes}-${dia}`;
}


function fechaDesdeISO(fechaISO) {

    const partes =
        fechaISO.split("-");

    return new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
    );
}


function obtenerLunes(fecha) {

    const resultado =
        new Date(
            fecha.getFullYear(),
            fecha.getMonth(),
            fecha.getDate()
        );

    const dia =
        resultado.getDay();

    const diferencia =
        dia === 0
            ? -6
            : 1 - dia;

    resultado.setDate(
        resultado.getDate() +
        diferencia
    );

    resultado.setHours(
        0,
        0,
        0,
        0
    );

    return resultado;
}


function sumarDias(
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


function nombreDia(fecha) {

    const dias = [
        "domingo",
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado"
    ];

    return dias[
        fecha.getDay()
    ];
}


function nombreDiaVisible(fecha) {

    const dias = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado"
    ];

    return dias[
        fecha.getDay()
    ];
}


function formatearFecha(fecha) {

    return fecha.toLocaleDateString(
        "es-BO",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


// =========================================================
// ESCAPAR HTML
// =========================================================

function escaparHTML(valor) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(
            valor ?? ""
        );

    return div.innerHTML;
}


// =========================================================
// MENSAJES
// =========================================================

function mostrarMensaje(
    texto,
    correcto
) {

    mensajeReserva.textContent =
        texto;

    mensajeReserva.style.color =
        correcto
            ? "#15803d"
            : "#b91c1c";
}


// =========================================================
// SESIÓN
// =========================================================

async function comprobarSesion() {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (
        error ||
        !data.session
    ) {

        window.location.href =
            "index.html";

        return false;
    }


    usuarioActual =
        data.session.user;


    console.log(
        "Sesión activa:",
        usuarioActual.email
    );


    return await cargarDatosDocente(
        usuarioActual.id
    );
}


// =========================================================
// PERFIL
// =========================================================

async function cargarDatosDocente(uid) {

    const {
        data,
        error
    } =
        await supabaseClient

            .from("perfiles")

            .select(
                "id, usuario, nombre, rol, activo, eliminado"
            )

            .eq(
                "id",
                uid
            )

            .single();


    if (
        error ||
        !data
    ) {

        console.error(
            "Error cargando perfil:",
            error
        );

        return false;
    }


    if (
        !data.activo ||
        data.eliminado === true
    ) {

        await supabaseClient
            .auth
            .signOut();

        window.location.href =
            "index.html";

        return false;
    }


    if (
        data.rol !==
        "docente"
    ) {

        if (
            data.rol ===
            "administrador"
        ) {

            window.location.href =
                "admin.html";

        } else {

            await supabaseClient
                .auth
                .signOut();

            window.location.href =
                "index.html";
        }

        return false;
    }


    perfilActual =
        data;


    nombreDocente.textContent =
        data.nombre ||
        data.usuario ||
        "Docente";


    return true;
}


// =========================================================
// CARGAR MAQUETAS
// =========================================================

async function cargarMaquetasBase() {

    const {
        data,
        error
    } =
        await supabaseClient

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

        listaMaquetas = [];

        return;
    }


    listaMaquetas =
        data || [];


    console.log(
        "Maquetas habilitadas:",
        listaMaquetas
    );


    maquetasOcupadasHorario =
        new Set();


    actualizarOpcionesMaquetas();
}


// =========================================================
// SELECTORES DE MAQUETAS
// =========================================================

function obtenerMaquetasSeleccionadas() {

    return [
        maquetaReserva.value,
        maquetaReserva2.value,
        maquetaReserva3.value
    ]
        .filter(Boolean)
        .map(String);
}


function llenarSelectorMaqueta(
    selector,
    valorActual,
    valoresOtros
) {

    selector.innerHTML = `
        <option value="">
            Seleccione una maqueta
        </option>
    `;


    listaMaquetas.forEach(
        maqueta => {

            const id =
                String(
                    maqueta.id
                );


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                id;


            option.textContent =
                `${maqueta.codigo} - ${maqueta.nombre}`;


            const ocupada =
                maquetasOcupadasHorario
                    .has(id);


            const usadaEnOtroSelector =
                valoresOtros
                    .includes(id);


            if (
                ocupada ||
                usadaEnOtroSelector
            ) {

                option.disabled =
                    true;


                if (ocupada) {

                    option.textContent +=
                        " — RESERVADA";

                } else {

                    option.textContent +=
                        " — YA SELECCIONADA";
                }
            }


            selector.appendChild(
                option
            );
        }
    );


    if (
        valorActual &&
        !maquetasOcupadasHorario
            .has(
                String(valorActual)
            ) &&
        !valoresOtros
            .includes(
                String(valorActual)
            )
    ) {

        selector.value =
            String(valorActual);

    } else {

        selector.value =
            "";
    }
}


function actualizarOpcionesMaquetas() {

    const valor1 =
        maquetaReserva.value;

    const valor2 =
        maquetaReserva2.value;

    const valor3 =
        maquetaReserva3.value;


    llenarSelectorMaqueta(
        maquetaReserva,
        valor1,
        [
            valor2,
            valor3
        ].filter(Boolean)
    );


    llenarSelectorMaqueta(
        maquetaReserva2,
        valor2,
        [
            valor1,
            valor3
        ].filter(Boolean)
    );


    llenarSelectorMaqueta(
        maquetaReserva3,
        valor3,
        [
            valor1,
            valor2
        ].filter(Boolean)
    );


    const disponibles =
        listaMaquetas.filter(
            maqueta =>
                !maquetasOcupadasHorario
                    .has(
                        String(
                            maqueta.id
                        )
                    )
        ).length;


    if (
        disponibles > 0
    ) {

        estadoMaqueta.textContent =
            `${disponibles} maqueta(s) disponible(s) en este horario.`;

        estadoMaqueta.className =
            "maqueta-disponible";

    } else {

        estadoMaqueta.textContent =
            "No existen maquetas disponibles en este horario.";

        estadoMaqueta.className =
            "maqueta-ocupada";
    }
}


// =========================================================
// CAMBIO DE SELECTORES
// =========================================================

[
    maquetaReserva,
    maquetaReserva2,
    maquetaReserva3
].forEach(
    selector => {

        selector.addEventListener(
            "change",
            () => {

                actualizarOpcionesMaquetas();

            }
        );
    }
);


// =========================================================
// MOSTRAR MAQUETA 2
// =========================================================

btnAgregarMaqueta2.addEventListener(
    "click",
    () => {

        bloqueMaqueta2.hidden =
            false;

        btnAgregarMaqueta2.hidden =
            true;

        btnAgregarMaqueta3.hidden =
            false;

        actualizarOpcionesMaquetas();
    }
);


// =========================================================
// QUITAR MAQUETA 2
// =========================================================

btnQuitarMaqueta2.addEventListener(
    "click",
    () => {

        maquetaReserva2.value =
            "";

        maquetaReserva3.value =
            "";

        bloqueMaqueta2.hidden =
            true;

        bloqueMaqueta3.hidden =
            true;

        btnAgregarMaqueta2.hidden =
            false;

        btnAgregarMaqueta3.hidden =
            true;

        actualizarOpcionesMaquetas();
    }
);


// =========================================================
// MOSTRAR MAQUETA 3
// =========================================================

btnAgregarMaqueta3.addEventListener(
    "click",
    () => {

        bloqueMaqueta3.hidden =
            false;

        btnAgregarMaqueta3.hidden =
            true;

        actualizarOpcionesMaquetas();
    }
);


// =========================================================
// QUITAR MAQUETA 3
// =========================================================

btnQuitarMaqueta3.addEventListener(
    "click",
    () => {

        maquetaReserva3.value =
            "";

        bloqueMaqueta3.hidden =
            true;

        btnAgregarMaqueta3.hidden =
            false;

        actualizarOpcionesMaquetas();
    }
);


// =========================================================
// DISPONIBILIDAD GENERAL
// =========================================================

async function actualizarDisponibilidad() {

    const fecha =
        fechaReserva.value;

    const horario =
        horarioReserva.value;


    if (
        !fecha ||
        !horario
    ) {

        maquetasOcupadasHorario =
            new Set();

        actualizarOpcionesMaquetas();


        areaReserva.innerHTML = `
            <option value="">
                Seleccione primero fecha y horario
            </option>
        `;


        listaAreasLibres.textContent =
            "Seleccione una fecha y un horario para conocer las áreas especialmente disponibles para práctica.";


        return;
    }


    const fechaObjeto =
        fechaDesdeISO(
            fecha
        );


    const dia =
        nombreDia(
            fechaObjeto
        );


    if (
        dia === "sabado" ||
        dia === "domingo"
    ) {

        areaReserva.innerHTML = `
            <option value="">
                Día no disponible
            </option>
        `;


        maquetaReserva.innerHTML = `
            <option value="">
                Día no disponible
            </option>
        `;


        maquetaReserva2.innerHTML =
            maquetaReserva.innerHTML;

        maquetaReserva3.innerHTML =
            maquetaReserva.innerHTML;


        return;
    }


    await Promise.all([

        cargarMaquetasDisponibles(
            fecha,
            horario
        ),

        cargarAreasDisponibles(
            fecha,
            horario,
            dia
        )

    ]);
}


// =========================================================
// MAQUETAS OCUPADAS
// =========================================================

async function cargarMaquetasDisponibles(
    fecha,
    horario
) {

    const {
        data,
        error
    } =
        await supabaseClient

            .from("reservas")

            .select(`
                maqueta_id,
                maqueta_id_2,
                maqueta_id_3
            `)

            .eq(
                "fecha",
                fecha
            )

            .eq(
                "horario",
                horario
            )

            .eq(
                "estado",
                "activa"
            );


    if (error) {

        console.error(
            "Error consultando maquetas ocupadas:",
            error
        );

        return;
    }


    const ocupadas =
        new Set();


    (data || []).forEach(
        reserva => {

            [
                reserva.maqueta_id,
                reserva.maqueta_id_2,
                reserva.maqueta_id_3
            ]
                .filter(Boolean)
                .forEach(
                    id =>
                        ocupadas.add(
                            String(id)
                        )
                );
        }
    );


    maquetasOcupadasHorario =
        ocupadas;


    actualizarOpcionesMaquetas();
}


// =========================================================
// ÁREAS
// =========================================================

async function cargarAreasDisponibles(
    fecha,
    horario,
    dia
) {

    const {
        data: areas,
        error: errorAreas
    } =
        await supabaseClient

            .from("areas_taller")

            .select(
                "codigo, nombre, activa"
            )

            .eq(
                "activa",
                true
            )

            .order(
                "codigo"
            );


    if (errorAreas) {

        console.error(
            errorAreas
        );

        return;
    }


    const {
        data: libres,
        error: errorLibres
    } =
        await supabaseClient

            .from("areas_libres")

            .select(
                "area_codigo"
            )

            .eq(
                "dia_semana",
                dia
            )

            .eq(
                "horario",
                horario
            );


    if (errorLibres) {

        console.error(
            errorLibres
        );

        return;
    }


    const {
        data: reservas,
        error: errorReservas
    } =
        await supabaseClient

            .from("reservas")

            .select(
                "area_codigo"
            )

            .eq(
                "fecha",
                fecha
            )

            .eq(
                "horario",
                horario
            )

            .eq(
                "estado",
                "activa"
            );


    if (errorReservas) {

        console.error(
            errorReservas
        );

        return;
    }


    const areasLibres =
        new Set(
            (libres || [])
                .map(
                    item =>
                        item.area_codigo
                )
        );


    const areasOcupadas =
        new Set(
            (reservas || [])
                .map(
                    item =>
                        item.area_codigo
                )
                .filter(Boolean)
        );


    const libresDisponibles =
        [...areasLibres]
            .filter(
                codigo =>
                    !areasOcupadas
                        .has(codigo)
            )
            .sort();


    if (
        libresDisponibles.length
    ) {

        listaAreasLibres.innerHTML =
            libresDisponibles
                .map(
                    codigo =>
                        `<strong>${codigo}</strong>`
                )
                .join(" • ");

    } else {

        listaAreasLibres.textContent =
            "Las áreas libres para práctica de este horario ya están reservadas.";
    }


    areaReserva.innerHTML = `
        <option value="">
            Seleccione un área
        </option>
    `;


    [...(areas || [])]
        .sort(
            (a, b) => {

                const libreA =
                    areasLibres.has(
                        a.codigo
                    );

                const libreB =
                    areasLibres.has(
                        b.codigo
                    );


                if (
                    libreA &&
                    !libreB
                ) {

                    return -1;
                }


                if (
                    !libreA &&
                    libreB
                ) {

                    return 1;
                }


                return a.codigo
                    .localeCompare(
                        b.codigo
                    );
            }
        )
        .forEach(
            area => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    area.codigo;


                if (
                    areasOcupadas
                        .has(
                            area.codigo
                        )
                ) {

                    option.textContent =
                        `🔴 ${area.codigo} — RESERVADA`;

                    option.disabled =
                        true;

                } else if (
                    areasLibres
                        .has(
                            area.codigo
                        )
                ) {

                    option.textContent =
                        `⭐ ${area.codigo} — Área libre para práctica`;

                } else {

                    option.textContent =
                        `${area.codigo} — Disponible`;
                }


                areaReserva.appendChild(
                    option
                );
            }
        );
}


// =========================================================
// FECHA
// =========================================================

fechaReserva.addEventListener(
    "change",
    async () => {

        if (
            !fechaReserva.value
        ) {

            diaSeleccionado.textContent =
                "Seleccione una fecha";

            return;
        }


        const fecha =
            fechaDesdeISO(
                fechaReserva.value
            );


        if (
            fecha.getDay() === 0 ||
            fecha.getDay() === 6
        ) {

            diaSeleccionado.textContent =
                "⚠ Las reservas solo están disponibles de lunes a viernes.";

            diaSeleccionado.style.color =
                "#b91c1c";

        } else {

            diaSeleccionado.textContent =
                `${nombreDiaVisible(fecha)} (${formatearFecha(fecha)})`;

            diaSeleccionado.style.color =
                "#15803d";
        }


        await actualizarDisponibilidad();
    }
);


// =========================================================
// HORARIO
// =========================================================

horarioReserva.addEventListener(
    "change",
    actualizarDisponibilidad
);


// =========================================================
// REGISTRAR
// =========================================================

formReserva.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        mensajeReserva.textContent =
            "";


        const grupo =
            grupoReserva.value.trim();

        const titulo =
            tituloTema.value.trim();

        const fecha =
            fechaReserva.value;

        const horario =
            horarioReserva.value;

        const areaCodigo =
            areaReserva.value;

        const maqueta1 =
            maquetaReserva.value;

        const maqueta2 =
            bloqueMaqueta2.hidden
                ? ""
                : maquetaReserva2.value;

        const maqueta3 =
            bloqueMaqueta3.hidden
                ? ""
                : maquetaReserva3.value;


        if (
            !grupo ||
            !titulo ||
            !fecha ||
            !horario ||
            !areaCodigo ||
            !maqueta1
        ) {

            mostrarMensaje(
                "Complete todos los campos obligatorios.",
                false
            );

            return;
        }


        const seleccionadas =
            [
                maqueta1,
                maqueta2,
                maqueta3
            ].filter(Boolean);


        if (
            new Set(
                seleccionadas
            ).size !==
            seleccionadas.length
        ) {

            mostrarMensaje(
                "No puede seleccionar la misma maqueta más de una vez.",
                false
            );

            return;
        }


        const fechaObjeto =
            fechaDesdeISO(
                fecha
            );


        const hoy =
            new Date();

        hoy.setHours(
            0,
            0,
            0,
            0
        );


        if (
            fechaObjeto < hoy
        ) {

            mostrarMensaje(
                "No puede reservar una fecha anterior.",
                false
            );

            return;
        }


        if (
            fechaObjeto.getDay() === 0 ||
            fechaObjeto.getDay() === 6
        ) {

            mostrarMensaje(
                "Solo puede reservar de lunes a viernes.",
                false
            );

            return;
        }


        btnReservar.disabled =
            true;

        btnReservar.textContent =
            "Registrando...";


        try {

            // =============================================
            // YA EXISTE RESERVA DE ESTE DOCENTE
            // =============================================

            const {
                data: reservaExistente,
                error: errorExistente
            } =
                await supabaseClient

                    .from("reservas")

                    .select("id")

                    .eq(
                        "usuario_id",
                        usuarioActual.id
                    )

                    .eq(
                        "fecha",
                        fecha
                    )

                    .eq(
                        "horario",
                        horario
                    )

                    .eq(
                        "estado",
                        "activa"
                    )

                    .limit(1);


            if (errorExistente) {

                throw errorExistente;
            }


            if (
                reservaExistente?.length
            ) {

                mostrarMensaje(
                    "Ya tiene una reserva activa para esta fecha y horario. Puede registrar hasta 3 maquetas dentro de una misma reserva.",
                    false
                );

                return;
            }


            // =============================================
            // COMPROBAR MAQUETAS NUEVAMENTE
            // =============================================

            const {
                data: reservasHorario,
                error: errorHorario
            } =
                await supabaseClient

                    .from("reservas")

                    .select(`
                        maqueta_id,
                        maqueta_id_2,
                        maqueta_id_3
                    `)

                    .eq(
                        "fecha",
                        fecha
                    )

                    .eq(
                        "horario",
                        horario
                    )

                    .eq(
                        "estado",
                        "activa"
                    );


            if (errorHorario) {

                throw errorHorario;
            }


            const ocupadas =
                new Set();


            (reservasHorario || [])
                .forEach(
                    reserva => {

                        [
                            reserva.maqueta_id,
                            reserva.maqueta_id_2,
                            reserva.maqueta_id_3
                        ]
                            .filter(Boolean)
                            .forEach(
                                id =>
                                    ocupadas.add(
                                        String(id)
                                    )
                            );
                    }
                );


            const existeConflicto =
                seleccionadas.some(
                    id =>
                        ocupadas.has(
                            String(id)
                        )
                );


            if (existeConflicto) {

                mostrarMensaje(
                    "Una de las maquetas acaba de ser reservada por otro docente.",
                    false
                );

                await actualizarDisponibilidad();

                return;
            }


            // =============================================
            // COMPROBAR ÁREA
            // =============================================

            const {
                data: areaOcupada,
                error: errorArea
            } =
                await supabaseClient

                    .from("reservas")

                    .select("id")

                    .eq(
                        "fecha",
                        fecha
                    )

                    .eq(
                        "horario",
                        horario
                    )

                    .eq(
                        "area_codigo",
                        areaCodigo
                    )

                    .eq(
                        "estado",
                        "activa"
                    )

                    .limit(1);


            if (errorArea) {

                throw errorArea;
            }


            if (
                areaOcupada?.length
            ) {

                mostrarMensaje(
                    "El área acaba de ser reservada por otro docente.",
                    false
                );

                await actualizarDisponibilidad();

                return;
            }


            // =============================================
            // INSERT
            // =============================================

            const {
                error
            } =
                await supabaseClient

                    .from("reservas")

                    .insert({

                        usuario_id:
                            usuarioActual.id,

                        grupo,

                        fecha,

                        horario,

                        maqueta_id:
                            Number(
                                maqueta1
                            ),

                        maqueta_id_2:
                            maqueta2
                                ? Number(
                                    maqueta2
                                )
                                : null,

                        maqueta_id_3:
                            maqueta3
                                ? Number(
                                    maqueta3
                                )
                                : null,

                        area_codigo:
                            areaCodigo,

                        titulo_tema:
                            titulo,

                        estado:
                            "activa"

                    });


            if (error) {

                throw error;
            }


            mostrarMensaje(
                `✓ Reserva registrada correctamente con ${seleccionadas.length} maqueta(s).`,
                true
            );


            grupoReserva.value =
                "";

            tituloTema.value =
                "";

            maquetaReserva.value =
                "";

            maquetaReserva2.value =
                "";

            maquetaReserva3.value =
                "";

            areaReserva.value =
                "";


            bloqueMaqueta2.hidden =
                true;

            bloqueMaqueta3.hidden =
                true;

            btnAgregarMaqueta2.hidden =
                false;

            btnAgregarMaqueta3.hidden =
                true;


            inicioSemanaActual =
                obtenerLunes(
                    fechaObjeto
                );


            await actualizarDisponibilidad();

            await cargarTablaSemanal();


        } catch (error) {

            console.error(
                "Error registrando reserva:",
                error
            );


            mostrarMensaje(
                error?.message ||
                "No fue posible registrar la reserva.",
                false
            );


        } finally {

            btnReservar.disabled =
                false;

            btnReservar.textContent =
                "📅 Registrar reserva";
        }
    }
);


// =========================================================
// TABLA SEMANAL
// =========================================================

async function cargarTablaSemanal() {

    const lunes =
        new Date(
            inicioSemanaActual
        );


    const viernes =
        sumarDias(
            lunes,
            4
        );


    textoSemana.textContent =
        `${formatearFecha(lunes)} al ${formatearFecha(viernes)}`;


    actualizarEncabezadosTabla(
        lunes
    );


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
                estado
            `)

            .gte(
                "fecha",
                fechaLocalISO(lunes)
            )

            .lte(
                "fecha",
                fechaLocalISO(viernes)
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

        mostrarErrorTabla();

        return;
    }


    const usuarios =
        [
            ...new Set(
                (reservas || [])
                    .map(
                        reserva =>
                            reserva.usuario_id
                    )
                    .filter(Boolean)
            )
        ];


    let perfiles = [];


    if (
        usuarios.length
    ) {

        const {
            data
        } =
            await supabaseClient

                .from("perfiles")

                .select(
                    "id, nombre, usuario"
                )

                .in(
                    "id",
                    usuarios
                );


        perfiles =
            data || [];
    }


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


    // =====================================================
    // TODOS LOS IDS DE MAQUETAS DE LAS RESERVAS
    // =====================================================

    const idsMaquetas =
        [
            ...new Set(
                (reservas || [])
                    .flatMap(
                        reserva => [
                            reserva.maqueta_id,
                            reserva.maqueta_id_2,
                            reserva.maqueta_id_3
                        ]
                    )
                    .filter(Boolean)
                    .map(String)
            )
        ];


    let maquetasTabla = [];


    if (
        idsMaquetas.length
    ) {

        const {
            data
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


        maquetasTabla =
            data || [];
    }


    const mapaMaquetas =
        new Map();


    maquetasTabla.forEach(
        maqueta => {

            mapaMaquetas.set(

                String(
                    maqueta.id
                ),

                `${maqueta.codigo} - ${maqueta.nombre}`

            );

        }
    );


    renderizarTablaSemanal(

        reservas || [],

        mapaPerfiles,

        mapaMaquetas,

        lunes

    );
}


// =========================================================
// ENCABEZADOS
// =========================================================

function actualizarEncabezadosTabla(
    lunes
) {

    const encabezados =
        tablaSemana
            .querySelectorAll(
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
            sumarDias(
                lunes,
                i
            );


        encabezados[
            i + 1
        ].innerHTML =
            `${nombres[i]}<br><small>${formatearFecha(fecha)}</small>`;
    }
}


// =========================================================
// RENDERIZAR TABLA
// =========================================================

function renderizarTablaSemanal(
    reservas,
    mapaPerfiles,
    mapaMaquetas,
    lunes
) {

    const tbody =
        tablaSemana
            .querySelector(
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
                    sumarDias(
                        lunes,
                        dia
                    );


                const fechaISO =
                    fechaLocalISO(
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


                if (
                    !lista.length
                ) {

                    celda.innerHTML = `
                        <span class="reserva-libre">
                            Sin reservas
                        </span>
                    `;

                } else {

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


                            const ids =
                                [
                                    reserva.maqueta_id,
                                    reserva.maqueta_id_2,
                                    reserva.maqueta_id_3
                                ]
                                .filter(Boolean);


                            const nombresMaquetas =
                                ids.map(
                                    id =>
                                        mapaMaquetas.get(
                                            String(id)
                                        ) ||
                                        "Maqueta"
                                );


                            tarjeta.innerHTML = `

                                <div class="lista-maquetas-reserva">

                                    ${nombresMaquetas
                                        .map(
                                            (nombre, indice) => `
                                                <strong class="maqueta-reservada-item">
                                                    🔧 ${indice + 1}. ${escaparHTML(nombre)}
                                                </strong>
                                            `
                                        )
                                        .join("")}

                                </div>


                                <span>
                                    👤 ${escaparHTML(docente)}
                                </span>


                                <span>
                                    👥 Grupo:
                                    ${escaparHTML(
                                        reserva.grupo ||
                                        "-"
                                    )}
                                </span>


                                <span>
                                    📍 Área:
                                    ${escaparHTML(
                                        reserva.area_codigo ||
                                        "-"
                                    )}
                                </span>

                            `;


                            if (
                                usuarioActual &&
                                reserva.usuario_id ===
                                    usuarioActual.id
                            ) {

                                const boton =
                                    document.createElement(
                                        "button"
                                    );


                                boton.type =
                                    "button";

                                boton.className =
                                    "btn-cancelar-reserva";

                                boton.textContent =
                                    "✖ Cancelar mi reserva";


                                boton.addEventListener(
                                    "click",
                                    () =>
                                        cancelarReservaDocente(
                                            reserva.id
                                        )
                                );


                                tarjeta.appendChild(
                                    boton
                                );
                            }


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
// CANCELAR
// =========================================================

async function cancelarReservaDocente(
    reservaId
) {

    if (
        !usuarioActual
    ) {

        return;
    }


    if (
        !confirm(
            "¿Desea cancelar esta reserva? Todas las maquetas seleccionadas y el área volverán a quedar disponibles."
        )
    ) {

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
                    "usuario_id",
                    usuarioActual.id
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
            !data?.length
        ) {

            mostrarMensaje(
                "La reserva ya fue cancelada o no pudo modificarse.",
                false
            );

            return;
        }


        mostrarMensaje(
            "✓ Reserva cancelada correctamente.",
            true
        );


        await actualizarDisponibilidad();

        await cargarTablaSemanal();


    } catch (error) {

        console.error(
            "Error cancelando reserva:",
            error
        );


        mostrarMensaje(
            "No fue posible cancelar la reserva.",
            false
        );
    }
}


// =========================================================
// ERROR TABLA
// =========================================================

function mostrarErrorTabla() {

    tablaSemana
        .querySelectorAll(
            "tbody td"
        )
        .forEach(
            celda => {

                celda.textContent =
                    "Error al cargar";

            }
        );
}


// =========================================================
// SEMANAS
// =========================================================

btnSemanaAnterior.addEventListener(
    "click",
    async () => {

        inicioSemanaActual =
            sumarDias(
                inicioSemanaActual,
                -7
            );

        await cargarTablaSemanal();
    }
);


btnSemanaActual.addEventListener(
    "click",
    async () => {

        inicioSemanaActual =
            obtenerLunes(
                new Date()
            );

        await cargarTablaSemanal();
    }
);


btnSemanaSiguiente.addEventListener(
    "click",
    async () => {

        inicioSemanaActual =
            sumarDias(
                inicioSemanaActual,
                7
            );

        await cargarTablaSemanal();
    }
);


// =========================================================
// CERRAR SESIÓN
// =========================================================

btnCerrarSesionDocente.addEventListener(
    "click",
    async () => {

        await supabaseClient
            .auth
            .signOut();

        sessionStorage.removeItem(
            "ceta_usuario"
        );

        window.location.href =
            "index.html";
    }
);


// =========================================================
// FECHA MÍNIMA
// =========================================================

function configurarFechaMinima() {

    fechaReserva.min =
        fechaLocalISO(
            new Date()
        );
}


// =========================================================
// INICIO
// =========================================================

async function iniciarPagina() {

    console.log(
        "Iniciando página del docente..."
    );


    configurarFechaMinima();


    const sesionActiva =
        await comprobarSesion();


    if (
        !sesionActiva
    ) {

        return;
    }


    await cargarMaquetasBase();

    await cargarTablaSemanal();


    console.log(
        "Página del docente iniciada correctamente."
    );
}


// =========================================================
// EJECUTAR
// =========================================================

iniciarPagina();
