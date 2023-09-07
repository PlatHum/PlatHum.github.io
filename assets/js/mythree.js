import * as THREE from "three";
/* import { TransformControls } from 'three/addons/controls/TransformControls'; */
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

class skillElement {
  constructor(
    id = "",
    texture_url = [""],
    cube_side = 0.8,
    initial_rotation = 0.3
  ) {
    this.id = id;
    this.texture_url = texture_url;
    this.cube_side = cube_side;
    this.initial_rotation = initial_rotation;
  }

  draw(){
    this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true });
    this.canvas = document.getElementById(this.id);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.canvas.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
  
    this.setCamera();
  
    this.setBox();
  
    
    this.setControls();
    

    this.animate();
  }


  setCamera(){
    //magic values, maybe allow in the constructor
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.1,
      1000
    );
    //magic values, maybe add to constructor
    this.camera.position.set(0, 0.01, 1.7);
  }

  setBox(){
    this.material = [];
    
    this.boxGeometry = new THREE.BoxGeometry(
      this.cube_side,
      this.cube_side,
      this.cube_side
      );
      let loader = new THREE.TextureLoader();
  
      //if there are more than 1 texture urls, populate each face accordingly
      let index=0;
      for (let i = 0; i < 6; i++) {
  
        let texture;
  
        if(i+1>this.texture_url.length){
          if(index+1>this.texture_url.length){
            index=0;
          }
          texture=loader.load(this.texture_url[index]);
        }else{
          texture=loader.load(this.texture_url[i]);
        }
        texture.anisotropy=this.renderer.capabilities.getMaxAnisotropy()/2;
        texture.colorSpace=THREE.SRGBColorSpace;
  
        this.material.push(new THREE.MeshBasicMaterial({ map: texture,side:THREE.DoubleSide }));
  
        index=index+1;
      }

    this.box = new THREE.Mesh(this.boxGeometry, this.material);

    this.box.rotateZ(this.initial_rotation);

    this.scene.add(this.box);
  }
  
  setControls(){
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false;
    this.controls.autoRotate = true;
    this.controls.enablePan = false;
    this.controls.update();
  }

  animate() {
    requestAnimationFrame( () => this.animate() );

    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
  }
}

const skills=[new skillElement("cpp_canvas",["assets/png/CppSquareTexture.png"]),
new skillElement("python_canvas",["assets/png/PythonSquareTexture.png"]),
new skillElement("html_css_canvas",["assets/png/CssSquareTexture.png","assets/png/HtmlSquareTexture.png"]),
new skillElement("js_canvas",["assets/png/JSSquareTexture.png"]),
new skillElement("gazebo_canvas",["assets/png/GazeboSquareTexture.png"]),
new skillElement("isaac_canvas",["assets/png/omniverseSquareTexture.png"]),
new skillElement("solidworks_canvas",["assets/png/SolidworksSquareTexture.png"]),
new skillElement("blender_canvas",["assets/png/BlenderSquareTexture.png"]),
new skillElement("ros_canvas",["assets/png/RosSquareTexture.png"]),
new skillElement("matlab_canvas",["assets/png/MatlabSquareTexture.png"]),
new skillElement("microros_canvas",["assets/png/MicroRosSquareTexture.png"]),
] 

skills.forEach((element) => element.draw());


window.addEventListener("resize", function () {
  skills.forEach((element) => element.resize());
});
