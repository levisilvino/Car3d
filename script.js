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
controls.screenSpacePanning = true;
console.log('🔄 Controles orbitais configurados com amortecimento');

// Animation mixer for GLTF model
let mixer;
const clock = new THREE.Clock();

function animate() {
    // Request next animation frame
    requestAnimationFrame(animate);

    // Update orbit controls
    controls.update();

    // Update animation mixer if exists
    if (mixer) {
        const delta = clock.getDelta();
        mixer.update(delta);
    }

    // Render the scene
    renderer.render(scene, camera);
}

// Carregamento do Modelo GLTF/GLB
console.log('📦 Preparando carregamento do modelo 3D');
const gltfLoader = new GLTFLoader();

gltfLoader.load(
    'carrinhobrinquecoanimado.glb',
    (gltf) => {
        console.log('✅ Modelo 3D carregado com sucesso!');
        console.log(`🧩 Detalhes do modelo:
- Número de cenas: ${gltf.scenes.length}
- Número de animações: ${gltf.animations ? gltf.animations.length : 'Nenhuma'}`);

        const model = gltf.scene;
        scene.add(model);

        // Debug: Log all animations details
        if (gltf.animations && gltf.animations.length > 0) {
            console.log('🔍 Detalhes das animações:');
            gltf.animations.forEach((clip, index) => {
                console.log(`
Animação ${index + 1}:
- Nome: ${clip.name}
- Duração: ${clip.duration} segundos
- Tracks: ${clip.tracks.length}`);
            });

            mixer = new THREE.AnimationMixer(model);
            
            // Play all animations with more control
            gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                action.setLoop(THREE.LoopRepeat, Infinity); // Ensure continuous looping
                action.play();
                console.log(`▶️ Iniciando animação: ${clip.name}`);
            });

            console.log(`🎬 Loaded ${gltf.animations.length} animation(s)`);
        } else {
            console.warn('⚠️ Nenhuma animação encontrada no modelo!');
        }

        // Ajuste de posição e escala
        model.position.set(0, 0, 0);
        model.scale.set(1, 1, 1);

        // Posicionamento da câmera
        camera.lookAt(model.position);
        console.log('👀 Câmera ajustada para focar no modelo');

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