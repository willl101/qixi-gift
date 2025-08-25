// Firebase配置
const firebaseConfig = {
    apiKey: "AIzaSyDYkV5BH0uLR6FOheiHPVGTfgvRqtI_mxo",
    authDomain: "love-link-sync.firebaseapp.com",
    databaseURL: "https://love-link-sync-default-rtdb.firebaseio.com",
    projectId: "love-link-sync",
    storageBucket: "love-link-sync.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012"
};

// 初始化Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();

// 时光纽带应用类 - 实时同步版
class TimeFlowSync {
    constructor() {
        this.config = {
            maxPhotoSize: 5 * 1024 * 1024, // 5MB
            storageKey: 'timeFlow_',
            password: '1314'
        };
        
        this.preset = {
            name1: '段淦元',
            name2: '张琳曼',
            anniversary: '2024-04-13',
            password: '1314'
        };
        
        this.roomCode = null;
        this.currentMood = 'happy';
        this.moodPhotoData = null;
        this.listeners = [];
        
        window.timeFlowInstance = this;
        this.init();
    }
    
    async init() {
        // 开场动画
        setTimeout(() => {
            document.getElementById('dawn').style.display = 'none';
            this.checkAuth();
        }, 3000);
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化配置
        this.loadLocalConfig();
        
        // 检查房间代码
        this.checkRoomCode();
    }
    
    // 检查房间代码
    checkRoomCode() {
        this.roomCode = localStorage.getItem(this.config.storageKey + 'roomCode');
        
        if (this.roomCode) {
            // 连接到Firebase房间
            this.connectToRoom(this.roomCode);
            this.updateSyncStatus('已连接', '#4CAF50');
        } else {
            // 生成默认房间代码
            this.roomCode = this.generateRoomCode();
            localStorage.setItem(this.config.storageKey + 'roomCode', this.roomCode);
            this.connectToRoom(this.roomCode);
            this.showFeedback('已生成房间代码：' + this.roomCode);
        }
    }
    
    // 生成房间代码
    generateRoomCode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    // 连接到Firebase房间
    connectToRoom(code) {
        // 清除之前的监听器
        this.clearListeners();
        
        this.roomCode = code;
        const roomRef = database.ref(`rooms/${code}`);
        
        // 监听配置变化
        const configListener = roomRef.child('config').on('value', (snapshot) => {
            const config = snapshot.val();
            if (config) {
                this.updateConfigFromSync(config);
            }
        });
        this.listeners.push({ ref: roomRef.child('config'), listener: configListener });
        
        // 监听照片变化
        const photosListener = roomRef.child('photos').on('value', (snapshot) => {
            const photos = snapshot.val();
            this.updatePhotosFromSync(photos);
        });
        this.listeners.push({ ref: roomRef.child('photos'), listener: photosListener });
        
        // 监听心情变化
        const moodsListener = roomRef.child('moods').on('value', (snapshot) => {
            const moods = snapshot.val();
            this.updateMoodsFromSync(moods);
        });
        this.listeners.push({ ref: roomRef.child('moods'), listener: moodsListener });
        
        // 监听小窝照片
        const homePhotoListener = roomRef.child('homePhoto').on('value', (snapshot) => {
            const homePhoto = snapshot.val();
            if (homePhoto) {
                this.updateHomePhotoFromSync(homePhoto);
            }
        });
        this.listeners.push({ ref: roomRef.child('homePhoto'), listener: homePhotoListener });
        
        // 监听拥抱事件
        const hugsListener = roomRef.child('hugs').on('child_added', (snapshot) => {
            const hug = snapshot.val();
            if (hug && hug.timestamp > Date.now() - 5000) {
                this.receiveHug(hug);
            }
        });
        this.listeners.push({ ref: roomRef.child('hugs'), listener: hugsListener });
    }
    
    // 清除监听器
    clearListeners() {
        this.listeners.forEach(({ ref, listener }) => {
            ref.off('value', listener);
        });
        this.listeners = [];
    }
    
    // 更新同步状态
    updateSyncStatus(text, color = '#4A90E2') {
        const syncText = document.getElementById('syncText');
        const syncIcon = document.querySelector('.sync-icon');
        if (syncText) {
            syncText.textContent = text;
            syncText.style.color = color;
        }
        if (syncIcon) {
            syncIcon.style.animation = 'spin 1s linear';
            setTimeout(() => {
                syncIcon.style.animation = '';
            }, 1000);
        }
    }
    
    // 从同步更新配置
    updateConfigFromSync(config) {
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
            this.updateDaysCount(config.anniversary);
        }
        if (config.nextDate) {
            localStorage.setItem(this.config.storageKey + 'nextDate', config.nextDate);
            document.getElementById('nextDateInput').value = config.nextDate;
            this.updateCountdown(config.nextDate);
        }
    }
    
    // 从同步更新照片
    updatePhotosFromSync(photos) {
        const grid = document.getElementById('photoStream');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (photos) {
            // 转换为数组并排序
            const photoArray = Object.entries(photos)
                .map(([id, photo]) => ({ id, ...photo }))
                .sort((a, b) => b.timestamp - a.timestamp);
            
            photoArray.forEach(photo => {
                const item = document.createElement('div');
                item.className = 'photo-item';
                item.innerHTML = `
                    <img src="${photo.url}" alt="照片" onclick="window.timeFlowInstance.viewPhoto('${photo.url}')">
                    <button class="delete-photo" onclick="window.timeFlowInstance.deletePhoto('${photo.id}')">&times;</button>
                `;
                grid.appendChild(item);
            });
            
            // 更新存储信息
            const sizeInMB = (photoArray.length * 0.5).toFixed(1); // 估算
            document.getElementById('storageUsed').textContent = `已使用: ${sizeInMB} MB`;
        }
        
        this.updateSyncStatus('照片已同步', '#4CAF50');
    }
    
    // 从同步更新心情
    updateMoodsFromSync(moods) {
        const timeline = document.getElementById('moodTimeline');
        if (!timeline) return;
        
        timeline.innerHTML = '';
        
        if (moods) {
            // 转换为数组并排序
            const moodArray = Object.entries(moods)
                .map(([id, mood]) => ({ id, ...mood }))
                .sort((a, b) => b.timestamp - a.timestamp);
            
            moodArray.forEach(mood => {
                const item = document.createElement('div');
                item.className = 'mood-item';
                
                const date = new Date(mood.timestamp);
                const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                
                item.innerHTML = `
                    <div class="mood-header">
                        <span class="mood-emoji">${mood.emoji}</span>
                        <span class="mood-author">${mood.author}</span>
                        <span class="mood-time">${dateStr}</span>
                    </div>
                    <div class="mood-content">${mood.text}</div>
                    ${mood.photo ? `<img src="${mood.photo}" class="mood-photo" onclick="window.timeFlowInstance.viewPhoto('${mood.photo}')">` : ''}
                `;
                timeline.appendChild(item);
            });
        }
        
        this.updateSyncStatus('心情已同步', '#4CAF50');
    }
    
    // 从同步更新小窝照片
    updateHomePhotoFromSync(photoUrl) {
        const img = document.getElementById('homeImg');
        const hint = document.querySelector('.photo-hint');
        const deleteBtn = document.getElementById('homePhotoDelete');
        
        if (photoUrl) {
            img.src = photoUrl;
            img.classList.remove('hidden');
            hint.style.display = 'none';
            deleteBtn.classList.remove('hidden');
        }
    }
    
    // 接收拥抱
    receiveHug(hug) {
        if (hug.sender !== localStorage.getItem(this.config.storageKey + 'name1')) {
            this.showFeedback(`${hug.sender} 给你发送了一个温暖的拥抱 🤗`);
            
            // 震动反馈
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        }
    }
    
    // 绑定事件
    bindEvents() {
        // 密码输入
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkPassword();
                }
            });
        }
        
        // 照片上传
        document.getElementById('photoInput')?.addEventListener('change', (e) => {
            this.handlePhotos(e);
        });
        
        // 小窝照片
        document.getElementById('homePhotoArea')?.addEventListener('click', () => {
            document.getElementById('homePhotoInput').click();
        });
        
        document.getElementById('homePhotoInput')?.addEventListener('change', (e) => {
            this.uploadHomePhoto(e.target.files[0]);
        });
        
        // 倒计时日期
        document.getElementById('nextDateInput')?.addEventListener('change', (e) => {
            this.updateCountdown(e.target.value);
            this.syncConfig({ nextDate: e.target.value });
        });
        
        // 心情按钮
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMood = btn.dataset.mood;
            });
        });
        
        // 心情图片
        document.getElementById('moodPhotoInput')?.addEventListener('change', (e) => {
            this.handleMoodPhoto(e.target.files[0]);
        });
        
        // 设置房间代码
        document.getElementById('roomCode')?.addEventListener('change', (e) => {
            const code = e.target.value.toUpperCase();
            if (code.length === 6) {
                this.roomCode = code;
                localStorage.setItem(this.config.storageKey + 'roomCode', code);
                this.connectToRoom(code);
                this.showFeedback('已连接到房间：' + code);
            }
        });
    }
    
    // 处理照片上传
    async handlePhotos(e) {
        const files = Array.from(e.target.files);
        
        for (let file of files) {
            await this.uploadPhoto(file);
        }
        
        this.showFeedback(`正在上传 ${files.length} 张照片...`);
    }
    
    // 上传照片到Firebase
    async uploadPhoto(file) {
        try {
            // 压缩图片
            const compressedFile = await this.compressImage(file);
            
            // 生成唯一ID
            const photoId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // 上传到Firebase Storage
            const storageRef = storage.ref(`rooms/${this.roomCode}/photos/${photoId}`);
            const snapshot = await storageRef.put(compressedFile);
            const url = await snapshot.ref.getDownloadURL();
            
            // 保存到数据库
            await database.ref(`rooms/${this.roomCode}/photos/${photoId}`).set({
                url: url,
                name: file.name,
                timestamp: Date.now(),
                uploadedBy: localStorage.getItem(this.config.storageKey + 'name1') || 'Someone'
            });
            
            this.updateSyncStatus('照片上传成功', '#4CAF50');
        } catch (error) {
            console.error('上传失败:', error);
            this.showFeedback('照片上传失败，请重试');
        }
    }
    
    // 上传小窝照片
    async uploadHomePhoto(file) {
        if (!file) return;
        
        try {
            const compressedFile = await this.compressImage(file);
            
            // 上传到Firebase Storage
            const storageRef = storage.ref(`rooms/${this.roomCode}/home/photo`);
            const snapshot = await storageRef.put(compressedFile);
            const url = await snapshot.ref.getDownloadURL();
            
            // 保存到数据库
            await database.ref(`rooms/${this.roomCode}/homePhoto`).set(url);
            
            this.showFeedback('小窝照片已更新');
        } catch (error) {
            console.error('上传失败:', error);
            this.showFeedback('上传失败，请重试');
        }
    }
    
    // 删除小窝照片
    async deleteHomePhoto() {
        try {
            await database.ref(`rooms/${this.roomCode}/homePhoto`).remove();
            
            const img = document.getElementById('homeImg');
            const hint = document.querySelector('.photo-hint');
            const deleteBtn = document.getElementById('homePhotoDelete');
            
            img.classList.add('hidden');
            img.src = '';
            hint.style.display = 'flex';
            deleteBtn.classList.add('hidden');
            
            this.showFeedback('照片已删除');
        } catch (error) {
            console.error('删除失败:', error);
        }
    }
    
    // 删除照片
    async deletePhoto(photoId) {
        try {
            await database.ref(`rooms/${this.roomCode}/photos/${photoId}`).remove();
            this.showFeedback('照片已删除');
        } catch (error) {
            console.error('删除失败:', error);
        }
    }
    
    // 压缩图片
    async compressImage(file) {
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
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg'
                        });
                        resolve(compressedFile);
                    }, 'image/jpeg', 0.8);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
    
    // 处理心情图片
    async handleMoodPhoto(file) {
        if (!file) return;
        
        const compressedFile = await this.compressImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            this.moodPhotoData = e.target.result;
            const preview = document.getElementById('moodPhotoPreview');
            preview.src = e.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(compressedFile);
    }
    
    // 发送心情
    async sendMood() {
        const text = document.getElementById('moodText').value.trim();
        if (!text) {
            this.showFeedback('请输入心情内容');
            return;
        }
        
        const moodEmojis = {
            happy: '😊',
            love: '💙',
            miss: '🌙',
            tired: '😔',
            excited: '🎉',
            grateful: '🙏',
            peaceful: '☁️',
            hopeful: '⭐'
        };
        
        try {
            let photoUrl = null;
            
            // 如果有图片，先上传
            if (this.moodPhotoData) {
                const moodId = Date.now() + '_mood';
                const blob = await fetch(this.moodPhotoData).then(r => r.blob());
                const file = new File([blob], 'mood.jpg', { type: 'image/jpeg' });
                
                const storageRef = storage.ref(`rooms/${this.roomCode}/moods/${moodId}`);
                const snapshot = await storageRef.put(file);
                photoUrl = await snapshot.ref.getDownloadURL();
            }
            
            // 保存心情到数据库
            const moodId = database.ref(`rooms/${this.roomCode}/moods`).push().key;
            await database.ref(`rooms/${this.roomCode}/moods/${moodId}`).set({
                text: text,
                emoji: moodEmojis[this.currentMood],
                photo: photoUrl,
                timestamp: Date.now(),
                author: localStorage.getItem(this.config.storageKey + 'name1') || 'Someone'
            });
            
            // 清空输入
            document.getElementById('moodText').value = '';
            document.getElementById('moodPhotoPreview').classList.add('hidden');
            this.moodPhotoData = null;
            
            this.showFeedback('心情已发送');
        } catch (error) {
            console.error('发送失败:', error);
            this.showFeedback('发送失败，请重试');
        }
    }
    
    // 发送拥抱
    async sendHug() {
        const wave = document.getElementById('hugWave');
        wave.classList.remove('hidden');
        
        // 震动反馈
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        
        setTimeout(() => {
            wave.classList.add('hidden');
        }, 2000);
        
        // 发送到Firebase
        try {
            await database.ref(`rooms/${this.roomCode}/hugs`).push({
                sender: localStorage.getItem(this.config.storageKey + 'name1') || 'Someone',
                timestamp: Date.now()
            });
            
            this.showFeedback('温暖的拥抱已送达');
        } catch (error) {
            console.error('发送失败:', error);
        }
    }
    
    // 同步配置
    async syncConfig(updates) {
        try {
            await database.ref(`rooms/${this.roomCode}/config`).update(updates);
        } catch (error) {
            console.error('同步配置失败:', error);
        }
    }
    
    // 加载本地配置
    loadLocalConfig() {
        // 加载姓名
        const name1 = localStorage.getItem(this.config.storageKey + 'name1') || this.preset.name1;
        const name2 = localStorage.getItem(this.config.storageKey + 'name2') || this.preset.name2;
        document.getElementById('name1').textContent = name1;
        document.getElementById('name2').textContent = name2;
        
        // 加载纪念日
        const anniversary = localStorage.getItem(this.config.storageKey + 'anniversary') || this.preset.anniversary;
        this.updateDaysCount(anniversary);
        
        // 加载倒计时
        const nextDate = localStorage.getItem(this.config.storageKey + 'nextDate');
        if (nextDate) {
            document.getElementById('nextDateInput').value = nextDate;
            this.updateCountdown(nextDate);
        }
        
        // 随机提示
        this.randomTip();
        setInterval(() => this.randomTip(), 30000);
    }
    
    // 更新天数
    updateDaysCount(anniversary) {
        const start = new Date(anniversary);
        const now = new Date();
        const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        document.getElementById('daysCount').textContent = days;
    }
    
    // 更新倒计时
    updateCountdown(date) {
        if (!date) return;
        
        const target = new Date(date);
        const now = new Date();
        const diff = target - now;
        
        if (diff > 0) {
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            document.getElementById('countDays').textContent = days;
            
            const messages = [
                '每一天的等待都值得',
                '期待与你相见',
                '想你的第N天',
                '倒计时开始啦',
                '好期待呀'
            ];
            document.getElementById('meetingMessage').textContent = 
                messages[Math.floor(Math.random() * messages.length)];
        } else {
            document.getElementById('countDays').textContent = '0';
            document.getElementById('meetingMessage').textContent = '今天见面！';
        }
    }
    
    // 随机提示
    randomTip() {
        const tips = [
            '记得多喝水哦 💧',
            '今天也要开心呀 ✨',
            '想你了 💭',
            '要好好吃饭哦 🍽️',
            '早点休息，不要熬夜 🌙',
            '天冷了要多穿衣服 🧥',
            '工作/学习加油 💪',
            '今天的你也很可爱 🌸',
            '记得给自己一个微笑 😊',
            '每一天都是新的开始 🌅'
        ];
        
        const tip = tips[Math.floor(Math.random() * tips.length)];
        document.getElementById('tipContent').textContent = tip;
    }
    
    // 查看照片
    viewPhoto(src) {
        const viewer = document.getElementById('photoViewer');
        const img = document.getElementById('viewerImg');
        img.src = src;
        viewer.classList.remove('hidden');
    }
    
    // 检查认证
    checkAuth() {
        const savedPassword = localStorage.getItem(this.config.storageKey + 'password');
        if (savedPassword === this.config.password) {
            // 已登录
            this.initAfterAuth();
        } else {
            // 显示密码框
            document.getElementById('authOverlay').classList.remove('hidden');
            document.getElementById('passwordInput').focus();
        }
    }
    
    // 检查密码
    checkPassword() {
        const input = document.getElementById('passwordInput').value;
        if (input === this.config.password) {
            localStorage.setItem(this.config.storageKey + 'password', input);
            document.getElementById('authOverlay').classList.add('hidden');
            this.initAfterAuth();
        } else {
            this.showFeedback('密码不对哦');
            document.getElementById('passwordInput').value = '';
        }
    }
    
    // 认证后初始化
    initAfterAuth() {
        // 首次使用检查
        const isFirstTime = !localStorage.getItem(this.config.storageKey + 'notFirstTime');
        if (isFirstTime) {
            this.openSettings();
            localStorage.setItem(this.config.storageKey + 'notFirstTime', 'true');
        }
    }
    
    // 打开设置
    openSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('hidden');
        
        // 填充当前值
        document.getElementById('settingsName1').value = 
            localStorage.getItem(this.config.storageKey + 'name1') || this.preset.name1;
        document.getElementById('settingsName2').value = 
            localStorage.getItem(this.config.storageKey + 'name2') || this.preset.name2;
        document.getElementById('settingsAnniversary').value = 
            localStorage.getItem(this.config.storageKey + 'anniversary') || this.preset.anniversary;
        document.getElementById('roomCode').value = this.roomCode || '';
    }
    
    // 关闭设置
    closeSettings() {
        document.getElementById('settingsModal').classList.add('hidden');
    }
    
    // 保存设置
    async saveSettings() {
        const name1 = document.getElementById('settingsName1').value;
        const name2 = document.getElementById('settingsName2').value;
        const anniversary = document.getElementById('settingsAnniversary').value;
        const roomCode = document.getElementById('roomCode').value.toUpperCase();
        
        // 保存到本地
        localStorage.setItem(this.config.storageKey + 'name1', name1);
        localStorage.setItem(this.config.storageKey + 'name2', name2);
        localStorage.setItem(this.config.storageKey + 'anniversary', anniversary);
        
        // 如果房间代码变了，重新连接
        if (roomCode && roomCode.length === 6 && roomCode !== this.roomCode) {
            localStorage.setItem(this.config.storageKey + 'roomCode', roomCode);
            this.roomCode = roomCode;
            this.connectToRoom(roomCode);
        }
        
        // 同步到Firebase
        await this.syncConfig({
            name1: name1,
            name2: name2,
            anniversary: anniversary
        });
        
        // 更新UI
        document.getElementById('name1').textContent = name1;
        document.getElementById('name2').textContent = name2;
        this.updateDaysCount(anniversary);
        
        this.closeSettings();
        this.showFeedback('设置已保存');
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
}

// CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .sync-status {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #4A90E2;
        font-size: 12px;
    }
    
    .mood-author {
        color: #ff6b9d;
        font-weight: bold;
        margin: 0 10px;
    }
`;
document.head.appendChild(style);

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new TimeFlowSync();
});