import esbuildPluginTsc from 'esbuild-plugin-tsc';
import * as esbuild from 'esbuild';
import { $ } from 'bun';
import { readFileSync, writeFileSync } from 'fs';


// -- Bump the version
await $`npm --no-git-tag-version version patch`;

// -- Read the main package.json
const package_json = JSON.parse(readFileSync('package.json', 'utf8'));
const version = package_json.version;
const publish = package_json.publishConfig;



const author = {
  email: 'os@noise.email',
  name: 'Noise',
  url: 'https://os.noise.email'
};

const repository = {
  type: 'git',
  url: 'git+https://github.com/NoiseEmail/NoiseValidator.git'
};

const license = 'MIT';

const sub_packages = [
  {
    in: 'src/client/index.ts',
    out: 'client/index',
    name: 'client',
    path: 'client/',
  },
  {
    in: 'src/error/index.ts',
    out: 'error/index',
    name: 'error',
    path: 'error/'
  },
  {
    in: 'src/schema/index.ts',
    out: 'schema/index',
    name: 'schema',
    path: 'schema/'
  },
  {
    in: 'src/logger/index.ts',
    out: 'logger/index',
    name: 'logger',
    path: 'logger/'
  }
];



const build_package_json = (config) => {
  const package_json = {
    name: `@noise/${config.name}`,
    version,
    description: `NoiseValidator ${config.name} sub-package for web clients`,
    main: `index.js`,
    types: `index.d.ts`,
    module: `index.js`,
    type: 'module',
    author,
    publish,
    repository,
    license,
  };

  return package_json;
};

// -- Build
await esbuild.build({
    entryPoints: sub_packages.map(p => { return {
      in: p.in,
      out: p.out,
    }}),
    outdir: 'dist/',
    // --esm
    format: 'esm',
    bundle: true,
    plugins: [
      esbuildPluginTsc({
        force: true,
      }),
    ],
    tsconfig: 'tsconfig.json',
}).then(async () => {
  console.log('Build complete!');

  // -- Run tsc --emitDeclarationOnly to generate types
  try { await $`tsc --emitDeclarationOnly`; }
  catch (e) { console.error(e); }
  console.log('Types generated!');

  // -- Generate package.json files
  sub_packages.forEach((config) => {
    console.log(`Generating package.json for ${config.name}`, `dist/${config.path}/package.json`);
    const package_json = build_package_json(config);
    writeFileSync(`dist/${config.path}/package.json`, JSON.stringify(package_json, null, 2));
  });

  // -- Publish all packages
  sub_packages.forEach(async (config) => {
    try { await $`npm publish dist/${config.path}`; }
    catch (e) { console.error(e); }
  });
});