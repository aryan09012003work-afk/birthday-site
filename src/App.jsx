import { useState, useEffect } from "react";

// ════════════════════════════════════════════════════════════
//  CONFIG — edit everything here before sharing
// ════════════════════════════════════════════════════════════
const BIRTHDAY_PERSON = "Aayushi";
const TURNING_AGE = 25;
const BIRTHDAY_DATE = "26th May 2026";

const APPROVED_EMAILS = [
  "aditi@example.com",
  "riya@example.com",
  "sana@example.com",
  "priya@example.com",
  // ← add more approved emails here
];

// ── HOW TO ADD PHOTOS ──────────────────────────────────────
// Option A (recommended): Upload photo to https://imgbb.com
//   → copy the Direct Link → paste as a string below
//
// Option B: Convert to base64 at https://base64.guru/converter/encode/image
//   → copy the full "data:image/jpeg;base64,..." string → paste below
//
// Example:
//   "https://i.ibb.co/abc123/photo1.jpg",
//   "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
const BIRTHDAY_PHOTOS = [
  // paste your photo URLs or base64 strings here, one per line:
     "https://ibb.co/LdZW4L7s",
     "https://ibb.co/m7bGbMs",
     "https://ibb.co/bjQcQxbC",
     "https://ibb.co/wNxRZNHY",
     "https://ibb.co/ycmnkcCT",
     "https://ibb.co/gB6Xdh4",
     "https://ibb.co/gZQsr2tZ",
     "https://ibb.co/8TxYv1T",
     "https://ibb.co/ZzFgfy6C",
     "https://ibb.co/fGPF4VnP",
     "https://ibb.co/5xhnPb7j",
     "https://ibb.co/JWkmJ0KK"
  
];

// VIDEO SIZE LIMIT — videos under this size (in MB) get stored
// and will persist. Larger videos show during the session only.
const VIDEO_PERSIST_LIMIT_MB = 3;

const PHOTO_PLACEHOLDER = (label = "📸") =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="360" viewBox="0 0 300 360">
      <rect width="300" height="360" fill="#1A3A6E"/>
      <rect x="2" y="2" width="296" height="356" fill="none" stroke="#4A90D9" stroke-width="1" stroke-dasharray="6 4" opacity="0.4"/>
      <text x="150" y="165" text-anchor="middle" font-size="48" fill="#4A90D9" opacity="0.35" font-family="serif">${label}</text>
      <text x="150" y="210" text-anchor="middle" font-size="13" fill="#4A90D9" opacity="0.4" font-family="sans-serif">add photo here</text>
    </svg>`
  )}`;

const photos = BIRTHDAY_PHOTOS.length > 0
  ? BIRTHDAY_PHOTOS
  : [PHOTO_PLACEHOLDER("📸"), PHOTO_PLACEHOLDER("🌸"), PHOTO_PLACEHOLDER("✨"), PHOTO_PLACEHOLDER("💙"), PHOTO_PLACEHOLDER("🎂")];

const WORD_TAGS = ["Safe Space","Chosen Family","Secret Keeper","Forever Duo","Soul Sister","Always Her","Main Character","Sunshine Person","Core Memory"];

// ════════════════════════════════════════════════════════════
export default function App() {
  const [memories, setMemories]     = useState([]);
  const [vidWishes, setVidWishes]   = useState([]);  // stored (small/persisted)
  const [sessionVids, setSessionVids] = useState([]); // large videos (session only)
  const [loading, setLoading]       = useState(true);
  const [memTab, setMemTab]         = useState("stories");

  // memory form
  const [authEmail, setAuthEmail]   = useState("");
  const [authStatus, setAuthStatus] = useState("idle");
  const [formData, setFormData]     = useState({ name:"", tagline:"", howWeMet:"", favouriteMoment:"", message:"" });
  const [memVideo, setMemVideo]     = useState(null);
  const [memVideoURL, setMemVideoURL] = useState(null);
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [openCard, setOpenCard]     = useState(null);

  // video-wish form
  const [vwEmail, setVwEmail]       = useState("");
  const [vwAuthStatus, setVwAuthStatus] = useState("idle");
  const [vwName, setVwName]         = useState("");
  const [vwFile, setVwFile]         = useState(null);
  const [vwPreviewURL, setVwPreviewURL] = useState(null);
  const [vwSubmit, setVwSubmit]     = useState("idle");
  const [vwSizeWarning, setVwSizeWarning] = useState(false);
  const [playingVid, setPlayingVid] = useState(null);

  const [loaded, setLoaded]         = useState(false);

  useEffect(() => { loadAll(); setTimeout(() => setLoaded(true), 200); }, []);

  // Change this URL to your live backend URL once deployed (e.g., https://your-backend.railway.app)
  const BACKEND_URL = "http://localhost:5000"; 

  async function loadAll() {
    try {
      // Fetch text memories from the global database
      const resMem = await fetch(`${BACKEND_URL}/api/memories`);
      if (resMem.ok) {
        const data = await resMem.json();
        setMemories(data);
      }
      
      // Fetch video wishes from the global database
      const resVid = await fetch(`${BACKEND_URL}/api/videos`);
      if (resVid.ok) {
        const data = await resVid.json();
        setVidWishes(data);
      }
    } catch (e) {
      console.error("Error connecting to global database server:", e);
    }
    setLoading(false);
  }

  async function saveMemory(mem) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mem)
      });
      
      if (response.ok) {
        const savedMemory = await response.json();
        setMemories(prev => [...prev, savedMemory]);
      }
    } catch (e) {
      console.error("Failed to sync memory across systems:", e);
    }
  }

  async function handleVwSubmit() {
    if (!vwName || !vwFile) return;
    setVwSubmit("submitting");

    try {
      // For videos, converting to Base64 to send safely to the database over an API
      const videoData64 = await toBase64(vwFile);
      
      const response = await fetch(`${BACKEND_URL}/api/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: vwName,
          email: vwEmail.trim().toLowerCase(),
          videoData: videoData64,
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        const savedVideo = await response.json();
        setVidWishes(prev => [...prev, savedVideo]);
        setVwSubmit("done");
      }
    } catch (e) {
      console.error("Failed to upload global video wish:", e);
      setVwSubmit("idle");
    }
  }


  function toBase64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  function fileSizeMB(file) { return file.size / (1024 * 1024); }

  // ── Memory auth ──────────────────────────────────────────
  function checkEmail() {
    setAuthStatus("checking");
    setTimeout(() => {
      const c = authEmail.trim().toLowerCase();
      if (memories.some(m => m.email === c)) { setAuthStatus("duplicate"); return; }
      if (APPROVED_EMAILS.map(e => e.toLowerCase()).includes(c)) { setAuthStatus("approved"); return; }
      setAuthStatus("denied");
    }, 700);
  }

  // ── Video-wish auth ──────────────────────────────────────
  function checkVwEmail() {
    setVwAuthStatus("checking");
    setTimeout(() => {
      const c = vwEmail.trim().toLowerCase();
      const allVids = [...vidWishes, ...sessionVids];
      if (allVids.some(v => v.email === c)) { setVwAuthStatus("duplicate"); return; }
      if (APPROVED_EMAILS.map(e => e.toLowerCase()).includes(c)) { setVwAuthStatus("approved"); return; }
      setVwAuthStatus("denied");
    }, 700);
  }

  // ── Handle video file selection for wish ────────────────
  function handleVwFileSelect(e) {
    const f = e.target.files[0];
    if (!f) return;
    const mb = fileSizeMB(f);
    if (mb > 100) { alert("Video is too large (max 100MB). Please compress it first."); return; }
    setVwFile(f);
    setVwPreviewURL(URL.createObjectURL(f)); // instant preview via object URL
    setVwSizeWarning(mb > VIDEO_PERSIST_LIMIT_MB);
  }

  // ── Handle video file selection for memory ───────────────
  function handleMemVideoSelect(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (fileSizeMB(f) > 100) { alert("Video is too large (max 100MB)."); return; }
    setMemVideo(f);
    setMemVideoURL(URL.createObjectURL(f)); // instant preview
  }

  // ── Submit memory ────────────────────────────────────────
  async function handleMemSubmit() {
    if (!formData.name || !formData.howWeMet || !formData.message) return;
    setSubmitStatus("submitting");

    let videoData = null;
    if (memVideo && fileSizeMB(memVideo) <= VIDEO_PERSIST_LIMIT_MB) {
      try { videoData = await toBase64(memVideo); } catch (_) {}
    }

    const mem = {
      id: `mem-${Date.now()}`,
      email: authEmail.trim().toLowerCase(),
      ...formData,
      videoData,        // stored if small enough
      videoURL: memVideoURL, // session-only object URL for immediate display
      timestamp: Date.now(),
    };

    await saveMemory(mem);
    // Keep session video URL in state for immediate display
    setMemories(prev => prev.map(m => m.id === mem.id ? { ...m, videoURL: memVideoURL } : m));
    setSubmitStatus("done");
  }


  function scrollTo(id) { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }
  function initials(n) { return n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2); }
  function formatDate(ts) { return new Date(ts).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" }); }

  // Merge persisted + session videos, deduplicate by id
  const allVidWishes = [...vidWishes, ...sessionVids.filter(sv => !vidWishes.some(v => v.email === sv.email))];
  const marqueeItems = [...WORD_TAGS, ...WORD_TAGS];
  const stripPhotos = [...photos, ...photos];
  const finalePhotos = photos.slice(0, 5);

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
    :root {
      --navy: #0b1528;         /* Dark midnight blue background background */
      --blue: #162a4d;         /* Deep royal shadow blue */
      --mid: #254a85;          /* Vibrant indigo tone */
      --sky: #a3c2ec;          /* Soft pastel mist blue */
      --pale: #cbdcf7;         /* Delicate steel lilac-blue */
      --frost: #e3ecf8;        /* Pearl cream tinted sky reflection */
      --white: #f5f8fc;        /* Bright ivory cream canvas */
      --ink: #0b1526;          /* Dark charcoal overlay */
      --dusty: #5c7299;        /* Sophisticated slate periwinkle */
      --accent: #dca38f;       /* Dusty blush rose gold accent */
      --gold: #e2b469;         /* Sunset amber-yellow highlight */
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    .site{font-family:'DM Sans',sans-serif;background:var(--white);color:var(--ink);overflow-x:hidden}

    /* NAV */
    .nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:.9rem 2.5rem;background:rgba(15,28,63,.93);backdrop-filter:blur(16px);border-bottom:1px solid rgba(74,144,217,.18)}
    .nav-logo{font-family:'Caveat',cursive;font-size:1.4rem;color:var(--accent)}
    .nav-links{display:flex;gap:2rem}
    .nav-link{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:rgba(200,222,255,.55);cursor:pointer;border:none;background:none;font-family:'DM Sans',sans-serif;transition:color .2s;padding:0}
    .nav-link:hover{color:var(--accent)}

    /* HERO */
    .hero{min-height:100vh;background:var(--navy);position:relative;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;align-items:center;padding:7rem 4rem 4rem;gap:3rem}
    @media(max-width:768px){.hero{grid-template-columns:1fr;padding:7rem 2rem 4rem;text-align:center}}
    .hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(74,144,217,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(74,144,217,.06) 1px,transparent 1px);background-size:60px 60px}
    .hero-glow1{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(42,91,168,.35) 0%,transparent 70%);top:-100px;left:-100px;pointer-events:none}
    .hero-glow2{position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(74,144,217,.2) 0%,transparent 70%);bottom:-50px;right:-50px;pointer-events:none}
    .stk{position:absolute;pointer-events:none;font-size:2.5rem;filter:drop-shadow(0 4px 10px rgba(0,0,0,.35))}
    .stk1{top:10%;left:3%;transform:rotate(-15deg);animation:fl1 6s ease-in-out infinite}
    .stk2{bottom:18%;right:3%;transform:rotate(-10deg);animation:fl2 6s ease-in-out infinite 2s}
    @keyframes fl1{0%,100%{transform:rotate(-15deg) translateY(0)}50%{transform:rotate(-15deg) translateY(-12px)}}
    @keyframes fl2{0%,100%{transform:rotate(-10deg) translateY(0)}50%{transform:rotate(-10deg) translateY(-10px)}}
    .hero-left{position:relative;z-index:1}
    .hero-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:99px;border:1px solid rgba(74,144,217,.3);background:rgba(74,144,217,.08);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin-bottom:2rem}
    .badge-star{color:var(--gold);animation:spin 4s linear infinite;display:inline-block}
    @keyframes spin{to{transform:rotate(360deg)}}
    .hero-eyebrow {
      font-family: 'Caveat', cursive;
      font-weight: 600;
      color: var(--white); /* This makes "the one, the only," text pure white */
    }
    .hero-age, .finale-sign, .strip-label, .gallery-caption {
      font-family: 'Caveat', cursive;
      font-weight: 600;
    }
    .hero-name {
      font-family: 'Playfair Display', serif;
      font-size: clamp(3.5rem, 9vw, 7.5rem);
      font-weight: 700;
      line-height: 1.0;
      letter-spacing: -0.02em;
      color: var(--white);
      margin-bottom: .3rem;
    }
    .hero-underline{display:block;width:70%;height:3px;background:linear-gradient(90deg,transparent,var(--sky),var(--accent),transparent);border-radius:99px;margin:.5rem 0 0}
    @media(max-width:768px){.hero-underline{margin:.5rem auto 0}}
    .hero-age{font-family:'Caveat',cursive;font-size:clamp(1.8rem,4vw,3rem);color:var(--gold);margin-top:1.2rem;margin-bottom:.5rem}
    .hero-sub{font-size:1rem;color:rgba(200,222,255,.5);line-height:1.9;max-width:420px;margin:1.5rem 0 2.5rem;font-weight:300}
    @media(max-width:768px){.hero-sub{margin:1.5rem auto 2.5rem}}
    .hero-cta{display:inline-flex;align-items:center;gap:12px;padding:15px 36px;border-radius:99px;background:linear-gradient(135deg,var(--mid),var(--sky));color:white;font-size:13px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;transition:all .3s;box-shadow:0 8px 32px rgba(42,91,168,.45)}
    .hero-cta:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(42,91,168,.55)}
    .hero-date{margin-top:1.5rem;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:rgba(200,222,255,.25)}
    .hero-right{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;height:520px}
    @media(max-width:768px){.hero-right{height:320px}}
    /* ── HERO ── */
    /* ... keep your existing hero background, grid, and text styles up here ... */

    /* POLAROID - Increased size and offset tracking */
    .polaroid {
      position: absolute;
      background: white;
      padding: 12px 12px 38px 12px;
      box-shadow: 0 15px 45px rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      transition: all .4s cubic-bezier(0.165, 0.84, 0.44, 1);
      cursor: default;
    }
    .polaroid img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: 2px;
    }

    /* Balanced structural spread for desktop layouts */
    .pol-0 { 
      width: 240px; 
      height: 290px; 
      transform: rotate(-11deg) translate(-95px, -35px); 
      z-index: 1; 
    }
    .pol-1 { 
      width: 235px; 
      height: 285px; 
      transform: rotate(6deg) translate(80px, -15px); 
      z-index: 2; 
    }
    .pol-2 { 
      width: 230px; 
      height: 280px; 
      transform: rotate(-4deg) translate(-5px, 65px); 
      z-index: 3; 
    }

    /* Seamless scaling adjustment on hover */
    .pol-0:hover, .pol-1:hover, .pol-2:hover { 
      z-index: 20; 
      transform: rotate(0deg) scale(1.05) translateY(-10px); 
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5); 
    }

    /* Balanced structural spread for small responsive screens / mobile */
    @media(max-width:768px) {
      .hero-right {
        height: 380px;
        margin-top: 2rem;
      }
      .pol-0 { width: 145px; height: 180px; transform: rotate(-11deg) translate(-60px, -20px); }
      .pol-1 { width: 140px; height: 175px; transform: rotate(6deg) translate(55px, -10px); }
      .pol-2 { width: 135px; height: 170px; transform: rotate(-4deg) translate(-5px, 45px); }
    }

    /* PHOTO STRIP */
    .photo-strip{background:var(--navy);padding:20px 0;overflow:hidden;border-top:1px solid rgba(74,144,217,.15);border-bottom:1px solid rgba(74,144,217,.15)}
    .strip-track{display:flex;gap:16px;white-space:nowrap;animation:strip 30s linear infinite}
    @keyframes strip{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    .strip-photo{width:100px;height:120px;flex-shrink:0;background:white;padding:6px 6px 22px;box-shadow:0 4px 16px rgba(0,0,0,.3);border-radius:1px}
    .strip-photo img{width:100%;height:100%;object-fit:cover;display:block}
    .strip-label{font-family:'Caveat',cursive;font-size:11px;color:var(--dusty);text-align:center;margin-top:4px}

    /* MARQUEE */
    .marquee-strip{background:linear-gradient(135deg,var(--mid),var(--blue));padding:13px 0;overflow:hidden}
    .marquee-track{display:flex;white-space:nowrap;animation:mq 28s linear infinite}
    @keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    .mq-item{font-family:'Caveat',cursive;font-size:1.1rem;color:rgba(200,222,255,.7);padding:0 2rem}
    .mq-dot{color:var(--gold);margin:0 .4rem}

    /* SECTION */
    .section{padding:5rem 2rem;max-width:900px;margin:0 auto}
    .sec-label{font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--sky);margin-bottom:1rem}
    .sec-title {
      font-family: 'Pacifico', serif;
      font-size: clamp(2rem, 4.5vw, 3.5rem);
      font-weight: 700;
      line-height: 1.15;
      margin-bottom: 1rem;
      color: var(--ink);
    }
    .sec-desc{font-size:.95rem;color:var(--dusty);line-height:1.8;max-width:500px;font-weight:300}

    /* GALLERY ROW */
    .gallery-row{display:flex;gap:16px;overflow-x:auto;padding:1.5rem 0;scrollbar-width:none;-ms-overflow-style:none;margin-top:2rem}
    .gallery-row::-webkit-scrollbar{display:none}
    .gallery-frame{flex-shrink:0;background:white;padding:8px 8px 28px;box-shadow:0 8px 24px rgba(15,28,63,.12);border-radius:2px;position:relative;transition:all .3s}
    .gallery-frame:hover{transform:rotate(0) scale(1.05) translateY(-4px);box-shadow:0 16px 40px rgba(15,28,63,.18);z-index:5}
    .gallery-frame:nth-child(odd){transform:rotate(-2deg)}
    .gallery-frame:nth-child(even){transform:rotate(1.5deg)}
    .gallery-frame img{width:140px;height:170px;object-fit:cover;display:block}
    .gallery-caption{font-family:'Caveat',cursive;font-size:12px;color:var(--dusty);text-align:center;position:absolute;bottom:6px;left:0;right:0}

    /* TABS */
    .tabs{display:flex;gap:0;margin-top:2.5rem;border:1px solid var(--pale);border-radius:14px;overflow:hidden;width:fit-content}
    .tab-btn{padding:10px 28px;font-size:13px;letter-spacing:.06em;font-family:'DM Sans',sans-serif;border:none;cursor:pointer;transition:all .2s;background:transparent;color:var(--dusty)}
    .tab-btn.active{background:linear-gradient(135deg,var(--mid),var(--sky));color:white}
    .tab-btn:not(.active):hover{background:var(--frost);color:var(--blue)}
    .tab-count{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;font-size:10px;margin-left:6px;background:rgba(255,255,255,.25)}
    .tab-btn:not(.active) .tab-count{background:var(--pale);color:var(--mid)}

    /* MEMORIES GRID */
    .memories-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;margin-top:2rem}
    .mem-card{background:white;border:1px solid var(--pale);border-radius:20px;padding:1.6rem;cursor:pointer;transition:all .3s;position:relative;overflow:hidden}
    .mem-card:hover{transform:translateY(-6px) rotate(.4deg);box-shadow:0 20px 50px rgba(15,28,63,.12);border-color:var(--sky)}
    .mem-card-bar{height:3px;border-radius:99px;background:linear-gradient(90deg,var(--mid),var(--accent));margin-bottom:1.2rem}
    .mem-head{display:flex;align-items:center;gap:12px;margin-bottom:1rem}
    .mem-av{width:42px;height:42px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--mid),var(--sky));display:flex;align-items:center;justify-content:center;font-family:'Instrument Serif',serif;font-size:1rem;color:white}
    .mem-name{font-size:15px;font-weight:500;color:var(--ink)}
    .mem-tag{font-size:11px;color:var(--dusty);font-style:italic;margin-top:2px}
    .mem-msg{font-family:'Instrument Serif',serif;font-style:italic;font-size:1rem;color:var(--blue);line-height:1.65;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .mem-footer{display:flex;align-items:center;justify-content:space-between;margin-top:1.2rem}
    .mem-date{font-size:10px;color:#bcc8e0;letter-spacing:.05em}
    .mem-read{font-size:11px;color:var(--sky);border:1px solid var(--pale);border-radius:99px;padding:3px 10px;transition:all .2s}
    .mem-card:hover .mem-read{border-color:var(--sky);background:var(--frost)}
    .mem-vid-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;color:var(--mid);background:var(--frost);border:1px solid var(--pale);border-radius:99px;padding:2px 8px;margin-top:8px}

    /* VIDEO WISHES GRID */
    .vid-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;margin-top:2rem}
    .vid-wish-card{background:var(--navy);border:1px solid rgba(74,144,217,.2);border-radius:20px;overflow:hidden;cursor:pointer;transition:all .3s;position:relative}
    .vid-wish-card:hover{transform:translateY(-4px);box-shadow:0 20px 50px rgba(15,28,63,.35);border-color:var(--sky)}
    .vid-thumb-wrap{position:relative;width:100%;aspect-ratio:9/12;overflow:hidden;background:var(--blue)}
    .vid-thumb{width:100%;height:100%;object-fit:cover;display:block}
    .vid-play-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(15,28,63,.4);transition:background .2s}
    .vid-wish-card:hover .vid-play-overlay{background:rgba(15,28,63,.55)}
    .vid-play-btn{width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);border:2px solid rgba(255,255,255,.45);display:flex;align-items:center;justify-content:center;font-size:1.3rem;transition:all .2s}
    .vid-wish-card:hover .vid-play-btn{background:rgba(255,255,255,.28);transform:scale(1.1)}
    .vid-wish-meta{padding:1rem 1.2rem}
    .vid-wish-name{font-size:14px;font-weight:500;color:var(--white)}
    .vid-wish-date{font-size:10px;color:rgba(200,222,255,.35);margin-top:2px}
    .vid-session-tag{display:inline-block;font-size:9px;color:var(--gold);border:1px solid rgba(240,192,96,.3);border-radius:99px;padding:1px 7px;margin-top:4px;letter-spacing:.04em}

    /* VIDEO WISH FORM */
    .post-vid-box{background:var(--frost);border:1px solid var(--pale);border-radius:20px;padding:2rem;margin-top:2rem}
    .pvb-title{font-family:'Instrument Serif',serif;font-size:1.4rem;color:var(--ink);margin-bottom:.4rem}
    .pvb-desc{font-size:.9rem;color:var(--dusty);margin-bottom:1.5rem;line-height:1.7;font-weight:300}
    .pvb-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:.75rem}
    .pvb-input{flex:1;min-width:180px;padding:11px 15px;border:1px solid var(--pale);border-radius:10px;font-size:14px;font-family:'DM Sans',sans-serif;background:white;color:var(--ink);outline:none;transition:border-color .2s}
    .pvb-input:focus{border-color:var(--sky)}
    .pvb-input::placeholder{color:#9ab0d0}
    .pvb-vbtn{padding:11px 22px;border-radius:10px;background:linear-gradient(135deg,var(--mid),var(--sky));color:white;font-size:13px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap;transition:all .2s}
    .pvb-vbtn:disabled{opacity:.4;cursor:default}
    .pvb-s-ok{font-size:12px;color:#4A8A5A;margin-bottom:.8rem;font-weight:500}
    .pvb-s-no{font-size:12px;color:#A85A5A;margin-bottom:.8rem}
    .pvb-s-dup{font-size:12px;color:#A87A3A;margin-bottom:.8rem}
    .lock-row{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--dusty);margin-top:6px;opacity:.7}

    /* Upload box */
    .upload-box{position:relative;border:2px dashed var(--pale);border-radius:14px;padding:2rem 1.5rem;text-align:center;cursor:pointer;transition:all .2s;background:white;margin-bottom:1rem}
    .upload-box:hover{border-color:var(--sky);background:var(--frost)}
    .upload-box input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
    .upload-icon{font-size:2.2rem;margin-bottom:.5rem}
    .upload-main-txt{font-size:14px;color:var(--blue);font-weight:500;margin-bottom:.2rem}
    .upload-sub-txt{font-size:12px;color:var(--dusty)}
    .vid-preview-box{margin-top:.8rem;border-radius:12px;overflow:hidden;background:black;position:relative}
    .vid-preview-box video{width:100%;max-height:260px;display:block}
    .vid-size-warn{background:rgba(240,192,96,.12);border:1px solid rgba(240,192,96,.35);border-radius:10px;padding:.7rem 1rem;font-size:12px;color:#7A5A00;margin-top:.6rem;line-height:1.5}
    .pvb-submit{padding:13px 30px;border-radius:10px;background:linear-gradient(135deg,var(--mid),var(--sky));color:white;font-size:14px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;letter-spacing:.05em;transition:all .25s;box-shadow:0 6px 20px rgba(42,91,168,.35)}
    .pvb-submit:hover{transform:translateY(-2px)}
    .pvb-submit:disabled{opacity:.4;cursor:default;transform:none}
    .pvb-done{text-align:center;padding:2rem}
    .pvb-done-icon{font-size:2.5rem;margin-bottom:.75rem}
    .pvb-done-title{font-family:'Caveat',cursive;font-size:1.8rem;color:#4A8A5A}
    .pvb-done-sub{font-size:13px;color:var(--dusty);margin-top:.5rem;line-height:1.6}

    /* EMPTY STATE */
    .empty-state{grid-column:1/-1;text-align:center;padding:4rem 2rem;background:var(--frost);border:2px dashed var(--pale);border-radius:24px}
    .empty-icon{font-size:3rem;margin-bottom:1rem}
    .empty-state p{color:var(--dusty);font-size:.95rem;line-height:1.7}

    /* MODAL */
    .mo{position:fixed;inset:0;z-index:200;background:rgba(10,22,40,.8);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:2rem}
    .mo-box{background:var(--white);border-radius:24px;max-width:580px;width:100%;max-height:85vh;overflow-y:auto;padding:2.5rem;position:relative;border:1px solid var(--pale);box-shadow:0 40px 80px rgba(10,22,40,.3)}
    .mo-vid-box{background:var(--navy);border-radius:24px;max-width:440px;width:100%;position:relative;overflow:hidden;box-shadow:0 40px 80px rgba(10,22,40,.5)}
    .mo-vid-full{width:100%;display:block}
    .mo-close-light{position:absolute;top:1rem;right:1rem;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.4);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:white;transition:all .2s;z-index:10}
    .mo-close-light:hover{background:rgba(0,0,0,.6)}
    .mo-close-dark{position:absolute;top:1rem;right:1rem;width:32px;height:32px;border-radius:50%;border:1px solid var(--pale);background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--dusty);transition:all .2s}
    .mo-close-dark:hover{border-color:var(--ink);color:var(--ink)}
    .mo-name{font-family:'Instrument Serif',serif;font-size:1.8rem;margin-bottom:.3rem}
    .mo-tagline{font-size:13px;color:var(--dusty);font-style:italic;margin-bottom:2rem}
    .mo-label{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--sky);margin-bottom:.5rem;display:block}
    .mo-text{font-size:14px;color:#2a3f5f;line-height:1.75;font-weight:300}
    .mo-msg{font-family:'Instrument Serif',serif;font-style:italic;font-size:1.2rem;color:var(--blue);line-height:1.6}
    .mo-div{height:1px;background:var(--pale);margin:1.5rem 0}
    .mo-vid{width:100%;border-radius:14px;margin-top:.8rem}

    /* WRITE SECTION */
    .write-wrap{background:var(--navy);position:relative;overflow:hidden}
    .write-glow{position:absolute;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(42,91,168,.28) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
    .write-inner{position:relative;z-index:1;max-width:900px;margin:0 auto;padding:6rem 2rem}
    .write-box{background:rgba(255,255,255,.04);border:1px solid rgba(74,144,217,.18);border-radius:24px;padding:2.5rem;margin-top:2.5rem;backdrop-filter:blur(10px)}
    .wlabel{display:block;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(200,222,255,.45);margin-bottom:7px}
    .winput{width:100%;padding:12px 16px;border:1px solid rgba(74,144,217,.18);border-radius:12px;font-size:14px;font-family:'DM Sans',sans-serif;background:rgba(255,255,255,.05);color:var(--white);outline:none;transition:border-color .2s}
    .winput:focus{border-color:var(--sky)}
    .winput::placeholder{color:rgba(200,222,255,.22)}
    .wtextarea{width:100%;padding:12px 16px;border:1px solid rgba(74,144,217,.18);border-radius:12px;font-size:14px;font-family:'DM Sans',sans-serif;background:rgba(255,255,255,.05);color:var(--white);outline:none;resize:vertical;line-height:1.65;transition:border-color .2s}
    .wtextarea:focus{border-color:var(--sky)}
    .wtextarea::placeholder{color:rgba(200,222,255,.22)}
    .auth-row{display:flex;gap:12px;flex-wrap:wrap}
    .auth-row .winput{flex:1;min-width:200px}
    .vbtn{padding:12px 24px;border-radius:12px;background:linear-gradient(135deg,var(--mid),var(--sky));color:white;font-size:13px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;letter-spacing:.05em;transition:all .2s;white-space:nowrap}
    .vbtn:hover{opacity:.85}
    .vbtn:disabled{opacity:.4;cursor:default}
    .s-ok{font-size:13px;color:#7ECBA1;margin-top:6px}
    .s-no{font-size:13px;color:#FF8FAB;margin-top:6px}
    .s-dup{font-size:13px;color:var(--gold);margin-top:6px}
    .wform{margin-top:2rem;display:flex;flex-direction:column;gap:16px}
    .wgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .wfull{grid-column:1/-1}
    .wdiv{height:1px;background:rgba(74,144,217,.12)}
    .sbtn{padding:15px 36px;border-radius:12px;background:linear-gradient(135deg,var(--mid),var(--sky));color:white;font-size:14px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;letter-spacing:.06em;transition:all .25s;box-shadow:0 8px 24px rgba(42,91,168,.4);align-self:flex-start}
    .sbtn:hover{transform:translateY(-2px);box-shadow:0 14px 32px rgba(42,91,168,.5)}
    .sbtn:disabled{opacity:.4;cursor:default;transform:none}
    .w-upload-box{position:relative;border:2px dashed rgba(74,144,217,.22);border-radius:14px;padding:1.8rem;text-align:center;cursor:pointer;transition:border-color .2s;background:rgba(255,255,255,.03)}
    .w-upload-box:hover{border-color:var(--sky)}
    .w-upload-box input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
    .w-upload-icon{font-size:2rem;margin-bottom:.5rem}
    .w-upload-txt{font-size:13px;color:rgba(200,222,255,.35)}
    .w-vid-preview{width:100%;border-radius:10px;margin-top:.8rem;max-height:200px}
    .done-box{text-align:center;padding:3rem 2rem;background:rgba(126,203,161,.07);border:1px solid rgba(126,203,161,.18);border-radius:16px}
    .done-icon{font-size:3rem;margin-bottom:1rem}
    .done-title{font-family:'Caveat',cursive;font-size:2rem;color:#7ECBA1;margin-bottom:.75rem}
    .done-txt{font-size:14px;color:rgba(200,222,255,.45);line-height:1.7;font-weight:300}

    /* FINALE */
    .finale{background:var(--navy);text-align:center;padding:8rem 2rem;position:relative;overflow:hidden}
    .finale-bg{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family:'Instrument Serif',serif;font-size:clamp(12rem,35vw,22rem);font-weight:400;color:rgba(255,255,255,.025);line-height:1;pointer-events:none;white-space:nowrap}
    .finale-in{position:relative;z-index:1;max-width:600px;margin:0 auto}
    .finale-lbl{font-size:10px;letter-spacing:.25em;text-transform:uppercase;color:rgba(200,222,255,.28);margin-bottom:2rem}
    .finale-h{font-family:'Instrument Serif',serif;font-size:clamp(3rem,7vw,5.5rem);font-weight:400;color:var(--white);line-height:1.1;margin-bottom:1.5rem}
    .finale-h em{font-style:italic;color:var(--accent)}
    .finale-p{font-size:1rem;color:rgba(200,222,255,.42);line-height:1.9;font-weight:300}
    .finale-sign{margin-top:3rem;font-family:'Caveat',cursive;font-size:1.8rem;color:var(--gold)}
    .finale-hearts{margin-top:2rem;font-size:1.4rem;letter-spacing:.3em;animation:hb 2s ease-in-out infinite}
    @keyframes hb{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(.93)}}
    .finale-photos{display:flex;justify-content:center;gap:20px;margin-bottom:3rem;flex-wrap:wrap}
    .fp-frame{background:white;padding:7px 7px 26px;box-shadow:0 8px 30px rgba(0,0,0,.4);border-radius:2px;width:110px;flex-shrink:0}
    .fp-frame:nth-child(odd){transform:rotate(-4deg)}
    .fp-frame:nth-child(even){transform:rotate(3deg)}
    .fp-frame:nth-child(3){transform:rotate(-1.5deg)}
    .fp-frame img{width:100%;height:130px;object-fit:cover;display:block}

    .fade{opacity:0;transform:translateY(24px);transition:opacity .8s ease,transform .8s ease}
    .fade.in{opacity:1;transform:translateY(0)}
    @media(max-width:600px){.wgrid{grid-template-columns:1fr}.vid-grid{grid-template-columns:1fr 1fr}}
  `;

  return (
    <div className="site">
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="nav">
        <span className="nav-logo">for {BIRTHDAY_PERSON} ✦</span>
        <div className="nav-links">
          <button className="nav-link" onClick={() => scrollTo("hero")}>Home</button>
          <button className="nav-link" onClick={() => scrollTo("memories")}>Memories</button>
          <button className="nav-link" onClick={() => scrollTo("write")}>Write</button>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" className="hero">
        <div className="hero-grid" />
        <div className="hero-glow1" />
        <div className="hero-glow2" />
        <span className="stk stk1">🎂</span>
        <span className="stk stk2">💙</span>

        <div className={`hero-left fade ${loaded ? "in" : ""}`} style={{ transitionDelay: "0.1s" }}>
          <div className="hero-badge">
            <span className="badge-star">✦</span>
            a little corner of the internet, made just for you
            <span className="badge-star">✦</span>
          </div>
          <p className="hero-eyebrow">the one, the only,</p>
          <h1 className="hero-name">
            {BIRTHDAY_PERSON}
            <span className="hero-underline" />
          </h1>
          <p className="hero-age">turning {TURNING_AGE} 🎉</p>
          <p className="hero-sub">The people who love you most have left little pieces of themselves here — memories, moments, and words that only you could have inspired.</p>
          <button className="hero-cta" onClick={() => scrollTo("memories")}>↓ &nbsp; Read their memories</button>
          <p className="hero-date">{BIRTHDAY_DATE}</p>
        </div>

        <div className={`hero-right fade ${loaded ? "in" : ""}`} style={{ transitionDelay: "0.35s" }}>
          <div className="polaroid pol-0"><img src={photos[0]} alt="" /></div>
          <div className="polaroid pol-1"><img src={photos[1]} alt="" /></div>
          <div className="polaroid pol-2"><img src={photos[2]} alt="" /></div>
        </div>
      </section>

      {/* PHOTO STRIP */}
      <div className="photo-strip">
        <div className="strip-track">
          {stripPhotos.map((p, i) => (
            <div key={i} className="strip-photo">
              <img src={p} alt="" />
              <div className="strip-label">📸</div>
            </div>
          ))}
        </div>
      </div>

      {/* MARQUEE */}
      <div className="marquee-strip">
        <div className="marquee-track">
          {marqueeItems.map((t, i) => (
            <span key={i} className="mq-item">{t} <span className="mq-dot">✦</span></span>
          ))}
        </div>
      </div>

      {/* MEMORIES + VIDEO WISHES */}
      <section id="memories" className="section">
        <p className="sec-label">Fragments & Stories</p>
        <h2 className="sec-title">What people remember</h2>
        <p className="sec-desc">Memories, moments, and video wishes — all in one place.</p>

        {BIRTHDAY_PHOTOS.length > 0 && (
          <div className="gallery-row">
            {photos.map((p, i) => (
              <div key={i} className="gallery-frame">
                <img src={p} alt="" />
                <div className="gallery-caption">✦</div>
              </div>
            ))}
          </div>
        )}

        <div className="tabs">
          <button className={`tab-btn ${memTab === "stories" ? "active" : ""}`} onClick={() => setMemTab("stories")}>
            💌 Written Memories <span className="tab-count">{memories.length}</span>
          </button>
          <button className={`tab-btn ${memTab === "videos" ? "active" : ""}`} onClick={() => setMemTab("videos")}>
            🎥 Video Wishes <span className="tab-count">{allVidWishes.length}</span>
          </button>
        </div>

        {/* STORIES TAB */}
        {memTab === "stories" && (
          <div className="memories-grid">
            {loading
              ? <div className="empty-state"><div className="empty-icon">⏳</div><p>Loading memories…</p></div>
              : memories.length === 0
              ? <div className="empty-state"><div className="empty-icon">💌</div><p>No memories yet — scroll down to be the first.</p></div>
              : memories.map(mem => (
                <div key={mem.id} className="mem-card" onClick={() => setOpenCard(mem)}>
                  <div className="mem-card-bar" />
                  <div className="mem-head">
                    <div className="mem-av">{initials(mem.name)}</div>
                    <div>
                      <p className="mem-name">{mem.name}</p>
                      {mem.tagline && <p className="mem-tag">{mem.tagline}</p>}
                    </div>
                  </div>
                  <p className="mem-msg">"{mem.message}"</p>
                  {(mem.videoData || mem.videoURL) && <div className="mem-vid-badge">▶ Video attached</div>}
                  <div className="mem-footer">
                    <span className="mem-date">{formatDate(mem.timestamp)}</span>
                    <span className="mem-read">Read →</span>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* VIDEOS TAB */}
        {memTab === "videos" && (
          <>
            <div className="vid-grid">
              {loading
                ? <div className="empty-state"><div className="empty-icon">⏳</div><p>Loading…</p></div>
                : allVidWishes.length === 0
                ? <div className="empty-state"><div className="empty-icon">🎥</div><p>No video wishes yet — be the first to post one below!</p></div>
                : allVidWishes.map(vw => (
                  <div key={vw.id} className="vid-wish-card" onClick={() => setPlayingVid(vw)}>
                    <div className="vid-thumb-wrap">
                      <video
                        className="vid-thumb"
                        src={vw.videoURL || vw.videoData}
                        muted playsInline preload="metadata"
                      />
                      <div className="vid-play-overlay">
                        <div className="vid-play-btn">▶</div>
                      </div>
                    </div>
                    <div className="vid-wish-meta">
                      <p className="vid-wish-name">{vw.name}</p>
                      <p className="vid-wish-date">{formatDate(vw.timestamp)}</p>
                      {vw.sessionOnly && <span className="vid-session-tag">visible this session</span>}
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Post Video Wish Form */}
            <div className="post-vid-box">
              <p className="pvb-title">Post your video wish 🎥</p>
              <p className="pvb-desc">Verify your email, then upload a video birthday message for her.</p>

              {vwSubmit === "done" ? (
                <div className="pvb-done">
                  <div className="pvb-done-icon">🎉</div>
                  <p className="pvb-done-title">Video wish posted!</p>
                  <p className="pvb-done-sub">Your video is now visible on this page.</p>
                </div>
              ) : (
                <>
                  <div className="pvb-row">
                    <input className="pvb-input" type="email" placeholder="your email address"
                      value={vwEmail}
                      onChange={e => { setVwEmail(e.target.value); setVwAuthStatus("idle"); }}
                      disabled={vwAuthStatus === "approved"} />
                    {vwAuthStatus !== "approved" && (
                      <button className="pvb-vbtn" onClick={checkVwEmail}
                        disabled={!vwEmail || vwAuthStatus === "checking"}>
                        {vwAuthStatus === "checking" ? "Checking…" : "Verify"}
                      </button>
                    )}
                  </div>
                  {vwAuthStatus === "approved" && <p className="pvb-s-ok">✓ Verified! Upload your video below.</p>}
                  {vwAuthStatus === "denied" && <p className="pvb-s-no">✗ This email isn't on the approved list.</p>}
                  {vwAuthStatus === "duplicate" && <p className="pvb-s-dup">You've already posted a video wish.</p>}
                  <p className="lock-row"><span>🔒</span> Only approved emails can post</p>

                  {vwAuthStatus === "approved" && (
                    <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--dusty)", marginBottom: 7 }}>Your name *</label>
                        <input className="pvb-input" style={{ width: "100%" }}
                          placeholder="How you want to appear on your card"
                          value={vwName} onChange={e => setVwName(e.target.value)} />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--dusty)", marginBottom: 7 }}>Your video *</label>
                        <div className="upload-box">
                          <input type="file" accept="video/*" onChange={handleVwFileSelect} />
                          {vwPreviewURL ? (
                            <div className="vid-preview-box">
                              <video src={vwPreviewURL} controls style={{ width: "100%", maxHeight: 260 }} />
                            </div>
                          ) : (
                            <>
                              <div className="upload-icon">🎥</div>
                              <p className="upload-main-txt">Click to select your video</p>
                              <p className="upload-sub-txt">MP4, MOV, WEBM · up to 100MB</p>
                            </>
                          )}
                        </div>
                        {vwSizeWarning && (
                          <div className="vid-size-warn">
                            ⚡ Your video is over {VIDEO_PERSIST_LIMIT_MB}MB, so it will show on screen now but won't be stored permanently across sessions. To make it persist, compress it first using <strong>handbrake.fr</strong> or <strong>clideo.com/compress-video</strong>.
                          </div>
                        )}
                      </div>

                      <button className="pvb-submit" onClick={handleVwSubmit}
                        disabled={!vwName || !vwFile || vwSubmit === "submitting"}>
                        {vwSubmit === "submitting" ? "Uploading…" : "Post my video wish →"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </section>

      {/* WRITE MEMORY */}
      <div id="write" className="write-wrap">
        <div className="write-glow" />
        <div className="write-inner">
          <p className="sec-label" style={{ color: "var(--accent)" }}>Add Your Fragment</p>
          <h2 className="sec-title" style={{ color: "var(--white)" }}>Leave a written memory</h2>
          <p className="sec-desc" style={{ color: "rgba(200,222,255,.42)" }}></p>

          <div className="write-box">
            {submitStatus === "done" ? (
              <div className="done-box">
                <div className="done-icon">🎉</div>
                <p className="done-title">Memory saved ✦</p>
                <p className="done-txt">Your words are now part of this page. She'll find them here when she visits.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="wlabel">Your email address</label>
                  <div className="auth-row">
                    <input className="winput" type="email" placeholder="you@example.com"
                      value={authEmail}
                      onChange={e => { setAuthEmail(e.target.value); setAuthStatus("idle"); }}
                      disabled={authStatus === "approved"} />
                    {authStatus !== "approved" && (
                      <button className="vbtn" onClick={checkEmail}
                        disabled={!authEmail || authStatus === "checking"}>
                        {authStatus === "checking" ? "Checking…" : "Verify access"}
                      </button>
                    )}
                  </div>
                  {authStatus === "approved" && <p className="s-ok">✓ Access granted — write your memory below</p>}
                  {authStatus === "denied" && <p className="s-no">✗ This email isn't on the approved list.</p>}
                  {authStatus === "duplicate" && <p className="s-dup">You've already written a memory.</p>}
                  <p className="lock-row" style={{ color: "rgba(200,222,255,.28)" }}><span>🔒</span> Only pre-approved emails can post</p>
                </div>

                {authStatus === "approved" && (
                  <div className="wform">
                    <div className="wdiv" />
                    <div className="wgrid">
                      <div>
                        <label className="wlabel">Your name *</label>
                        <input className="winput" placeholder="How you want to appear"
                          value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="wlabel">A short tagline (optional)</label>
                        <input className="winput" placeholder="e.g. her college roommate…"
                          value={formData.tagline} onChange={e => setFormData({ ...formData, tagline: e.target.value })} />
                      </div>
                      <div className="wfull">
                        <label className="wlabel">How did you two meet? *</label>
                        <textarea className="wtextarea" rows={3} placeholder="The story of how you first crossed paths…"
                          value={formData.howWeMet} onChange={e => setFormData({ ...formData, howWeMet: e.target.value })} />
                      </div>
                      <div className="wfull">
                        <label className="wlabel">A favourite moment (optional)</label>
                        <textarea className="wtextarea" rows={3} placeholder="That one memory that still makes you smile…"
                          value={formData.favouriteMoment} onChange={e => setFormData({ ...formData, favouriteMoment: e.target.value })} />
                      </div>
                      <div className="wfull">
                        <label className="wlabel">Your birthday message *</label>
                        <textarea className="wtextarea" rows={4} placeholder="What do you want her to know on this day?"
                          value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} />
                      </div>
                      <div className="wfull">
                        <label className="wlabel">Attach a video (optional)</label>
                        <div className="w-upload-box">
                          <input type="file" accept="video/*" onChange={handleMemVideoSelect} />
                          {memVideoURL ? (
                            <video src={memVideoURL} className="w-vid-preview" controls />
                          ) : (
                            <>
                              <div className="w-upload-icon">🎥</div>
                              <p className="w-upload-txt">Click to attach a video wish</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="sbtn" onClick={handleMemSubmit}
                      disabled={!formData.name || !formData.howWeMet || !formData.message || submitStatus === "submitting"}>
                      {submitStatus === "submitting" ? "Saving…" : "Leave my memory →"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* FINALE */}
      <div className="finale">
        <div className="finale-bg">{TURNING_AGE}</div>
        <div className="finale-in">
          {finalePhotos.length > 0 && (
            <div className="finale-photos">
              {finalePhotos.map((p, i) => (
                <div key={i} className="fp-frame"><img src={p} alt="" /></div>
              ))}
            </div>
          )}
          <p className="finale-lbl">{BIRTHDAY_DATE}</p>
          <h2 className="finale-h">
            Here's to soft days,<br />
            <em>beautiful surprises,</em><br />
            and being exactly you.
          </h2>
          <p className="finale-p">May this year hold everything you've quietly hoped for — and a few beautiful things you never even thought to wish for.</p>
          <p className="finale-sign">Happy {TURNING_AGE}th, {BIRTHDAY_PERSON} ✦</p>
          <div className="finale-hearts">💙 🩵 💙</div>
        </div>
      </div>

      {/* MODAL: memory card */}
      {openCard && (
        <div className="mo" onClick={() => setOpenCard(null)}>
          <div className="mo-box" onClick={e => e.stopPropagation()}>
            <button className="mo-close-dark" onClick={() => setOpenCard(null)}>×</button>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "1.5rem" }}>
              <div className="mem-av" style={{ width: 52, height: 52, fontSize: "1.15rem" }}>{initials(openCard.name)}</div>
              <div>
                <p className="mo-name">{openCard.name}</p>
                {openCard.tagline && <p className="mo-tagline">{openCard.tagline}</p>}
              </div>
            </div>
            {openCard.howWeMet && (<><span className="mo-label">How we met</span><p className="mo-text">{openCard.howWeMet}</p><div className="mo-div" /></>)}
            {openCard.favouriteMoment && (<><span className="mo-label">A favourite moment</span><p className="mo-text">{openCard.favouriteMoment}</p><div className="mo-div" /></>)}
            <span className="mo-label">Birthday message</span>
            <p className="mo-msg">"{openCard.message}"</p>
            {(openCard.videoURL || openCard.videoData) && (
              <><div className="mo-div" /><span className="mo-label">Video wish</span>
              <video src={openCard.videoURL || openCard.videoData} className="mo-vid" controls /></>
            )}
            <p style={{ fontSize: 11, color: "#bcc8e0", marginTop: "1.5rem" }}>{formatDate(openCard.timestamp)}</p>
          </div>
        </div>
      )}

      {/* MODAL: video wish player */}
      {playingVid && (
        <div className="mo" onClick={() => setPlayingVid(null)}>
          <div className="mo-vid-box" onClick={e => e.stopPropagation()}>
            <button className="mo-close-light" onClick={() => setPlayingVid(null)}>×</button>
            <video
              src={playingVid.videoURL || playingVid.videoData}
              className="mo-vid-full"
              controls autoPlay
            />
            <div style={{ padding: "1rem 1.5rem", background: "rgba(255,255,255,.04)" }}>
              <p style={{ fontFamily: "'Instrument Serif',serif", fontSize: "1.2rem", color: "var(--white)" }}>{playingVid.name}</p>
              <p style={{ fontSize: 11, color: "rgba(200,222,255,.35)", marginTop: 4 }}>{formatDate(playingVid.timestamp)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
