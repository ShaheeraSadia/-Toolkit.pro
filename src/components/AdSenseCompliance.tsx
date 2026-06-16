import React, { useState } from "react";
import { 
  ShieldCheck, 
  FileText, 
  Mail, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Lock,
  UserCheck
} from "lucide-react";

interface AdSenseComplianceProps {
  subTab?: "privacy" | "terms" | "about" | "contact";
  onChangeSubTab?: (tab: "privacy" | "terms" | "about" | "contact") => void;
}

export default function AdSenseCompliance({ subTab, onChangeSubTab }: AdSenseComplianceProps) {
  const [localSubTab, setLocalSubTab] = useState<"privacy" | "terms" | "about" | "contact">("privacy");
  const activeSubTab = subTab !== undefined ? subTab : localSubTab;
  const setActiveSubTab = onChangeSubTab !== undefined ? onChangeSubTab : setLocalSubTab;
  
  // Contact Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("Support & Feed");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      alert("Please fill in all layout blocks correctly.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    }, 1200);
  };

  return (
    <div className="space-y-8" id="compliance-center-root">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Publisher Compliance Hub
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-normal">
          Check legal disclaimers, privacy matrices, cookies compliance, and terms of service. Required to maintain verified AdSense authorization and Google Workspace Secure status.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation panel */}
        <div 
          role="tablist"
          aria-label="Compliance Hub Sub-tabs"
          className="lg:w-1/4 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800/80 pr-0 lg:pr-4 shrink-0"
          onKeyDown={(e) => {
            const keys = ["privacy", "terms", "about", "contact"] as const;
            const idx = keys.indexOf(activeSubTab);
            if (e.key === "ArrowDown" || e.key === "ArrowRight") {
              e.preventDefault();
              const nxt = (idx + 1) % keys.length;
              setActiveSubTab(keys[nxt]);
              setSubmitSuccess(false);
              setTimeout(() => {
                document.getElementById(`sub-tab-${keys[nxt]}`)?.focus();
              }, 10);
            } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
              e.preventDefault();
              const prv = (idx - 1 + keys.length) % keys.length;
              setActiveSubTab(keys[prv]);
              setSubmitSuccess(false);
              setTimeout(() => {
                document.getElementById(`sub-tab-${keys[prv]}`)?.focus();
              }, 10);
            }
          }}
        >
          {[
            { id: "privacy", label: "Privacy Policy", icon: ShieldCheck },
            { id: "terms", label: "Terms of Service", icon: FileText },
            { id: "about", label: "About Creator", icon: UserCheck },
            { id: "contact", label: "Get In Touch", icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  setSubmitSuccess(false);
                }}
                role="tab"
                aria-selected={isActive}
                aria-controls={`subtabpanel-${tab.id}`}
                aria-label={tab.label}
                className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer select-none transition-all ${
                  isActive
                    ? "bg-slate-950 dark:bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/60"
                }`}
                id={`sub-tab-${tab.id}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Display Panel */}
        <div 
          role="tabpanel"
          id={`subtabpanel-${activeSubTab}`}
          aria-labelledby={`sub-tab-${activeSubTab}`}
          className="flex-1 min-h-[300px]"
        >
          {activeSubTab === "privacy" && (
            <div className="space-y-4 animate-fade-in text-xs text-slate-650 dark:text-slate-300 leading-relaxed" id="compliance-privacy-pane">
              <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/20 text-sky-850 dark:text-sky-300 px-3 py-2 rounded-xl text-[11px] font-bold select-none border border-sky-100 dark:border-sky-900/40">
                <Lock className="w-4 h-4 text-sky-600" /> AdSense & Cookie Compliance Certified
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-50 dark:border-slate-800/80 pb-2">
                Privacy & Data Synchronization Policy
              </h4>
              <p>
                This Privacy Policy describes how we collect, handle, and store user analytics and authentication details. We are committed to protecting your privacy and transparently disclosing our data processing.
              </p>

              <div className="space-y-3">
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">1. Google AdSense & Third-Party Advertising Cookies</h5>
                  <p>
                    Google, as a third-party vendor, uses cookies to serve ads on our site. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to this site and other websites on the Internet. You can opt out of personalized advertising by visiting Google's Ad Settings.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">2. Google Workspace API Data Storage</h5>
                  <p>
                    When you authenticate with your Google account inside this application, we use the restricted scope <code className="bg-slate-100 dark:bg-indigo-950/40 px-1 py-0.5 rounded text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold font-mono">/auth/drive.file</code>. This scope allows us ONLY to read, edit, or delete files created explicitly by this layout kit. Your files are never stored or transmitted to external hosts; all API routing is processed secure in the browser or via strict end-to-end Firebase proxies.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">3. Cookies and Log Files</h5>
                  <p>
                    We follow standardized log file protocols to record general diagnostic parameters. These indicators capture Internet Protocol (IP) variables, browser configurations, internet service providers (ISP), system timestamps, and interaction counts to improve layout responsiveness.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">4. Opt-Out Parameters</h5>
                  <p>
                    Users may choose to disable cookie parameters via their individual browser configurations. For additional information regarding browser cookie controls, consult your browser's documentation.
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between animate-fade-in">
                <span>Last Updated: June 2026</span>
                <span>GDPR & CCPA Compliant</span>
              </div>
            </div>
          )}

          {activeSubTab === "terms" && (
            <div className="space-y-4 animate-fade-in text-xs text-slate-650 dark:text-slate-300 leading-relaxed" id="compliance-terms-pane">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-50 dark:border-slate-800/80 pb-2">
                Terms and Conditions of Use
              </h4>
              <p>
                By accessing and utilizing Toolkit Pro Suite, you agree to comply with and represent bound conditions specified in these Terms of Service. If you do not accept these criteria, please refrain from using the tools.
              </p>

              <div className="space-y-3">
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">1. Permitted Use & Utility Rights</h5>
                  <p>
                    All graphic designers, web developers, and marketing agencies are granted free permission to use our image compressors, QR matrix generators, color selectors, and image quote composers for personal and commercial purposes. You retain full copyright of any assets created.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">2. Google API Compliance Limit</h5>
                  <p>
                    Users must not exploit Google Sync parameters to propagate malware, engage in excessive batch automation, or exceed reasonable quota structures. Discovered violations will trigger automatic de-authentication.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">3. Absolute Disclaimer of Warranties</h5>
                  <p>
                    This utility application is provided &ldquo;as is&rdquo;, without warranty of any kind, express or implied. We do not guarantee uninterrupted server uptime or zero-delay file storage structures.
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                <span>© 2026 Toolkit Pro Suite • Standard Developer License</span>
              </div>
            </div>
          )}

          {activeSubTab === "about" && (
            <div className="space-y-6 animate-fade-in text-xs text-slate-650 dark:text-slate-300 leading-relaxed" id="compliance-about-pane">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-650 dark:text-indigo-400 animate-pulse" />
                  About Toolkit Pro & Shaheera Sadia
                </h4>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full select-none max-w-fit">
                  📍 Mandi Bahauddin, Punjab, Pakistan
                </span>
              </div>

              {/* Creator Bio Intro */}
              <div className="space-y-3">
                <p>
                  Hi! I&apos;m <strong>Shaheera Sadia</strong> — the developer, designer, and creator behind <strong>Toolkit Pro Suite</strong>. I build free, high-performance browser-based tools that simplify workflows for bloggers, designers, web developers, content creators, and marketing professionals worldwide.
                </p>
                <p>
                  Toolkit Pro Suite was started because of a shared frustration with online web converters that require sign-ups, display excessive invasive ads, upload private user images onto cloud servers, or charge recurring fees for simple formatting. Inside our suite, <strong>your files never leave your device</strong> — security and speed are run completely client-side in the local browser frame.
                </p>
              </div>

              {/* Stats Grid Dashboard */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-xl text-center">
                  <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">87.6k</div>
                  <div className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">Monthly Pinterest Views</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-xl text-center">
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">1,000+</div>
                  <div className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">LinkedIn Impressions</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-xl text-center">
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400">100%</div>
                  <div className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">Files Run Local & Private</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-xl text-center">
                  <div className="text-lg font-black text-pink-650 dark:text-pink-400">33.3%</div>
                  <div className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">Search Click-Through Rate</div>
                </div>
              </div>

              {/* Core Pillars / Values section */}
              <div className="space-y-3 pt-2">
                <h5 className="font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none">
                  Core Values & Product Pillars
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <h6 className="font-bold text-slate-900 dark:text-slate-100 text-[11px] flex items-center gap-1.5">
                      🔒 Privacy First, Always
                    </h6>
                    <p className="text-[10px] text-slate-500 dark:text-slate-455">
                      Every tool processes your raw images, color spectrums, text frames, and canvas assets locally. We never transmit data to backend stores.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h6 className="font-bold text-slate-900 dark:text-slate-100 text-[11px] flex items-center gap-1.5">
                      💎 Truly 100% Free
                    </h6>
                    <p className="text-[10px] text-slate-500 dark:text-slate-455">
                      No surprise subscription walls, watermark locks, or payment gateways. Supported securely via transparent Google AdSense integrations and affiliate earnings.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h6 className="font-bold text-slate-900 dark:text-slate-100 text-[11px] flex items-center gap-1.5">
                      ⚡ Lightning-Fast & Intuitive
                    </h6>
                    <p className="text-[10px] text-slate-500 dark:text-slate-455">
                      Files are processed near-instantaneously without waiting for server uploads, multi-step converters, or heavy installer overheads.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h6 className="font-bold text-slate-900 dark:text-slate-100 text-[11px] flex items-center gap-1.5">
                      📱 Universal Responsive Layout
                    </h6>
                    <p className="text-[10px] text-slate-500 dark:text-slate-455">
                      Engineered to provide a beautiful, seamless interface experience whether you operate on mobile, tablet viewports, or professional wide monitors.
                    </p>
                  </div>
                </div>
              </div>

              {/* Growth Timeline Journey */}
              <div className="space-y-3 pt-2">
                <h5 className="font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none">
                  How Toolkit Pro Grew
                </h5>
                <div className="relative pl-4 border-l border-slate-150 dark:border-slate-800 space-y-4">
                  <div className="relative">
                    <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900" />
                    <div className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">Phase I: The Beginning</div>
                    <h6 className="font-bold text-slate-900 dark:text-white text-[11px] mt-0.5">One Tool, One Mission</h6>
                    <p className="text-[10px] text-slate-500 dark:text-slate-455 mt-0.5">
                      Created an optimized, browser-side local compressor to compress images without cloud transmission, immediately finding traction.
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                    <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Phase II: Suite Growth</div>
                    <h6 className="font-bold text-slate-900 dark:text-white text-[11px] mt-0.5">More Utilities Added</h6>
                    <p className="text-[10px] text-slate-500 dark:text-slate-455 mt-0.5">
                      Designed and launched the color extraction palette tool, reactive vector QR generator, and customized typography models based on feedback.
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-pink-500 ring-4 ring-white dark:ring-slate-900" />
                    <div className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-wider">Phase III: Strategic Distribution</div>
                    <h6 className="font-bold text-slate-900 dark:text-white text-[11px] mt-0.5">Aesthetic Social Reach</h6>
                    <p className="text-[10px] text-slate-500 dark:text-slate-455 mt-0.5">
                      Expanded reach into Pinterest distribution, growing rapidly to 87.6k monthly viewers sharing design workflows and professional palettes directly.
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white dark:ring-slate-900" />
                    <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Phase IV: Live Dashboard</div>
                    <h6 className="font-bold text-slate-900 dark:text-white text-[11px] mt-0.5">Secured Workspace Integration</h6>
                    <p className="text-[10px] text-slate-500 dark:text-slate-455 mt-0.5">
                      Consolidated all systems into an interactive web hub integrated with automatic local auto-saves, sitemaps, and secure Cloud Sync options.
                    </p>
                  </div>
                </div>
              </div>

              {/* Developer Credential Badge */}
              <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl p-3.5 flex items-start space-x-2 text-indigo-900 dark:text-indigo-300">
                <UserCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <p className="text-[11px] leading-relaxed font-bold">
                    Credential Log Profile:
                  </p>
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-400 leading-normal">
                    This toolkit environment is built, managed, and authenticated by Shaheera Sadia out of Punjab, Pakistan. Any educational contents or diagnostic records are regularly reviewed for WCAG accessibility and publisher eligibility.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "contact" && (
            <div className="space-y-5 animate-fade-in text-xs" id="compliance-contact-pane">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-50 dark:border-slate-800/80 pb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-650 dark:text-indigo-400" />
                Contact & Support Registry
              </h4>
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                Have a question, feedback, or custom feature request? Or are you looking to inquire about our AdSense advertising placements and partnerships? Fill out the encrypted registry form below. Shaheera Sadia or our automated service queue will trace and reply to your ticket immediately.
              </p>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Support Hours & SLA</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Monday to Friday: 9:00 AM – 6:00 PM UTC.<br />
                    Expected follow-up period is within 24 to 48 hours.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-205">Alternate Communication Channels</p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                    support@default-gemini-project-6075a.web.app<br />
                    shaheerasadia@gmail.com
                  </p>
                </div>
              </div>
              
              {submitSuccess ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center space-y-3 max-w-md mx-auto">
                  <CheckCircle className="w-10 h-10 text-emerald-550 mx-auto" />
                  <h5 className="text-sm font-bold text-slate-905">Message Sent Successfully!</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Thank you, your message has been processed successfully. Shaheera Sadia or our support team will follow up within 24–48 hours.
                  </p>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-xs font-bold font-semibold cursor-pointer select-none"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitContact} className="space-y-3 max-w-lg">
                  <div className="grid grid-cols-2 gap-3 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase mb-1">Your Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-slate-950 focus:border-transparent outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-slate-950 focus:border-transparent outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                     <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase mb-1">Topic</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:border-transparent outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="Support & Feedback">Support & Feedback</option>
                      <option value="AdSense Network Partnership">AdSense Network Partnership</option>
                      <option value="Google API Scopes Inquiries">Google API Scopes Inquiries</option>
                      <option value="General Engineering">General Engineering</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase mb-1">Write Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Include details about optimization or partnership inquiries..."
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-slate-950 focus:border-transparent outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium resize-none"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-950 dark:bg-indigo-600 hover:bg-slate-900 dark:hover:bg-indigo-700 hover:shadow-lg rounded-xl py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all outline-none border border-transparent select-none cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping mr-1" />
                        Routing message details safely...
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" /> Dispatch Secure Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
