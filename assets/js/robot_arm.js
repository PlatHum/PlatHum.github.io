// Interactive cursor-seeking robot arm
// The full arm geometry is generated once this script is run.
// The arm floats and kinematically compensates
// the float-effect displacement.
// It also implements a thruster flame-effect.
// And generates a spark effect if there is sudden motion.
// If the user cursor is too close, the end-effector will try to pinch.
// The arm will get triggered on Click in its reachable workspace.
//
// Copyright (C) 2026  Francisco Gonçalves <PlatHum on GitHub>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
//
// Contact PlatHum at: plathum.cubicle427@slmail.me
// Original source code available at: https://github.com/PlatHum/PlatHum.github.io
//

import * as THREE from "three";

const ROBOT_CONFIG = Object.freeze({
  ARM: {
    VIEWPORT_FRACTION: 0.15,
    MIN_LINK_LENGTH: 1.5,
    MAX_LINK_LENGTH: 4.0,
    WRIST_RATIO: 0.8,
    THICKNESS: 0.35,
    TCP_OFFSET: 0.5,
  },
  PINCER: {
    LENGTH: 0.6,
    OPEN_ANGLE: 0.5,
    CLOSED_ANGLE: 0.02,
    SENSE_RANGE: 1.0,
    SPEED_EAGER: 0.04,
    SPEED_NORMAL: 0.02,
    IDLE_SNAP_CHANCE: 0.005,
  },
  EFFECTS: {
    SPARK: {
      COLOR: 0xffaa00,
      COUNT: 15,
      THRESHOLD: 0.1,
      DECAY: 0.95,
      LIFE_DECAY: 0.02,
      VELOCITY_MULT: 0.1,
    },
    THRUSTER: {
      ENABLED: true,
      COLOR: 0x00d2ff,
      CORE_COLOR: 0xffffff,
      FLICKER_SPEED: 4.0,
      GLOW_POW: 1.5,
    },
    FLOAT: {
      ENABLED: true,
      AMPLITUDE: 0.25,
      PERIOD: 3000,
    },
  },
  VISUALS: {
    BASE: {
      THRUSTER_NOZZLE_RADIUS: 0.4,
      THRUSTER_NOZZLE_HEIGHT: 0.5,
      FLAME_LENGTH: 0.7,
    },
    JOINTS: { SOCKET_FLARE: 1.25, SOCKET_DEPTH: 0.6, MOTOR_HUB_RADIUS: 1.3 },
    COLORS: {
      MAIN_CHASSIS: 0xdddddd,
      SHAFT_METAL: 0xffffff,
      JOINT_MOTOR: 0x8b5df5,
      HAZARD_BASE: 0xff5500,
      HAZARD_STRIPE: 0x222222,
      GLOW_INTENSITY: 1.2,
    },
    PROPORTIONS: { SHAFT_THICKNESS: 0.75 },
    PINCER: { THICKNESS: 0.15, TIP_SIZE: 0.22, OFFSET_OPEN: 0.1 },
    LAYERS: {
      FLAME: 0,
      BASE: 10, // The Nozzle/Base Hub
      ARM: 100, // Link 0 starts here
      PINCERS: 200,
      EFFECTS: 250,
    },
    LEDS: {
      SIZE: 0.07,
      MARGIN_ACTIVE: 0.8,
      MARGIN_IDLE: 1.1,
      MIN_FACTOR_ACTIVE: 0.69,
      MIN_FACTOR_IDLE: 0.55,
      COLORS: {
        OFF: 0x111111,
        ACTIVE: 0xff0000,
        IDLE: 0x00ff00,
        ENGAGED: 0xffff00,
      },
    },
  },
  MOTION: {
    LERP_SPEED_ACTIVE: 0.03,
    LERP_SPEED_RETURN: 0.005,
    MAX_REACH_THRESHOLD: 0.98,
    MIN_REACH_THRESHOLD: 1.2,
    DEFAULT_JOINTS: [0.6, 1.2, -0.4],
  },
  WORLD: {
    HEIGHT: 20,
    CAMERA_Z: 10,
    LIGHT_INTENSITY: 20,
  },
  INTERACTION: {
    IDLE_DISENGAGE_TIME: 5000,
    CURSORS: {
      IDLE: "default",
      HOVER: "pointer",
      ACTIVE: "grabbing",
      DISABLED: "not-allowed",
    },
  },
});

const THRUSTER_SHADER = {
  vertexShader: `
    varying vec2 vUv;
    uniform float uTime;
    void main() {
      vUv = uv;
      // Vertical Pulse: Stretch only the tail
      // (1.0 - uv.y) so the nozzle (y=1) stays fixed 
      // and the tip (y=0) does all the moving
      float stretch = 1.0 + sin(uTime * 12.0) * 0.15;
      
      vec3 pos = position;
      // Stretch is applied relative to the top (nozzle)
      if (pos.y < 0.0) {
        pos.y *= stretch;
      }
      
      // Jitter/Turbulence at the tip
      float taper = 1.0 - vUv.y; 
      float turbulence = sin(uTime * 25.0 + position.y * 15.0) * 0.04 * taper;
      pos.x += turbulence;
      pos.z += turbulence;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uCoreColor;
    uniform float uGlowPow;
    void main() {
      float wave = sin(vUv.y * 8.0 + uTime * 20.0) * 0.15 + 0.85;
      
      float vFade = pow(vUv.y, uGlowPow);
      
      vec3 finalColor = mix(uColor, uCoreColor, vFade * wave);
      float alpha = vFade * wave;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
};
/**
 *KINEMATICS
 */
class Planar3DOFKinematics {
  constructor() {
    this.lengths = [];
    this.totalLength = 0;
    this.toolOffset = 0;
  }
  updateStructure(lengths, toolOffset) {
    this.lengths = lengths;
    this.toolOffset = toolOffset;
    this.totalLength = lengths.reduce((a, b) => a + b, 0) + toolOffset;
  }
  solveIK({ tx, ty, theta }) {
    const [l1, l2] = this.lengths;
    const effectiveL3 = this.lengths[2] + this.toolOffset;
    const xw = tx - effectiveL3 * Math.cos(theta);
    const yw = ty - effectiveL3 * Math.sin(theta);
    const distSq = xw * xw + yw * yw;
    const cos_q1 = (distSq - l1 * l1 - l2 * l2) / (2 * l1 * l2);
    if (Math.abs(cos_q1) > 1) return null;
    const q1_val = Math.acos(cos_q1);
    return [q1_val, -q1_val].map((q1) => {
      const q0 =
        Math.atan2(yw, xw) -
        Math.atan2(l2 * Math.sin(q1), l1 + l2 * Math.cos(q1));
      const q2 = theta - q0 - q1;
      return [q0, q1, q2];
    });
  }
  getTipPos(joints, basePos) {
    let x = basePos.x,
      y = basePos.y,
      angle = 0;
    joints.forEach((q, i) => {
      angle += q;
      x += Math.cos(angle) * this.lengths[i];
      y += Math.sin(angle) * this.lengths[i];
    });
    x += Math.cos(angle) * this.toolOffset;
    y += Math.sin(angle) * this.toolOffset;
    return { x, y };
  }
}

/**
 * ARM VISUAL
 */
class StandardVisualizer {
  constructor() {
    this.root = new THREE.Group();
    this.jointNodes = [];
    this.pincerFingerNodes = [];
    this.thrusterFlame = null;
    this.mats = this._createMaterials();
  }

  _createMaterials() {
    const v = ROBOT_CONFIG.VISUALS;
    const t = ROBOT_CONFIG.EFFECTS.THRUSTER;
    return {
      chassis: new THREE.MeshStandardMaterial({
        color: v.COLORS.MAIN_CHASSIS,
        metalness: 0.2,
        roughness: 0.8,
      }),
      shaft: new THREE.MeshStandardMaterial({
        color: v.COLORS.SHAFT_METAL,
        metalness: 0.7,
        roughness: 0.3,
      }),
      joint: new THREE.MeshStandardMaterial({
        color: v.COLORS.JOINT_MOTOR,
        metalness: 0.8,
        roughness: 0.2,
      }),
      hazard: new THREE.MeshStandardMaterial({
        map: this._generateHazardTexture(),
        emissive: v.COLORS.HAZARD_BASE,
        emissiveIntensity: v.COLORS.GLOW_INTENSITY,
      }),
      flame: new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(t.COLOR) },
          uCoreColor: { value: new THREE.Color(t.CORE_COLOR) },
          uGlowPow: { value: t.GLOW_POW },
        },
        vertexShader: THRUSTER_SHADER.vertexShader,
        fragmentShader: THRUSTER_SHADER.fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      matActiveIndicator: new THREE.MeshStandardMaterial({
        color: v.LEDS.COLORS.OFF,
        emissive: v.LEDS.COLORS.OFF,
        emissiveIntensity: 2,
      }),
      matIdleIndicator: new THREE.MeshStandardMaterial({
        color: v.LEDS.COLORS.OFF,
        emissive: v.LEDS.COLORS.OFF,
        emissiveIntensity: 2,
      }),
    };
  }

  build(lengths) {
    this.root.clear();
    this.jointNodes = [];
    this.pincerFingerNodes = [];
    const v = ROBOT_CONFIG.VISUALS;
    const L = v.LAYERS;

    // Thruster Base
    const baseGroup = new THREE.Group();
    baseGroup.renderOrder = L.BASE;
    this.root.add(baseGroup);

    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(
        v.BASE.THRUSTER_NOZZLE_RADIUS * 0.5,
        v.BASE.THRUSTER_NOZZLE_RADIUS,
        v.BASE.THRUSTER_NOZZLE_HEIGHT,
        16
      ),
      this.mats.joint
    );
    nozzle.position.y = -v.BASE.THRUSTER_NOZZLE_HEIGHT / 2;
    nozzle.renderOrder = L.BASE;
    baseGroup.add(nozzle);

    const flameGeo = new THREE.CylinderGeometry(
      v.BASE.THRUSTER_NOZZLE_RADIUS * 0.8,
      0.01,
      v.BASE.FLAME_LENGTH,
      16,
      1,
      true
    );

    // shift the geometry so the top is at 0,0,0
    flameGeo.translate(0, -v.BASE.FLAME_LENGTH / 2, 0);

    this.thrusterFlame = new THREE.Mesh(flameGeo, this.mats.flame);

    // place the pivot at the bottom of the nozzle
    this.thrusterFlame.position.y = -v.BASE.THRUSTER_NOZZLE_HEIGHT;
    this.thrusterFlame.renderOrder = L.FLAME;
    baseGroup.add(this.thrusterFlame);

    // Links
    let parent = this.root;
    lengths.forEach((len, i) => {
      const jointNode = new THREE.Group();
      const linkBaseOrder = L.ARM + i * 10;
      jointNode.renderOrder = linkBaseOrder;
      parent.add(jointNode);
      this.jointNodes.push(jointNode);

      const motor = new THREE.Mesh(
        new THREE.SphereGeometry(
          ROBOT_CONFIG.ARM.THICKNESS * v.JOINTS.MOTOR_HUB_RADIUS,
          16,
          16
        ),
        this.mats.joint
      );
      motor.renderOrder = linkBaseOrder;
      jointNode.add(motor);

      const socketLen = v.JOINTS.SOCKET_DEPTH;
      const socket = new THREE.Mesh(
        new THREE.CylinderGeometry(
          ROBOT_CONFIG.ARM.THICKNESS,
          ROBOT_CONFIG.ARM.THICKNESS * v.JOINTS.SOCKET_FLARE,
          socketLen,
          16
        ),
        this.mats.hazard
      );
      socket.rotation.z = Math.PI / 2;
      socket.position.x = socketLen / 2;
      socket.renderOrder = linkBaseOrder + 5;
      jointNode.add(socket);

      const shaftLen = len - socketLen;
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(
          ROBOT_CONFIG.ARM.THICKNESS * v.PROPORTIONS.SHAFT_THICKNESS,
          ROBOT_CONFIG.ARM.THICKNESS * v.PROPORTIONS.SHAFT_THICKNESS,
          shaftLen,
          16
        ),
        this.mats.shaft
      );
      shaft.rotation.z = Math.PI / 2;
      shaft.position.x = socketLen + shaftLen / 2;
      shaft.renderOrder = linkBaseOrder;
      jointNode.add(shaft);

      if (i === lengths.length - 1) {
        const v = ROBOT_CONFIG.VISUALS;
        const L = v.LAYERS;
        const linkBaseOrder = L.ARM + i * 10;
        const ledGeo = new THREE.SphereGeometry(v.LEDS.SIZE, 8, 8);
        const surfaceZ =
          ROBOT_CONFIG.ARM.THICKNESS * v.PROPORTIONS.SHAFT_THICKNESS + 0.05;

        // Calculate position from tip, but clamp to the specific Fallback Factor
        const posActive = Math.max(
          len * v.LEDS.MIN_FACTOR_ACTIVE,
          len - v.LEDS.MARGIN_ACTIVE
        );
        const posIdle = Math.max(
          len * v.LEDS.MIN_FACTOR_IDLE,
          len - v.LEDS.MARGIN_IDLE
        );

        // Active Indicator
        const bulbActive = new THREE.Mesh(ledGeo, this.mats.matActiveIndicator);
        bulbActive.position.set(posActive, 0, surfaceZ);
        bulbActive.renderOrder = linkBaseOrder + 9; // High priority in the slot
        jointNode.add(bulbActive);

        // Idle Indicator
        const bulbIdle = new THREE.Mesh(ledGeo, this.mats.matIdleIndicator);
        bulbIdle.position.set(posIdle, 0, surfaceZ);
        bulbIdle.renderOrder = linkBaseOrder + 9; // High priority in the slot
        jointNode.add(bulbIdle);
      }
      const nextPivot = new THREE.Group();
      nextPivot.position.x = len;
      jointNode.add(nextPivot);
      parent = nextPivot;
    });

    this._buildEndEffector(parent, lengths.length);
  }

  _buildEndEffector(parent, linkCount) {
    const clawP = ROBOT_CONFIG.VISUALS.PINCER;
    const pincerGroup = new THREE.Group();
    pincerGroup.renderOrder = ROBOT_CONFIG.VISUALS.LAYERS.PINCERS;
    // Ensure pincers are higher than the last link's hazard band
    pincerGroup.renderOrder = ROBOT_CONFIG.VISUALS.LAYERS.ARM + linkCount * 10;
    parent.add(pincerGroup);

    [-1, 1].forEach((side) => {
      const fRoot = new THREE.Group();
      const fMesh = new THREE.Mesh(
        new THREE.BoxGeometry(
          ROBOT_CONFIG.PINCER.LENGTH,
          clawP.THICKNESS,
          ROBOT_CONFIG.ARM.THICKNESS * 0.8
        ),
        this.mats.chassis
      );
      fMesh.geometry.translate(ROBOT_CONFIG.PINCER.LENGTH / 2, 0, 0);
      const tip = new THREE.Mesh(
        new THREE.BoxGeometry(
          clawP.TIP_SIZE,
          clawP.TIP_SIZE,
          ROBOT_CONFIG.ARM.THICKNESS * 0.9
        ),
        this.mats.shaft
      );
      tip.position.set(
        ROBOT_CONFIG.PINCER.LENGTH - clawP.TIP_SIZE / 2,
        side * (clawP.THICKNESS / 2),
        0
      );
      fMesh.add(tip);
      fRoot.add(fMesh);
      pincerGroup.add(fRoot);
      this.pincerFingerNodes.push(fRoot);
    });
  }

  update(joints) {
    joints.forEach(
      (q, i) => this.jointNodes[i] && (this.jointNodes[i].rotation.z = q)
    );
  }

  updatePincers(angle) {
    const off = ROBOT_CONFIG.VISUALS.PINCER.OFFSET_OPEN;
    if (this.pincerFingerNodes.length === 2) {
      this.pincerFingerNodes[0].rotation.z = angle + off;
      this.pincerFingerNodes[1].rotation.z = -angle - off;
    }
  }

  _generateHazardTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = new THREE.Color(
      ROBOT_CONFIG.VISUALS.COLORS.HAZARD_BASE
    ).getStyle();
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = new THREE.Color(
      ROBOT_CONFIG.VISUALS.COLORS.HAZARD_STRIPE
    ).getStyle();
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 32, 0);
      ctx.lineTo(i * 32 + 16, 0);
      ctx.lineTo(i * 32 + 48, 128);
      ctx.lineTo(i * 32 + 32, 128);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
}

/**
 * BEHAVIORS and EFFECTS
 */
class PincerBehavior {
  init(ctrl) {
    this.ctrl = ctrl;
    this.current = ROBOT_CONFIG.PINCER.CLOSED_ANGLE;
    this.target = ROBOT_CONFIG.PINCER.CLOSED_ANGLE;
  }

  update() {
    const cfg = ROBOT_CONFIG.PINCER;
    const state = this.ctrl.state;

    // Is the mouse close
    const isHungry = state.isHovering && state.proximity < cfg.SENSE_RANGE;

    if (isHungry) {
      if (Math.abs(this.current - this.target) < 0.05) {
        this.target =
          this.target === cfg.OPEN_ANGLE ? cfg.CLOSED_ANGLE : cfg.OPEN_ANGLE;
      }
    } else {
      // Idle Personality
      // how far from default (home) pose
      const homeDist = state.joints.reduce(
        (acc, q, i) => acc + Math.abs(q - state.defaultJoints[i]),
        0
      );

      // If at home and not tracking the mouse
      if (homeDist < 0.1 && !state.trackingEngaged) {
        //randomly trigger the pincers
        if (Math.random() < cfg.IDLE_SNAP_CHANCE) {
          this.target =
            this.target === cfg.OPEN_ANGLE ? cfg.CLOSED_ANGLE : cfg.OPEN_ANGLE;
        }
      } else {
        // Is moving
        this.target = cfg.CLOSED_ANGLE;
      }
    }

    // Apply movement
    const lerpSpeed = isHungry ? cfg.SPEED_EAGER : cfg.SPEED_NORMAL;
    this.current += (this.target - this.current) * lerpSpeed;

    this.ctrl.visualizer.updatePincers(this.current);
  }
}

class FloatBehavior {
  init(ctrl) {
    this.ctrl = ctrl;
  }
  update() {
    this.ctrl.state.floatOffset =
      Math.sin(
        (performance.now() / ROBOT_CONFIG.EFFECTS.FLOAT.PERIOD) * Math.PI * 2
      ) * ROBOT_CONFIG.EFFECTS.FLOAT.AMPLITUDE;
  }
}

class SparkBehavior {
  constructor() {
    this.particles = [];
    this.prevPos = { x: 0, y: 0 };
  }
  init(ctrl) {
    this.ctrl = ctrl;
    const cfg = ROBOT_CONFIG.EFFECTS.SPARK;
    const geo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const mat = new THREE.MeshBasicMaterial({ color: cfg.COLOR });
    for (let i = 0; i < cfg.COUNT; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.visible = false;
      p.renderOrder = ROBOT_CONFIG.VISUALS.LAYERS.EFFECTS;
      p.userData = { vel: new THREE.Vector3(), life: 0 };
      this.particles.push(p);
      this.ctrl.scene.add(p);
    }
  }
  update() {
    const tipLocal = this.ctrl.kinematics.getTipPos(
      this.ctrl.state.joints,
      this.ctrl.state.baseWorldPos
    );
    const speed = Math.sqrt(
      Math.pow(tipLocal.x - this.prevPos.x, 2) +
        Math.pow(tipLocal.y - this.prevPos.y, 2)
    );
    if (
      speed > ROBOT_CONFIG.EFFECTS.SPARK.THRESHOLD &&
      this.ctrl.state.trackingEngaged
    ) {
      this._emit(tipLocal.x, tipLocal.y + this.ctrl.state.floatOffset);
    }
    this.particles.forEach((p) => {
      if (!p.visible) return;
      p.position.add(p.userData.vel);
      p.scale.multiplyScalar(ROBOT_CONFIG.EFFECTS.SPARK.DECAY);
      p.userData.life -= ROBOT_CONFIG.EFFECTS.SPARK.LIFE_DECAY;
      if (p.userData.life <= 0) p.visible = false;
    });
    this.prevPos = { ...tipLocal };
  }
  _emit(x, y) {
    const p = this.particles.find((part) => !part.visible);
    if (!p) return;
    p.visible = true;
    p.position.set(x, y, 0.5);
    p.scale.set(1, 1, 1);
    p.userData.life = 1.0;
    p.userData.vel.set(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      0
    );
  }
}

class StatusLightBehavior {
  init(ctrl) {
    this.ctrl = ctrl;
  }

  update() {
    const state = this.ctrl.state;
    const mats = this.ctrl.visualizer.mats;
    const C = ROBOT_CONFIG.VISUALS.LEDS.COLORS;

    const isHungry =
      state.isHovering && state.proximity < ROBOT_CONFIG.PINCER.SENSE_RANGE;
    const isTracking = state.trackingEngaged;

    let activeColor, idleColor;

    activeColor = isTracking ? C.ACTIVE : C.OFF;

    if (isHungry) {
      idleColor = C.ENGAGED;
    } else {
      idleColor = !isTracking ? C.IDLE : C.OFF;
    }

    // Apply colors
    mats.matActiveIndicator.color.setHex(activeColor);
    mats.matActiveIndicator.emissive.setHex(activeColor);

    mats.matIdleIndicator.color.setHex(idleColor);
    mats.matIdleIndicator.emissive.setHex(idleColor);
  }
}

class ThrusterBehavior {
  init(ctrl) {
    this.ctrl = ctrl;
  }

  update() {
    const flame = this.ctrl.visualizer.thrusterFlame;
    if (!flame) return;

    flame.material.uniforms.uTime.value = performance.now() / 1000;

    flame.visible = ROBOT_CONFIG.EFFECTS.THRUSTER.ENABLED;
  }
}

/**
 * CONTROLLEr
 */
class RobotController {
  constructor(canvasId, kinematics, visualizer) {
    this.canvas = document.getElementById(canvasId);
    this.kinematics = kinematics;
    this.visualizer = visualizer;
    this.behaviors = [];
    this.state = {
      joints: [...ROBOT_CONFIG.MOTION.DEFAULT_JOINTS],
      targetJoints: [...ROBOT_CONFIG.MOTION.DEFAULT_JOINTS],
      defaultJoints: [...ROBOT_CONFIG.MOTION.DEFAULT_JOINTS],
      baseWorldPos: { x: 0, y: 0 },
      mouseWorldPos: { x: 0, y: 0 },
      floatOffset: 0,
      proximity: 999,
      isHovering: false,
      trackingEngaged: false,
      isVisible: false,
      lastInputTime: Date.now(),
    };
    this._initThree();
    this._attachEvents();
    this.onResize();
  }

  addBehavior(behavior) {
    behavior.init(this);
    this.behaviors.push(behavior);
    return this;
  }

  _initThree() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    this.camera.position.z = ROBOT_CONFIG.WORLD.CAMERA_Z;

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const p1 = new THREE.PointLight(
      0xffffff,
      ROBOT_CONFIG.WORLD.LIGHT_INTENSITY
    );
    p1.position.set(5, 5, 10);
    this.scene.add(p1);
    const p2 = new THREE.PointLight(
      0xffffff,
      ROBOT_CONFIG.WORLD.LIGHT_INTENSITY * 0.5
    );
    p2.position.set(-5, -5, 5);
    this.scene.add(p2);

    this.scene.add(this.visualizer.root);
  }

  updateCursor() {
    const { trackingEngaged, isInsideDeadZone, isHovering } = this.state;
    const C = ROBOT_CONFIG.INTERACTION.CURSORS;

    if (trackingEngaged) {
      if (isInsideDeadZone) {
        this.canvas.style.cursor = C.DISABLED;
      } else {
        this.canvas.style.cursor = C.ACTIVE;
      }
    } else if (isHovering) {
      this.canvas.style.cursor = C.HOVER;
    } else {
      this.canvas.style.cursor = C.IDLE;
    }
  }

  _attachEvents() {
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));

    window.addEventListener("click", (e) => {
      if (this.state.trackingEngaged) {
        this.state.trackingEngaged = false;
      } else if (this.state.isHovering) {
        this.state.trackingEngaged = true;
        this.state.lastInputTime = Date.now();
      }
      this.updateCursor();
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.state.trackingEngaged = false;
      this.state.isHovering = false;
      this.updateCursor();
    });

    new IntersectionObserver((e) => {
      this.state.isVisible = e[0].isIntersecting;
      if (this.state.isVisible) this.animate();
    }).observe(this.canvas);

    new ResizeObserver(() => this.onResize()).observe(this.canvas);
  }

  onMouseMove(e) {
    const r = this.canvas.getBoundingClientRect();

    // Boundary check
    const isInside =
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom;

    if (!isInside) {
      // Immediately stop tracking if mouse leaves the canvas
      if (this.state.trackingEngaged) {
        this.state.trackingEngaged = false;
        this.updateCursor();
      }
      this.state.isHovering = false;
      return;
    }

    const aspect = r.width / r.height;
    const h = ROBOT_CONFIG.WORLD.HEIGHT;
    const w = h * aspect;

    const x = ((e.clientX - r.left) / r.width) * w - w / 2;
    const y = -((e.clientY - r.top) / r.height) * h + h / 2;
    this.state.mouseWorldPos = { x, y };

    const dist = Math.sqrt(
      Math.pow(x - this.state.baseWorldPos.x, 2) +
        Math.pow(y - (this.state.baseWorldPos.y + this.state.floatOffset), 2)
    );

    const maxR =
      this.kinematics.totalLength * ROBOT_CONFIG.MOTION.MAX_REACH_THRESHOLD;
    const minR =
      this.kinematics.lengths[0] * ROBOT_CONFIG.MOTION.MIN_REACH_THRESHOLD;

    this.state.isInsideDeadZone = dist < minR;
    this.state.isHovering = dist < maxR && dist > minR;
    this.state.lastInputTime = Date.now();

    this.updateCursor();
  }

  onResize() {
    const r = this.canvas.getBoundingClientRect();
    if (r.height === 0) return;

    // Sync Renderer & Camera
    this.renderer.setSize(r.width, r.height, false);
    const aspect = r.width / r.height;
    const h = ROBOT_CONFIG.WORLD.HEIGHT;
    const w = h * aspect;

    this.camera.left = -w / 2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.updateProjectionMatrix();

    // READ SCSS VARIABLES
    const style = getComputedStyle(this.canvas);

    // Anchor points to place the base of arm (0.15 for 15% from left in x and from bottom in y)
    const anchorX =
      parseFloat(style.getPropertyValue("--robot-anchor-x")) || 0.15;
    const anchorY =
      parseFloat(style.getPropertyValue("--robot-anchor-y")) || 0.25;

    // Default joint states for home position
    const jointsString = style.getPropertyValue("--robot-default-joints");
    if (jointsString) {
      this.state.defaultJoints = jointsString
        .split(",")
        .map((s) => parseFloat(s.trim()));

      // If not tracking, snap current target to defaults
      if (!this.state.trackingEngaged) {
        this.state.targetJoints = [...this.state.defaultJoints];
      }
    }

    // SCALING (proportional to the smaller dimension)
    const refDim = Math.min(w, h);
    let baseLen = refDim * ROBOT_CONFIG.ARM.VIEWPORT_FRACTION;

    // Apply original min/max constraints
    baseLen = Math.max(
      ROBOT_CONFIG.ARM.MIN_LINK_LENGTH,
      Math.min(baseLen, ROBOT_CONFIG.ARM.MAX_LINK_LENGTH)
    );

    const lens = [baseLen, baseLen, baseLen * ROBOT_CONFIG.ARM.WRIST_RATIO];

    this.kinematics.updateStructure(lens, ROBOT_CONFIG.ARM.TCP_OFFSET);
    this.visualizer.build(lens);

    // Move base on resize if needed
    this.state.baseWorldPos = {
      x: anchorX * w - w / 2,
      y: anchorY * h - h / 2,
    };

    // Apply X immediately (Y is handled by FloatBehavior in animate loop)
    // TODO: make this better and effect agnostic
    this.visualizer.root.position.x = this.state.baseWorldPos.x;
  }

  animate() {
    if (!this.state.isVisible) return;
    requestAnimationFrame(() => this.animate());
    const now = Date.now();
    if (
      this.state.trackingEngaged &&
      now - this.state.lastInputTime >
        ROBOT_CONFIG.INTERACTION.IDLE_DISENGAGE_TIME
    ) {
      this.state.trackingEngaged = false;
      this.updateCursor();
    }

    this.behaviors.forEach((b) => b.update());
    this.visualizer.root.position.y =
      this.state.baseWorldPos.y + this.state.floatOffset;

    const dx = this.state.mouseWorldPos.x - this.state.baseWorldPos.x;
    const dy =
      this.state.mouseWorldPos.y -
      (this.state.baseWorldPos.y + this.state.floatOffset);
    const dist = Math.sqrt(dx * dx + dy * dy);

    const minR =
      this.kinematics.lengths[0] * ROBOT_CONFIG.MOTION.MIN_REACH_THRESHOLD;
    const shouldFollow = this.state.trackingEngaged && dist > minR;

    if (shouldFollow) {
      const theta = Math.atan2(dy, dx);
      const maxR =
        this.kinematics.totalLength * ROBOT_CONFIG.MOTION.MAX_REACH_THRESHOLD;
      const tx = dist > maxR ? Math.cos(theta) * maxR : dx;
      const ty = dist > maxR ? Math.sin(theta) * maxR : dy;
      const sols = this.kinematics.solveIK({ tx, ty, theta });
      if (sols) {
        this.state.targetJoints = sols.reduce((prev, curr) => {
          const diff = (s) =>
            s.reduce(
              (acc, ang, i) => acc + Math.abs(ang - this.state.joints[i]),
              0
            );
          return diff(curr) < diff(prev) ? curr : prev;
        });
      }
    }

    const target = shouldFollow
      ? this.state.targetJoints
      : this.state.defaultJoints;
    const speed = shouldFollow
      ? ROBOT_CONFIG.MOTION.LERP_SPEED_ACTIVE
      : ROBOT_CONFIG.MOTION.LERP_SPEED_RETURN;
    this.state.joints = this.state.joints.map(
      (cur, i) => cur + (target[i] - cur) * speed
    );

    const tip = this.kinematics.getTipPos(this.state.joints, {
      x: this.state.baseWorldPos.x,
      y: this.state.baseWorldPos.y + this.state.floatOffset,
    });
    this.state.proximity = Math.sqrt(
      Math.pow(this.state.mouseWorldPos.x - tip.x, 2) +
        Math.pow(this.state.mouseWorldPos.y - tip.y, 2)
    );

    this.visualizer.update(this.state.joints);
    this.renderer.render(this.scene, this.camera);
  }
}

// INITIALIZATION
new RobotController(
  "robot-canvas",
  new Planar3DOFKinematics(),
  new StandardVisualizer()
)
  .addBehavior(new FloatBehavior())
  .addBehavior(new PincerBehavior())
  .addBehavior(new SparkBehavior())
  .addBehavior(new StatusLightBehavior())
  .addBehavior(new ThrusterBehavior())
  .animate();
