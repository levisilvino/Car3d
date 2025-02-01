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
        
        // Adiciona mapa de bounding boxes
        this.boundingBoxes = new Map();
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

    setupCollisionDetection() {
        console.log('🔍 Configurando Detecção de Colisão');
        this.boundingBoxes.clear();

        this.model.traverse((child) => {
            if (child.isMesh) {
                const box = new THREE.Box3().setFromObject(child);
                const size = new THREE.Vector3();
                box.getSize(size);

                this.boundingBoxes.set(child.name, {
                    box: box,
                    size: size,
                    originalPosition: child.position.clone()
                });

                console.log(`📦 Bounding Box para ${child.name}:
- Tamanho: (${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)})
- Posição Original: (${child.position.x.toFixed(2)}, ${child.position.y.toFixed(2)}, ${child.position.z.toFixed(2)})
                `);
            }
        });
    }

    checkCollision(objectName, newPosition) {
        const currentObjectData = this.boundingBoxes.get(objectName);
        if (!currentObjectData) return false;

        const newBox = currentObjectData.box.clone();
        const translation = newPosition.clone().sub(currentObjectData.originalPosition);
        newBox.translate(translation);

        for (const [name, data] of this.boundingBoxes.entries()) {
            if (name !== objectName && newBox.intersectsBox(data.box)) {
                console.warn(`🚫 Colisão detectada entre ${objectName} e ${name}`);
                return true;
            }
        }

        return false;
    }

    moveObjectWithCollisionCheck(objectName, axis, value) {
        const object = this.model.children.find(
            child => child.name === objectName && child.isMesh
        );

        if (!object) return;

        const movement = new THREE.Vector3();
        movement[axis] = value;

        const newPosition = object.position.clone().add(movement);

        if (!this.checkCollision(objectName, newPosition)) {
            object.position[axis] += value;
            console.log(`✅ Movimento de ${objectName} no eixo ${axis}: ${value}`);
        }
    }

    addObjectControls() {
        if (!this.selectedObject) return;

        // Limpa controles anteriores
        this.selectorContainer.innerHTML = '';

        ['x', 'y', 'z'].forEach(axis => {
            const positionSlider = document.createElement('input');
            positionSlider.type = 'range';
            positionSlider.min = '-2';
            positionSlider.max = '2';
            positionSlider.step = '0.1';
            positionSlider.value = this.selectedObject.position[axis];

            positionSlider.addEventListener('input', (e) => {
                if (this.selectedObject) {
                    this.moveObjectWithCollisionCheck(
                        this.selectedObject.name, 
                        axis, 
                        parseFloat(e.target.value) - this.selectedObject.position[axis]
                    );
                }
            });

            // Adiciona ao container de seleção
            const label = document.createElement('label');
            label.textContent = `${this.selectedObject.name} Position ${axis.toUpperCase()}:`;
            label.style.color = 'white';
            label.style.display = 'block';
            label.style.marginTop = '10px';

            this.selectorContainer.appendChild(label);
            this.selectorContainer.appendChild(positionSlider);
        });
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
            this.listAvailableObjects();
            this.setupCollisionDetection();
            
            this.scene.add(this.model);
            return this.model;
        } catch (error) {
            this.handleModelLoadError(error);
        }
    }

    debugModelStructure() {
        console.log('🚗 Estrutura Detalhada do Modelo:');
        let objectCount = 0;
        this.model.traverse((child) => {
            if (child.isMesh) {
                objectCount++;
                console.log(`
📦 Objeto #${objectCount}:
- Nome: ${child.name}
- Tipo de Geometria: ${child.geometry.type}
- Visível: ${child.visible}
- Possui Material: ${!!child.material}
- Posição: (${child.position.x.toFixed(2)}, ${child.position.y.toFixed(2)}, ${child.position.z.toFixed(2)})
                `);
            }
        });
        console.log(`🔢 Total de Objetos Encontrados: ${objectCount}`);
    }

    listAvailableObjects() {
        this.availableObjects = [];
        this.model.traverse((child) => {
            if (child.isMesh) {
                this.availableObjects.push(child.name);
                
                // Cria botão para cada objeto
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
                
                // Destacar objeto
                if (child.material) {
                    child.material.opacity = 0.7;
                    child.material.transparent = true;
                }
                
                // Ajustar câmera para focar no objeto
                const boundingBox = new THREE.Box3().setFromObject(child);
                const center = boundingBox.getCenter(new THREE.Vector3());
                
                this.controls.target.copy(center);
                this.camera.lookAt(center);
                
                console.log(`🎯 Objeto selecionado: ${name}`);
                
                // Adiciona controles de movimento
                this.addObjectControls();
            }
        });
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