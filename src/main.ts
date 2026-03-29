import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueKonva from 'vue-konva'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faBone, faCouch, faMugHot, faStar, faLeaf, faMusic, faGift,
} from '@fortawesome/free-solid-svg-icons'
import './style.css'
import App from './App.vue'

library.add(faBone, faCouch, faMugHot, faStar, faLeaf, faMusic, faGift)

const app = createApp(App)
app.use(createPinia())
app.use(VueKonva)
app.component('FontAwesomeIcon', FontAwesomeIcon)
app.mount('#app')
