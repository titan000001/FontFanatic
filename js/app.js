// --- Main Application Logic ---

const userInput = document.getElementById('user-input');
const ransomContent = document.getElementById('ransom-content');
const ransomOutput = document.getElementById('ransom-output'); // Container
const charCount = document.getElementById('char-count');
const btnCopyHtml = document.getElementById('btn-copy-html');
const btnExportJpg = document.getElementById('btn-export-jpg');
const filenameInput = document.getElementById('filename-input');
const statusIndicator = document.getElementById('status-indicator');

// Background Controls
const bgTextureSelect = document.getElementById('bg-texture-select');
const bgColorInput = document.getElementById('bg-color-input');
const bgImageInput = document.getElementById('bg-image-input');
const btnBgUpload = document.getElementById('btn-bg-upload');

// Initialize
window.loadFonts();

// --- 1. Rendering Engine ---

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function renderText(text) {
    ransomContent.innerHTML = ''; // Clear previous

    if (!text) {
        ransomContent.innerHTML = '<span class="font-mono text-gray-800 opacity-50 text-sm">Waiting for input...</span>';
        return;
    }

    const chars = text.split('');

    chars.forEach(char => {
        if (char === ' ') {
            const span = document.createElement('span');
            span.innerHTML = '&nbsp;';
            span.style.display = 'inline-block';
            span.style.width = '1rem';
            ransomContent.appendChild(span);
            return;
        }

        if (char === '\n') {
            const breakDiv = document.createElement('div');
            breakDiv.style.width = '100%';
            ransomContent.appendChild(breakDiv);
            return;
        }

        const span = document.createElement('span');
        span.innerText = char;
        span.className = 'inline-block shadow-sm select-none transition-transform hover:scale-110';

        // --- Random Styles ---
        const font = window.fontPool[getRandomInt(0, window.fontPool.length - 1)];
        span.style.fontFamily = `'${font}', monospace`;
        span.dataset.font = font;

        const size = getRandomFloat(1.2, 2.5);
        span.style.fontSize = `${size}rem`;

        const rot = getRandomInt(-15, 15);
        span.style.transform = `rotate(${rot}deg)`;

        const yOffset = getRandomInt(-5, 5);
        span.style.transform += ` translateY(${yOffset}px)`;

        // Background Logic
        // 20% White/Cream, 5% Black, 75% Transparent
        const bgRoll = Math.random();
        let bg, color, padding;

        if (bgRoll < 0.05) {
            bg = '#111';
            color = '#eee';
            padding = getRandomInt(1, 4);
        } else if (bgRoll < 0.25) {
            const creams = ['#fdfbf7', '#fff', '#f0f0f0', '#fffff0'];
            bg = creams[getRandomInt(0, creams.length - 1)];
            color = Math.random() > 0.5 ? '#111' : '#8b0000';
            padding = getRandomInt(1, 4);
        } else {
            bg = 'transparent';
            color = Math.random() > 0.5 ? '#111' : '#8b0000';
            padding = 0;
        }

        span.style.backgroundColor = bg;
        span.style.color = color;
        span.style.padding = `${padding}px`;

        if (bg !== 'transparent') {
            span.style.borderRadius = `${getRandomInt(0, 2)}px`;
        }

        ransomContent.appendChild(span);
    });
}

userInput.addEventListener('input', (e) => {
    renderText(e.target.value);
    charCount.innerText = `${e.target.value.length} chars`;
});

// --- 2. Background Customization ---

function updateBackground() {
    // Reset classes
    ransomOutput.className = ransomOutput.className.replace(/texture-\w+/g, '');
    ransomOutput.style.backgroundImage = '';
    ransomOutput.style.backgroundColor = '';

    const texture = bgTextureSelect.value;
    const color = bgColorInput.value;

    if (texture === 'color') {
        ransomOutput.style.backgroundColor = color;
    } else if (texture === 'custom') {
        // Handled by upload
    } else {
        ransomOutput.classList.add(`texture-${texture}`);
    }
}

bgTextureSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
        bgImageInput.click();
    } else {
        updateBackground();
    }
});

bgColorInput.addEventListener('input', updateBackground);

bgImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            ransomOutput.style.backgroundImage = `url('${evt.target.result}')`;
            ransomOutput.style.backgroundSize = 'cover';
            ransomOutput.style.backgroundPosition = 'center';
            bgTextureSelect.value = 'custom'; // Ensure select matches
        };
        reader.readAsDataURL(file);
    }
});
// Trigger upload button click
btnBgUpload.addEventListener('click', () => bgImageInput.click());


// --- 3. Export Logic ---

function getFilename(ext) {
    let filename = filenameInput.value.trim();
    if (!filename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        filename = `ransom-note-${timestamp}`;
    }
    if (!filename.toLowerCase().endsWith('.' + ext)) {
        filename += '.' + ext;
    }
    return filename;
}

btnExportJpg.addEventListener('click', () => {
    if (ransomContent.innerText.includes('Waiting for input')) return;
    const originalText = btnExportJpg.innerHTML;
    btnExportJpg.innerText = 'Capturing...';
    btnExportJpg.disabled = true;

    html2canvas(ransomOutput, {
        scale: 3,
        useCORS: true,
        backgroundColor: null
    }).then(canvas => {
        const image = canvas.toDataURL("image/jpeg", 0.9);
        const link = document.createElement('a');
        link.href = image;
        link.download = getFilename('jpg');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        btnExportJpg.innerHTML = originalText;
        btnExportJpg.disabled = false;
    });
});

btnCopyHtml.addEventListener('click', () => {
    if (userInput.value.length === 0) return;

    // Simplification for brevity: Just copying innerHTML wrapped in a div
    // Ideally we re-implement the font extraction logic here same as before
    const usedFonts = new Set();
    const spans = ransomContent.getElementsByTagName('span');
    for (let span of spans) {
        if (span.dataset.font) usedFonts.add(span.dataset.font);
    }

    let fontLinkTag = '';
    if (usedFonts.size > 0) {
        const families = Array.from(usedFonts).map(f => f.replace(/ /g, '+')).join('|');
        fontLinkTag = `<link href="https://fonts.googleapis.com/css?family=${families}&display=swap" rel="stylesheet">`;
    }

    // Get current bg style
    const computedStyle = window.getComputedStyle(ransomOutput);
    const bgStyle = `background-image: ${computedStyle.backgroundImage}; background-color: ${computedStyle.backgroundColor};`;

    const clipboardHTML = `
<!-- The Ransom Note -->
${fontLinkTag}
<div style="
    ${bgStyle}
    padding: 2rem;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.5rem;
    line-height: 1.6;
    font-family: monospace;
">
${ransomContent.innerHTML}
</div>
`;
    navigator.clipboard.writeText(clipboardHTML).then(() => {
        const originalText = btnCopyHtml.innerHTML;
        btnCopyHtml.innerHTML = `<span class="text-green-400">Copied!</span>`;
        setTimeout(() => btnCopyHtml.innerHTML = originalText, 2000);
    });
});


// --- 4. Video Modal Interface ---

const btnOpenVideoModal = document.getElementById('btn-open-video-modal');
const videoModal = document.getElementById('video-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnGenerateVideo = document.getElementById('btn-generate-video');
const fpsInput = document.getElementById('fps-input');
const fpsDisplay = document.getElementById('fps-display');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressContainer = document.getElementById('progress-container');
const modeBtns = document.querySelectorAll('.mode-btn');
let selectedMode = 'char';

btnOpenVideoModal.addEventListener('click', () => {
    if (ransomContent.innerText.includes('Waiting for input')) return;
    videoModal.classList.remove('hidden');
});
btnCloseModal.addEventListener('click', () => videoModal.classList.add('hidden'));

fpsInput.addEventListener('input', (e) => fpsDisplay.innerText = e.target.value);
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active', 'border-purple-500', 'text-purple-400'));
        btn.classList.add('active', 'border-purple-500', 'text-purple-400');
        selectedMode = btn.dataset.mode;
    });
});

btnGenerateVideo.addEventListener('click', () => {
    btnGenerateVideo.disabled = true;
    btnGenerateVideo.innerText = "Processing...";
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressText.innerText = '0%';

    window.generateVideo({
        fps: parseInt(fpsInput.value),
        mode: selectedMode,
        ransomOutput: ransomOutput,
        ransomContent: ransomContent,
        onProgress: (pct) => {
            progressBar.style.width = `${pct}%`;
            progressText.innerText = `${Math.round(pct)}%`;
        },
        onComplete: (url) => {
            const a = document.createElement('a');
            a.href = url;
            a.download = getFilename('webm');
            a.click();
            btnGenerateVideo.disabled = false;
            btnGenerateVideo.innerText = "Render Video";
            progressContainer.classList.add('hidden');
            videoModal.classList.add('hidden');
        }
    });
});
