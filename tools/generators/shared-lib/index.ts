import { join } from 'node:path';
import {
  type Tree,
  addProjectConfiguration,
  generateFiles,
  joinPathFragments,
  names,
  updateJson,
} from '@nx/devkit';

interface SharedLibSchema {
  name: string;
  description?: string;
}

export default async function sharedLibGenerator(tree: Tree, options: SharedLibSchema) {
  const libNames = names(options.name);
  const projectName = `@nx-base-template/shared-${libNames.fileName}`;
  const projectRoot = `libs/shared/${libNames.fileName}`;
  const importPath = `@nx-base-template/shared-${libNames.fileName}`;

  // Criar projeto no grafo Nx
  addProjectConfiguration(tree, projectName, {
    root: projectRoot,
    sourceRoot: `${projectRoot}/src`,
    projectType: 'library',
    tags: ['type:lib', 'scope:shared', 'stack:node'],
    targets: {
      test: { options: { passWithNoTests: true } },
      lint: { options: { lintFilePatterns: [`${projectRoot}/**/*.ts`] } },
    },
  });

  // Gerar arquivos a partir dos templates
  generateFiles(tree, join(__dirname, 'files'), projectRoot, {
    ...libNames,
    importPath,
    description: options.description ?? '',
    tmpl: '',
  });

  // Adicionar path alias no tsconfig.base.json
  updateJson(tree, 'tsconfig.base.json', (json) => {
    json.compilerOptions.paths ??= {};
    json.compilerOptions.paths[importPath] = [`${projectRoot}/src/index.ts`];
    return json;
  });

  // Adicionar reference no tsconfig.json raiz
  updateJson(tree, 'tsconfig.json', (json) => {
    json.references ??= [];
    const refPath = `./${projectRoot}`;
    const alreadyExists = json.references.some((r: { path: string }) => r.path === refPath);
    if (!alreadyExists) {
      json.references.push({ path: refPath });
    }
    return json;
  });

  // Adicionar package na pnpm-workspace (já coberto pelo glob libs/**)
  console.log(`✅  Lib criada: ${projectName}`);
  console.log(`   Root: ${projectRoot}`);
  console.log(`   Import: ${importPath}`);
}
