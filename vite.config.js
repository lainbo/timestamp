import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './',
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          'arcoblue-6': '#5b61ff'
        },
        javascriptEnabled: true
      }
    }
  },
  plugins: [
    vue(),
    UnoCSS(),
    Components({
      resolvers: [ArcoResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 1234,
    strictPort: true,
    open: true
  },
  build: {
    minify: 'oxc',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'arco',
              test: /node_modules[\\/]@arco-design[\\/]web-vue/,
              priority: 20
            },
            {
              name: 'dep',
              test: /node_modules[\\/](?:vue|@vueuse)[\\/]/,
              priority: 10
            }
          ]
        },
        minify: {
          compress: {
            dropConsole: true,
            dropDebugger: true
          }
        }
      }
    }
  }
})
