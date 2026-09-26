# 超星题目复制修复

这是一个 Tampermonkey 用户脚本，用 OCR 识别超星页面上实际显示的题目和选项文字，解决复制后出现乱码的问题。仓库只维护[动态字体 OCR 脚本](outputs/chaoxing-copy-ocr.user.js)；不包含视频暂停处理、自动答题或提交功能。

## 安装

1. 在 Tampermonkey 中新建用户脚本。
2. 用 `outputs/chaoxing-copy-ocr.user.js` 的全部内容替换编辑器模板并保存。
3. 刷新超星题目页面。首次使用需要联网加载脚本引用的 Tesseract.js 和中文 OCR 数据。

## 使用

- 点击题目页面右上角的“复制本页题目”，等待状态提示复制完成后粘贴。
- 也可以选中题目文字后按 `Ctrl+C`；OCR 是异步执行的，须等到状态提示复制完成。
- OCR 可能识别错误，使用前请对照网页核对文字。

脚本匹配 `https://*.chaoxing.com/*`，但只有页面出现题目节点时才显示复制按钮。网站结构变化后可能需要调整选择器。

## 检查

无需构建；可用 `node --check outputs/chaoxing-copy-ocr.user.js` 检查 JavaScript 语法。
