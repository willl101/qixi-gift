// 时光纽带 - iOS风格极简版
class LoveRibbon {
    constructor() {
        this.config = {
            password: '1314',
            storageKeys: {
                auth: 'love_ribbon_auth',
                setup: 'love_ribbon_setup',
                moods: 'love_ribbon_moods',
                settings: 'love_ribbon_settings'
            }
        };
        
        this.db = null;
        this.currentEmoji = '😊';
        this.photos = [];
        
        this.init();
    }

    async init() {
        await this.initDB();
        this.bindEvents();
        this.checkAuth();
        this.initDailyTip();
        this.hideScrollIndicator();
    }

    // 初始化IndexedDB
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('LoveRibbonDB', 1);
            
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
        const passwordInput = document.getElementById('passwordInput');
        passwordInput.addEventListener('input', (e) => {
            if (e.target.value.length === 4) {
                this.validatePassword(e.target.value);
            }
        });

        // 初始设置
        document.getElementById('startBtn').addEventListener('click', () => this.saveSetup());

        // 设置按钮
        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.getElementById('setupOverlay').classList.remove('hidden');
        });

        // 小窝照片
        document.getElementById('homePhotoArea').addEventListener('click', () => {
            document.getElementById('homePhotoInput').click();
        });
        document.getElementById('homePhotoInput').addEventListener('change', (e) => this.handleHomePhoto(e));

        // 心情功能
        document.querySelectorAll('.emoji-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectEmoji(e));
        });
        document.getElementById('addMoodBtn').addEventListener('click', () => this.addMood());

        // 倒计时
        document.getElementById('meetDate').addEventListener('change', (e) => this.updateCountdown(e));

        // 拥抱按钮
        document.getElementById('hugBtn').addEventListener('click', () => this.sendHug());

        // 照片上传
        document.getElementById('addPhotoCard').addEventListener('click', () => {
            document.getElementById('photoInput').click();
        });
        document.getElementById('photoInput').addEventListener('change', (e) => this.handlePhotos(e));

        // 图片查看器
        document.getElementById('closeViewer').addEventListener('click', () => {
            document.getElementById('photoViewer').classList.add('hidden');
        });

        // 横向滑动优化
        const scrollContainer = document.getElementById('scrollContainer');
        let isDown = false;
        let startX;
        let scrollLeft;

        scrollContainer.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - scrollContainer.offsetLeft;
            scrollLeft = scrollContainer.scrollLeft;
        });

        scrollContainer.addEventListener('mouseleave', () => {
            isDown = false;
        });

        scrollContainer.addEventListener('mouseup', () => {
            isDown = false;
        });

        scrollContainer.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - scrollContainer.offsetLeft;
            const walk = (x - startX) * 2;
            scrollContainer.scrollLeft = scrollLeft - walk;
        });
    }

    // 检查认证
    checkAuth() {
        if (localStorage.getItem(this.config.storageKeys.auth) === 'true') {
            this.showMainContent();
        }
    }

    // 验证密码
    validatePassword(password) {
        if (password === this.config.password) {
            localStorage.setItem(this.config.storageKeys.auth, 'true');
            document.getElementById('authOverlay').classList.add('hidden');
            this.checkSetup();
        } else {
            document.getElementById('authError').textContent = '密码错误';
            document.getElementById('passwordInput').value = '';
            setTimeout(() => {
                document.getElementById('authError').textContent = '';
            }, 2000);
        }
    }

    // 检查初始设置
    checkSetup() {
        const setup = localStorage.getItem(this.config.storageKeys.setup);
        if (!setup) {
            document.getElementById('setupOverlay').classList.remove('hidden');
        } else {
            this.showMainContent();
        }
    }

    // 保存设置
    saveSetup() {
        const setup = {
            name1: document.getElementById('name1').value || '宝贝',
            name2: document.getElementById('name2').value || '宝贝',
            anniversary: document.getElementById('anniversary').value || new Date().toISOString().split('T')[0]
        };
        
        localStorage.setItem(this.config.storageKeys.setup, JSON.stringify(setup));
        document.getElementById('setupOverlay').classList.add('hidden');
        this.showMainContent();
    }

    // 显示主内容
    showMainContent() {
        document.getElementById('authOverlay').classList.add('hidden');
        document.getElementById('setupOverlay').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        
        // 应用设置
        const setup = JSON.parse(localStorage.getItem(this.config.storageKeys.setup) || '{}');
        document.getElementById('displayName1').textContent = setup.name1 || '宝贝';
        document.getElementById('displayName2').textContent = setup.name2 || '宝贝';
        
        // 计算天数
        if (setup.anniversary) {
            const days = this.calculateDays(setup.anniversary);
            document.getElementById('daysCount').textContent = days;
        }
        
        // 加载数据
        this.loadSettings();
        this.loadMoods();
        this.loadPhotos();
    }

    // 计算天数
    calculateDays(dateString) {
        const anniversary = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today - anniversary);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // 处理小窝照片
    handleHomePhoto(event) {
        const file = event.target.files[0];
        if (file) {
            this.compressImage(file, 800, (result) => {
                const img = document.getElementById('homePhoto');
                img.src = result;
                img.classList.remove('hidden');
                document.getElementById('homePlaceholder').style.display = 'none';
                
                // 保存设置
                const settings = JSON.parse(localStorage.getItem(this.config.storageKeys.settings) || '{}');
                settings.homePhoto = result;
                localStorage.setItem(this.config.storageKeys.settings, JSON.stringify(settings));
            });
        }
    }

    // 选择表情
    selectEmoji(event) {
        document.querySelectorAll('.emoji-option').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        this.currentEmoji = event.target.dataset.emoji;
    }

    // 添加心情
    async addMood() {
        const moodText = document.getElementById('moodInput').value.trim();
        if (!moodText) return;
        
        const mood = {
            text: moodText,
            emoji: this.currentEmoji,
            date: new Date().toISOString()
        };
        
        // 保存到IndexedDB
        const transaction = this.db.transaction(['moods'], 'readwrite');
        const store = transaction.objectStore('moods');
        await store.add(mood);
        
        // 清空输入
        document.getElementById('moodInput').value = '';
        
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
            const timeline = document.getElementById('moodTimeline');
            timeline.innerHTML = '';
            
            // 按时间倒序
            moods.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // 显示最近5条
            moods.slice(0, 5).forEach(mood => {
                const moodCard = this.createMoodCard(mood);
                timeline.appendChild(moodCard);
            });
        };
    }

    // 创建心情卡片
    createMoodCard(mood) {
        const card = document.createElement('div');
        card.className = 'mood-card';
        
        const date = new Date(mood.date);
        const timeStr = this.formatTime(date);
        
        card.innerHTML = `
            <div class="mood-emoji-display">${mood.emoji}</div>
            <div class="mood-content">
                <div class="mood-text">${mood.text}</div>
                <div class="mood-time">${timeStr}</div>
            </div>
        `;
        
        return card;
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
        return `${date.getMonth() + 1}月${date.getDate()}日`;
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
            
            // 保存设置
            const settings = JSON.parse(localStorage.getItem(this.config.storageKeys.settings) || '{}');
            settings.meetDate = date;
            localStorage.setItem(this.config.storageKeys.settings, JSON.stringify(settings));
        }
    }

    // 发送拥抱
    sendHug() {
        const animation = document.getElementById('hugAnimation');
        animation.classList.remove('hidden');
        
        setTimeout(() => {
            animation.classList.add('hidden');
        }, 2500);
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
            this.compressImage(file, 1024, async (result) => {
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
            this.photos = photos;
            
            // 更新网格照片
            this.updatePhotoGrid(photos.slice(0, 8));
            
            // 更新纽带照片流
            this.updatePhotoRibbon(photos);
        };
    }

    // 更新照片网格
    updatePhotoGrid(photos) {
        const grid = document.getElementById('photoGrid');
        
        // 保留添加按钮
        const addCard = document.getElementById('addPhotoCard');
        grid.innerHTML = '';
        grid.appendChild(addCard);
        
        photos.forEach(photo => {
            const item = document.createElement('div');
            item.className = 'photo-grid-item';
            item.innerHTML = `<img src="${photo.image}" alt="照片">`;
            item.addEventListener('click', () => this.viewPhoto(photo.image));
            grid.appendChild(item);
        });
    }

    // 更新纽带照片流
    updatePhotoRibbon(photos) {
        const ribbon = document.getElementById('photoRibbon');
        ribbon.innerHTML = '';
        
        photos.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'ribbon-photo';
            item.innerHTML = `<img src="${photo.image}" alt="照片">`;
            item.addEventListener('click', () => this.viewPhoto(photo.image));
            ribbon.appendChild(item);
        });
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

    // 加载设置
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem(this.config.storageKeys.settings) || '{}');
        
        if (settings.homePhoto) {
            const img = document.getElementById('homePhoto');
            img.src = settings.homePhoto;
            img.classList.remove('hidden');
            document.getElementById('homePlaceholder').style.display = 'none';
        }
        
        if (settings.meetDate) {
            document.getElementById('meetDate').value = settings.meetDate;
            this.updateCountdown({ target: { value: settings.meetDate } });
        }
    }

    // 每日提示
    initDailyTip() {
        const tips = [
            '爱是耐心，爱是善良',
            '最好的爱情，是两个人一起成长',
            '陪伴是最长情的告白',
            '爱情需要经营，更需要用心',
            '最浪漫的事，是和你一起慢慢变老',
            '有你的地方，就是家',
            '爱是包容，不是忍受',
            '最美好的爱情，是彼此成就',
            '相爱容易，相处难，珍惜眼前人',
            '爱情是两个人的事，需要共同努力',
            '真正的爱情经得起时间的考验',
            '爱情需要仪式感，生活需要小惊喜',
            '沟通是解决问题的最好方式',
            '爱是陪你度过每一个平凡的日子',
            '好的爱情，让你成为更好的自己',
            '爱是选择，更是坚持',
            '每一个今天，都是余生最年轻的一天',
            '爱情里最美的，是一起规划未来',
            '爱是行动，不只是语言',
            '最深的爱，是习惯了有你',
            '两个人的世界，需要两个人共同守护',
            '爱是责任，更是甜蜜的负担',
            '爱情不是找到完美的人，而是学会用完美的眼光看待不完美的人',
            '真正的爱情，是灵魂的相遇',
            '最好的爱情，是势均力敌的相爱',
            '相爱是运气，相守是本事',
            '爱情不是生活的全部，但是生活因爱情而完整',
            '最美的情话：有你真好',
            '爱情是一场修行，让我们成为更好的人'
        ];
        
        const today = new Date().getDate();
        const tipIndex = today % tips.length;
        document.getElementById('dailyTip').textContent = tips[tipIndex];
    }

    // 隐藏滑动指示器
    hideScrollIndicator() {
        setTimeout(() => {
            const indicator = document.getElementById('scrollIndicator');
            if (indicator) {
                indicator.style.display = 'none';
            }
        }, 5000);
    }

    // 显示反馈
    showFeedback(message) {
        // 创建临时提示
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 100px;
            font-size: 14px;
            z-index: 5000;
            animation: fadeInOut 2s ease;
        `;
        feedback.textContent = message;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 2000);
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new LoveRibbon();
});