class ImageSequence {
    constructor() {
        this.container = document.getElementById('sequence-container');
        this.loadingElement = document.getElementById('loading');
        this.currentFrame = 0;
        this.targetFrame = 0;
        this.images = [];
        this.totalFrames = 1000;
        this.preloadedImages = new Map();
        this.isLoading = false;
        this.velocity = 0;
        this.friction = 0.10;
        this.sensitivity = 0.5;
        this.isPlaying = false;
        this.autoPlaySpeed = 1;
        this.init();
    }

    async init() {
        try {
            this.loadingElement.style.display = 'block';
            
            // Tenta diferentes formatos de caminho
            const basePaths = [
                './frames/',
                '/frames/',
                'frames/',
                '../frames/'
            ];
            
            let validPath = '';
            
            // Testa qual caminho funciona
            for (const basePath of basePaths) {
                try {
                    const testImage = new Image();
                    const testPath = `${basePath}animação1carrinhobrinqueco0000.png`;
                    await new Promise((resolve, reject) => {
                        testImage.onload = resolve;
                        testImage.onerror = reject;
                        testImage.src = testPath;
                    });
                    validPath = basePath;
                    console.log(`✅ Caminho válido encontrado: ${validPath}`);
                    break;
                } catch (e) {
                    console.log(`⚠️ Caminho não funcionou: ${basePath}`);
                    continue;
                }
            }
            
            if (!validPath) {
                throw new Error('Nenhum caminho válido encontrado para as imagens');
            }

            // Gera os caminhos das imagens usando o caminho válido
            for (let i = 0; i <= this.totalFrames; i++) {
                const frameNumber = i.toString().padStart(4, '0');
                const imagePath = `${validPath}animação1carrinhobrinqueco${frameNumber}.png`;
                this.images.push(imagePath);
            }

            await this.preloadInitialFrames(20);
            this.updateFrame();
            this.setupEventListeners();
            this.startAnimation();
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.loadingElement.innerHTML = `
                Erro ao carregar imagens. Verifique se:<br>
                1. A pasta "frames" existe no servidor<br>
                2. As imagens estão nomeadas corretamente<br>
                3. As permissões de acesso estão corretas<br>
                <br>
                Detalhes técnicos: ${error.message}
            `;
            this.loadingElement.style.display = 'block';
        }
    }

    async preloadInitialFrames(count) {
        const initialFrames = this.images.slice(0, count);
        return Promise.all(initialFrames.map(src => 
            this.preloadImage(src).catch(err => {
                console.warn(`Erro ao carregar imagem ${src}:`, err);
                return null;
            })
        ));
    }

    preloadImage(src) {
        if (this.preloadedImages.has(src)) {
            return Promise.resolve(this.preloadedImages.get(src));
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.preloadedImages.set(src, img);
                resolve(img);
            };
            img.onerror = () => {
                reject(new Error(`Falha ao carregar: ${src}`));
            };
            img.src = src;
        });
    }

    async preloadNextFrames(currentFrame) {
        if (this.isLoading) return;
        this.isLoading = true;

        const preloadCount = 5;
        const start = currentFrame + 1;
        const end = Math.min(start + preloadCount, this.totalFrames);

        for (let i = start; i <= end; i++) {
            if (this.images[i]) {
                await this.preloadImage(this.images[i]).catch(() => {});
            }
        }

        this.isLoading = false;
    }

    setupEventListeners() {
        // Scroll com inércia
        window.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.velocity += e.deltaY * this.sensitivity;
            this.isPlaying = false;
        }, { passive: false });

        // Controles de teclado
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case ' ':
                    this.isPlaying = !this.isPlaying;
                    break;
                case 'ArrowRight':
                    this.velocity += 15;
                    this.isPlaying = false;
                    break;
                case 'ArrowLeft':
                    this.velocity -= 15;
                    this.isPlaying = false;
                    break;
            }
        });

        // Controle por arrasto do mouse
        let isDragging = false;
        let lastMouseX = 0;

        this.container.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMouseX = e.clientX;
            this.isPlaying = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const delta = e.clientX - lastMouseX;
                this.velocity -= delta * 0.5;
                lastMouseX = e.clientX;
            }
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Previne comportamento padrão do scroll
        window.addEventListener('scroll', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    startAnimation() {
        const animate = () => {
            if (this.isPlaying) {
                this.targetFrame += this.autoPlaySpeed;
                if (this.targetFrame >= this.totalFrames) {
                    this.targetFrame = 0;
                }
            } else {
                this.velocity *= this.friction;
                this.targetFrame += this.velocity;
            }

            this.targetFrame = Math.max(0, Math.min(this.targetFrame, this.totalFrames));
            this.currentFrame = Math.round(this.targetFrame);
            
            this.updateFrame();
            this.preloadNextFrames(this.currentFrame);
            
            requestAnimationFrame(animate);
        };

        animate();
    }

    updateFrame() {
        const currentImage = this.images[this.currentFrame];
        if (currentImage) {
            this.container.style.backgroundImage = `url(${currentImage})`;
            showInfoAtFrame(this.currentFrame);
        }
    }
}

// Inicializar quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new ImageSequence();
});