# Pedidos de Frascos — cómo subirlo a Vercel

Es el mismo panel que usabas en Claude. Ahora guarda en **Supabase** y tiene **login**.

Contenido del ZIP:
- `index.html`: el panel.
- `conexion.js`: la conexión con Supabase y la pantalla de ingreso.
- `config.js`: la dirección y la clave de tu proyecto de Supabase (**lo tenés que completar**).
- `supabase.sql`: crea la tabla y las reglas de seguridad.
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png`: para instalarlo en el celu como una app.

---

## 1. Supabase (5 minutos)

1. Entrá a tu proyecto de Supabase. Puede ser el mismo de los huevos: esto usa una tabla aparte (`frascos_docs`) y no toca nada de lo otro.
2. **SQL Editor → New query**, pegá todo el contenido de `supabase.sql` y tocá **Run**.
3. **Project Settings → API** (o "API Keys"): copiá la **anon public key**.
4. Abrí `config.js`, reemplazá `PEGAR_ACA_LA_ANON_PUBLIC_KEY` por esa clave y revisá que la `url` sea la de tu proyecto.
5. **Authentication → Sign In / Providers → Email**: desactivá **"Confirm email"**, así creás tu cuenta sin tener que confirmar por mail.

## 2. GitHub

1. Creá un repositorio nuevo, por ejemplo `pedidos-frascos`. Te conviene que sea **privado**.
2. **Add file → Upload files**: subí todos los archivos del ZIP, con `config.js` ya completado.
3. **Commit changes**.

> No subas a GitHub el archivo `frascos-datos-….json`: tiene tus ventas y los teléfonos de tus clientes.

## 3. Vercel

1. **Add New → Project** y elegí el repositorio.
2. En Framework Preset dejá **Other**. No hace falta build.
3. **Deploy**. Te da una dirección tipo `pedidos-frascos.vercel.app`.

## 4. Primer ingreso y tus datos

1. Abrí la dirección, tocá **"Es mi primera vez: crear cuenta"** y creá tu usuario con mail y contraseña.
2. En Inicio tocá **Importar mis datos** (o **Respaldo → Cargar respaldo**) y elegí `frascos-datos-2026-10-15.json`.
3. Vas a ver cuántas ventas y facturas se van a cargar. Tocá **Importar**.
4. **Importante:** volvé a Supabase, **Authentication → Sign In / Providers**, y desactivá **"Allow new users to sign up"**. Así nadie más puede crearse una cuenta en tu panel.

## 5. En el celu

Abrí la dirección en el navegador → **Compartir → Agregar a inicio** (iPhone) o **⋮ → Instalar app / Agregar a pantalla principal** (Android). Queda como una app con ícono propio.

---

### Para cambios futuros
Reemplazás `index.html` en GitHub (editar → pegar → commit) y Vercel lo publica solo en un minuto.

### Si seguiste cargando ventas en Claude antes de pasarte
En el panel de Claude: **Respaldo → Copia completa (.json)**. Después importás ese archivo en Vercel. Lo que ya está no se duplica.
