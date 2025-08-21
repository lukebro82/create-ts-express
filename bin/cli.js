#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";

async function crearProyecto() {
  console.log(
    chalk.blue("🚀 Generador de proyectos Express + TypeScript + Nodemon")
  );

  const respuestas = await inquirer.prompt([
    {
      type: "input",
      name: "nombreProyecto",
      message: "¿Cuál es el nombre de tu proyecto?",
      default: "mi-app-express",
      validate: (input) => {
        if (input.length === 0) {
          return "El nombre del proyecto no puede estar vacío";
        }
        // Validar que el nombre sea válido para npm
        if (!/^[a-z0-9-]+$/.test(input)) {
          return "El nombre solo puede contener letras minúsculas, números y guiones";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "descripcion",
      message: "¿Descripción del proyecto?",
      default: "Mi aplicación Express con TypeScript",
    },
    {
      type: "input",
      name: "autor",
      message: "¿Nombre del autor?",
      default: "Tu nombre",
    },
    {
      type: "list",
      name: "puerto",
      message: "¿Qué puerto quieres usar?",
      choices: ["3000", "4000", "5000", "8000"],
      default: "3000",
    },
  ]);

  const carpetaProyecto = path.join(process.cwd(), respuestas.nombreProyecto);

  // Verificar si la carpeta ya existe
  if (await fs.pathExists(carpetaProyecto)) {
    console.log(
      chalk.red(`❌ La carpeta ${respuestas.nombreProyecto} ya existe`)
    );
    process.exit(1);
  }

  console.log(chalk.green(`\n📁 Creando proyecto en: ${carpetaProyecto}`));

  try {
    // Crear la carpeta del proyecto
    console.log(chalk.yellow("📁 Creando directorio del proyecto..."));
    await fs.ensureDir(carpetaProyecto);

    // Obtener la ruta del template
    const __filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(__filename);

    // Convertir la ruta para Windows si es necesario
    let templateDir;
    if (process.platform === "win32") {
      // En Windows, pathname devuelve /c:/path, necesitamos convertirlo
      const windowsPath = __filename.replace(/^\//, "").replace(/\//g, "\\");
      const windowsDir = path.dirname(windowsPath);
      templateDir = path.join(windowsDir, "..", "templates");
    } else {
      templateDir = path.join(__dirname, "..", "templates");
    }

    console.log(chalk.yellow(`📂 Verificando templates en: ${templateDir}`));

    // Verificar que el directorio de templates existe
    if (!(await fs.pathExists(templateDir))) {
      throw new Error(
        `No se encontró el directorio de templates: ${templateDir}`
      );
    }

    // Verificar que hay archivos en el template
    const archivosTemplate = await fs.readdir(templateDir);
    if (archivosTemplate.length === 0) {
      throw new Error("El directorio de templates está vacío");
    }

    console.log(
      chalk.yellow(`📄 Archivos encontrados: ${archivosTemplate.join(", ")}`)
    );

    // Copiar todos los archivos del template
    console.log(chalk.yellow("📋 Copiando archivos del template..."));
    await fs.copy(templateDir, carpetaProyecto);

    // Reemplazar variables en todos los archivos
    console.log(chalk.yellow("🔧 Reemplazando variables en los archivos..."));
    await reemplazarVariables(carpetaProyecto, respuestas);

    // Verificar que se crearon los archivos
    const archivosCreados = await fs.readdir(carpetaProyecto);
    console.log(
      chalk.green(`✅ Archivos creados: ${archivosCreados.join(", ")}`)
    );

    console.log(chalk.green("✅ Proyecto creado exitosamente!"));
    console.log(chalk.blue("\n📋 Próximos pasos:"));
    console.log(chalk.white(`  cd "${respuestas.nombreProyecto}"`));
    console.log(chalk.white(`  npm install`));
    console.log(chalk.white(`  npm run dev`));
  } catch (error) {
    console.error(chalk.red("❌ Error creando el proyecto:"));
    console.error(chalk.red(error.message));
    console.error(chalk.gray(error.stack));

    // Limpiar la carpeta si se creó parcialmente
    if (await fs.pathExists(carpetaProyecto)) {
      console.log(chalk.yellow("🧹 Limpiando archivos parciales..."));
      await fs.remove(carpetaProyecto);
    }

    process.exit(1);
  }
}

async function reemplazarVariables(carpetaProyecto, respuestas) {
  const archivos = await fs.readdir(carpetaProyecto);

  for (const archivo of archivos) {
    const rutaArchivo = path.join(carpetaProyecto, archivo);
    const stats = await fs.stat(rutaArchivo);

    if (stats.isDirectory()) {
      await reemplazarVariables(rutaArchivo, respuestas);
    } else {
      try {
        let contenido = await fs.readFile(rutaArchivo, "utf8");

        contenido = contenido
          .replace(/{{NOMBRE_PROYECTO}}/g, respuestas.nombreProyecto)
          .replace(/{{DESCRIPCION}}/g, respuestas.descripcion)
          .replace(/{{AUTOR}}/g, respuestas.autor)
          .replace(/{{PUERTO}}/g, respuestas.puerto);

        await fs.writeFile(rutaArchivo, contenido);
        console.log(chalk.gray(`  ✅ ${archivo} procesado`));
      } catch (error) {
        console.log(
          chalk.yellow(`  ⚠️  No se pudo procesar ${archivo}: ${error.message}`)
        );
      }
    }
  }
}

// Manejar errores no capturados
process.on("unhandledRejection", (reason, promise) => {
  console.error(chalk.red("❌ Error no manejado:"), reason);
  process.exit(1);
});

crearProyecto().catch((error) => {
  console.error(chalk.red("❌ Error fatal:"), error);
  process.exit(1);
});
