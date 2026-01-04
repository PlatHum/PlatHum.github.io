import * as THREE from "three";
import { OrbitControls } from "three/addons/OrbitControls";

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
    this.isVisible = false;
    this.isLooping = false;
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

    this.resize();

    //this.animate();
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
      map: texture,
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

  newMesh(url = "assets/png/DefaultSquareTexture.png") {
    if (this.mesh.material.map) this.mesh.material.map.dispose();
    this.mesh.material.dispose();

    this.texture_url = url;
    let texture = this.texture_loader.load(this.texture_url);

    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy() / 2;
    texture.colorSpace = THREE.SRGBColorSpace;

    this.mesh.material = new THREE.MeshBasicMaterial({ map: texture });
  }

  animate() {
    if (!this.isVisible) {
      this.isLooping = false;
      return;
    }

    this.isLooping = true;

    requestAnimationFrame(() => this.animate());

    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }

  startAnimation() {
    if (!this.isLooping && this.isVisible) {
      this.animate();
    }
  }

  resize() {
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
  }
}

let skill_canvas = new skillElement(
  "skill-canvas",
  "assets/png/DefaultSquareTexture.png"
);
skill_canvas.draw();

window.addEventListener("resize", function () {
  skill_canvas.resize();
});

const skillWords = document.querySelectorAll(".skill-word");
var ul = document.querySelector(".skill-cloud ul");

skillWords.forEach((skillWord) => {
  // Add a click event listener to each element
  skillWord.addEventListener("click", () => {
    // Get the value of the "texture_url" attribute
    skill_canvas.newMesh(skillWord.getAttribute("texture_url"));
  });
});

function randomize_word_cloud() {
  const fragment = document.createDocumentFragment(); // Invisible container
  const items = Array.from(ul.children);
  //randomize order of list items
  items.sort(() => Math.random() - 0.5);
  //shuffle positioning and angle of words
  items.forEach((li) => {
    const word = li.querySelector(".skill-word");
    if (word) {
      const randomMarginSide = Math.floor(Math.random() * 13) + 5; // 5 to 18px
      const randomMarginTop = Math.floor(Math.random() * 16) + 4; // 4 to 20px

      word.style.margin = "${randomMarginTop}px ${randomMarginSide}px";
      word.style.transform =
        "rotate(" + (Math.random() - 0.5) * 2 * 20 + "deg)";
    }
    fragment.appendChild(li); // Move it into the ghost container
  });
  ul.innerHTML = "";
  ul.appendChild(fragment);

  skill_canvas.resize();
}

randomize_word_cloud();

//click on shuffle button = shuffle
document.getElementById("shuffle-skill-cloud").onclick = function () {
  randomize_word_cloud();
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        skill_canvas.isVisible = true;
        skill_canvas.startAnimation();
      } else {
        skill_canvas.isVisible = false;
      }
    });
  },
  { threshold: 0.1 } // Trigger when 10% of the canvas is visible
);

observer.observe(document.getElementById("skill-canvas"));
