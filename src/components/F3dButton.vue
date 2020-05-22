<template>
  <div :id="button.id" class="barButton" @mouseup="up">{{button.fn}}</div>
</template>

<script>
export default {
  name: "F3dButton",
  props: {
    button: Object
  },
  methods: {
    up: function() {
      console.log(this.$globalF3d.test);
      this.button.up();
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