import { defineConfig } from 'vite'
import { resolve } from 'path'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
import { chunkSplitPlugin } from 'vite-plugin-chunk-split'
import UnoCSS from 'unocss/vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  base: './',
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          'arcoblue-6': '#646cff'
        },
        javascriptEnabled: true
      }
    }
  },
  plugins: [
    vue(),
    UnoCSS(),
    AutoImport({
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
        globalsPropValue: true
      },
      imports: ['vue', '@vueuse/core']
    }),
    Components({
      resolvers: [ArcoResolver()]
    }),
    chunkSplitPlugin({
      strategy: 'default',
      customSplitting: {
        customize: [/src\/utils/, /src\/assets/],
        arco: ['@arco-design/web-vue']
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
