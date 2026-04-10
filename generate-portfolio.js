const puppeteer = require('puppeteer');
const { exec } = require('child_process');

const PORT = 8787;
const OUTPUT_FILE = 'Joel_Bhattarai_Portfolio.pdf';

function startServer() {
    return new Promise((resolve, reject) => {
        const server = exec(`npx serve -l ${PORT} -s --no-clipboard`, { cwd: __dirname });

        server.stderr.on('data', (data) => {
            if (data.includes('Accepting connections')) {
                resolve(server);
            }
        });

        setTimeout(() => resolve(server), 3000);

        server.on('error', reject);
    });
}

(async () => {
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

            document.querySelectorAll('video').forEach((video) => {
                const caption = video.closest('figure')?.querySelector('figcaption')?.textContent || '';
                const placeholder = document.createElement('div');
                placeholder.style.cssText = `
                    width: 100%; height: 250px; border-radius: 15px;
                    background: #e8e8e8; display: flex; align-items: center;
                    justify-content: center; flex-direction: column; gap: 8px;
                    color: #666; font-style: italic; font-size: 0.95rem;
                `;
                placeholder.innerHTML = `
                    <span style="font-size: 2rem;">&#9654;</span>
                    <span>Video — see live site for playback</span>
                `;
                video.replaceWith(placeholder);
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
                .project-card {
                    margin-bottom: 60px !important;
                    page-break-inside: avoid;
                    break-inside: avoid;
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
        server.kill();
    }
})();
