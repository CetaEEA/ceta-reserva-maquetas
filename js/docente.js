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
// VARIABLES GLOBALES
// =========================================================

let usuarioActual = null;
let perfilActual = null;
let inicioSemanaActual = obtenerLunes(new Date());
let listaMaquetas = [];


// =========================================================
// ELEMENTOS HTML
// =========================================================

const nombreDocente =
    document.getElementById("nombreDocente");

const formReserva =
    document.getElementById("formReserva");

const grupoReserva =
    document.getElementById("grupoReserva");

const tituloTema =
    document.getElementById("tituloTema");

const fechaReserva =
    document.getElementById("fechaReserva");

const diaSeleccionado =
    document.getElementById("diaSeleccionado");

const horarioReserva =
    document.getElementById("horarioReserva");

const maquetaReserva =
    document.getElementById("maquetaReserva");

const estadoMaqueta =
    document.getElementById("estadoMaqueta");

const areaReserva =
    document.getElementById("areaReserva");

const listaAreasLibres =
    document.getElementById("listaAreasLibres");

const mensajeReserva =
    document.getElementById("mensajeReserva");

const btnReservar =
    document.getElementById("btnReservar");

const btnCerrarSesionDocente =
    document.getElementById("btnCerrarSesionDocente");

const btnSemanaAnterior =
    document.getElementById("btnSemanaAnterior");

const btnSemanaActual =
    document.getElementById("btnSemanaActual");

const btnSemanaSiguiente =
    document.getElementById("btnSemanaSiguiente");

const textoSemana =
    document.getElementById("textoSemana");

const tablaSemana =
    document.getElementById("tablaSemana");


// =========================================================
// FUNCIONES DE FECHA
// =========================================================

function fechaLocalISO(fecha) {

    const anio =
        fecha.getFullYear();

    const mes =
        String(fecha.getMonth() + 1)
            .padStart(2, "0");

    const dia =
        String(fecha.getDate())
            .padStart(2, "0");

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
        resultado.getDate() + diferencia
    );

    resultado.setHours(
        0,
        0,
        0,
        0
    );

    return resultado;
}


function sumarDias(fecha, dias) {

    const resultado =
        new Date(fecha);

    resultado.setDate(
        resultado.getDate() + dias
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
// COMPROBAR SESIÓN
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

        console.error(
            "No existe una sesión válida:",
            error
        );

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


    const perfilCorrecto =
        await cargarDatosDocente(
            usuarioActual.id
        );


    return perfilCorrecto;
}


// =========================================================
// CARGAR PERFIL DOCENTE
// =========================================================

async function cargarDatosDocente(uid) {

    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from("perfiles")

                .select(
                    "id, usuario, nombre, rol, activo"
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


        if (!data.activo) {

            await supabaseClient
                .auth
                .signOut();

            window.location.href =
                "index.html";

            return false;
        }


        if (data.rol !== "docente") {

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


        console.log(
            "Perfil encontrado:",
            data
        );


        return true;


    } catch (error) {

        console.error(
            "Error inesperado cargando perfil:",
            error
        );

        return false;
    }
}


// =========================================================
// CARGAR MAQUETAS HABILITADAS
// =========================================================

async function cargarMaquetasBase() {

    try {

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


        mostrarMaquetasSinFiltro();


    } catch (error) {

        console.error(
            "Error inesperado cargando maquetas:",
            error
        );
    }
}


// =========================================================
// MOSTRAR MAQUETAS SIN FILTRO
// =========================================================

function mostrarMaquetasSinFiltro() {

    maquetaReserva.innerHTML = `
        <option value="">
            Seleccione una maqueta
        </option>
    `;


    listaMaquetas.forEach(
        maqueta => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                maqueta.id;


            option.textContent =
                `${maqueta.codigo} - ${maqueta.nombre}`;


            option.dataset.codigo =
                maqueta.codigo;

            option.dataset.nombre =
                maqueta.nombre;


            maquetaReserva.appendChild(
                option
            );
        }
    );


    if (
        listaMaquetas.length === 0
    ) {

        maquetaReserva.innerHTML = `
            <option value="">
                No hay maquetas habilitadas
            </option>
        `;

        estadoMaqueta.textContent =
            "Actualmente no existen maquetas habilitadas.";

        estadoMaqueta.className =
            "maqueta-ocupada";

        return;
    }


    estadoMaqueta.textContent =
        "Seleccione fecha y horario para comprobar disponibilidad.";

    estadoMaqueta.className =
        "";
}


// =========================================================
// ACTUALIZAR DISPONIBILIDAD
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

        mostrarMaquetasSinFiltro();


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
        fechaDesdeISO(fecha);

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


        listaAreasLibres.textContent =
            "Las reservas están habilitadas de lunes a viernes.";


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
// MAQUETAS DISPONIBLES
// =========================================================

async function cargarMaquetasDisponibles(
    fecha,
    horario
) {

    try {

        const {
            data: reservas,
            error
        } =
            await supabaseClient

                .from("reservas")

                .select(
                    "maqueta_id"
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


        if (error) {

            console.error(
                "Error consultando maquetas ocupadas:",
                error
            );

            return;
        }


        const ocupadas =
            new Set(
                (reservas || [])
                    .map(
                        reserva =>
                            String(
                                reserva.maqueta_id
                            )
                    )
            );


        maquetaReserva.innerHTML = `
            <option value="">
                Seleccione una maqueta
            </option>
        `;


        let disponibles = 0;


        listaMaquetas.forEach(
            maqueta => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    maqueta.id;


                option.dataset.codigo =
                    maqueta.codigo;

                option.dataset.nombre =
                    maqueta.nombre;


                if (
                    ocupadas.has(
                        String(maqueta.id)
                    )
                ) {

                    option.textContent =
                        `${maqueta.codigo} - ${maqueta.nombre} — RESERVADA`;

                    option.disabled =
                        true;

                } else {

                    option.textContent =
                        `${maqueta.codigo} - ${maqueta.nombre}`;

                    disponibles++;
                }


                maquetaReserva.appendChild(
                    option
                );
            }
        );


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


    } catch (error) {

        console.error(
            "Error inesperado consultando maquetas:",
            error
        );
    }
}


// =========================================================
// ÁREAS DISPONIBLES
// =========================================================

async function cargarAreasDisponibles(
    fecha,
    horario,
    dia
) {

    try {

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
                    "codigo",
                    {
                        ascending: true
                    }
                );


        if (errorAreas) {

            console.error(
                "Error cargando áreas:",
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
                "Error cargando áreas libres:",
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
                "Error consultando áreas reservadas:",
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
                    .filter(
                        item =>
                            item.area_codigo
                    )
                    .map(
                        item =>
                            item.area_codigo
                    )
            );


        const libresDisponibles =
            Array.from(
                areasLibres
            )
            .filter(
                codigo =>
                    !areasOcupadas.has(
                        codigo
                    )
            )
            .sort();


        if (
            libresDisponibles.length > 0
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
                "Las áreas destinadas a práctica para este horario ya se encuentran reservadas.";
        }


        areaReserva.innerHTML = `
            <option value="">
                Seleccione un área
            </option>
        `;


        const areasOrdenadas =
            [...(areas || [])]
                .sort(
                    (a, b) => {

                        const aLibre =
                            areasLibres.has(
                                a.codigo
                            );

                        const bLibre =
                            areasLibres.has(
                                b.codigo
                            );


                        if (
                            aLibre &&
                            !bLibre
                        ) {

                            return -1;
                        }


                        if (
                            !aLibre &&
                            bLibre
                        ) {

                            return 1;
                        }


                        return a.codigo
                            .localeCompare(
                                b.codigo
                            );
                    }
                );


        areasOrdenadas.forEach(
            area => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    area.codigo;


                if (
                    areasOcupadas.has(
                        area.codigo
                    )
                ) {

                    option.textContent =
                        `🔴 ${area.codigo} — RESERVADA`;

                    option.disabled =
                        true;


                } else if (
                    areasLibres.has(
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


    } catch (error) {

        console.error(
            "Error inesperado cargando áreas:",
            error
        );
    }
}


// =========================================================
// CAMBIO DE FECHA
// =========================================================

fechaReserva.addEventListener(
    "change",
    async function () {

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


        const dia =
            fecha.getDay();


        if (
            dia === 0 ||
            dia === 6
        ) {

            diaSeleccionado.textContent =
                "⚠ Las reservas solo están disponibles de lunes a viernes.";

            diaSeleccionado.style.color =
                "#b91c1c";


            await actualizarDisponibilidad();

            return;
        }


        diaSeleccionado.textContent =
            `${nombreDiaVisible(fecha)} (${formatearFecha(fecha)})`;

        diaSeleccionado.style.color =
            "#15803d";


        await actualizarDisponibilidad();
    }
);


// =========================================================
// CAMBIO DE HORARIO
// =========================================================

horarioReserva.addEventListener(
    "change",
    async function () {

        await actualizarDisponibilidad();

    }
);


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

            return;
        }


        estadoMaqueta.textContent =
            `✓ ${option.textContent} seleccionada`;

        estadoMaqueta.className =
            "maqueta-disponible";
    }
);


// =========================================================
// REGISTRAR RESERVA
// =========================================================

formReserva.addEventListener(
    "submit",
    async function (event) {

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

        const maquetaId =
            maquetaReserva.value;

        const areaCodigo =
            areaReserva.value;


        if (
            !grupo ||
            !titulo ||
            !fecha ||
            !horario ||
            !maquetaId ||
            !areaCodigo
        ) {

            mostrarMensaje(
                "Complete todos los campos.",
                false
            );

            return;
        }


        const fechaObjeto =
            fechaDesdeISO(
                fecha
            );


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
                "No puede registrar una reserva en una fecha anterior.",
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
            // COMPROBAR MAQUETA
            // =============================================

            const {
                data: maquetaOcupada,
                error: errorMaqueta
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
                        "maqueta_id",
                        maquetaId
                    )

                    .eq(
                        "estado",
                        "activa"
                    )

                    .limit(1);


            if (errorMaqueta) {

                throw errorMaqueta;
            }


            if (
                maquetaOcupada &&
                maquetaOcupada.length > 0
            ) {

                mostrarMensaje(
                    "La maqueta acaba de ser reservada por otro docente. Seleccione otra.",
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
                areaOcupada &&
                areaOcupada.length > 0
            ) {

                mostrarMensaje(
                    "El área acaba de ser reservada por otro docente. Seleccione otra.",
                    false
                );


                await actualizarDisponibilidad();

                return;
            }


            // =============================================
            // GUARDAR RESERVA
            // =============================================

            const {
                error
            } =
                await supabaseClient

                    .from("reservas")

                    .insert({

                        usuario_id:
                            usuarioActual.id,

                        grupo:
                            grupo,

                        fecha:
                            fecha,

                        horario:
                            horario,

                        maqueta_id:
                            Number(maquetaId),

                        area_codigo:
                            areaCodigo,

                        titulo_tema:
                            titulo,

                        estado:
                            "activa"

                    });


            if (error) {

                if (
                    error.code ===
                    "23505"
                ) {

                    mostrarMensaje(
                        "La maqueta o el área acaba de ser ocupada por otra reserva. Actualice su selección.",
                        false
                    );


                    await actualizarDisponibilidad();

                    return;
                }


                throw error;
            }


            mostrarMensaje(
                "✓ Reserva registrada correctamente.",
                true
            );


            grupoReserva.value =
                "";

            tituloTema.value =
                "";

            maquetaReserva.value =
                "";

            areaReserva.value =
                "";


            await actualizarDisponibilidad();


            inicioSemanaActual =
                obtenerLunes(
                    fechaObjeto
                );


            await cargarTablaSemanal();


        } catch (error) {

            console.error(
                "Error registrando reserva:",
                error
            );


            mostrarMensaje(
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
// MENSAJE
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


    const fechaInicio =
        fechaLocalISO(
            lunes
        );

    const fechaFin =
        fechaLocalISO(
            viernes
        );


    try {

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
                    area_codigo,
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
                    "fecha",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Error cargando reservas semanales:",
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
            usuarios.length > 0
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
                        usuarios
                    );


            if (!errorPerfiles) {

                perfiles =
                    data || [];
            }
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


        const mapaMaquetas =
            new Map();


        listaMaquetas.forEach(
            maqueta => {

                mapaMaquetas.set(
                    String(maqueta.id),
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


    } catch (error) {

        console.error(
            "Error inesperado cargando tabla:",
            error
        );

        mostrarErrorTabla();
    }
}


// =========================================================
// ENCABEZADOS DE TABLA
// =========================================================

function actualizarEncabezadosTabla(
    lunes
) {

    const encabezados =
        tablaSemana.querySelectorAll(
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
        tablaSemana.querySelector(
            "tbody"
        );


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


    tbody.innerHTML =
        "";


    horarios.forEach(
        horario => {

            const fila =
                document.createElement(
                    "tr"
                );


            const celdaHorario =
                document.createElement(
                    "th"
                );


            celdaHorario.textContent =
                horariosVisibles[
                    horario
                ];


            fila.appendChild(
                celdaHorario
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


                const reservasCelda =
                    reservas.filter(
                        reserva =>
                            reserva.fecha ===
                                fechaISO &&
                            reserva.horario ===
                                horario
                    );


                if (
                    reservasCelda.length === 0
                ) {

                    celda.innerHTML = `
                        <span class="reserva-libre">
                            Sin reservas
                        </span>
                    `;

                } else {

                    reservasCelda.forEach(
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


                            const maqueta =
                                mapaMaquetas.get(
                                    String(
                                        reserva.maqueta_id
                                    )
                                ) ||
                                "Maqueta";


                            tarjeta.innerHTML = `
                                <strong>
                                    ${escaparHTML(maqueta)}
                                </strong>

                                <span>
                                    👤 ${escaparHTML(docente)}
                                </span>

                                <span>
                                    👥 Grupo:
                                    ${escaparHTML(reserva.grupo || "-")}
                                </span>

                                <span>
                                    📍 Área:
                                    ${escaparHTML(reserva.area_codigo || "-")}
                                </span>
                            `;


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
// ERROR EN TABLA
// =========================================================

function mostrarErrorTabla() {

    const celdas =
        tablaSemana.querySelectorAll(
            "tbody td"
        );


    celdas.forEach(
        celda => {

            celda.textContent =
                "Error al cargar";
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
// SEMANA ANTERIOR
// =========================================================

btnSemanaAnterior.addEventListener(
    "click",
    async function () {

        inicioSemanaActual =
            sumarDias(
                inicioSemanaActual,
                -7
            );


        await cargarTablaSemanal();
    }
);


// =========================================================
// SEMANA ACTUAL
// =========================================================

btnSemanaActual.addEventListener(
    "click",
    async function () {

        inicioSemanaActual =
            obtenerLunes(
                new Date()
            );


        await cargarTablaSemanal();
    }
);


// =========================================================
// SEMANA SIGUIENTE
// =========================================================

btnSemanaSiguiente.addEventListener(
    "click",
    async function () {

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
    async function () {

        try {

            const {
                error
            } =
                await supabaseClient
                    .auth
                    .signOut();


            if (error) {

                console.error(
                    "Error cerrando sesión:",
                    error
                );

                return;
            }


            sessionStorage.removeItem(
                "ceta_usuario"
            );


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
// CONFIGURAR FECHA MÍNIMA
// =========================================================

function configurarFechaMinima() {

    const hoy =
        new Date();


    fechaReserva.min =
        fechaLocalISO(
            hoy
        );
}


// =========================================================
// INICIAR PÁGINA
// =========================================================

async function iniciarPagina() {

    console.log(
        "Iniciando página del docente..."
    );


    configurarFechaMinima();


    const sesionActiva =
        await comprobarSesion();


    if (!sesionActiva) {

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
