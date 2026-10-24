import React from "react";

const LoginHeader = () => {
  return (
    <div className="text-center">
      {/* Brand mark */}
      <div className="relative mx-auto mb-[clamp(12px,2.2vh,24px)] w-fit">
        <img
          src="/assets/aajneeti-logo-dark.png"
          alt="Aajneeti Connect"
          className="relative h-[clamp(38px,5vh,52px)] w-auto object-contain"
        />
      </div>

      {/* Welcome message */}
      <h2 className="text-[24px] font-bold tracking-tight 2xl:text-[26px] text-[#0f172a]">
        Welcome Back <span className="align-middle">👋</span>
      </h2>
      <p className="mx-auto mt-2 max-w-[21rem] text-[13.5px] leading-5 text-slate-500">
        Sign in to access your CRM dashboard and manage your leads efficiently.
      </p>
    </div>
  );
};

export default LoginHeader;
