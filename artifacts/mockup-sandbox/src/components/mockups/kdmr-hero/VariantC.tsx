import "./_group.css";

export function VariantC() {
  return (
    <div className="kdmr-root" style={{ background: "#000" }}>
      <section className="vc-hero">
        <img src="/__mockup/images/finafayena.png" alt="Finafayena Primus" />
        <div className="vc-vignette" />

        <div className="vc-top">
          <span className="left">2026 Season</span>
          <span className="right">
            <span className="live-dot" />
            Legend of the Week
          </span>
        </div>

        <div className="vc-bottom">
          <span className="vc-badge">Juara KDCA Klang Valley 2026</span>
          <h1 style={{ fontSize: "2.6rem", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 0.98, color: "#ffffff", margin: "0 0 10px", textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}>
            Finafayena<br />Primus
          </h1>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#f0a820", marginBottom: 16 }}>
            Unduk Ngadau · KDCA Klang Valley
          </div>
          <p style={{ fontSize: "0.85rem", color: "rgba(240,240,240,0.78)", lineHeight: 1.65, margin: "0 0 22px", maxWidth: 320, textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}>
            Crowned this year on the Klang Valley stage — Kadazan poise carried into the 2026 state final.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <a className="kdmr-cta" href="#">Explore Her Story →</a>
            <button className="kdmr-vote" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21C12 21 3 13.5 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-9 13-9 13z" /></svg>
              Vote
            </button>
          </div>
          <div style={{ marginTop: 14, fontSize: "0.62rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            342 community votes
          </div>
        </div>
      </section>
    </div>
  );
}
