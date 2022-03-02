import { createApp } from 'vue';
import App from './App.vue';
import { useRouter } from './router';
import 'virtual:windi.css';
import '@/style/index.scss';
import '@/style/tailwind.css';

const app = createApp(App);

useRouter(app);
app.mount('#app');
