import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";
import Icon from "../../../components/AppIcon";
import { applyTheme } from "utils/theme";
import OtpForm from "./OtpForm";
import {
  fetchSessionUser,
  initiateLogin,
  resendOtp,
  verifyOtp,
} from "services/auth.service";

const LoginForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Login is two screens now. `challenge` holds what step 1 handed back; it
  // is deliberately NOT persisted — a challenge token is single-use and short
  // lived, so a reload should start the login over rather than resume a
  // half-finished one.
  const [step, setStep] = useState("credentials");
  const [challenge, setChallenge] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---- Step 1: credentials -> OTP email ----------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const sent = await initiateLogin(formData.username, formData.password);
      setChallenge(sent);
      setOtpError("");
      setStep("otp");
    } catch (err) {
      console.error("Login error:", err);
      setErrors({ general: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Step 2: OTP -> session, then load the profile ---------------------
  const handleVerify = async (code) => {
    setIsVerifying(true);
    setOtpError("");

    try {
      const token = await verifyOtp(code, challenge.challengeToken);

      // Stored under the key every service already reads, so nothing else in
      // the app needs to know the token is now a 2FA session token.
      localStorage.setItem("auth_token", token);

      // The verify response carries only the token. Everything the app needs
      // about WHO signed in — permissions, teams, theme, the sidebar — comes
      // from here.
      const { user, acl } = await fetchSessionUser(token);

      const loginObj = {
        id: user.id,
        username: user.userName,
        token,
        type: user.type,
        roles: Object.values(user.rolesNames || {}),
        // Needed by the ACL helpers: a "team" grant is resolved by
        // intersecting these with the record's teamsIds. Without them every
        // "team" permission silently degrades to "own".
        teamsIds: user.teamsIds || [],
        defaultTeamId: user.defaultTeamId || null,
        acl: acl || null,
      };

      localStorage.setItem("login_object", JSON.stringify(loginObj));
      if (acl) localStorage.setItem("acl", JSON.stringify(acl));
      localStorage.setItem("isAuthenticated", "true");

      // Repaint for this user before the dashboard mounts.
      applyTheme(loginObj);

      navigate("/dashboard");
    } catch (err) {
      console.error("OTP verification error:", err);
      // A failed verify must not leave a half-written session behind.
      localStorage.removeItem("auth_token");
      localStorage.removeItem("isAuthenticated");
      setOtpError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      const sent = await resendOtp(challenge.challengeToken);
      // The old challenge token stops working the moment a new code is sent,
      // so this replacement is not optional.
      setChallenge(sent);
      setOtpError("");
      return sent;
    } catch (err) {
      setOtpError(err.message);
      return null;
    }
  };

  const handleBackToCredentials = () => {
    setStep("credentials");
    setChallenge(null);
    setOtpError("");
    setFormData((prev) => ({ ...prev, password: "" }));
  };

  const fieldClasses =
    "h-[clamp(42px,5.6vh,52px)] rounded-xl border-slate-200 bg-white pl-11 text-[14px] text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#2563eb]/30 focus-visible:ring-offset-0 focus-visible:border-[#2563eb]";

  // The OTP screen replaces the credentials form rather than stacking under
  // it: leaving the password field mounted invites a second submit against a
  // challenge that is already in flight.
  if (step === "otp") {
    return (
      <OtpForm
        emailMasked={challenge?.emailMasked}
        onVerify={handleVerify}
        onResend={handleResend}
        onBack={handleBackToCredentials}
        isVerifying={isVerifying}
        error={otpError}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-[clamp(12px,2.2vh,22px)]">
      {errors.general && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-red-500" />
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        </div>
      )}

      {/* Username */}
      <div className="space-y-2">
        <label
          htmlFor="login-username"
          className="block text-[14px] font-semibold text-slate-700"
        >
          Username <span className="text-red-500">*</span>
        </label>
        <Input
          id="login-username"
          icon="User"
          placeholder="Enter your username"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          error={errors.username}
          disabled={isLoading}
          className={fieldClasses}
          required
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label
          htmlFor="login-password"
          className="block text-[14px] font-semibold text-slate-700"
        >
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Input
            id="login-password"
            icon="Lock"
            placeholder="Enter your password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            disabled={isLoading}
            className={`${fieldClasses} pr-11`}
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-[calc(clamp(42px,5.6vh,52px)/2)] -translate-y-1/2 text-slate-400 transition-colors hover:text-[#8c1226]"
          >
            <Icon name={showPassword ? "EyeOff" : "Eye"} size={18} />
          </button>
        </div>
      </div>

      {/* Remember me */}
      <div className="flex items-center">
        <Checkbox
          label="Keep me signed in"
          name="rememberMe"
          checked={formData.rememberMe}
          onChange={handleInputChange}
          disabled={isLoading}
          className={`items-center [&_.peer]:h-[18px] [&_.peer]:w-[18px] [&_.peer]:rounded-[5px] [&_.peer]:border-[#2563eb] [&_label]:text-[13.5px] [&_label]:text-slate-600 ${
            formData.rememberMe
              ? "[&_.peer]:bg-[#2563eb] [&_.peer]:text-white"
              : ""
          }`}
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
        className="mt-1 h-[clamp(46px,6.4vh,58px)] rounded-full bg-[linear-gradient(100deg,#8c1226_0%,#a51f2b_55%,#8c1226_100%)] text-[16px] font-semibold text-white shadow-[0_16px_34px_-14px_rgba(140,18,38,0.95)] transition-all hover:brightness-110 hover:shadow-[0_20px_40px_-14px_rgba(140,18,38,1)]"
      >
        <span className="flex items-center justify-center gap-3">
          {!isLoading && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Icon name="ArrowRight" size={17} />
            </span>
          )}
          {isLoading ? "Sending code..." : "Sign In"}
        </span>
      </Button>

      {/* Secure footer */}
      <div className="flex items-center gap-3 pt-1">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="flex items-center gap-1.5 whitespace-nowrap text-[12.5px] text-slate-500">
          <Icon name="ShieldCheck" size={14} className="text-[#2563eb]" />
          Secure CRM Access
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </form>
  );
};

export default LoginForm;
