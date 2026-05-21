document.querySelectorAll("[data-copy-url]").forEach((button) => {
  const defaultText = button.dataset.copyDefault || button.textContent;
  const successText = button.dataset.copySuccess || "コピーしました";
  const failedText = button.dataset.copyFailed || "コピーできませんでした";

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copyValue || window.location.href);
      button.textContent = successText;
      window.setTimeout(() => {
        button.textContent = defaultText;
      }, 1600);
    } catch {
      button.textContent = failedText;
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

document.querySelectorAll("[data-diagnosis-tool]").forEach((tool) => {
  const form = tool.querySelector("[data-diagnosis-form]");
  const result = tool.querySelector("[data-diagnosis-result]");
  const title = tool.querySelector("[data-diagnosis-title]");
  const copy = tool.querySelector("[data-diagnosis-copy]");
  const points = tool.querySelector("[data-diagnosis-points]");
  const articleLink = tool.querySelector("[data-diagnosis-article]");
  const amazonLink = tool.querySelector("[data-diagnosis-amazon]");
  const shareLink = tool.querySelector("[data-diagnosis-share]");
  const copyButton = tool.querySelector("[data-diagnosis-copy]");
  const copyMessage = tool.querySelector("[data-diagnosis-copy-message]");

  if (!form || !result || !title || !copy || !points) return;

  const results = {
    chatgpt: {
      title: "まずはChatGPTが合いそうです",
      copy: "相談、文章、要約、アイデア出しを広く使いたいなら、最初の有料候補はChatGPTです。",
      points: ["使い道が広く、毎日の相談相手にしやすい", "文章作成や要約から試しやすい", "迷ったら最初の1つにしやすい"],
      amazon: "https://www.amazon.co.jp/s?k=ChatGPT+%E5%85%A5%E9%96%80&tag=aiviaai-22"
    },
    claude: {
      title: "Claudeが合いそうです",
      copy: "長い文章を読む、整える、自然な文章に直す作業が多いなら、Claudeを優先して試す価値があります。",
      points: ["長文の整理や読み込みに向いている", "落ち着いた文章づくりに使いやすい", "資料をまとめる作業と相性がいい"],
      amazon: "https://www.amazon.co.jp/s?k=Claude+AI+%E5%85%A5%E9%96%80&tag=aiviaai-22"
    },
    gemini: {
      title: "Geminiが合いそうです",
      copy: "Google検索、Gmail、Docsなどをよく使うなら、Geminiを先に試すと作業の流れに乗せやすいです。",
      points: ["Googleサービスとの相性を見やすい", "調べものから作業までつなげやすい", "AndroidやGoogle環境の人に向きやすい"],
      amazon: "https://www.amazon.co.jp/s?k=Gemini+AI+%E5%85%A5%E9%96%80&tag=aiviaai-22"
    },
    codex: {
      title: "Codexも候補に入れるべきです",
      copy: "サイト制作、コード修正、自動化まで進めたいなら、会話AIだけでなくCodexを別枠で考えると判断しやすくなります。",
      points: ["ファイルを直接扱う作業に向いている", "サイト制作や修正を進めやすい", "仕組み化したい人には強い選択肢になる"],
      amazon: "https://www.amazon.co.jp/s?k=%E7%94%9F%E6%88%90AI+%E4%BB%95%E4%BA%8B%E8%A1%93&tag=aiviaai-22"
    }
  };

  function trackEvent(name, params = {}) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params);
    }
  }

  function getWinner() {
    const score = { chatgpt: 0, claude: 0, gemini: 0, codex: 0 };
    const checked = form.querySelectorAll("input[type='radio']:checked");
    checked.forEach((input) => {
      if (score[input.value] !== undefined) score[input.value] += 1;
    });
    return Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
  }

  function renderResult(key) {
    const data = results[key] || results.chatgpt;
    title.textContent = data.title;
    copy.textContent = data.copy;
    points.innerHTML = data.points.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    result.hidden = false;
    result.dataset.result = key;
    result.dataset.shareText = `私のAI課金診断は「${data.title}」でした。\nChatGPT・Claude・Geminiで迷う人向けの1分診断です。\n${window.location.origin}/diag/?result=${encodeURIComponent(key)}&utm_source=copy&utm_medium=share&utm_campaign=ai_tool_choice`;

    const url = new URL(window.location.href);
    url.searchParams.set("result", key);
    window.history.replaceState({}, "", url);

    const articleUrl = new URL(articleLink.href);
    articleUrl.searchParams.set("result", key);
    articleLink.href = articleUrl.toString();

    if (shareLink) {
      const shareUrl = new URL(window.location.href);
      shareUrl.searchParams.set("utm_source", "x");
      shareUrl.searchParams.set("utm_medium", "share");
      shareUrl.searchParams.set("utm_campaign", "ai_tool_choice");
      shareLink.href = `https://x.com/intent/tweet?text=${encodeURIComponent(`私の診断結果: ${data.title}`)}&url=${encodeURIComponent(shareUrl.toString())}`;
    }

    if (amazonLink && data.amazon) {
      amazonLink.href = data.amazon;
    }

    trackEvent("diagnosis_result", {
      result: key,
      page_location: window.location.href
    });

    result.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderResult(getWinner());
  });

  const initialResult = new URLSearchParams(window.location.search).get("result");
  if (initialResult && results[initialResult]) {
    renderResult(initialResult);
  }

  articleLink?.addEventListener("click", () => trackEvent("diagnosis_article_click", { result: result.dataset.result || "" }));
  amazonLink?.addEventListener("click", () => trackEvent("diagnosis_amazon_click", { result: result.dataset.result || "" }));
  shareLink?.addEventListener("click", () => trackEvent("diagnosis_share_click", { result: result.dataset.result || "" }));
  copyButton?.addEventListener("click", async () => {
    const text = result.dataset.shareText || `ChatGPT・Claude・Gemini、課金するならどれ？1分診断\n${window.location.origin}/diag/`;
    try {
      await navigator.clipboard.writeText(text);
      if (copyMessage) {
        copyMessage.hidden = false;
        copyMessage.textContent = "コピーしました。XやSNS投稿に使えます。";
      }
      copyButton.textContent = "コピー済み";
      window.setTimeout(() => {
        copyButton.textContent = copyButton.dataset.copyDefault || "結果をコピー";
      }, 1600);
      trackEvent("diagnosis_copy_click", { result: result.dataset.result || "" });
    } catch {
      if (copyMessage) {
        copyMessage.hidden = false;
        copyMessage.textContent = "コピーできませんでした。URLを直接共有してください。";
      }
    }
  });
});
