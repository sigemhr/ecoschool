#!/usr/bin/env node
/**
 * Script interactivo para crear la estructura base de un módulo en Vite + React.
 * Compatible con React Router v6/v7 (file-based o manual).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

// Raíz del proyecto: sube desde la ubicación del script hasta encontrar package.json
function findProjectRoot(startDir) {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      console.warn("⚠️  No se encontró package.json, usando cwd como raíz.");
      return process.cwd();
    }
    dir = parent;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = findProjectRoot(__dirname);

console.log(`📌 Raíz del proyecto detectada: ${PROJECT_ROOT}`);

// Función auxiliar para capitalizar nombres
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Función auxiliar para convertir kebab-case o snake_case a PascalCase
function toPascalCase(str) {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

// Interfaz para leer desde consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Función auxiliar para preguntar con promesa
function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// Función principal para crear el módulo
function createModule(modulePath, moduleNameInput, moduleCap, displayBase) {
  // Subcarpetas estándar de un módulo con separación de responsabilidades
  const folders = [
    "components", // Componentes UI propios del módulo
    "services",   // Llamadas a API / lógica de negocio
    "hooks",      // Custom hooks del módulo
    "types",      // Interfaces y tipos TypeScript
    "utils",      // Helpers y utilidades
    "constants",  // Constantes del módulo
    "store",      // Estado local (Zustand, Context, etc.)
  ];

  // Archivos base generados
  const files = [
    // ─── Página principal (lista) ───────────────────────────────────────────
    {
      name: `${moduleNameInput}Page.tsx`,
      content: `import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function ${moduleCap}Page() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">${moduleCap}</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona y visualiza todos los registros de ${moduleNameInput}.
            </p>
          </div>
          <Link
            to="nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            + Nuevo ${moduleCap}
          </Link>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Módulo <span className="font-semibold">${moduleNameInput}</span> generado correctamente.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
`,
    },

    // ─── Página de creación ─────────────────────────────────────────────────
    {
      name: `Nuevo${moduleCap}Page.tsx`,
      content: `import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Nuevo${moduleCap}Page() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: lógica de creación
    navigate("../${moduleNameInput}");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo ${moduleCap}</h1>
          <p className="text-muted-foreground mt-1">Completa el formulario para crear un registro.</p>
        </div>

        <div className="max-w-2xl rounded-2xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* TODO: añadir campos del formulario */}
            <p className="text-sm text-muted-foreground">
              Formulario para crear <span className="font-semibold">${moduleNameInput}</span>.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
`,
    },

    // ─── Página de detalle ──────────────────────────────────────────────────
    {
      name: `${moduleCap}DetailPage.tsx`,
      content: `import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function ${moduleCap}DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold tracking-tight">Detalle de ${moduleCap}</h1>
        </div>

        <div className="max-w-2xl rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-foreground">ID: {id}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Mostrando detalles del registro con ID:{" "}
            <span className="font-bold text-foreground">{id}</span>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
`,
    },

    // ─── Servicio base ──────────────────────────────────────────────────────
    {
      name: `services/${moduleNameInput}.service.ts`,
      content: `import type { ${moduleCap} } from "../types/${moduleNameInput}.types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export const ${moduleNameInput}Service = {
  getAll: async (): Promise<${moduleCap}[]> => {
    const res = await fetch(\`\${BASE_URL}/${moduleNameInput}\`);
    if (!res.ok) throw new Error("Error al obtener ${moduleNameInput}");
    return res.json();
  },

  getById: async (id: string): Promise<${moduleCap}> => {
    const res = await fetch(\`\${BASE_URL}/${moduleNameInput}/\${id}\`);
    if (!res.ok) throw new Error("Error al obtener ${moduleNameInput} \${id}");
    return res.json();
  },

  create: async (data: Omit<${moduleCap}, "id">): Promise<${moduleCap}> => {
    const res = await fetch(\`\${BASE_URL}/${moduleNameInput}\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al crear ${moduleNameInput}");
    return res.json();
  },

  update: async (id: string, data: Partial<${moduleCap}>): Promise<${moduleCap}> => {
    const res = await fetch(\`\${BASE_URL}/${moduleNameInput}/\${id}\`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al actualizar ${moduleNameInput} \${id}");
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(\`\${BASE_URL}/${moduleNameInput}/\${id}\`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar ${moduleNameInput} \${id}");
  },
};
`,
    },

    // ─── Tipos base ─────────────────────────────────────────────────────────
    {
      name: `types/${moduleNameInput}.types.ts`,
      content: `export interface ${moduleCap} {
  id: string;
  // TODO: define los campos del modelo
  createdAt: string;
  updatedAt: string;
}

export interface ${moduleCap}FormValues {
  // TODO: campos del formulario
}
`,
    },

    // ─── Hook base ──────────────────────────────────────────────────────────
    {
      name: `hooks/use${moduleCap}.ts`,
      content: `import { useEffect, useState } from "react";
import { ${moduleNameInput}Service } from "../services/${moduleNameInput}.service";
import type { ${moduleCap} } from "../types/${moduleNameInput}.types";

export function use${moduleCap}(id?: string) {
  const [data, setData] = useState<${moduleCap} | ${moduleCap}[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const fetch = id
      ? ${moduleNameInput}Service.getById(id)
      : ${moduleNameInput}Service.getAll();

    fetch
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [id]);

  return { data, isLoading, error };
}
`,
    },

    // ─── Constantes ─────────────────────────────────────────────────────────
    {
      name: `constants/${moduleNameInput}.constants.ts`,
      content: `export const ${moduleNameInput.toUpperCase()}_ROUTES = {
  LIST: "/${moduleNameInput}",
  NEW: "/${moduleNameInput}/nuevo",
  DETAIL: (id: string) => \`/${moduleNameInput}/\${id}\`,
} as const;
`,
    },

    // ─── Barril de exportaciones ─────────────────────────────────────────────
    {
      name: `index.ts`,
      content: `// Páginas
export { default as ${moduleCap}Page } from "./${moduleNameInput}Page";
export { default as Nuevo${moduleCap}Page } from "./Nuevo${moduleCap}Page";
export { default as ${moduleCap}DetailPage } from "./${moduleCap}DetailPage";

// Hooks
export { use${moduleCap} } from "./hooks/use${moduleCap}";

// Servicios
export { ${moduleNameInput}Service } from "./services/${moduleNameInput}.service";

// Tipos
export type { ${moduleCap}, ${moduleCap}FormValues } from "./types/${moduleNameInput}.types";

// Constantes
export { ${moduleNameInput.toUpperCase()}_ROUTES } from "./constants/${moduleNameInput}.constants";
`,
    },

    // ─── Sugerencia de rutas ─────────────────────────────────────────────────
    {
      name: `${moduleNameInput}.routes.tsx`,
      content: `/**
 * Rutas sugeridas para React Router v6+.
 * Agrégalas a tu router principal (ej: src/router/index.tsx).
 *
 * Ejemplo de uso:
 *
 *   import { ${moduleNameInput}Routes } from "@/modules/${moduleNameInput}/${moduleNameInput}.routes";
 *
 *   const router = createBrowserRouter([
 *     { path: "/", element: <RootLayout /> },
 *     ...${moduleNameInput}Routes,
 *   ]);
 */

import type { RouteObject } from "react-router-dom";
import { lazy } from "react";

const ${moduleCap}Page      = lazy(() => import("./${moduleNameInput}Page"));
const Nuevo${moduleCap}Page = lazy(() => import("./Nuevo${moduleCap}Page"));
const ${moduleCap}DetailPage = lazy(() => import("./${moduleCap}DetailPage"));

export const ${moduleNameInput}Routes: RouteObject[] = [
  {
    path: "/${moduleNameInput}",
    children: [
      { index: true,        element: <${moduleCap}Page /> },
      { path: "nuevo",      element: <Nuevo${moduleCap}Page /> },
      { path: ":id",        element: <${moduleCap}DetailPage /> },
    ],
  },
];
`,
    },
  ];

  // Crear carpeta base del módulo
  if (!fs.existsSync(modulePath)) {
    fs.mkdirSync(modulePath, { recursive: true });
    console.log(`\n📁 Creada ruta: ${displayBase}/${moduleNameInput}`);
  } else {
    console.warn(`\n⚠️  La ruta "${displayBase}/${moduleNameInput}" ya existe.`);
  }

  // Crear subcarpetas
  folders.forEach((folder) => {
    const folderPath = path.join(modulePath, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`  📂 ${folder}/`);
    }
  });

  // Crear archivos
  files.forEach((file) => {
    const filePath = path.join(modulePath, file.name);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, file.content, "utf-8");
      console.log(`  📝 ${file.name}`);
    } else {
      console.warn(`  ⚠️  ${file.name} ya existe, se omitió.`);
    }
  });

  console.log(`
✅ Módulo "${moduleNameInput}" creado en ${displayBase}/

📌 Próximos pasos:
   1. Importa las rutas en tu router principal:
      import { ${moduleNameInput}Routes } from "@/modules/${moduleNameInput}/${moduleNameInput}.routes";

   2. Define tus tipos en:
      src/modules/${moduleNameInput}/types/${moduleNameInput}.types.ts

   3. Ajusta el servicio con tu base URL real:
      src/modules/${moduleNameInput}/services/${moduleNameInput}.service.ts

   4. Añade componentes UI propios en:
      src/modules/${moduleNameInput}/components/
`);
}

// --- Ejecución principal ---
async function main() {
  console.log("⚡ Generador de Módulos — Vite + React + React Router\n");

  // Nombre del módulo
  const moduleName = await ask("🧩 Nombre del módulo (ej: productos  o  Gestion/ventas/blacklist): ");
  if (!moduleName?.trim()) {
    console.error("❌ Debes ingresar un nombre válido.");
    rl.close();
    process.exit(1);
  }

  // Separar segmentos de ruta anidada: "Gestion/ventas/blacklist" → [..., "blacklist"]
  const segments = moduleName.trim().split("/").map(s => s.trim()).filter(Boolean);
  const moduleNameInput = segments[segments.length - 1].toLowerCase();
  const moduleCap = toPascalCase(moduleNameInput);

  // Ruta destino siempre anclada a src/modules + segmentos intermedios
  const BASE = "src/modules";
  const nestedSegments = segments.slice(0, -1); // todo menos el último
  const resolvedPath = [BASE, ...nestedSegments].join("/");
  const targetBase = path.join(PROJECT_ROOT, resolvedPath);
  const modulePath = path.join(targetBase, moduleNameInput);
  const displayBase = resolvedPath;

  console.log(`\n📍 Se creará en: ${PROJECT_ROOT}/${displayBase}/${moduleNameInput}\n`);

  createModule(modulePath, moduleNameInput, moduleCap, displayBase);
  rl.close();
}

main();
