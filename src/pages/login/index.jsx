import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import LoginHeader from "./components/LoginHeader";
import LoginForm from "./components/LoginForm";
import LoginShowcase from "./components/LoginShowcase";
import DiwaliWordmark from "components/DiwaliWordmark";
import RisingCrackers from "components/RisingCrackers";
import { motion } from "framer-motion";

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = localStorage.getItem("auth_token");
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Sign In - Aajneeti Connect CRM</title>
        <meta
          name="description"
          content="Sign in to your Aajneeti Connect account to access your sales pipeline, customer data, and CRM tools."
        />
      </Helmet>

      <RisingCrackers />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative min-h-screen lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-[1.18fr_1fr] bg-[#fffaf4]"
      >
        {/* ── LEFT — brand showcase ───────────────────────────── */}
        <LoginShowcase />

        {/* ── RIGHT — sign-in ─────────────────────────────────── */}
        <div className="relative flex items-center justify-center overflow-hidden bg-[#fdf6ea] p-6 sm:p-8 lg:p-6 xl:p-8">
          {/* Gold wave landscape as the ground.
              
              Held at 45% with the brightness lifted and the saturation pulled
              back: at full strength the tan midtones turned the panel muddy
              and fought the white card. Faint and desaturated it reads as a
              silk texture, which is what the panel wants.
              
              `object-cover object-bottom` keeps the lit ridges in the lower
              half and crops the empty sky rather than squashing it. */}
          <img
            src="/assets/festival/wave.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-bottom opacity-[0.45]"
            style={{ filter: "brightness(1.1) saturate(0.78)" }}
          />

          {/* One light veil rather than the heavy gradient that was here.
              Stacking several translucent layers over a photograph is what
              makes a background look dirty; the image's own opacity now does
              most of the work, so this only needs to take the edge off. */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,253,249,0.6)_0%,rgba(255,251,244,0.34)_45%,rgba(255,248,238,0.28)_100%)]" />

          {/* A pool of light behind the card, so it reads as floating over
              the landscape rather than taped onto it. */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[780px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.8)_0%,rgba(255,253,248,0.38)_48%,rgba(255,253,248,0)_74%)] blur-2xl" />

          {/* A last warm lift along the bottom edge, tying the panel to the
              showcase beside it. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#fbead2]/55 to-transparent" />

          {/* Corner mandalas, mirrored top-right and bottom-right. The asset
              carries its own lanterns, so it does the framing the reference
              gets from two separate pieces of art. */}
          <img
            src="/assets/festival/festive-corner-mandala.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 w-[230px] select-none opacity-60"
          />
          {/* No mirrored copy along the bottom edge: this asset has hanging
              lanterns built into it, and rotating it stands them upright from
              the floor, which reads as a mistake rather than a frame. The
              top-right corner alone does the framing. */}
          <img
            src="/assets/festival/festive-mandala-full.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 bottom-[18%] w-[220px] select-none opacity-[0.08]"
          />

          {/* Greeting, absolutely positioned so the card stays exactly where
              it is — putting this in the flow would push the form down the
              panel every time. */}
          <div className="pointer-events-none absolute inset-x-0 top-[3vh] flex justify-center">
            <DiwaliWordmark />
          </div>

          {/* Mobile logo — the showcase panel that normally carries it is
              hidden below lg. */}
          <div className="absolute left-6 top-6 lg:hidden">
            <img
              src="/assets/aajneeti-logo-dark.png"
              alt="Aajneeti Connect"
              className="h-9 w-auto object-contain"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative z-10 w-full max-w-[520px]"
          >
            {/* Plain white card. The wrapper remains because the corner
                ribbon is positioned and clipped against it, but it no longer
                paints a rim — zero padding, so the card fills it exactly. */}
            <div className="relative rounded-[28px] shadow-[0_40px_90px_-40px_rgba(120,60,20,0.4)]">
              <div className="relative rounded-[28px] bg-white/65 px-8 py-[clamp(20px,3.6vh,40px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/70 backdrop-blur-xl sm:px-12">
                {/* Faint mandala pressed into the card's own corner. */}
                <img
                  src="/assets/festival/festive-mandala-full.png"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-12 -top-12 w-[180px] select-none opacity-[0.06]"
                />

                <div className="relative">
                  <LoginHeader />

                  <div className="mt-[clamp(14px,2.6vh,26px)]">
                    <LoginForm />
                  </div>

                  <p className="mt-[clamp(14px,2.6vh,26px)] text-center text-[12px] text-slate-400">
                    © {new Date().getFullYear()} Aajneeti Connect Ltd. All
                    rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default LoginPage;
