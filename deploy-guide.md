# 📱 部署到GitHub Pages指南

## 步骤1：创建GitHub仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 "+" → "New repository"
3. 仓库名称：`love-link` 或任意名称
4. 设置为 Public（公开）
5. 点击 "Create repository"

## 步骤2：上传文件

### 方法A：通过网页上传
1. 在仓库页面点击 "uploading an existing file"
2. 拖拽所有文件到上传区域：
   - `index-art.html`（重命名为 `index.html`）
   - `styles-art.css`
   - `app-art.js`
3. 点击 "Commit changes"

### 方法B：使用Git命令
```bash
# 初始化仓库
git init
git add .
git commit -m "初始提交"

# 连接远程仓库（替换YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/love-link.git
git branch -M main
git push -u origin main
```

## 步骤3：启用GitHub Pages

1. 进入仓库设置：Settings
2. 左侧菜单找到 "Pages"
3. Source 选择：Deploy from a branch
4. Branch 选择：main
5. Folder 选择：/ (root)
6. 点击 Save

## 步骤4：访问你的网站

等待几分钟后，访问：
```
https://YOUR_USERNAME.github.io/love-link/
```

## 🎉 完成！

现在你可以：
- 在任何设备上访问
- 分享链接给另一半
- 永久免费托管
- 支持自定义域名

## 额外优化

### 添加PWA支持（可选）
创建 `manifest.json` 文件，让网站可以"安装"到手机：

```json
{
  "name": "时光纽带",
  "short_name": "时光纽带",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#667eea",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

在 `index.html` 的 `<head>` 中添加：
```html
<link rel="manifest" href="manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

## 注意事项

- GitHub Pages 是公开的，密码只是简单保护
- 数据存储在本地，不会同步
- 建议使用 HTTPS 访问（GitHub自动提供）