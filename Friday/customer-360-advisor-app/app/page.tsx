"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: React.ReactNode; label?: string };

const examples = [
  "有记录客户 home country code 的标签吗？",
  "Lufthansa account binding 有哪些枚举值？",
  "最近预订渠道标签是什么意思？",
  "帮我预测下个月酒店入住率",
];

const examplesEn = [
  "Is there an attribute for a customer's home country code?",
  "What are the Lufthansa account binding enum values?",
  "What does the most recent booking channel attribute mean?",
];

function DotGrid() {
  return <div className="dot-grid" aria-hidden="true" />;
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function InlineAnswer({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return <>{parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return <span key={index}>{part}</span>;
  })}</>;
}

function AgentAnswer({ text, pending }: { text: string; pending?: boolean }) {
  if (pending) return <p className="agent-pending">{text}</p>;

  const lines = text.trim().split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }

    if (/^#{1,3}\s+/.test(line)) {
      blocks.push(<h3 key={`heading-${index}`}><InlineAnswer text={line.replace(/^#{1,3}\s+/, "")} /></h3>);
      index += 1;
      continue;
    }

    if (/^(?:[-*]|\d+\.)\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^(?:[-*]|\d+\.)\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^(?:[-*]|\d+\.)\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul className="answer-facts" key={`list-${index}`}>
          {items.map((item, itemIndex) => {
            const match = item.match(/^([^:：]{1,28})[:：]\s*(.+)$/);
            return <li key={itemIndex} className={match ? (/attribute|标签|字段/i.test(match[1]) ? "attribute-fact" : "") : "plain-fact"}>
              {match ? <><span>{match[1]}</span><b><InlineAnswer text={match[2]} /></b></> : <InlineAnswer text={item} />}
            </li>;
          })}
        </ul>,
      );
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(?:[-*]|\d+\.|#{1,3}\s+)/.test(lines[index].trim())) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p className={blocks.length === 0 ? "answer-lead" : ""} key={`paragraph-${index}`}><InlineAnswer text={paragraph.join(" ")} /></p>);
  }

  return <div className="agent-answer">{blocks}</div>;
}

type Conversation = { id: string; title: string; prompts: string[]; answers?: string[]; createdAt: number; starred?: boolean };

const STORAGE_KEY = "customer360-demo-conversations";

function blankConversation(): Conversation {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, title: "New conversation", prompts: [], createdAt: Date.now() };
}

function welcomeMessage(language: "en" | "zh"): Message {
  const english = language === "en";
  return {
    role: "assistant",
    label: english ? "Customer 360 Data Advisor" : "Customer 360 数据顾问",
    content: (
      <div className="welcome-copy">
        <span className="welcome-kicker">ATTRIBUTE INTELLIGENCE</span>
        <h1>{english ? <>Customer 360<br />Attribute Advisor</> : <>Customer 360<br />专属数据顾问</>}</h1>
        <p>{english ? "Ask about attribute availability, business definitions, calculation logic, update frequency, data latency, or enumerated values. Answers are grounded exclusively in the Customer 360 Attribute Dictionary." : "查询标签、业务口径、统计逻辑、更新周期、数据时效性或枚举值。回答仅依据 Customer 360 Attribute Dictionary。"}</p>
      </div>
    ),
  };
}

export default function Home() {
  const initial = useRef<Conversation>({ id: "initial-conversation", title: "New conversation", prompts: [], createdAt: 0 });
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([initial.current]);
  const [activeId, setActiveId] = useState(initial.current.id);
  const [hydrated, setHydrated] = useState(false);
  const [uiLanguage, setUiLanguage] = useState<"en" | "zh">("en");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ conversationId: string; answerIndex: number } | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((item) => item.id === activeId) ?? conversations[0];
  const messages = useMemo(() => {
    const result: Message[] = [welcomeMessage(uiLanguage)];
    for (const [index, prompt] of (active?.prompts ?? []).entries()) {
      const answer = active?.answers?.[index];
      const isPending = pending?.conversationId === active?.id && pending.answerIndex === index;
      result.push(
        { role: "user", content: prompt },
        {
          role: "assistant",
          label: uiLanguage === "en" ? "Customer 360 Attribute Advisor" : "Customer 360 标签顾问",
          content: <AgentAnswer pending={isPending} text={answer || (isPending ? (uiLanguage === "en" ? "Searching the Attribute Dictionary…" : "正在检索 Attribute Dictionary…") : (uiLanguage === "en" ? "No answer was saved for this earlier demo message." : "此条历史演示消息未保存回答。"))} />,
        },
      );
    }
    return result;
  }, [active, uiLanguage, pending]);

  const copy = uiLanguage === "en" ? {
    delete: "Delete current",
    new: "New conversation",
    conversations: "Conversations",
    examples: "Example questions",
    empty: "Empty conversation",
    questions: "questions",
    oneQuestion: "question",
    placeholder: "Ask a Customer 360 attribute question",
    source: "Demo mode · Grounded exclusively in the Customer 360 Attribute Dictionary",
    helpful: "Helpful",
    copy: "Copy",
    grounded: "Based on Attribute Dictionary",
    currentNew: "New conversation",
    star: "Star",
    unstar: "Remove star",
    remove: "Delete",
  } : {
    delete: "删除当前对话",
    new: "新对话",
    conversations: "对话",
    examples: "示例问题",
    empty: "空白会话",
    questions: "个问题",
    oneQuestion: "个问题",
    placeholder: "询问 Customer 360 标签问题",
    source: "演示模式 · 回答仅依据 Customer 360 Attribute Dictionary",
    helpful: "有帮助",
    copy: "复制",
    grounded: "依据 Attribute Dictionary",
    currentNew: "新对话",
    star: "星标",
    unstar: "取消星标",
    remove: "删除",
  };

  const localizedExamples = uiLanguage === "en" ? examplesEn : examples.slice(0, 3);
  const displayTitle = (title: string) => title === "新对话" || title === "New conversation" ? copy.currentNew : title;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Conversation[];
        if (Array.isArray(parsed) && parsed.length) {
          setConversations(parsed);
          setActiveId(parsed[0].id);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations, hydrated]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeId]);

  function persist(next: Conversation[]) {
    setConversations(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function submit(event: FormEvent, value = query) {
    event.preventDefault();
    const clean = value.trim();
    if (!clean || !active || pending) return;
    const conversationId = active.id;
    const answerIndex = active.prompts.length;
    const next = conversations.map((item) => item.id === conversationId ? ({
      ...item,
      title: item.prompts.length ? item.title : clean.slice(0, 24),
      prompts: [...item.prompts, clean],
      answers: [...(item.answers ?? []), ""],
    }) : item);
    persist(next);
    setPending({ conversationId, answerIndex });
    setConnectionError(null);
    setQuery("");
    try {
      const response = await fetch("http://127.0.0.1:8787/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean }),
      });
      const data = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !data.answer) throw new Error(data.error || "Agent request failed");
      setConversations((current) => current.map((item) => {
        if (item.id !== conversationId) return item;
        const answers = [...(item.answers ?? [])];
        answers[answerIndex] = data.answer!;
        return { ...item, answers };
      }));
    } catch {
      const errorText = uiLanguage === "en"
        ? "Unable to reach the local Customer 360 Agent. Start it with “npm run agent” and try again."
        : "无法连接本地 Customer 360 Agent。请运行“npm run agent”后重试。";
      setConnectionError(errorText);
      setConversations((current) => current.map((item) => {
        if (item.id !== conversationId) return item;
        const answers = [...(item.answers ?? [])];
        answers[answerIndex] = errorText;
        return { ...item, answers };
      }));
    } finally {
      setPending(null);
    }
  }

  function createConversation() {
    const next = blankConversation();
    persist([next, ...conversations]);
    setActiveId(next.id);
    setQuery("");
  }

  function deleteConversation(id: string) {
    const remaining = conversations.filter((item) => item.id !== id);
    if (remaining.length) {
      persist(remaining);
      if (activeId === id) setActiveId(remaining[0].id);
    } else {
      const replacement = blankConversation();
      persist([replacement]);
      setActiveId(replacement.id);
    }
    setOpenMenuId(null);
    setQuery("");
  }

  function toggleStar(id: string) {
    persist(conversations.map((item) => item.id === id ? { ...item, starred: !item.starred } : item));
    setOpenMenuId(null);
  }

  function askExample(example: string) {
    submit({ preventDefault() {} } as FormEvent, example);
  }

  return (
    <main className="app-shell">
      <DotGrid />
      <header className="topbar">
        <div className="brand"><div className="deloitte-digital" aria-label="Deloitte Digital"><strong>Deloitte<span>.</span></strong><em>Digital</em></div></div>
        <div className="top-actions">
          <div className="language-switch" role="group" aria-label="Interface language">
            <button className={uiLanguage === "en" ? "active" : ""} onClick={() => setUiLanguage("en")}>EN</button>
            <button className={uiLanguage === "zh" ? "active" : ""} onClick={() => setUiLanguage("zh")}>中文</button>
          </div>
          <button className="header-action primary" data-testid="new-conversation" onClick={createConversation} aria-label={copy.new}><span>＋</span>{copy.new}</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-heading"><span>{copy.conversations}</span><button onClick={createConversation} aria-label={copy.new}>＋</button></div>
          <nav className="conversation-list" aria-label={copy.conversations}>
            {conversations.map((item) => (
              <div className={`conversation-row ${item.id === activeId ? "active" : ""}`} key={item.id}>
                <button className="conversation-select" onClick={() => { setActiveId(item.id); setOpenMenuId(null); }}>
                  <span className={`conversation-icon ${item.starred ? "starred" : ""}`}>{item.starred ? "★" : "○"}</span>
                  <span><b>{displayTitle(item.title)}</b><small>{item.prompts.length ? `${item.prompts.length} ${item.prompts.length === 1 ? copy.oneQuestion : copy.questions}` : copy.empty}</small></span>
                </button>
                <button className="conversation-menu-trigger" data-testid={`menu-${item.id}`} aria-label={uiLanguage === "en" ? "Conversation options" : "对话选项"} onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}>•••</button>
                {openMenuId === item.id && (
                  <div className="conversation-menu" role="menu">
                    <button role="menuitem" onClick={() => toggleStar(item.id)}><span>{item.starred ? "☆" : "★"}</span>{item.starred ? copy.unstar : copy.star}</button>
                    <button role="menuitem" className="menu-delete" onClick={() => deleteConversation(item.id)}><span>⌫</span>{copy.remove}</button>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <section className="sidebar-examples">
            <span>{copy.examples}</span>
            {localizedExamples.map((example) => <button key={example} onClick={() => askExample(example)}>{example}<i>↗</i></button>)}
          </section>

          <div className="knowledge-status"><i /><span><b>Customer 360 Dictionary</b><small>296 attributes · Read only</small></span></div>
        </aside>

        <section className="chat-panel">
          <div className="chat-scroll" aria-live="polite" ref={chatRef}>
            <div className="conversation-tag"><span>{displayTitle(active?.title ?? copy.currentNew)}</span><small>{active?.prompts.length ? `${active.prompts.length} ${active.prompts.length === 1 ? copy.oneQuestion : copy.questions}` : copy.empty}</small></div>
            {messages.map((message, index) => (
              <article className={`message ${message.role} ${index === 0 ? "welcome-message" : ""}`} key={index}>
                {message.role === "assistant" ? <div className="assistant-avatar"><BrandMark /></div> : <div className="user-avatar">{uiLanguage === "en" ? "You" : "你"}</div>}
                <div className="message-body">
                  {message.label && <div className="message-label"><i />{message.label}</div>}
                  <div className="bubble">{message.content}</div>
                  {message.role === "assistant" && index > 0 && <div className="message-tools"><button>{copy.helpful}</button><button>{copy.copy}</button><span>{copy.grounded}</span></div>}
                </div>
              </article>
            ))}
          </div>

          <div className="composer-wrap">
            <form className="composer" onSubmit={submit}>
              <textarea value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submit(e); }} placeholder={copy.placeholder} rows={1} aria-label={copy.placeholder} disabled={Boolean(pending)} />
              <button type="submit" disabled={!query.trim() || Boolean(pending)} aria-label={uiLanguage === "en" ? "Send question" : "发送问题"}>↑</button>
            </form>
            <p className={connectionError ? "connection-error" : ""}>{connectionError || copy.source}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
