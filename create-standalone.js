// 创建独立HTML文件的脚本
const fs = require('fs').promises;
const path = require('path');

async function createStandaloneHTML() {
    try {
        // 读取必要文件
        const indexHTML = await fs.readFile('index.html', 'utf8');
        const stylesCSS = await fs.readFile('styles.css', 'utf8');
        const appJS = await fs.readFile('app.js', 'utf8');
        
        // 解析HTML
        const parser = new (require('jsdom').JSDOM);
        const dom = new parser(indexHTML);
        const document = dom.window.document;
        
        // 移除外部链接
        const styleLinks = document.querySelectorAll('link[rel="stylesheet"]');
        styleLinks.forEach(link => link.remove());
        
        const scriptTags = document.querySelectorAll('script[src]');
        scriptTags.forEach(script => script.remove());
        
        // 添加内联样式
        const styleTag = document.createElement('style');
        styleTag.textContent = stylesCSS;
        document.head.appendChild(styleTag);
        
        // 添加数据存储区域
        const dataStorage = document.createElement('div');
        dataStorage.id = 'embeddedDataStorage';
        dataStorage.style.display = 'none';
        dataStorage.innerHTML = `
            <div id="savedPhotos"></div>
            <div id="savedMoods"></div>
            <div id="savedConfig"></div>
        `;
        document.body.appendChild(dataStorage);
        
        // 添加保存按钮
        const saveButton = document.createElement('div');
        saveButton.innerHTML = `
            <style>
                .auto-save-indicator {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(40, 167, 69, 0.9);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 20px;
                    font-size: 14px;
                    z-index: 10000;
                    opacity: 0;
                    transition: opacity 0.3s;
                    pointer-events: none;
                }
                .auto-save-indicator.show {
                    opacity: 1;
                }
                .download-btn {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 15px 25px;
                    border-radius: 25px;
                    font-size: 16px;
                    cursor: pointer;
                    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s;
                }
                .download-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.5);
                }
            </style>
            <div class="auto-save-indicator" id="saveIndicator">自动保存中...</div>
            <button class="download-btn" onclick="downloadPage()">
                <span>💾</span>
                <span>下载页面</span>
            </button>
        `;
        document.body.appendChild(saveButton);
        
        // 添加增强脚本
        const enhancedScript = document.createElement('script');
        enhancedScript.textContent = `
            // 数据存储管理
            const pageData = {
                photos: [],
                moods: [],
                config: {
                    name1: '段淦元',
                    name2: '张琳曼',
                    anniversary: '2024-04-13'
                }
            };
            
            // 初始化已保存的数据
            function initSavedData() {
                const savedPhotos = document.getElementById('savedPhotos');
                if (savedPhotos) {
                    const photoElements = savedPhotos.querySelectorAll('img');
                    photoElements.forEach(img => {
                        pageData.photos.push({
                            data: img.src,
                            name: img.dataset.name || '',
                            date: img.dataset.date || ''
                        });
                    });
                }
                
                const savedMoods = document.getElementById('savedMoods');
                if (savedMoods && savedMoods.textContent) {
                    try {
                        pageData.moods = JSON.parse(savedMoods.textContent);
                    } catch (e) {}
                }
                
                const savedConfig = document.getElementById('savedConfig');
                if (savedConfig && savedConfig.textContent) {
                    try {
                        Object.assign(pageData.config, JSON.parse(savedConfig.textContent));
                    } catch (e) {}
                }
                
                // 显示已保存的数据
                setTimeout(() => {
                    displaySavedPhotos();
                    displaySavedMoods();
                }, 2000);
            }
            
            // 显示已保存的照片
            function displaySavedPhotos() {
                const photoStream = document.getElementById('photoStream');
                if (!photoStream || pageData.photos.length === 0) return;
                
                // 清空现有内容
                photoStream.innerHTML = '';
                
                // 显示保存的照片
                pageData.photos.forEach((photo, index) => {
                    const item = document.createElement('div');
                    item.className = 'photo-item';
                    item.innerHTML = \`
                        <img src="\${photo.data}" alt="\${photo.name}" onclick="window.timeFlowInstance?.viewPhoto(this.src)">
                        <button class="delete-photo" onclick="deletePhoto(\${index})">&times;</button>
                    \`;
                    photoStream.appendChild(item);
                });
            }
            
            // 显示已保存的心情
            function displaySavedMoods() {
                const moodTimeline = document.getElementById('moodTimeline');
                if (!moodTimeline || pageData.moods.length === 0) return;
                
                moodTimeline.innerHTML = '';
                
                pageData.moods.forEach(mood => {
                    const item = document.createElement('div');
                    item.className = 'mood-item';
                    const date = new Date(mood.date);
                    const dateStr = \`\${date.getMonth() + 1}/\${date.getDate()} \${date.getHours()}:\${date.getMinutes().toString().padStart(2, '0')}\`;
                    
                    item.innerHTML = \`
                        <div class="mood-meta">
                            <span class="mood-emoji">\${mood.emoji || '💭'}</span>
                            <span class="mood-time">\${dateStr}</span>
                        </div>
                        <div class="mood-text">\${mood.text}</div>
                    \`;
                    moodTimeline.appendChild(item);
                });
            }
            
            // 删除照片
            function deletePhoto(index) {
                pageData.photos.splice(index, 1);
                displaySavedPhotos();
                showSaveIndicator();
            }
            
            // 覆盖原有上传功能
            function overrideUploadFunctions() {
                // 等待原始脚本加载
                const checkInterval = setInterval(() => {
                    if (window.timeFlowInstance) {
                        clearInterval(checkInterval);
                        
                        // 保存原始函数
                        const originalHandlePhotos = window.timeFlowInstance.handlePhotos;
                        const originalSendMood = window.timeFlowInstance.sendMood;
                        
                        // 覆盖照片上传
                        window.timeFlowInstance.handlePhotos = async function(e) {
                            const files = Array.from(e.target.files);
                            
                            for (let file of files) {
                                // 压缩图片
                                const compressed = await compressImage(file);
                                
                                // 转为base64
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                    pageData.photos.push({
                                        data: e.target.result,
                                        name: file.name,
                                        date: new Date().toISOString()
                                    });
                                    
                                    displaySavedPhotos();
                                    showSaveIndicator();
                                };
                                reader.readAsDataURL(compressed);
                            }
                        };
                        
                        // 覆盖心情发送
                        window.timeFlowInstance.sendMood = function() {
                            const text = document.getElementById('moodText')?.value;
                            if (text) {
                                pageData.moods.push({
                                    text: text,
                                    emoji: this.currentMood || '💭',
                                    date: new Date().toISOString()
                                });
                                
                                displaySavedMoods();
                                document.getElementById('moodText').value = '';
                                showSaveIndicator();
                                
                                this.showFeedback('心情已记录');
                            }
                        };
                    }
                }, 100);
            }
            
            // 压缩图片
            async function compressImage(file) {
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
                                resolve(blob);
                            }, 'image/jpeg', 0.85);
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                });
            }
            
            // 显示保存提示
            function showSaveIndicator() {
                const indicator = document.getElementById('saveIndicator');
                indicator.classList.add('show');
                setTimeout(() => {
                    indicator.classList.remove('show');
                }, 2000);
            }
            
            // 下载页面
            function downloadPage() {
                // 获取当前页面的完整HTML
                const currentHTML = document.documentElement.outerHTML;
                
                // 更新数据存储
                const updatedHTML = currentHTML
                    .replace(/<div id="savedPhotos">.*?<\\/div>/s, 
                        '<div id="savedPhotos">' + 
                        pageData.photos.map(p => 
                            \`<img src="\${p.data}" data-name="\${p.name}" data-date="\${p.date}">\`
                        ).join('') + 
                        '</div>')
                    .replace(/<div id="savedMoods">.*?<\\/div>/s, 
                        '<div id="savedMoods">' + JSON.stringify(pageData.moods) + '</div>')
                    .replace(/<div id="savedConfig">.*?<\\/div>/s, 
                        '<div id="savedConfig">' + JSON.stringify(pageData.config) + '</div>');
                
                // 创建下载
                const blob = new Blob([updatedHTML], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`时光纽带_\${new Date().toISOString().split('T')[0]}.html\`;
                a.click();
                URL.revokeObjectURL(url);
                
                showSaveIndicator();
            }
            
            // 初始化
            document.addEventListener('DOMContentLoaded', () => {
                initSavedData();
                overrideUploadFunctions();
            });
        `;
        document.body.appendChild(enhancedScript);
        
        // 添加原始app.js脚本
        const appScript = document.createElement('script');
        appScript.textContent = appJS;
        document.body.appendChild(appScript);
        
        // 生成最终HTML
        const finalHTML = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
        
        // 写入文件
        await fs.writeFile('index-selfcontained.html', finalHTML, 'utf8');
        
        console.log('✅ 已创建 index-selfcontained.html');
        
    } catch (error) {
        console.error('创建失败:', error);
    }
}

// 如果没有jsdom，使用简单方法
async function createSimpleStandalone() {
    try {
        const indexHTML = await fs.readFile('index.html', 'utf8');
        const stylesCSS = await fs.readFile('styles.css', 'utf8');
        const appJS = await fs.readFile('app.js', 'utf8');
        
        // 创建完整的HTML
        const standaloneHTML = indexHTML
            .replace('</head>', `<style>${stylesCSS}</style></head>`)
            .replace('<link rel="stylesheet" href="styles.css">', '')
            .replace('</body>', `
                <div id="embeddedDataStorage" style="display: none;">
                    <div id="savedPhotos"></div>
                    <div id="savedMoods"></div>
                    <div id="savedConfig"></div>
                </div>
                
                <script>${appJS}</script>
                
                <script>
                    // [增强脚本内容，同上]
                </script>
            </body>`);
        
        await fs.writeFile('index-selfcontained.html', standaloneHTML, 'utf8');
        console.log('✅ 已创建 index-selfcontained.html (简单版)');
        
    } catch (error) {
        console.error('创建失败:', error);
    }
}

// 执行
createSimpleStandalone();