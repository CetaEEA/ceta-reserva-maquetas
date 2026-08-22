/* =========================================================
   RESERVAS SEMANALES - ADMINISTRADOR
========================================================= */

let inicioSemanaAdmin = obtenerLunesAdmin(
    new Date()
);


/* =========================================================
   FUNCIONES DE FECHA
========================================================= */

function obtenerLunesAdmin(fecha) {

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


function sumarDiasAdmin(
    fecha,
    dias
) {

    const resultado =
        new Date(fecha);

    resultado.setDate(
        resultado.getDate() + dias
    );

    return resultado;
}


function fechaLocalISOAdmin(fecha) {

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


function formatearFechaAdmin(fecha) {

    return fecha.toLocaleDateString(
        "es-BO",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


/* =========================================================
   ACTUALIZAR ENCABEZADOS
========================================================= */

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
            encabezados[i + 1]
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


/* =========================================================
   CARGAR TABLA SEMANAL
========================================================= */

async function cargarReservasAdmin() {

    const tabla =
        document.getElementById(
            "tablaSemanaAdmin"
        );


    const textoSemana =
        document.getElementById(
            "textoSemanaAdmin"
        );


    if (
        !tabla ||
        !textoSemana
    ) {

        console.error(
            "No se encontró la tabla semanal del administrador."
        );

        return;
    }


    const lunes =
        new Date(
            inicioSemanaAdmin
        );


    const viernes =
        sumarDiasAdmin(
            lunes,
            4
        );


    textoSemana.textContent =
        `${formatearFechaAdmin(lunes)} al ${formatearFechaAdmin(viernes)}`;


    actualizarEncabezadosAdmin(
        lunes
    );


    const fechaInicio =
        fechaLocalISOAdmin(
            lunes
        );


    const fechaFin =
        fechaLocalISOAdmin(
            viernes
        );


    const tbody =
        tabla.querySelector(
            "tbody"
        );


    tbody.innerHTML = `

        <tr>

            <td colspan="6">
                Cargando reservas...
            </td>

        </tr>

    `;


    try {

        /* =================================================
           CARGAR RESERVAS ACTIVAS
        ================================================= */

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
                    maqueta_id,
                    area_codigo,
                    titulo_tema,
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


        const listaReservas =
            reservas || [];


        /* =================================================
           OBTENER USUARIOS UTILIZADOS
        ================================================= */

        const idsUsuarios =
            [
                ...new Set(

                    listaReservas

                        .map(
                            reserva =>
                                reserva.usuario_id
                        )

                        .filter(
                            Boolean
                        )

                )
            ];


        let perfiles = [];


        if (
            idsUsuarios.length > 0
        ) {

            const {
                data,
                error
            } =
                await supabaseClient

                    .from("perfiles")

                    .select(
                        "id, nombre, usuario"
                    )

                    .in(
                        "id",
                        idsUsuarios
                    );


            if (error) {

                console.error(
                    "Error cargando docentes:",
                    error
                );

            } else {

                perfiles =
                    data || [];
            }
        }


        /* =================================================
           OBTENER MAQUETAS
        ================================================= */

        const idsMaquetas =
            [
                ...new Set(

                    listaReservas

                        .map(
                            reserva =>
                                reserva.maqueta_id
                        )

                        .filter(
                            Boolean
                        )

                )
            ];


        let maquetas = [];


        if (
            idsMaquetas.length > 0
        ) {

            const {
                data,
                error
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


            if (error) {

                console.error(
                    "Error cargando maquetas de reservas:",
                    error
                );

            } else {

                maquetas =
                    data || [];
            }
        }


        /* =================================================
           CREAR MAPAS
        ================================================= */

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


        maquetas.forEach(
            maqueta => {

                mapaMaquetas.set(

                    String(
                        maqueta.id
                    ),

                    `${maqueta.codigo || ""} - ${maqueta.nombre}`

                );

            }
        );


        /* =================================================
           DIBUJAR TABLA
        ================================================= */

        renderizarTablaAdmin(

            listaReservas,

            mapaPerfiles,

            mapaMaquetas,

            lunes

        );


    } catch (error) {

        console.error(
            "Error inesperado cargando tabla semanal:",
            error
        );


        tbody.innerHTML = `

            <tr>

                <td colspan="6">
                    Error inesperado al cargar reservas.
                </td>

            </tr>

        `;
    }
}


/* =========================================================
   RENDERIZAR TABLA ADMIN
========================================================= */

function renderizarTablaAdmin(
    reservas,
    mapaPerfiles,
    mapaMaquetas,
    lunes
) {

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


            /* =============================================
               LUNES A VIERNES
            ============================================= */

            for (
                let dia = 0;
                dia < 5;
                dia++
            ) {

                const fecha =
                    sumarDiasAdmin(
                        lunes,
                        dia
                    );


                const fechaISO =
                    fechaLocalISOAdmin(
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


                /* =========================================
                   SIN RESERVAS
                ========================================= */

                if (
                    reservasCelda.length === 0
                ) {

                    celda.innerHTML = `

                        <span class="reserva-libre">
                            Sin reservas
                        </span>

                    `;

                }


                /* =========================================
                   CON RESERVAS
                ========================================= */

                else {

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


                            const grupo =
                                reserva.grupo ||
                                "-";


                            const area =
                                reserva.area_codigo ||
                                "-";


                            const tema =
                                reserva.titulo_tema ||
                                "Sin tema registrado";


                            tarjeta.innerHTML = `

                                <strong>
                                    ${escapeHTML(maqueta)}
                                </strong>


                                <span>
                                    👤
                                    ${escapeHTML(docente)}
                                </span>


                                <span>
                                    👥 Grupo:
                                    ${escapeHTML(grupo)}
                                </span>


                                <span>
                                    📍 Área:
                                    ${escapeHTML(area)}
                                </span>


                                <span class="reserva-tema-admin">

                                    📚 Tema:

                                    <strong>
                                        ${escapeHTML(tema)}
                                    </strong>

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


/* =========================================================
   SEMANA ANTERIOR
========================================================= */

const btnSemanaAnteriorAdmin =
    document.getElementById(
        "btnSemanaAnteriorAdmin"
    );


if (
    btnSemanaAnteriorAdmin
) {

    btnSemanaAnteriorAdmin.addEventListener(
        "click",
        async () => {

            inicioSemanaAdmin =
                sumarDiasAdmin(
                    inicioSemanaAdmin,
                    -7
                );


            await cargarReservasAdmin();

        }
    );
}


/* =========================================================
   SEMANA ACTUAL
========================================================= */

const btnSemanaActualAdmin =
    document.getElementById(
        "btnSemanaActualAdmin"
    );


if (
    btnSemanaActualAdmin
) {

    btnSemanaActualAdmin.addEventListener(
        "click",
        async () => {

            inicioSemanaAdmin =
                obtenerLunesAdmin(
                    new Date()
                );


            await cargarReservasAdmin();

        }
    );
}


/* =========================================================
   SEMANA SIGUIENTE
========================================================= */

const btnSemanaSiguienteAdmin =
    document.getElementById(
        "btnSemanaSiguienteAdmin"
    );


if (
    btnSemanaSiguienteAdmin
) {

    btnSemanaSiguienteAdmin.addEventListener(
        "click",
        async () => {

            inicioSemanaAdmin =
                sumarDiasAdmin(
                    inicioSemanaAdmin,
                    7
                );


            await cargarReservasAdmin();

        }
    );
}


/* =========================================================
   INICIAR PANEL
========================================================= */

(async () => {

    console.log(
        "Iniciando panel administrador..."
    );


    const perfil =
        await comprobarAdministrador();


    if (!perfil) {

        return;
    }


    await cargarUsuarios();

    await cargarMaquetas();

    await cargarReservasAdmin();


    console.log(
        "Panel administrador iniciado correctamente."
    );

})();
