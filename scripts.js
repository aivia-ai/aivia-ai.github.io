document.querySelectorAll("[data-copy-url]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      button.textContent = "URLをコピーしました";
      window.setTimeout(() => {
        button.textContent = "URLをコピー";
      }, 1600);
    } catch {
      button.textContent = "コピーできませんでした";
    }
  });
});

const searchForm = document.querySelector("[data-search-form]");
const searchInput = document.querySelector("[data-search-input]");
const searchResults = document.querySelector("[data-search-results]");
const searchIndexNode = document.getElementById("aivia-search-index") || document.getElementById("topiq-search-index");
const topicButtons = document.querySelectorAll("[data-topic-search]");
const signalTabButtons = document.querySelectorAll("[data-signal-tab]");
const signalPanels = document.querySelectorAll("[data-signal-panel]");
const opinionPolls = document.querySelectorAll("[data-opinion-poll]");
const readMoreSections = document.querySelectorAll("[data-read-more]");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

if (searchForm && searchInput && searchResults && searchIndexNode) {
  const searchIndex = JSON.parse(searchIndexNode.textContent || "[]");

  function setSearchUrl(query) {
    const url = new URL(window.location.href);
    if (!query) {
      url.searchParams.delete("q");
    } else {
      url.searchParams.set("q", query);
    }
    window.history.replaceState({}, "", url);
  }

  function runSearch(query) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      searchResults.hidden = true;
      searchResults.innerHTML = "";
      return;
    }

    const matches = searchIndex.filter((item) => {
      const haystack = `${item.title} ${item.summary} ${item.category} ${(item.tags || []).join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    }).slice(0, 8);

    if (!matches.length) {
      searchResults.hidden = false;
      searchResults.innerHTML = "<strong>検索結果</strong><p>該当する記事はまだありません。</p>";
      return;
    }

    searchResults.hidden = false;
    searchResults.innerHTML = `<strong>検索結果</strong><ul>${matches.map((item) => `
      <li>
        <a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a>
        <span>${escapeHtml(item.category)} - ${escapeHtml(item.summary)}</span>
      </li>
    `).join("")}</ul>`;
  }

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    runSearch(query);
    setSearchUrl(query);
  });

  topicButtons.forEach((button) => {
    button.addEventListener("click", () => {
      searchInput.value = button.dataset.topicSearch || "";
      searchForm.requestSubmit();
      searchInput.focus();
    });
  });

  const initialQuery = new URLSearchParams(window.location.search).get("q");
  if (initialQuery) {
    searchInput.value = initialQuery;
    runSearch(initialQuery);
  }
}

signalTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.dataset.signalTab;
    signalTabButtons.forEach((tabButton) => {
      tabButton.classList.toggle("is-active", tabButton === button);
    });
    signalPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.signalPanel === selected);
    });
  });
});

opinionPolls.forEach((poll) => {
  const storageKey = `aivia-poll:${poll.dataset.opinionPoll}`;
  const buttons = poll.querySelectorAll("[data-poll-option]");
  const saved = window.localStorage.getItem(storageKey);

  function select(button) {
    buttons.forEach((item) => {
      item.classList.toggle("is-selected", item === button);
      item.setAttribute("aria-pressed", item === button ? "true" : "false");
    });
  }

  buttons.forEach((button) => {
    button.setAttribute("aria-pressed", "false");
    if (saved && button.dataset.pollOption === saved) {
      select(button);
    }
    button.addEventListener("click", () => {
      window.localStorage.setItem(storageKey, button.dataset.pollOption);
      select(button);
    });
  });
});

readMoreSections.forEach((section) => {
  const preview = section.querySelector("[data-read-more-preview]");
  const full = section.querySelector("[data-read-more-full]");
  const openButton = section.querySelector("[data-read-more-toggle]");
  const closeButton = section.querySelector("[data-read-more-close]");

  if (!preview || !full || !openButton) return;

  function setExpanded(isExpanded) {
    preview.hidden = isExpanded;
    full.hidden = !isExpanded;
    openButton.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    if (closeButton) {
      closeButton.hidden = !isExpanded;
      closeButton.setAttribute("aria-expanded", isExpanded ? "true" : "false");
    }
  }

  openButton.addEventListener("click", () => setExpanded(true));
  if (closeButton) {
    closeButton.addEventListener("click", () => setExpanded(false));
  }
});
