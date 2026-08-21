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
// ELEMENTOS HTML
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


        // -------------------------------------------------
        // OBTENER DATOS
        // -------------------------------------------------

        const usuario = document
            .getElementById("usuario")
            .value
            .trim()
            .toLowerCase();


        const password = document
            .getElementById("password")
            .value;


        mensaje.textContent = "";


        // -------------------------------------------------
        // VALIDAR CAMPOS
        // -------------------------------------------------

        if (!usuario || !password) {

            mensaje.textContent =
                "Complete todos los campos.";

            return;
        }


        // -------------------------------------------------
        // CORREO INTERNO DE SUPABASE
        // -------------------------------------------------

        /*
         * Actualmente el sistema utiliza esta identidad
         * interna para realizar la autenticación.
         *
         * NO MODIFICAMOS ESTA PARTE todavía porque
         * actualmente el login está funcionando.
         */

        const emailInterno =
            "zetaandrew45@gmail.com";


        // -------------------------------------------------
        // AUTENTICACIÓN
        // -------------------------------------------------

        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({

                email: emailInterno,

                password: password

            });


        // -------------------------------------------------
        // ERROR DE LOGIN
        // -------------------------------------------------

        if (error) {

            console.error(
                "Error de autenticación:",
                error
            );


            mensaje.textContent =
                "Usuario o contraseña incorrectos.";


            return;
        }


        console.log(
            "Usuario autenticado:",
            data.user
        );


        // -------------------------------------------------
        // OBTENER PERFIL
        // -------------------------------------------------

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


        // -------------------------------------------------
        // PERFIL NO ENCONTRADO
        // -------------------------------------------------

        if (
            errorPerfil ||
            !perfil
        ) {

            console.error(
                "Error obteniendo perfil:",
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


        // -------------------------------------------------
        // USUARIO DESACTIVADO
        // -------------------------------------------------

        if (!perfil.activo) {

            mensaje.textContent =
                "Este usuario está desactivado.";


            await supabaseClient
                .auth
                .signOut();


            return;
        }


        // -------------------------------------------------
        // GUARDAR PERFIL
        // -------------------------------------------------

        sessionStorage.setItem(
            "ceta_usuario",
            JSON.stringify(perfil)
        );


        // -------------------------------------------------
        // REDIRECCIÓN SEGÚN ROL
        // -------------------------------------------------

        if (
            perfil.rol ===
            "administrador"
        ) {

            console.log(
                "Acceso administrador."
            );


            window.location.href =
                "admin.html";


        } else if (
            perfil.rol ===
            "docente"
        ) {

            console.log(
                "Acceso docente."
            );


            window.location.href =
                "docente.html";


        } else {

            console.error(
                "Rol desconocido:",
                perfil.rol
            );


            mensaje.textContent =
                "El usuario no tiene un rol válido.";


            await supabaseClient
                .auth
                .signOut();

        }

    }
);
