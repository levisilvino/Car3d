import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

console.log('🚀 Inicializando aplicação Three.js');

// Verificação de carregamento de módulos
if (!THREE || !OrbitControls || !GLTFLoader) {
    console.error('❌ Falha ao carregar módulos do Three.js');
    throw new Error('Módulos do Three.js não carregados corretamente');
}
console.log('✅ Módulos Three.js carregados com sucesso');

// Configuração da Cena
console.log('🌍 Criando cena Three.js');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0); // Fundo cinza claro para melhor visibilidade

console.log('📷 Configurando câmera');
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);
console.log(`📐 Configurações da câmera:
- Campo de visão: 75 graus
- Proporção: ${window.innerWidth} x ${window.innerHeight}
- Posição: (0, 2, 5)`);

console.log('🖌️ Configurando renderizador');
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
console.log(`🖥️ Renderizador configurado:
- Tamanho: ${window.innerWidth} x ${window.innerHeight}
- Pixel Ratio: ${window.devicePixelRatio}`);

// Iluminação
console.log('💡 Configurando iluminação');
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
console.log('☀️ Luz ambiente adicionada: intensidade 0.5');

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);
console.log('🌞 Luz direcional adicionada: intensidade 0.8, posição (1, 1, 1)');

// Controles Orbitais
console.log('🎮 Configurando controles orbitais');
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
console.log('🔄 Controles orbitais configurados com amortecimento');

// Carregamento do Modelo GLTF/GLB
console.log('📦 Preparando carregamento do modelo 3D');
const loader = new GLTFLoader();
loader.load(
    'carrinhobrinquecoanimado.glb',
    (gltf) => {
        console.log('✅ Modelo 3D carregado com sucesso!');
        console.log(`🧩 Detalhes do modelo:
- Número de cenas: ${gltf.scenes.length}
- Número de animações: ${gltf.animations.length}`);

        const model = gltf.scene;
        scene.add(model);

        // Ajuste de posição e escala
        model.position.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        console.log('📍 Modelo posicionado em (0, 0, 0) com escala (1, 1, 1)');

        // Animação
        const mixer = new THREE.AnimationMixer(model);
        const clips = gltf.animations;
        console.log(`🎬 Iniciando ${clips.length} animações`);
        clips.forEach((clip, index) => {
            const action = mixer.clipAction(clip);
            action.play();
            console.log(`▶️ Animação ${index + 1} iniciada: ${clip.name}`);
        });

        // Posicionamento da câmera
        camera.lookAt(model.position);
        console.log('👀 Câmera ajustada para focar no modelo');

        // Renderização com animação
        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            
            const delta = clock.getDelta();
            mixer.update(delta);
            
            controls.update();
            renderer.render(scene, camera);
        }
        animate();
        console.log('🎥 Ciclo de animação iniciado');
    },
    (xhr) => {
        console.log(`⏳ Carregando modelo: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% concluído`);
    },
    (error) => {
        console.error('❌ Erro crítico ao carregar modelo:', error);
        alert('Não foi possível carregar o modelo 3D. Verifique o console para detalhes.');
    }
);

// Responsividade
console.log('📱 Configurando responsividade');
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log(`🔄 Tela redimensionada: ${window.innerWidth} x ${window.innerHeight}`);
});

console.log('🚀 Inicialização completa!');