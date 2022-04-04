import { createApp } from 'vue'
import App from './App.vue'
import 'virtual:windi.css'
import VueClipboard from 'vue3-clipboard'
import '@arco-design/web-vue/es/message/style/css.js'
createApp(App).use(VueClipboard, {
  autoSetContainer: true,
  appendToBody: true
}).mount('#app')
