// 时光纽带 - 天空与阳光的交响
class TimeFlow {
    constructor() {
        // 预设配置
        this.preset = {
            name1: '段淦元',
            name2: '张琳曼',
            anniversary: '2024-04-13',
            password: '1314'
        };
        
        this.config = {
            storageKey: 'time_flow_',
            maxPhotos: 100,
            maxPhotoSize: 2 * 1024 * 1024
        };
        
        this.db = null;
        this.currentMood = null;
        this.scrollPosition = 0;
        
        // 创建全局引用
        window.timeFlowInstance = this;
        
        this.init();
    }
    
    async init() {
        // 初始化数据库
        await this.initDatabase();
        
        // 开场动画后进入
        setTimeout(() => {
            document.getElementById('dawn').style.display = 'none';
            this.checkAuth();
        }, 3000);
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化滚动效果
        this.initScrollEffects();
        
        // 初始化数据同步功能
        this.initDataSync();
    }
    
    // 初始化IndexedDB
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('TimeFlowDB', 1);
            
            request.onerror = () => reject('Database failed');
            
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
    
    // 绑定事件
    bindEvents() {
        // 认证
        const authInput = document.getElementById('authCode');
        if (authInput) {
            authInput.addEventListener('input', (e) => this.handleAuth(e));
        }
        
        // 心情
        document.querySelectorAll('.mood-drop').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentMood = e.target.dataset.mood;
                this.animateMoodDrop(e.target);
                
                // 如果是拥抱，触发拥抱动画
                if (e.target.dataset.mood === 'hug') {
                    this.sendHug();
                }
            });
        });
        
        document.getElementById('moodText')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.saveMood();
            }
        });
        
        // 心情发送按钮
        document.getElementById('moodSend')?.addEventListener('click', () => {
            this.saveMood();
        });
        
        // 小窝照片
        document.getElementById('homePhoto')?.addEventListener('click', () => {
            document.getElementById('homeFile').click();
        });
        
        document.getElementById('homeFile')?.addEventListener('change', (e) => {
            this.handleHomePhoto(e);
        });
        
        // 删除小窝照片
        document.getElementById('homePhotoDelete')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteHomePhoto();
        });
        
        // 倒计时
        document.getElementById('nextDate')?.addEventListener('change', (e) => {
            this.updateCountdown(e.target.value);
        });
        
        // 照片流
        document.getElementById('photoAdd')?.addEventListener('click', () => {
            document.getElementById('photoFile').click();
        });
        
        document.getElementById('photoFile')?.addEventListener('change', (e) => {
            this.handlePhotos(e);
        });
        
        
        // 查看器
        document.getElementById('viewerClose')?.addEventListener('click', () => {
            document.getElementById('photoViewer').classList.add('hidden');
        });
        
        // 设置
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            document.getElementById('settingsPanel').classList.remove('hidden');
        });
        
        document.getElementById('closeSettings')?.addEventListener('click', () => {
            document.getElementById('settingsPanel').classList.add('hidden');
        });
        
        document.getElementById('clearBtn')?.addEventListener('click', () => {
            this.clearData();
        });
    }
    
    // 检查认证
    checkAuth() {
        const isAuth = localStorage.getItem(this.config.storageKey + 'auth');
        
        if (isAuth === 'true') {
            // 已认证，直接进入
            this.enterTimeRiver();
        } else {
            // 显示认证
            document.getElementById('auth').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('authCode').focus();
            }, 100);
        }
    }
    
    // 处理认证
    handleAuth(e) {
        const code = e.target.value;
        
        if (code.length === 4) {
            if (code === this.preset.password) {
                // 认证成功
                localStorage.setItem(this.config.storageKey + 'auth', 'true');
                
                // 淡出动画
                const authEl = document.getElementById('auth');
                authEl.style.animation = 'dawnFadeOut 0.5s ease forwards';
                
                setTimeout(() => {
                    authEl.classList.add('hidden');
                    this.enterTimeRiver();
                }, 500);
            } else {
                // 错误反馈
                e.target.style.animation = 'shake 0.5s ease';
                setTimeout(() => {
                    e.target.style.animation = '';
                    e.target.value = '';
                }, 500);
            }
        }
    }
    
    // 进入时光河流
    enterTimeRiver() {
        // 显示主界面
        document.getElementById('timeRiver').classList.remove('hidden');
        
        // 初始化数据
        this.initializeData();
        
        // 加载已有数据
        this.loadData();
        
        // 开始动画
        this.startAnimations();
    }
    
    // 初始化数据
    initializeData() {
        // 检查是否首次使用
        const setup = localStorage.getItem(this.config.storageKey + 'setup');
        
        if (!setup) {
            // 首次使用，保存预设信息
            const setupData = {
                name1: this.preset.name1,
                name2: this.preset.name2,
                anniversary: this.preset.anniversary
            };
            localStorage.setItem(this.config.storageKey + 'setup', JSON.stringify(setupData));
        }
        
        // 更新显示
        const data = JSON.parse(localStorage.getItem(this.config.storageKey + 'setup'));
        document.getElementById('name1').textContent = data.name1;
        document.getElementById('name2').textContent = data.name2;
        
        // 计算天数
        const days = this.calculateDays(data.anniversary);
        document.getElementById('dayCount').textContent = days;
        
        // 更新起始日期
        const date = new Date(data.anniversary);
        const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
        document.getElementById('originDate').textContent = dateStr;
    }
    
    // 计算天数
    calculateDays(anniversary) {
        const start = new Date(anniversary);
        const now = new Date();
        const diff = now - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    
    // 加载数据
    async loadData() {
        // 加载小窝照片
        const homeImage = localStorage.getItem(this.config.storageKey + 'homeImage');
        if (homeImage) {
            const img = document.getElementById('homeImg');
            const hint = document.querySelector('.photo-hint');
            const deleteBtn = document.getElementById('homePhotoDelete');
            
            img.src = homeImage;
            img.classList.remove('hidden');
            hint.style.display = 'none';
            deleteBtn.classList.remove('hidden');
        }
        
        // 加载倒计时
        const nextDate = localStorage.getItem(this.config.storageKey + 'nextDate');
        if (nextDate) {
            document.getElementById('nextDate').value = nextDate;
            this.updateCountdown(nextDate);
        } else {
            // 设置默认消息
            const messageEl = document.getElementById('meetingMessage');
            if (messageEl) {
                messageEl.querySelector('.message-text').textContent = '选择期待的日子，开始甜蜜倒计时';
            }
        }
        
        // 加载心情
        await this.loadMoods();
        
        // 加载照片
        await this.loadPhotos();
        
        // 加载每日语录
        this.updateDailyQuote();
    }
    
    // 更新每日语录
    updateDailyQuote() {
        const quotes = [
            '家是有你的地方',
            '阳光因你而灿烂',
            '时光因你而温柔',
            '每一天都是礼物',
            '爱是最美的风景',
            '你是我的小幸运',
            '陪伴是最长情的告白',
            '有你的地方就是家',
            '最美的时光是现在',
            '爱让平凡变得特别'
        ];
        
        const today = new Date().getDate();
        const quote = quotes[today % quotes.length];
        document.getElementById('dailyQuote').textContent = quote;
    }
    
    // 处理小窝照片
    handleHomePhoto(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            
            // 保存到localStorage
            localStorage.setItem(this.config.storageKey + 'homeImage', dataUrl);
            
            // 更新显示
            const img = document.getElementById('homeImg');
            const hint = document.querySelector('.photo-hint');
            const deleteBtn = document.getElementById('homePhotoDelete');
            
            img.src = dataUrl;
            img.classList.remove('hidden');
            hint.style.display = 'none';
            deleteBtn.classList.remove('hidden');
            
            // 清空文件输入，允许重新选择同一文件
            e.target.value = '';
            
            // 动画效果
            this.showFeedback('照片已更新');
        };
        reader.readAsDataURL(file);
    }
    
    // 删除小窝照片
    deleteHomePhoto() {
        // 删除localStorage中的图片
        localStorage.removeItem(this.config.storageKey + 'homeImage');
        
        // 重置UI
        const img = document.getElementById('homeImg');
        const hint = document.querySelector('.photo-hint');
        const deleteBtn = document.getElementById('homePhotoDelete');
        
        img.classList.add('hidden');
        img.src = '';
        hint.style.display = 'flex';
        deleteBtn.classList.add('hidden');
        
        this.showFeedback('照片已删除');
    }
    
    // 更新倒计时
    updateCountdown(date) {
        if (!date) return;
        
        localStorage.setItem(this.config.storageKey + 'nextDate', date);
        
        const target = new Date(date);
        const now = new Date();
        const diff = target - now;
        const messageEl = document.getElementById('meetingMessage');
        
        if (diff > 0) {
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            document.getElementById('countDays').textContent = days;
            
            // 更新期待消息
            const messages = [
                '每一天的等待都值得',
                '期待与你重逢的时刻',
                '倒数见面的美好日子',
                '想念在每个日夜蔓延',
                '距离让思念更珍贵'
            ];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            messageEl.querySelector('.message-text').textContent = randomMessage;
        } else if (diff > -86400000) { // 当天或前一天
            document.getElementById('countDays').textContent = '0';
            messageEl.querySelector('.message-text').textContent = '今天就是见面的日子！';
        } else {
            document.getElementById('countDays').textContent = '0';
            messageEl.querySelector('.message-text').textContent = '选择下次见面的日子吧';
        }
    }
    
    // 心情水滴动画
    animateMoodDrop(element) {
        // 创建涟漪
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            width: 100px;
            height: 100px;
            border: 2px solid rgba(135, 206, 235, 0.5);
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: rippleExpand 1s ease;
            pointer-events: none;
        `;
        
        document.getElementById('moodRipples').appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 1000);
    }
    
    // 保存心情
    async saveMood() {
        const text = document.getElementById('moodText').value.trim();
        if (!text && !this.currentMood) return;
        
        const mood = {
            emoji: this.getMoodEmoji(this.currentMood),
            text: text,
            date: new Date().toISOString()
        };
        
        // 保存到数据库
        if (this.db) {
            const transaction = this.db.transaction(['moods'], 'readwrite');
            const store = transaction.objectStore('moods');
            await store.add(mood);
        }
        
        // 清空输入
        document.getElementById('moodText').value = '';
        this.currentMood = null;
        
        // 重置心情按钮状态
        document.querySelectorAll('.mood-drop').forEach(btn => {
            btn.style.transform = '';
            btn.style.boxShadow = '';
        });
        
        // 更新显示
        this.loadMoods();
        this.showFeedback('心情已记录');
    }
    
    // 获取心情表情
    getMoodEmoji(mood) {
        const emojis = {
            happy: '😊',
            love: '💙',
            miss: '🌙',
            sunny: '☀️',
            hug: '🤗'
        };
        return emojis[mood] || '💭';
    }
    
    // 加载心情
    async loadMoods() {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['moods'], 'readonly');
        const store = transaction.objectStore('moods');
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const moods = event.target.result;
            const container = document.getElementById('moodRipples');
            
            // 显示最近3条
            const recent = moods.slice(-3);
            recent.forEach((mood, index) => {
                setTimeout(() => {
                    this.showMoodRipple(mood);
                }, index * 500);
            });
        };
    }
    
    // 显示心情涟漪
    showMoodRipple(mood) {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 20px;
            font-size: 12px;
            top: ${50 + Math.random() * 30 - 15}%;
            left: ${50 + Math.random() * 30 - 15}%;
            transform: translate(-50%, -50%);
            animation: fadeInOut 3s ease;
            pointer-events: none;
        `;
        ripple.textContent = mood.emoji + ' ' + mood.text;
        
        document.getElementById('moodRipples').appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 3000);
    }
    
    // 处理照片上传
    async handlePhotos(e) {
        const files = Array.from(e.target.files);
        
        for (let file of files) {
            if (file.size > this.config.maxPhotoSize) {
                this.showFeedback('照片太大，需要压缩');
                await this.compressAndSavePhoto(file);
            } else {
                await this.savePhoto(file);
            }
        }
        
        this.loadPhotos();
        this.showFeedback(`已添加 ${files.length} 张照片`);
    }
    
    // 压缩并保存照片
    async compressAndSavePhoto(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxWidth = 800;
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
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg'
                        });
                        this.savePhoto(compressedFile).then(resolve);
                    }, 'image/jpeg', 0.85);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
    
    // 保存照片
    async savePhoto(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const photo = {
                    data: e.target.result,
                    name: file.name,
                    date: new Date().toISOString()
                };
                
                const transaction = this.db.transaction(['photos'], 'readwrite');
                const store = transaction.objectStore('photos');
                await store.add(photo);
                resolve();
            };
            reader.readAsDataURL(file);
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
            const grid = document.getElementById('photoStream');
            
            // 清空网格
            grid.innerHTML = '';
            
            // 添加照片
            photos.forEach(photo => {
                const item = document.createElement('div');
                item.className = 'photo-item';
                item.innerHTML = `
                    <img src="${photo.data}" alt="${photo.name}">
                    <button class="photo-delete" onclick="event.stopPropagation(); timeFlowInstance.deletePhoto(${photo.id})">×</button>
                `;
                item.onclick = () => this.viewPhoto(photo.data);
                grid.appendChild(item);
            });
        };
    }
    
    // 删除照片
    async deletePhoto(photoId) {
        if (!this.db) return;
        
        if (confirm('确定要删除这张照片吗？')) {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            await store.delete(photoId);
            
            // 重新加载照片流
            this.loadPhotos();
            this.showFeedback('照片已删除');
        }
    }
    
    // 查看照片
    viewPhoto(src) {
        const viewer = document.getElementById('photoViewer');
        const img = document.getElementById('viewerImg');
        img.src = src;
        viewer.classList.remove('hidden');
    }
    
    // 发送拥抱
    sendHug() {
        const wave = document.getElementById('hugWave');
        wave.classList.remove('hidden');
        
        // 震动反馈
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        
        setTimeout(() => {
            wave.classList.add('hidden');
        }, 1500);
        
        this.showFeedback('温暖的拥抱已送达');
    }
    
    // 显示反馈
    showFeedback(message) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            color: #4A90E2;
            padding: 16px 32px;
            border-radius: 20px;
            font-size: 14px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            animation: fadeInOut 2s ease;
        `;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 2000);
    }
    
    // 初始化数据同步功能
    initDataSync() {
        // 添加同步按钮
        this.addSyncButtons();
        
        // 检查URL参数中的共享数据
        this.checkSharedData();
    }
    
    // 添加同步按钮
    addSyncButtons() {
        // 创建浮动按钮
        const syncBtn = document.createElement('button');
        syncBtn.innerHTML = '🔄';
        syncBtn.title = '数据同步';
        syncBtn.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            z-index: 1000;
            transition: transform 0.3s;
        `;
        
        syncBtn.onmouseover = () => {
            syncBtn.style.transform = 'scale(1.1)';
        };
        
        syncBtn.onmouseout = () => {
            syncBtn.style.transform = 'scale(1)';
        };
        
        syncBtn.onclick = () => this.showSyncMenu();
        
        document.body.appendChild(syncBtn);
    }
    
    // 显示同步菜单
    showSyncMenu() {
        const modal = document.createElement('div');
        modal.className = 'sync-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 20px;
            max-width: 400px;
            width: 90%;
        `;
        
        content.innerHTML = `
            <h2 style="color: #4A90E2; margin-bottom: 20px; text-align: center;">📱 数据同步</h2>
            <p style="color: #666; margin-bottom: 20px; font-size: 14px; text-align: center;">
                让另一半也能看到你的照片和心情 💕
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button id="exportDataBtn" style="
                    padding: 15px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 15px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: opacity 0.3s;
                " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                    📥 导出数据文件
                    <div style="font-size: 12px; margin-top: 5px; opacity: 0.9;">
                        保存所有照片和心情到文件
                    </div>
                </button>
                
                <button id="importDataBtn" style="
                    padding: 15px;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    border: none;
                    border-radius: 15px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: opacity 0.3s;
                " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                    📤 导入数据文件
                    <div style="font-size: 12px; margin-top: 5px; opacity: 0.9;">
                        从另一半发来的文件同步数据
                    </div>
                </button>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 10px 0;">
                
                <button id="closeSyncBtn" style="
                    padding: 12px;
                    background: #f0f0f0;
                    color: #666;
                    border: none;
                    border-radius: 15px;
                    cursor: pointer;
                    font-size: 14px;
                ">取消</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // 绑定事件
        document.getElementById('exportDataBtn').onclick = () => {
            this.exportData();
            modal.remove();
        };
        
        document.getElementById('importDataBtn').onclick = () => {
            this.importData();
            modal.remove();
        };
        
        document.getElementById('closeSyncBtn').onclick = () => {
            modal.remove();
        };
        
        // 点击背景关闭
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    }
    
    // 导出数据
    async exportData() {
        try {
            const data = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                exportBy: localStorage.getItem(this.config.storageKey + 'name1') || this.preset.name1,
                config: {
                    name1: localStorage.getItem(this.config.storageKey + 'name1') || this.preset.name1,
                    name2: localStorage.getItem(this.config.storageKey + 'name2') || this.preset.name2,
                    anniversary: localStorage.getItem(this.config.storageKey + 'anniversary') || this.preset.anniversary,
                    homeImage: localStorage.getItem(this.config.storageKey + 'homeImage'),
                    nextDate: localStorage.getItem(this.config.storageKey + 'nextDate')
                },
                photos: [],
                moods: []
            };
            
            // 导出照片
            if (this.db) {
                const photosTransaction = this.db.transaction(['photos'], 'readonly');
                const photosStore = photosTransaction.objectStore('photos');
                const photosRequest = photosStore.getAll();
                
                await new Promise((resolve) => {
                    photosRequest.onsuccess = (event) => {
                        data.photos = event.target.result;
                        resolve();
                    };
                });
                
                // 导出心情
                const moodsTransaction = this.db.transaction(['moods'], 'readonly');
                const moodsStore = moodsTransaction.objectStore('moods');
                const moodsRequest = moodsStore.getAll();
                
                await new Promise((resolve) => {
                    moodsRequest.onsuccess = (event) => {
                        data.moods = event.target.result;
                        resolve();
                    };
                });
            }
            
            // 生成文件名
            const date = new Date().toISOString().split('T')[0];
            const filename = `时光纽带-${date}.json`;
            
            // 创建下载链接
            const json = JSON.stringify(data);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showFeedback(`数据已导出！发送 ${filename} 给另一半即可同步`);
        } catch (error) {
            console.error('导出失败:', error);
            this.showFeedback('导出失败，请重试');
        }
    }
    
    // 导入数据
    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                // 验证数据格式
                if (!data.version || !data.config) {
                    throw new Error('无效的数据文件');
                }
                
                // 显示导入预览
                const confirmMsg = `
确认导入来自 ${data.exportBy || '未知'} 的数据？
导出时间：${new Date(data.exportDate).toLocaleString('zh-CN')}
包含：${data.photos.length} 张照片，${data.moods.length} 条心情

注意：导入将合并数据，不会删除现有内容`;
                
                if (!confirm(confirmMsg)) return;
                
                // 导入配置（可选）
                const importConfig = confirm('是否同时导入配置信息（姓名、纪念日等）？');
                if (importConfig && data.config) {
                    if (data.config.name1) localStorage.setItem(this.config.storageKey + 'name1', data.config.name1);
                    if (data.config.name2) localStorage.setItem(this.config.storageKey + 'name2', data.config.name2);
                    if (data.config.anniversary) localStorage.setItem(this.config.storageKey + 'anniversary', data.config.anniversary);
                    if (data.config.homeImage) localStorage.setItem(this.config.storageKey + 'homeImage', data.config.homeImage);
                    if (data.config.nextDate) localStorage.setItem(this.config.storageKey + 'nextDate', data.config.nextDate);
                }
                
                // 导入照片和心情
                let importedPhotos = 0;
                let importedMoods = 0;
                
                if (this.db) {
                    // 导入照片（避免重复）
                    if (data.photos && data.photos.length > 0) {
                        const photosTransaction = this.db.transaction(['photos'], 'readwrite');
                        const photosStore = photosTransaction.objectStore('photos');
                        
                        for (let photo of data.photos) {
                            try {
                                await photosStore.add(photo);
                                importedPhotos++;
                            } catch (e) {
                                // 忽略重复的照片
                                console.log('跳过重复照片');
                            }
                        }
                    }
                    
                    // 导入心情（避免重复）
                    if (data.moods && data.moods.length > 0) {
                        const moodsTransaction = this.db.transaction(['moods'], 'readwrite');
                        const moodsStore = moodsTransaction.objectStore('moods');
                        
                        for (let mood of data.moods) {
                            try {
                                await moodsStore.add(mood);
                                importedMoods++;
                            } catch (e) {
                                // 忽略重复的心情
                                console.log('跳过重复心情');
                            }
                        }
                    }
                }
                
                this.showFeedback(`成功导入 ${importedPhotos} 张照片，${importedMoods} 条心情！`);
                
                // 刷新显示
                setTimeout(() => {
                    this.loadPhotos();
                    this.loadMoods();
                    if (importConfig) {
                        location.reload();
                    }
                }, 1000);
                
            } catch (error) {
                console.error('导入失败:', error);
                this.showFeedback('导入失败：' + error.message);
            }
        };
        
        input.click();
    }
    
    // 检查URL中的共享数据
    checkSharedData() {
        // 预留功能：未来可通过URL参数快速共享配置
    }
    
    // 初始化滚动效果
    initScrollEffects() {
        const contentFlow = document.getElementById('contentFlow');
        if (!contentFlow) return;
        
        // 监听滚动
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = scrollTop / maxScroll;
            
            // 更新天空渐变
            this.updateSkyGradient(scrollPercent);
            
            // 视差效果
            this.updateParallax(scrollTop);
            
            lastScrollTop = scrollTop;
        });
    }
    
    // 更新天空渐变
    updateSkyGradient(percent) {
        const layers = document.querySelectorAll('.sky-layer');
        
        // 根据滚动位置显示不同的天空
        layers.forEach((layer, index) => {
            const start = index * 0.25;
            const end = (index + 1) * 0.25;
            
            if (percent >= start && percent <= end) {
                layer.style.opacity = '1';
            } else if (percent > end) {
                layer.style.opacity = '0';
            }
        });
    }
    
    // 更新视差效果
    updateParallax(scrollTop) {
        // 光流效果
        document.querySelectorAll('.light-stream').forEach((stream, index) => {
            const speed = 0.5 + index * 0.1;
            stream.style.transform = `translateX(${scrollTop * speed}px)`;
        });
        
        // 内容淡入
        document.querySelectorAll('.flow-section').forEach(section => {
            const rect = section.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            if (rect.top < windowHeight * 0.8 && rect.bottom > 0) {
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }
        });
    }
    
    // 开始动画
    startAnimations() {
        // 初始化所有section的状态
        document.querySelectorAll('.flow-section').forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'all 0.8s ease';
        });
        
        // 触发初始滚动检查
        window.dispatchEvent(new Event('scroll'));
    }
    
    // 清除数据
    clearData() {
        if (confirm('确定要清除所有数据吗？这将删除所有照片和记录。')) {
            // 清除localStorage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.config.storageKey)) {
                    localStorage.removeItem(key);
                }
            });
            
            // 清除IndexedDB
            if (this.db) {
                const transaction = this.db.transaction(['photos', 'moods'], 'readwrite');
                transaction.objectStore('photos').clear();
                transaction.objectStore('moods').clear();
            }
            
            // 重新加载页面
            location.reload();
        }
    }
}

// 添加必要的CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes fadeInOut {
        0% { opacity: 0; transform: scale(0.9); }
        50% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.9); }
    }
    
    @keyframes rippleExpand {
        from {
            width: 0;
            height: 0;
            opacity: 1;
        }
        to {
            width: 200px;
            height: 200px;
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new TimeFlow();
});