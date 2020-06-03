import {eventBus} from "../src/eventBus.js";
import Vue from "vue";


var F3DInteractionCameraDraw = class {
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
    eventBus.$emit('cameraDraw',false);

  }

  e_up(fromScale,x, y) {
    this.mouseDown = false;
    if (this.draw_mode && !fromScale) {
        if (!this.select) {
          var voxel = this.createSphere(0xffff00, this.SPHERESCALE);
          this.addSphereToScene(voxel, this.intersect);
          this.addNextRing(voxel);
          this.indexPickedBody = this.bodyNumber;
          this.indexPickedChain = this.chainsNumber;
          this.indexPickedObject = this.spheresNumber - 1;
          //window.actionsStack.addAction("ADDSPHERE", this.indexPickedObject);
        }
        this.controls.enabled = true;
        this.intersect = {};
    } else {
        this.draw_mode = true;
    }
    this.showBBox(
        this.f3dWorld[this.indexPickedBody][this.indexPickedChain][
        +this.indexPickedObject
        ].sphere,
        this
    );
    this.interpolate_group.children.length = 0;
    this.ch_group.children.length = 0;
    this.setSelect(false);
    //this.setDraw();
    this.interpolateSpheres();
    this.setFrustumVertices(this.camera, this.frustumVertices);
    this.updatePlane();
    //check what is under the mouse now
    let intersects = {};
    if (x && y) {
        intersects = this.intersect_fn(x, y);
        if (
        intersects[0].object.name.indexOf("f3d_sphere_") !== -1 ||
        intersects[0].object.name.indexOf("interpolation_") !== -1
        ) {
        this.controls.enabled = false;
        } else {
        this.controls.enabled = true;
        }
    }
    this.render();
    
  }

  e_down(x, y) {
    //return this.ret_down + "-" + x + "-" + y;
    this.mouseDown = true;
    var intersects = this.intersect_fn(x, y);
    if (intersects.length > 0) {
        if (intersects[0].object.name.indexOf("f3d_sphere_") !== -1) {
            this.controls.enabled = false;
            let sphereTokens = intersects[0].object.name.split("_");
            let index_f3d_sphere = parseInt(sphereTokens[2]);
            let index_body = parseInt(sphereTokens[3]);
            let index_chain = parseInt(sphereTokens[4]);
            this.indexPickedObject = index_f3d_sphere;
            this.indexPickedBody = index_body;
            this.indexPickedChain = index_chain;
            this.setSelect(true);
        } else if (intersects[0].object.name.indexOf("interpolation_") !== -1) {
            this.controls.enabled = false;
            let interpolation_tokens = intersects[0].object.name.split("_");
            let token_objId1 = interpolation_tokens[1];
            let token_objId2 = interpolation_tokens[2];
            let token_body = interpolation_tokens[3];
            let token_chain = interpolation_tokens[4];
            let firstRing = this.f3dWorld[token_body][token_chain][+token_objId1];
            var voxel = this.createSphere(0xffff00, this.SPHERESCALE);
            let index_to_replace = firstRing.head.indexOf(parseInt(token_objId2));
            let ring = {
                back: null,
                head: [firstRing.head[index_to_replace]],
                sphere: voxel
            };
            firstRing.head[index_to_replace] = this.spheresNumber;
            this.f3dWorld[token_body][token_chain][+this.spheresNumber] = ring;
            this.indexPickedObject = this.spheresNumber;
            this.indexPickedBody = token_body;
            this.indexPickedChain = token_chain;
            this.setSelect(true);
            this.addSphereToScene(voxel, intersects[0]);
            this.render();
        } else if (intersects[0].object.name.indexOf("wp") !== -1) {
            this.intersect = intersects[0];
            this.setSelect(false);
        }
    } else {
        console.log("nothing here");
    }
  }

  e_move(x, y) {
    this.lastX = x;
    this.lastY = y;
    var intersects = this.intersect_fn(x, y);
    if (intersects.length > 0) {
      if (intersects[0].object.name.indexOf("wp") != -1) {
        this.disableControls = false;
      } else {
        this.disableControls = true;
      }
      if (this.mouseDown) {
        if (
          (this.indexPickedObject || this.indexPickedObject === 0) &&
          this.select
        ) {
          for (
            let i = 0, intersect_length = intersects.length;
            i < intersect_length;
            i++
          ) {
            //if(intersects[i].object.name.indexOf('wp') != -1){
            this.f3dWorld[this.indexPickedBody][this.indexPickedChain][
              +this.indexPickedObject
            ].sphere.position.copy(intersects[i].point);
            this.f3dWorld[this.indexPickedBody][this.indexPickedChain][
              +this.indexPickedObject
            ].sphere.updateMatrixWorld();
            //}
          }
        } else {
          this.draw_mode = false;
        }
      }

      this.render();
    //return this.ret_move + "-" + x + "-" + y;
    }
  }
    
}

var F3DInteractionCurveLine  = class extends F3DInteractionCameraDraw {
  constructor(id, fn, fn1, fn2, img) {
    super(id, fn, fn1, fn2, img);
    this.ret_up = "up event 2 ";
    this.ret_move = "move event 2 ";
    this.ret_down = "down event 2 ";
  }
  up() {
    this.fn = this.fn.indexOf(this.fn1) === -1 ? this.fn1 : this.fn2;
    Vue.prototype.$f3dInteraction = this;
    eventBus.$emit('curveLine',false);

  }
}

export { F3DInteractionCameraDraw, F3DInteractionCurveLine}
