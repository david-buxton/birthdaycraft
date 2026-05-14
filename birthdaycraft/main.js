import * as THREE from 'three';

const NEPHEW_NAME = 'BEN'; // Change this before sending.
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

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 150);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
game.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x5b6d43, 1.7));
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
  diamond: new THREE.MeshLambertMaterial({ color: 0x35e3ff, emissive: 0x0a6a7a }),
  cake: new THREE.MeshLambertMaterial({ color: 0xfff2cc }),
  candle: new THREE.MeshLambertMaterial({ color: 0xff4444 }),
  letter: new THREE.MeshLambertMaterial({ color: 0xffd447 }),
  brick: new THREE.MeshLambertMaterial({ color: 0xaa6b52 })
};
const cubeGeo = new THREE.BoxGeometry(BLOCK, BLOCK, BLOCK);
const blocks = new Map();
const colliders = [];
const diamonds = [];

function key(x,y,z){ return `${x},${y},${z}`; }
function addBlock(x, y, z, matName='grass', solid=true, tag='block') {
  const mesh = new THREE.Mesh(cubeGeo, mats[matName]);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { x,y,z, matName, tag, solid };
  scene.add(mesh);
  blocks.set(key(x,y,z), mesh);
  if (solid) colliders.push(mesh);
  return mesh;
}
function removeBlock(mesh) {
  scene.remove(mesh);
  blocks.delete(key(mesh.userData.x, mesh.userData.y, mesh.userData.z));
  const i = colliders.indexOf(mesh); if (i >= 0) colliders.splice(i, 1);
}
function heightAt(x,z){
  return Math.floor(2 + Math.sin(x*0.38)*1.1 + Math.cos(z*0.31)*1.2 + Math.sin((x+z)*0.2));
}

for (let x=-WORLD/2; x<WORLD/2; x++) for (let z=-WORLD/2; z<WORLD/2; z++) {
  const h = heightAt(x,z);
  for (let y=0; y<=h; y++) addBlock(x,y,z, y===h?'grass':(y<h-2?'stone':'dirt'));
}

function tree(x,z){
  const h = heightAt(x,z)+1;
  for(let y=0;y<4;y++) addBlock(x,h+y,z,'wood');
  for(let dx=-2;dx<=2;dx++) for(let dz=-2;dz<=2;dz++) for(let dy=2;dy<=4;dy++) {
    if(Math.abs(dx)+Math.abs(dz)+Math.max(0,dy-3) < 5) addBlock(x+dx,h+dy,z+dz,'leaf');
  }
}
[[-12,-9],[11,-10],[-8,12],[13,8],[-15,4]].forEach(([x,z])=>tree(x,z));

// Birthday platform / cake.
for(let x=-4;x<=4;x++) for(let z=-4;z<=4;z++) addBlock(x, heightAt(0,0)+1, z, 'brick');
addBlock(0, heightAt(0,0)+2, 0, 'cake');
addBlock(0, heightAt(0,0)+3, 0, 'candle');

// Simple 5x7 block font for name.
const FONT = {
 A:['01110','10001','10001','11111','10001','10001','10001'], B:['11110','10001','10001','11110','10001','10001','11110'], C:['01111','10000','10000','10000','10000','10000','01111'], D:['11110','10001','10001','10001','10001','10001','11110'], E:['11111','10000','10000','11110','10000','10000','11111'], F:['11111','10000','10000','11110','10000','10000','10000'], G:['01111','10000','10000','10111','10001','10001','01111'], H:['10001','10001','10001','11111','10001','10001','10001'], I:['11111','00100','00100','00100','00100','00100','11111'], J:['00111','00010','00010','00010','10010','10010','01100'], K:['10001','10010','10100','11000','10100','10010','10001'], L:['10000','10000','10000','10000','10000','10000','11111'], M:['10001','11011','10101','10101','10001','10001','10001'], N:['10001','11001','10101','10011','10001','10001','10001'], O:['01110','10001','10001','10001','10001','10001','01110'], P:['11110','10001','10001','11110','10000','10000','10000'], Q:['01110','10001','10001','10001','10101','10010','01101'], R:['11110','10001','10001','11110','10100','10010','10001'], S:['01111','10000','10000','01110','00001','00001','11110'], T:['11111','00100','00100','00100','00100','00100','00100'], U:['10001','10001','10001','10001','10001','10001','01110'], V:['10001','10001','10001','10001','10001','01010','00100'], W:['10001','10001','10001','10101','10101','10101','01010'], X:['10001','10001','01010','00100','01010','10001','10001'], Y:['10001','10001','01010','00100','00100','00100','00100'], Z:['11111','00001','00010','00100','01000','10000','11111']
};
function writeText(text, startX, baseY, z){
  let cursor = startX;
  for (const ch of text.toUpperCase()) {
    if (ch === ' ') { cursor += 4; continue; }
    const rows = FONT[ch] || FONT.H;
    rows.forEach((row, ry) => [...row].forEach((v, rx) => { if(v==='1') addBlock(cursor+rx, baseY+(6-ry), z, 'letter'); }));
    cursor += 6;
  }
}
writeText('HAPPY', -15, 8, -18);
writeText('BIRTHDAY', -22, 0, -18);
//writeText(NEPHEW_NAME, -Math.min(16, NEPHEW_NAME.length*3), 8, 18);
writeText(NEPHEW_NAME.split('').reverse().join(''), -Math.min(16, NEPHEW_NAME.length*3), 8, 18);


// Diamonds.
[[-10,4],[12,0],[6,13],[-13,10],[0,-13]].forEach(([x,z])=>{
  const d = addBlock(x, heightAt(x,z)+2, z, 'diamond', false, 'diamond');
  d.scale.set(.7,.7,.7);
  diamonds.push(d);
});

const player = { pos: new THREE.Vector3(0, heightAt(0,0)+5, 9), vel: new THREE.Vector3(), yaw: Math.PI, pitch: -0.2, onGround:false };
const keys = new Set();
addEventListener('keydown', e=>keys.add(e.code));
addEventListener('keyup', e=>keys.delete(e.code));

let dragging = false, lastX=0, lastY=0;
renderer.domElement.addEventListener('pointerdown', e=>{ dragging=true; lastX=e.clientX; lastY=e.clientY; renderer.domElement.setPointerCapture(e.pointerId); });
renderer.domElement.addEventListener('pointermove', e=>{ if(!dragging) return; look(e.clientX-lastX, e.clientY-lastY); lastX=e.clientX; lastY=e.clientY; });
renderer.domElement.addEventListener('pointerup', ()=> dragging=false);
function look(dx,dy){ player.yaw -= dx*0.004; player.pitch = Math.max(-1.35, Math.min(1.2, player.pitch - dy*0.004)); }

let stickVec = new THREE.Vector2();
const stick = document.getElementById('leftStick'), nub = stick.firstElementChild;
stick.addEventListener('touchmove', e=>{ e.preventDefault(); const r=stick.getBoundingClientRect(), t=e.touches[0]; const x=t.clientX-r.left-58, y=t.clientY-r.top-58; const len=Math.min(42, Math.hypot(x,y)); const a=Math.atan2(y,x); stickVec.set(Math.cos(a)*len/42, Math.sin(a)*len/42); nub.style.left=`${32+stickVec.x*42}px`; nub.style.top=`${32+stickVec.y*42}px`; }, {passive:false});
stick.addEventListener('touchend', ()=>{ stickVec.set(0,0); nub.style.left='32px'; nub.style.top='32px'; });
document.getElementById('jumpBtn').onclick=()=>{ if(player.onGround) player.vel.y=0.18; };
document.getElementById('mineBtn').onclick=()=>mine();
document.getElementById('placeBtn').onclick=()=>place();
addEventListener('mousedown', e=>{ if(e.button===0) mine(); if(e.button===2) place(); });
addEventListener('contextmenu', e=>e.preventDefault());

const ray = new THREE.Raycaster();
function aim(){
  camera.getWorldDirection(ray.ray.direction); ray.ray.origin.copy(camera.position);
  return ray.intersectObjects(colliders, false)[0];
}
function mine(){ const hit=aim(); if(hit && hit.distance<7 && hit.object.userData.tag==='block') removeBlock(hit.object); }
function place(){ const hit=aim(); if(!hit || hit.distance>7) return; const p=hit.object.position.clone().add(hit.face.normal).round(); if(!blocks.has(key(p.x,p.y,p.z))) addBlock(p.x,p.y,p.z,'grass'); }

let collected = 0;
function collectCheck(){
  for(let i=diamonds.length-1;i>=0;i--){
    if(player.pos.distanceTo(diamonds[i].position)<1.5){ scene.remove(diamonds[i]); diamonds.splice(i,1); collected++; diamondText.textContent=collected; burst(player.pos, 12); if(collected>=REQUIRED_DIAMONDS) win(); }
  }
}
const particles=[];
function burst(pos, count=30){
  for(let i=0;i<count;i++){
    const m = new THREE.Mesh(new THREE.SphereGeometry(.08,8,8), new THREE.MeshBasicMaterial({ color: Math.random()*0xffffff }));
    m.position.copy(pos); m.userData.vel = new THREE.Vector3((Math.random()-.5)*.18, Math.random()*.2+.08, (Math.random()-.5)*.18); m.userData.life=80; scene.add(m); particles.push(m);
  }
}
function win(){ message.classList.remove('hidden'); for(let i=0;i<8;i++) setTimeout(()=>burst(new THREE.Vector3((Math.random()-.5)*18, 11+Math.random()*8, (Math.random()-.5)*18), 45), i*250); }

let last=performance.now();
function loop(now){
  const dt=Math.min(.033,(now-last)/1000); last=now;
  const forward = new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw));
  const right = new THREE.Vector3(Math.cos(player.yaw),0,-Math.sin(player.yaw));
  let move = new THREE.Vector3();
  if(keys.has('KeyW')) move.add(forward); if(keys.has('KeyS')) move.sub(forward); if(keys.has('KeyD')) move.add(right); if(keys.has('KeyA')) move.sub(right);
  move.add(forward.clone().multiplyScalar(-stickVec.y)).add(right.clone().multiplyScalar(stickVec.x));
  if(keys.has('Space') && player.onGround){ player.vel.y=.18; player.onGround=false; }
  if(move.lengthSq()>0) move.normalize().multiplyScalar(7*dt);
  player.pos.add(move);
  player.vel.y -= 0.42*dt;
  player.pos.y += player.vel.y;
  const ground = heightAt(Math.round(player.pos.x), Math.round(player.pos.z)) + 2.1;
  if(player.pos.y < ground){ player.pos.y=ground; player.vel.y=0; player.onGround=true; } else player.onGround=false;
  camera.position.copy(player.pos);
  camera.rotation.order='YXZ'; camera.rotation.y=player.yaw; camera.rotation.x=player.pitch;
  collectCheck();
  diamonds.forEach(d=>{ d.rotation.y += dt*2; d.position.y += Math.sin(now*.004 + d.position.x)*0.002; });
  for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.position.add(p.userData.vel); p.userData.vel.y-=.006; if(--p.userData.life<=0){scene.remove(p); particles.splice(i,1);} }
  renderer.render(scene,camera); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
addEventListener('resize', ()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
