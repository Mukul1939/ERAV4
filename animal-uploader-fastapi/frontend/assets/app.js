'use strict';

/**
 * Animal Picker + File Uploader
 * - Talks to FastAPI endpoints:
 *    GET  /api/animal?name=cat|dog|elephant  -> { imageUrl, label }
 *    POST /api/upload (multipart/form-data)  -> { name, size, type }
 */

(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const previewEl = $('#animal-preview');
  const formEl = $('#animal-form');
  const dropzone = $('#dropzone');
  const fileInput = $('#file-input');
  const fileInfo = $('#file-info');
  const healthTag = $('#health-status');

  // ---- Utilities ----
  const formatBytes = (bytes) => {
    if (isNaN(bytes)) return 'N/A';
    const units = ['B','KB','MB','GB','TB'];
    let i = 0; let num = Number(bytes);
    while(num >= 1024 && i < units.length-1){ num /= 1024; i++; }
    return `${num.toFixed(num < 10 && i>0 ? 1 : 0)} ${units[i]}`;
  };

  const setBusy = (el, busy=true) => el.setAttribute('aria-busy', String(busy));
  const setStatus = (msg, ok=true) => {
    healthTag.textContent = msg;
    healthTag.style.color = ok ? 'inherit' : '#ff9090';
  };

  // Keep one outstanding animal fetch at a time
  let animalAbort = null;

  async function fetchAnimal(name){
    if (!name) return;
    if (animalAbort) animalAbort.abort();
    const controller = new AbortController();
    animalAbort = controller;

    setBusy(previewEl, true);
    previewEl.innerHTML = '<div class="placeholder">Loading…</div>';

    try {
      const res = await fetch(`/api/animal?name=${encodeURIComponent(name)}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const img = new Image();
      img.alt = data.label || name;
      img.onload = () => {
        previewEl.innerHTML = '';
        img.classList.add('show');
        previewEl.appendChild(img);
        setBusy(previewEl, false);
      };
      img.onerror = () => {
        previewEl.innerHTML = '<div class="placeholder">Image failed to load.</div>';
        setBusy(previewEl, false);
      };
      img.src = data.imageUrl;
    } catch (err){
      if (err.name === 'AbortError') return; // new selection happened
      previewEl.innerHTML = `<div class="placeholder">Failed: ${err.message}</div>`;
      setBusy(previewEl, false);
    }
  }

  async function uploadFile(file){
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    setBusy(fileInfo, true);
    fileInfo.textContent = 'Uploading…';

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const rows = [
        ['Name', data.name],
        ['Size', `${formatBytes(data.size)} (${data.size} bytes)`],
        ['Type', data.type || 'unknown']
      ];
      fileInfo.innerHTML = rows.map(([k,v]) => `<div class="row"><strong>${k}:</strong><span class="tag">${v}</span></div>`).join('');
    } catch (err){
      fileInfo.innerHTML = `<div class="row"><strong>Error:</strong><span class="tag">${err.message}</span></div>`;
    } finally {
      setBusy(fileInfo, false);
    }
  }

  // ---- Animal checkbox behavior (single-select) ----
  formEl.addEventListener('change', (e) => {
    if (e.target && e.target.name === 'animal'){
      const current = e.target;
      // Make it radio-like: uncheck others
      $$('#animal-form input[type="checkbox"]').forEach(cb => {
        if (cb !== current) cb.checked = false;
      });
      const selected = current.checked ? current.value : null;
      fetchAnimal(selected);
    }
  });

  // ---- Dropzone interactions ----
  const openFileDialog = () => fileInput.click();

  dropzone.addEventListener('click', openFileDialog);
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      openFileDialog();
    }
  });

  ['dragenter','dragover'].forEach(ev => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });
  ['dragleave','drop'].forEach(ev => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) uploadFile(file);
  });

  // ---- Health check ----
  (async () => {
    try {
      const res = await fetch('/health');
      if (res.ok) setStatus('server ok ✅');
      else setStatus('server not ready', false);
    } catch {
      setStatus('server unreachable', false);
    }
  })();
})();
