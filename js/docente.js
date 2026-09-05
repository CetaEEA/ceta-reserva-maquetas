// =========================================================

// DOCENTE.JS
// Sistema de Reserva de Maquetas CETA
// Hasta 2 maquetas por nueva reserva
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

const bloqueMaqueta2 =
    document.getElementById(
        "bloqueMaqueta2"
    );

const btnAgregarMaqueta2 =
    document.getElementById(
        "btnAgregarMaqueta2"
    );

const btnQuitarMaqueta2 =
    document.getElementById(
        "btnQuitarMaqueta2"
    );

const estadoMaqueta =
    document.getElementById(
        "estadoMaqueta"
    );


// =========================================================
// IMÁGENES DE MAQUETAS
// =========================================================

const imagenMaquetaReserva1 =
    document.getElementById(
        "imagenMaquetaReserva1"
    );

const imagenMaquetaReserva1Img =
    document.getElementById(
        "imagenMaquetaReserva1Img"
    );

const imagenMaquetaReserva2 =
    document.getElementById(
        "imagenMaquetaReserva2"
    );

const imagenMaquetaReserva2Img =
    document.getElementById(
        "imagenMaquetaReserva2Img"
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
                disponible,
                imagen_url
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
// IMAGEN DE LA MAQUETA SELECCIONADA
// =========================================================

function mostrarImagenMaqueta(
    idMaqueta,
    contenedor,
    imagen
) {

    if (
        !contenedor ||
        !imagen
    ) {

        return;
    }


    if (!idMaqueta) {

        imagen.src =
            "";

        contenedor.hidden =
            true;

        return;
    }


    const maqueta =
        listaMaquetas.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    idMaqueta
                )
        );


    if (
        !maqueta ||
        !maqueta.imagen_url
    ) {

        imagen.src =
            "";

        contenedor.hidden =
            true;

        return;
    }


    imagen.src =
        maqueta.imagen_url;


    imagen.alt =
        `Imagen de ${maqueta.nombre}`;


    contenedor.hidden =
        false;
}


// =========================================================
// ACTUALIZAR IMÁGENES
// =========================================================

function actualizarImagenesMaquetas() {

    mostrarImagenMaqueta(
        maquetaReserva.value,
        imagenMaquetaReserva1,
        imagenMaquetaReserva1Img
    );


    mostrarImagenMaqueta(
        maquetaReserva2.value,
        imagenMaquetaReserva2,
        imagenMaquetaReserva2Img
    );
}


// =========================================================
// SELECTORES DE MAQUETAS
// =========================================================

function obtenerMaquetasSeleccionadas() {

    return [
        maquetaReserva.value,
        maquetaReserva2.value
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


    llenarSelectorMaqueta(
        maquetaReserva,
        valor1,
        [
            valor2
        ].filter(Boolean)
    );


    llenarSelectorMaqueta(
        maquetaReserva2,
        valor2,
        [
            valor1
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


    actualizarImagenesMaquetas();
}


// =========================================================
// CAMBIO DE SELECTORES
// =========================================================

[
    maquetaReserva,
    maquetaReserva2
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

        bloqueMaqueta2.hidden =
            true;

        btnAgregarMaqueta2.hidden =
            false;


        if (
            imagenMaquetaReserva2 &&
            imagenMaquetaReserva2Img
        ) {

            imagenMaquetaReserva2Img.src =
                "";

            imagenMaquetaReserva2.hidden =
                true;
        }


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


        actualizarImagenesMaquetas();


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

            // IMPORTANTE:
            // Seguimos leyendo maqueta_id_3 porque pueden
            // existir reservas antiguas con tres maquetas.

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
// ÁREAS SEGÚN GESTIÓN ACADÉMICA
// =========================================================

async function cargarAreasDisponibles(
    fecha,
    horario,
    dia
) {

    // =====================================================
    // 1. BUSCAR LA GESTIÓN CORRESPONDIENTE A LA FECHA
    // =====================================================

    const {
        data: gestion,
        error: errorGestion
    } =
        await supabaseClient

            .from("gestiones_academicas")

            .select(`
                id,
                nombre,
                fecha_inicio,
                fecha_fin,
                activa
            `)

            .lte(
                "fecha_inicio",
                fecha
            )

            .gte(
                "fecha_fin",
                fecha
            )

            .order(
                "fecha_inicio",
                {
                    ascending: false
                }
            )

            .limit(1)

            .maybeSingle();


    if (errorGestion) {

        console.error(
            "Error buscando gestión académica:",
            errorGestion
        );

        areaReserva.innerHTML = `
            <option value="">
                Error al consultar la gestión
            </option>
        `;

        listaAreasLibres.textContent =
            "No fue posible consultar la gestión académica.";

        return;
    }


    // =====================================================
    // NO EXISTE GESTIÓN PARA ESA FECHA
    // =====================================================

    if (!gestion) {

        areaReserva.innerHTML = `
            <option value="">
                Fecha fuera de una gestión académica
            </option>
        `;

        listaAreasLibres.innerHTML = `
            <strong>
                ⚠ No existe una gestión académica configurada
                para esta fecha.
            </strong>
        `;

        return;
    }


    // =====================================================
    // 2. CARGAR TODAS LAS ÁREAS ACTIVAS
    // =====================================================

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
            "Error cargando áreas:",
            errorAreas
        );

        areaReserva.innerHTML = `
            <option value="">
                Error al cargar áreas
            </option>
        `;

        return;
    }


    // =====================================================
    // 3. ÁREAS LIBRES DE ESA GESTIÓN
    // =====================================================

    const {
        data: libres,
        error: errorLibres
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
                gestion.id
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
            "Error cargando áreas libres de la gestión:",
            errorLibres
        );

        areaReserva.innerHTML = `
            <option value="">
                Error al cargar configuración
            </option>
        `;

        listaAreasLibres.textContent =
            "No fue posible cargar las áreas libres configuradas.";

        return;
    }


    // =====================================================
    // 4. CONSULTAR ÁREAS YA RESERVADAS
    // =====================================================

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


    // =====================================================
    // 5. CONSTRUIR LISTAS
    // =====================================================

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
                    !areasOcupadas.has(
                        codigo
                    )
            )

            .sort();


    // =====================================================
    // 6. INFORMACIÓN VISUAL
    // =====================================================

    if (
        libresDisponibles.length > 0
    ) {

        listaAreasLibres.innerHTML = `

            <span>
                Gestión:
                <strong>
                    ${escaparHTML(
                        gestion.nombre
                    )}
                </strong>
            </span>

            <br><br>

            ${libresDisponibles
                .map(
                    codigo =>
                        `<strong>${escaparHTML(codigo)}</strong>`
                )
                .join(" • ")}

        `;

    } else {

        listaAreasLibres.innerHTML = `

            <span>
                Gestión:
                <strong>
                    ${escaparHTML(
                        gestion.nombre
                    )}
                </strong>
            </span>

            <br><br>

            Las áreas libres para práctica
            de este horario ya están reservadas
            o no existen áreas especiales configuradas.

        `;
    }


    // =====================================================
    // 7. CONSTRUIR SELECTOR DE ÁREAS
    // =====================================================

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


                // =========================================
                // ÁREA YA RESERVADA
                // =========================================

                if (
                    areasOcupadas.has(
                        area.codigo
                    )
                ) {

                    option.textContent =
                        `🔴 ${area.codigo} — RESERVADA`;

                    option.disabled =
                        true;


                // =========================================
                // ÁREA LIBRE ESPECIAL DE LA GESTIÓN
                // =========================================

                } else if (
                    areasLibres.has(
                        area.codigo
                    )
                ) {

                    option.textContent =
                        `⭐ ${area.codigo} — Área libre para práctica`;


                // =========================================
                // RESTO DE ÁREAS
                // =========================================

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


        // =================================================
        // CAMPOS OBLIGATORIOS
        // =================================================

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


        // =================================================
        // MAQUETAS SELECCIONADAS
        // Máximo 2 para nuevas reservas
        // =================================================

        const seleccionadas =
            [
                maqueta1,
                maqueta2
            ].filter(Boolean);


        if (
            seleccionadas.length > 2
        ) {

            mostrarMensaje(
                "Solo puede seleccionar hasta 2 maquetas.",
                false
            );

            return;
        }


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


        // =================================================
        // VALIDAR FECHA
        // =================================================

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
                    "Ya tiene una reserva activa para esta fecha y horario. Puede registrar hasta 2 maquetas dentro de una misma reserva.",
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

                        // IMPORTANTE:
                        // Las reservas antiguas pueden
                        // contener una tercera maqueta.
                        // Por eso seguimos comprobándola.

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
            //
            // Las nuevas reservas admiten máximo 2 maquetas.
            //
            // maqueta_id_3 se conserva en la base de datos
            // para mantener compatibilidad con reservas
            // históricas, pero las nuevas siempre guardan NULL.
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
                            null,

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


            // =============================================
            // LIMPIAR FORMULARIO
            // =============================================

            grupoReserva.value =
                "";

            tituloTema.value =
                "";

            maquetaReserva.value =
                "";

            maquetaReserva2.value =
                "";

            areaReserva.value =
                "";


            bloqueMaqueta2.hidden =
                true;

            btnAgregarMaqueta2.hidden =
                false;


            // Ocultar las imágenes después de registrar

            if (
                imagenMaquetaReserva1 &&
                imagenMaquetaReserva1Img
            ) {

                imagenMaquetaReserva1Img.src =
                    "";

                imagenMaquetaReserva1.hidden =
                    true;
            }


            if (
                imagenMaquetaReserva2 &&
                imagenMaquetaReserva2Img
            ) {

                imagenMaquetaReserva2Img.src =
                    "";

                imagenMaquetaReserva2.hidden =
                    true;
            }


            // Mostrar en la tabla la semana
            // correspondiente a la reserva realizada

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


    // =====================================================
    // DOCENTES DE LAS RESERVAS
    // =====================================================

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
    // IDS DE TODAS LAS MAQUETAS
    // =====================================================
    //
    // Aquí conservamos maqueta_id_3.
    //
    // Las reservas nuevas tendrán máximo 2,
    // pero las reservas antiguas que tenían 3
    // deben seguir mostrándose completas.
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


                            // =================================
                            // MAQUETAS DE LA RESERVA
                            // =================================
                            //
                            // Seguimos leyendo las tres
                            // posiciones para visualizar
                            // correctamente datos históricos.
                            // =================================

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


                            // =================================
                            // CANCELAR SOLO RESERVA PROPIA
                            // =================================

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
