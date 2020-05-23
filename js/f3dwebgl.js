//if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
import * as THREE from "three.module.js";
import { ConvexBufferGeometry } from "ConvexGeometry.js";
import { TrackballControls } from "TrackballControls.js";
import { OrbitControls } from "OrbitControls.js";
import {
  widgetUndo,
  widgetRedo,
  widgetNumIntSpheresCurve,
  widgetLinesCurves,
  widgetTargetWP,
  widgetAddBody,
  widgetAddChain,
  widgetShowMesh,
  widgetDrawMove,
  widgetExportMesh,
  widgetSphereScale,
  saveWidget,
  loadWidget,
  widgetClear
} from "f3d_widgets.js";

var f3dwebgl = class {
  constructor() {
    //this.lastSphereCenterX;
    //this.lastSphereCenterY;
    this.oldX;
    this.oldY;
    this.lastX;
    this.lastY;
    this.lastSphere;
    this.container;
    this.camera;
    this.scene = [];
    this.renderer;
    this.mouse;
    this.raycaster;
    this.isShiftDown = false;
    this.plane;
    this.draw_mode = true;
    this.indexPickedObject;
    this.indexPickedBody;
    this.indexPickedChain;
    this.f3d_scene = [];
    this.f3d_scene[0] = [];
    this.group;
    this.info;
    this.info2;
    //div di debug
    this.container = document.createElement("div");
    document.body.appendChild(this.container);
    this.info = document.createElement("div");
    this.info.style.position = "absolute";
    this.info.style.top = "10px";
    this.info.style.width = "100%";
    this.info.style.textAlign = "center";
    //todo: create a js class to handle bar buttons
    this.SPHERESCALE = 1;
    this.drawMove = "MOVE";
    this.htmlWidgets = "";
    this.info.innerHTML = `
		<div id="toolbar" class="toolbar">
		</div>`;
    this.container.appendChild(this.info);
    this.link = document.createElement("a");
    this.link.style.display = "none";
    document.body.appendChild(this.link); // Firefox workaround, see #6594
    this.info2 = document.createElement("div");
    //this.info2.style.position = 'absolute';
    //this.info2.style.top = '30px';
    this.info2.style.width = "100%";
    this.info2.style.textAlign = "center";
    this.info2.innerHTML = "selezione";
    this.info.appendChild(this.info2);
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
    //this.controls.enabled = false;
    document.addEventListener(
      "mousemove",
      this.onDocumentMouseMove.bind(this),
      false
    );
    document.addEventListener(
      "touchmove",
      this.onDocumentMobileMouseMove.bind(this),
      false
    );
    document.addEventListener(
      "mousedown",
      this.onDocumentMouseDown.bind(this),
      false
    );
    document.addEventListener(
      "touchstart",
      this.onDocumentMobileMouseDown.bind(this),
      false
    );
    document.addEventListener(
      "keydown",
      this.onDocumentKeyDown.bind(this),
      false
    );
    document.addEventListener("keyup", this.onDocumentKeyUp.bind(this), false);
    document.addEventListener(
      "mouseup",
      this.onDocumentMouseUp.bind(this),
      false
    );
    document.addEventListener(
      "touchend",
      this.onDocumentMobileMouseUp.bind(this),
      false
    );
    document.addEventListener("wheel", this.onDocumentWheel.bind(this), false);
    //document.addEventListener( 'click', this.onDocumentClick.bind(this), false );
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
    this.targetLabel = "TARGETOBJ";
    //this.addbody = new widgetAddBody(this,'ADDBODY');
    //this.addchain = new widgetAddChain(this,'ADDCHAIN');
    this.showmesh = new widgetShowMesh(this, "SHOWMESH");
    this.exportmesh = new widgetExportMesh(this, "EXPORTMESH");
    this.drawmove = new widgetDrawMove(this, "MOVE");
    this.spherescale = new widgetSphereScale(this, "SPHERESCALE");
    this.saveModel = new saveWidget(this, "SAVEMODEL");
    this.targetWP = new widgetTargetWP(this, "TARGETOBJ");
    this.loadModel = new loadWidget(this, "LOADMODEL");
    this.sceneClear = new widgetClear(this, "CLEAR");
    this.lineCurveWidget = new widgetLinesCurves(this, "LINE");
    this.undoWidget = new widgetUndo(this, "UNDO");
    //this.redoWidget = new widgetRedo(this,'REDO');
    this.NUMINTSPHERECURVE = 10;
    this.numIntSphere = new widgetNumIntSpheresCurve(this, "NUMINTSPHERECURVE");
    this.intersect = {};
    this.mouseDown = false;
    this.setSelect(false);
    this.disableControls = false;
    this.lineCurve = true;
  }
  resetGroup() {
    this.group = new THREE.Group();
  }
  //from https://codepen.io/looeee/pen/RMLJYw
  createPlaneMesh() {
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
  }

  setFrustumVertices(cam, corners) {
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
  }

  updatePlane() {
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
  }

  addSphereToScene(me, voxel, intersect) {
    voxel.name =
      "f3d_sphere_" +
      me.spheresNumber +
      "_" +
      me.bodyNumber +
      "_" +
      me.chainsNumber;
    me.setOldCoord(intersect.point.x, intersect.point.z);
    //me.setLastSphereCenter(intersect.point.x,intersect.point.z);
    voxel.position.copy(intersect.point).add(intersect.face.normal);
    voxel.updateMatrixWorld();
    me.group.add(voxel);
    if (!this.targetWP) this.controls.target.copy(intersect.point);
    //me.indexPickedBody = me.bodyNumber;
    //me.indexPickedChain = me.chainsNumber;
    //me.indexPickedObject = me.spheresNumber;
    me.spheresNumber += 1;

    //me.showBBox(voxel,me);
  }

  showBBox(voxel, me) {
    if (!me) me = this;
    if (!me.boxHelper) {
      me.boxHelper = new THREE.BoxHelper(voxel, 0xffff00);
      me.scene.add(me.boxHelper);
    } else {
      me.boxHelper.setFromObject(voxel);
    }
  }

  createBNSphere(color, pos, scale, name, i) {
    var geometry = new THREE.SphereGeometry(5, 8, 8);
    var material = new THREE.MeshToonMaterial({ color: color });
    var lastSphere = new THREE.Mesh(geometry, material);
    lastSphere.position.x = pos.x;
    lastSphere.position.y = pos.y;
    lastSphere.position.z = pos.z;
    lastSphere.scale.x = scale.x;
    lastSphere.scale.y = scale.y;
    lastSphere.scale.z = scale.z;
    lastSphere.name = name;
    this.group.add(lastSphere);
    this.f3dWorld[+this.indexPickedBody][+this.indexPickedChain][
      +i
    ].sphere = lastSphere;
  }

  createSphere(color, scale) {
    var geometry = new THREE.SphereGeometry(5, 8, 8);
    var material = new THREE.MeshToonMaterial({ color: color });
    this.lastSphere = new THREE.Mesh(geometry, material);
    this.lastSphere.scale.x = scale;
    this.lastSphere.scale.y = scale;
    this.lastSphere.scale.z = scale;
    return this.lastSphere;
  }

  addNextRing(me, voxel) {
    var ring = {};
    if (me.spheresNumber == 1) {
      ring = { back: null, head: [], sphere: voxel };
      me.f3dWorld[+me.bodyNumber][+me.chainsNumber][
        +(me.spheresNumber - 1)
      ] = ring;
    } else {
      //me.f3dWorld[me.indexPickedBody][me.indexPickedChain][+(me.indexPickedObject)].sphere.position.copy( intersects[i].point );
      ring = { back: me.indexPickedObject, head: [], sphere: voxel };
      //my ring
      me.f3dWorld[+me.indexPickedBody][+me.indexPickedChain][
        +(me.spheresNumber - 1)
      ] = ring;
      //update selected sphere
      if (
        me.f3dWorld[+me.indexPickedBody][+me.indexPickedChain][
          +me.indexPickedObject
        ].head.length == 0
      )
        me.f3dWorld[+me.indexPickedBody][+me.indexPickedChain][
          +me.indexPickedObject
        ].head = [me.spheresNumber - 1];
      else
        me.f3dWorld[+me.indexPickedBody][+me.indexPickedChain][
          +me.indexPickedObject
        ].head.push(me.spheresNumber - 1);
    }
  }

  distance(x1, y1, x2, y2) {
    var a = x1 - x2;
    var b = y1 - y2;
    return Math.sqrt(a * a + b * b);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  /*
	onDocumentClick( event ){
		alert('click');
	}
	*/
  onDocumentWheel(event) {
    if (this.disableControls) {
      this.controls.enabled = false;
    }
    event.stopImmediatePropagation();

    if (event.deltaY < 0) {
      this.obj_increase_cb(event);
    } else {
      this.obj_decrease_cb(event);
    }
  }

  obj_increase_cb(e, fn) {
    switch (fn) {
      case "SPHERESCALE":
        let tmp = this.SPHERESCALE + 0.1;
        this.SPHERESCALE = parseFloat(tmp.toFixed(2));
        this.f3dWorld[+this.indexPickedBody][+this.indexPickedChain][
          +this.indexPickedObject
        ].sphere.scale.x = this.SPHERESCALE;
        this.f3dWorld[+this.indexPickedBody][+this.indexPickedChain][
          +this.indexPickedObject
        ].sphere.scale.y = this.SPHERESCALE;
        this.f3dWorld[+this.indexPickedBody][+this.indexPickedChain][
          +this.indexPickedObject
        ].sphere.scale.z = this.SPHERESCALE;
        this.mouseup("", true);
        break;
      case "NUMINTSPHERECURVE":
        this.NUMINTSPHERECURVE++;
        this.mouseup("", true);
        break;
    }
  }

  obj_decrease_cb(e, fn) {
    switch (fn) {
      case "SPHERESCALE":
        if (this.SPHERESCALE - 0.1 >= 0.1) {
          let tmp = this.SPHERESCALE - 0.1;
          this.SPHERESCALE = parseFloat(tmp.toFixed(2));
          this.f3dWorld[+this.indexPickedBody][+this.indexPickedChain][
            +this.indexPickedObject
          ].sphere.scale.x = this.SPHERESCALE;
          this.f3dWorld[+this.indexPickedBody][+this.indexPickedChain][
            +this.indexPickedObject
          ].sphere.scale.y = this.SPHERESCALE;
          this.f3dWorld[+this.indexPickedBody][+this.indexPickedChain][
            +this.indexPickedObject
          ].sphere.scale.z = this.SPHERESCALE;
          this.mouseup("", true);
          break;
        }
      case "NUMINTSPHERECURVE":
        if (this.NUMINTSPHERECURVE - 1 >= 1) {
          this.NUMINTSPHERECURVE--;
          this.mouseup("", true);
          break;
        }
    }
  }
  onDocumentMobileMouseMove(event) {
    var x = event.targetTouches[0].pageX;
    var y = event.targetTouches[0].pageY;
    this.mousemove(event, x, y);
  }

  onDocumentMouseMove(event) {
    var x = event.clientX;
    var y = event.clientY;
    this.mousemove(event, x, y);
  }

  scaleSphere(grow) {
    if (me.indexPickedObject) {
      let scale = this.f3dWorld[+this.bodyNumber][+this.chainsNumber][
        +me.indexPickedObject
      ].sphere.scale;
      if (grow) {
        scale.x++;
        scale.y++;
        scale.z++;
      } else {
        scale.x = scale.x - 1 >= 0 ? scale.x - 1 : 0;
        scale.y = scale.y - 1 >= 0 ? scale.y - 1 : 0;
        scale.z = scale.z - 1 >= 0 ? scale.z - 1 : 0;
      }
      this.f3dWorld[+this.bodyNumber][+this.chainsNumber][
        index[2]
      ].sphere.scale.set(scale.x, scale.y, scale.z);
    }
    /*
		this.mouse.set( ( this.lastX / window.innerWidth ) * 2 - 1, - ( this.lastY / window.innerHeight ) * 2 + 1 );
		this.raycaster.setFromCamera( this.mouse, this.camera );
		var intersects = this.raycaster.intersectObjects( this.scene.children );
		if ( intersects.length > 0 ) {
			let index = intersects[0].object.name.split('_');
			if(index[0].includes('sphere')){
				let scale = this.f3dWorld[+this.bodyNumber][+this.chainsNumber][index[2]].sphere.scale;
				if(grow){
					scale.x++;
					scale.y++;
					scale.z++;
				}else{
					scale.x=((scale.x-1)>=0)?scale.x-1:0;
					scale.y=((scale.y-1)>=0)?scale.y-1:0;
					scale.z=((scale.z-1)>=0)?scale.z-1:0;
				}
				this.f3dWorld[+this.bodyNumber][+this.chainsNumber][index[2]].sphere.scale.set(scale.x,scale.y,scale.z);
			}
		}*/
    this.interpolate_group.children.length = 0;
    this.interpolateSpheres();
    this.render();
  }

  intersect_fn(x, y) {
    this.mouse.set(
      (x / window.innerWidth) * 2 - 1,
      -(y / window.innerHeight) * 2 + 1
    );
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(this.scene.children, true);
  }

  mousemove(event, x, y) {
    this.lastX = x;
    this.lastY = y;
    var intersects = this.intersect_fn(x, y);
    this.info2.innerHTML = "";
    let me = this;
    if (intersects.length > 0) {
      if (intersects[0].object.name.indexOf("wp") != -1) {
        this.disableControls = false;
      } else {
        this.disableControls = true;
      }
      if (this.mouseDown) {
        intersects.map(function(e) {
          me.info2.innerHTML += e.object.name + " ";
        });

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
    }
  }

  onDocumentMobileMouseDown(event) {
    //if(!this.controls.enabled){
    var x = event.targetTouches[0].pageX;
    var y = event.targetTouches[0].pageY;
    this.mousedown(event, x, y, this);
    //}
  }

  onDocumentMouseDown(event) {
    //if(!this.controls.enabled){
    var x = event.clientX;
    var y = event.clientY;
    this.mousedown(event, x, y, this);
    //}
  }

  mousedown(event, x, y, me) {
    this.mouseDown = true;
    //this.setDraw();
    var intersects = this.intersect_fn(x, y);
    if (intersects.length > 0) {
      intersects.map(function(e) {
        me.info2.innerHTML += e.object.name;
      });
      if (intersects[0].object.name.indexOf("f3d_sphere_") !== -1) {
        this.controls.enabled = false;
        let sphereTokens = intersects[0].object.name.split("_");
        let index_f3d_sphere = parseInt(sphereTokens[2]);
        let index_body = parseInt(sphereTokens[3]);
        let index_chain = parseInt(sphereTokens[4]);
        me.indexPickedObject = index_f3d_sphere;
        me.indexPickedBody = index_body;
        me.indexPickedChain = index_chain;
        this.setSelect(true);
      } else if (intersects[0].object.name.indexOf("interpolation_") !== -1) {
        this.controls.enabled = false;
        let interpolation_tokens = intersects[0].object.name.split("_");
        let token_objId1 = interpolation_tokens[1];
        let token_objId2 = interpolation_tokens[2];
        let token_body = interpolation_tokens[3];
        let token_chain = interpolation_tokens[4];
        let firstRing = me.f3dWorld[token_body][token_chain][+token_objId1];
        var voxel = me.createSphere(0xffff00, me.SPHERESCALE);
        let index_to_replace = firstRing.head.indexOf(parseInt(token_objId2));
        let ring = {
          back: null,
          head: [firstRing.head[index_to_replace]],
          sphere: voxel
        };
        firstRing.head[index_to_replace] = me.spheresNumber;
        me.f3dWorld[token_body][token_chain][+me.spheresNumber] = ring;
        me.indexPickedObject = me.spheresNumber;
        me.indexPickedBody = token_body;
        me.indexPickedChain = token_chain;
        this.setSelect(true);
        me.addSphereToScene(me, voxel, intersects[0]);
        me.render();
      } else if (intersects[0].object.name.indexOf("wp") !== -1) {
        this.intersect = intersects[0];
        this.setSelect(false);
        //var voxel = me.createSphere(0xffff00,me.SPHERESCALE);
        //me.addSphereToScene(me, voxel, intersect);
        //me.addNextRing(me,voxel);
        //me.indexPickedBody = me.bodyNumber;
        //me.indexPickedChain = me.chainsNumber;
        //me.indexPickedObject = me.spheresNumber-1;
      }
    } else {
      console.log("nothing here");
    }
  }

  onDocumentMobileMouseUp(event) {
    var x =
      event.targetTouches.length > 0
        ? event.targetTouches[0].pageX
        : event.changedTouches[0].pageX;
    var y =
      event.targetTouches.length > 0
        ? event.targetTouches[0].pageY
        : event.changedTouches[0].pageY;
    this.mouseup(event, false, x, y);
  }

  onDocumentMouseUp(event) {
    var x = event.clientX;
    var y = event.clientY;
    this.mouseup(event, false, x, y);
  }

  createCurve(curvePoints, curveScales) {
    //Create a closed wavey loop
    var curve = new THREE.CatmullRomCurve3(curvePoints);
    var points = curve.getPoints(
      this.NUMINTSPHERECURVE * (curvePoints.length - 1)
    );
    var scale1 = [];
    var scale2 = [];
    var scaleStepX = 0;
    var scaleStepY = 0;
    var scaleStepZ = 0;
    for (let p = 0, p_l = points.length; p < p_l; p++) {
      if (p && p % this.NUMINTSPHERECURVE) {
        let sphere = this.createSphere(0xff0000);

        sphere.position.x = points[p].x;
        sphere.position.y = points[p].y;
        sphere.position.z = points[p].z;
        sphere.scale.x = scale1.x - (p % this.NUMINTSPHERECURVE) * scaleStepX; //s1.scale.x - token_scale_x*(s+1);
        sphere.scale.y = scale1.y - (p % this.NUMINTSPHERECURVE) * scaleStepY; //s1.scale.y - token_scale_y*(s+1);
        sphere.scale.z = scale1.z - (p % this.NUMINTSPHERECURVE) * scaleStepZ; //s1.scale.z - token_scale_z*(s+1);
        sphere.name =
          "interpolation_curve_" + this.bodyNumber + "_" + this.chainsNumber;

        this.interpolate_group.add(sphere);
      } else {
        if (p < p_l - 1) {
          scale1 = curveScales[p / this.NUMINTSPHERECURVE];
          scale2 = curveScales[p / this.NUMINTSPHERECURVE + 1];
          scaleStepX = (scale1.x - scale2.x) / this.NUMINTSPHERECURVE;
          scaleStepY = (scale1.y - scale2.y) / this.NUMINTSPHERECURVE;
          scaleStepZ = (scale1.z - scale2.z) / this.NUMINTSPHERECURVE;
        }
      }
    }
  }

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
  }

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
  }

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
  }

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

  mouseup(event, fromScale, x, y) {
    this.mouseDown = false;
    this.info2.innerHTML = "";
    if (this.draw_mode && !fromScale) {
      if (!this.select) {
        var voxel = this.createSphere(0xffff00, this.SPHERESCALE);
        this.addSphereToScene(this, voxel, this.intersect);
        this.addNextRing(this, voxel);
        this.indexPickedBody = this.bodyNumber;
        this.indexPickedChain = this.chainsNumber;
        this.indexPickedObject = this.spheresNumber - 1;
        window.actionsStack.addAction("ADDSPHERE", this.indexPickedObject);
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

  setSelect(bool) {
    this.select = bool;
  }

  setMoveCamera(e) {
    //console.log('move camera')
    this.draw_mode = false;
    this.controls.enabled = true;
    //this.controls.onMouseDown(e)
  }

  setDraw() {
    //console.log('draw')
    this.draw_mode = true;
    this.controls.enabled = false;
  }

  onDocumentKeyDown(event) {
    let x = event.which || event.keyCode;
    //+ (187) to grow, - (189) to scale down
    switch (event.keyCode) {
      case 68:
        //this.setDraw();
        this.drawMove = "MOVE";
        document.getElementById("MOVE").innerText = this.drawMove;
        break;
      case 77:
        //this.setMoveCamera();
        this.drawMove = "DRAW";
        document.getElementById("MOVE").innerText = this.drawMove;
        break;
      case 187:
        this.scaleSphere(true);
        break;
      case 189:
        this.scaleSphere(false);
        break;
    }
  }

  onDocumentKeyUp(event) {
    switch (event.keyCode) {
      case 16:
        this.isShiftDown = false;
        break;
    }
  }

  setOldCoord(x, y) {
    this.oldX = x;
    this.oldY = y;
  }
  /*
	setLastSphereCenter(x,y){
		this.lastSphereCenterX = x;
		this.lastSphereCenterY = y;
	}
	
	setSphereScaleFromMouseDistance(x,y){
		let min_r = this.distance(this.lastSphereCenterX,this.lastSphereCenterY,this.oldX,this.oldY);
		let max_r = this.distance(this.lastSphereCenterX,this.lastSphereCenterY,x,y);
		if (min_r === 0)
			min_r = 1;
		let scale = max_r/min_r;
		this.lastSphere.scale.x += 1;
		this.lastSphere.scale.y += 1;
		this.lastSphere.scale.z += 1;
	}
	getMouseDistance(x,y){
		return distamce(this.oldX,this.oldY,x,y);
	}
	getOldCoord(){
		return {x:this.oldX,y:this.oldY};
	}
	getScene(){
		return this.scene;
	}
	*/
  loadModel_fn(spheresDataArray) {
    /*
		spheresDataArray.forEach(e=>{
			var geometry = new THREE.SphereGeometry( 5, 8, 8 );
			var material = new THREE.MeshToonMaterial( {color: 0xff0000} );
			var sphere = new THREE.Mesh( geometry, material );
			sphere.scale.x = e.scale.x;
			sphere.scale.y = e.scale.y;
			sphere.scale.z = e.scale.z;
			sphere.position.x = e.position.x;
			sphere.position.y = e.position.y;
			sphere.position.z = e.position.z;
			this.group.add( sphere );
		})
		*/
    this.group.children = JSON.parse(JSON.stringify(spheresDataArray));
    this.mouseup("", true);
  }

  //utility CH
  save(blob, filename) {
    this.link.href = URL.createObjectURL(blob);
    this.link.download = filename;
    this.link.click();
  }

  saveString(text, filename) {
    this.save(new Blob([text], { type: "text/plain" }), filename);
  }

  saveArrayBuffer(buffer, filename) {
    this.save(
      new Blob([buffer], { type: "application/octet-stream" }),
      filename
    );
  }
  getPosScl() {
    let numberOfSpheres = Object.keys(
      this.f3dWorld[this.indexPickedBody][this.indexPickedChain]
    ).length;
    let returnArray = [];
    for (let s = 0; s < numberOfSpheres; s++) {
      returnArray[s] = {};
      returnArray[s].position = this.f3dWorld[this.indexPickedBody][
        this.indexPickedChain
      ][+s].sphere.position;
      returnArray[s].scale = this.f3dWorld[this.indexPickedBody][
        this.indexPickedChain
      ][+s].sphere.scale;
      returnArray[s].name = this.f3dWorld[this.indexPickedBody][
        this.indexPickedChain
      ][+s].sphere.name;
      if (s == numberOfSpheres - 1) return JSON.stringify(returnArray);
    }
  }
  //end utility CH
  clear() {
    this.f3dWorld = {};
    this.indexPickedBody = 0;
    this.indexPickedChain = 0;
    this.indexPickedObject = 0;
    this.scene.children[1].children.length = 0;
    this.group = new THREE.Group();
    delete this.boxHelper;
    this.mouseup("", true);
  }

  undo() {
    let a = window.actionsStack.getLastAction();
    if (a) {
      this.processAction(a, "u");
    }
  }

  redo() {
    let a = window.actionsStack.getNextAction();
    if (a) {
      this.processAction(a, "r");
    }
  }

  processAction(action, undoRedo) {
    switch (action.t) {
      case "ADDSPHERE":
        if (undoRedo.indexOf("u") != -1) {
          let h = this.f3dWorld[this.indexPickedBody][this.indexPickedChain][
            +(this.spheresNumber - 1)
          ].head;
          let b = this.f3dWorld[this.indexPickedBody][this.indexPickedChain][
            +(this.spheresNumber - 1)
          ].back;
          if (h[0]) {
            this.f3dWorld[this.indexPickedBody][this.indexPickedChain][
              +b
            ].head = h[0];
            this.f3dWorld[this.indexPickedBody][this.indexPickedChain][
              +h[0]
            ].back = b;
          } else {
            let a = this.f3dWorld[this.indexPickedBody][this.indexPickedChain][
              +b
            ].head;
            if (a.length > 1)
              this.f3dWorld[this.indexPickedBody][this.indexPickedChain][
                +b
              ].head.removeElement(this.spheresNumber - 1);
            else
              this.f3dWorld[this.indexPickedBody][this.indexPickedChain][
                +b
              ].head = [];
          }
          let s = this.f3dWorld[this.indexPickedBody][this.indexPickedChain][
            +(this.spheresNumber - 1)
          ].sphere;
          this.group.remove(s);
          delete this.f3dWorld[this.indexPickedBody][this.indexPickedChain][
            +(this.spheresNumber - 1)
          ];
          this.spheresNumber--;
        } else {
          this.spheresNumber++;
        }
        this.indexPickedObject = action.d - 1;
        break;
    }
    this.mouseup("", true);
  }
};
var actionsStack = class {
  constructor() {
    this.actions = [];
    this.index = 0;
  }
  addAction(type, data) {
    this.actions.push({ t: type, d: data });
    this.index = this.actions.length;
  }
  getLastAction() {
    if (this.index > 0) {
      this.index--;
      return this.actions[this.index];
    } else {
      return null;
    }
  }
  getNextAction() {
    this.index++;
    if (this.actions.length > this.index) return this.actions[this.index];
    else return null;
  }
};

window.f3d = new f3dwebgl();
window.actionsStack = new actionsStack();
window.f3d.render();
//only 1 touch at time
window.endTouch = () => {
  console.log("endTouch");
  window.f3d.isTouched = false;
};

Array.prototype.removeElement = function(elem) {
  var index = this.indexOf(elem);
  if (index > -1) {
    this.splice(index, 1);
  }
};
