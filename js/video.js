// --- Video Logic ---

/**
 * Generates a video based on the provided configuration.
 * Routes to specific generation functions based on 'style'.
 */
async function generateVideo(config) {
    const { style } = config;

    if (style === 'flash') {
        return generateFlashVideo(config);
    } else {
        return generateTimelapseVideo(config);
    }
}

/**
 * 1. Timelapse (Cumulative Reveal) Logic
 * Uses the High-Quality Crop logic from V2.
 */
async function generateTimelapseVideo(config) {
    const {
        fps,
        mode,
        ransomOutput,
        ransomContent,
        onProgress,
        onComplete
    } = config;

    const canvasScale = 3;
    const masterCanvas = await html2canvas(ransomOutput, {
        scale: canvasScale,
        useCORS: true,
        backgroundColor: null,
    });

    // Extract Elements and Crop Bounds
    const { elements, bounds } = getElementsAndBounds(ransomOutput, ransomContent, mode, canvasScale, masterCanvas.width, masterCanvas.height);
    const { minX, minY, cropW, cropH } = bounds;

    const videoCanvas = document.createElement('canvas');
    videoCanvas.width = cropW;
    videoCanvas.height = cropH;
    const ctx = videoCanvas.getContext('2d');

    // Background Capture
    const bgCanvas = await captureBackground(ransomOutput, ransomContent, canvasScale);

    // Setup Recorder
    const stream = videoCanvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        onComplete(URL.createObjectURL(blob));
    };

    recorder.start();

    // Draw Static Background
    ctx.drawImage(bgCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

    await new Promise(r => setTimeout(r, 200));

    // Animation Loop
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        ctx.drawImage(masterCanvas, el.x, el.y, el.w, el.h, el.x - minX, el.y - minY, el.w, el.h);
        if (onProgress) onProgress(((i + 1) / elements.length) * 100);
        await new Promise(r => setTimeout(r, 1000 / fps));
    }

    await new Promise(r => setTimeout(r, 1000));
    recorder.stop();
}

/**
 * 2. Flash (Zoom/Center) Logic
 * Shows one word at a time, zoomed in.
 */
async function generateFlashVideo(config) {
    const {
        fps,
        mode,
        ransomOutput,
        ransomContent,
        onProgress,
        onComplete
    } = config;

    const canvasScale = 3;
    const masterCanvas = await html2canvas(ransomOutput, {
        scale: canvasScale,
        useCORS: true,
        backgroundColor: null,
    });

    const { elements, bounds } = getElementsAndBounds(ransomOutput, ransomContent, mode, canvasScale, masterCanvas.width, masterCanvas.height);
    const { minX, minY, cropW, cropH } = bounds;

    // Use a fixed aspect ratio or square?
    // User asked for "Full Screen". We'll stick to the aspect ratio of the crop to avoid distortion,
    // but we can make the canvas larger or smaller. Let's match the crop size for consistency.
    const videoCanvas = document.createElement('canvas');
    videoCanvas.width = cropW;
    videoCanvas.height = cropH;
    const ctx = videoCanvas.getContext('2d');

    const bgCanvas = await captureBackground(ransomOutput, ransomContent, canvasScale);

    const stream = videoCanvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        onComplete(URL.createObjectURL(blob));
    };

    recorder.start();

    // Loop
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];

        // 1. Draw Background (Reset frame)
        ctx.drawImage(bgCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

        // 2. Draw Element Zoomed & Centered
        // Target: Center of videoCanvas
        const cx = videoCanvas.width / 2;
        const cy = videoCanvas.height / 2;

        // Scale Factor: Fit element to 80% of canvas
        const scaleX = (videoCanvas.width * 0.8) / el.w;
        const scaleY = (videoCanvas.height * 0.8) / el.h;
        const scale = Math.min(scaleX, scaleY); // Fit within bounds

        const dw = el.w * scale;
        const dh = el.h * scale;
        const dx = cx - (dw / 2);
        const dy = cy - (dh / 2);

        ctx.drawImage(masterCanvas, el.x, el.y, el.w, el.h, dx, dy, dw, dh);

        if (onProgress) onProgress(((i + 1) / elements.length) * 100);
        await new Promise(r => setTimeout(r, 1000 / fps));
    }

    await new Promise(r => setTimeout(r, 1000));
    recorder.stop();
}

// --- Helpers ---

async function captureBackground(container, content, scale) {
    const spans = content.querySelectorAll('span');
    const originalDisplay = [];
    spans.forEach((s, i) => {
        originalDisplay[i] = s.style.opacity;
        s.style.opacity = '0';
    });
    const canvas = await html2canvas(container, { scale: scale, useCORS: true });
    spans.forEach((s, i) => s.style.opacity = originalDisplay[i]);
    return canvas;
}

function getElementsAndBounds(container, content, mode, scale, maxW, maxH) {
    const containerRect = container.getBoundingClientRect();
    const elements = [];
    const spans = content.querySelectorAll('span');

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    const processRect = (rect) => {
        const rx = (rect.left - containerRect.left) * scale;
        const ry = (rect.top - containerRect.top) * scale;
        const rw = rect.width * scale;
        const rh = rect.height * scale;

        if (rx < minX) minX = rx;
        if (ry < minY) minY = ry;
        if (rx + rw > maxX) maxX = rx + rw;
        if (ry + rh > maxY) maxY = ry + rh;

        return { x: rx, y: ry, w: rw, h: rh };
    };

    if (mode === 'char') {
        spans.forEach(span => {
            if (span.innerHTML !== '&nbsp;') {
                elements.push(processRect(span.getBoundingClientRect()));
            }
        });
    } else {
        // Word Mode
        let currentWordRect = null;
        spans.forEach(span => {
            if (span.innerHTML === '&nbsp;') {
                if (currentWordRect) {
                    elements.push(currentWordRect);
                    currentWordRect = null;
                }
            } else {
                const rect = span.getBoundingClientRect();
                const processed = processRect(rect);

                if (!currentWordRect) {
                    currentWordRect = processed;
                } else {
                    const nx = Math.min(currentWordRect.x, processed.x);
                    const ny = Math.min(currentWordRect.y, processed.y);
                    const nw = Math.max(currentWordRect.x + currentWordRect.w, processed.x + processed.w) - nx;
                    const nh = Math.max(currentWordRect.y + currentWordRect.h, processed.y + processed.h) - ny;
                    currentWordRect = { x: nx, y: ny, w: nw, h: nh };
                }
            }
        });
        if (currentWordRect) elements.push(currentWordRect);
    }

    // Bounds padding
    const padding = 50 * scale;
    if (minX === Infinity) { minX = 0; minY = 0; maxX = maxW; maxY = maxH; }
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(maxW, maxX + padding);
    maxY = Math.min(maxH, maxY + padding);

    return {
        elements,
        bounds: { minX, minY, cropW: maxX - minX, cropH: maxY - minY }
    };
}

window.generateVideo = generateVideo;
