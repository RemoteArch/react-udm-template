const { useState, useMemo, useCallback, useRef } = React;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg:        "#0c0c0f",
  surface:   "#131316",
  surface2:  "#1b1b20",
  surface3:  "#232328",
  border:    "#2c2c34",
  border2:   "#38383f",
  text:      "#e4e4ec",
  textSub:   "#8a8a9e",
  textMute:  "#55555f",
  accent:    "#4f7ef8",
  accentDim: "#1e2d5a",
  green:     "#30c97a",
  greenDim:  "#0f3322",
  red:       "#f05252",
  redDim:    "#3a1212",
  yellow:    "#e8a23a",
  yellowDim: "#3a2a0a",
  blue:      "#3ab4f5",
};

const S = {
  app: {
    display: "flex", flexDirection: "column", height: "100vh", width: "100vw",
    background: C.bg, color: C.text, fontFamily: "'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 13, overflow: "hidden",
  },
  topbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: C.surface, borderBottom: `1px solid ${C.border}`,
    padding: "0 20px", height: 44, flexShrink: 0,
  },
  topbarLogo: {
    display: "flex", alignItems: "center", gap: 10,
    color: C.text, fontWeight: 700, fontSize: 14, letterSpacing: "0.05em",
  },
  topbarRight: { display: "flex", alignItems: "center", gap: 16, color: C.textSub, fontSize: 12 },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  sidebar: {
    width: 220, background: C.surface, borderRight: `1px solid ${C.border}`,
    display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden",
  },
  sidebarSection: { padding: "16px 0 8px" },
  sidebarLabel: {
    padding: "0 16px 6px", fontSize: 10, fontWeight: 700,
    color: C.textMute, letterSpacing: "0.12em", textTransform: "uppercase",
  },
  sidebarItem: (active) => ({
    display: "flex", alignItems: "center", gap: 10, padding: "7px 16px",
    cursor: "pointer", color: active ? C.text : C.textSub,
    background: active ? C.surface3 : "transparent",
    borderLeft: `2px solid ${active ? C.accent : "transparent"}`,
    fontSize: 12, userSelect: "none",
  }),
  sidebarItemIcon: { width: 16, textAlign: "center", fontSize: 13 },
  sidebarDivider: { borderBottom: `1px solid ${C.border}`, margin: "8px 0" },
  main: { flex: 1, overflow: "auto", display: "flex", flexDirection: "column" },
  content: { flex: 1, padding: 24, overflow: "auto" },
  pageTitle: { fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 },
  pageSub: { fontSize: 12, color: C.textSub, marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: C.textMute, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 },
  card: {
    background: C.surface, border: `1px solid ${C.border}`,
    padding: 16, borderRadius: 4,
  },
  cardTitle: { fontWeight: 700, color: C.text, marginBottom: 4, fontSize: 13 },
  cardSub: { color: C.textSub, fontSize: 11, lineHeight: 1.5 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  workbench: { display: "flex", gap: 16, alignItems: "flex-start" },
  leftPanel: { width: 280, flexShrink: 0 },
  centerPanel: { flex: 1, minWidth: 0 },
  rightPanel: { width: 300, flexShrink: 0 },
  panel: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 4, overflow: "hidden",
  },
  panelHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 14px", borderBottom: `1px solid ${C.border}`,
    background: C.surface2,
  },
  panelHeaderTitle: { fontWeight: 700, fontSize: 12, color: C.textSub, letterSpacing: "0.05em" },
  panelBody: { padding: 14 },
  field: { marginBottom: 14 },
  label: { display: "block", fontSize: 11, color: C.textSub, marginBottom: 5, fontWeight: 600 },
  hint: { fontSize: 10, color: C.textMute, marginTop: 4 },
  input: {
    width: "100%", background: C.surface2, border: `1px solid ${C.border2}`,
    color: C.text, padding: "7px 10px", borderRadius: 3, fontSize: 12,
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  },
  select: {
    width: "100%", background: C.surface2, border: `1px solid ${C.border2}`,
    color: C.text, padding: "7px 10px", borderRadius: 3, fontSize: 12,
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
    appearance: "none",
  },
  uploadZone: (active) => ({
    border: `1px dashed ${active ? C.accent : C.border2}`,
    background: active ? C.accentDim : C.surface2,
    borderRadius: 4, padding: 20, textAlign: "center",
    cursor: "pointer", color: C.textSub, fontSize: 12,
  }),
  btnPrimary: {
    display: "inline-flex", alignItems: "center", gap: 7,
    background: C.accent, color: "#fff", border: "none",
    padding: "9px 18px", borderRadius: 3, cursor: "pointer",
    fontSize: 12, fontWeight: 700, fontFamily: "inherit", letterSpacing: "0.03em",
  },
  btnSecondary: {
    display: "inline-flex", alignItems: "center", gap: 7,
    background: C.surface3, color: C.textSub, border: `1px solid ${C.border2}`,
    padding: "8px 14px", borderRadius: 3, cursor: "pointer",
    fontSize: 12, fontWeight: 600, fontFamily: "inherit",
  },
  btnDanger: {
    display: "inline-flex", alignItems: "center", gap: 7,
    background: C.redDim, color: C.red, border: `1px solid ${C.red}`,
    padding: "8px 14px", borderRadius: 3, cursor: "pointer",
    fontSize: 12, fontWeight: 600, fontFamily: "inherit",
  },
  statusBadge: (type) => {
    const map = {
      idle: { bg: C.surface3, color: C.textSub },
      processing: { bg: C.yellowDim, color: C.yellow },
      success: { bg: C.greenDim, color: C.green },
      error: { bg: C.redDim, color: C.red },
    };
    const t = map[type] || map.idle;
    return { display: "inline-flex", alignItems: "center", gap: 5,
      background: t.bg, color: t.color, padding: "3px 8px",
      borderRadius: 2, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
    };
  },
  tag: {
    display: "inline-flex", alignItems: "center", gap: 4,
    background: C.surface3, color: C.textSub,
    padding: "2px 7px", borderRadius: 2, fontSize: 10,
  },
  mono: { fontFamily: "inherit", fontSize: 11, color: C.textSub, lineHeight: 1.6 },
  pre: {
    background: C.surface2, border: `1px solid ${C.border}`,
    padding: 12, borderRadius: 3, fontSize: 11,
    color: C.text, overflowX: "auto", whiteSpace: "pre-wrap",
    wordBreak: "break-all", maxHeight: 260, overflowY: "auto",
    fontFamily: "inherit", lineHeight: 1.6,
  },
  toolCard: (active) => ({
    background: active ? C.accentDim : C.surface2,
    border: `1px solid ${active ? C.accent : C.border}`,
    padding: "12px 14px", borderRadius: 4, cursor: "pointer",
    display: "flex", alignItems: "flex-start", gap: 10,
  }),
  toolCardIcon: (active) => ({
    width: 30, height: 30, background: active ? C.accent : C.surface3,
    borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center",
    color: active ? "#fff" : C.textSub, fontSize: 13, flexShrink: 0,
  }),
  statCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    padding: 16, borderRadius: 4,
  },
  statNum: { fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1 },
  statLabel: { fontSize: 10, color: C.textSub, marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" },
  historyRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 14px", borderBottom: `1px solid ${C.border}`,
    fontSize: 11,
  },
  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: 40, color: C.textMute, textAlign: "center",
  },
  tabBar: {
    display: "flex", borderBottom: `1px solid ${C.border}`,
    background: C.surface2,
  },
  tab: (active) => ({
    padding: "9px 16px", fontSize: 11, fontWeight: 600,
    color: active ? C.text : C.textMute, cursor: "pointer",
    borderBottom: `2px solid ${active ? C.accent : "transparent"}`,
    letterSpacing: "0.04em",
  }),
  divider: { borderBottom: `1px solid ${C.border}`, margin: "16px 0" },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const NAV_CATEGORIES = [
  { id: "dashboard", label: "Dashboard",   icon: "fas fa-th-large",   group: "main" },
  { id: "jobs",      label: "Jobs",        icon: "fas fa-list-alt",   group: "main" },
  { id: "video",     label: "Video Tools", icon: "fas fa-film",       group: "tools" },
  { id: "image",     label: "Image Tools", icon: "fas fa-image",      group: "tools" },
  { id: "audio",     label: "Audio Tools", icon: "fas fa-waveform-path", group: "tools" },
  { id: "settings",  label: "Settings",    icon: "fas fa-sliders-h",  group: "system" },
];

const FIELD_TYPES = { TEXT: "text", NUMBER: "number", FLOAT: "float", SELECT: "select",
  FILE: "file", FILES: "files", TEXTAREA: "textarea", TIMESTAMP: "timestamp" };

const TOOL_DEFINITIONS = [
  // ── VIDEO ──────────────────────────────────────────────────────────────
  {
    id: "video_transcode", category: "video", label: "Transcode Video",
    icon: "fas fa-exchange-alt", description: "Convert video to different format/codec/resolution",
    endpoint: "/api/video/transcode", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file", label: "Video File", type: FIELD_TYPES.FILE, accept: "video/*", required: true, hint: "MP4, MKV, AVI, MOV, WebM" },
      { id: "output_format", label: "Output Format", type: FIELD_TYPES.SELECT, required: true,
        options: [{ v: "mp4", l: "MP4" }, { v: "mkv", l: "MKV" }, { v: "webm", l: "WebM" }, { v: "avi", l: "AVI" }, { v: "mov", l: "MOV" }],
        default: "mp4" },
      { id: "codec", label: "Video Codec", type: FIELD_TYPES.SELECT,
        options: [{ v: "h264", l: "H.264" }, { v: "h265", l: "H.265/HEVC" }, { v: "vp9", l: "VP9" }, { v: "av1", l: "AV1" }],
        default: "h264" },
      { id: "resolution", label: "Resolution", type: FIELD_TYPES.SELECT,
        options: [{ v: "", l: "Original" }, { v: "3840x2160", l: "4K (3840×2160)" }, { v: "1920x1080", l: "1080p" }, { v: "1280x720", l: "720p" }, { v: "854x480", l: "480p" }],
        default: "" },
      { id: "crf", label: "Quality (CRF 0–51)", type: FIELD_TYPES.NUMBER, default: 23, hint: "Lower = better quality, larger file" },
    ],
  },
  {
    id: "video_trim", category: "video", label: "Trim / Cut",
    icon: "fas fa-cut", description: "Cut a segment from a video by timestamps",
    endpoint: "/api/video/trim", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file", label: "Video File", type: FIELD_TYPES.FILE, accept: "video/*", required: true },
      { id: "start", label: "Start Time", type: FIELD_TYPES.TIMESTAMP, placeholder: "00:00:00", default: "00:00:00", hint: "HH:MM:SS or seconds" },
      { id: "end",   label: "End Time",   type: FIELD_TYPES.TIMESTAMP, placeholder: "00:01:00", default: "00:01:00" },
      { id: "output_format", label: "Output Format", type: FIELD_TYPES.SELECT,
        options: [{ v: "mp4", l: "MP4" }, { v: "mkv", l: "MKV" }, { v: "webm", l: "WebM" }], default: "mp4" },
    ],
  },
  {
    id: "video_extract_audio", category: "video", label: "Extract Audio",
    icon: "fas fa-music", description: "Extract audio track from video file",
    endpoint: "/api/video/extract-audio", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file", label: "Video File", type: FIELD_TYPES.FILE, accept: "video/*", required: true },
      { id: "format", label: "Audio Format", type: FIELD_TYPES.SELECT,
        options: [{ v: "mp3", l: "MP3" }, { v: "aac", l: "AAC" }, { v: "wav", l: "WAV" }, { v: "flac", l: "FLAC" }, { v: "ogg", l: "OGG" }],
        default: "mp3" },
      { id: "bitrate", label: "Bitrate", type: FIELD_TYPES.SELECT,
        options: [{ v: "128k", l: "128 kbps" }, { v: "192k", l: "192 kbps" }, { v: "256k", l: "256 kbps" }, { v: "320k", l: "320 kbps" }],
        default: "192k" },
    ],
  },
  {
    id: "video_thumbnail", category: "video", label: "Extract Thumbnail",
    icon: "fas fa-camera", description: "Extract a frame as image at given timestamp",
    endpoint: "/api/video/thumbnail", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file", label: "Video File", type: FIELD_TYPES.FILE, accept: "video/*", required: true },
      { id: "timestamp", label: "Timestamp", type: FIELD_TYPES.TIMESTAMP, placeholder: "00:00:05", default: "00:00:05" },
      { id: "format", label: "Image Format", type: FIELD_TYPES.SELECT,
        options: [{ v: "jpg", l: "JPEG" }, { v: "png", l: "PNG" }, { v: "webp", l: "WebP" }], default: "jpg" },
      { id: "width", label: "Width (px)", type: FIELD_TYPES.NUMBER, placeholder: "1920", hint: "Leave blank for original" },
    ],
  },
  {
    id: "video_concat", category: "video", label: "Concatenate Videos",
    icon: "fas fa-layer-group", description: "Merge multiple video files in order",
    endpoint: "/api/video/concat", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "files", label: "Video Files (ordered)", type: FIELD_TYPES.FILES, accept: "video/*", required: true, hint: "Files will be joined in order" },
      { id: "output_format", label: "Output Format", type: FIELD_TYPES.SELECT,
        options: [{ v: "mp4", l: "MP4" }, { v: "mkv", l: "MKV" }, { v: "webm", l: "WebM" }], default: "mp4" },
    ],
  },
  {
    id: "video_add_subtitles", category: "video", label: "Add Subtitles",
    icon: "fas fa-closed-captioning", description: "Burn or soft-embed subtitles into video",
    endpoint: "/api/video/subtitles", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file",     label: "Video File",    type: FIELD_TYPES.FILE, accept: "video/*", required: true },
      { id: "subtitle", label: "Subtitle File", type: FIELD_TYPES.FILE, accept: ".srt,.ass,.vtt", required: true, hint: "SRT, ASS, VTT" },
      { id: "mode", label: "Embed Mode", type: FIELD_TYPES.SELECT,
        options: [{ v: "burn", l: "Burn-in (hardcoded)" }, { v: "soft", l: "Soft (removable)" }], default: "burn" },
    ],
  },
  {
    id: "video_probe", category: "video", label: "Probe / Analyze",
    icon: "fas fa-info-circle", description: "Get detailed metadata about a video file",
    endpoint: "/api/video/probe", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file", label: "Video File", type: FIELD_TYPES.FILE, accept: "video/*,audio/*", required: true },
    ],
  },
  // ── IMAGE ──────────────────────────────────────────────────────────────
  {
    id: "image_resize", category: "image", label: "Resize Image",
    icon: "fas fa-expand-alt", description: "Resize image to specified dimensions",
    endpoint: "/api/image/resize", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file", label: "Image File", type: FIELD_TYPES.FILE, accept: "image/*", required: true },
      { id: "width",  label: "Width (px)",  type: FIELD_TYPES.NUMBER, placeholder: "1920" },
      { id: "height", label: "Height (px)", type: FIELD_TYPES.NUMBER, placeholder: "1080" },
      { id: "fit", label: "Fit Mode", type: FIELD_TYPES.SELECT,
        options: [{ v: "cover", l: "Cover" }, { v: "contain", l: "Contain" }, { v: "fill", l: "Fill" }, { v: "inside", l: "Inside" }, { v: "outside", l: "Outside" }],
        default: "cover" },
      { id: "format", label: "Output Format", type: FIELD_TYPES.SELECT,
        options: [{ v: "jpg", l: "JPEG" }, { v: "png", l: "PNG" }, { v: "webp", l: "WebP" }, { v: "avif", l: "AVIF" }],
        default: "jpg" },
      { id: "quality", label: "Quality (1–100)", type: FIELD_TYPES.NUMBER, default: 85 },
    ],
  },
  {
    id: "image_convert", category: "image", label: "Convert Format",
    icon: "fas fa-file-image", description: "Convert image between formats",
    endpoint: "/api/image/convert", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file",   label: "Image File",    type: FIELD_TYPES.FILE, accept: "image/*", required: true },
      { id: "format", label: "Target Format", type: FIELD_TYPES.SELECT,
        options: [{ v: "jpg", l: "JPEG" }, { v: "png", l: "PNG" }, { v: "webp", l: "WebP" }, { v: "avif", l: "AVIF" }, { v: "gif", l: "GIF" }, { v: "tiff", l: "TIFF" }],
        default: "webp" },
      { id: "quality", label: "Quality (1–100)", type: FIELD_TYPES.NUMBER, default: 85 },
    ],
  },
  {
    id: "image_crop", category: "image", label: "Crop Image",
    icon: "fas fa-crop-alt", description: "Crop image to region defined by coordinates",
    endpoint: "/api/image/crop", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file",   label: "Image File", type: FIELD_TYPES.FILE, accept: "image/*", required: true },
      { id: "left",   label: "Left (px)",   type: FIELD_TYPES.NUMBER, default: 0 },
      { id: "top",    label: "Top (px)",    type: FIELD_TYPES.NUMBER, default: 0 },
      { id: "width",  label: "Width (px)",  type: FIELD_TYPES.NUMBER, placeholder: "800" },
      { id: "height", label: "Height (px)", type: FIELD_TYPES.NUMBER, placeholder: "600" },
    ],
  },
  {
    id: "image_watermark", category: "image", label: "Watermark",
    icon: "fas fa-stamp", description: "Add text or image watermark",
    endpoint: "/api/image/watermark", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file", label: "Base Image", type: FIELD_TYPES.FILE, accept: "image/*", required: true },
      { id: "watermark_type", label: "Watermark Type", type: FIELD_TYPES.SELECT,
        options: [{ v: "text", l: "Text" }, { v: "image", l: "Image" }], default: "text" },
      { id: "text",     label: "Watermark Text", type: FIELD_TYPES.TEXT, placeholder: "© 2025 Studio", default: "© Studio" },
      { id: "position", label: "Position", type: FIELD_TYPES.SELECT,
        options: [{ v: "bottom-right", l: "Bottom Right" }, { v: "bottom-left", l: "Bottom Left" },
          { v: "top-right", l: "Top Right" }, { v: "top-left", l: "Top Left" }, { v: "center", l: "Center" }],
        default: "bottom-right" },
      { id: "opacity", label: "Opacity (0–1)", type: FIELD_TYPES.FLOAT, default: 0.6, hint: "0 = transparent, 1 = opaque" },
    ],
  },
  {
    id: "image_batch_resize", category: "image", label: "Batch Resize",
    icon: "fas fa-images", description: "Resize multiple images at once",
    endpoint: "/api/image/batch-resize", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "files",  label: "Image Files",  type: FIELD_TYPES.FILES, accept: "image/*", required: true },
      { id: "width",  label: "Width (px)",   type: FIELD_TYPES.NUMBER, placeholder: "1200" },
      { id: "height", label: "Height (px)",  type: FIELD_TYPES.NUMBER, placeholder: "900" },
      { id: "format", label: "Output Format", type: FIELD_TYPES.SELECT,
        options: [{ v: "original", l: "Keep Original" }, { v: "jpg", l: "JPEG" }, { v: "png", l: "PNG" }, { v: "webp", l: "WebP" }],
        default: "original" },
      { id: "quality", label: "Quality (1–100)", type: FIELD_TYPES.NUMBER, default: 85 },
    ],
  },
  {
    id: "image_metadata", category: "image", label: "Read EXIF/Metadata",
    icon: "fas fa-tags", description: "Extract metadata and EXIF data from image",
    endpoint: "/api/image/metadata", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file", label: "Image File", type: FIELD_TYPES.FILE, accept: "image/*", required: true },
    ],
  },
  // ── AUDIO ──────────────────────────────────────────────────────────────
  {
    id: "audio_transcode", category: "audio", label: "Transcode Audio",
    icon: "fas fa-random", description: "Convert audio to different format or bitrate",
    endpoint: "/api/audio/transcode", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file",   label: "Audio File",    type: FIELD_TYPES.FILE, accept: "audio/*", required: true },
      { id: "format", label: "Output Format", type: FIELD_TYPES.SELECT,
        options: [{ v: "mp3", l: "MP3" }, { v: "aac", l: "AAC" }, { v: "wav", l: "WAV" }, { v: "flac", l: "FLAC" }, { v: "ogg", l: "OGG" }, { v: "opus", l: "Opus" }],
        default: "mp3" },
      { id: "bitrate", label: "Bitrate", type: FIELD_TYPES.SELECT,
        options: [{ v: "64k", l: "64 kbps" }, { v: "128k", l: "128 kbps" }, { v: "192k", l: "192 kbps" }, { v: "256k", l: "256 kbps" }, { v: "320k", l: "320 kbps" }],
        default: "192k" },
      { id: "sample_rate", label: "Sample Rate", type: FIELD_TYPES.SELECT,
        options: [{ v: "", l: "Original" }, { v: "22050", l: "22050 Hz" }, { v: "44100", l: "44100 Hz" }, { v: "48000", l: "48000 Hz" }],
        default: "" },
    ],
  },
  {
    id: "audio_trim", category: "audio", label: "Trim Audio",
    icon: "fas fa-scissors", description: "Cut a segment from an audio file",
    endpoint: "/api/audio/trim", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file",  label: "Audio File", type: FIELD_TYPES.FILE, accept: "audio/*", required: true },
      { id: "start", label: "Start Time", type: FIELD_TYPES.TIMESTAMP, placeholder: "00:00:00", default: "00:00:00" },
      { id: "end",   label: "End Time",   type: FIELD_TYPES.TIMESTAMP, placeholder: "00:01:00", default: "00:01:00" },
      { id: "format", label: "Output Format", type: FIELD_TYPES.SELECT,
        options: [{ v: "mp3", l: "MP3" }, { v: "wav", l: "WAV" }, { v: "flac", l: "FLAC" }, { v: "aac", l: "AAC" }],
        default: "mp3" },
    ],
  },
  {
    id: "audio_merge", category: "audio", label: "Merge Audio",
    icon: "fas fa-compress-arrows-alt", description: "Merge multiple audio files together",
    endpoint: "/api/audio/merge", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "files", label: "Audio Files", type: FIELD_TYPES.FILES, accept: "audio/*", required: true, hint: "Merged in order" },
      { id: "format", label: "Output Format", type: FIELD_TYPES.SELECT,
        options: [{ v: "mp3", l: "MP3" }, { v: "wav", l: "WAV" }, { v: "flac", l: "FLAC" }],
        default: "mp3" },
    ],
  },
  {
    id: "audio_normalize", category: "audio", label: "Normalize Volume",
    icon: "fas fa-volume-up", description: "Normalize audio loudness (LUFS target)",
    endpoint: "/api/audio/normalize", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file",  label: "Audio File", type: FIELD_TYPES.FILE, accept: "audio/*", required: true },
      { id: "target_lufs", label: "Target LUFS", type: FIELD_TYPES.FLOAT, default: -16, hint: "EBU R128: -23, streaming: -14 to -16" },
      { id: "format", label: "Output Format", type: FIELD_TYPES.SELECT,
        options: [{ v: "mp3", l: "MP3" }, { v: "wav", l: "WAV" }, { v: "flac", l: "FLAC" }],
        default: "mp3" },
    ],
  },
  {
    id: "audio_waveform", category: "audio", label: "Generate Waveform",
    icon: "fas fa-wave-square", description: "Generate waveform image from audio",
    endpoint: "/api/audio/waveform", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file",   label: "Audio File", type: FIELD_TYPES.FILE, accept: "audio/*", required: true },
      { id: "width",  label: "Width (px)",  type: FIELD_TYPES.NUMBER, default: 1200 },
      { id: "height", label: "Height (px)", type: FIELD_TYPES.NUMBER, default: 200 },
      { id: "color",  label: "Wave Color",  type: FIELD_TYPES.TEXT, default: "#4f7ef8", placeholder: "#4f7ef8" },
      { id: "bg",     label: "Background",  type: FIELD_TYPES.TEXT, default: "#131316", placeholder: "#131316" },
    ],
  },
  {
    id: "audio_probe", category: "audio", label: "Probe / Analyze",
    icon: "fas fa-search", description: "Extract codec, duration and metadata from audio",
    endpoint: "/api/audio/probe", method: "POST", uploadStrategy: "formdata",
    fields: [
      { id: "file", label: "Audio File", type: FIELD_TYPES.FILE, accept: "audio/*", required: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const buildInitialValues = (fields) => {
  const vals = {};
  fields.forEach((f) => {
    if (f.type === FIELD_TYPES.FILE || f.type === FIELD_TYPES.FILES) return;
    vals[f.id] = f.default !== undefined ? f.default : "";
  });
  return vals;
};

const buildFormData = (tool, values, files) => {
  const fd = new FormData();
  tool.fields.forEach((f) => {
    if (f.type === FIELD_TYPES.FILE) {
      const file = files[f.id];
      if (file) fd.append(f.id, file);
    } else if (f.type === FIELD_TYPES.FILES) {
      const flist = files[f.id];
      if (flist) flist.forEach((file, i) => fd.append(`${f.id}`, file));
    } else {
      if (values[f.id] !== "" && values[f.id] !== undefined) fd.append(f.id, values[f.id]);
    }
  });
  return fd;
};

const buildJsonPayload = (tool, values) => {
  const payload = {};
  tool.fields.forEach((f) => {
    if (f.type !== FIELD_TYPES.FILE && f.type !== FIELD_TYPES.FILES) {
      if (values[f.id] !== "" && values[f.id] !== undefined) payload[f.id] = values[f.id];
    }
  });
  return payload;
};

const humanFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0, b = bytes;
  while (b >= 1024 && i < units.length - 1) { b /= 1024; i++; }
  return `${b.toFixed(1)} ${units[i]}`;
};

const tsNow = () => new Date().toLocaleTimeString("en-GB");

const STATUS_ICONS = {
  idle:       "fas fa-minus-circle",
  processing: "fas fa-circle-notch fa-spin",
  success:    "fas fa-check-circle",
  error:      "fas fa-exclamation-circle",
};

const STATUS_LABELS = { idle: "IDLE", processing: "PROCESSING", success: "SUCCESS", error: "ERROR" };

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const PrimaryButton = ({ onClick, disabled, loading, icon, children }) => (
  <button style={{ ...S.btnPrimary, opacity: disabled ? 0.5 : 1 }} onClick={onClick} disabled={disabled}>
    {loading ? <i className="fas fa-circle-notch fa-spin" /> : icon ? <i className={icon} /> : null}
    {children}
  </button>
);

const SecondaryButton = ({ onClick, icon, children }) => (
  <button style={S.btnSecondary} onClick={onClick}>
    {icon && <i className={icon} />}{children}
  </button>
);

const DangerButton = ({ onClick, icon, children }) => (
  <button style={S.btnDanger} onClick={onClick}>
    {icon && <i className={icon} />}{children}
  </button>
);

const StatusBadge = ({ status }) => (
  <span style={S.statusBadge(status)}>
    <i className={STATUS_ICONS[status]} />{STATUS_LABELS[status] || status}
  </span>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={S.sectionTitle}>{children}</div>
    {sub && <div style={{ fontSize: 11, color: C.textSub }}>{sub}</div>}
  </div>
);

const PanelHeader = ({ title, action }) => (
  <div style={S.panelHeader}>
    <span style={S.panelHeaderTitle}>{title}</span>
    {action}
  </div>
);

const EmptyState = ({ icon, title, sub }) => (
  <div style={S.emptyState}>
    <i className={icon} style={{ fontSize: 28, marginBottom: 12, color: C.textMute }} />
    <div style={{ fontWeight: 700, color: C.textSub, marginBottom: 4 }}>{title}</div>
    {sub && <div style={{ fontSize: 11 }}>{sub}</div>}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// FORM FIELD RENDERERS
// ─────────────────────────────────────────────────────────────────────────────
const FileUploadField = ({ field, value, onChange }) => {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const isMulti = field.type === FIELD_TYPES.FILES;

  const handleFiles = (raw) => {
    if (!raw || raw.length === 0) return;
    onChange(field.id, isMulti ? Array.from(raw) : raw[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const displayName = isMulti
    ? (value && value.length > 0 ? `${value.length} file(s) selected` : null)
    : (value ? value.name : null);

  return (
    <div>
      <div
        style={S.uploadZone(dragging || !!value)}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <i className={displayName ? "fas fa-file-check" : "fas fa-cloud-upload-alt"}
          style={{ fontSize: 20, marginBottom: 8, display: "block", color: displayName ? C.accent : C.textMute }} />
        {displayName
          ? <><div style={{ color: C.text, fontWeight: 600, marginBottom: 2 }}>{displayName}</div>
              {!isMulti && value && <div style={{ color: C.textMute, fontSize: 10 }}>{humanFileSize(value.size)}</div>}</>
          : <><div style={{ marginBottom: 4 }}>Drop file{isMulti ? "s" : ""} here or click to browse</div>
              <div style={{ fontSize: 10, color: C.textMute }}>{field.hint || field.accept || "Any file"}</div></>
        }
      </div>
      <input ref={inputRef} type="file" accept={field.accept} multiple={isMulti}
        style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
      {displayName && (
        <div style={{ marginTop: 4, display: "flex", gap: 8 }}>
          <span style={S.tag}><i className="fas fa-file" /> {displayName}</span>
          <span style={{ ...S.tag, cursor: "pointer", color: C.red }}
            onClick={() => onChange(field.id, null)}>
            <i className="fas fa-times" /> clear
          </span>
        </div>
      )}
    </div>
  );
};

const TextField = ({ field, value, onChange }) => (
  <input style={S.input} type="text" value={value || ""} placeholder={field.placeholder || ""}
    onChange={(e) => onChange(field.id, e.target.value)} />
);

const NumberField = ({ field, value, onChange }) => (
  <input style={S.input} type="number" value={value !== undefined ? value : ""}
    placeholder={field.placeholder || ""}
    step={field.type === FIELD_TYPES.FLOAT ? "0.01" : "1"}
    onChange={(e) => onChange(field.id, field.type === FIELD_TYPES.FLOAT ? parseFloat(e.target.value) : parseInt(e.target.value, 10))} />
);

const SelectField = ({ field, value, onChange }) => (
  <div style={{ position: "relative" }}>
    <select style={S.select} value={value !== undefined ? value : (field.default || "")}
      onChange={(e) => onChange(field.id, e.target.value)}>
      {field.options?.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
    <i className="fas fa-chevron-down" style={{ position: "absolute", right: 10, top: "50%",
      transform: "translateY(-50%)", color: C.textMute, fontSize: 10, pointerEvents: "none" }} />
  </div>
);

const TimestampField = ({ field, value, onChange }) => (
  <input style={S.input} type="text" value={value || ""}
    placeholder={field.placeholder || "00:00:00"}
    onChange={(e) => onChange(field.id, e.target.value)} />
);

const TextareaField = ({ field, value, onChange }) => (
  <textarea style={{ ...S.input, resize: "vertical", minHeight: 80 }}
    value={value || ""} placeholder={field.placeholder || ""}
    onChange={(e) => onChange(field.id, e.target.value)} />
);

const FieldRenderer = ({ field, value, onChange }) => {
  const map = {
    [FIELD_TYPES.TEXT]:      TextField,
    [FIELD_TYPES.NUMBER]:    NumberField,
    [FIELD_TYPES.FLOAT]:     NumberField,
    [FIELD_TYPES.SELECT]:    SelectField,
    [FIELD_TYPES.TIMESTAMP]: TimestampField,
    [FIELD_TYPES.TEXTAREA]:  TextareaField,
    [FIELD_TYPES.FILE]:      FileUploadField,
    [FIELD_TYPES.FILES]:     FileUploadField,
  };
  const Comp = map[field.type] || TextField;
  return (
    <div style={S.field}>
      <label style={S.label}>
        {field.label}
        {field.required && <span style={{ color: C.red, marginLeft: 4 }}>*</span>}
      </label>
      <Comp field={field} value={value} onChange={onChange} />
      {field.hint && <div style={S.hint}>{field.hint}</div>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC TOOL FORM
// ─────────────────────────────────────────────────────────────────────────────
const DynamicToolForm = ({ tool, values, files, onChangeValue, onChangeFile }) => {
  const handleChange = (id, val) => {
    const field = tool.fields.find((f) => f.id === id);
    if (!field) return;
    if (field.type === FIELD_TYPES.FILE || field.type === FIELD_TYPES.FILES) {
      onChangeFile(id, val);
    } else {
      onChangeValue(id, val);
    }
  };

  return (
    <div>
      {tool.fields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          value={field.type === FIELD_TYPES.FILE || field.type === FIELD_TYPES.FILES
            ? files[field.id]
            : values[field.id]}
          onChange={handleChange}
        />
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RESULT PANEL
// ─────────────────────────────────────────────────────────────────────────────
const ResultPanel = ({ status, result, error, logs }) => {
  const [tab, setTab] = useState("result");
  return (
    <div style={S.panel}>
      <PanelHeader title="OUTPUT" action={<StatusBadge status={status} />} />
      <div style={S.tabBar}>
        {["result", "logs"].map((t) => (
          <div key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            <i className={t === "result" ? "fas fa-terminal" : "fas fa-scroll"} style={{ marginRight: 6 }} />
            {t.toUpperCase()}
          </div>
        ))}
      </div>
      <div style={{ padding: 14, minHeight: 180 }}>
        {tab === "result" && (
          <>
            {status === "idle" && (
              <EmptyState icon="fas fa-terminal" title="No output yet" sub="Run a tool to see results here" />
            )}
            {status === "processing" && (
              <div style={{ ...S.emptyState }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: 28, color: C.yellow, marginBottom: 12 }} />
                <div style={{ color: C.yellow, fontWeight: 700 }}>Processing…</div>
              </div>
            )}
            {status === "error" && (
              <div>
                <div style={{ color: C.red, fontWeight: 700, marginBottom: 8 }}>
                  <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }} />Error
                </div>
                <pre style={{ ...S.pre, borderColor: C.red, color: C.red }}>{error || "Unknown error"}</pre>
              </div>
            )}
            {status === "success" && result && (
              <div>
                <div style={{ color: C.green, fontWeight: 700, marginBottom: 8 }}>
                  <i className="fas fa-check-circle" style={{ marginRight: 6 }} />Success
                </div>
                {result.output_url && (
                  <div style={{ marginBottom: 10 }}>
                    <span style={S.tag}><i className="fas fa-link" /> Output</span>{" "}
                    <a href={result.output_url} target="_blank" rel="noreferrer"
                      style={{ color: C.accent, fontSize: 11 }}>{result.output_url}</a>
                  </div>
                )}
                <pre style={S.pre}>{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </>
        )}
        {tab === "logs" && (
          <div style={{ ...S.pre, minHeight: 120 }}>
            {logs.length === 0
              ? <span style={{ color: C.textMute }}>No logs yet.</span>
              : logs.map((l, i) => (
                <div key={i} style={{ color: l.type === "error" ? C.red : l.type === "ok" ? C.green : C.textSub }}>
                  <span style={{ color: C.textMute }}>[{l.time}] </span>
                  <i className={l.type === "error" ? "fas fa-times" : l.type === "ok" ? "fas fa-check" : "fas fa-chevron-right"}
                    style={{ marginRight: 6, fontSize: 9 }} />
                  {l.msg}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY PANEL
// ─────────────────────────────────────────────────────────────────────────────
const HistoryPanel = ({ history, onRestore }) => (
  <div style={S.panel}>
    <PanelHeader title={`HISTORY (${history.length})`} />
    {history.length === 0
      ? <EmptyState icon="fas fa-history" title="No jobs yet" sub="Processed jobs appear here" />
      : (
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {[...history].reverse().map((job) => (
            <div key={job.id} style={S.historyRow}>
              <i className={STATUS_ICONS[job.status]} style={{ color: job.status === "success" ? C.green : job.status === "error" ? C.red : C.yellow, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.toolLabel}</div>
                <div style={{ color: C.textMute, fontSize: 10 }}>{job.time}</div>
              </div>
              <span style={{ ...S.tag, cursor: "pointer" }} onClick={() => onRestore(job)}>
                <i className="fas fa-redo" /> restore
              </span>
            </div>
          ))}
        </div>
      )
    }
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW PANEL
// ─────────────────────────────────────────────────────────────────────────────
const PreviewPanel = ({ tool, values, files }) => {
  const fileFields = tool.fields.filter((f) => f.type === FIELD_TYPES.FILE || f.type === FIELD_TYPES.FILES);
  const paramFields = tool.fields.filter((f) => f.type !== FIELD_TYPES.FILE && f.type !== FIELD_TYPES.FILES);
  return (
    <div style={S.panel}>
      <PanelHeader title="INPUTS SUMMARY" />
      <div style={S.panelBody}>
        {fileFields.length > 0 && (
          <>
            <div style={{ ...S.sectionTitle, marginBottom: 8 }}>Files</div>
            {fileFields.map((f) => {
              const fv = files[f.id];
              const name = f.type === FIELD_TYPES.FILES
                ? (fv && fv.length > 0 ? `${fv.length} file(s): ${fv.map((x) => x.name).join(", ")}` : "—")
                : (fv ? `${fv.name} (${humanFileSize(fv.size)})` : "—");
              return (
                <div key={f.id} style={{ marginBottom: 8 }}>
                  <span style={{ color: C.textMute, fontSize: 10 }}>{f.label}: </span>
                  <span style={{ color: fv ? C.text : C.textMute, fontSize: 11 }}>{name}</span>
                </div>
              );
            })}
            <div style={S.divider} />
          </>
        )}
        {paramFields.length > 0 && (
          <>
            <div style={{ ...S.sectionTitle, marginBottom: 8 }}>Parameters</div>
            {paramFields.map((f) => (
              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: C.textMute, fontSize: 10 }}>{f.label}</span>
                <span style={{ color: C.text, fontSize: 11, fontWeight: 600 }}>
                  {values[f.id] !== undefined && values[f.id] !== "" ? String(values[f.id]) : "—"}
                </span>
              </div>
            ))}
          </>
        )}
        <div style={S.divider} />
        <div style={{ fontSize: 10, color: C.textMute }}>
          <i className="fas fa-plug" style={{ marginRight: 6 }} />
          <span style={{ color: C.accent }}>{tool.method}</span>{" "}
          <span>{tool.endpoint}</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TOOL CARD
// ─────────────────────────────────────────────────────────────────────────────
const ToolCard = ({ tool, active, onSelect }) => (
  <div style={S.toolCard(active)} onClick={() => onSelect(tool)}>
    <div style={S.toolCardIcon(active)}><i className={tool.icon} /></div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: active ? C.text : C.text, marginBottom: 2 }}>{tool.label}</div>
      <div style={{ fontSize: 10, color: C.textSub, lineHeight: 1.4, overflow: "hidden",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{tool.description}</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// TOOL WORKBENCH
// ─────────────────────────────────────────────────────────────────────────────
const ToolWorkbench = ({ tool, settings, onJobComplete, history, onRestoreJob }) => {
  const [values, setValues] = useState(() => buildInitialValues(tool.fields));
  const [files, setFiles] = useState({});
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((msg, type = "info") => {
    setLogs((prev) => [...prev, { time: tsNow(), msg, type }]);
  }, []);

  const handleChangeValue = (id, val) => setValues((p) => ({ ...p, [id]: val }));
  const handleChangeFile  = (id, val) => setFiles((p) => ({ ...p, [id]: val }));

  const handleReset = () => {
    setValues(buildInitialValues(tool.fields));
    setFiles({});
    setStatus("idle");
    setResult(null);
    setError(null);
    setLogs([]);
  };

  const handleRun = async () => {
    const missingRequired = tool.fields
      .filter((f) => f.required)
      .filter((f) => {
        if (f.type === FIELD_TYPES.FILE) return !files[f.id];
        if (f.type === FIELD_TYPES.FILES) return !files[f.id] || files[f.id].length === 0;
        return values[f.id] === "" || values[f.id] === undefined;
      });

    if (missingRequired.length > 0) {
      setError(`Missing required fields: ${missingRequired.map((f) => f.label).join(", ")}`);
      setStatus("error");
      addLog(`Validation failed: ${missingRequired.map((f) => f.label).join(", ")}`, "error");
      return;
    }

    setStatus("processing");
    setResult(null);
    setError(null);
    addLog(`Starting ${tool.label}…`);

    try {
      const baseUrl = settings.baseUrl || "http://localhost:8000";
      const url = `${baseUrl}${tool.endpoint}`;
      addLog(`POST ${url}`);

      const body = buildFormData(tool, values, files);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), (settings.timeout || 30) * 1000);

      const res = await fetch(url, { method: tool.method || "POST", body, signal: controller.signal });
      clearTimeout(timeout);

      addLog(`HTTP ${res.status} ${res.statusText}`, res.ok ? "info" : "error");

      let data;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) data = await res.json();
      else data = { raw: await res.text() };

      if (!res.ok) throw new Error(data.message || data.error || data.raw || `HTTP ${res.status}`);

      setResult(data);
      setStatus("success");
      addLog("Job completed successfully.", "ok");
      onJobComplete({ id: Date.now(), toolLabel: tool.label, status: "success", result: data, time: tsNow(), toolId: tool.id });
    } catch (err) {
      const msg = err.name === "AbortError" ? "Request timed out" : (err.message || "Unknown error");
      setError(msg);
      setStatus("error");
      addLog(msg, "error");
      onJobComplete({ id: Date.now(), toolLabel: tool.label, status: "error", error: msg, time: tsNow(), toolId: tool.id });
    }

    if (settings.autoReset) setTimeout(handleReset, 4000);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, background: C.accentDim, borderRadius: 4,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className={tool.icon} style={{ color: C.accent, fontSize: 16 }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{tool.label}</div>
          <div style={{ fontSize: 11, color: C.textSub }}>{tool.description}</div>
        </div>
      </div>

      <div style={S.workbench}>
        {/* FORM */}
        <div style={S.leftPanel}>
          <div style={S.panel}>
            <PanelHeader title="PARAMETERS" />
            <div style={S.panelBody}>
              <DynamicToolForm
                tool={tool} values={values} files={files}
                onChangeValue={handleChangeValue} onChangeFile={handleChangeFile}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <PrimaryButton onClick={handleRun} disabled={status === "processing"}
                  loading={status === "processing"} icon="fas fa-play">
                  Run
                </PrimaryButton>
                <SecondaryButton onClick={handleReset} icon="fas fa-undo">Reset</SecondaryButton>
              </div>
            </div>
          </div>
        </div>

        {/* RESULT + LOGS */}
        <div style={S.centerPanel}>
          <ResultPanel status={status} result={result} error={error} logs={logs} />
        </div>

        {/* PREVIEW + HISTORY */}
        <div style={S.rightPanel}>
          <div style={{ marginBottom: 12 }}>
            <PreviewPanel tool={tool} values={values} files={files} />
          </div>
          <HistoryPanel history={history} onRestore={onRestoreJob} />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TOOL GRID
// ─────────────────────────────────────────────────────────────────────────────
const ToolGrid = ({ tools, activeTool, onSelect }) => (
  <div style={{ ...S.grid3, marginBottom: 20 }}>
    {tools.map((t) => (
      <ToolCard key={t.id} tool={t} active={activeTool?.id === t.id} onSelect={onSelect} />
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY VIEW
// ─────────────────────────────────────────────────────────────────────────────
const CategoryView = ({ category, settings, history, onJobComplete, onRestoreJob }) => {
  const tools = useMemo(
    () => TOOL_DEFINITIONS.filter((t) => t.category === category),
    [category]
  );
  const [activeTool, setActiveTool] = useState(tools[0] || null);

  const catMeta = NAV_CATEGORIES.find((c) => c.id === category);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <i className={catMeta?.icon} style={{ color: C.accent, fontSize: 18 }} />
          <div style={S.pageTitle}>{catMeta?.label}</div>
        </div>
        <div style={S.pageSub}>{tools.length} tools available in this category</div>
      </div>

      <SectionTitle>SELECT TOOL</SectionTitle>
      <ToolGrid tools={tools} activeTool={activeTool} onSelect={setActiveTool} />

      {activeTool && (
        <>
          <div style={S.divider} />
          <ToolWorkbench
            key={activeTool.id}
            tool={activeTool}
            settings={settings}
            history={history}
            onJobComplete={onJobComplete}
            onRestoreJob={onRestoreJob}
          />
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD VIEW
// ─────────────────────────────────────────────────────────────────────────────
const DashboardView = ({ history, onNavigate }) => {
  const total   = TOOL_DEFINITIONS.length;
  const success = history.filter((j) => j.status === "success").length;
  const errors  = history.filter((j) => j.status === "error").length;

  const catCounts = useMemo(() => {
    const c = {};
    TOOL_DEFINITIONS.forEach((t) => { c[t.category] = (c[t.category] || 0) + 1; });
    return c;
  }, []);

  const catMetas = [
    { id: "video", label: "Video Tools", icon: "fas fa-film", accent: "#4f7ef8" },
    { id: "image", label: "Image Tools", icon: "fas fa-image", accent: "#30c97a" },
    { id: "audio", label: "Audio Tools", icon: "fas fa-headphones", accent: "#e8a23a" },
  ];

  return (
    <div>
      <div style={S.pageTitle}>Dashboard</div>
      <div style={{ ...S.pageSub, marginBottom: 28 }}>Media Processing Studio — overview</div>

      {/* Stats */}
      <SectionTitle>SESSION STATS</SectionTitle>
      <div style={{ ...S.grid4, marginBottom: 28 }}>
        {[
          { n: total,   l: "Total Tools",  icon: "fas fa-tools",        c: C.accent },
          { n: history.length, l: "Jobs Run", icon: "fas fa-play-circle", c: C.blue },
          { n: success, l: "Succeeded",    icon: "fas fa-check-circle",  c: C.green },
          { n: errors,  l: "Failed",       icon: "fas fa-times-circle",  c: C.red },
        ].map((s) => (
          <div key={s.l} style={S.statCard}>
            <i className={s.icon} style={{ color: s.c, marginBottom: 8, fontSize: 18, display: "block" }} />
            <div style={S.statNum}>{s.n}</div>
            <div style={S.statLabel}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Category cards */}
      <SectionTitle>TOOL CATEGORIES</SectionTitle>
      <div style={{ ...S.grid3, marginBottom: 28 }}>
        {catMetas.map((cat) => (
          <div key={cat.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => onNavigate(cat.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, background: C.surface2, borderRadius: 4,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className={cat.icon} style={{ fontSize: 18, color: cat.accent }} />
              </div>
              <div>
                <div style={S.cardTitle}>{cat.label}</div>
                <div style={S.cardSub}>{catCounts[cat.id] || 0} tools</div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {TOOL_DEFINITIONS.filter((t) => t.category === cat.id).slice(0, 4).map((t) => (
                <span key={t.id} style={S.tag}><i className={t.icon} style={{ marginRight: 3 }} />{t.label}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent jobs */}
      <SectionTitle>RECENT JOBS</SectionTitle>
      <div style={S.panel}>
        <PanelHeader title={`LAST ${Math.min(history.length, 10)} JOBS`} />
        {history.length === 0
          ? <EmptyState icon="fas fa-history" title="No jobs yet" sub="Run a tool to see history here" />
          : [...history].reverse().slice(0, 10).map((job) => (
            <div key={job.id} style={S.historyRow}>
              <i className={STATUS_ICONS[job.status]} style={{ color: job.status === "success" ? C.green : job.status === "error" ? C.red : C.yellow }} />
              <span style={{ flex: 1, fontWeight: 600, color: C.text }}>{job.toolLabel}</span>
              <span style={{ color: C.textMute, fontSize: 10 }}>{job.time}</span>
              <StatusBadge status={job.status} />
            </div>
          ))
        }
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// JOBS VIEW
// ─────────────────────────────────────────────────────────────────────────────
const JobsView = ({ history, onClear }) => (
  <div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <div>
        <div style={S.pageTitle}>Jobs / History</div>
        <div style={S.pageSub}>{history.length} job(s) in session memory</div>
      </div>
      {history.length > 0 && <DangerButton onClick={onClear} icon="fas fa-trash">Clear All</DangerButton>}
    </div>
    <div style={S.panel}>
      <PanelHeader title="ALL JOBS" />
      {history.length === 0
        ? <EmptyState icon="fas fa-list-alt" title="No jobs recorded" sub="Processed jobs appear here" />
        : (
          <div>
            {[...history].reverse().map((job) => (
              <div key={job.id} style={{ ...S.historyRow, alignItems: "flex-start", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                  <i className={STATUS_ICONS[job.status]}
                    style={{ color: job.status === "success" ? C.green : job.status === "error" ? C.red : C.yellow }} />
                  <span style={{ flex: 1, fontWeight: 700, color: C.text }}>{job.toolLabel}</span>
                  <span style={{ color: C.textMute, fontSize: 10 }}>{job.time}</span>
                  <StatusBadge status={job.status} />
                </div>
                {job.error && <div style={{ color: C.red, fontSize: 10, paddingLeft: 22 }}>{job.error}</div>}
                {job.result && (
                  <pre style={{ ...S.pre, margin: "0 0 0 22px", fontSize: 10, maxHeight: 80 }}>
                    {JSON.stringify(job.result, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS VIEW
// ─────────────────────────────────────────────────────────────────────────────
const SettingsView = ({ settings, onChange }) => {
  const fields = [
    { id: "baseUrl",   label: "API Base URL",    type: "text",   placeholder: "http://localhost:8000", hint: "Base URL for all API calls" },
    { id: "timeout",   label: "Request Timeout (s)", type: "number", placeholder: "30", hint: "Seconds before aborting request" },
  ];
  return (
    <div>
      <div style={S.pageTitle}>Settings</div>
      <div style={{ ...S.pageSub, marginBottom: 28 }}>Configure API connection and behavior</div>

      <div style={{ maxWidth: 520 }}>
        <SectionTitle>API CONFIGURATION</SectionTitle>
        <div style={S.panel}>
          <div style={S.panelBody}>
            {fields.map((f) => (
              <div key={f.id} style={S.field}>
                <label style={S.label}>{f.label}</label>
                <input style={S.input} type={f.type} value={settings[f.id] || ""}
                  placeholder={f.placeholder}
                  onChange={(e) => onChange(f.id, f.type === "number" ? Number(e.target.value) : e.target.value)} />
                <div style={S.hint}>{f.hint}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <SectionTitle>BEHAVIOR</SectionTitle>
          <div style={S.panel}>
            <div style={S.panelBody}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: C.text, marginBottom: 2 }}>Auto Reset After Success</div>
                  <div style={{ fontSize: 11, color: C.textSub }}>Automatically reset form 4s after successful run</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: settings.autoReset ? C.green : C.textMute }}>
                    {settings.autoReset ? "ON" : "OFF"}
                  </span>
                  <div
                    onClick={() => onChange("autoReset", !settings.autoReset)}
                    style={{ width: 36, height: 20, background: settings.autoReset ? C.accent : C.surface3,
                      borderRadius: 10, cursor: "pointer", position: "relative",
                      border: `1px solid ${settings.autoReset ? C.accent : C.border2}` }}>
                    <div style={{ position: "absolute", top: 2, left: settings.autoReset ? 16 : 2,
                      width: 14, height: 14, background: "#fff", borderRadius: "50%",
                      transition: "left 0.15s" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <SectionTitle>ABOUT</SectionTitle>
          <div style={{ ...S.panel }}>
            <div style={{ ...S.panelBody, color: C.textSub, fontSize: 11, lineHeight: 1.8 }}>
              <div><i className="fas fa-cube" style={{ marginRight: 8, color: C.accent }} />Media Studio v1.0.0</div>
              <div><i className="fas fa-tools" style={{ marginRight: 8, color: C.textMute }} />{TOOL_DEFINITIONS.length} tools configured</div>
              <div><i className="fas fa-layer-group" style={{ marginRight: 8, color: C.textMute }} />3 categories: Video, Image, Audio</div>
              <div><i className="fas fa-code-branch" style={{ marginRight: 8, color: C.textMute }} />Single-file React architecture</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const Sidebar = ({ active, onSelect }) => {
  const groups = [
    { key: "main",   label: "Overview" },
    { key: "tools",  label: "Tools" },
    { key: "system", label: "System" },
  ];
  return (
    <div style={S.sidebar}>
      <div style={{ padding: "16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, color: C.textMute, letterSpacing: "0.12em" }}>MEDIA</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "0.04em" }}>STUDIO</div>
      </div>
      {groups.map((g) => {
        const items = NAV_CATEGORIES.filter((n) => n.group === g.key);
        return (
          <div key={g.key} style={S.sidebarSection}>
            <div style={S.sidebarLabel}>{g.label}</div>
            {items.map((item) => (
              <div key={item.id} style={S.sidebarItem(active === item.id)}
                onClick={() => onSelect(item.id)}>
                <span style={S.sidebarItemIcon}><i className={item.icon} /></span>
                {item.label}
              </div>
            ))}
          </div>
        );
      })}
      <div style={{ flex: 1 }} />
      <div style={{ padding: 14, borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
          <span style={{ fontSize: 10, color: C.textSub }}>Ready</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────────────────────
const Topbar = ({ activeNav, history }) => {
  const cat = NAV_CATEGORIES.find((n) => n.id === activeNav);
  const running = history.filter((j) => j.status === "processing").length;
  return (
    <div style={S.topbar}>
      <div style={S.topbarLogo}>
        <i className={cat?.icon} style={{ color: C.accent }} />
        <span>{cat?.label || "Studio"}</span>
      </div>
      <div style={S.topbarRight}>
        {running > 0 && (
          <span style={{ color: C.yellow }}>
            <i className="fas fa-circle-notch fa-spin" style={{ marginRight: 5 }} />
            {running} running
          </span>
        )}
        <span><i className="fas fa-clock" style={{ marginRight: 5 }} />{new Date().toLocaleDateString("en-GB")}</span>
        <span><i className="fas fa-list" style={{ marginRight: 5 }} />{history.length} jobs</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// APP SHELL + ROOT
// ─────────────────────────────────────────────────────────────────────────────
const AppShell = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [history, setHistory]     = useState([]);
  const [settings, setSettings]   = useState({ baseUrl: "http://localhost:8000", timeout: 30, autoReset: false });

  const handleJobComplete = useCallback((job) => {
    setHistory((prev) => [...prev, job]);
  }, []);

  const handleRestoreJob = useCallback(() => {}, []);
  const handleClearHistory = () => setHistory([]);
  const handleSettingChange = (key, val) => setSettings((p) => ({ ...p, [key]: val }));

  const renderView = () => {
    switch (activeNav) {
      case "dashboard": return <DashboardView history={history} onNavigate={setActiveNav} />;
      case "video":     return <CategoryView category="video" settings={settings} history={history} onJobComplete={handleJobComplete} onRestoreJob={handleRestoreJob} />;
      case "image":     return <CategoryView category="image" settings={settings} history={history} onJobComplete={handleJobComplete} onRestoreJob={handleRestoreJob} />;
      case "audio":     return <CategoryView category="audio" settings={settings} history={history} onJobComplete={handleJobComplete} onRestoreJob={handleRestoreJob} />;
      case "jobs":      return <JobsView history={history} onClear={handleClearHistory} />;
      case "settings":  return <SettingsView settings={settings} onChange={handleSettingChange} />;
      default:          return null;
    }
  };

  return (
    <div style={S.app}>
      <link rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
      <Topbar activeNav={activeNav} history={history} />
      <div style={S.body}>
        <Sidebar active={activeNav} onSelect={setActiveNav} />
        <main style={S.main}>
          <div style={S.content}>{renderView()}</div>
        </main>
      </div>
    </div>
  );
};

export default function MediaStudioApp() {
  return <AppShell />;
}