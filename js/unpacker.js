// Anti-Theft Domain Lock
try {
  if (typeof window !== 'undefined' && window.location) {
    var _proto = window.location.protocol;
    var _host = window.location.hostname;
    if (_proto !== 'file:' && _host && _host !== 'localhost' && _host !== '127.0.0.1' && _host !== '0.0.0.0' && !_host.endsWith('.local')) {
      var _allowed = ['supertools.gracely.my.id', 'gracely.my.id', 'gracely011.github.io'];
      var _ok = _allowed.some(function(d) { return _host === d || _host.endsWith('.' + d); });
      if (!_ok) {
        window.location.replace('https://supertools.gracely.my.id/');
      }
    }
  }
} catch (_) {}

// ==========================================
// SUPERTOOLS JAVASCRIPT UNPACKER CONTROLLER
// Engine by MatthewFL (http://matthewfl.com)
// ==========================================

function unPack(code) {
  function indent(lines) {
    try {
      let tabs = 0, old = -1, add = '';
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].indexOf("{") !== -1) tabs++;
        if (lines[i].indexOf("}") !== -1) tabs--;

        if (old !== tabs) {
          old = tabs;
          add = "";
          let temp = old;
          while (temp > 0) {
            add += "  ";
            temp--;
          }
          old = tabs;
        }

        lines[i] = add + lines[i];
      }
    } catch (e) {
      // ignore
    }
    return lines;
  }

  let unpackedResult = "";
  const env = {
    eval: function (c) {
      unpackedResult = c;
    },
    window: {},
    document: {}
  };

  try {
    const trimmed = (code + "").trim();
    if (trimmed.startsWith("eval")) {
      eval("with(env) {" + trimmed + "}");
    } else {
      unpackedResult = trimmed;
    }
  } catch (err) {
    // Fallback: Coba ganti eval dengan String
    try {
      eval("unpackedResult = String" + (code + "").trim().slice(4));
    } catch (e2) {
      throw new Error("Gagal mengurai kode eval packer: " + err.message);
    }
  }

  let formatted = (unpackedResult + "")
    .replace(/;/g, ";\n")
    .replace(/{/g, " {\n")
    .replace(/}/g, "\n}\n")
    .replace(/\n;\n/g, ";\n")
    .replace(/\n\n+/g, "\n");

  let lines = formatted.split("\n");
  lines = indent(lines);
  return lines.join("\n").trim();
}


// State manajemen Minifikasi / Formatting
var originalFormattedCode = '';
var isMinifiedState = false;

function getMinifiedState() { return isMinifiedState; }

// Minifier JavaScript Aman (Client-Side & Zero-Dependency)
function safeMinifyJS(code) {
  if (!code || !code.trim()) return '';
  
  let result = '';
  let i = 0;
  const len = code.length;
  let inString = false;
  let stringChar = '';
  
  const isWordChar = (c) => /^[a-zA-Z0-9_$]$/.test(c);
  
  while (i < len) {
    const ch = code[i];
    const next = code[i + 1];
    
    // 1. String literal (single, double, backtick)
    if (inString) {
      result += ch;
      if (ch === '\\') {
        if (i + 1 < len) {
          i++;
          result += code[i];
        }
      } else if (ch === stringChar) {
        inString = false;
      }
      i++;
      continue;
    }
    
    // 2. Komentar satu baris // ...
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < len && code[i] !== '\n' && code[i] !== '\r') {
        i++;
      }
      continue;
    }
    
    // 3. Komentar multi baris /* ... */
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < len && !(code[i] === '*' && code[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }
    
    // 4. Deteksi string baru
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
      result += ch;
      i++;
      continue;
    }
    
    // 5. Spasi / Tab / Baris Baru
    if (/\s/.test(ch)) {
      let j = i;
      while (j < len && /\s/.test(code[j])) {
        j++;
      }
      const prevChar = result[result.length - 1];
      const nextChar = code[j];
      
      if (prevChar && nextChar) {
        if (isWordChar(prevChar) && isWordChar(nextChar)) {
          result += ' ';
        } else if ((prevChar === '+' && nextChar === '+') || (prevChar === '-' && nextChar === '-')) {
          result += ' ';
        }
      }
      i = j;
      continue;
    }
    
    result += ch;
    i++;
  }
  
  return result.trim();
}

function updateMinifyButtonUI(minified) {
  const label = document.getElementById('unpacker-minify-label');
  const icon = document.getElementById('unpacker-minify-icon');
  if (label) label.textContent = minified ? 'Format JS' : 'Minify JS';
  if (icon) {
    if (minified) {
      icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;
    } else {
      icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;
    }
  }
}

function toggleUnpackMinify() {
  const outputEl = document.getElementById('unpacker-output');
  const outputStatsEl = document.getElementById('unpacker-output-stats');
  const execTimeEl = document.getElementById('unpacker-exec-time');

  const currentVal = outputEl ? outputEl.value : '';
  if (!currentVal || !currentVal.trim()) {
    showUnpackerToast('Belum ada kode untuk diminifikasi!', false);
    return;
  }

  const startTime = performance.now();

  if (!isMinifiedState) {
    // 1. Jalankan Minifikasi
    originalFormattedCode = currentVal;
    const minified = safeMinifyJS(currentVal);
    const duration = (performance.now() - startTime).toFixed(2);

    outputEl.value = minified;
    isMinifiedState = true;
    updateMinifyButtonUI(true);

    const savedPercent = originalFormattedCode.length > 0
      ? Math.max(0, ((originalFormattedCode.length - minified.length) / originalFormattedCode.length * 100)).toFixed(1)
      : 0;

    const lineCount = minified.split('\n').length;
    if (outputStatsEl) {
      outputStatsEl.textContent = minified.length.toLocaleString('id-ID') + ' Karakter (' + lineCount + ' Baris - Hemat ' + savedPercent + '%)';
    }
    if (execTimeEl) {
      execTimeEl.innerHTML = '&#9889; Minifikasi dalam <b>' + duration + ' ms</b>';
    }
    showUnpackerToast('Kode berhasil diminifikasi (Hemat ' + savedPercent + '%)!');
  } else {
    // 2. Kembalikan ke Format Terindentasi
    const duration = (performance.now() - startTime).toFixed(2);
    outputEl.value = originalFormattedCode;
    isMinifiedState = false;
    updateMinifyButtonUI(false);

    const lineCount = originalFormattedCode.split('\n').length;
    if (outputStatsEl) {
      outputStatsEl.textContent = originalFormattedCode.length.toLocaleString('id-ID') + ' Karakter (' + lineCount + ' Baris)';
    }
    if (execTimeEl) {
      execTimeEl.innerHTML = '&#9889; Diformat dalam <b>' + duration + ' ms</b>';
    }
    showUnpackerToast('Kode berhasil dirapikan (Formatted)!');
  }
}

const UNPACKER_SAMPLE = `eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--){d[e(c)]=k[c]||e(c)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('2 5(0){1 3=4.b;6(0<=7){8 9 e("a-a f g h 7")}i 3*0*0}2 j(0,k){1 l=0*k;m.n("o: "+l);p l}',26,26,'radius|const|function|pi|Math|hitungLuasLingkaran|if||throw|new|Jari|PI|||Error|jari|harus|lebih|return|hitungVolumeSilinder|tinggi|volume|console|log|Volume|alert'.split('|'),0,{}))`;

function showUnpackerToast(msg, isSuccess = true) {
  const t = document.getElementById('unpacker-toast');
  if (!t) return;
  t.innerHTML = (isSuccess ? '&#10004; ' : '&#9888; ') + msg;
  t.className = 'fixed bottom-6 right-6 px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium z-50 transition-all transform duration-300 ' +
    (isSuccess ? 'bg-gray-900 text-white' : 'bg-red-600 text-white');
  t.style.opacity = '1';
  t.style.transform = 'translateY(0)';
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(10px)';
  }, 2500);
}

function updateUnpackerInputStats() {
  const inputEl = document.getElementById('unpacker-input');
  const statsEl = document.getElementById('unpacker-input-stats');
  if (inputEl && statsEl) {
    statsEl.textContent = inputEl.value.length.toLocaleString('id-ID') + ' Karakter';
  }
}

function doUnPackProcess() {
  const inputEl = document.getElementById('unpacker-input');
  const outputEl = document.getElementById('unpacker-output');
  const outputStatsEl = document.getElementById('unpacker-output-stats');
  const execTimeEl = document.getElementById('unpacker-exec-time');

  const rawInput = inputEl ? inputEl.value.trim() : '';
  if (!rawInput) {
    showUnpackerToast('Tempelkan kode eval(function(p,a,c,k,e,r)...) terlebih dahulu!', false);
    if (inputEl) inputEl.focus();
    return;
  }

  const startTime = performance.now();
  try {
    const result = unPack(rawInput);
    const duration = (performance.now() - startTime).toFixed(2);

    if (outputEl) outputEl.value = result;
    originalFormattedCode = result;
    isMinifiedState = false;
    updateMinifyButtonUI(false);

    const inLen = rawInput.length;
    const outLen = result.length;
    const lineCount = result.split('\n').length;

    if (outputStatsEl) {
      outputStatsEl.textContent = outLen.toLocaleString('id-ID') + ' Karakter (' + lineCount + ' Baris)';
    }
    if (execTimeEl) {
      execTimeEl.innerHTML = '&#9889; Selesai dalam <b>' + duration + ' ms</b> (' + inLen + ' &rarr; ' + outLen + ' B)';
    }
    showUnpackerToast('Kode berhasil di-unpack!');
  } catch (err) {
    showUnpackerToast('Gagal unpack script: ' + err.message, false);
  }
}

function formatUnpackedCode() {
  toggleUnpackMinify();
}

function loadUnpackerSample() {
  const inputEl = document.getElementById('unpacker-input');
  if (inputEl) {
    inputEl.value = UNPACKER_SAMPLE;
    updateUnpackerInputStats();
    showUnpackerToast('Contoh kode eval packer dimuat!');
    doUnPackProcess();
  }
}

function clearUnpacker() {
  const inputEl = document.getElementById('unpacker-input');
  const outputEl = document.getElementById('unpacker-output');
  const outputStatsEl = document.getElementById('unpacker-output-stats');
  const execTimeEl = document.getElementById('unpacker-exec-time');

  if (inputEl) inputEl.value = '';
  if (outputEl) outputEl.value = '';
  originalFormattedCode = '';
  isMinifiedState = false;
  updateMinifyButtonUI(false);
  if (outputStatsEl) outputStatsEl.textContent = 'Siap';
  if (execTimeEl) execTimeEl.textContent = 'Waktu: -';
  updateUnpackerInputStats();
  showUnpackerToast('Area kerja dibersihkan');
}

function copyUnpackedCode() {
  const outputEl = document.getElementById('unpacker-output');
  if (!outputEl || !outputEl.value) {
    showUnpackerToast('Tidak ada kode untuk disalin!', false);
    return;
  }
  navigator.clipboard.writeText(outputEl.value).then(() => {
    showUnpackerToast('Hasil deobfuscasi disalin ke clipboard!');
  }).catch(() => {
    outputEl.select();
    document.execCommand('copy');
    showUnpackerToast('Hasil deobfuscasi disalin!');
  });
}

function pasteUnpackerCode() {
  const inputEl = document.getElementById('unpacker-input');
  if (!inputEl) return;
  navigator.clipboard.readText().then(text => {
    inputEl.value = text;
    updateUnpackerInputStats();
    showUnpackerToast('Kode berhasil ditempel dari clipboard');
  }).catch(() => {
    inputEl.focus();
    showUnpackerToast('Gunakan Ctrl+V untuk menempel kode', false);
  });
}

function downloadUnpackedCode() {
  const outputEl = document.getElementById('unpacker-output');
  if (!outputEl || !outputEl.value) {
    showUnpackerToast('Tidak ada kode untuk diunduh!', false);
    return;
  }
  const blob = new Blob([outputEl.value], { type: 'application/javascript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'unpacked.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showUnpackerToast('File unpacked.js berhasil diunduh');
}

function handleUnpackerUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const inputEl = document.getElementById('unpacker-input');
    if (inputEl) {
      inputEl.value = e.target.result;
      updateUnpackerInputStats();
      showUnpackerToast('File ' + file.name + ' berhasil dimuat');
    }
  };
  reader.readAsText(file);
}

// Inisialisasi Event Listener
document.addEventListener('DOMContentLoaded', () => {
  const inputEl = document.getElementById('unpacker-input');
  if (inputEl) {
    inputEl.addEventListener('input', updateUnpackerInputStats);
    inputEl.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        doUnPackProcess();
      }
    });
  }
});
