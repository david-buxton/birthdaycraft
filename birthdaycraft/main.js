import * as THREE from 'three';

const NEPHEW_NAME = 'BEN';
const WORLD = 34;
const BLOCK = 1;
const REQUIRED_DIAMONDS = 5;

const game = document.getElementById('game');
const diamondText = document.getElementById('diamonds');
const message = document.getElementById('message');

document.getElementById('again').onclick = () => location.reload();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 25, 70);

const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  150
);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;

game.appendChild(renderer.domElement);

scene.add(
  new THREE.HemisphereLight(0xffffff, 0x5b6d43, 1.7)
);

const sun = new THREE.DirectionalLight(0xffffff, 1.6);

sun.position.set(20, 30, 10);
sun.castShadow = true;

scene.add(sun);

const mats = {
  grass: new THREE.MeshLambertMaterial({ color: 0x63b54a }),
  dirt: new THREE.MeshLambertMaterial({ color: 0x8b5a2b }),
  stone: new THREE.MeshLambertMaterial({ color: 0x858585 }),
  wood: new THREE.MeshLambertMaterial({ color: 0x8b5a2b }),
  leaf: new THREE.MeshLambertMaterial({ color: 0x2f8f3a }),
  diamond: new THREE.MeshLambertMaterial({
    color: 0x35e3ff,
    emissive: 0x0a6a7a
  }),
  cake: new THREE.MeshLambertMaterial({ color: 0xfff2cc }),
  candle: new THREE.MeshLambertMaterial({ color: 0xff4444 }),
  letter: new THREE.MeshLambertMaterial({ color: 0xffd447 }),
  brick: new THREE.MeshLambertMaterial({ color: 0xaa6b52 })
};

const cubeGeo = new THREE.BoxGeometry(BLOCK, BLOCK, BLOCK);

const blocks = new Map();
const colliders = [];
const diamonds = [];

function key(x, y, z) {
  return `${x},${y},${z}`;
}

function addBlock(
  x,
  y,
  z,
  matName = 'grass',
  solid = true,
  tag = 'block'
) {
  const mesh = new THREE.Mesh(
    cubeGeo,
    mats[matName]
  );

  mesh.position.set(x, y, z);

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  mesh.userData = {
    x,
    y,
    z,
    matName,
    tag,
    solid
  };

  scene.add(mesh);

  blocks.set(key(x, y, z), mesh);

  if (solid) colliders.push(mesh);

  return mesh;
}

function removeBlock(mesh) {
  scene.remove(mesh);

  blocks.delete(
    key(
      mesh.userData.x,
      mesh.userData.y,
      mesh.userData.z
    )
  );

  const i = colliders.indexOf(mesh);

  if (i >= 0) colliders.splice(i, 1);
}

function heightAt(x, z) {
  return Math.floor(
    2 +
    Math.sin(x * 0.38) * 1.1 +
    Math.cos(z * 0.31) * 1.2 +
    Math.sin((x + z) * 0.2)
  );
}

for (let x = -WORLD / 2; x < WORLD / 2; x++) {
  for (let z = -WORLD / 2; z < WORLD / 2; z++) {

    const h = heightAt(x, z);

    for (let y = 0; y <= h; y++) {
      addBlock(
        x,
        y,
        z,
        y === h
          ? 'grass'
          : (y < h - 2 ? 'stone' : 'dirt')
      );
    }
  }
}

function tree(x, z) {

  const h = heightAt(x, z) + 1;

  for (let y = 0; y < 4; y++) {
    addBlock(x, h + y, z, 'wood');
  }

  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dy = 2; dy <= 4; dy++) {

        if (
          Math.abs(dx) +
          Math.abs(dz) +
          Math.max(0, dy - 3) < 5
        ) {
          addBlock(
            x + dx,
            h + dy,
            z + dz,
            'leaf'
          );
        }
      }
    }
  }
}

[
  [-12, -9],
  [11, -10],
  [-8, 12],
  [13, 8],
  [-15, 4]
].forEach(([x, z]) => tree(x, z));

for (let x = -4; x <= 4; x++) {
  for (let z = -4; z <= 4; z++) {
    addBlock(
      x,
      heightAt(0, 0) + 1,
      z,
      'brick'
    );
  }
}

addBlock(0, heightAt(0, 0) + 2, 0, 'cake');
addBlock(0, heightAt(0, 0) + 3, 0, 'candle');

const FONT = {
  B:['11110','10001','10001','11110','10001','10001','11110'],
  E:['11111','10000','10000','11110','10000','10000','11111'],
  N:['10001','11001','10101','10011','10001','10001','10001'],
  H:['10001','10001','10001','11111','10001','10001','10001'],
  A:['01110','10001','10001','11111','10001','10001','10001'],
  P:['11110','10001','10001','11110','10000','10000','10000'],
  Y:['10001','10001','01010','00100','00100','00100','00100'],
  I:['11111','00100','00100','00100','00100','00100','11111'],
  R:['11110','10001','10001','11110','10100','10010','10001'],
  T:['11111','00100','00100','00100','00100','00100','00100'],
  D:['11110','10001','10001','10001','10001','10001','11110']
};

function writeText(
  text,
  startX,
  baseY,
  z,
  flip = false
) {

  let cursor = startX;

  for (const ch of text.toUpperCase()) {

    if (ch === ' ') {
      cursor += 4;
      continue;
    }

    const rows = FONT[ch] || FONT.H;

    rows.forEach((row, ry) => {

      [...row].forEach((v, rx) => {

        if (v === '1') {

          const px = flip
            ? cursor - rx
            : cursor + rx;

          addBlock(
            px,
            baseY + (6 - ry),
            z,
            'letter'
          );
        }

      });

    });

    cursor += 6;
  }
}

writeText('HAPPY', -15, 8, -18);
writeText('BIRTHDAY', -22, 0, -18);
writeText(NEPHEW_NAME, 16, 8, 18, true);
