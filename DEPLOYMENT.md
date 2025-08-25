# 🚀 时光纽带 - 部署和使用指南

## ✅ Firebase 已配置完成

你的 Firebase 项目已经正确配置：
- 项目 ID: `love-link-989a6`
- 数据库区域: Asia Southeast 1 (新加坡)
- 配置文件: `firebase-config.js`

## 📱 如何使用

### 方式一：本地测试（推荐先测试）

1. **启动本地服务器**（如果还没启动）：
   ```bash
   python3 -m http.server 8082
   ```

2. **测试 Firebase 连接**：
   - 打开：http://localhost:8082/test-firebase.html
   - 点击"测试写入数据"和"测试读取数据"
   - 如果显示绿色成功消息，说明 Firebase 已正确配置

3. **访问实时同步版**：
   - 打开：http://localhost:8082/index-sync.html
   - 第一次会要求输入密码：1314
   - 设置你们的名字和纪念日
   - 记住显示的6位房间代码

4. **在另一设备访问**：
   - 手机扫描：http://localhost:8082/qrcode.html
   - 或直接访问：http://你的IP:8082/index-sync.html
   - 输入相同的房间代码
   - 现在两个设备已经实时同步！

### 方式二：部署到 GitHub Pages

1. **推送代码到 GitHub**：
   ```bash
   git add -A
   git commit -m "配置 Firebase 实时同步"
   git push
   ```

2. **等待部署完成**（1-5分钟）

3. **访问线上版本**：
   - 实时同步版：https://willl101.github.io/love-link/index-sync.html
   - 手动同步版：https://willl101.github.io/love-link/

## 🔑 重要功能说明

### 房间代码系统
- **自动生成**：首次使用会自动生成6位房间代码
- **共享同步**：两个人使用相同房间代码即可实时同步
- **隐私保护**：每个房间代码对应独立的数据空间
- **更改房间**：在设置中可以更改房间代码

### 实时同步功能
- ✅ **照片同步**：上传后立即在对方设备显示
- ✅ **心情同步**：发送的心情实时显示
- ✅ **配置同步**：姓名、日期等自动同步
- ✅ **拥抱提醒**：发送拥抱对方会收到提醒

### 数据存储
- 照片存储在 Firebase Storage
- 文字数据存储在 Realtime Database
- 免费额度：1GB 存储 + 10GB/月流量
- 足够两个人长期使用

## 🛠️ 故障排查

### 如果同步不工作：

1. **检查 Firebase 服务状态**：
   - 打开 test-firebase.html
   - 测试各项功能是否正常

2. **检查房间代码**：
   - 确保两个设备使用相同的6位房间代码
   - 在设置中查看当前房间代码

3. **检查网络连接**：
   - 确保设备已连接互联网
   - Firebase 需要网络连接才能同步

4. **清除缓存重试**：
   - 清除浏览器缓存
   - 重新输入房间代码

## 📊 Firebase Console 管理

访问 [Firebase Console](https://console.firebase.google.com/project/love-link-989a6/overview) 可以：
- 查看实时数据
- 监控使用量
- 管理存储的照片
- 设置安全规则

## 🎯 使用建议

1. **首次使用**：
   - 先在 test-firebase.html 测试连接
   - 确认工作后再使用正式版

2. **日常使用**：
   - 收藏网址方便访问
   - 记住房间代码
   - 定期查看同步状态

3. **隐私安全**：
   - 使用独特的房间代码
   - 不要分享房间代码给他人
   - 可随时更换新房间代码

## 💝 享受你们的时光纽带！

现在你们可以：
- 📷 实时分享照片
- 💭 即时传递心情
- 🤗 远程发送拥抱
- 📅 共同倒数见面的日子

有任何问题可以查看测试页面或检查 Firebase Console。