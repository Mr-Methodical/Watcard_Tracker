(async function () {
  function categorize(terminal) {
    const t = terminal.toUpperCase();
    if (t.includes("MARKET")) return "Groceries";
    if (t.includes("LAUNDRY") || t.includes("WES")) return "Laundry";
    if (t.includes("PRINT") || t.includes("BROWSERS")) return "Academic";
    if (
      t.includes("MUDIES")    || t.includes("BRUBAKERS") ||
      t.includes("TH-")       || t.includes("TH ")       ||
      t.includes("LIQUID")    || t.includes("TERIYAKI")   ||
      t.includes("SUBWAY")    || t.includes("WILLIAMS")   ||
      t.includes("FRESH")     || t.includes("JUGO")       ||
      t.includes("PITA")      || t.includes("STARBUCKS")  ||
      t.includes("QUESADA")   || t.includes("DC")
    ) return "Dining";
    return "Other";
  }

  function scrapeCurrentPage() {
    const rows = document.querySelectorAll('#transaction-history-result-table tbody tr');
    const transactions = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 7) return;

      const date = cells[0].textContent.trim();
      const terminal = cells[2].textContent.trim();
      const rawAmount = cells[6].textContent.trim();

      // A deposit has no minus sign in the raw amount string (e.g. "$50.00" vs "$-9.99")
      const isDeposit = !rawAmount.includes('-');
      const amount = Math.abs(parseFloat(rawAmount.replace('$', '')));
      if (isNaN(amount)) return;

      transactions.push({ date, terminal, amount, isDeposit, category: categorize(terminal) });
    });

    return transactions;
  }

  function getNextButton() {
    return Array.from(document.querySelectorAll('button, a, input[type="button"]'))
      .find(el => /^\s*next\s*$/i.test(el.textContent.trim()));
  }

  function isDisabled(el) {
    if (el.disabled) return true;
    if (el.getAttribute('aria-disabled') === 'true') return true;
    if (el.classList.contains('disabled')) return true;
    // Bootstrap-style pagination: <li class="disabled"><a>Next</a></li>
    const li = el.closest('li');
    if (li && li.classList.contains('disabled')) return true;
    return false;
  }

  const allTransactions = [];
  const MAX_PAGES = 50;

  for (let page = 0; page < MAX_PAGES; page++) {
    allTransactions.push(...scrapeCurrentPage());

    const nextBtn = getNextButton();
    if (!nextBtn || isDisabled(nextBtn)) break;

    nextBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return allTransactions;
})();
