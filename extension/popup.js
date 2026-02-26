const btn = document.getElementById('copy-btn');
const status = document.getElementById('status');

btn.addEventListener('click', async () => {
  btn.disabled = true;
  status.textContent = 'Scraping all pages...';
  status.className = '';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    if (!result || result.length === 0) {
      status.textContent = 'No transactions found. Are you on the right page?';
      status.className = 'error';
      return;
    }

    const json = JSON.stringify(result, null, 2);
    await navigator.clipboard.writeText(json);

    status.textContent = `Copied ${result.length} transaction${result.length !== 1 ? 's' : ''} to clipboard.`;
    status.className = 'success';
  } catch (err) {
    status.textContent = `Error: ${err.message}`;
    status.className = 'error';
  } finally {
    btn.disabled = false;
  }
});
