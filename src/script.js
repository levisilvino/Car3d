import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class CarModelViewer {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        this.setupLights();
        this.setupControls();
        this.setupEventListeners();
        this.setupObjectSelector();

        this.loader = new GLTFLoader();
        this.model = null;
        this.selectedObject = null;
        this.availableObjects = [];
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupObjectSelector() {
        this.selectorContainer = document.createElement('div');
        this.selectorContainer.style.position = 'fixed';
        this.selectorContainer.style.top = '60px';
        this.selectorContainer.style.left = '10px';
        this.selectorContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
        this.selectorContainer.style.color = 'white';
        this.selectorContainer.style.padding = '10px';
        this.selectorContainer.style.borderRadius = '5px';
        this.selectorContainer.style.display = 'flex';
        this.selectorContainer.style.flexDirection = 'column';
        this.selectorContainer.style.maxHeight = '300px';
        this.selectorContainer.style.overflowY = 'auto';
        document.body.appendChild(this.selectorContainer);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    async loadModel(path) {
        try {
            const gltf = await this.loader.loadAsync(path);
            this.model = gltf.scene;
            
            this.debugModelStructure();
            this.setupModelShadows();
            this.centerAndScaleModel();
            this.setupModelTextures();
            this.listAvailableObjects();
            
            this.scene.add(this.model);
            return this.model;
        } catch (error) {
            this.handleModelLoadError(error);
        }
    }

    debugModelStructure() {
        console.log('🚗 Estrutura Detalhada do Modelo:');
        let objectCount = 0;
        let texturedObjectCount = 0;

        this.model.traverse((child) => {
            if (child.isMesh) {
                objectCount++;
                
                // Verificação de textura
                const hasTexture = child.material && child.material.map;
                const textureInfo = hasTexture 
                    ? `✅ Texturizado (${child.material.map.source.data.src})` 
                    : '❌ Sem Textura';

                console.log(`
📦 Objeto #${objectCount}:
- Nome: ${child.name}
- Tipo de Geometria: ${child.geometry.type}
- Visível: ${child.visible}
- Possui Material: ${!!child.material}
- Estado da Textura: ${textureInfo}
- Posição: (${child.position.x.toFixed(2)}, ${child.position.y.toFixed(2)}, ${child.position.z.toFixed(2)})
                `);

                if (hasTexture) {
                    texturedObjectCount++;
                }
            }
        });

        console.log(`
🔢 Resumo:
- Total de Objetos: ${objectCount}
- Objetos Texturizados: ${texturedObjectCount}
- Porcentagem Texturizada: ${((texturedObjectCount / objectCount) * 100).toFixed(2)}%
        `);
    }

    listAvailableObjects() {
        this.availableObjects = [];
        this.selectorContainer.innerHTML = '';

        this.model.traverse((child) => {
            if (child.isMesh) {
                this.availableObjects.push(child.name);
                
                const button = document.createElement('button');
                button.textContent = child.name;
                button.style.margin = '5px';
                button.style.padding = '5px';
                button.style.backgroundColor = 'rgba(255,255,255,0.1)';
                button.style.color = 'white';
                button.style.border = 'none';
                button.style.borderRadius = '3px';
                
                button.addEventListener('click', () => {
                    this.selectObjectByName(child.name);
                });
                
                this.selectorContainer.appendChild(button);
            }
        });
        
        console.log('🚗 Objetos Disponíveis:', this.availableObjects);
    }

    setupModelShadows() {
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    centerAndScaleModel() {
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        this.model.position.sub(center);
        
        const scale = 1.0;
        this.model.scale.set(scale, scale, scale);
    }

    setupModelTextures() {
        const textureLoader = new THREE.TextureLoader();

        this.model.traverse((child) => {
            if (child.isMesh) {
                // Carrega textura para objetos específicos
                switch(child.name) {
                    case 'Roda':
                        const rodaTexture = textureLoader.load('/texturas/roda_textura.jpg');
                        child.material = new THREE.MeshStandardMaterial({ 
                            map: rodaTexture 
                        });
                        break;
                    
                    case 'Carroceria':
                        const carroceriaTexture = textureLoader.load('/texturas/carroceria_textura.png');
                        child.material = new THREE.MeshStandardMaterial({ 
                            map: carroceriaTexture,
                            roughness: 0.5,
                            metalness: 0.8
                        });
                        break;
                    
                    // Adicione mais casos conforme necessário
                    default:
                        if (!child.material.map) {
                            const genericTexture = textureLoader.load('/texturas/default_texture.jpg');
                            child.material = new THREE.MeshStandardMaterial({ 
                                map: genericTexture,
                                roughness: 0.5,
                                metalness: 0.5
                            });
                        }
                }
            }
        });
    }

    handleModelLoadError(error) {
        console.error('❌ Erro ao carregar modelo:', error);
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '20px';
        errorDiv.style.borderRadius = '10px';
        errorDiv.innerHTML = 'Erro ao carregar o modelo 3D.<br>Por favor, verifique o console para mais detalhes.';
        document.body.appendChild(errorDiv);
    }

    selectObjectByName(name) {
        if (!this.model) return;

        // Restaura a opacidade de todos os objetos
        this.model.traverse((child) => {
            if (child.isMesh) {
                if (child.material) {
                    child.material.opacity = 1;
                    child.material.transparent = false;
                }
            }
        });

        // Seleciona e destaca o objeto específico
        this.model.traverse((child) => {
            if (child.isMesh && child.name === name) {
                this.selectedObject = child;
                
                // Ajustar câmera para focar no objeto
                const boundingBox = new THREE.Box3().setFromObject(child);
                const center = boundingBox.getCenter(new THREE.Vector3());
                
                // Movimento suave da câmera
                const duration = 1000; // 1 segundo
                const startPosition = this.camera.position.clone();
                const startLookAt = this.controls.target.clone();
                
                const animate = (startTime) => {
                    const currentTime = performance.now();
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Interpolação suave
                    const newPosition = new THREE.Vector3().lerpVectors(
                        startPosition, 
                        center.clone().add(new THREE.Vector3(0, 2, 5)), 
                        progress
                    );
                    const newLookAt = new THREE.Vector3().lerpVectors(startLookAt, center, progress);
                    
                    this.camera.position.copy(newPosition);
                    this.controls.target.copy(newLookAt);
                    this.camera.lookAt(newLookAt);
                    
                    if (progress < 1) {
                        requestAnimationFrame((time) => animate(startTime));
                    }
                };
                
                // Inicia animação de movimento
                animate(performance.now());
                
                console.log(`🎯 Objeto selecionado: ${name}`);
                
                // Adiciona controles de interação
                this.addObjectInteractionControls();
            }
        });
    }

    addObjectInteractionControls() {
        if (!this.selectedObject) return;
    
        // Limpa controles anteriores
        this.selectorContainer.innerHTML = '';
    
        // Adiciona informações básicas do objeto
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `
            <h3>Detalhes do Objeto</h3>
            <p>Nome: ${this.selectedObject.name}</p>
            <p>Posição: (${this.selectedObject.position.x.toFixed(2)}, 
                        ${this.selectedObject.position.y.toFixed(2)}, 
                        ${this.selectedObject.position.z.toFixed(2)})</p>
        `;
        infoDiv.style.color = 'white';
        this.selectorContainer.appendChild(infoDiv);
    
        // Controles de visualização
        const viewControls = document.createElement('div');
        viewControls.innerHTML = '<h4>Controles de Visualização</h4>';
        
        // Botão de zoom
        const zoomButton = document.createElement('button');
        zoomButton.textContent = 'Zoom Objeto';
        zoomButton.style.margin = '5px';
        zoomButton.style.padding = '5px';
        zoomButton.style.backgroundColor = 'rgba(255,255,255,0.1)';
        zoomButton.style.color = 'white';
        
        zoomButton.addEventListener('click', () => {
            const boundingBox = new THREE.Box3().setFromObject(this.selectedObject);
            const center = boundingBox.getCenter(new THREE.Vector3());
            
            // Animação de zoom
            const duration = 1000;
            const startPosition = this.camera.position.clone();
            const startLookAt = this.controls.target.clone();
            
            const zoomAnimate = (startTime) => {
                const currentTime = performance.now();
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const zoomPosition = center.clone().add(new THREE.Vector3(0, 1, 2));
                const newPosition = new THREE.Vector3().lerpVectors(startPosition, zoomPosition, progress);
                const newLookAt = new THREE.Vector3().lerpVectors(startLookAt, center, progress);
                
                this.camera.position.copy(newPosition);
                this.controls.target.copy(newLookAt);
                this.camera.lookAt(newLookAt);
                
                if (progress < 1) {
                    requestAnimationFrame((time) => zoomAnimate(startTime));
                }
            };
            
            zoomAnimate(performance.now());
        });
        
        viewControls.appendChild(zoomButton);
    
        // Botão para voltar à lista de objetos
        const backButton = document.createElement('button');
        backButton.textContent = 'Voltar para Lista de Objetos';
        backButton.style.margin = '5px';
        backButton.style.padding = '5px';
        backButton.style.backgroundColor = 'rgba(0,255,0,0.1)';
        backButton.style.color = 'white';
        backButton.style.border = 'none';
        backButton.style.borderRadius = '3px';
        
        backButton.addEventListener('click', () => {
            // Reseta a câmera para a posição original
            this.camera.position.set(0, 2, 5);
            this.controls.target.set(0, 0, 0);
            
            // Volta a lista de objetos
            this.listAvailableObjects();
            
            // Limpa o objeto selecionado
            this.selectedObject = null;
        });
        
        viewControls.appendChild(backButton);
        this.selectorContainer.appendChild(viewControls);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    start() {
        this.loadModel('/models/carrinhotexturizado2.glb').then(() => {
            this.animate();
        });
    }
}

// Inicializar o visualizador
const carViewer = new CarModelViewer();
carViewer.start();