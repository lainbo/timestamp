import { createApp } from 'vue'
import '@unocss/reset/tailwind.css'
import App from './App.vue'
import '@arco-design/web-vue/dist/arco.less'
import '@arco-design/web-vue/es/message/style/css.js'
import 'uno.css'
import '@/styles/global.scss'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
dayjs.extend(timezone)

createApp(App).mount('#app')
