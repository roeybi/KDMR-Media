import "./_group.css";

export function Current() {
  return (
    <div className="kdmr-root">
      <section className="cur-hero">
        <div className="cur-portrait">
          <div className="cur-deco" aria-hidden="true" />
          <div style={{ position: "absolute", top: 18, left: 18, zIndex: 3, fontSize: "0.54rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,168,32,0.5)", border: "1px solid rgba(240,168,32,0.12)", padding: "4px 11px", borderRadius: 2 }}>
            2026 Season
          </div>
          <div className="cur-avatar">
            <img src="/__mockup/images/finafayena.png" alt="Finafayena Primus" />
          </div>
          <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", zIndex: 3 }}>
            <span style={{ display: "inline-block", background: "rgba(240,168,32,0.08)", border: "1px solid rgba(240,168,32,0.22)", color: "#f0a820", fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 2, whiteSpace: "nowrap" }}>
              Juara KDCA Klang Valley 2026
            </span>
          </div>
        </div>

        <div className="cur-story">
          <div style={{ maxWidth: 500, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <span className="live-dot" />
              <span style={{ fontSize: "0.56rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#f0a820" }}>Legend of the Week</span>
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.04, color: "#f0f0f0", margin: "0 0 10px" }}>
              Finafayena Primus
            </h1>
            <div style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f0a820", opacity: 0.75, marginBottom: 18 }}>
              Unduk Ngadau · KDCA Klang Valley
            </div>
            <p style={{ fontSize: "0.88rem", color: "#5a5a5a", lineHeight: 1.85, margin: "0 0 26px" }}>
              Crowned this year on the Klang Valley stage, Finafayena carries Kadazan poise and a quiet command of Dusun heritage into the 2026 state final.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <a className="kdmr-cta" href="#">Explore Her Story →</a>
              <button className="kdmr-vote">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21C12 21 3 13.5 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-9 13-9 13z" /></svg>
                Community Vote
              </button>
            </div>
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: "0.66rem", color: "#444", letterSpacing: "0.06em" }}>342 votes</div>
              <button className="kdmr-share">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                Share
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
