// =========================================================
// LOGIN - CETA RESERVA DE MAQUETAS
// =========================================================


// =========================================================
// CONEXIÓN CON SUPABASE
// =========================================================

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =========================================================
// ELEMENTOS
// =========================================================

const loginForm =
    document.getElementById("loginForm");

const mensaje =
    document.getElementById("mensaje");


// =========================================================
// LOGIN
// =========================================================

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        // =================================================
        // OBTENER USUARIO
        // =================================================

        const usuario = document
            .getElementById("usuario")
            .value
            .trim()
            .toLowerCase();


        // =================================================
        // OBTENER CONTRASEÑA
        // =================================================

        const password = document
            .getElementById("password")
            .value;


        mensaje.textContent = "";


        // =================================================
        // VALIDAR CAMPOS
        // =================================================

        if (!usuario || !password) {

            mensaje.textContent =
                "Complete todos los campos.";

            return;
        }


        // =================================================
        // CREAR CORREO INTERNO
        // =================================================
        //
        // Ejemplo:
        //
        // usuario: juan
        //
        // se convierte internamente en:
        //
        // juan@ceta.internal
        //
        // El docente NO necesita conocer este correo.
        // =================================================

        const emailInterno =
            `${usuario}@ceta.internal`;


        try {

            // =============================================
            // AUTENTICAR
            // =============================================

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .signInWithPassword({

                        email:
                            emailInterno,

                        password:
                            password

                    });


            // =============================================
            // CREDENCIALES INCORRECTAS
            // =============================================

            if (error) {

                console.error(
                    "Error de autenticación:",
                    error
                );


                mensaje.textContent =
                    "Usuario o contraseña incorrectos.";

                return;
            }


            if (!data.user) {

                mensaje.textContent =
                    "No se pudo iniciar sesión.";

                return;
            }


            console.log(
                "Autenticación correcta."
            );


            // =============================================
            // BUSCAR PERFIL
            // =============================================

            const {
                data: perfil,
                error: errorPerfil
            } =
                await supabaseClient

                    .from("perfiles")

                    .select(
                        "usuario, nombre, rol, activo"
                    )

                    .eq(
                        "id",
                        data.user.id
                    )

                    .single();


            // =============================================
            // PERFIL NO ENCONTRADO
            // =============================================

            if (
                errorPerfil ||
                !perfil
            ) {

                console.error(
                    "Error cargando perfil:",
                    errorPerfil
                );


                mensaje.textContent =
                    "No se encontró el perfil del usuario.";


                await supabaseClient
                    .auth
                    .signOut();


                return;
            }


            console.log(
                "Perfil:",
                perfil
            );


            // =============================================
            // COMPROBAR QUE EL USUARIO COINCIDA
            // =============================================

            if (
                perfil.usuario
                    .toLowerCase()
                !==
                usuario
            ) {

                mensaje.textContent =
                    "El perfil no corresponde al usuario.";


                await supabaseClient
                    .auth
                    .signOut();


                return;
            }


            // =============================================
            // COMPROBAR ESTADO
            // =============================================

            if (!perfil.activo) {

                mensaje.textContent =
                    "Este usuario está desactivado.";


                await supabaseClient
                    .auth
                    .signOut();


                return;
            }


            // =============================================
            // GUARDAR PERFIL EN LA SESIÓN
            // =============================================

            sessionStorage.setItem(
                "ceta_usuario",
                JSON.stringify(perfil)
            );


            // =============================================
            // REDIRECCIONAR SEGÚN ROL
            // =============================================

            if (
                perfil.rol ===
                "administrador"
            ) {

                console.log(
                    "Ingresando al panel administrador."
                );


                window.location.href =
                    "admin.html";


                return;
            }


            if (
                perfil.rol ===
                "docente"
            ) {

                console.log(
                    "Ingresando al panel docente."
                );


                window.location.href =
                    "docente.html";


                return;
            }


            // =============================================
            // ROL DESCONOCIDO
            // =============================================

            mensaje.textContent =
                "El usuario no tiene un rol válido.";


            await supabaseClient
                .auth
                .signOut();


        } catch (error) {

            console.error(
                "Error inesperado:",
                error
            );


            mensaje.textContent =
                "Error de conexión con el servidor.";

        }

    }
);
