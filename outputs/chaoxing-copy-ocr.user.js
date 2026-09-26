// ==UserScript==
// @name         超星题目复制修复（动态字体 OCR）
// @namespace    codex.local
// @version      1.2.0
// @description  从 font-cxsecret 实际显示的字形恢复文本，支持 Ctrl+C 和复制本页题目。
// @match        https://*.chaoxing.com/*
// @run-at       document-idle
// @require      https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js
// @grant        GM_setClipboard
// ==/UserScript==

(() => {
  'use strict';

  const SECRET = '.font-cxsecret';
  const QUESTION = '.singleQuesId';
  const FONT = 'font-cxsecret';
  const SIZE = 40;
  const MAX_WIDTH = 1600;
  let workerPromise;
  let busy = false;
  let statusElement;

  function status(message) {
    if (statusElement) statusElement.textContent = message;
    console.info('[超星复制修复]', message);
  }

  async function worker() {
    if (!workerPromise) {
      workerPromise = (async () => {
        if (!globalThis.Tesseract) throw new Error('OCR 库加载失败');
        const instance = await Tesseract.createWorker('chi_sim', 1);
        await instance.setParameters({
          tessedit_pageseg_mode: '6',
          preserve_interword_spaces: '1'
        });
        return instance;
      })().catch(error => {
        workerPromise = undefined;
        throw error;
      });
    }
    return workerPromise;
  }

  // 浏览器在画布上按网页字体绘字。OCR 识别的是人眼看到的字形，
  // 因而不依赖超星每次给出的 Unicode 替换表。
  async function draw(lines) {
    await document.fonts.ready;
    await document.fonts.load(`${SIZE}px ${FONT}`);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('无法创建画布');
    context.font = `${SIZE}px ${FONT}, "Microsoft YaHei", sans-serif`;
    const left = 32;
    const right = MAX_WIDTH - 32;
    const lineHeight = 62;
    const rows = [];
    for (const text of lines) {
      let row = '';
      for (const char of Array.from(text)) {
        if (context.measureText(row + char).width > right - left && row) {
          rows.push(row);
          row = '';
        }
        row += char;
      }
      rows.push(row);
    }
    canvas.width = MAX_WIDTH;
    canvas.height = Math.max(90, rows.length * lineHeight + 40);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#000';
    context.font = `${SIZE}px ${FONT}, "Microsoft YaHei", sans-serif`;
    context.textBaseline = 'middle';
    rows.forEach((row, index) => context.fillText(row, left, 40 + index * lineHeight));
    return canvas;
  }

  async function recognize(lines) {
    if (!lines.some(line => line.trim())) return '';
    const canvas = await draw(lines);
    const result = await (await worker()).recognize(canvas);
    return result.data.text.trim();
  }

  function copy(text) {
    GM_setClipboard(text, 'text');
    status(`已复制 ${text.length} 个字符；请核对 OCR 结果`);
  }

  async function run(task) {
    if (busy) return;
    busy = true;
    try {
      status('正在加载中文 OCR 并识别字形…');
      const text = await task();
      if (!text) throw new Error('没有识别到文字');
      copy(text);
    } catch (error) {
      status(`复制失败：${error.message || error}`);
    } finally {
      busy = false;
    }
  }

  function questionLines(question) {
    const title = question.querySelector('.fontLabel');
    const options = question.querySelectorAll('li.font-cxsecret');
    const lines = [];
    if (title) lines.push(title.innerText.trim());
    options.forEach(option => lines.push(option.innerText.trim()));
    return lines;
  }

  async function copyQuestions() {
    const questions = Array.from(document.querySelectorAll(QUESTION));
    const output = [];
    for (const [index, question] of questions.entries()) {
      const lines = questionLines(question);
      if (!lines.length) continue;
      if (question.querySelector(SECRET)) {
        status(`正在识别第 ${index + 1}/${questions.length} 题…`);
        output.push(`第 ${index + 1} 题\n${await recognize(lines)}`);
      } else {
        output.push(`第 ${index + 1} 题\n${lines.join('\n')}`);
      }
    }
    return output.join('\n\n');
  }

  function addButton() {
    if (document.getElementById('codex-copy-questions')) return;
    const panel = document.createElement('div');
    panel.id = 'codex-copy-questions';
    panel.style.cssText = 'position:fixed;right:16px;top:16px;bottom:auto;z-index:2147483647;background:#fff;color:#222;border:1px solid #bbb;border-radius:8px;box-shadow:0 3px 14px #0003;padding:8px;font:14px sans-serif;max-width:230px';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '复制本页题目';
    button.style.cssText = 'cursor:pointer;background:#2563eb;color:white;border:0;border-radius:5px;padding:7px 10px';
    button.addEventListener('click', () => run(copyQuestions));
    statusElement = document.createElement('div');
    statusElement.style.cssText = 'font-size:12px;margin-top:5px;line-height:1.4';
    statusElement.textContent = '也可选中文字后按 Ctrl+C';
    panel.append(button, statusElement);
    document.body.append(panel);
  }

  // 原生 copy 事件必须同步取消，随后异步 OCR。结果写入剪贴板时状态栏会提示。
  document.addEventListener('copy', event => {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const source = range.commonAncestorContainer;
    const element = source.nodeType === Node.ELEMENT_NODE ? source : source.parentElement;
    const question = element?.closest?.(QUESTION);
    if (!question || !Array.from(question.querySelectorAll(SECRET)).some(node => range.intersectsNode(node))) return;
    const selected = selection.toString();
    if (!selected.trim()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    run(() => recognize(selected.split(/\r?\n/)));
  }, true);

  const observer = new MutationObserver(() => {
    if (document.querySelector(QUESTION)) {
      observer.disconnect();
      addButton();
    }
  });
  if (document.querySelector(QUESTION)) addButton();
  else observer.observe(document.documentElement, { childList: true, subtree: true });
})();
