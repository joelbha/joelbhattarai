const puppeteer = require('puppeteer');
const { exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 8787;
const OUTPUT_FILE = 'Joel_Bhattarai_Portfolio.pdf';
const THUMB_DIR = path.join(__dirname, '_thumbs');

function extractThumbnails() {
    if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR);

    const videos = fs.readdirSync(__dirname).filter(f => f.endsWith('.mp4'));
    for (const video of videos) {
        const src = path.join(__dirname, video);
        const dest = path.join(THUMB_DIR, video.replace('.mp4', '.jpg'));
        try {
            execSync(
                `ffmpeg -y -i "${src}" -ss 00:00:01 -frames:v 1 "${dest}"`,
                { stdio: 'ignore' }
            );
            console.log(`Thumbnail: ${video} -> ${dest}`);
        } catch (e) {
            console.warn(`Could not extract thumbnail from ${video}`);
        }
    }
}

function startServer() {
    return new Promise((resolve, reject) => {
        const server = exec(
            `npx serve -l ${PORT} --no-clipboard`,
            { cwd: __dirname, detached: true }
        );

        const tryResolve = (data) => {
            if (data.includes('Accepting connections') || data.includes(String(PORT))) {
                resolve(server);
            }
        };

        server.stdout.on('data', tryResolve);
        server.stderr.on('data', tryResolve);

        setTimeout(() => resolve(server), 4000);

        server.on('error', reject);
    });
}

(async () => {
    extractThumbnails();
    const server = await startServer();

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });

        await page.goto(`http://localhost:${PORT}/projects.html`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await page.evaluate(() => {
            const nav = document.querySelector('nav');
            if (nav) nav.remove();
            document.body.style.paddingTop = '0';

            const header = document.querySelector('.projects-header h1');
            if (header) header.textContent = 'Project Portfolio';

            document.querySelectorAll('video').forEach((video) => {
                const source = video.querySelector('source');
                if (!source) return;
                const videoFile = source.getAttribute('src').split('#')[0];
                const thumbFile = '_thumbs/' + videoFile.replace('.mp4', '.jpg');

                const img = document.createElement('img');
                img.src = thumbFile;
                img.alt = video.closest('figure')?.querySelector('figcaption')?.textContent || '';
                img.style.cssText = 'width:100%; border-radius:15px; object-fit:contain;';
                video.replaceWith(img);
            });
        });

        await page.addStyleTag({
            content: `
                body { background: white; }
                .projects-wide {
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    max-width: 100% !important;
                    width: 100% !important;
                    padding: 20px 40px !important;
                    margin: 0 !important;
                }
                .project-card,
                .project-card:nth-child(even) {
                    flex-direction: row !important;
                    align-items: center;
                    gap: 30px;
                    margin-bottom: 50px !important;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .project-image {
                    flex: 0 0 35% !important;
                    max-width: 300px !important;
                }
                .project-image img,
                .project-image figure img {
                    height: auto !important;
                    max-height: 220px;
                }
                .project-content {
                    flex: 1 !important;
                    max-width: none !important;
                    text-align: left !important;
                }
                .btn {
                    color: #232931 !important;
                    border: 2px solid #4ecca3;
                }
            `
        });

        await page.pdf({
            path: OUTPUT_FILE,
            format: 'Letter',
            printBackground: true,
            margin: { top: '0.5in', bottom: '0.5in', left: '0.4in', right: '0.4in' }
        });

        console.log(`Portfolio PDF generated: ${OUTPUT_FILE}`);
        await browser.close();
    } finally {
        try {
            process.kill(-server.pid);
        } catch (_) {
            server.kill();
        }
        fs.rmSync(THUMB_DIR, { recursive: true, force: true });
        process.exit(0);
    }
})();
