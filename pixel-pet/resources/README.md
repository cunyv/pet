# 应用图标说明

此目录用于存放应用图标资源。

## 需要的文件

- `icon.icns` - Mac应用图标（必需）

## 如何生成 .icns 图标

### 方法1：使用在线工具
1. 准备一个 1024x1024 像素的 PNG 图片
2. 访问 https://cloudconvert.com/png-to-icns 或类似网站
3. 上传 PNG 文件，转换为 .icns 格式
4. 下载并保存到此目录

### 方法2：使用命令行工具
1. 准备一个 1024x1024 像素的 PNG 图片，命名为 `icon.png`
2. 运行以下命令：
```bash
# 创建临时目录
mkdir -p icon.iconset

# 生成不同尺寸的图标
sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

# 生成 .icns 文件
iconutil -c icns icon.iconset -o icon.icns

# 清理临时文件
rm -rf icon.iconset
```

### 方法3：使用 Electron Icon Maker
```bash
npm install -g electron-icon-maker
electron-icon-maker --input=./icon.png --output=./
```

## 图标设计建议

- 使用简洁的像素风格设计
- 背景透明或纯色
- 主体形象清晰可辨
- 建议使用像素小人的形象

## 占位图标

如果暂时没有图标，electron-builder 会使用默认图标。
建议在正式发布前替换为自定义图标。
