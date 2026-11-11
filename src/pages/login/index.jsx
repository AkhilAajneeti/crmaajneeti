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
        className="relative min-h-screen lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-[1.18fr_1fr] bg-[#050c26]"
      >
        {/* ── LEFT — brand showcase ───────────────────────────── */}
        <LoginShowcase />

        {/* ── RIGHT — sign-in ─────────────────────────────────── */}
        <div className="relative flex items-center justify-center overflow-hidden bg-[#eef3fb] p-6 sm:p-8 lg:p-6 xl:p-8">
          {/* Airy daylight backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#ffffff_0%,#eaf1fb_45%,#dfe9f8_100%)]" />
          <div className="absolute -top-24 -right-16 h-[380px] w-[380px] rounded-full bg-white/70 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[320px] w-[320px] rounded-full bg-[#c7dbf6]/50 blur-3xl" />

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
            <div className="rounded-[28px] border border-white/70 bg-white/95 px-8 py-[clamp(22px,4vh,44px)] shadow-[0_40px_90px_-40px_rgba(15,42,95,0.45)] backdrop-blur-xl sm:px-12">
              <LoginHeader />

              <div className="mt-[clamp(16px,3vh,28px)]">
                <LoginForm />
              </div>

              <p className="mt-[clamp(16px,3vh,28px)] text-center text-[12px] text-slate-400">
                © {new Date().getFullYear()} Aajneeti Connect Ltd. All rights
                reserved.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default LoginPage;
