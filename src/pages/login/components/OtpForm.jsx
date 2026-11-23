import React, { useEffect, useMemo, useRef, useState } from "react";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds
const OTP_LIFETIME = 15 * 60; // the server expires the code after 15 minutes

const pad = (n) => String(n).padStart(2, "0");

/**
 * Step 2 of login: the 6-digit code.
 *
 * Six separate boxes rather than one text field. A single field makes people
 * count characters; boxes show progress, and a wrong digit is obvious.
 */
const OtpForm = ({
  emailMasked,
  message,
  onVerify,
  onResend,
  onBack,
  isVerifying,
  error,
}) => {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [expiresIn, setExpiresIn] = useState(OTP_LIFETIME);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState("");
  const inputs = useRef([]);

  const code = useMemo(() => digits.join(""), [digits]);
  const complete = code.length === OTP_LENGTH && !digits.includes("");

  // Focus the first box on mount so the code can be typed immediately.
  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  // One interval drives both counters — two would drift apart on a throttled
  // background tab.
  useEffect(() => {
    const id = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
      setExpiresIn((e) => (e > 0 ? e - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const setDigit = (index, value) => {
    setNotice("");
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (index, raw) => {
    const value = raw.replace(/\D/g, "");
    if (!value) {
      setDigit(index, "");
      return;
    }

    // Typing over a filled box, or a phone keyboard delivering several
    // characters at once, should spill forward rather than be truncated.
    const chars = value.split("");
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((char, offset) => {
        if (index + offset < OTP_LENGTH) next[index + offset] = char;
      });
      return next;
    });

    const landed = Math.min(index + chars.length, OTP_LENGTH - 1);
    inputs.current[landed]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        setDigit(index - 1, "");
        inputs.current[index - 1]?.focus();
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1)
      inputs.current[index + 1]?.focus();
  };

  // Pasting the whole code from the email is the common case, so it has to
  // work on any box, not just the first.
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    const chars = pasted.slice(0, OTP_LENGTH).split("");
    setDigits(Array.from({ length: OTP_LENGTH }, (_, i) => chars[i] || ""));
    inputs.current[Math.min(chars.length, OTP_LENGTH - 1)]?.focus();
  };

  const submit = (e) => {
    e.preventDefault();
    if (complete && !isVerifying) onVerify(code);
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setNotice("");
    try {
      const sent = await onResend();
      setDigits(Array(OTP_LENGTH).fill(""));
      setCooldown(RESEND_COOLDOWN);
      setExpiresIn(OTP_LIFETIME);
      setNotice(sent?.message || "A new code is on its way.");
      inputs.current[0]?.focus();
    } finally {
      setResending(false);
    }
  };

  const expired = expiresIn === 0;

  return (
    <form onSubmit={submit} className="space-y-[clamp(12px,2.2vh,22px)]">
      <div className="text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#8c1226]/10 text-[#8c1226]">
          <Icon name="MailCheck" size={22} />
        </span>
        <h3 className="text-[17px] font-semibold text-slate-800">
          Check your email
        </h3>
        <p className="mt-1 text-[13.5px] leading-relaxed text-slate-500">
          {message ||
            "We have sent a 6-digit verification code to your registered email address."}
        </p>
        {emailMasked && (
          <p className="mt-1 text-[13.5px] font-semibold text-slate-700">
            {emailMasked}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {notice && !error && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
          <div className="flex items-center space-x-2">
            <Icon name="CheckCircle2" size={16} className="text-emerald-500" />
            <p className="text-sm text-emerald-700">{notice}</p>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            // `inputMode numeric` brings up the number pad on a phone, and
            // `autoComplete one-time-code` lets iOS and Android offer the
            // code straight from the notification.
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={isVerifying}
            aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            className={`h-[clamp(46px,6.4vh,56px)] w-[clamp(40px,11vw,52px)] rounded-xl border bg-white text-center text-[20px] font-semibold text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all focus:border-[#8c1226] focus:ring-2 focus:ring-[#8c1226]/25 ${
              digit ? "border-[#8c1226]/40" : "border-slate-200"
            } ${error ? "border-red-300" : ""}`}
          />
        ))}
      </div>

      <p className="text-center text-[12.5px] text-slate-500">
        {expired ? (
          <span className="text-red-600">
            This code has expired. Send a new one to continue.
          </span>
        ) : (
          <>
            Code expires in{" "}
            <span className="font-semibold text-slate-700">
              {Math.floor(expiresIn / 60)}:{pad(expiresIn % 60)}
            </span>
          </>
        )}
      </p>

      <Button
        type="submit"
        fullWidth
        loading={isVerifying}
        disabled={!complete || isVerifying || expired}
        className="mt-1 h-[clamp(46px,6.4vh,58px)] rounded-full bg-[linear-gradient(100deg,#8c1226_0%,#a51f2b_55%,#8c1226_100%)] text-[16px] font-semibold text-white shadow-[0_16px_34px_-14px_rgba(140,18,38,0.95)] transition-all hover:brightness-110 disabled:opacity-60 disabled:shadow-none"
      >
        <span className="flex items-center justify-center gap-3">
          Verify &amp; Sign In
        </span>
      </Button>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={isVerifying}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50"
        >
          <Icon name="ArrowLeft" size={14} />
          Back
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending || isVerifying}
          className="text-[13px] font-semibold text-[#8c1226] transition-colors hover:brightness-110 disabled:text-slate-400"
        >
          {resending
            ? "Sending..."
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend code"}
        </button>
      </div>
    </form>
  );
};

export default OtpForm;
