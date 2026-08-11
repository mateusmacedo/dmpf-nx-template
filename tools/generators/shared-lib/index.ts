import { join } from 'node:path';
import { addProjectConfiguration, generateFiles, names, type Tree, updateJson } from '@nx/devkit';

interface SharedLibSchema {
  name: string;
  description?: string;
  stack?: 'node' | 'react' | 'angular' | 'universal';
}

export default async function sharedLibGenerator(tree: Tree, options: SharedLibSchema) {
  const libNames = names(options.name);
  const stack = options.stack ?? 'node';
  const projectName = `@lidercap-apps/shared-${libNames.fileName}`;
  const projectRoot = `libs/shared/${libNames.fileName}`;
  const importPath = `@lidercap-apps/shared-${libNames.fileName}`;

  addProjectConfiguration(tree, projectName, {
    root: projectRoot,
    sourceRoot: `${projectRoot}/src`,
    projectType: 'library',
    tags: ['type:lib', 'scope:shared', `stack:${stack}`],
    targets: {
      test: { options: { passWithNoTests: true } },
      lint: {},
    },
  });

  generateFiles(tree, join(__dirname, 'files'), projectRoot, {
    ...libNames,
    importPath,
    description: options.description ?? '',
    tmpl: '',
  });

  updateJson(tree, 'tsconfig.base.json', (json) => {
    json.compilerOptions.paths ??= {};
    json.compilerOptions.paths[importPath] = [`${projectRoot}/src/index.ts`];
    return json;
  });

  updateJson(tree, 'tsconfig.json', (json) => {
    json.references ??= [];
    const refPath = `./${projectRoot}`;
    const alreadyExists = json.references.some((r: { path: string }) => r.path === refPath);
    if (!alreadyExists) {
      json.references.push({ path: refPath });
    }
    return json;
  });

  console.log(`\n  Lib criada: ${projectName}`);
  console.log(`  Root:   ${projectRoot}`);
  console.log(`  Import: ${importPath}`);
  console.log(`  Stack:  ${stack}\n`);
}
