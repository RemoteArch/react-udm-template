const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Obtenir le chemin global de pnpm
function getGlobalNodeModules() {
    try {
        const globalDir = execSync('pnpm root -g', { encoding: 'utf8' }).trim();
        return globalDir;
    } catch (e) {
        return null;
    }
}

// Charger un module global
function requireGlobal(moduleName) {
    const globalPath = getGlobalNodeModules();
    if (globalPath) {
        const modulePath = path.join(globalPath, moduleName);
        if (fs.existsSync(modulePath)) {
            return require(modulePath);
        }
    }
    return require(moduleName);
}

// Vérifier et installer les dépendances si nécessaire
function checkAndInstallDependencies() {
    const dependencies = ['@babel/core', '@babel/preset-react', '@babel/preset-env', 'terser'];
    const globalPath = getGlobalNodeModules();
    const missing = [];

    for (const dep of dependencies) {
        try {
            if (globalPath) {
                const modulePath = path.join(globalPath, dep);
                if (!fs.existsSync(modulePath)) {
                    missing.push(dep);
                }
            } else {
                require.resolve(dep);
            }
        } catch (e) {
            missing.push(dep);
        }
    }

    if (missing.length > 0) {
        console.log(`Installation des dépendances manquantes: ${missing.join(', ')}...`);
        try {
            execSync(`pnpm install -g ${missing.join(' ')}`, { stdio: 'inherit' });
            console.log('Dépendances installées!\n');
        } catch (e) {
            console.error('Erreur lors de l\'installation des dépendances');
            process.exit(1);
        }
    }
}

checkAndInstallDependencies();

const babel = requireGlobal('@babel/core');
const { minify } = requireGlobal('terser');

// Chemin absolu des presets
const globalPath = getGlobalNodeModules();
const presetReactPath = path.join(globalPath, '@babel/preset-react');
const presetEnvPath = path.join(globalPath, '@babel/preset-env');

// Récupérer le chemin du dossier en argument
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: node build-jsx.js <chemin_du_dossier>');
    process.exit(1);
}

const componentsDir = path.resolve(args[0]);

if (!fs.existsSync(componentsDir)) {
    console.error(`Erreur: Le dossier "${componentsDir}" n'existe pas`);
    process.exit(1);
}

// Liste des fichiers à compiler (sans extension)
const files = fs.readdirSync(componentsDir)
    .filter(file => file.endsWith('.jsx'))
    .map(file => file.replace('.jsx', ''));

async function buildFile(name) {
    const inputPath = path.join(componentsDir, `${name}.jsx`);
    const outputPath = path.join(componentsDir, `${name}.js`);

    try {
        // Lire le fichier source
        const source = fs.readFileSync(inputPath, 'utf8');

        // Compiler avec Babel
        const babelResult = babel.transformSync(source, {
            presets: [
                [presetEnvPath, { modules: false }],
                presetReactPath
            ],
            filename: inputPath
        });

        // Minifier avec Terser
        const terserResult = await minify(babelResult.code, {
            compress: true,
            mangle: true,
            module: true
        });

        // Écrire le fichier compilé
        fs.writeFileSync(outputPath, terserResult.code);
        console.log(`✓ ${name}.jsx -> ${name}.js`);
    } catch (error) {
        console.error(`✗ ${name}.jsx: ${error.message}`);
    }
}

async function build() {
    console.log(`Compilation de ${files.length} fichiers...\n`);
    
    for (const file of files) {
        await buildFile(file);
    }
    
    console.log('\nTerminé!');
}

build();
