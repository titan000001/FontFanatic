# The Ransom Engine

A creative coding tool that transforms ordinary text into a chaotic, "ransom note" style visual. Built as a single-file application for ease of use and portability.

## Features

*   **Massive Font Pool:** Randomly selects from over 100 distinct, quirky Google Fonts.
*   **Chaotic Rendering:** Each character gets a unique font, size, rotation, vertical offset, and background style (paper cutout, inverted, transparent).
*   **Cyberpunk UI:** A dark, neon-accented interface with a textured "corkboard" workspace.
*   **Export to JPG:** High-resolution export functionality powered by `html2canvas`. Includes filename customization.
*   **Copy Portable HTML:** Generates a self-contained HTML snippet of your note—including only the necessary font links—ready to paste into other websites or emails.

## How to Run

1.  Download the `index.html` file.
2.  Open it in any modern web browser (Chrome, Firefox, Edge, Safari).
3.  Start typing!

## Tech Stack

*   **Core:** Vanilla HTML, JavaScript, and CSS.
*   **Styling:** Tailwind CSS (via CDN) and custom inline styles.
*   **Libraries:**
    *   [html2canvas](https://html2canvas.hertzen.com/) for image generation.
    *   [Google Fonts API](https://fonts.google.com/) for typography.

## Usage Tips

*   **Exporting:** For best results when exporting to JPG, ensure the "Preview" area is fully visible. The engine scales the output by 3x for crisp Retina-quality images.
*   **Copying HTML:** When you copy the HTML, the engine automatically detects which fonts you used and includes a specific `<link>` tag for them. This ensures your note looks correct wherever you paste it, without loading all 100 fonts.
