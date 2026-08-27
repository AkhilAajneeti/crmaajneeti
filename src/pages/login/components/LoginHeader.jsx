import React from "react";

const LoginHeader = () => {
  return (
    <div className="text-center">
      {/* Brand mark */}
      <div className="relative mx-auto mb-7 w-fit">
        <img
          src="/assets/aajneeti-logo-dark.png"
          alt="Aajneeti Connect"
          className="relative h-[52px] w-auto object-contain"
        />
      </div>

      {/* Welcome message */}
      <h2 className="text-[26px] font-bold tracking-tight text-[#0f172a]">
        Welcome Back <span className="align-middle">👋</span>
      </h2>
      <p className="mx-auto mt-2 max-w-[21rem] text-[14px] leading-6 text-slate-500">
        Sign in to access your CRM dashboard and manage your leads efficiently.
      </p>
    </div>
  );
};

export default LoginHeader;
