import Vue from "vue";
import App from "./F3D.vue";
import VueMeta from "vue-meta";

Vue.use(VueMeta, {
  // optional pluginOptions
  refreshOnceOnNavigation: true
});

Vue.config.productionTip = false;

Vue.prototype.$globalF3d = {};
Vue.prototype.$globalF3d.test = true;
Vue.prototype.$f3dInteraction = {};

new Vue({
  render: h => h(App)
}).$mount("#app");
