# 超星题目复制修复

这是一个 Tampermonkey 用户脚本，用 OCR 识别超星页面上实际显示的题目和选项文字，解决复制后出现乱码的问题。仓库只维护[动态字体 OCR 脚本](outputs/chaoxing-copy-ocr.user.js)；不包含视频暂停处理、自动答题或提交功能。

## 从 GitHub 下载并安装

1. 打开本仓库的[脚本文件](outputs/chaoxing-copy-ocr.user.js)，在 GitHub 文件页面选择“Download raw file”下载；如果浏览器直接显示源码，也可以复制全部内容。
2. 在 Tampermonkey 中新建用户脚本，用下载文件中的全部内容（或刚复制的源码）替换编辑器模板并保存。
3. 刷新超星题目页面。首次使用需要联网加载脚本引用的 Tesseract.js 和中文 OCR 数据。

推荐给别人时，请分享[本项目的 GitHub 链接](https://github.com/iLLyaaaaaa/-)，让他们从这里下载，不要将脚本文件重新上传到其他地方。

## 使用

- 点击题目页面右上角的“复制本页题目”，等待状态提示复制完成后粘贴。
- 也可以选中题目文字后按 `Ctrl+C`；OCR 是异步执行的，须等到状态提示复制完成。
- OCR 可能识别错误，使用前请对照网页核对文字。

脚本匹配 `https://*.chaoxing.com/*`，但只有页面出现题目节点时才显示复制按钮。网站结构变化后可能需要调整选择器。

## 使用许可

允许个人从本项目下载、原样安装并非商业使用脚本，也可以分享本项目的链接。不授权转载脚本文件、公开发布修改版或商业使用；详情见 [LICENSE.md](LICENSE.md)。

## 检查

无需构建；可用 `node --check outputs/chaoxing-copy-ocr.user.js` 检查 JavaScript 语法。
