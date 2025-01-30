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
            
            for (let i = 0; i <= this.totalFrames; i++) {
                const frameNumber = i.toString().padStart(4, '0');
                const imagePath = `./frames/animação1carrinhobrinqueco${frameNumber}.png`;
                this.images.push(imagePath);
            }

            await this.preloadInitialFrames(20);
            this.updateFrame();
            this.setupEventListeners();
            this.startAnimation();
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.loadingElement.textContent = 'Erro ao carregar imagens. Verifique se a pasta "frames" existe.';
        } finally {
            if (!this.preloadedImages.size) {
                this.loadingElement.style.display = 'block';
                this.loadingElement.innerHTML = 'Nenhuma imagem foi carregada. Verifique se:<br>' +
                    '1. A pasta "frames" existe<br>' +
                    '2. As imagens estão nomeadas corretamente<br>' +
                    '3. As imagens são arquivos PNG válidos';
            } else {
                this.loadingElement.style.display = 'none';
            }
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