# 🔄 实时同步设置指南

## 方案一：使用 Firebase（推荐）

### 步骤 1：创建 Firebase 项目
1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击"创建项目"
3. 输入项目名称（如：love-link-sync）
4. 关闭 Google Analytics（不需要）
5. 点击"创建项目"

### 步骤 2：配置数据库
1. 在项目中，点击左侧"Realtime Database"
2. 点击"创建数据库"
3. 选择地区（建议选择新加坡 singapore）
4. 选择"以测试模式启动"（30天内免费）
5. 点击"启用"

### 步骤 3：配置存储
1. 点击左侧"Storage"
2. 点击"开始使用"
3. 选择"以测试模式启动"
4. 选择地区（与数据库相同）
5. 点击"完成"

### 步骤 4：获取配置
1. 点击项目设置（齿轮图标）
2. 向下滚动到"您的应用"部分
3. 点击"</>"图标（Web）
4. 输入应用名称
5. 点击"注册应用"
6. 复制 firebaseConfig 对象

### 步骤 5：更新代码
打开 `app-sync.js`，找到开头的 firebaseConfig，替换为你的配置：

```javascript
const firebaseConfig = {
    apiKey: "你的API密钥",
    authDomain: "你的项目.firebaseapp.com",
    databaseURL: "https://你的项目.firebaseio.com",
    projectId: "你的项目ID",
    storageBucket: "你的项目.appspot.com",
    messagingSenderId: "发送者ID",
    appId: "应用ID"
};
```

### 步骤 6：设置安全规则

#### Realtime Database 规则：
```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

#### Storage 规则：
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /rooms/{roomId}/{allPaths=**} {
      allow read, write: if request.auth == null;
    }
  }
}
```

### 步骤 7：使用应用
1. 打开 `index-sync.html`
2. 首次使用会自动生成一个6位房间代码
3. 在另一台设备上打开应用
4. 点击设置按钮，输入相同的房间代码
5. 现在两个设备就实时同步了！

## 方案二：使用 JSONBin（简单版）

如果不想配置 Firebase，可以使用 JSONBin 的免费服务：

### 步骤 1：注册 JSONBin
1. 访问 [JSONBin.io](https://jsonbin.io/)
2. 点击"Sign Up"免费注册
3. 登录后，点击"API Keys"
4. 创建一个新的 API Key

### 步骤 2：创建数据存储
1. 点击"Create Bin"
2. 输入初始数据：
```json
{
  "photos": [],
  "moods": [],
  "config": {}
}
```
3. 保存并记录 Bin ID

### 步骤 3：使用简化版同步
使用 `index-simple-sync.html`（需要创建）

## 使用说明

### 房间代码
- 每对情侣使用相同的6位房间代码
- 房间代码可以在设置中修改
- 相同房间代码的设备会自动同步

### 数据同步
- 照片上传后立即同步到另一设备
- 心情发送后立即显示在对方设备
- 配置更改（姓名、日期等）实时同步

### 存储限制
- Firebase 免费版：
  - 1GB 存储空间
  - 10GB/月 下载流量
  - 足够两个人使用很长时间

### 隐私说明
- 数据仅在使用相同房间代码的设备间同步
- 建议使用独特的房间代码保护隐私
- 可以随时更改房间代码切换到新的数据空间

## 常见问题

**Q: 同步不工作怎么办？**
A: 检查两个设备是否使用相同的房间代码

**Q: 如何重置数据？**
A: 更改房间代码即可切换到全新的数据空间

**Q: 是否需要付费？**
A: Firebase 免费额度足够个人使用，无需付费

**Q: 数据安全吗？**
A: 使用独特的房间代码，数据仅你们两人可见

## 部署到线上

1. 将修改后的代码推送到 GitHub
2. 访问 https://你的用户名.github.io/love-link/index-sync.html
3. 两个人都访问这个地址，输入相同房间代码即可同步