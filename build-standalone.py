#!/usr/bin/env python3
import base64

# 读取必要文件
with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

with open('styles.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

with open('app.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# 增强的JavaScript代码
enhanced_js = """
// ==== 自包含页面增强功能 ====
(function() {
    // 页面数据存储
    const embeddedData = {
        photos: [],
        moods: [],
        config: {}
    };
    
    // 初始化嵌入数据
    function loadEmbeddedData() {
        // 从隐藏元素加载已保存的照片
        const savedPhotosEl = document.getElementById('embeddedPhotosData');
        if (savedPhotosEl) {
            savedPhotosEl.querySelectorAll('img').forEach(img => {
                embeddedData.photos.push({
                    data: img.src,
                    id: img.dataset.id || Date.now() + Math.random()
                });
            });
        }
        
        // 从隐藏元素加载心情
        const savedMoodsEl = document.getElementById('embeddedMoodsData');
        if (savedMoodsEl && savedMoodsEl.textContent) {
            try {
                embeddedData.moods = JSON.parse(savedMoodsEl.textContent);
            } catch(e) {}
        }
        
        // 显示已保存的数据
        setTimeout(() => {
            displayEmbeddedPhotos();
            displayEmbeddedMoods();
        }, 3500); // 在开场动画后显示
    }
    
    // 显示嵌入的照片
    function displayEmbeddedPhotos() {
        const photoStream = document.getElementById('photoStream');
        if (!photoStream || embeddedData.photos.length === 0) return;
        
        // 添加到现有照片流
        embeddedData.photos.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `
                <div class="photo-glow"></div>
                <img src="${photo.data}" alt="照片">
                <button class="photo-delete" onclick="removeEmbeddedPhoto('${photo.id}')">&times;</button>
            `;
            photoStream.appendChild(photoItem);
        });
    }
    
    // 显示嵌入的心情  
    function displayEmbeddedMoods() {
        const moodRipples = document.getElementById('moodRipples');
        if (!moodRipples || embeddedData.moods.length === 0) return;
        
        embeddedData.moods.forEach(mood => {
            const ripple = document.createElement('div');
            ripple.className = 'mood-ripple-saved';
            ripple.innerHTML = `<span>${mood.emoji}</span><span>${mood.text}</span>`;
            moodRipples.appendChild(ripple);
        });
    }
    
    // 劫持原有函数
    function hijackOriginalFunctions() {
        const checkInterval = setInterval(() => {
            if (window.timeFlowInstance) {
                clearInterval(checkInterval);
                
                // 劫持照片处理
                const original_handlePhotos = window.timeFlowInstance.handlePhotos;
                window.timeFlowInstance.handlePhotos = async function(e) {
                    const files = Array.from(e.target.files);
                    
                    for (let file of files) {
                        // 读取为base64
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const photoData = {
                                data: e.target.result,
                                id: Date.now() + '_' + Math.random()
                            };
                            embeddedData.photos.push(photoData);
                            
                            // 添加到页面
                            const photoStream = document.getElementById('photoStream');
                            const photoItem = document.createElement('div');
                            photoItem.className = 'photo-item';
                            photoItem.innerHTML = `
                                <div class="photo-glow"></div>
                                <img src="${photoData.data}" alt="照片">
                                <button class="photo-delete" onclick="removeEmbeddedPhoto('${photoData.id}')">&times;</button>
                            `;
                            photoStream.appendChild(photoItem);
                            
                            // 显示保存按钮
                            showSaveButton();
                        };
                        reader.readAsDataURL(file);
                    }
                    
                    // 调用原函数的其他效果
                    if (this.showFeedback) {
                        this.showFeedback('照片已添加');
                    }
                };
                
                // 劫持心情发送
                const original_sendMood = window.timeFlowInstance.sendMood;
                window.timeFlowInstance.sendMood = function() {
                    const moodText = document.getElementById('moodText');
                    if (moodText && moodText.value) {
                        embeddedData.moods.push({
                            text: moodText.value,
                            emoji: this.currentMood || '💭',
                            time: new Date().toISOString()
                        });
                        showSaveButton();
                    }
                    
                    // 调用原函数
                    if (original_sendMood) {
                        original_sendMood.call(this);
                    }
                };
            }
        }, 100);
    }
    
    // 删除嵌入的照片
    window.removeEmbeddedPhoto = function(photoId) {
        embeddedData.photos = embeddedData.photos.filter(p => p.id !== photoId);
        showSaveButton();
    };
    
    // 显示保存按钮
    function showSaveButton() {
        let btn = document.getElementById('savePageBtn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'savePageBtn';
            btn.innerHTML = '💾 保存页面';
            btn.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                z-index: 10000;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 30px;
                font-size: 16px;
                cursor: pointer;
                box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
                animation: pulse 2s infinite;
            `;
            btn.onclick = savePage;
            document.body.appendChild(btn);
        }
        
        // 动画提示
        btn.style.animation = 'pulse 0.5s';
        setTimeout(() => {
            btn.style.animation = 'pulse 2s infinite';
        }, 500);
    }
    
    // 保存页面
    function savePage() {
        // 获取当前完整HTML
        let currentHTML = document.documentElement.outerHTML;
        
        // 更新嵌入的数据
        const photosHTML = embeddedData.photos.map(p => 
            `<img src="${p.data}" data-id="${p.id}" style="display:none;">`
        ).join('');
        
        const moodsJSON = JSON.stringify(embeddedData.moods);
        
        // 替换数据存储区
        currentHTML = currentHTML.replace(
            /<div id="embeddedPhotosData"[^>]*>.*?<\\/div>/s,
            `<div id="embeddedPhotosData" style="display:none;">${photosHTML}</div>`
        );
        
        currentHTML = currentHTML.replace(
            /<div id="embeddedMoodsData"[^>]*>.*?<\\/div>/s,
            `<div id="embeddedMoodsData" style="display:none;">${moodsJSON}</div>`
        );
        
        // 创建下载
        const blob = new Blob([currentHTML], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `时光纽带_${new Date().toISOString().split('T')[0]}.html`;
        a.click();
        URL.revokeObjectURL(url);
        
        // 提示
        if (window.timeFlowInstance && window.timeFlowInstance.showFeedback) {
            window.timeFlowInstance.showFeedback('页面已保存');
        }
    }
    
    // 添加保存按钮动画
    const saveButtonStyle = document.createElement('style');
    saveButtonStyle.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .mood-ripple-saved {
            position: absolute;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
            animation: float 20s infinite;
        }
        
        @keyframes float {
            0% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-20px) translateX(10px); }
            100% { transform: translateY(0) translateX(0); }
        }
    `;
    document.head.appendChild(saveButtonStyle);
    
    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
        loadEmbeddedData();
        hijackOriginalFunctions();
    });
})();
"""

# 构建完整HTML
standalone_html = html_content.replace(
    '<link rel="stylesheet" href="styles.css">',
    f'<style>\n{css_content}\n</style>'
).replace(
    '<script src="app.js"></script>',
    f'''
    <!-- 数据存储区 -->
    <div id="embeddedPhotosData" style="display:none;"></div>
    <div id="embeddedMoodsData" style="display:none;"></div>
    
    <script>
    {js_content}
    </script>
    
    <script>
    {enhanced_js}
    </script>
    '''
)

# 写入文件
with open('index-selfcontained.html', 'w', encoding='utf-8') as f:
    f.write(standalone_html)

print("✅ 已创建 index-selfcontained.html")
print("📁 文件大小:", len(standalone_html), "字节")
print("🎨 保持原版完全一样的外观")
print("💾 支持自动保存照片到HTML文件中")