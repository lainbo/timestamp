import { createApp } from 'vue'
import App from './App.vue'
import 'uno.css'
import '@unocss/reset/tailwind.css'
import '@arco-design/web-vue/dist/arco.less'
import '@/styles/global.scss'
import VueClipboard from 'vue3-clipboard'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
dayjs.extend(timezone)
import '@arco-design/web-vue/es/message/style/css.js'

createApp(App)
  .use(VueClipboard, {
    autoSetContainer: true,
    appendToBody: true
  })
  .mount('#app')
