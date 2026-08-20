import React, { useState, useMemo, useRef } from "react";
import {
  Check, Plus, Paperclip, X, Heading2, Bold, List, ListChecks, Code2, Link2,
  Image as ImageIcon, Table2, FilePlus2, PencilLine, Loader2, ListTree, FileEdit,
} from "lucide-react";
import type { Entry, KnowledgeType, Attachment } from "../types";
import { INTERFACES, IC_LIBRARY, KNOWLEDGE_TYPES, TAG_LIBRARY, TYPE_DESCRIPTION } from "../data";
import { uid, fileIcon, renderContent, fileToImageDataUrl, TraceDivider, TagChip } from "../lib";

/* --------------------------------------------------------------------------
 * A <select> of known values plus a one-click way to add a value that isn't
 * in the list yet — used for Interface and IC, which are open-ended
 * vocabularies that still benefit from picking rather than free typing.
 * ------------------------------------------------------------------------ */
function SelectAddField({
  value, onChange, options, placeholder, adding, onStartAdd, newValue, onNewValueChange, onCommit, onCancel, optionTitle,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  adding: boolean;
  onStartAdd: () => void;
  newValue: string;
  onNewValueChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  /** Optional per-option hover hint, e.g. a one-line description of a knowledge type. */
  optionTitle?: (option: string) => string | undefined;
}) {
  if (adding) {
    return (
      <div className="select-add-row">
        <input
          autoFocus
          value={newValue}
          onChange={(e) => onNewValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); onCommit(); }
            if (e.key === "Escape") { e.preventDefault(); onCancel(); }
          }}
          placeholder="Type the new value…"
        />
        <button type="button" className="select-add-confirm" onClick={onCommit} aria-label="Add"><Check size={15} /></button>
        <button type="button" className="select-add-cancel" onClick={onCancel} aria-label="Cancel"><X size={15} /></button>
      </div>
    );
  }
  return (
    <div className="select-add-row">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o} title={optionTitle?.(o)}>{o}</option>)}
      </select>
      <button type="button" className="select-add-btn" onClick={onStartAdd} title="Add a new value"><Plus size={15} /></button>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Images are stored inline in the markdown as data-URIs, but a raw data-URI is
 * unreadable in the editor. So in the textarea we show a short token —
 * `![alt](img:imgN)` — and keep the actual data behind the scenes. We collapse
 * on load/edit and expand back to real data-URIs for the preview and on save.
 * ------------------------------------------------------------------------ */
function collapseImages(md: string): { text: string; map: Record<string, string>; count: number } {
  const map: Record<string, string> = {};
  let n = 0;
  const text = md.replace(/(!\[[^\]]*\]\()(data:[^)]+)(\))/g, (_all, pre, uri, post) => {
    const id = `img${++n}`;
    map[id] = uri;
    return `${pre}img:${id}${post}`;
  });
  return { text, map, count: n };
}
function expandImages(md: string, map: Record<string, string>): string {
  return md.replace(/\(img:([a-zA-Z0-9]+)\)/g, (all, id) => (map[id] ? `(${map[id]})` : all));
}

/* --------------------------------------------------------------------------
 * Pasting a table: convert a copied Excel / Google Sheets / web table into the
 * editor's markdown table syntax, preserving rows and columns.
 * ------------------------------------------------------------------------ */
function toMarkdownTable(rows: string[][]): string {
  const cols = Math.max(1, ...rows.map((r) => r.length));
  const esc = (s: string) => (s ?? "").replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
  const pad = (r: string[]) => Array.from({ length: cols }, (_, i) => esc(r[i] ?? ""));
  const line = (a: string[]) => `| ${a.join(" | ")} |`;
  const sep = `| ${Array.from({ length: cols }, () => "---").join(" | ")} |`;
  return [line(pad(rows[0])), sep, ...rows.slice(1).map((r) => line(pad(r)))].join("\n");
}

/** Returns a markdown table if the clipboard holds tabular data, else null. */
function clipboardTable(cd: DataTransfer): string | null {
  const html = cd.getData("text/html");
  if (html && /<table[\s>]/i.test(html)) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const rows = Array.from(doc.querySelectorAll("tr"))
      .map((tr) => Array.from(tr.querySelectorAll("th,td")).map((c) => (c.textContent || "").replace(/\s+/g, " ").trim()))
      .filter((r) => r.length > 0);
    if (rows.length) return toMarkdownTable(rows);
  }
  // Excel / Sheets also put tab-separated plain text on the clipboard.
  const text = cd.getData("text/plain");
  if (text && text.includes("\t")) {
    const rows = text.replace(/\r/g, "").replace(/\n+$/, "").split("\n").map((r) => r.split("\t"));
    if (rows.length && rows.some((r) => r.length > 1)) return toMarkdownTable(rows);
  }
  return null;
}

export function AddKnowledge({
  onSave, existingICs, existingInterfaces = [], existingTypes = [], initial, onCancel,
}: {
  onSave: (entry: Entry) => Promise<void>;
  existingICs: string[];
  /** Interfaces already used across the user's entries (for suggestions). */
  existingInterfaces?: string[];
  /** Knowledge types already used across the user's entries (for suggestions). */
  existingTypes?: string[];
  /** When provided, the form edits this entry instead of creating a new one. */
  initial?: Entry | null;
  onCancel?: () => void;
}) {
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [iface, setIface] = useState(initial?.interface ?? "");
  const [ic, setIc] = useState(initial?.ic ?? "");
  const [project, setProject] = useState(initial?.project ?? "");
  // One knowledge type per entry. Switching type while an entry is in progress
  // prompts to save first, then starts a fresh form for the newly picked type.
  const [type, setType] = useState<KnowledgeType | null>(initial?.types?.[0] ?? null);
  const [pendingType, setPendingType] = useState<KnowledgeType | null>(null);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  // Seed the editor once, collapsing any inline data-URI images into tokens.
  const seed = useRef(collapseImages(initial?.content ?? ""));
  const [content, setContent] = useState(seed.current.text);
  const [images, setImages] = useState<Record<string, string>>(seed.current.map);
  const imgCounter = useRef(seed.current.count);
  const [attachments, setAttachments] = useState<Attachment[]>(initial?.attachments ?? []);
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Interface / IC pickers: a dropdown of known values plus an inline "add
  // new" affordance. Newly added values are kept in session state so they're
  // selectable immediately, even before the entry is saved.
  const [ifaceAdding, setIfaceAdding] = useState(false);
  const [ifaceNewVal, setIfaceNewVal] = useState("");
  const [extraIfaces, setExtraIfaces] = useState<string[]>([]);
  const [icAdding, setIcAdding] = useState(false);
  const [icNewVal, setIcNewVal] = useState("");
  const [extraICs, setExtraICs] = useState<string[]>([]);
  const [typeAdding, setTypeAdding] = useState(false);
  const [typeNewVal, setTypeNewVal] = useState("");
  const [extraTypes, setExtraTypes] = useState<string[]>([]);
  const [imgBusy, setImgBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Undo / redo history for the content editor (native undo breaks on a
  // controlled textarea, so we manage our own stacks).
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const lastSnap = useRef(0);

  const snapshot = (val: string) => {
    const s = undoStack.current;
    if (s[s.length - 1] !== val) s.push(val);
    if (s.length > 300) s.shift();
    redoStack.current = [];
  };
  // Typing: coalesce keystrokes into one undo step per burst / word boundary.
  const onContentChange = (next: string) => {
    const now = Date.now();
    const prev = content;
    const boundary = next.length > prev.length && /\s$/.test(next);
    if (now - lastSnap.current > 600 || boundary || Math.abs(next.length - prev.length) > 1) {
      snapshot(prev);
      lastSnap.current = now;
    }
    setContent(next);
  };
  const undo = () => {
    if (!undoStack.current.length) return;
    redoStack.current.push(content);
    lastSnap.current = 0;
    setContent(undoStack.current.pop()!);
    requestAnimationFrame(() => taRef.current?.focus());
  };
  const redo = () => {
    if (!redoStack.current.length) return;
    undoStack.current.push(content);
    lastSnap.current = 0;
    setContent(redoStack.current.pop()!);
    requestAnimationFrame(() => taRef.current?.focus());
  };
  const onEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && (e.key === "z" || e.key === "Z")) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if (mod && (e.key === "y" || e.key === "Y")) { e.preventDefault(); redo(); }
  };

  const icOptions = useMemo(
    () => Array.from(new Set([...IC_LIBRARY, ...existingICs, ...extraICs, ...(ic ? [ic] : [])])).sort(),
    [existingICs, extraICs, ic]
  );
  const ifaceOptions = useMemo(
    () => Array.from(new Set([...INTERFACES, ...existingInterfaces, ...extraIfaces, ...(iface ? [iface] : [])])).sort((a, b) => a.localeCompare(b)),
    [existingInterfaces, extraIfaces, iface]
  );
  const typeOptions = useMemo(
    () => Array.from(new Set([...KNOWLEDGE_TYPES, ...existingTypes, ...extraTypes, ...(type ? [type] : [])])).sort((a, b) => a.localeCompare(b)),
    [existingTypes, extraTypes, type]
  );

  const commitNewIface = () => {
    const v = ifaceNewVal.trim();
    if (v) { setExtraIfaces((prev) => (prev.includes(v) ? prev : [...prev, v])); setIface(v); }
    setIfaceAdding(false); setIfaceNewVal("");
  };
  const commitNewIc = () => {
    const v = icNewVal.trim();
    if (v) { setExtraICs((prev) => (prev.includes(v) ? prev : [...prev, v])); setIc(v); }
    setIcAdding(false); setIcNewVal("");
  };

  // True when the form holds work that would be lost by switching type.
  const hasInput = () =>
    !!(title.trim() || iface.trim() || ic.trim() || project.trim() ||
       content.trim() || tags.length || attachments.length);

  const resetForm = () => {
    setTitle(""); setIface(""); setIc(""); setProject(""); setType(null);
    setTags([]); setTagInput("");
    setContent(""); setImages({}); imgCounter.current = 0; setAttachments([]);
    undoStack.current = []; redoStack.current = []; lastSnap.current = 0;
    setIfaceAdding(false); setIfaceNewVal(""); setIcAdding(false); setIcNewVal("");
    setTypeAdding(false); setTypeNewVal("");
    setAttempted(false);
  };

  // Picking a type: switching away from an in-progress entry asks to save first.
  const requestType = (t: KnowledgeType) => {
    if (t === type) return;
    if (type !== null && hasInput()) { setPendingType(t); return; }
    setType(t);
  };
  const commitNewType = () => {
    const v = typeNewVal.trim();
    if (v) { setExtraTypes((prev) => (prev.includes(v) ? prev : [...prev, v])); requestType(v); }
    setTypeAdding(false); setTypeNewVal("");
  };

  const addTag = (t: string) => {
    const v = t.trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  };

  const insertSnippet = (snippet: string) => {
    snapshot(content);
    lastSnap.current = 0;
    const el = taRef.current;
    if (!el) { setContent((c) => c + snippet); return; }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = content.slice(0, start) + snippet + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + snippet.length; });
  };

  const insertImage = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please choose an image file (PNG, JPG, GIF…)."); return; }
    setError("");
    setImgBusy(true);
    try {
      const dataUrl = await fileToImageDataUrl(file);
      const alt = file.name.replace(/\.[^.]+$/, "") || "image";
      const id = `img${++imgCounter.current}`;
      setImages((prev) => ({ ...prev, [id]: dataUrl }));
      insertSnippet(`\n![${alt}](img:${id})\n`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't insert that image.");
    } finally {
      setImgBusy(false);
    }
  };

  const removeImage = (id: string) => {
    // Drop the image token from the text (keep its data so undo can restore it).
    snapshot(content);
    lastSnap.current = 0;
    setContent((c) => c.replace(new RegExp(`\\n?!\\[[^\\]]*\\]\\(img:${id}\\)`, "g"), ""));
  };

  // Paste an Excel/Sheets table, or an image, straight into the editor.
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!e.clipboardData) return;
    const table = clipboardTable(e.clipboardData);
    if (table) { e.preventDefault(); insertSnippet(`\n${table}\n`); return; }
    const img = Array.from(e.clipboardData.items).find((it) => it.type.startsWith("image/"));
    if (img) {
      const file = img.getAsFile();
      if (file) { e.preventDefault(); insertImage(file); }
    }
  };
  const handleEditorDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const file = Array.from(e.dataTransfer?.files || []).find((f) => f.type.startsWith("image/"));
    if (file) { e.preventDefault(); insertImage(file); }
  };

  const handleFiles = (fileList: FileList) => {
    const items: Attachment[] = Array.from(fileList).map((f) => ({
      name: f.name,
      type: (f.name.split(".").pop() || "").toLowerCase(),
    }));
    setAttachments((prev) => [...prev, ...items]);
  };

  // Persist the current entry. Returns whether it saved so callers (like the
  // switch-type prompt) can chain follow-up actions on success.
  const doSave = async (): Promise<boolean> => {
    if (!title.trim() || !iface) {
      setAttempted(true);
      setError("Title and Interface are required.");
      return false;
    }
    setAttempted(false);
    setError("");
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const entry: Entry = {
      id: initial?.id ?? uid(),
      ownerId: initial?.ownerId,
      title: title.trim(), interface: iface, ic: ic.trim(), project: project.trim(),
      types: type ? [type] : ["Reference"], tags, content: expandImages(content, images), attachments,
      createdDate: initial?.createdDate ?? today, modifiedDate: today,
      createdBy: initial?.createdBy ?? "",
    };
    try {
      await onSave(entry);
      if (isEdit) { onCancel?.(); return true; }
      resetForm();
      setSaved(true);
      setTimeout(() => setSaved(false), 3200);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => { void doSave(); };

  // Switch-type prompt actions.
  const savePending = async () => {
    const next = pendingType;
    const ok = await doSave();
    if (ok) { setPendingType(null); if (next) setType(next); }
    // On failure the popup stays open; the reason is shown inside it.
  };
  const discardPending = () => {
    const next = pendingType;
    resetForm();
    setPendingType(null);
    if (next) setType(next);
  };

  return (
    <div className="page">
      <div className="page-head page-head-row">
        <div className="page-title">
          <span className="page-title-icon">{isEdit ? <PencilLine size={19} /> : <FilePlus2 size={19} />}</span>
          <h1>{isEdit ? "Edit Knowledge" : "Add Knowledge"}</h1>
        </div>
        <div className="page-head-actions">
          {isEdit && <button className="btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>}
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={15} className="spin" /> : <Check size={15} />}
            {saving ? "Saving…" : isEdit ? "Save changes" : "Save entry"}
          </button>
        </div>
      </div>
      <TraceDivider />

      {error && <div className="banner error">{error}</div>}

      <section className="panel">
        <div className="panel-head"><ListTree size={14} /><h2>Details</h2></div>
        <div className="form-grid">
          <div className={"field span-2" + (attempted && !title.trim() ? " invalid" : "")}>
            <label>Title <span className="req">*</span></label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ethernet differential pair impedance requirement"
            />
          </div>

          <div className="field-quad">
            <div className={"field" + (attempted && !iface ? " invalid" : "")}>
              <label>Interface <span className="req">*</span></label>
              <SelectAddField
                value={iface} onChange={setIface} options={ifaceOptions}
                placeholder="Select interface…"
                adding={ifaceAdding} onStartAdd={() => setIfaceAdding(true)}
                newValue={ifaceNewVal} onNewValueChange={setIfaceNewVal}
                onCommit={commitNewIface} onCancel={() => { setIfaceAdding(false); setIfaceNewVal(""); }}
              />
            </div>

            <div className="field">
              <label>IC</label>
              <SelectAddField
                value={ic} onChange={setIc} options={icOptions}
                placeholder="Select IC (optional)…"
                adding={icAdding} onStartAdd={() => setIcAdding(true)}
                newValue={icNewVal} onNewValueChange={setIcNewVal}
                onCommit={commitNewIc} onCancel={() => { setIcAdding(false); setIcNewVal(""); }}
              />
            </div>

            <div className="field">
              <label>Project</label>
              <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Optional — e.g. Camera ECU Gen2" />
            </div>

            <div className="field">
              <label>Knowledge Type</label>
              <SelectAddField
                value={type ?? ""} onChange={(v) => requestType(v)} options={typeOptions}
                placeholder="Select type…"
                adding={typeAdding} onStartAdd={() => setTypeAdding(true)}
                newValue={typeNewVal} onNewValueChange={setTypeNewVal}
                onCommit={commitNewType} onCancel={() => { setTypeAdding(false); setTypeNewVal(""); }}
                optionTitle={(o) => TYPE_DESCRIPTION[o]}
              />
            </div>
          </div>

          <div className="field span-2">
            <label>Tags</label>
            <div className="tag-input-row">
              {tags.map((t) => <TagChip key={t} label={t} onRemove={() => setTags(tags.filter((x) => x !== t))} />)}
              <input
                className="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
                placeholder="Type a tag, press Enter…"
              />
            </div>
            <div className="quick-tags">
              {TAG_LIBRARY.filter((t) => !tags.includes(t)).map((t) => (
                <button type="button" key={t} className="quick-tag" onClick={() => addTag(t)}><Plus size={11} />{t}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><FileEdit size={14} /><h2>Content</h2></div>
        <div className="editor">
          <div className="editor-toolbar">
            <button type="button" title="Heading" onClick={() => insertSnippet("\n## Heading\n")}><Heading2 size={15} /></button>
            <button type="button" title="Bold" onClick={() => insertSnippet("**bold text**")}><Bold size={15} /></button>
            <button type="button" title="Bullet list" onClick={() => insertSnippet("\n- item\n")}><List size={15} /></button>
            <button type="button" title="Checklist" onClick={() => insertSnippet("\n- [ ] item\n")}><ListChecks size={15} /></button>
            <button type="button" title="Code block" onClick={() => insertSnippet("\n```\ncode\n```\n")}><Code2 size={15} /></button>
            <button type="button" title="Link" onClick={() => insertSnippet("[link text](https://)")}><Link2 size={15} /></button>
            <button
              type="button" title="Insert image" disabled={imgBusy}
              onClick={() => imgInputRef.current?.click()}
            >
              {imgBusy ? <Loader2 size={15} className="spin" /> : <ImageIcon size={15} />}
            </button>
            <button type="button" title="Insert table" onClick={() => insertSnippet("\n| Column A | Column B | Column C |\n| --- | --- | --- |\n| value | value | value |\n| value | value | value |\n")}><Table2 size={15} /></button>
            <input
              ref={imgInputRef} type="file" accept="image/*" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) insertImage(f); e.target.value = ""; }}
            />
          </div>
          <div className="editor-body">
            <textarea
              ref={taRef}
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              onKeyDown={onEditorKeyDown}
              onPaste={handlePaste}
              onDrop={handleEditorDrop}
              onDragOver={(e) => { if (e.dataTransfer?.types.includes("Files")) e.preventDefault(); }}
              placeholder="Write requirement details, checklist items, root cause, fix… Use the toolbar for headings, lists, tables, and code. Paste a table from Excel and it becomes a formatted table. Ctrl+Z / Ctrl+Y to undo/redo."
            />
            <div className="editor-preview">
              <div className="editor-preview-label">Preview</div>
              {content.trim() ? renderContent(expandImages(content, images)) : <div className="editor-preview-empty">Preview appears here as you type.</div>}
            </div>
          </div>
          {Object.entries(images).filter(([id]) => content.includes(`img:${id}`)).length > 0 && (
            <div className="editor-images">
              <span className="editor-images-label"><ImageIcon size={12} /> Images in this entry</span>
              <div className="editor-images-row">
                {Object.entries(images)
                  .filter(([id]) => content.includes(`img:${id}`))
                  .map(([id, uri]) => (
                    <div className="editor-image-thumb" key={id}>
                      <img src={uri} alt="" />
                      <span className="editor-image-tag">{id}</span>
                      <button type="button" onClick={() => removeImage(id)} aria-label="Remove image"><X size={12} /></button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><Paperclip size={14} /><h2>Attachments</h2></div>
        <label className="dropzone">
          <Paperclip size={16} />
          <span>Drop files or click to attach — PDF, Excel, Word, PNG, JPG, ZIP</span>
          <input type="file" multiple hidden onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        </label>
        {attachments.length > 0 && (
          <div className="attachment-list">
            {attachments.map((a, idx) => (
              <div className="attachment-item" key={idx}>
                {fileIcon(a.type)}<span>{a.name}</span>
                <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} aria-label="Remove attachment"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="form-actions">
        {isEdit && <button className="btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>}
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Save entry"}
        </button>
      </div>

      {/* Switching type with an entry in progress — save, discard, or stay. */}
      {pendingType && (
        <div
          className="modal-overlay no-print"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setPendingType(null); }}
        >
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="switch-title">
            <div className="modal-icon"><FilePlus2 size={20} /></div>
            <h2 id="switch-title" className="modal-title">Save this entry first?</h2>
            <div className="modal-message">
              You have an unsaved <strong>{type}</strong> entry. Save it, then start a
              fresh <strong>{pendingType}</strong> entry — or discard your changes.
            </div>
            {error && <div className="modal-error">{error}</div>}
            <div className="modal-actions spread">
              <button type="button" className="btn-ghost" onClick={() => setPendingType(null)} disabled={saving}>
                Cancel
              </button>
              <div className="grow">
                <button type="button" className="btn-danger-ghost" onClick={discardPending} disabled={saving}>
                  Discard
                </button>
                <button type="button" className="btn-primary" onClick={() => void savePending()} disabled={saving}>
                  {saving ? <Loader2 size={15} className="spin" /> : <Check size={15} />}
                  {saving ? "Saving…" : "Save & switch"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation toast pinned to the bottom of the screen after a save. */}
      {saved && (
        <div className="toast-wrap no-print" role="status" aria-live="polite">
          <div className="toast">
            <span className="toast-check"><Check size={16} /></span>
            Entry saved to the knowledge base.
          </div>
        </div>
      )}
    </div>
  );
}
