"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function CreateOutboundCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [domains, setDomains] = useState([]);
  const [targetDomain, setTargetDomain] = useState(null);
  
  // Wizard steps: 1, 2, 3
  const [step, setStep] = useState(1);
  const [domainName, setDomainName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [emailsText, setEmailsText] = useState("");
  const [autoFetch, setAutoFetch] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [personas, setPersonas] = useState([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState("");

  useEffect(() => {
    // 1. Fetch domain list
    fetch("/api/domains")
      .then((res) => {
        if (!res.ok) throw new Error("Domains fetch failed");
        return res.json();
      })
      .then((domainsList) => {
        if (Array.isArray(domainsList)) {
          setDomains(domainsList);
          
          const domainUrl = searchParams.get("domain");
          if (domainUrl) {
            const found = domainsList.find((d) => d.name.toLowerCase() === domainUrl.toLowerCase());
            setTargetDomain(found || { name: domainUrl, category: "Tech" });
            setDomainName(domainUrl);
          } else if (domainsList.length > 0) {
            setTargetDomain(domainsList[0]);
            setDomainName(domainsList[0].name);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch domains:", err);
      });

    // 2. Fetch master personas
    fetch("/api/personas")
      .then((res) => {
        if (!res.ok) throw new Error("Personas fetch failed");
        return res.json();
      })
      .then((personasData) => {
        if (Array.isArray(personasData)) {
          setPersonas(personasData);
          if (personasData.length > 0) {
            setSelectedPersonaId(personasData[0].id);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch personas:", err);
      });
  }, [searchParams]);

  const handleDomainChange = (e) => {
    const dName = e.target.value;
    const found = domains.find((d) => d.name === dName);
    setTargetDomain(found || null);
    setDomainName(dName);
  };

  const parseEmailsText = (text) => {
    return text
      .split(/[\n,;]+/)
      .map((email) => email.trim())
      .filter((email) => email.includes("@"))
      .map((email) => {
        const domain = email.split("@")[1] || "company.com";
        return {
          email: email.toLowerCase().trim(),
          ownerName: null,
          businessName: null,
          businessDomain: domain
        };
      });
  };



  const handleNextToStep2 = (e) => {
    e.preventDefault();
    setError("");
    if (!domainName) {
      setError("Please select a target domain.");
      return;
    }
    setStep(2);
  };

  const handleNextToStep3 = (e) => {
    e.preventDefault();
    setError("");
    
    const manualParsed = parseEmailsText(emailsText);
    
    if (!autoFetch && manualParsed.length === 0) {
      setError("Please input at least one valid target email address or enable auto-find.");
      return;
    }

    setContacts(manualParsed);
    setStep(3);
  };

  const handleLaunchCampaign = () => {
    if (personas.length > 0 && !selectedPersonaId) {
      setError("Please select a sender persona for the campaign.");
      return;
    }

    setLoading(true);
    setError("");

    const launchDate = new Date().toISOString().split("T")[0];
    const industry = targetDomain 
      ? targetDomain.category === "AI & Tech"
        ? "Artificial Intelligence startups"
        : `${targetDomain.category} platforms`
      : "tech companies";

    // Retrieve full selected persona details to attach to campaign
    const chosenPersona = personas.find((p) => p.id === selectedPersonaId) || {
      name: "Broker Desk",
      position: "Acquisitions Manager",
      email: "broker@geniusdomainnames.com",
      tone: "Professional"
    };

    const payload = {
      id: "out-" + Date.now(),
      domain: domainName,
      industry: industry,
      template: "Value Pitch",
      date: launchDate,
      status: "Sent",
      defaultSendTime: "09:00",
      selling_price: sellingPrice.trim() || null,
      autoFetch: autoFetch,
      contacts: contacts,
      tasks: [], // Newly created outbounds should not have any tasks.
      persona: {
        name: chosenPersona.name,
        position: chosenPersona.position,
        email: chosenPersona.email,
        tone: chosenPersona.tone,
        imageUrl: chosenPersona.imageUrl || ""
      }
    };

    fetch("/api/outbounds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create campaign");
        return res.json();
      })
      .then(() => {
        alert(`Success! Outbound campaign for ${domainName} has been created successfully.`);
        router.push("/admin/dashboard/outbounds");
      })
      .catch((err) => {
        setError(err.message || "Failed to create campaign in database.");
        setLoading(false);
      });
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/dashboard/portfolio"
          className="text-xs font-semibold text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 flex items-center gap-1 group"
        >
          <span>&larr;</span> Back to Portfolio Manager
        </Link>

        <span className="text-xs font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-955/40 px-3 py-1 rounded-full">
          Step {step} of 3
        </span>
      </div>

      {/* Progress Line UI */}
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden flex">
        <div className={`h-full bg-indigo-600 transition-all duration-300 ${step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full"}`}></div>
      </div>

      {/* Configuration Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-905 dark:text-white">
          {step === 1 ? "Step 1: Campaign Details" : step === 2 ? "Step 2: Prospect Contacts" : "Step 3: Review & Launch"}
        </h1>
        <p className="mt-1.5 text-sm text-zinc-550 dark:text-zinc-405">
          {step === 1 
            ? "Configure the target domain name and asking price." 
            : step === 2 
            ? "Paste email list of target executives, or enable automatic domain lead matching." 
            : "Select sender persona and execute outreach campaign launch."}
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-955/15 border border-rose-100/50 dark:border-rose-900/15 p-4 text-xs font-semibold text-rose-600 dark:text-rose-455">
          {error}
        </div>
      )}

      {/* Step 1: Details Form */}
      {step === 1 && (
        <form onSubmit={handleNextToStep2} className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="domainName" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Target Domain Name *
              </label>
              {domains.length > 0 ? (
                <select
                  id="domainName"
                  value={domainName}
                  onChange={handleDomainChange}
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-505"
                >
                  {domains.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.category})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  id="domainName"
                  required
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  placeholder="e.g. quantumflow.ai"
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-505"
                />
              )}
            </div>

            <div>
              <label htmlFor="sellingPrice" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Asking Price ($)
              </label>
              <input
                type="text"
                id="sellingPrice"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="e.g. 15,000"
                className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-505"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-zinc-100/60 dark:border-zinc-800/30">
            <button
              type="submit"
              className="flex-grow rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white font-semibold text-sm py-3 shadow-md active:scale-98 transition-all cursor-pointer text-center"
            >
              Next: Add Contacts &rarr;
            </button>
            <Link
              href="/admin/dashboard/portfolio"
              className="rounded-xl border border-zinc-200/40 dark:border-zinc-800/25 text-zinc-700 dark:text-zinc-300 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-6 py-3 font-semibold text-sm cursor-pointer text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}

      {/* Step 2: Contacts input Form */}
      {step === 2 && (
        <form onSubmit={handleNextToStep3} className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-4">
            
            {/* Auto Fetch Checkbox */}
            <div className="flex items-center gap-3 p-4 bg-indigo-50/20 dark:bg-indigo-955/10 border border-indigo-100/10 rounded-xl">
              <input
                type="checkbox"
                id="autoFetchCheckbox"
                checked={autoFetch}
                onChange={(e) => {
                  setAutoFetch(e.target.checked);
                  setError("");
                }}
                className="h-4.5 w-4.5 rounded border-zinc-250 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="autoFetchCheckbox" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                Auto-find relevant prospect emails based on domain vertical
              </label>
            </div>

            {/* Email Textarea (Always Enabled) */}
            <div className="space-y-2">
              <label htmlFor="emailsText" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Target Emails List {autoFetch ? "(Optional — AI will also auto-find leads)" : "*"}
              </label>
              <textarea
                id="emailsText"
                rows="7"
                required={!autoFetch}
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                placeholder="e.g.&#10;founder@startups.com&#10;broker@agency.net, investor@fund.co"
                className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-505 font-mono resize-none leading-relaxed"
              ></textarea>
              <p className="text-[10px] text-zinc-450 italic">
                Format: Provide custom target emails per line or separated by commas. {autoFetch && "The AI agent will also scrape additional leads for this domain."}
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-zinc-100/60 dark:border-zinc-800/30">
            <button
              type="submit"
              className="flex-grow rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white font-semibold text-sm py-3 shadow-md active:scale-98 transition-all cursor-pointer text-center"
            >
              Next: Preview Campaign &rarr;
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-zinc-200/40 dark:border-zinc-800/25 text-zinc-700 dark:text-zinc-300 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-6 py-3 font-semibold text-sm cursor-pointer text-center"
            >
              &larr; Back
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Review & Launch Campaign */}
      {step === 3 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="divide-y divide-zinc-100/80 dark:divide-zinc-800/40 text-sm">
            <div className="py-3 flex justify-between gap-4">
              <span className="font-bold text-zinc-500">Target Asset Name</span>
              <span className="font-extrabold text-zinc-905 dark:text-white font-mono">{domainName}</span>
            </div>
            
            <div className="py-3 flex justify-between gap-4">
              <span className="font-bold text-zinc-500">Asking Selling Price</span>
              <span className="font-bold text-zinc-850 dark:text-zinc-200 font-mono">
                {sellingPrice ? `$${sellingPrice}` : "Inquire (No custom price specified)"}
              </span>
            </div>
            
            <div className="py-3 flex justify-between gap-4">
              <span className="font-bold text-zinc-500">Total Valid Prospects</span>
              <span className="font-extrabold text-indigo-650 dark:text-indigo-400 font-mono">{contacts.length} recipients</span>
            </div>
            
            {/* Persona Selector Step */}
            <div className="py-4">
              <label htmlFor="personaSelect" className="block text-xs font-bold text-zinc-700 dark:text-zinc-305 uppercase tracking-wider mb-2">
                Select Outreach Sender Persona *
              </label>
              {personas.length > 0 ? (
                <select
                  id="personaSelect"
                  value={selectedPersonaId}
                  onChange={(e) => setSelectedPersonaId(e.target.value)}
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-505"
                >
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.position} ({p.tone} tone)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-rose-500 font-semibold p-3 bg-rose-50 dark:bg-rose-955/10 rounded-xl border border-rose-100/20">
                  No personas configured. Please create a persona in the{" "}
                  <Link href="/admin/dashboard/personas" className="underline hover:text-rose-600">
                    Persona Manager
                  </Link>{" "}
                  first.
                </div>
              )}
            </div>

            <div className="py-4">
              <span className="font-bold text-zinc-500 block mb-2">Parsed Prospects</span>
              <div className="max-h-[140px] overflow-y-auto bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200/20 dark:border-zinc-800/20 text-xs font-mono space-y-1">
                {contacts.map((c, i) => (
                  <div key={i} className="flex justify-between gap-2 text-zinc-605 dark:text-zinc-400">
                    <span>{c.email}</span>
                    <span className="text-[10px] text-zinc-400">domain: {c.businessDomain}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="py-3 flex items-start gap-3 text-xs text-indigo-600 dark:text-indigo-455 bg-indigo-50/20 dark:bg-indigo-950/10 p-3 rounded-xl mt-2 leading-relaxed">
              <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                Campaign launch will initialize this outbound campaign targeting these contacts with the selected persona. You can schedule sequence tasks and follow-ups on the campaign details page after launch.
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-zinc-100/60 dark:border-zinc-800/30">
            <button
              onClick={handleLaunchCampaign}
              disabled={loading || (personas.length > 0 && !selectedPersonaId)}
              className="flex-grow rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white font-semibold text-sm py-3 shadow-md active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Launching Campaign...
                </>
              ) : (
                "Launch Campaign Sequence"
              )}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setStep(2)}
              className="rounded-xl border border-zinc-200/40 dark:border-zinc-800/25 text-zinc-700 dark:text-zinc-300 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-6 py-3 font-semibold text-sm cursor-pointer text-center"
            >
              &larr; Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateOutboundCampaign() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    }>
      <CreateOutboundCampaignContent />
    </Suspense>
  );
}
