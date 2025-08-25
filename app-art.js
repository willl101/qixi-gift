// 时光纽带 - 艺术品级体验
class TimeRibbon {
    constructor() {
        this.config = {
            password: '1314',
            storagePrefix: 'time_ribbon_art_',
            maxPhotos: 50,
            maxPhotoSize: 2 * 1024 * 1024, // 2MB
        };
        
        this.db = null;
        this.currentMood = '😊';
        this.particles = [];
        
        this.init();
    }

    async init() {
        // 初始化数据库
        await this.initDatabase();
        
        // 初始化粒子动画
        this.initParticles();
        
        // 绑定事件
        this.bindEvents();
        
        // 延迟后隐藏开场动画
        setTimeout(() => {
            document.getElementById('splashScreen').classList.add('hidden');
            this.checkAuth();
        }, 2000);
    }

    // 初始化IndexedDB
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('TimeRibbonArtDB', 1);
            
            request.onerror = () => reject('Database failed to open');
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 照片存储
                if (!db.objectStoreNames.contains('photos')) {
                    const photoStore = db.createObjectStore('photos', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    photoStore.createIndex('date', 'date', { unique: false });
                }
                
                // 心情存储
                if (!db.objectStoreNames.contains('moods')) {
                    const moodStore = db.createObjectStore('moods', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    moodStore.createIndex('date', 'date', { unique: false });
                }
            };
        });
    }

    // 初始化粒子效果
    initParticles() {
        const canvas = document.getElementById('particleCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // 创建粒子
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
        
        // 动画循环
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            this.particles.forEach(particle => {
                // 更新位置
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // 边界检测
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
                
                // 绘制粒子
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
                ctx.fill();
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
        
        // 窗口调整
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    // 绑定事件
    bindEvents() {
        // 认证
        const authCode = document.getElementById('authCode');
        authCode?.addEventListener('input', (e) => this.handleAuth(e));
        
        // 设置
        document.getElementById('setupBtn')?.addEventListener('click', () => this.saveSetup());
        
        // 菜单
        document.getElementById('menuBtn')?.addEventListener('click', () => this.toggleMenu());
        document.getElementById('menuClose')?.addEventListener('click', () => this.closeMenu());
        document.getElementById('editSetup')?.addEventListener('click', () => this.editSetup());
        document.getElementById('clearData')?.addEventListener('click', () => this.clearData());
        
        // 小窝图片
        document.getElementById('homeImageBox')?.addEventListener('click', () => {
            document.getElementById('homeFile').click();
        });
        document.getElementById('homeFile')?.addEventListener('change', (e) => this.handleHomeImage(e));
        
        // 心情
        document.querySelectorAll('.mood-bubble').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectMood(e));
        });
        document.getElementById('moodSend')?.addEventListener('click', () => this.sendMood());
        
        // 倒计时
        document.getElementById('nextDate')?.addEventListener('change', (e) => this.updateCountdown(e));
        
        // 照片
        document.getElementById('photoAdd')?.addEventListener('click', () => {
            document.getElementById('photoFile').click();
        });
        document.getElementById('photoFile')?.addEventListener('change', (e) => this.handlePhotos(e));
        
        // 拥抱
        document.getElementById('hugButton')?.addEventListener('click', () => this.sendHug());
        
        // 图片查看器
        document.getElementById('viewerClose')?.addEventListener('click', () => {
            document.getElementById('imageViewer').classList.add('hidden');
        });
        
        // 平滑滚动
        this.initSmoothScroll();
    }

    // 检查认证
    checkAuth() {
        const isAuth = localStorage.getItem(this.config.storagePrefix + 'auth');
        
        if (isAuth === 'true') {
            this.checkSetup();
        } else {
            document.getElementById('authScreen').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('authCode').focus();
            }, 300);
        }
    }

    // 处理认证
    handleAuth(e) {
        const code = e.target.value;
        
        if (code.length === 4) {
            if (code === this.config.password) {
                // 认证成功
                localStorage.setItem(this.config.storagePrefix + 'auth', 'true');
                document.getElementById('authScreen').style.animation = 'fadeOut 0.5s ease-out';
                
                setTimeout(() => {
                    document.getElementById('authScreen').classList.add('hidden');
                    this.checkSetup();
                }, 500);
            } else {
                // 认证失败
                const feedback = document.getElementById('authFeedback');
                feedback.textContent = '密码错误';
                e.target.value = '';
                
                // 震动效果
                e.target.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    e.target.style.animation = '';
                    feedback.textContent = '';
                }, 500);
            }
        }
    }

    // 检查设置
    checkSetup() {
        const setup = localStorage.getItem(this.config.storagePrefix + 'setup');
        
        if (!setup) {
            // 预设信息
            const presetSetup = {
                name1: '段淦元',
                name2: '张琳曼',
                anniversary: '2024-04-13'
            };
            
            // 自动填充预设信息
            document.getElementById('setupName1').value = presetSetup.name1;
            document.getElementById('setupName2').value = presetSetup.name2;
            document.getElementById('setupDate').value = presetSetup.anniversary;
            
            // 自动保存并进入主页面
            localStorage.setItem(this.config.storagePrefix + 'setup', JSON.stringify(presetSetup));
            this.initMainCanvas(presetSetup);
        } else {
            this.initMainCanvas(JSON.parse(setup));
        }
    }

    // 保存设置
    saveSetup() {
        const setup = {
            name1: document.getElementById('setupName1').value || '宝贝',
            name2: document.getElementById('setupName2').value || '宝贝',
            anniversary: document.getElementById('setupDate').value || new Date().toISOString().split('T')[0]
        };
        
        localStorage.setItem(this.config.storagePrefix + 'setup', JSON.stringify(setup));
        
        // 动画过渡
        document.getElementById('setupScreen').style.animation = 'fadeOut 0.5s ease-out';
        
        setTimeout(() => {
            document.getElementById('setupScreen').classList.add('hidden');
            this.initMainCanvas(setup);
        }, 500);
    }

    // 初始化主画布
    initMainCanvas(setup) {
        document.getElementById('mainCanvas').classList.remove('hidden');
        
        // 更新显示
        document.getElementById('headerName1').textContent = setup.name1;
        document.getElementById('headerName2').textContent = setup.name2;
        
        // 计算天数
        const days = this.calculateDays(setup.anniversary);
        document.getElementById('headerDays').textContent = days;
        
        // 更新起始日期
        const date = new Date(setup.anniversary);
        const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
        document.getElementById('originDate').textContent = dateStr;
        
        // 加载数据
        this.loadData();
        
        // 初始化动画
        this.initAnimations();
        
        // 添加SVG渐变
        this.addSVGGradients();
    }

    // 计算天数
    calculateDays(anniversary) {
        const start = new Date(anniversary);
        const today = new Date();
        const diff = Math.abs(today - start);
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // 处理小窝图片
    handleHomeImage(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.size > this.config.maxPhotoSize) {
            alert('图片太大，请选择小于2MB的图片');
            return;
        }
        
        this.compressImage(file, 800, (result) => {
            const img = document.getElementById('homeImg');
            img.src = result;
            img.classList.remove('hidden');
            document.querySelector('.image-placeholder').style.display = 'none';
            
            // 保存
            const settings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'settings') || '{}');
            settings.homeImage = result;
            localStorage.setItem(this.config.storagePrefix + 'settings', JSON.stringify(settings));
        });
    }

    // 选择心情
    selectMood(event) {
        document.querySelectorAll('.mood-bubble').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        this.currentMood = event.target.textContent;
    }

    // 发送心情
    async sendMood() {
        const text = document.getElementById('moodText').value.trim();
        if (!text) return;
        
        const mood = {
            emoji: this.currentMood,
            text: text,
            date: new Date().toISOString()
        };
        
        // 保存到数据库
        const transaction = this.db.transaction(['moods'], 'readwrite');
        const store = transaction.objectStore('moods');
        await store.add(mood);
        
        // 清空输入
        document.getElementById('moodText').value = '';
        
        // 刷新显示
        this.loadMoods();
        
        // 动画反馈
        this.showFeedback('心情已记录');
    }

    // 加载心情
    async loadMoods() {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['moods'], 'readonly');
        const store = transaction.objectStore('moods');
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const moods = event.target.result;
            const container = document.getElementById('moodHistory');
            container.innerHTML = '';
            
            // 按时间倒序，显示最近5条
            moods.sort((a, b) => new Date(b.date) - new Date(a.date));
            moods.slice(0, 5).forEach(mood => {
                const item = this.createMoodItem(mood);
                container.appendChild(item);
            });
        };
    }

    // 创建心情项
    createMoodItem(mood) {
        const div = document.createElement('div');
        div.className = 'mood-item';
        
        const date = new Date(mood.date);
        const timeStr = this.formatTime(date);
        
        div.innerHTML = `
            <span class="mood-item-emoji">${mood.emoji}</span>
            <span class="mood-item-text">${mood.text}</span>
            <span class="mood-item-time">${timeStr}</span>
        `;
        
        return div;
    }

    // 格式化时间
    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    // 更新倒计时
    updateCountdown(event) {
        const targetDate = event.target.value;
        if (!targetDate) return;
        
        const target = new Date(targetDate);
        const today = new Date();
        const diff = target - today;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        // 更新显示
        document.getElementById('countNumber').textContent = days > 0 ? days : 0;
        
        // 更新进度环
        const progress = Math.max(0, Math.min(1, (30 - days) / 30));
        const circumference = 565.48;
        const offset = circumference * (1 - progress);
        document.getElementById('progressCircle').style.strokeDashoffset = offset;
        
        // 保存
        const settings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'settings') || '{}');
        settings.nextDate = targetDate;
        localStorage.setItem(this.config.storagePrefix + 'settings', JSON.stringify(settings));
    }

    // 处理照片上传
    async handlePhotos(event) {
        const files = Array.from(event.target.files);
        
        // 检查数量限制
        const count = await this.getPhotoCount();
        if (count + files.length > this.config.maxPhotos) {
            alert(`最多只能上传${this.config.maxPhotos}张照片`);
            return;
        }
        
        for (let file of files) {
            if (file.size > this.config.maxPhotoSize) {
                alert(`${file.name} 太大，跳过`);
                continue;
            }
            
            await this.savePhoto(file);
        }
        
        this.loadPhotos();
    }

    // 获取照片数量
    async getPhotoCount() {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['photos'], 'readonly');
            const store = transaction.objectStore('photos');
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
        });
    }

    // 保存照片
    async savePhoto(file) {
        return new Promise((resolve) => {
            this.compressImage(file, 600, async (result) => {
                const photo = {
                    image: result,
                    date: new Date().toISOString(),
                    name: file.name
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
        const store = transaction.objectStore('photos');
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const photos = event.target.result;
            const stream = document.getElementById('photoStream');
            
            // 保留添加按钮
            const addBtn = document.getElementById('photoAdd');
            stream.innerHTML = '';
            stream.appendChild(addBtn);
            
            // 添加照片
            photos.forEach(photo => {
                const item = this.createPhotoItem(photo);
                stream.appendChild(item);
            });
        };
    }

    // 创建照片项
    createPhotoItem(photo) {
        const div = document.createElement('div');
        div.className = 'photo-item';
        
        const img = document.createElement('img');
        img.src = photo.image;
        img.alt = photo.name || '照片';
        
        div.appendChild(img);
        
        // 点击查看大图
        div.addEventListener('click', () => this.viewPhoto(photo.image));
        
        return div;
    }

    // 查看照片
    viewPhoto(imageSrc) {
        const viewer = document.getElementById('imageViewer');
        const img = document.getElementById('viewerImg');
        
        img.src = imageSrc;
        viewer.classList.remove('hidden');
    }

    // 发送拥抱
    sendHug() {
        const overlay = document.getElementById('hugOverlay');
        overlay.classList.remove('hidden');
        
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 2500);
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
        
        // 加载小窝图片
        if (settings.homeImage) {
            const img = document.getElementById('homeImg');
            img.src = settings.homeImage;
            img.classList.remove('hidden');
            document.querySelector('.image-placeholder').style.display = 'none';
        }
        
        // 加载倒计时
        if (settings.nextDate) {
            document.getElementById('nextDate').value = settings.nextDate;
            this.updateCountdown({ target: { value: settings.nextDate } });
        }
        
        // 加载心情和照片
        this.loadMoods();
        this.loadPhotos();
        
        // 加载每日语录
        this.loadDailyQuote();
    }

    // 加载每日语录
    loadDailyQuote() {
        const quotes = [
            '家是有你的地方',
            '爱是最美的相遇',
            '陪伴是最长情的告白',
            '你是我的小确幸',
            '最好的时光是和你在一起',
            '爱让生活充满意义',
            '有你真好',
            '你的笑容是我的阳光',
            '爱是两个人的小世界',
            '最美的风景是你',
            '每个瞬间都值得珍藏',
            '爱是理解和包容',
            '你是我的全世界',
            '爱让平凡变得特别',
            '最幸福的事是有你'
        ];
        
        const today = new Date().getDate();
        const quote = quotes[today % quotes.length];
        document.getElementById('homeQuote').textContent = quote;
    }

    // 初始化平滑滚动
    initSmoothScroll() {
        // 自定义滚动行为
        const ribbon = document.getElementById('timeRibbon');
        if (!ribbon) return;
        
        let isScrolling = false;
        
        ribbon.addEventListener('wheel', (e) => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    ribbon.scrollTop += e.deltaY * 0.5;
                    isScrolling = false;
                });
                isScrolling = true;
            }
        });
    }

    // 初始化动画
    initAnimations() {
        // 监听滚动，添加视差效果
        const ribbon = document.getElementById('timeRibbon');
        if (!ribbon) return;
        
        ribbon.addEventListener('scroll', () => {
            const scrolled = ribbon.scrollTop;
            
            // 视差效果
            document.querySelectorAll('.ribbon-node').forEach((node, index) => {
                const speed = 0.5 + (index * 0.1);
                node.style.transform = `translateY(${scrolled * speed * 0.1}px)`;
            });
        });
    }

    // 添加SVG渐变
    addSVGGradients() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.width = '0';
        svg.style.height = '0';
        
        svg.innerHTML = `
            <defs>
                <linearGradient id="connectorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.3" />
                    <stop offset="50%" style="stop-color:#764ba2;stop-opacity:0.6" />
                    <stop offset="100%" style="stop-color:#667eea;stop-opacity:0.3" />
                </linearGradient>
            </defs>
        `;
        
        document.body.appendChild(svg);
    }

    // 显示反馈
    showFeedback(message) {
        // 创建反馈元素
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 16px 32px;
            border-radius: 16px;
            font-size: 16px;
            z-index: 10000;
            animation: fadeInOut 2s ease;
        `;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 2000);
    }

    // 菜单操作
    toggleMenu() {
        const panel = document.getElementById('menuPanel');
        panel.classList.toggle('hidden');
    }

    closeMenu() {
        document.getElementById('menuPanel').classList.add('hidden');
    }

    editSetup() {
        this.closeMenu();
        document.getElementById('setupScreen').classList.remove('hidden');
        
        // 加载当前设置
        const setup = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'setup') || '{}');
        document.getElementById('setupName1').value = setup.name1 || '';
        document.getElementById('setupName2').value = setup.name2 || '';
        document.getElementById('setupDate').value = setup.anniversary || '';
    }

    clearData() {
        if (confirm('确定要清除所有数据吗？')) {
            // 清除localStorage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.config.storagePrefix)) {
                    localStorage.removeItem(key);
                }
            });
            
            // 清除IndexedDB
            const transaction = this.db.transaction(['photos', 'moods'], 'readwrite');
            transaction.objectStore('photos').clear();
            transaction.objectStore('moods').clear();
            
            // 重新加载页面
            location.reload();
        }
    }
}

// 添加动画样式
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
    
    @keyframes fadeInOut {
        0% { opacity: 0; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.8); }
    }
`;
document.head.appendChild(style);

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new TimeRibbon();
});