import './home.css';  
import React from 'react';
import * as THREE from 'three';
import { OrbitControls} from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000000);

const canvas = document.querySelector('canvas.three ');
const renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize(window.innerWidth-5 , window.innerHeight-5);

const light1 = new THREE.AmbientLight('white' , 0.8)
scene.add(light1)

const light2 = new THREE.PointLight('white' , 3600)
light2.position.set(1 ,0 ,0 )
scene.add(light2)

const controls = new OrbitControls(camera , canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.09;
controls.enablePan = true;

const textureLoader = new THREE.TextureLoader()
const sunGeometry = new THREE.SphereGeometry(10 , 100 , 50)
const sphereGeometry = new THREE.SphereGeometry(10 , 20 ,20)

//sun
const sunTexture = textureLoader.load('/src/textures/sphereGeometry/2k_sun.jpg')
const sunMaterial = new THREE.MeshBasicMaterial({map: sunTexture})
const sun = new THREE.Mesh(sunGeometry , sunMaterial)
scene.add(sun);
sun.scale.setScalar(2)

//mercury
const mercuryTexture = textureLoader.load('/src/textures/sphereGeometry/2k_mercury.jpg')
const mercuryMaterial = new THREE.MeshStandardMaterial({ map: mercuryTexture})
const mercury = new THREE.Mesh(sphereGeometry , mercuryMaterial)
mercury.position.x = 25
scene.add(mercury)
mercury.scale.setScalar(0.45);

//venus
const venusTexture = textureLoader.load('/src/textures/sphereGeometry/2k_venus_surface.jpg')
const venusMaterial = new THREE.MeshStandardMaterial({map: venusTexture})
const venus = new THREE.Mesh(sphereGeometry, venusMaterial)
venus.position.x = 50
scene.add(venus)
venus.scale.setScalar(0.67)

//Earth
const earthTexture = textureLoader.load('/src/textures/sphereGeometry/2k_earth_daymap.jpg')
const earthMaterial = new THREE.MeshStandardMaterial({map : earthTexture})
const earth = new THREE.Mesh(sphereGeometry , earthMaterial)
earth.position.x = 75
scene.add(earth)
earth.scale.setScalar(0.72)

//Earth-moon
const earthMoonTexture = textureLoader.load('/src/textures/sphereGeometry/2k_moon.jpg')
const earthMoonMaterial = new THREE.MeshStandardMaterial({map : earthMoonTexture})
const earthMoon = new THREE.Mesh(sphereGeometry , earthMoonMaterial)
earthMoon.position.x = 20
earth.add(earthMoon)
earthMoon.scale.setScalar(0.35)

//Mars 
const marsTexture = textureLoader.load('/src/textures/sphereGeometry/2k_mars.jpg')
const marsMaterial = new THREE.MeshStandardMaterial({map : marsTexture})
const mars = new THREE.Mesh(sphereGeometry , marsMaterial)
scene.add(mars)
mars.scale.setScalar(0.74)

//Mars- Moon
const phobosTexture = textureLoader.load('/src/textures/sphereGeometry/2k_phobos.jpg')
const phobosMaterial = new THREE.MeshStandardMaterial({map : phobosTexture})
const phobos = new THREE.Mesh(sphereGeometry , phobosMaterial)
mars.add(phobos)
phobos.position.x = 18
phobos.scale.setScalar(0.22)

//Mars- Moon
const demiosTexture = textureLoader.load('/src/textures/sphereGeometry/2k_phobos.jpg')
const demiosMaterial = new THREE.MeshStandardMaterial({map : demiosTexture})
const demios = new THREE.Mesh(sphereGeometry , demiosMaterial)
mars.add(demios)
demios.position.y = 26
demios.scale.setScalar(0.22)

const cubeLoader = new THREE.CubeTextureLoader()
cubeLoader.setPath( '/src/textures/sphereGeometry/Standard-Cube-Map/' );
scene.background = cubeLoader.load([
	'px.png', 'nx.png',
	'py.png', 'ny.png',
	'pz.png', 'nz.png'
])

camera.position.z = 800
window.addEventListener( 'resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight ; 
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth , window.innerHeight);
})

const clock = new THREE.Clock()

const renderloop = () => {

    earth.rotation.z += 0.01
    const elapsedTime = clock.getElapsedTime()
    earth.position.y = Math.sin(0.3 * elapsedTime) * 120
    earth.position.x = Math.cos(0.3 * elapsedTime) * 120

    mercury.position.y = Math.sin(0.5 * elapsedTime) * 40
    mercury.position.x = Math.cos(0.5 * elapsedTime) * 40

    venus.position.y = Math.sin(0.4 * elapsedTime) * 80
    venus.position.x = Math.cos(0.4 * elapsedTime) * 80

    mars.position.y = Math.sin(0.2 * elapsedTime) * 180
    mars.position.x = Math.cos(0.2 * elapsedTime) * 180
    mars.rotation.z += 0.01

    renderer.render(scene, camera);
    controls.update();
    window.requestAnimationFrame(renderloop);
   
} 

renderloop()


const SolarSystem = () => {
  return (
  
    <></>
  );
  
};

export default SolarSystem;