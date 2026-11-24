// Printing itself cannot be driven here, so the trial plays Sheets' part:
// when a print starts, Sheets appends <style class="offline-printing-css"> and
// <div class="printing-canvas-container"> to <body>, and removes both as soon
// as window.print() returns. Yab renders the print a moment later, so the
// plugin must put the same two nodes back, keep them off the screen, and take
// them away again once the print is over and the person touches the page.
export default {
  async act(page, { sleep }) { await sleep(1500); },
  async expect(page, { sleep }) {
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.className = 'offline-printing-css';
      const pages = document.createElement('div');
      pages.className = 'printing-canvas-container';
      pages.append(document.createElement('canvas'));
      document.body.append(style, pages);
      window.__trial = { style, pages };
    });
    await sleep(200);
    await page.evaluate(() => { window.__trial.pages.remove(); window.__trial.style.remove(); });
    await sleep(400);
    const back = await page.evaluate(() => {
      const { style, pages } = window.__trial;
      return { style: style.isConnected, pages: pages.isConnected, hidden: getComputedStyle(pages).visibility === 'hidden' };
    });
    // A click before the print pass has finished must not take the pages away.
    await page.mouse.click(5, 5);
    await sleep(200);
    const early = await page.evaluate(() => window.__trial.pages.isConnected);
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await page.mouse.click(5, 5);
    await sleep(300);
    const after = await page.evaluate(() => window.__trial.pages.isConnected || window.__trial.style.isConnected);
    const problems = [];
    if (!back.style || !back.pages) problems.push(`not put back (style ${back.style}, pages ${back.pages})`);
    if (!back.hidden) problems.push('the held pages show on screen');
    if (!early) problems.push('a click before the print finished removed the pages');
    if (after) problems.push('the pages stayed after the print and a click');
    return problems.length ? { ok: false, detail: problems.join('; ') } : { ok: true, detail: 'print pages put back after Sheets removed them, hidden on screen, removed after the print' };
  },
};
