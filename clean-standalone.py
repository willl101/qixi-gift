#!/usr/bin/env python3
# 清理个人信息脚本

# 读取文件
with open('index-selfcontained.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 替换个人信息
replacements = {
    '段淦元': '你',
    '张琳曼': 'TA',
    '2024-04-13': '2024-01-01',
    '2024.04.13': '2024.01.01',
    "password: '1314'": "password: '1234'",
    'password === \'1314\'': 'password === \'1234\'',
    '密码：1314': '密码：1234',
    '输入密码 1314': '输入密码 1234',
}

# 执行替换
for old, new in replacements.items():
    content = content.replace(old, new)

# 额外检查并清理可能的个人信息
import re

# 清理任何可能的日期格式
content = re.sub(r'2024[-.]04[-.]13', '2024-01-01', content)

# 清理注释中的信息
content = re.sub(r'<!--.*?(段淦元|张琳曼|1314).*?-->', '<!-- cleaned -->', content, flags=re.DOTALL)

# 写入清理后的文件
with open('index-template.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 已创建清理版本: index-template.html")
print("📝 替换内容:")
print("   - 段淦元 → 你")
print("   - 张琳曼 → TA") 
print("   - 2024-04-13 → 2024-01-01")
print("   - 密码 1314 → 1234")
print("\n🎯 你的朋友可以:")
print("   1. 打开 index-template.html")
print("   2. 修改成他们的名字和日期")
print("   3. 设置自己的密码")
print("   4. 开始使用！")