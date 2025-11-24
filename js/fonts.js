// --- 1. The "Expensive" Font Pool ---
const fontPool = [
    "Creepster", "Lobster", "Rye", "Monoton", "Press Start 2P", "Special Elite", "Abril Fatface",
    "Bangers", "Fredoka One", "Righteous", "Bungee", "Indie Flower", "Shadows Into Light",
    "Pacifico", "Amatic SC", "Permanent Marker", "Gloria Hallelujah", "Courgette", "Satisfy",
    "Great Vibes", "Sacramento", "Orbitron", "Black Ops One", "Russo One", "Luckiest Guy",
    "VT323", "Ultra", "Pinyon Script", "Cinzel", "Parisienne", "Audiowide", "Kaushan Script",
    "Rock Salt", "Chewy", "Sigmar One", "Carter One", "Freckle Face", "Love Ya Like A Sister",
    "Finger Paint", "Nosifer", "Eater", "Butcherman", "Frijole", "Metal Mania", "Flavors",
    "Spicy Rice", "Ranchers", "Caesar Dressing", "Shojumaru", "Trade Winds", "Ewert",
    "Sancreek", "UnifrakturMaguntia", "Pirata One", "New Rocker", "Jolly Lodger", "Piedra",
    "Geostar", "Limelight", "Fontdiner Swanky", "Irish Grover", "Knewave", "Ribeye Marrow",
    "Chicle", "Fascinate Inline", "Vast Shadow", "Graduate", "Stint Ultra Expanded", "Codystar",
    "Faster One", "Henny Penny", "Snowburst One", "Emblema One", "Plaster", "Sirin Stencil",
    "Stardos Stencil", "Allerta Stencil", "Wallpoet", "Bungee Shade", "Bungee Inline", "Megrim",
    "Pompiere", "Coming Soon", "Just Another Hand", "Covered By Your Grace", "Walter Turncoat",
    "Gochi Hand", "Patrick Hand", "Schoolbell", "Sunshiney", "Sniglet", "Slackey", "Kranky",
    "Crushed", "Smokum", "Unkempt", "Crafty Girls", "Aclonica", "Rakkas", "Yatra One"
];

// --- Font Loading Logic ---
function loadFonts() {
    const BATCH_SIZE = 15;
    const head = document.getElementsByTagName('head')[0];
    let loadedCount = 0;

    for (let i = 0; i < fontPool.length; i += BATCH_SIZE) {
        const batch = fontPool.slice(i, i + BATCH_SIZE);
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        // Encode font names for URL (spaces to +)
        const families = batch.map(font => font.replace(/ /g, '+')).join('|');
        link.href = `https://fonts.googleapis.com/css?family=${families}&display=swap`;
        head.appendChild(link);
        loadedCount += batch.length;
    }
    console.log(`Requested ${loadedCount} fonts from Google.`);
    document.getElementById('status-indicator').innerText = "Ransom Engine Ready";
}

// Export for module use if needed, but we are just loading scripts sequentially
window.loadFonts = loadFonts;
window.fontPool = fontPool;
