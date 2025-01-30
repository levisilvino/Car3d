import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Adiciona luz ambiente
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Adiciona luz direcional
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Configuração da câmera
camera.position.z = 5;

// Adiciona controles de órbita
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Loader para o modelo GLB
const loader = new GLTFLoader();

// Função para carregar o modelo com tratamento de erro
async function loadModel() {
    try {
        const gltf = await loader.loadAsync('./models/carrinhotexturizado2.glb');
        const model = gltf.scene;
        scene.add(model);
        
        // Centraliza o modelo
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        // Ajusta a escala se necessário
        const scale = 1.0; // Ajuste este valor conforme necessário
        model.scale.set(scale, scale, scale);
        
        return model;
    } catch (error) {
        console.error('❌ Erro crítico ao carregar modelo:', error);
        // Adiciona mensagem visual de erro
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '20px';
        errorDiv.style.borderRadius = '10px';
        errorDiv.innerHTML = 'Erro ao carregar o modelo 3D.<br>Por favor, verifique se o arquivo está na pasta correta.';
        document.body.appendChild(errorDiv);
    }
}

// Carrega o modelo
let model;
loadModel().then(loadedModel => {
    if (loadedModel) {
        model = loadedModel;
    }
});

// Função de animação
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

// Ajusta o tamanho do renderer quando a janela é redimensionada
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});