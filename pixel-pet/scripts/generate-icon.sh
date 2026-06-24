#!/bin/bash

# 像素宠物图标生成脚本 - 重新设计版

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
RESOURCES_DIR="$PROJECT_DIR/resources"
ICON_PNG="$RESOURCES_DIR/icon.png"
ICON_ICNS="$RESOURCES_DIR/icon.icns"

echo "🎨 生成新图标..."

# 创建临时目录
ICONSET_DIR="$RESOURCES_DIR/icon.iconset"
mkdir -p "$ICONSET_DIR"

# 使用 Python 生成更精美的像素图标
python3 << 'PYTHON_SCRIPT'
import struct
import zlib
import os

# 创建 128x128 的高清像素图标
width = 128
height = 128

# 像素大小 (每个逻辑像素 = 8x8 实际像素)
pixel_size = 8

# 颜色定义
BG_COLOR = (74, 144, 217, 255)        # 蓝色背景
BG_LIGHT = (100, 170, 230, 255)       # 浅蓝高光
SKIN = (255, 218, 185, 255)           # 皮肤
SKIN_SHADOW = (230, 180, 150, 255)    # 皮肤阴影
HAIR = (101, 67, 33, 255)             # 棕色头发
HAIR_DARK = (80, 50, 20, 255)         # 深棕头发
EYE_WHITE = (255, 255, 255, 255)      # 眼白
EYE_PUPIL = (30, 30, 30, 255)         # 瞳孔
MOUTH = (255, 100, 100, 255)          # 嘴巴
CLOTH = (80, 200, 120, 255)           # 绿色衣服
CLOTH_DARK = (60, 160, 90, 255)       # 衣服阴影
CHEEK = (255, 180, 180, 200)          # 脸红

# 16x16 像素画布 (放大到128x128)
canvas = [[(0,0,0,0)] * 16 for _ in range(16)]

def set_pixel(x, y, color):
    if 0 <= x < 16 and 0 <= y < 16:
        canvas[y][x] = color

def fill_rect(x1, y1, x2, y2, color):
    for y in range(y1, y2+1):
        for x in range(x1, x2+1):
            set_pixel(x, y, color)

# 背景 - 圆角矩形
for y in range(16):
    for x in range(16):
        # 四个角切掉
        if (x == 0 and y == 0) or (x == 15 and y == 0) or (x == 0 and y == 15) or (x == 15 and y == 15):
            continue
        if (x == 1 and y == 0) or (x == 14 and y == 0) or (x == 0 and y == 1) or (x == 15 and y == 1):
            continue
        if (x == 0 and y == 14) or (x == 15 and y == 14) or (x == 1 and y == 15) or (x == 14 and y == 15):
            continue
        # 边缘用浅色
        if x == 0 or x == 15 or y == 0 or y == 15:
            set_pixel(x, y, BG_LIGHT)
        else:
            set_pixel(x, y, BG_COLOR)

# 头发 - 棕色
fill_rect(4, 2, 11, 3, HAIR)      # 头发顶部
fill_rect(3, 3, 12, 4, HAIR)      # 头发中部
fill_rect(3, 5, 4, 8, HAIR)       # 左侧头发
fill_rect(11, 5, 12, 8, HAIR)     # 右侧头发

# 脸部
fill_rect(5, 4, 10, 9, SKIN)      # 脸部主体
fill_rect(4, 5, 11, 8, SKIN)      # 脸部扩展

# 眼睛
set_pixel(6, 6, EYE_WHITE)        # 左眼白
set_pixel(7, 6, EYE_PUPIL)        # 左瞳孔
set_pixel(9, 6, EYE_WHITE)        # 右眼白
set_pixel(8, 6, EYE_PUPIL)        # 右瞳孔

# 嘴巴
fill_rect(7, 8, 8, 8, MOUTH)      # 微笑嘴巴

# 脸颊红晕
set_pixel(5, 7, CHEEK)            # 左脸颊
set_pixel(10, 7, CHEEK)           # 右脸颊

# 身体 - 绿色衣服
fill_rect(5, 10, 10, 12, CLOTH)   # 身体
fill_rect(4, 10, 4, 11, CLOTH)    # 左肩
fill_rect(11, 10, 11, 11, CLOTH)  # 右肩

# 衣服细节
fill_rect(5, 10, 10, 10, CLOTH_DARK)  # 衣领阴影

# 手臂
fill_rect(3, 11, 4, 12, SKIN)     # 左手臂
fill_rect(11, 11, 12, 12, SKIN)   # 右手臂

# 腿
fill_rect(6, 13, 7, 14, CLOTH_DARK)  # 左腿
fill_rect(8, 13, 9, 14, CLOTH_DARK)  # 右腿

# 鞋子
fill_rect(6, 14, 7, 14, HAIR)     # 左鞋
fill_rect(8, 14, 9, 14, HAIR)     # 右鞋

# 高光效果
set_pixel(6, 5, (255, 255, 255, 100))  # 额头高光
set_pixel(5, 10, (255, 255, 255, 80))  # 衣服高光

# 生成 PNG
def create_png(filename, width, height, canvas, pixel_size):
    real_width = width * pixel_size
    real_height = height * pixel_size

    pixels = []
    for y in range(height):
        for py in range(pixel_size):
            for x in range(width):
                color = canvas[y][x]
                for px in range(pixel_size):
                    pixels.append(color)

    def create_chunk(chunk_type, data):
        chunk = chunk_type + data
        return struct.pack('>I', len(data)) + chunk + struct.pack('>I', zlib.crc32(chunk) & 0xffffffff)

    png_signature = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', real_width, real_height, 8, 6, 0, 0, 0)
    ihdr_chunk = create_chunk(b'IHDR', ihdr_data)

    raw_data = b''
    for y in range(real_height):
        raw_data += b'\x00'
        for x in range(real_width):
            idx = y * real_width + x
            r, g, b, a = pixels[idx]
            raw_data += struct.pack('BBBB', r, g, b, a)

    compressed = zlib.compress(raw_data)
    idat_chunk = create_chunk(b'IDAT', compressed)
    iend_chunk = create_chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(png_signature)
        f.write(ihdr_chunk)
        f.write(idat_chunk)
        f.write(iend_chunk)

output_path = os.path.expanduser("~/project/pet/pixel-pet/resources/icon.png")
create_png(output_path, 16, 16, canvas, pixel_size)
print(f"✅ PNG 图标已生成: {output_path}")
PYTHON_SCRIPT

if [ ! -f "$ICON_PNG" ]; then
    echo "❌ 生成失败"
    exit 1
fi

# 生成不同尺寸
echo "🔄 生成多尺寸图标..."
for size in 16 32 128 256 512; do
    sips -z $size $size "$ICON_PNG" --out "$ICONSET_DIR/icon_${size}x${size}.png" > /dev/null 2>&1
    double_size=$((size * 2))
    if [ $double_size -le 1024 ]; then
        sips -z $double_size $double_size "$ICON_PNG" --out "$ICONSET_DIR/icon_${size}x${size}@2x.png" > /dev/null 2>&1
    fi
done

# 生成 .icns
iconutil -c icns "$ICONSET_DIR" -o "$ICON_ICNS"
rm -rf "$ICONSET_DIR"

echo "✅ 图标已生成: $ICON_ICNS"
