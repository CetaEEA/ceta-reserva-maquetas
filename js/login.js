// =========================================================
// LOGIN - CETA RESERVA DE MAQUETAS
// =========================================================


// =========================================================
// CONEXIÓN SUPABASE
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
        // OBTENER DATOS
        // =================================================

        const usuarioIngresado = document
            .getElementById("usuario")
            .value
            .trim()
            .toLowerCase();


        const password = document
            .getElementById("password")
            .value;


        mensaje.textContent = "";


        // =================================================
        // VALIDACIÓN
        // =================================================

        if (!usuarioIngresado || !password) {

            mensaje.textContent =
                "Complete todos los campos.";

            return;
        }


        // =================================================
        // DETERMINAR EMAIL DE AUTENTICACIÓN
        // =================================================
        //
        // Si escribe:
        //
        // profesor1
        //
        // usamos:
        //
        // profesor1@ceta.internal
        //
        //
        // Si escribe:
        //
        // administrador@gmail.com
        //
        // usamos directamente ese correo.
        //
        // Esto mantiene compatibilidad con las cuentas
        // antiguas del administrador.
        // =================================================

        let emailAuth;


        if (usuarioIngresado.includes("@")) {

            emailAuth =
                usuarioIngresado;

        } else {

            emailAuth =
                `${usuarioIngresado}@ceta.internal`;

        }


        try {

            // =============================================
            // AUTENTICACIÓN
            // =============================================

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .signInWithPassword({

                        email:
                            emailAuth,

                        password:
                            password

                    });


            // =============================================
            // ERROR DE AUTENTICACIÓN
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
                "Autenticación correcta:",
                data.user.id
            );


            // =============================================
            // OBTENER PERFIL
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
                "Perfil encontrado:",
                perfil
            );


            // =============================================
            // COMPROBAR USUARIO ACTIVO
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
            // GUARDAR PERFIL
            // =============================================

            sessionStorage.setItem(
                "ceta_usuario",
                JSON.stringify(perfil)
            );


            // =============================================
            // REDIRECCIÓN ADMINISTRADOR
            // =============================================

            if (
                perfil.rol ===
                "administrador"
            ) {

                console.log(
                    "Acceso administrador."
                );


                window.location.href =
                    "admin.html";


                return;
            }


            // =============================================
            // REDIRECCIÓN DOCENTE
            // =============================================

            if (
                perfil.rol ===
                "docente"
            ) {

                console.log(
                    "Acceso docente."
                );


                window.location.href =
                    "docente.html";


                return;
            }


            // =============================================
            // ROL DESCONOCIDO
            // =============================================

            console.error(
                "Rol desconocido:",
                perfil.rol
            );


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
