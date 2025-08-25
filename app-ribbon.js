// 时光纽带 - 无缝流动版
class RibbonFlow {
    constructor() {
        this.config = {
            password: '1314',
            storagePrefix: 'ribbon_flow_'
        };
        
        this.db = null;
        this.currentEmoji = '😊';
        this.isScrolling = false;
        
        this.init();
    }

    async init() {
        await this.initDB();
        this.bindEvents();
        this.initEffects();
        this.checkAuth();
    }

    // 初始化数据库
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('RibbonFlowDB', 1);
            
            request.onerror = () => reject();
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('photos')) {
                    db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('moods')) {
                    db.createObjectStore('moods', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    // 绑定事件
    bindEvents() {
        // 密码输入
        const passcode = document.getElementById('passcode');
        passcode.addEventListener('input', (e) => this.handlePasscode(e));
        passcode.addEventListener('focus', () => {
            document.querySelector('.passcode-glow').style.opacity = '0.5';
        });
        passcode.addEventListener('blur', () => {
            document.querySelector('.passcode-glow').style.opacity = '0';
        });

        // 初始设置
        document.getElementById('startBtn').addEventListener('click', () => this.saveSetup());

        // 小窝照片
        document.getElementById('homeImageArea').addEventListener('click', () => {
            document.getElementById('homeImageInput').click();
        });
        document.getElementById('homeImageInput').addEventListener('change', (e) => this.handleHomeImage(e));

        // 心情功能
        document.querySelectorAll('.emoji-bubble').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectEmoji(e));
        });
        document.getElementById('addMoodBtn').addEventListener('click', () => this.addMood());

        // 倒计时
        document.getElementById('meetDate').addEventListener('change', (e) => this.updateCountdown(e));

        // 拥抱
        document.getElementById('hugBtn').addEventListener('click', () => this.sendHug());

        // 照片
        document.getElementById('addPhotoBtn').addEventListener('click', () => {
            document.getElementById('photoInput').click();
        });
        document.getElementById('photoInput').addEventListener('change', (e) => this.handlePhotos(e));

        // 图片查看器
        document.getElementById('closeViewer').addEventListener('click', () => {
            document.getElementById('photoViewer').classList.add('hidden');
        });

        // 平滑滚动
        this.initSmoothScroll();
    }

    // 检查认证
    checkAuth() {
        const auth = localStorage.getItem(this.config.storagePrefix + 'auth');
        if (auth === 'true') {
            this.showMainRibbon();
        } else {
            // 自动聚焦密码输入
            setTimeout(() => {
                document.getElementById('passcode').focus();
            }, 500);
        }
    }

    // 处理密码
    handlePasscode(e) {
        const value = e.target.value;
        if (value.length === 4) {
            if (value === this.config.password) {
                this.authSuccess();
            } else {
                this.authFailed(e.target);
            }
        }
    }

    // 认证成功
    authSuccess() {
        localStorage.setItem(this.config.storagePrefix + 'auth', 'true');
        
        // 添加成功动画
        const authLayer = document.getElementById('authLayer');
        authLayer.style.animation = 'fadeOut 0.5s ease-out';
        
        setTimeout(() => {
            authLayer.classList.add('hidden');
            
            // 检查设置
            const setup = localStorage.getItem(this.config.storagePrefix + 'setup');
            if (!setup) {
                document.getElementById('setupLayer').classList.remove('hidden');
            } else {
                this.showMainRibbon();
            }
        }, 500);
    }

    // 认证失败
    authFailed(input) {
        const panel = document.querySelector('.glass-panel');
        panel.style.animation = 'shake 0.5s';
        
        setTimeout(() => {
            panel.style.animation = '';
            input.value = '';
            input.focus();
        }, 500);
    }

    // 保存设置
    saveSetup() {
        const setup = {
            name1: document.getElementById('name1').value || '宝贝',
            name2: document.getElementById('name2').value || '宝贝',
            anniversary: document.getElementById('anniversary').value || new Date().toISOString().split('T')[0]
        };
        
        localStorage.setItem(this.config.storagePrefix + 'setup', JSON.stringify(setup));
        
        document.getElementById('setupLayer').style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => {
            document.getElementById('setupLayer').classList.add('hidden');
            this.showMainRibbon();
        }, 500);
    }

    // 显示主界面
    showMainRibbon() {
        document.getElementById('authLayer').classList.add('hidden');
        document.getElementById('setupLayer').classList.add('hidden');
        document.getElementById('mainRibbon').classList.remove('hidden');
        
        // 应用设置
        const setup = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'setup') || '{}');
        document.getElementById('displayName1').textContent = setup.name1 || '宝贝';
        document.getElementById('displayName2').textContent = setup.name2 || '宝贝';
        
        if (setup.anniversary) {
            const date = new Date(setup.anniversary);
            document.getElementById('startDateDisplay').textContent = 
                `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
            
            const days = this.calculateDays(setup.anniversary);
            document.getElementById('daysCount').textContent = days;
        }
        
        // 加载数据
        this.loadData();
        
        // 初始化动画
        this.startAnimations();
        
        // 隐藏滚动指示器
        setTimeout(() => {
            document.querySelector('.scroll-indicator').style.display = 'none';
        }, 5000);
    }

    // 计算天数
    calculateDays(dateString) {
        const anniversary = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today - anniversary);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // 处理小窝照片
    handleHomeImage(event) {
        const file = event.target.files[0];
        if (file) {
            this.compressImage(file, 1024, (result) => {
                const img = document.getElementById('homeImage');
                img.src = result;
                img.classList.remove('hidden');
                document.querySelector('.upload-hint').style.display = 'none';
                
                // 保存
                const settings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'settings') || '{}');
                settings.homeImage = result;
                localStorage.setItem(this.config.storagePrefix + 'settings', JSON.stringify(settings));
            });
        }
    }

    // 选择表情
    selectEmoji(event) {
        document.querySelectorAll('.emoji-bubble').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        this.currentEmoji = event.target.textContent;
    }

    // 添加心情
    async addMood() {
        const text = document.getElementById('moodInput').value.trim();
        if (!text) return;
        
        const mood = {
            emoji: this.currentEmoji,
            text: text,
            date: new Date().toISOString()
        };
        
        // 保存到数据库
        const transaction = this.db.transaction(['moods'], 'readwrite');
        const store = transaction.objectStore('moods');
        await store.add(mood);
        
        // 清空输入
        document.getElementById('moodInput').value = '';
        
        // 刷新显示
        this.loadMoods();
        
        // 波纹效果
        this.createRipple();
    }

    // 加载心情
    async loadMoods() {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['moods'], 'readonly');
        const store = transaction.objectStore('moods');
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const moods = event.target.result;
            const flow = document.getElementById('moodFlow');
            flow.innerHTML = '';
            
            // 显示最近6条
            moods.sort((a, b) => new Date(b.date) - new Date(a.date));
            moods.slice(0, 6).forEach((mood, index) => {
                const bubble = document.createElement('div');
                bubble.className = 'mood-bubble';
                bubble.style.animationDelay = `${index * 0.5}s`;
                bubble.innerHTML = `
                    <span>${mood.emoji}</span>
                    <span>${mood.text}</span>
                `;
                flow.appendChild(bubble);
            });
        };
    }

    // 更新倒计时
    updateCountdown(event) {
        const date = event.target.value;
        if (date) {
            const targetDate = new Date(date);
            const today = new Date();
            const diffTime = targetDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            document.getElementById('countdownDays').textContent = diffDays > 0 ? diffDays : '0';
            
            // 更新环形进度
            const progress = Math.max(0, Math.min(1, (30 - diffDays) / 30));
            const circumference = 565.48;
            const offset = circumference * (1 - progress);
            document.getElementById('countdownRing').style.strokeDashoffset = offset;
            
            // 保存
            const settings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'settings') || '{}');
            settings.meetDate = date;
            localStorage.setItem(this.config.storagePrefix + 'settings', JSON.stringify(settings));
        }
    }

    // 发送拥抱
    sendHug() {
        const effect = document.getElementById('hugEffect');
        effect.classList.remove('hidden');
        
        setTimeout(() => {
            effect.classList.add('hidden');
        }, 3000);
    }

    // 处理照片
    async handlePhotos(event) {
        const files = Array.from(event.target.files);
        
        for (let file of files) {
            await this.savePhoto(file);
        }
        
        this.loadPhotos();
    }

    // 保存照片
    async savePhoto(file) {
        return new Promise((resolve) => {
            this.compressImage(file, 800, async (result) => {
                const photo = {
                    image: result,
                    date: new Date().toISOString()
                };
                
                const transaction = this.db.transaction(['photos'], 'readwrite');
                const store = transaction.objectStore('photos');
                await store.add(photo);
                resolve();
            });
        });
    }

    // 加载照片
    async loadPhotos() {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['photos'], 'readonly');
        const store = transaction.objectStore(['photos'], 'readonly');
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const photos = event.target.result;
            const galaxy = document.getElementById('galaxyContainer');
            
            // 保留添加按钮
            const addBtn = document.getElementById('addPhotoBtn');
            galaxy.innerHTML = '';
            galaxy.appendChild(addBtn);
            
            // 添加照片星星
            photos.forEach((photo, index) => {
                const star = document.createElement('div');
                star.className = 'photo-star';
                star.style.animationDelay = `${index * 0.3}s`;
                star.innerHTML = `<img src="${photo.image}" alt="照片">`;
                star.addEventListener('click', () => this.viewPhoto(photo.image));
                galaxy.appendChild(star);
            });
        };
    }

    // 查看照片
    viewPhoto(imageSrc) {
        const viewer = document.getElementById('photoViewer');
        const img = document.getElementById('viewerImage');
        img.src = imageSrc;
        viewer.classList.remove('hidden');
    }

    // 压缩图片
    compressImage(file, maxWidth, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    const reader = new FileReader();
                    reader.onload = (e) => callback(e.target.result);
                    reader.readAsDataURL(blob);
                }, 'image/jpeg', 0.85);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // 加载数据
    loadData() {
        const settings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'settings') || '{}');
        
        // 加载小窝照片
        if (settings.homeImage) {
            const img = document.getElementById('homeImage');
            img.src = settings.homeImage;
            img.classList.remove('hidden');
            document.querySelector('.upload-hint').style.display = 'none';
        }
        
        // 加载倒计时
        if (settings.meetDate) {
            document.getElementById('meetDate').value = settings.meetDate;
            this.updateCountdown({ target: { value: settings.meetDate } });
        }
        
        // 加载心情和照片
        this.loadMoods();
        this.loadPhotos();
        
        // 加载每日消息
        this.loadDailyMessage();
    }

    // 加载每日消息
    loadDailyMessage() {
        const messages = [
            '每一天都是礼物',
            '爱是最美的相遇',
            '陪伴是最长情的告白',
            '你是我的小确幸',
            '爱让平凡变得闪闪发光',
            '有你真好',
            '最好的时光是和你在一起',
            '爱是两个人的小世界',
            '你的笑容是我的阳光',
            '每个瞬间都值得珍藏',
            '爱是理解和包容',
            '最美的风景是你',
            '爱让生活充满色彩',
            '你是我的小宇宙',
            '爱是最温暖的陪伴'
        ];
        
        const today = new Date().getDate();
        const message = messages[today % messages.length];
        document.getElementById('dailyMessage').textContent = message;
    }

    // 初始化平滑滚动
    initSmoothScroll() {
        const container = document.getElementById('ribbonContainer');
        let isDown = false;
        let startX;
        let scrollLeft;
        
        container.addEventListener('mousedown', (e) => {
            isDown = true;
            container.style.cursor = 'grabbing';
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });
        
        container.addEventListener('mouseleave', () => {
            isDown = false;
            container.style.cursor = 'grab';
        });
        
        container.addEventListener('mouseup', () => {
            isDown = false;
            container.style.cursor = 'grab';
        });
        
        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });
        
        // 触摸滑动
        let touchStartX = 0;
        container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].pageX;
        });
        
        container.addEventListener('touchmove', (e) => {
            const touchEndX = e.touches[0].pageX;
            const diff = touchStartX - touchEndX;
            container.scrollLeft += diff;
            touchStartX = touchEndX;
        });
        
        // 滚动时的视差效果
        container.addEventListener('scroll', () => {
            if (!this.isScrolling) {
                window.requestAnimationFrame(() => {
                    this.updateParallax(container.scrollLeft);
                    this.isScrolling = false;
                });
                this.isScrolling = true;
            }
        });
    }

    // 更新视差
    updateParallax(scrollLeft) {
        const cards = document.querySelectorAll('.glass-card');
        cards.forEach(card => {
            const float = parseFloat(card.dataset.float || 1);
            const offset = scrollLeft * float * 0.1;
            card.style.transform = `translateX(${-offset}px)`;
        });
    }

    // 初始化特效
    initEffects() {
        // 添加CSS动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                20%, 40%, 60%, 80% { transform: translateX(10px); }
            }
        `;
        document.head.appendChild(style);
    }

    // 启动动画
    startAnimations() {
        // 卡片浮动动画
        const cards = document.querySelectorAll('.glass-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.5}s`;
        });
        
        // 光晕流动
        const glowPath = document.querySelector('.glow-path');
        if (glowPath) {
            glowPath.style.animation = 'glowFlow 20s linear infinite';
        }
    }

    // 创建波纹
    createRipple() {
        const button = document.getElementById('addMoodBtn');
        const ripple = button.querySelector('.ripple-effect');
        
        ripple.style.width = '300px';
        ripple.style.height = '300px';
        
        setTimeout(() => {
            ripple.style.width = '0';
            ripple.style.height = '0';
        }, 600);
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new RibbonFlow();
});