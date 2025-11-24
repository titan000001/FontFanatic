// --- Video Logic ---

async function generateVideo(config) {
    const {
        fps,
        mode,
        ransomOutput,
        ransomContent,
        onProgress,
        onComplete
    } = config;

    // 1. Capture the "Master" Image (State: Completed Note)
    const canvasScale = 3; // High res for video
    // Use html2canvas to capture the visual state of the DOM
    const masterCanvas = await html2canvas(ransomOutput, {
        scale: canvasScale,
        useCORS: true,
        backgroundColor: null,
    });

    // 2. Identify Element Positions and Crop Box
    const containerRect = ransomOutput.getBoundingClientRect();
    const elements = [];
    const spans = ransomContent.querySelectorAll('span');

    // Track min/max for crop logic
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Helper to process a rect
    const processRect = (rect) => {
        // Relative to container
        const rx = (rect.left - containerRect.left) * canvasScale;
        const ry = (rect.top - containerRect.top) * canvasScale;
        const rw = rect.width * canvasScale;
        const rh = rect.height * canvasScale;

        // Update bounds (add some padding logic later)
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
                    // Union
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

    // 3. Setup Cropped Canvas
    const padding = 50 * canvasScale;

    // If no text, default to full
    if (minX === Infinity) { minX = 0; minY = 0; maxX = masterCanvas.width; maxY = masterCanvas.height; }

    // Apply padding
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(masterCanvas.width, maxX + padding);
    maxY = Math.min(masterCanvas.height, maxY + padding);

    const cropW = maxX - minX;
    const cropH = maxY - minY;

    const videoCanvas = document.createElement('canvas');
    videoCanvas.width = cropW;
    videoCanvas.height = cropH;
    const ctx = videoCanvas.getContext('2d');

    // 4. Background Capture (Empty State)
    // Hide text to get clean background
    const originalDisplay = [];
    spans.forEach((s, i) => {
        originalDisplay[i] = s.style.opacity;
        s.style.opacity = '0';
    });
    const bgCanvas = await html2canvas(ransomOutput, { scale: canvasScale, useCORS: true });
    // Restore text
    spans.forEach((s, i) => s.style.opacity = originalDisplay[i]);

    // 5. Start Recording
    const stream = videoCanvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    const chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        onComplete(url);
    };

    recorder.start();

    // 6. Animation Loop
    // Draw Background (Cropped)
    ctx.drawImage(bgCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

    await new Promise(r => setTimeout(r, 200)); // Init delay

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];

        // Draw Chunk (Cropped coordinates)
        // Source: el.x, el.y (from master canvas)
        // Dest: el.x - minX, el.y - minY (shifted by crop)
        ctx.drawImage(masterCanvas, el.x, el.y, el.w, el.h, el.x - minX, el.y - minY, el.w, el.h);

        // Progress
        if (onProgress) onProgress(((i + 1) / elements.length) * 100);

        // Wait
        await new Promise(r => setTimeout(r, 1000 / fps));
    }

    await new Promise(r => setTimeout(r, 1000)); // End delay
    recorder.stop();
}

window.generateVideo = generateVideo;
