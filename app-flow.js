// 时光纽带 - 流动版
class TimeFlow {
    constructor() {
        this.config = {
            password: '1314',
            storagePrefix: 'time_flow_'
        };
        
        this.db = null;
        this.currentMood = '😊';
        
        this.init();
    }

    async init() {
        await this.initDB();
        this.bindEvents();
        this.initAuth();
        this.initAnimations();
    }

    // 初始化数据库
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('TimeFlowDB', 1);
            
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
        const passcodeInput = document.getElementById('passcodeInput');
        passcodeInput.addEventListener('input', (e) => this.handlePasscode(e));
        
        // 点击密码区域聚焦输入
        document.querySelector('.auth-modal').addEventListener('click', () => {
            passcodeInput.focus();
        });

        // 初始设置
        document.getElementById('beginBtn').addEventListener('click', () => this.saveSetup());

        // 设置按钮
        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.getElementById('setupScreen').classList.remove('hidden');
        });

        // 小窝照片
        document.getElementById('homeImageContainer').addEventListener('click', () => {
            document.getElementById('homeImageInput').click();
        });
        document.getElementById('homeImageInput').addEventListener('change', (e) => this.handleHomeImage(e));

        // 心情功能
        document.querySelectorAll('.mood-emoji').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectMood(e));
        });
        document.getElementById('saveMoodBtn').addEventListener('click', () => this.saveMood());

        // 倒计时
        document.getElementById('nextMeetDate').addEventListener('change', (e) => this.updateCountdown(e));

        // 拥抱
        document.getElementById('hugBtn').addEventListener('click', () => this.sendHug());

        // 照片上传
        document.getElementById('addPhotoBtn').addEventListener('click', () => {
            document.getElementById('photoUpload').click();
        });
        document.getElementById('photoUpload').addEventListener('change', (e) => this.handlePhotos(e));

        // 图片查看器
        document.getElementById('closeViewer').addEventListener('click', () => {
            document.getElementById('imageViewer').classList.add('hidden');
        });

        // 平滑滚动
        this.initSmoothScroll();
    }

    // 初始化认证
    initAuth() {
        // 自动聚焦密码输入
        setTimeout(() => {
            document.getElementById('passcodeInput').focus();
        }, 500);
    }

    // 处理密码输入
    handlePasscode(e) {
        const value = e.target.value;
        const dots = document.querySelectorAll('.dot');
        
        // 更新点的显示
        dots.forEach((dot, index) => {
            if (index < value.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
        
        // 检查密码
        if (value.length === 4) {
            if (value === this.config.password) {
                setTimeout(() => {
                    this.authSuccess();
                }, 300);
            } else {
                this.authFailed();
            }
        }
    }

    // 认证成功
    authSuccess() {
        localStorage.setItem(this.config.storagePrefix + 'auth', 'true');
        document.getElementById('authScreen').classList.add('hidden');
        
        // 检查是否需要初始设置
        const setup = localStorage.getItem(this.config.storagePrefix + 'setup');
        if (!setup) {
            document.getElementById('setupScreen').classList.remove('hidden');
        } else {
            this.showMainFlow();
        }
    }

    // 认证失败
    authFailed() {
        const input = document.getElementById('passcodeInput');
        const modal = document.querySelector('.auth-modal');
        
        // 震动效果
        modal.style.animation = 'shake 0.5s';
        setTimeout(() => {
            modal.style.animation = '';
        }, 500);
        
        // 清空输入
        input.value = '';
        document.querySelectorAll('.dot').forEach(dot => {
            dot.classList.remove('filled');
        });
        
        // 重新聚焦
        input.focus();
    }

    // 保存设置
    saveSetup() {
        const setup = {
            name1: document.getElementById('yourName').value || '宝贝',
            name2: document.getElementById('partnerName').value || '宝贝',
            anniversary: document.getElementById('anniversaryDate').value || new Date().toISOString().split('T')[0]
        };
        
        localStorage.setItem(this.config.storagePrefix + 'setup', JSON.stringify(setup));
        document.getElementById('setupScreen').classList.add('hidden');
        this.showMainFlow();
    }

    // 显示主界面
    showMainFlow() {
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('setupScreen').classList.add('hidden');
        document.getElementById('mainFlow').classList.remove('hidden');
        
        // 应用设置
        const setup = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'setup') || '{}');
        document.getElementById('name1Display').textContent = setup.name1 || '宝贝';
        document.getElementById('name2Display').textContent = setup.name2 || '宝贝';
        
        // 更新日期和天数
        if (setup.anniversary) {
            const date = new Date(setup.anniversary);
            document.getElementById('startDate').textContent = 
                `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
            
            const days = this.calculateDays(setup.anniversary);
            document.getElementById('daysNumber').textContent = days;
        }
        
        // 加载数据
        this.loadData();
        
        // 隐藏滚动提示
        setTimeout(() => {
            document.getElementById('scrollHint').style.display = 'none';
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
            this.compressImage(file, 800, (result) => {
                const img = document.getElementById('homeImage');
                img.src = result;
                img.classList.remove('hidden');
                document.querySelector('.image-placeholder').style.display = 'none';
                
                // 保存
                const settings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'settings') || '{}');
                settings.homeImage = result;
                localStorage.setItem(this.config.storagePrefix + 'settings', JSON.stringify(settings));
            });
        }
    }

    // 选择心情
    selectMood(event) {
        document.querySelectorAll('.mood-emoji').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        this.currentMood = event.target.textContent;
    }

    // 保存心情
    async saveMood() {
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
        this.showFeedback('心情已保存');
    }

    // 加载心情
    async loadMoods() {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['moods'], 'readonly');
        const store = transaction.objectStore('moods');
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const moods = event.target.result;
            const container = document.getElementById('recentMoods');
            container.innerHTML = '';
            
            // 显示最近3条
            moods.sort((a, b) => new Date(b.date) - new Date(a.date));
            moods.slice(0, 3).forEach(mood => {
                const item = document.createElement('div');
                item.className = 'mood-item';
                item.innerHTML = `
                    <span>${mood.emoji}</span>
                    <span>${mood.text}</span>
                `;
                container.appendChild(item);
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
            
            document.getElementById('countdownNum').textContent = diffDays > 0 ? diffDays : '0';
            
            // 更新进度环
            const progress = Math.max(0, Math.min(1, (30 - diffDays) / 30));
            const circumference = 339.292;
            const offset = circumference * (1 - progress);
            document.getElementById('progressRing').style.strokeDashoffset = offset;
            
            // 保存设置
            const settings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'settings') || '{}');
            settings.nextMeetDate = date;
            localStorage.setItem(this.config.storagePrefix + 'settings', JSON.stringify(settings));
        }
    }

    // 发送拥抱
    sendHug() {
        const overlay = document.getElementById('hugOverlay');
        overlay.classList.remove('hidden');
        
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 3000);
    }

    // 处理照片上传
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
        const store = transaction.objectStore('photos');
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const photos = event.target.result;
            const river = document.getElementById('photoRiver');
            
            // 保留添加按钮
            const addBtn = document.getElementById('addPhotoBtn');
            river.innerHTML = '';
            river.appendChild(addBtn);
            
            // 添加照片
            photos.forEach(photo => {
                const item = document.createElement('div');
                item.className = 'photo-float';
                item.innerHTML = `<img src="${photo.image}" alt="照片">`;
                item.addEventListener('click', () => this.viewPhoto(photo.image));
                river.appendChild(item);
            });
        };
    }

    // 查看照片
    viewPhoto(imageSrc) {
        const viewer = document.getElementById('imageViewer');
        const img = document.getElementById('viewerImg');
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
            document.querySelector('.image-placeholder').style.display = 'none';
        }
        
        // 加载倒计时
        if (settings.nextMeetDate) {
            document.getElementById('nextMeetDate').value = settings.nextMeetDate;
            this.updateCountdown({ target: { value: settings.nextMeetDate } });
        }
        
        // 加载心情和照片
        this.loadMoods();
        this.loadPhotos();
        
        // 加载每日一句
        this.loadDailyQuote();
    }

    // 加载每日一句
    loadDailyQuote() {
        const quotes = [
            '爱是耐心，爱是善良，爱永不止息',
            '最好的爱情，是两个人一起成为更好的自己',
            '陪伴是最长情的告白',
            '爱情不是寻找共同点，而是学会尊重差异',
            '真正的爱情，是即使相隔万里，心也在一起',
            '爱是一场美丽的相遇，更是一生的守护',
            '最浪漫的事，是和你一起慢慢变老',
            '爱情的意义，在于两个人一起成长',
            '有你的地方，就是我想去的远方',
            '爱是理解，是包容，是一起面对生活的勇气',
            '最美的爱情，是让彼此都变得更加完整',
            '爱情需要经营，但更需要真心',
            '两个人在一起，最重要的是舒服',
            '爱是选择，更是每天都选择继续爱',
            '最深的爱，是成为彼此的习惯',
            '爱情让平凡的日子闪闪发光',
            '真爱是看到你的不完美，依然觉得你完美',
            '爱是一起看世界，也是一起建造属于两人的世界',
            '最好的关系，是彼此成就',
            '爱情是一场修行，让我们成为更好的人'
        ];
        
        const today = new Date().getDate();
        const quote = quotes[today % quotes.length];
        document.getElementById('dailyQuote').textContent = quote;
    }

    // 初始化平滑滚动
    initSmoothScroll() {
        const timeFlow = document.getElementById('timeFlow');
        let isDown = false;
        let startX;
        let scrollLeft;
        
        timeFlow.addEventListener('mousedown', (e) => {
            isDown = true;
            timeFlow.style.cursor = 'grabbing';
            startX = e.pageX - timeFlow.offsetLeft;
            scrollLeft = timeFlow.scrollLeft;
        });
        
        timeFlow.addEventListener('mouseleave', () => {
            isDown = false;
            timeFlow.style.cursor = 'grab';
        });
        
        timeFlow.addEventListener('mouseup', () => {
            isDown = false;
            timeFlow.style.cursor = 'grab';
        });
        
        timeFlow.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - timeFlow.offsetLeft;
            const walk = (x - startX) * 2;
            timeFlow.scrollLeft = scrollLeft - walk;
        });
        
        // 触摸滑动优化
        let touchStartX = 0;
        timeFlow.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].pageX;
        });
        
        timeFlow.addEventListener('touchmove', (e) => {
            const touchEndX = e.touches[0].pageX;
            const diff = touchStartX - touchEndX;
            timeFlow.scrollLeft += diff * 0.5;
            touchStartX = touchEndX;
        });
    }

    // 初始化动画
    initAnimations() {
        // 视差滚动效果
        const timeFlow = document.getElementById('timeFlow');
        timeFlow.addEventListener('scroll', () => {
            const cards = document.querySelectorAll('.flow-card');
            cards.forEach(card => {
                const depth = parseFloat(card.dataset.depth || 1);
                const offset = timeFlow.scrollLeft * depth * 0.1;
                card.style.transform = `translateX(${-offset}px)`;
            });
        });
    }

    // 显示反馈
    showFeedback(message) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--gradient-primary);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 500;
            z-index: 5000;
            animation: fadeIn 0.3s ease;
        `;
        feedback.textContent = message;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(feedback);
            }, 300);
        }, 2000);
    }
}

// 添加震动动画
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// 添加渐变到SVG
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.style.width = '0';
svg.style.height = '0';
svg.innerHTML = `
    <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#007AFF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#5856D6;stop-opacity:1" />
        </linearGradient>
    </defs>
`;
document.body.appendChild(svg);

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new TimeFlow();
});