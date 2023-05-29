import { defineConfig, normalizePath, build } from 'vite'
import fs from 'fs'
import path, { resolve } from 'path'
import { fileURLToPath } from 'url';
import nunjucks from 'vite-plugin-nunjucks'
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = resolve(__dirname, 'src')

const getFiles = () => {
    let files = {}
    
    fs.readdirSync(root)
        .filter(filename => filename.endsWith('.html'))
        .forEach(filename => {
            files[filename.slice(0, -5)] = resolve(root, filename)
        })
    return files
}

const files = getFiles()

const getVariables = (mode) => {
    const variables = {}
    Object.keys(files).forEach((filename) => {
        if(filename.includes('layouts')) filename = `layouts/${filename}`
        variables[filename + '.html'] = {
            web_title: "ASEAN Football Competition",
            isDev: mode === 'development'
        }
    })
    return variables
}

build({
    configFile: false,
    build: {
        emptyOutDir: false,
        outDir: resolve(__dirname, 'dist/assets/compiled/js'),
        lib: {
            name: 'app',
            formats: ['umd'],
            fileName: 'app',
            entry: './src/assets/js/main.ts',
        },
        rollupOptions: {
            output: {
                entryFileNames: '[name].js'
            }
        }
    },
})



export default defineConfig((env) => ({
    publicDir: 'static',
    base: './',
    root,
    plugins: [
        viteStaticCopy({
            targets: [
                { src: normalizePath(resolve(__dirname, './src/assets/static')), dest: 'assets' },
            ],
            watch: {
                reloadPageOnChange: true
            }
        }),
        // @ts-ignore
        nunjucks.default({
            templatesDir: root,
            variables: getVariables(env.mode),
            nunjucksEnvironment: {
                filters: {
                    containString: (str, containStr) => {
                        if (!str.length) return false
                        return str.indexOf(containStr) >= 0
                    },
                    startsWith: (str, targetStr) => {
                        if (!str.length) return false
                        return str.startsWith(targetStr)
                    }
                }
            }
        })
    ],
    resolve: {
        alias: {
          '@': normalizePath(resolve(__dirname, 'src')),
          '~bootstrap': normalizePath(resolve(__dirname, 'node_modules/bootstrap')),
        }
    },
    build: {
        emptyOutDir: false,
        manifest: true,
        target: "chrome58",
        outDir: resolve(__dirname, 'dist'),
        rollupOptions: {
          input: files,
          output: {
            entryFileNames: `assets/compiled/js/[name].js`,
            chunkFileNames: `assets/compiled/js/[name].js`,

            assetFileNames: (a) => {
                const extname = (a?.name || '').split('.')[1]
                let folder = extname ? `${extname}/` : ''
                
                return `assets/compiled/${folder}[name][extname]`
            }
          }
        },
    }
}))