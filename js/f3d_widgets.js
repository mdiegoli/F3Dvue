import { GLTFExporter } from './GLTFExporter.js';
import { GLTFLoader } from './GLTFLoader.js';
var superWidget = class{
	constructor(obj,fn){
		window[fn] = this.win_cb;
		window['touch'+fn] = this.win_touchcb;
	}

	win_cb(e,fn){
		e.stopPropagation();
		window.f3d[fn](fn);
	}

	win_touchcb(e,fn){
		e.stopPropagation();
		e.preventDefault();
		//sigle touch event (and mouse event)
		if(window.f3d.isTouched == false){
			console.log('touchBody');
			window.f3d.isTouched = true;
			window.f3d[fn](fn);
		}
	}
}
var superButtonWidget = class extends superWidget{
	constructor(obj,fn){
		super(obj,fn);
		document.getElementById('toolbar').innerHTML += `
			<div id="${fn}" class="barButton" onmousedown="${fn}(event,'${fn}')" onmousemove="event.stopPropagation()" onmouseup="event.stopPropagation()" ontouchstart="touch${fn}(event,'${fn}')" ontouchmove="event.stopPropagation()" ontouchend="event.stopPropagation();endTouch();">
			${fn}
			</div>`;
		//usare le api dom per registrare gli eventi
		obj[fn] = this.obj_cb;
		
	}

	win_cb(e,fn){
		e.stopPropagation();
		window.f3d[fn](fn);
	}

	win_touchcb(e,fn){
		e.stopPropagation();
		e.preventDefault();
		//sigle touch event (and mouse event)
		if(window.f3d.isTouched == false){
			console.log('touchBody');
			window.f3d.isTouched = true;
			window.f3d[fn](fn);
		}
	}

}

var superNumericWidget = class extends superWidget{
	constructor(obj,fn){
		super(obj,fn);
		document.getElementById('toolbar').innerHTML += `
		<div>
			<div class="barLabel" onmousedown="event.stopPropagation();" onmousemove="event.stopPropagation()" onmouseup="event.stopPropagation()"  ontouchstart="event.stopPropagation();" ontouchmove="event.stopPropagation()" ontouchend="event.stopPropagation();">
			${fn}
			</div> 
			<div class="barButton" onmousedown="decrease${fn}_fn(event,'${fn}')" onmousemove="event.stopPropagation()" onmouseup="event.stopPropagation()"  ontouchstart="decrease${fn}_fn(event,'${fn}')" ontouchmove="event.stopPropagation()" ontouchend="event.stopPropagation();">
				-
			</div>
			<div id="val_${fn}" class="barButton">
			`+obj[fn]+`
			</div>
			<div class="barButton" onmousedown="increase${fn}_fn(event,'${fn}')" onmousemove="event.stopPropagation()" onmouseup="event.stopPropagation()"  ontouchstart="increase${fn}_fn(event,'${fn}')" ontouchmove="event.stopPropagation()" ontouchend="event.stopPropagation();">
				+
			</div>
		</div>`;
		//usare le api dom per registrare gli eventi
		obj['increase'+fn+'_fn'] = this.obj_increase_cb;
		window['increase'+fn+'_fn'] = this.win_increase_cb;
		obj['decrease'+fn+'_fn'] = this.obj_decrease_cb;
		obj['update'+fn+'_fn'] = this.obj_update_cb;
		window['decrease'+fn+'_fn'] = this.win_decrease_cb;
	}

	win_increase_cb(e,fn) {
		e.stopPropagation();
		window.f3d['increase'+fn+'_fn'](e,fn);
		window.f3d['update'+fn+'_fn'](e,fn);
	}
	
	win_decrease_cb(e,fn){
		e.stopPropagation();
		window.f3d['decrease'+fn+'_fn'](e,fn);
		window.f3d['update'+fn+'_fn'](e,fn);
	}

	obj_increase_cb(e,fn){
		window.f3d.obj_increase_cb(e,fn);
	}

	obj_decrease_cb(e,fn){
		window.f3d.obj_decrease_cb(e,fn);
	}

	obj_update_cb(e,fn){
		document.getElementById('val_'+fn).innerText = window.f3d[fn];
	}
}

var superTextWidget = class extends superWidget{
	constructor(obj,fn){
		super(obj,fn);
		document.getElementById('toolbar').innerHTML += `
		<div> 
			<div class="barButton" onmousedown="${fn}_fn(event,'${fn}')" onmousemove="event.stopPropagation()" onmouseup="event.stopPropagation()"  ontouchstart="${fn}touch_fn(event,'${fn}')" ontouchmove="event.stopPropagation()" ontouchend="event.stopPropagation();">
				${fn}
			</div>
			<input id="${fn}Text" class="barInputText" type="text" onmousedown="event.stopPropagation();" onmousemove="event.stopPropagation()" onmouseup="event.stopPropagation()"  ontouchstart="event.stopPropagation();" ontouchmove="event.stopPropagation()" ontouchend="event.stopPropagation();"></input>
		</div>`;
		//usare le api dom per registrare gli eventi
		obj[fn+'_fn'] = this.obj_text_cb;
		window[fn+'_fn'] = this.win_text_cb;
		window[fn+'touch_fn'] = this.win_text_cb;

	}
	
	win_text_cb(e,fn){
		e.stopPropagation();
		window.f3d[fn+'_fn'](e,fn);
	}
}


var widgetAddBody = class extends superButtonWidget{
	constructor(obj,fn){
		super(obj,fn)
	}
	obj_cb(fn) {
		let canAdd = false;
		for(let c = 0,c_l = Object.keys(window.f3d.f3dWorld[+window.f3d.bodyNumber]).length;c<c_l;c++){
			let chain_length = Object.keys(window.f3d.f3dWorld[+window.f3d.bodyNumber][+c]).length; 
			if(chain_length > 0){
				if(canAdd == false){
					canAdd = true;
					window.f3d.bodyNumber++;
					console.log('addbody, c:' + c + ', c_l:' + c_l + ', chain_length: ' + chain_length);
					window.f3d.chainsNumber = 0;
					window.f3d.spheresNumber = 0;
					window.f3d.f3dWorld[+window.f3d.bodyNumber] = {};
					window.f3d.f3dWorld[+window.f3d.bodyNumber][+window.f3d.chainsNumber] = {};
					window.f3d.f3dWorld[+window.f3d.bodyNumber][+window.f3d.chainsNumber][+window.f3d.spheresNumber] = {};
					break;
				}
			}
		}
	}
}

var widgetAddChain = class extends superButtonWidget{
	constructor(obj,fn){
		super(obj,fn)
	}
	obj_cb(fn) {
		if(Object.keys(window.f3d.f3dWorld[+window.f3d.bodyNumber][+window.f3d.chainsNumber]).length > 0){
			window.f3d.chainsNumber++;
			window.f3d.spheresNumber = 0;
			window.f3d.f3dWorld[+window.f3d.bodyNumber][+window.f3d.chainsNumber] = {};
			window.f3d.f3dWorld[+window.f3d.bodyNumber][+window.f3d.chainsNumber][+window.f3d.spheresNumber] = {};
		}
	}
}

var widgetClear = class extends superButtonWidget{
	constructor(obj,fn){
		super(obj,fn)
	}
	obj_cb(fn) {
		window.f3d.clear();
		
	}
}

var widgetUndo = class extends superButtonWidget{
	constructor(obj,fn){
		super(obj,fn)
	}
	obj_cb(fn) {
		window.f3d.undo();
		
	}
}

var widgetRedo = class extends superButtonWidget{
	constructor(obj,fn){
		super(obj,fn)
	}
	obj_cb(fn) {
		window.f3d.redo();
		
	}
}

var widgetShowMesh = class extends superButtonWidget{
	constructor(obj,fn){
		super(obj,fn)
	}
	obj_cb(fn) {
		window.f3d.hideConvexHull = !window.f3d.hideConvexHull;
		if(window.f3d.hideConvexHull){
			window.f3d.hideShowCH = 'SHOWMESH';	
		}
		else{
			window.f3d.hideShowCH = 'HIDEMESH';
		}
		document.getElementById(fn).innerText = window.f3d.hideShowCH;
		window.f3d.mouseup("",true);
		
	}
}

var widgetLinesCurves = class extends superButtonWidget{
	constructor(obj,fn){
		super(obj,fn)
	}
	obj_cb(fn) {
		window.f3d.lineCurve = !window.f3d.lineCurve;
		if(window.f3d.lineCurve){
			window.f3d.lineCurveLabel = 'LINE';	
		}
		else{
			window.f3d.lineCurveLabel = 'CURVE';
		}
		document.getElementById(fn).innerText = window.f3d.lineCurveLabel;
		window.f3d.mouseup("",true);
		
	}
}

var widgetTargetWP = class extends superButtonWidget{
	constructor(obj,fn){
		super(obj,fn)
	}
	obj_cb(fn) {
		window.f3d.targetWP = !window.f3d.targetWP;
		
		if(window.f3d.targetWP){
			window.f3d.targetLabel = 'TARGETWP';	
			window.f3d.planeMesh.geometry.boundingBox.getCenter(window.f3d.controls.target);
		}
		else{
			window.f3d.targetLabel = 'TARGETOBJ';
			window.f3d.controls.target.copy(this.f3dWorld[this.indexPickedBody][this.indexPickedChain][+(this.indexPickedObject)].sphere.position);
		}
		document.getElementById(fn).innerText = window.f3d.targetLabel;
		window.f3d.mouseup("",true);
		
	}
}


var widgetDrawMove = class extends superButtonWidget{
	constructor(obj,fn){
		super(obj,fn)
	}
	obj_cb(fn) {
		if(window.f3d.drawMove.indexOf('MOVE') != -1){
			window.f3d.controls.enabled = true;
			window.f3d.drawMove = 'DRAW';	
		}
		else{
			window.f3d.controls.enabled = false;
			window.f3d.drawMove = 'MOVE';
		}
		document.getElementById(fn).innerText = window.f3d.drawMove;
	}
}

var widgetExportMesh = class extends superButtonWidget{
	constructor(obj,fn){
		super(obj,fn)
	}
	obj_cb(fn) {
		var gltfExporter = new GLTFExporter();
		var options = {
			trs: false,
			onlyVisible: true,
			truncateDrawRange: true,
			binary: false,
			forceIndices: true,
			forcePowerOfTwoTextures: false,
			maxTextureSize: Infinity 
		};
		var group = {};
		if(window.f3d.hideConvexHull) group = window.f3d.group.children;
		else group = window.f3d.ch_group;
		gltfExporter.parse( group, function ( result ) {
			if ( result instanceof ArrayBuffer ) {
				window.f3d.saveArrayBuffer( result, 'scene.glb' );
			} else {
				var output = JSON.stringify( result, null, 2 );
				console.log( output );
				window.f3d.saveString( output, 'scene.gltf' );
			}
		}, options );
	}
}

var widgetSphereScale = class extends superNumericWidget{
	constructor(obj,fn){
		super(obj,fn);
	}
}

var widgetNumIntSpheresCurve = class extends superNumericWidget{
	constructor(obj,fn){
		super(obj,fn);
	}
}
/*
var widgetSphereScale = class extends superNumericWidget{
	constructor(obj,fn){
		super(obj,fn);
	}

	obj_text_cb(e,fn){
		window.f3d.mouseup(document.getElementById(fn+'Text').value); 
	}

}
*/
var saveWidget = class extends superTextWidget{
	constructor(obj,fn){
		super(obj,fn);
	}
	obj_text_cb(e,fn){
		let str = document.getElementById(fn+'Text').value;
		if(!str){ 
			alert('No file name!');}
		else{ 
			localStorage[str] = JSON.stringify(window.f3d.f3dWorld);
			localStorage[str+'pos_scl'] = window.f3d.getPosScl();
			//let tmp = [];
			//window.f3d.scene.children[1].children.forEach(e => {tmp.push({position:{x:e.position.x,y:e.position.y,z:e.position.z},scale:{x:e.scale.x,y:e.scale.y,z:e.scale.z}})});
			//localStorage[str+'_spheres'] = JSON.stringify(window.f3d.scene.children[1].children);
			localStorage[str+'index'] = JSON.stringify({indexPickedBody:window.f3d.indexPickedBody,indexPickedChain:window.f3d.indexPickedChain,indexPickedObject:window.f3d.indexPickedObject,spheresNumber:window.f3d.spheresNumber});
			localStorage[str+'scene'] = window.f3d.scene.toJSON();
			/*
			var gltfExporter = new GLTFExporter();
			var options = {
				trs: false,
				onlyVisible: true,
				truncateDrawRange: true,
				binary: false,
				forceIndices: false,
				forcePowerOfTwoTextures: false,
				maxTextureSize: Infinity 
			};
			
			gltfExporter.parse( window.f3d.scene, function ( result ) {
				if ( result instanceof ArrayBuffer ) {
					window.f3d.saveArrayBuffer( result, str+'.glb' );
				} else {
					//localStorage[str+'_spheres'] = JSON.stringify( result, null, 2 );
					window.f3d.saveString( JSON.stringify( result, null, 2 ), str+'.gltf' );
					let toFile = {};
					toFile[str] = localStorage[str];
					toFile[str+'index'] = localStorage[str+'index'];
					window.f3d.saveString( JSON.stringify( toFile), str+'.f3d' );
				}
			}, options );
			*/
			let toFile = {};
			toFile[str] = localStorage[str];
			toFile[str+'index'] = localStorage[str+'index'];
			toFile[str+'scene'] = localStorage[str+'scene'];
			toFile[str+'pos_scl'] = localStorage[str+'pos_scl'];
			window.f3d.saveString( JSON.stringify( toFile), str+'.f3d' );
		}
	};
		
}

var loadWidget = class extends superTextWidget{
	constructor(obj,fn){
		super(obj,fn);
	}
	obj_text_cb(e,fn){
		let str = document.getElementById(fn+'Text').value;
		if(!str){ 
			alert('No file name!');}
		else{ 
			
			var loader = new GLTFLoader();

			// Optional: Provide a DRACOLoader instance to decode compressed mesh data
			//var dracoLoader = new DRACOLoader();
			//dracoLoader.setDecoderPath( '/examples/jsm/libs/draco/' );
			//loader.setDRACOLoader( dracoLoader );
			fetch('\\models\\'+str+'.f3d').then((response)=>{
				response.json().then((json)=>{
					window.f3d.f3dWorld = {};
					window.f3d.f3dWorld = JSON.parse(json[str]);
					var index = JSON.parse(json[str+'index']);
					window.f3d.indexPickedBody = index.indexPickedBody;
					window.f3d.indexPickedChain = index.indexPickedChain;
					window.f3d.indexPickedObject = index.indexPickedObject;
					window.f3d.spheresNumber = index.spheresNumber;
				    //window.f3d.resetGroup();
					//window.f3d.scene = JSON.parse(json[str+'scene']);
					var pos_scl = JSON.parse(json[str+'pos_scl']);
					var sphereIndex = 0;
					pos_scl.forEach(e=>{
						window.f3d.createBNSphere(0xffff00,e.position,e.scale,e.name,sphereIndex);
						sphereIndex++;
					})
					//array_spheres.forEach(e => window.f3d.group.add(e));
					window.f3d.mouseup("",true);
				});
				
			}).catch((error)=>{
				alert(error);

			})
			/*
			// Load a glTF resource
			loader.load(
				// resource URL
				//JSON.parse(localStorage[str+'_spheres']),
				'\\models\\'+str+'.gltf',
				// called when the resource is loaded
				function ( gltf ) {
					
					fetch('\\models\\'+str+'.f3d').then((response)=>{
						response.json().then((json)=>{
							window.f3d.f3dWorld = {};
							window.f3d.f3dWorld = JSON.parse(json[str]);
							var index = JSON.parse(json[str+'index']);
							window.f3d.indexPickedBody = index.indexPickedBody;
							window.f3d.indexPickedChain = index.indexPickedChain;
							window.f3d.indexPickedObject = index.indexPickedObject;
							window.f3d.scene.add( gltf.scene );
							window.f3d.render();
						});
						
					}).catch((error)=>{
						alert(error);

					})
					
					//gltf.animations; // Array<THREE.AnimationClip>
					//gltf.scene; // THREE.Group
					//gltf.scenes; // Array<THREE.Group>
					//gltf.cameras; // Array<THREE.Camera>
					//gltf.asset; // Object

				},
				// called while loading is progressing
				function ( xhr ) {

					console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

				},
				// called when loading has errors
				function ( error ) {

					console.log( 'An error happened' );

				}
			);
			*/
			
		
		}
	};
		
}

export {widgetUndo,widgetRedo,widgetNumIntSpheresCurve,widgetLinesCurves,widgetTargetWP,loadWidget,saveWidget,superButtonWidget,superNumericWidget,widgetAddBody,widgetAddChain,widgetShowMesh,widgetDrawMove,widgetExportMesh,widgetSphereScale,superTextWidget,widgetClear}
