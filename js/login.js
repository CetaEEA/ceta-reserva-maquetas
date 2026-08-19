const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const loginForm = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const usuario = document
        .getElementById("usuario")
        .value
        .trim()
        .toLowerCase();

    const password = document
        .getElementById("password")
        .value;

    mensaje.textContent = "";

    if (!usuario || !password) {
        mensaje.textContent = "Complete todos los campos.";
        return;
    }

    /*
     * Por ahora utilizaremos una identidad interna
     * para probar la conexión con Supabase.
     */

    const emailInterno = usuario;
    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: emailInterno,
            password: password
        });

    if (error) {

        console.error(error);

        mensaje.textContent =
            "Usuario o contraseña incorrectos.";

        return;
    }

    /*
     * Obtener el perfil del usuario
     */

    const { data: perfil, error: errorPerfil } =
        await supabaseClient
            .from("perfiles")
            .select("usuario, nombre, rol, activo")
            .eq("id", data.user.id)
            .single();

    if (errorPerfil || !perfil) {

        mensaje.textContent =
            "No se encontró el perfil del usuario.";

        await supabaseClient.auth.signOut();

        return;
    }

    if (!perfil.activo) {

        mensaje.textContent =
            "Este usuario está desactivado.";

        await supabaseClient.auth.signOut();

        return;
    }

    /*
     * Guardar información básica
     */

    sessionStorage.setItem(
        "ceta_usuario",
        JSON.stringify(perfil)
    );

    /*
     * Redireccionamiento
     */

    if (perfil.rol === "administrador") {

        window.location.href = "admin.html";

    } else {

        window.location.href = "reservas.html";

    }

});
