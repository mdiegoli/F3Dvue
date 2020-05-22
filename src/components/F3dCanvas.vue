<template>
  <canvas
    @mousedown.prevent="down"
    @mouseup.prevent="up"
    @mousemove.prevent="move"
    @touchstart="t_down"
    @touchend="t_up"
    @touchmove="t_move"
  ></canvas>
</template>

<script>
var f3d_interaction = class {
  constructor() {
    this.ret_up = "up event";
    this.ret_move = "move event";
    this.ret_down = "down event";
  }

  up(x, y) {
    return this.ret_up + "-" + x + "-" + y;
  }

  down(x, y) {
    return this.ret_down + "-" + x + "-" + y;
  }

  move(x, y) {
    return this.ret_move + "-" + x + "-" + y;
  }
};
/*
var f3d_interaction2 = class extends f3d_interaction {
  constructor() {
    super();
    this.ret_up = "up event 2 ";
    this.ret_move = "move event 2 ";
    this.ret_down = "down event 2 ";
  }
};
*/
export default {
  name: "F3dCanvas",
  props: {
    button: Object
  },
  data: function() {
    return {
      interaction: Object,
      x: Number,
      y: Number,
      oldX: Number,
      oldY: Number
    };
  },
  mounted: function() {
    this.interaction = new f3d_interaction();
  },
  methods: {
    move: function(e) {
      this.oldX = this.x;
      this.oldY = this.y;
      this.x = e.pageX;
      this.y = e.pageY;
      console.log(this.interaction.move(this.x, this.y));
    },
    up: function(e) {
      this.x = e.pageX;
      this.y = e.pageY;
      console.log(this.interaction.up(this.x, this.y));
    },
    down: function(e) {
      this.x = e.pageX;
      this.y = e.pageY;
      console.log(this.interaction.down(this.x, this.y));
    },
    t_move: function(e) {
      this.oldX = this.x;
      this.oldY = this.y;
      this.x = e.changedTouches[0].pageX;
      this.y = e.changedTouches[0].pageY;
      console.log(this.interaction.move(this.x, this.y));
    },
    t_up: function(e) {
      this.x = e.changedTouches[0].pageX;
      this.y = e.changedTouches[0].pageY;
      console.log(this.interaction.up(this.x, this.y));
    },
    t_down: function(e) {
      this.x = e.changedTouches[0].pageX;
      this.y = e.changedTouches[0].pageY;
      console.log(this.interaction.down(this.x, this.y));
    }
  }
};
</script>

<style>
.barButton {
  float: left;
  width: 6em;
  border: 1px solid black;
  background: white;
  border-radius: 5px;
}
</style>

