import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import LoginHeader from "./components/LoginHeader";
import LoginForm from "./components/LoginForm";
import LoginShowcase from "./components/LoginShowcase";
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative min-h-screen lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-[1.18fr_1fr] bg-[#fef8f1]"
      >
        {/* ── LEFT — brand showcase ───────────────────────────── */}
        <LoginShowcase />

        {/* ── RIGHT — sign-in ─────────────────────────────────── */}
        <div className="relative flex items-center justify-center overflow-hidden bg-[#fbf7f2] p-6 sm:p-8 lg:p-6 xl:p-8">
          {/* Festive daylight backdrop — warm ivory washed with saffron */}
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#fffdfa_0%,#fdf6ed_48%,#f9ede0_100%)]" />
          <div className="absolute -top-28 -right-20 h-[420px] w-[420px] rounded-full bg-[#ffd9a8]/40 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[-80px] h-[360px] w-[360px] rounded-full bg-[#f6c6a4]/35 blur-3xl" />

          {/* Mandala watermark anchored to the panel's bottom-right corner */}
          <img
            src="/assets/festival/festive-mandala-full.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-16 w-[300px] select-none opacity-[0.16]"
          />

          {/* Hairline rule separating the two halves on wide screens */}
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 hidden w-px bg-gradient-to-b from-transparent via-[#e7cdb4] to-transparent lg:block"
          />

          {/* Mobile brand mark (left panel is hidden below lg) */}
          <div className="absolute top-6 left-6 lg:hidden">
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
            <div className="relative overflow-hidden rounded-[28px] border border-[#f1dcc6] bg-[#fcfaf7]/95 px-8 py-[clamp(22px,4vh,44px)] shadow-[0_40px_90px_-45px_rgba(120,52,24,0.45)] backdrop-blur-xl sm:px-12">
              {/* Corner mandala, mirroring the one on the showcase side */}
              <img
                src="/assets/festival/festive-corner-mandala.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-12 w-[190px] select-none opacity-70"
              />

              {/* Lanterns sway gently, as if caught by a draught */}
              <motion.img
                src="/assets/festival/festive-lanterns.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute right-6 -top-3 w-[62px] origin-top select-none"
                initial={{ rotate: -2.5 }}
                animate={{ rotate: [-2.5, 2.5, -2.5] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative">
                <LoginHeader />

                <div className="mt-[clamp(16px,3vh,28px)]">
                  <LoginForm />
                </div>

                <p className="mt-[clamp(16px,3vh,28px)] text-center text-[12px] text-[#a1907f]">
                  © {new Date().getFullYear()} Aajneeti Connect Ltd. All rights
                  reserved.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default LoginPage;
