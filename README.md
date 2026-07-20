# Soporte TI

Portal inicial para registrar tickets de soporte, avances de proyectos y reportes de actividades.

## Uso

Abre `index.html` en un navegador. La información se guarda localmente en el navegador mediante `localStorage`.

- **Tickets:** registra solicitudes, prioridad, estado y trabajo realizado.
- **Proyectos:** concentra avances de bases de datos, aplicaciones, automatizaciones de Excel e infraestructura.
- **Reportes:** descarga un CSV con los tickets del periodo elegido y todos los proyectos.

> Esta versión es un prototipo local: cada navegador conserva sus propios datos. Para que todo el equipo comparta la información y haya control de usuarios, el siguiente incremento deberá incorporar una base de datos y autenticación.

## Publicarlo con GitHub Pages

1. Crea un repositorio vacío en GitHub, por ejemplo `soporte-ti`.
2. En esta carpeta, configura y envía el remoto:

   ```powershell
   git add .
   git commit -m "Crear portal inicial de soporte TI"
   git branch -M main
   git remote add origin https://github.com/USUARIO/soporte-ti.git
   git push -u origin main
   ```

3. En el repositorio, abre **Settings → Pages**, selecciona la rama `main` y la carpeta `/ (root)`.

GitHub Pages publicará la interfaz, pero no convierte los datos locales en datos compartidos. Para la versión institucional conviene definir el proveedor de base de datos y los perfiles de acceso antes de implementarlo.
