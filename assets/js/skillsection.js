import * as THREE from "three";
import { OrbitControls} from "three/addons/OrbitControls";



class skillElement {
  constructor(
    id = "",
    texture_url = [""],
    geometry_side = 0.7,
    initial_rotation = 0.3
  ) {
    this.id = id;
    this.texture_url = texture_url;
    this.geometry_side = geometry_side;
    this.initial_rotation = initial_rotation;
  }

  draw() {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.canvas = document.getElementById(this.id);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.canvas.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();

    this.setCamera();

    this.setInitialMesh();

    this.setControls();

    this.animate();
  }

  setCamera() {
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

  setInitialMesh() {

    let geometry = new THREE.BoxGeometry(
      this.geometry_side,
      this.geometry_side,
      this.geometry_side
    );

    this.texture_loader = new THREE.TextureLoader();

    let texture = this.texture_loader.load(this.texture_url);

    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy() / 2;
    texture.colorSpace = THREE.SRGBColorSpace;

    let material = new THREE.MeshBasicMaterial({
      map: texture
    });

    this.mesh = new THREE.Mesh(geometry, material);

    this.mesh.rotateZ(this.initial_rotation);

    this.scene.add(this.mesh);
  }

  setControls() {
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    /* this.controls.mouseBUttons={ LEFT: THREE.MOUSE.ROTATE, MIDDLE: -1, DOLLY: THREE.MOUSE.RIGHT}; */
    this.controls.enableZoom = false;
    this.controls.maxDistance = 1.8;
    this.controls.minDistance = 1.3;
    this.controls.autoRotate = true;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.update();
  }

  newMesh(url="assets/png/DefaultSquareTexture.png") {
    
    this.mesh.material.dispose();

    this.texture_url=url;
    let texture = this.texture_loader.load(this.texture_url);

    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy() / 2;
    texture.colorSpace = THREE.SRGBColorSpace;

    this.mesh.material= new THREE.MeshBasicMaterial({ map: texture});

  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
  }
}

let skill_canvas = new skillElement("canvas", "assets/png/DefaultSquareTexture.png");
skill_canvas.draw();


window.addEventListener("resize", function () {
  skill_canvas.resize();
});

const skillWords = document.querySelectorAll(".skill-word");
var ul = document.querySelector('.skill-cloud ul');

skillWords.forEach(skillWord => {
  // Add a click event listener to each element
  skillWord.addEventListener("click", () => {
    // Get the value of the "texture_url" attribute
    skill_canvas.newMesh(skillWord.getAttribute("texture_url"));
  });
});


function randomize_word_cloud(){
  
  //randomize order of list items
  for (var i = ul.children.length; i >= 0; i--) {
      ul.appendChild(ul.children[Math.random() * i | 0]);
  }
    //shuffle positioning and angle of words
    skillWords.forEach(word=>{
    word.style.paddingLeft = Math.floor(Math.random() * 5) + "vmin";
    word.style.paddingRight = Math.floor(Math.random() * 7) + "vmin";
    word.style.paddingTop = Math.floor(Math.random() * 2) + "vmin";
    word.style.paddingBottom = Math.floor(Math.random() * 3) + "vmin";
    word.style.transform = "rotate(" +((Math.random() - 0.5) * 2) *20+"deg)";
    })

    skill_canvas.resize();

}

randomize_word_cloud();

//click on shuffle button = shuffle
document.getElementById('shuffle-skill-cloud').onclick = function() {
  randomize_word_cloud();
};
