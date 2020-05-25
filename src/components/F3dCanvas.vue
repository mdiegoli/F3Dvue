<template>
  <canvas id="f3dCanvas"
    @mousedown.prevent="down"
    @mouseup.prevent="up"
    @mousemove.prevent="move"
    @touchstart="t_down"
    @touchend="t_up"
    @touchmove="t_move"
  ></canvas>
</template>

<script>
import Vue from "vue";
import * as THREE from "../../js/three.module.js";
import { ConvexBufferGeometry } from "../../js/ConvexGeometry.js";
import { OrbitControls } from "../../js/OrbitControls.js";

/*
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
      oldY: Number,
      oldX: Number,
      oldY: Number,
      lastX: Number,
      lastY: Number,
      lastSphere: Object,
      camera: Object,
      scene: Object,
      renderer: Object,
      mouse: Object,
      raycaster: Object,
      isShiftDown: Boolean,
      plane: Object,
      draw_mode: Boolean,
      indexPickedObject: Number,
      indexPickedBody: Number,
      indexPickedChain: Number,
      f3d_scene: Object,
      group: Object
    };
  },
  mounted: function() {
    this.f3d_scene[0] = [];
    this.container = document.getElementById("f3dCanvas");
    //camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    this.camera.position.set(1000, 0, 0);
    this.camera.lookAt(new THREE.Vector3());
    this.scene = new THREE.Scene();
    var sizeH = window.innerHeight,
      sizeW = window.innerWidth,
      step = 100;
    var geometry = new THREE.Geometry();
    for (var i = -sizeH; i <= sizeH; i += step) {
      geometry.vertices.push(new THREE.Vector3(-sizeW, 0, i));
      geometry.vertices.push(new THREE.Vector3(sizeW, 0, i));
    }
    for (var i = -sizeW; i <= sizeW; i += step) {
      geometry.vertices.push(new THREE.Vector3(i, 0, -sizeH));
      geometry.vertices.push(new THREE.Vector3(i, 0, sizeH));
    }
    var material = new THREE.LineBasicMaterial({
      color: 0x000000,
      opacity: 0.2,
      transparent: true
    });
    var line = new THREE.LineSegments(geometry, material);
    var geometry = new THREE.PlaneBufferGeometry(2000, 2000);
    geometry.rotateX(-Math.PI / 2);
    this.plane = new THREE.Mesh(
      geometry,
      new THREE.MeshToonMaterial({ visible: false })
    );
    this.plane.name = "wp";
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    // Lights
    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(1000, 0, 0);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 500;
    spotLight.shadow.camera.far = 4000;
    spotLight.shadow.camera.fov = 30;
    spotLight.target = this.plane;
    this.scene.add(spotLight);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(0xf0f0f0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
    this.group = new THREE.Group();
    this.interpolate_group = new THREE.Group();
    this.ch_group = new THREE.Group();
    this.scene.add(this.group);
    this.scene.add(this.interpolate_group);
    this.scene.add(this.ch_group);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    //document.addEventListener("keyup", this.onDocumentKeyUp.bind(this), false);
    //document.addEventListener("wheel", this.onDocumentWheel.bind(this), false);
    window.addEventListener("resize", this.onWindowResize.bind(this), false);
    Array.prototype.insertAt = function(pos, val) {
      let first = this.slice(0, pos + 1);
      let second = this.slice(pos + 1, this.length);
      return first.concat(val).concat(second);
    };
    this.spheresNumber = 0;
    this.chainsNumber = 0;
    this.bodyNumber = 0;
    this.f3dWorld = {};
    this.f3dWorld[+this.bodyNumber] = {};
    this.f3dWorld[+this.bodyNumber][+this.chainsNumber] = {};
    this.f3dWorld[+this.bodyNumber][+this.chainsNumber][
      +this.spheresNumber
    ] = {};
    this.isTouched = false;
    this.hideConvexHull = true;
    this.frustumVertices = [
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3()
    ];
    this.planeMesh = this.createPlaneMesh();
    this.scene.add(this.planeMesh);
    this.setFrustumVertices(this.camera, this.frustumVertices);
    this.updatePlane();
    this.distanceFactor = 10;
    this.targetWP = false;
    this.NUMINTSPHERECURVE = 10;
    this.intersect = {};
    this.mouseDown = false;
    this.setSelect(false);
    this.disableControls = false;
    this.lineCurve = true;
    this.isShiftDown = false; 
    this.draw_mode = true;
    this.SPHERESCALE = 1;
    
  },
  methods: {
    move: function(e) {
      this.oldX = this.x;
      this.oldY = this.y;
      this.x = e.pageX;
      this.y = e.pageY;
      console.log(Vue.prototype.$f3dInteraction.e_move.call(this, this.x, this.y));
    },
    up: function(e) {
      this.x = e.pageX;
      this.y = e.pageY;
      console.log(Vue.prototype.$f3dInteraction.e_up.call(this, "", this.x, this.y));
    },
    down: function(e) {
      this.x = e.pageX;
      this.y = e.pageY;
      console.log(Vue.prototype.$f3dInteraction.e_down.call(this, this.x, this.y));
    },
    t_move: function(e) {
      this.oldX = this.x;
      this.oldY = this.y;
      this.x = e.changedTouches[0].pageX;
      this.y = e.changedTouches[0].pageY;
      console.log(Vue.prototype.$f3dInteraction.e_move.call(this, this.x, this.y));
    },
    t_up: function(e) {
      this.x = e.changedTouches[0].pageX;
      this.y = e.changedTouches[0].pageY;
      console.log(Vue.prototype.$f3dInteraction.e_up.call(this, false, this.x, this.y));
    },
    t_down: function(e) {
      this.x = e.changedTouches[0].pageX;
      this.y = e.changedTouches[0].pageY;
      console.log(Vue.prototype.$f3dInteraction.e_down.call(this, this.x, this.y));
    },
    createPlaneMesh: function() {
      this.skyPlaneGeometry = new THREE.BufferGeometry();
      // positions
      const positions = new Float32Array([
        0.0,
        0.0,
        1.0,
        1.0,
        0.0,
        1.0,
        1.0,
        1.0,
        1.0,
        0.0,
        1.0,
        1.0
      ]);
      this.skyPlanePositions = new THREE.BufferAttribute(positions, 3);
      this.skyPlanePositions.setDynamic(true);
      this.skyPlaneGeometry.addAttribute("position", this.skyPlanePositions);
      // indexes
      this.skyPlaneIndexes = new THREE.BufferAttribute(
        new Uint32Array([2, 1, 0, 3, 2, 0]),
        1
      );
      this.skyPlaneGeometry.setIndex(this.skyPlaneIndexes);
      // uvs
      const uvs = new Float32Array([0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0]);
      this.skyPlaneUVs = new THREE.BufferAttribute(uvs, 2);
      this.skyPlaneGeometry.addAttribute("uv", this.skyPlaneUVs);
      this.skyPlaneGeometry.computeBoundingSphere();
      var pmesh = new THREE.Mesh(
        this.skyPlaneGeometry,
        new THREE.MeshBasicMaterial({
          //depthTest: false,
          color: 0xff0000,
          side: THREE.DoubleSide,
          //map: this.texture
          opacity: 0.5,
          transparent: true
        })
      );
      //this.mesh.frustumCulled = false;
      pmesh.name = "wp";
      return pmesh;
    },
    setFrustumVertices: function(cam, corners) {
      cam.projectionMatrix.copy(cam.projectionMatrix);
      var cornerIndex = 0;

      function addPoint(x, y, z) {
        corners[cornerIndex++].set(x, y, z).unproject(cam);
      }
      const w = 1;
      const h = 1;
      const n = -1;
      const f = 1;
      // near
      addPoint(-w, -h, n);
      addPoint(w, -h, n);
      addPoint(-w, h, n);
      addPoint(w, h, n);
      // far
      addPoint(-w - 0.25, -h - 0.25, f - 0.01);
      addPoint(w + 0.25, -h - 0.25, f - 0.01);
      addPoint(-w - 0.25, h + 0.25, f - 0.01);
      addPoint(w + 0.25, h + 0.25, f - 0.01);
    },
    updatePlane: function() {
      var bottomLeftFarCorner = this.frustumVertices[4];
      var bottomRightFarCorner = this.frustumVertices[5];
      var topLeftFarCorner = this.frustumVertices[6];
      var topRightFarCorner = this.frustumVertices[7];
      var zOffset = 0;
      this.skyPlanePositions.setXYZ(
        0,
        bottomLeftFarCorner.x,
        bottomLeftFarCorner.y,
        bottomLeftFarCorner.z + zOffset // z fighting test
      );
      this.skyPlanePositions.setXYZ(
        1,
        topLeftFarCorner.x,
        topLeftFarCorner.y,
        topLeftFarCorner.z + zOffset
      );
      this.skyPlanePositions.setXYZ(
        2,
        topRightFarCorner.x,
        topRightFarCorner.y,
        topRightFarCorner.z + zOffset
      );
      this.skyPlanePositions.setXYZ(
        3,
        bottomRightFarCorner.x,
        bottomRightFarCorner.y,
        bottomRightFarCorner.z + zOffset
      );
      this.planeMesh.geometry.computeBoundingSphere(); //<- serve ancora?
      this.planeMesh.geometry.computeBoundingBox();

      this.skyPlanePositions.needsUpdate = true;
      if (this.targetWP)
        this.planeMesh.geometry.boundingBox.getCenter(this.controls.target);
    },
    setSelect: function(bool) {
      this.select = bool;
    },
    render: function() {
      this.renderer.render(this.scene, this.camera);
    },
    onWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    intersect_fn(x, y) {
      this.mouse.set(
        (x / window.innerWidth) * 2 - 1,
        -(y / window.innerHeight) * 2 + 1
      );
      this.raycaster.setFromCamera(this.mouse, this.camera);
      return this.raycaster.intersectObjects(this.scene.children, true);
    },
    addSphereToScene(voxel, intersect) {
      voxel.name =
        "f3d_sphere_" +
        this.spheresNumber +
        "_" +
        this.bodyNumber +
        "_" +
        this.chainsNumber;
      this.setOldCoord(intersect.point.x, intersect.point.z);
      voxel.position.copy(intersect.point).add(intersect.face.normal);
      voxel.updateMatrixWorld();
      this.group.add(voxel);
      if (!this.targetWP) this.controls.target.copy(intersect.point);
      this.spheresNumber += 1;
    },
    showBBox(voxel, me) {
      if (!me) me = this;
      if (!me.boxHelper) {
        me.boxHelper = new THREE.BoxHelper(voxel, 0xffff00);
        me.scene.add(me.boxHelper);
      } else {
        me.boxHelper.setFromObject(voxel);
      }
    },
    createSphere(color, scale) {
      var geometry = new THREE.SphereGeometry(5, 8, 8);
      var material = new THREE.MeshToonMaterial({ color: color });
      this.lastSphere = new THREE.Mesh(geometry, material);
      this.lastSphere.scale.x = scale;
      this.lastSphere.scale.y = scale;
      this.lastSphere.scale.z = scale;
      return this.lastSphere;
    },
    setOldCoord(x, y) {
      this.oldX = x;
      this.oldY = y;
    },
    addNextRing(voxel) {
      var ring = {};
      if (this.spheresNumber == 1) {
        ring = { back: null, head: [], sphere: voxel };
        this.f3dWorld[+this.bodyNumber][+this.chainsNumber][
          +(this.spheresNumber - 1)
        ] = ring;
      } else {
        //this.f3dWorld[this.indexPickedBody][this.indexPickedChain][+(this.indexPickedObject)].sphere.position.copy( intersects[i].point );
        ring = { back: this.indexPickedObject, head: [], sphere: voxel };
        //my ring
        this.f3dWorld[+this.indexPickedBody][+this.indexPickedChain][
          +(this.spheresNumber - 1)
        ] = ring;
        //update selected sphere
        if (
          this.f3dWorld[+this.indexPickedBody][+this.indexPickedChain][
            +this.indexPickedObject
          ].head.length == 0
        )
          this.f3dWorld[+this.indexPickedBody][+this.indexPickedChain][
            +this.indexPickedObject
          ].head = [this.spheresNumber - 1];
        else
          this.f3dWorld[+this.indexPickedBody][+this.indexPickedChain][
            +this.indexPickedObject
          ].head.push(this.spheresNumber - 1);
      }
    },
    interpolateSpheres() {
    var curvePoints = [];
    var curveScales = [];
    for (let b = 0, b_l = Object.keys(this.f3dWorld).length; b < b_l; b++) {
      for (
        let c = 0, c_l = Object.keys(this.f3dWorld[+b]).length;
        c < c_l;
        c++
      ) {
        for (
          let s = 0, s_l = Object.keys(this.f3dWorld[+b][+c]).length;
          s < s_l;
          s++
        ) {
          let st = this.f3dWorld[+b][+c][+s];
          if (st.head && st.head.length > 0) {
            if (this.lineCurve) {
              let s1 = st.sphere;
              for (let h = 0, h_l = st.head.length; h < h_l; h++) {
                let s2 = this.f3dWorld[+b][+c][+st.head[h]].sphere;
                this.r_interpolate2Spheres(s1, s2, s, st.head[h]);
                if (!this.hideConvexHull)
                  this.convexHullBetween2Spheres(s1, s2, s, st.head[h]);
              }
            } else {
              if (!this.curvePoints && curvePoints.length == 0) {
                curvePoints.push(st.sphere.position);
                curveScales.push(st.sphere.scale);
              }
              for (let h = 0, h_l = st.head.length; h < h_l; h++) {
                curvePoints.push(
                  this.f3dWorld[+b][+c][+st.head[h]].sphere.position
                );
                curveScales.push(
                  this.f3dWorld[+b][+c][+st.head[h]].sphere.scale
                );
                //this.r_interpolate2Spheres(s1,s2,s,st.head[h]);
                //if(!this.hideConvexHull) this.convexHullBetween2Spheres(s1,s2,s,st.head[h]);
              }
              if (s == s_l - 2) this.createCurve(curvePoints, curveScales);
            }
          }
        }
      }
    }
  },

  convexHullBetween2Spheres(s1, s2, i, ii) {
    var points = [];
    s1.geometry.vertices.map(e => {
      points.push(
        new THREE.Vector3(e.x, e.y, e.z).applyMatrix4(s1.matrixWorld)
      );
    });
    s2.geometry.vertices.map(e => {
      points.push(
        new THREE.Vector3(e.x, e.y, e.z).applyMatrix4(s2.matrixWorld)
      );
    });
    var geometry = new ConvexBufferGeometry(points);
    var material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      opacity: 0.5,
      transparent: true
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.name = "convexhull_" + i + "_" + ii;
    this.ch_group.add(mesh);
  },

  interpolate2Spheres(s1, s2, i, ii) {
    let x_diff = s1.position.x - s2.position.x;
    let y_diff = s1.position.y - s2.position.y;
    let z_diff = s1.position.z - s2.position.z;
    let scale_x_diff = s1.scale.x - s2.scale.x;
    let scale_y_diff = s1.scale.y - s2.scale.y;
    let scale_z_diff = s1.scale.z - s2.scale.z;
    let token_position_x,
      token_position_y,
      token_position_z,
      token_scale_x,
      token_scale_y,
      token_scale_z;
    let distance = Math.sqrt(
      x_diff * x_diff + y_diff * y_diff + z_diff * z_diff
    );
    let numberOfTokens;
    numberOfTokens = distance / 30;
    token_position_x = x_diff / numberOfTokens;
    token_position_y = y_diff / numberOfTokens;
    token_position_z = z_diff / numberOfTokens;
    token_scale_x = scale_x_diff / numberOfTokens;
    token_scale_y = scale_y_diff / numberOfTokens;
    token_scale_z = scale_z_diff / numberOfTokens;
    for (let s = 0; s < numberOfTokens - 1; s++) {
      let sphere = this.createSphere(0xff0000);
      sphere.position.x = s1.position.x - token_position_x * (s + 1);
      sphere.position.y = s1.position.y - token_position_y * (s + 1);
      sphere.position.z = s1.position.z - token_position_z * (s + 1);
      sphere.scale.x = s1.scale.x - token_scale_x * (s + 1);
      sphere.scale.y = s1.scale.y - token_scale_y * (s + 1);
      sphere.scale.z = s1.scale.z - token_scale_z * (s + 1);
      sphere.name =
        "interpolation_" +
        i +
        "_" +
        ii +
        "_" +
        this.bodyNumber +
        "_" +
        this.chainsNumber;

      this.interpolate_group.add(sphere);
    }
  },

  r_interpolate2Spheres(s1, s2, i, ii) {
    let x_diff = s1.position.x - s2.position.x;
    let y_diff = s1.position.y - s2.position.y;
    let z_diff = s1.position.z - s2.position.z;
    let scale_x_diff = s1.scale.x - s2.scale.x;
    let scale_y_diff = s1.scale.y - s2.scale.y;
    let scale_z_diff = s1.scale.z - s2.scale.z;
    let token_position_x,
      token_position_y,
      token_position_z,
      token_scale_x,
      token_scale_y,
      token_scale_z;
    let distance = Math.sqrt(
      x_diff * x_diff + y_diff * y_diff + z_diff * z_diff
    );
    let numberOfTokens;
    numberOfTokens = 2;
    token_position_x = x_diff / numberOfTokens;
    token_position_y = y_diff / numberOfTokens;
    token_position_z = z_diff / numberOfTokens;
    token_scale_x = scale_x_diff / numberOfTokens;
    token_scale_y = scale_y_diff / numberOfTokens;
    token_scale_z = scale_z_diff / numberOfTokens;
    let sphere = this.createSphere(0xff0000);
    sphere.position.x = s1.position.x - token_position_x;
    sphere.position.y = s1.position.y - token_position_y;
    sphere.position.z = s1.position.z - token_position_z;
    sphere.scale.x = s1.scale.x - token_scale_x;
    sphere.scale.y = s1.scale.y - token_scale_y;
    sphere.scale.z = s1.scale.z - token_scale_z;
    sphere.name =
      "interpolation_" +
      i +
      "_" +
      ii +
      "_" +
      this.bodyNumber +
      "_" +
      this.chainsNumber;
    this.interpolate_group.add(sphere);
    if (
      distance > s1.scale.x * this.distanceFactor ||
      distance > s2.scale.x * this.distanceFactor
    ) {
      this.r_interpolate2Spheres(s1, sphere, i, ii);
      this.r_interpolate2Spheres(sphere, s2, i, ii);
    }
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

