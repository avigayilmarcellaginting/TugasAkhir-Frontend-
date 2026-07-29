import axios from 'axios'
import './style.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

axios.defaults.withCredentials = true

// Intercept responses to remove hardcoded IP address in image URLs
axios.interceptors.response.use(response => {
  const replaceIp = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/http:\/\/103\.16\.117\.81/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(replaceIp);
    }
    if (typeof obj === 'object' && obj !== null) {
      const newObj = {};
      for (const key in obj) {
        newObj[key] = replaceIp(obj[key]);
      }
      return newObj;
    }
    return obj;
  };
  
  if (response.data) {
    response.data = replaceIp(response.data);
  }
  return response;
});

const app = createApp(App)

app.use(router)

app.mount('#app')
