// H5实时同步应用
class LoveLink {
    constructor() {
        this.config = {
            password: '1314',
            storageKey: 'loveLink_'
        };
        
        this.roomCode = null;
        this.currentEmoji = '😊';
        this.moodPhotoData = null;
        this.database = null;
        this.storage = null;
        this.listeners = [];
        
        window.app = this;
        this.init();
    }
    
    async init() {
        // 初始化Firebase
        if (typeof firebase !== 'undefined' && firebase.apps.length) {
            this.database = firebase.database();
            this.storage = firebase.storage();
        } else {
            this.showToast('Firebase初始化失败');
            return;
        }
        
        // 隐藏加载屏幕
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
            this.checkAuth();
        }, 1500);
        
        // 初始化房间代码
        this.initRoomCode();
        
        // 加载配置
        this.loadConfig();
        
        // 添加PWA支持
        this.initPWA();
    }
    
    // 检查认证
    checkAuth() {
        const savedPassword = localStorage.getItem(this.config.storageKey + 'password');
        if (savedPassword === this.config.password) {
            this.startApp();
        } else {
            document.getElementById('authOverlay').classList.add('visible');
            document.getElementById('passwordInput').focus();
        }
    }
    
    // 验证密码
    checkPassword() {
        const input = document.getElementById('passwordInput').value;
        if (input === this.config.password) {
            localStorage.setItem(this.config.storageKey + 'password', input);
            document.getElementById('authOverlay').classList.remove('visible');
            this.startApp();
        } else {
            this.showToast('密码错误');
            document.getElementById('passwordInput').value = '';
        }
    }
    
    // 启动应用
    startApp() {
        // 首次使用检查
        const isFirstTime = !localStorage.getItem(this.config.storageKey + 'notFirst');
        if (isFirstTime) {
            this.showSettings();
            localStorage.setItem(this.config.storageKey + 'notFirst', 'true');
        }
        
        // 连接到房间
        if (this.roomCode) {
            this.connectToRoom(this.roomCode);
        }
        
        // 更新天数
        this.updateDaysCount();
        setInterval(() => this.updateDaysCount(), 60000);
    }
    
    // 初始化房间代码
    initRoomCode() {
        this.roomCode = localStorage.getItem(this.config.storageKey + 'roomCode');
        if (!this.roomCode) {
            this.roomCode = this.generateRoomCode();
            localStorage.setItem(this.config.storageKey + 'roomCode', this.roomCode);
        }
    }
    
    // 生成房间代码
    generateRoomCode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    // 连接到房间
    connectToRoom(code) {
        // 清除之前的监听
        this.clearListeners();
        
        this.roomCode = code;
        const roomRef = this.database.ref(`rooms/${code}`);
        
        // 监听配置
        const configListener = roomRef.child('config').on('value', (snapshot) => {
            const config = snapshot.val();
            if (config) {
                this.updateFromConfig(config);
            }
        });
        this.listeners.push({ ref: roomRef.child('config'), listener: configListener });
        
        // 监听照片
        const photosListener = roomRef.child('photos').on('value', (snapshot) => {
            const photos = snapshot.val();
            this.updatePhotos(photos);
        });
        this.listeners.push({ ref: roomRef.child('photos'), listener: photosListener });
        
        // 监听心情
        const moodsListener = roomRef.child('moods').on('value', (snapshot) => {
            const moods = snapshot.val();
            this.updateMoods(moods);
        });
        this.listeners.push({ ref: roomRef.child('moods'), listener: moodsListener });
        
        // 监听拥抱
        const hugsListener = roomRef.child('hugs').on('child_added', (snapshot) => {
            const hug = snapshot.val();
            if (hug && hug.timestamp > Date.now() - 5000 && hug.sender !== this.getCurrentName()) {
                this.receiveHug(hug);
            }
        });
        this.listeners.push({ ref: roomRef.child('hugs'), listener: hugsListener });
        
        this.updateSyncStatus('已连接');
    }
    
    // 清除监听器
    clearListeners() {
        this.listeners.forEach(({ ref, listener }) => {
            ref.off('value', listener);
        });
        this.listeners = [];
    }
    
    // 更新同步状态
    updateSyncStatus(text) {
        document.getElementById('syncText').textContent = text;
    }
    
    // 加载配置
    loadConfig() {
        const name1 = localStorage.getItem(this.config.storageKey + 'name1') || '你';
        const name2 = localStorage.getItem(this.config.storageKey + 'name2') || 'TA';
        const anniversary = localStorage.getItem(this.config.storageKey + 'anniversary');
        
        document.getElementById('name1').textContent = name1;
        document.getElementById('name2').textContent = name2;
        
        if (anniversary) {
            this.updateDaysCount();
        }
    }
    
    // 更新天数
    updateDaysCount() {
        const anniversary = localStorage.getItem(this.config.storageKey + 'anniversary');
        if (anniversary) {
            const start = new Date(anniversary);
            const now = new Date();
            const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
            document.getElementById('daysCount').textContent = days;
        }
    }
    
    // 处理照片上传
    async handlePhotos(event) {
        const files = Array.from(event.target.files);
        if (!files.length) return;
        
        this.showToast(`正在上传${files.length}张照片...`);
        
        for (let file of files) {
            await this.uploadPhoto(file);
        }
        
        event.target.value = '';
    }
    
    // 上传照片
    async uploadPhoto(file) {
        try {
            // 压缩图片
            const compressedFile = await this.compressImage(file);
            
            // 生成ID
            const photoId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // 上传到Storage
            const storageRef = this.storage.ref(`rooms/${this.roomCode}/photos/${photoId}`);
            const snapshot = await storageRef.put(compressedFile);
            const url = await snapshot.ref.getDownloadURL();
            
            // 保存到数据库
            await this.database.ref(`rooms/${this.roomCode}/photos/${photoId}`).set({
                url: url,
                timestamp: Date.now(),
                uploadedBy: this.getCurrentName()
            });
            
            this.showToast('照片上传成功');
        } catch (error) {
            console.error('上传失败:', error);
            this.showToast('上传失败，请重试');
        }
    }
    
    // 压缩图片
    compressImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxWidth = 1200;
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
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    }, 'image/jpeg', 0.85);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
    
    // 更新照片显示
    updatePhotos(photos) {
        const grid = document.getElementById('photoGrid');
        grid.innerHTML = '';
        
        if (!photos) return;
        
        const photoArray = Object.entries(photos)
            .map(([id, photo]) => ({ id, ...photo }))
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 12); // 显示最新12张
        
        photoArray.forEach(photo => {
            const item = document.createElement('div');
            item.className = 'photo-item';
            item.innerHTML = `
                <img src="${photo.url}" alt="照片" onclick="app.viewPhoto('${photo.url}')">
                <button class="photo-delete" onclick="app.deletePhoto('${photo.id}')">&times;</button>
            `;
            grid.appendChild(item);
        });
    }
    
    // 删除照片
    async deletePhoto(photoId) {
        if (!confirm('确定删除这张照片吗？')) return;
        
        try {
            await this.database.ref(`rooms/${this.roomCode}/photos/${photoId}`).remove();
            this.showToast('照片已删除');
        } catch (error) {
            this.showToast('删除失败');
        }
    }
    
    // 查看照片
    viewPhoto(url) {
        document.getElementById('viewerImg').src = url;
        document.getElementById('imageViewer').classList.add('visible');
    }
    
    // 关闭查看器
    closeViewer() {
        document.getElementById('imageViewer').classList.remove('visible');
    }
    
    // 显示心情输入
    showMoodInput() {
        const section = document.getElementById('moodSection');
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
        
        if (section.style.display === 'block') {
            document.getElementById('moodInput').focus();
        }
    }
    
    // 选择表情
    selectEmoji(element) {
        document.querySelectorAll('.mood-emoji').forEach(e => e.classList.remove('active'));
        element.classList.add('active');
        this.currentEmoji = element.dataset.emoji;
    }
    
    // 处理心情图片
    async handleMoodPhoto(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const compressed = await this.compressImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            this.moodPhotoData = e.target.result;
            this.showToast('图片已添加');
        };
        reader.readAsDataURL(compressed);
    }
    
    // 发送心情
    async sendMood() {
        const text = document.getElementById('moodInput').value.trim();
        if (!text) {
            this.showToast('请输入心情内容');
            return;
        }
        
        try {
            let photoUrl = null;
            
            // 上传图片
            if (this.moodPhotoData) {
                const moodId = Date.now() + '_mood';
                const blob = await fetch(this.moodPhotoData).then(r => r.blob());
                const file = new File([blob], 'mood.jpg', { type: 'image/jpeg' });
                
                const storageRef = this.storage.ref(`rooms/${this.roomCode}/moods/${moodId}`);
                const snapshot = await storageRef.put(file);
                photoUrl = await snapshot.ref.getDownloadURL();
            }
            
            // 保存心情
            const moodRef = this.database.ref(`rooms/${this.roomCode}/moods`).push();
            await moodRef.set({
                text: text,
                emoji: this.currentEmoji,
                photo: photoUrl,
                timestamp: Date.now(),
                author: this.getCurrentName()
            });
            
            // 清空输入
            document.getElementById('moodInput').value = '';
            this.moodPhotoData = null;
            document.getElementById('moodSection').style.display = 'none';
            
            this.showToast('心情已发送');
        } catch (error) {
            this.showToast('发送失败');
        }
    }
    
    // 更新心情显示
    updateMoods(moods) {
        const list = document.getElementById('moodList');
        list.innerHTML = '';
        
        if (!moods) return;
        
        const moodArray = Object.entries(moods)
            .map(([id, mood]) => ({ id, ...mood }))
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 20); // 显示最新20条
        
        moodArray.forEach(mood => {
            const item = document.createElement('div');
            item.className = 'mood-item';
            
            const date = new Date(mood.timestamp);
            const timeStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            item.innerHTML = `
                <div class="mood-header">
                    <span class="mood-avatar">${mood.emoji}</span>
                    <span class="mood-author">${mood.author}</span>
                    <span class="mood-time">${timeStr}</span>
                </div>
                <div class="mood-content">${mood.text}</div>
                ${mood.photo ? `<img class="mood-photo" src="${mood.photo}" onclick="app.viewPhoto('${mood.photo}')">` : ''}
            `;
            list.appendChild(item);
        });
    }
    
    // 发送拥抱
    async sendHug() {
        // 显示动画
        const wave = document.createElement('div');
        wave.className = 'hug-wave';
        document.body.appendChild(wave);
        
        setTimeout(() => wave.remove(), 2000);
        
        // 震动
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        
        // 发送到数据库
        try {
            await this.database.ref(`rooms/${this.roomCode}/hugs`).push({
                sender: this.getCurrentName(),
                timestamp: Date.now()
            });
            
            this.showToast('拥抱已送达 🤗');
        } catch (error) {
            console.error('发送拥抱失败:', error);
        }
    }
    
    // 接收拥抱
    receiveHug(hug) {
        this.showToast(`${hug.sender} 给你一个温暖的拥抱 🤗`);
        
        // 震动
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    }
    
    // 显示倒计时
    showCountdown() {
        // TODO: 实现倒计时功能
        this.showToast('倒计时功能开发中...');
    }
    
    // 切换标签
    switchTab(tab) {
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.nav-item').classList.add('active');
        
        // TODO: 切换内容显示
        this.showToast(`切换到${tab}`);
    }
    
    // 显示设置
    showSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.add('visible');
        
        // 填充当前值
        document.getElementById('settingName1').value = 
            localStorage.getItem(this.config.storageKey + 'name1') || '';
        document.getElementById('settingName2').value = 
            localStorage.getItem(this.config.storageKey + 'name2') || '';
        document.getElementById('settingAnniversary').value = 
            localStorage.getItem(this.config.storageKey + 'anniversary') || '';
        document.getElementById('roomCodeValue').textContent = this.roomCode;
    }
    
    // 关闭设置
    closeSettings() {
        document.getElementById('settingsModal').classList.remove('visible');
    }
    
    // 保存设置
    async saveSettings() {
        const name1 = document.getElementById('settingName1').value || '你';
        const name2 = document.getElementById('settingName2').value || 'TA';
        const anniversary = document.getElementById('settingAnniversary').value;
        const newRoomCode = document.getElementById('settingRoomCode').value.toUpperCase();
        
        // 保存到本地
        localStorage.setItem(this.config.storageKey + 'name1', name1);
        localStorage.setItem(this.config.storageKey + 'name2', name2);
        localStorage.setItem(this.config.storageKey + 'anniversary', anniversary);
        
        // 更新显示
        document.getElementById('name1').textContent = name1;
        document.getElementById('name2').textContent = name2;
        
        // 如果房间代码变了
        if (newRoomCode && newRoomCode.length === 6 && newRoomCode !== this.roomCode) {
            localStorage.setItem(this.config.storageKey + 'roomCode', newRoomCode);
            this.roomCode = newRoomCode;
            this.connectToRoom(newRoomCode);
        }
        
        // 同步到Firebase
        if (this.roomCode) {
            try {
                await this.database.ref(`rooms/${this.roomCode}/config`).update({
                    name1: name1,
                    name2: name2,
                    anniversary: anniversary,
                    updatedAt: Date.now()
                });
            } catch (error) {
                console.error('同步配置失败:', error);
            }
        }
        
        this.updateDaysCount();
        this.closeSettings();
        this.showToast('设置已保存');
    }
    
    // 从配置更新
    updateFromConfig(config) {
        if (config.name1) {
            localStorage.setItem(this.config.storageKey + 'name1', config.name1);
            document.getElementById('name1').textContent = config.name1;
        }
        if (config.name2) {
            localStorage.setItem(this.config.storageKey + 'name2', config.name2);
            document.getElementById('name2').textContent = config.name2;
        }
        if (config.anniversary) {
            localStorage.setItem(this.config.storageKey + 'anniversary', config.anniversary);
            this.updateDaysCount();
        }
    }
    
    // 获取当前用户名
    getCurrentName() {
        return localStorage.getItem(this.config.storageKey + 'name1') || '某人';
    }
    
    // 显示提示
    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }
    
    // 初始化PWA
    initPWA() {
        // 添加到主屏幕提示
        if ('standalone' in window.navigator && !window.navigator.standalone) {
            // iOS Safari
            if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                // 可以显示添加到主屏幕提示
            }
        }
        
        // Service Worker注册（如果有）
        if ('serviceWorker' in navigator) {
            // navigator.serviceWorker.register('/sw.js');
        }
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new LoveLink();
});

// 防止iOS橡皮筋效果
document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });