/* PRINCIPIA document export — dependency-free Office Open XML DOCX writer. */
(function () {
  'use strict';

  const encoder = new TextEncoder();
  const MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  function xmlEscape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
    }[c]));
  }
  function paragraph(text, style) {
    const pStyle = style ? '<w:pPr><w:pStyle w:val="' + style + '"/></w:pPr>' : '';
    return '<w:p>' + pStyle + '<w:r><w:t xml:space="preserve">' + xmlEscape(text) + '</w:t></w:r></w:p>';
  }
  function documentXml(text) {
    const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    const body = [paragraph('PRINCIPIA · TÀI LIỆU LỚP HỌC', 'Title')]
      .concat(lines.map(line => paragraph(line || ' '))).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body>' + body +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>' +
      '</w:body></w:document>';
  }
  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
      crc ^= bytes[i];
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function u16(value) { return [value & 255, (value >>> 8) & 255]; }
  function u32(value) { return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]; }
  function concat(parts) {
    const size = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(size);
    let offset = 0;
    parts.forEach(part => { output.set(part, offset); offset += part.length; });
    return output;
  }
  function zipStore(files) {
    const local = [];
    const central = [];
    let offset = 0;
    const stamp = new Date();
    const dosTime = (stamp.getHours() << 11) | (stamp.getMinutes() << 5) | Math.floor(stamp.getSeconds() / 2);
    const dosDate = ((Math.max(1980, stamp.getFullYear()) - 1980) << 9) | ((stamp.getMonth() + 1) << 5) | stamp.getDate();

    files.forEach(file => {
      const name = encoder.encode(file.name);
      const data = encoder.encode(file.content);
      const crc = crc32(data);
      const header = concat([
        new Uint8Array([0x50, 0x4b, 0x03, 0x04]), new Uint8Array(u16(20)),
        new Uint8Array(u16(0x0800)), new Uint8Array(u16(0)),
        new Uint8Array(u16(dosTime)), new Uint8Array(u16(dosDate)),
        new Uint8Array(u32(crc)), new Uint8Array(u32(data.length)),
        new Uint8Array(u32(data.length)), new Uint8Array(u16(name.length)),
        new Uint8Array(u16(0)), name
      ]);
      local.push(header, data);
      const centralHeader = concat([
        new Uint8Array([0x50, 0x4b, 0x01, 0x02]), new Uint8Array(u16(20)),
        new Uint8Array(u16(20)), new Uint8Array(u16(0x0800)),
        new Uint8Array(u16(0)), new Uint8Array(u16(dosTime)),
        new Uint8Array(u16(dosDate)), new Uint8Array(u32(crc)),
        new Uint8Array(u32(data.length)), new Uint8Array(u32(data.length)),
        new Uint8Array(u16(name.length)), new Uint8Array(u16(0)),
        new Uint8Array(u16(0)), new Uint8Array(u16(0)),
        new Uint8Array(u32(0)), new Uint8Array(u32(offset)), name
      ]);
      central.push(centralHeader);
      offset += header.length + data.length;
    });

    const centralBytes = concat(central);
    const localBytes = concat(local);
    const end = concat([
      new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
      new Uint8Array(u16(0)), new Uint8Array(u16(0)),
      new Uint8Array(u16(files.length)), new Uint8Array(u16(files.length)),
      new Uint8Array(u32(centralBytes.length)), new Uint8Array(u32(localBytes.length)),
      new Uint8Array(u16(0))
    ]);
    return new Blob([localBytes, centralBytes, end], { type: MIME });
  }
  function createDocx(text) {
    const files = [
      {
        name: '[Content_Types].xml',
        content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
          '</Types>'
      },
      {
        name: '_rels/.rels',
        content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
          '</Relationships>'
      },
      { name: 'word/document.xml', content: documentXml(text) }
    ];
    return zipStore(files);
  }
  function download() {
    const notes = document.getElementById('ppmNotes');
    if (!notes) return;
    const blob = createDocx(notes.value);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PRINCIPIA-Class-Notes.docx';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function printNotes() {
    const notes = document.getElementById('ppmNotes');
    const section = notes?.closest('section');
    if (!notes || !section) return;
    const content = document.createElement('div');
    content.className = 'principia-print-content';
    content.textContent = notes.value || 'Chưa có ghi chú.';
    section.classList.add('principia-print-target');
    section.appendChild(content);
    document.body.classList.add('principia-print-notes');
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      section.classList.remove('principia-print-target');
      content.remove();
      document.body.classList.remove('principia-print-notes');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 120000);
  }
  function installPrintMode() {
    if (document.getElementById('principiaPrintNotesStyles')) return;
    const style = document.createElement('style');
    style.id = 'principiaPrintNotesStyles';
    style.textContent = '@media print{body.principia-print-notes *{visibility:hidden!important}body.principia-print-notes #principiaProMastery,body.principia-print-notes #principiaProMastery .ppm-shell,body.principia-print-notes #principiaProMastery .ppm-content,body.principia-print-notes #principiaProMastery .principia-print-target,body.principia-print-notes #principiaProMastery .principia-print-target .principia-print-content{visibility:visible!important}body.principia-print-notes #principiaProMastery{position:absolute!important;inset:0!important;display:block!important;padding:0!important;background:#fff!important;color:#111!important;overflow:visible!important}body.principia-print-notes #principiaProMastery .ppm-shell{max-width:none!important;min-height:0!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#fff!important;color:#111!important}body.principia-print-notes #principiaProMastery .ppm-head,body.principia-print-notes #principiaProMastery .ppm-tabs,body.principia-print-notes #principiaProMastery .principia-print-target textarea,body.principia-print-notes #principiaProMastery .principia-print-target .ppm-actions{display:none!important}body.principia-print-notes #principiaProMastery .ppm-content{padding:0!important}body.principia-print-notes #principiaProMastery .ppm-content>section:not(.principia-print-target){display:none!important}body.principia-print-notes #principiaProMastery .principia-print-target{display:block!important;padding:18px!important;border:0!important;background:#fff!important;color:#111!important}body.principia-print-notes .principia-print-content{display:block!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important;font:11pt/1.65 Arial,sans-serif!important;color:#111!important}}.principia-print-content{display:none}';
    document.head.appendChild(style);
    document.addEventListener('click', event => {
      const button = event.target.closest('[data-print-notes]');
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      printNotes();
    }, true);
  }
  function addButton() {
    const notes = document.querySelector('#principiaProMastery #ppmNotes');
    const actions = notes?.closest('section')?.querySelector('.ppm-actions');
    if (!actions || actions.querySelector('[data-principia-docx]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.principiaDocx = 'true';
    button.textContent = 'Xuất DOCX';
    button.addEventListener('click', download);
    actions.appendChild(button);
  }
  function init() {
    installPrintMode();
    addButton();
    const observer = new MutationObserver(addButton);
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  window.PrincipiaDocumentExport = { createDocx };
})();