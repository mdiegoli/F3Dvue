<template>
  <div id="app">
    <div style="position: absolute; top: 10px; width: 100%; text-align: center;">
      <div id="toolbar" class="toolbar">
        <div v-on:click="fn_hideShowToolbar">
          <svg
            class="bi bi-justify"
            width="1em"
            height="1em"
            viewBox="0 0 16 16"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M2 12.5a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zm0-3a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zm0-3a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zm0-3a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </div>
        <div v-show="canvas.showHideToolbar">
          <div class="buttons">
            <F3dButton v-for="(item,index) in buttons" v-bind:button="item" v-bind:key="index"/>
          </div>
        </div>
      </div>
    </div>
    <div>
      <F3dCanvas :width="canvas.width" :height="canvas.height"/>
    </div>
  </div>
</template>

<script>
import F3dButton from "./components/F3dButton.vue";
import F3dCanvas from "./components/F3dCanvas.vue";
import Vue from "vue";
import { F3DInteraction } from "../js/F3DInteraction.js"

var f3d_button = class {
  constructor(id, fn, fn1, fn2, img) {
    this.id = id;
    this.fn = fn;
    this.fn1 = fn1;
    this.fn2 = fn2;
    this.img = img;
    this.ret_up = "up event";
    this.ret_move = "move event";
    this.ret_down = "down event";
  }
  up() {
    this.fn = this.fn.indexOf(this.fn1) === -1 ? this.fn1 : this.fn2;
    Vue.prototype.$f3dInteraction = this;
  }

  e_up(x, y) {
    return this.ret_up + "-" + x + "-" + y;
  }

  e_down(x, y) {
    return this.ret_down + "-" + x + "-" + y;
  }

  e_move(x, y) {
    return this.ret_move + "-" + x + "-" + y;
  }
};

var f3d_button2 = class {
  constructor(id, fn, fn1, fn2, img) {
    this.id = id;
    this.fn = fn;
    this.fn1 = fn1;
    this.fn2 = fn2;
    this.img = img;
    this.ret_up = "up event 2 ";
    this.ret_move = "move event 2 ";
    this.ret_down = "down event 2 ";
  }
  up() {
    this.fn = this.fn.indexOf(this.fn1) === -1 ? this.fn1 : this.fn2;
    Vue.prototype.$f3dInteraction = this;
  }

  e_up(x, y) {
    return this.ret_up + "-" + x + "-" + y;
  }

  e_down(x, y) {
    return this.ret_down + "-" + x + "-" + y;
  }

  e_move(x, y) {
    return this.ret_move + "-" + x + "-" + y;
  }
};

export default {
  name: "App",
  metaInfo: {
    title: "F3D",
    meta: [
      { charset: "utf-8" },
      { name: "description", content: "gator" },
      { name: "viewport", content: "width=device-width, initial-scale=1" }
    ]
  },
  mounted: function() {
    Vue.prototype.$f3dInteraction = new F3DInteraction(
      "moveCamera",
      "CAMERA",
      "DRAW",
      "CAMERA",
      "images/pencil.svg"
    );
  },
  components: {
    F3dButton,
    F3dCanvas
  },
  created: function() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },
  data: function() {
    return {
      canvas: {
        width: 100,
        height: 100,
        showHideToolbar: false
      },
      buttons: [
        new f3d_button(
          "moveCamera",
          "CAMERA",
          "DRAW",
          "CAMERA",
          "images/pencil.svg"
        ),
        new f3d_button2(
          "curveLine",
          "CURVE",
          "LINE",
          "CURVE",
          "images/pencil.svg"
        )
      ]
    };
  },
  methods: {
    fn_hideShowToolbar: function() {
      this.canvas.showHideToolbar = !this.canvas.showHideToolbar;
    }
  }
};
</script>

<style>
body {
  font-family: Monospace;
  background-color: #f0f0f0;
  margin: 0px;
  overflow: hidden;
}
</style>