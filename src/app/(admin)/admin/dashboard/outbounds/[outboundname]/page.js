"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Persistent templates loaded dynamically from Neon database

export default function OutboundCampaignDetails({ params }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const outboundname = decodeURIComponent(unwrappedParams.outboundname);

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [defaultSendTime, setDefaultSendTime] = useState("09:00");

  // Contacts Modal States
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [showAddContactForm, setShowAddContactForm] = useState(false);

  // Add Task Modal States
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [dbTemplates, setDbTemplates] = useState([]);
  const [newPriceValue, setNewPriceValue] = useState("");
  const [activeTemplateSubject, setActiveTemplateSubject] = useState("");
  const [activeTemplateBody, setActiveTemplateBody] = useState("");
  const [addTaskForm, setAddTaskForm] = useState({
    type: "follow up",
    status: "draft",
    date: "",
    subject: "",
    message: ""
  });
  // Geo Domain fields (visible only for Geo Domain campaigns)
  const [geoLocation, setGeoLocation] = useState("");
  const [geoService, setGeoService] = useState("");

  const [newContact, setNewContact] = useState({
    email: "",
    businessDomain: "",
    status: "Sent"
  });

  const [scraping, setScraping] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState("sequence");
  const [personaSaving, setPersonaSaving] = useState(false);
  const [personaSuccess, setPersonaSuccess] = useState(false);
  const [personaForm, setPersonaForm] = useState({
    name: "",
    position: "",
    email: "",
    reply_to_email: "",
    tone: "Professional"
  });

  // Batch task dispatch state
  const [sendingTaskId, setSendingTaskId] = useState(null);
  const [sendTaskResult, setSendTaskResult] = useState(null);

  // Email verification state & segmentation filters
  const [verificationFilter, setVerificationFilter] = useState("all"); // "all" | "valid" | "risky" | "invalid"
  const [verifyingContacts, setVerifyingContacts] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Trigger contact verification orchestrator
  const handleVerifyCampaignContacts = async () => {
    if (!campaign) return;
    setVerifyingContacts(true);
    setVerifyResult(null);

    try {
      const res = await fetch("/api/outbounds/verify-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: campaign.domain,
          contacts: campaign.contacts || []
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setVerifyResult(`Verification failed: ${data.error || "Unknown error"}`);
      } else {
        setVerifyResult(`Verified ${data.total} email(s): ${data.valid?.length || 0} Valid, ${data.risky?.length || 0} Risky, ${data.invalid?.length || 0} Invalid.`);
        fetchCampaign();
      }
    } catch (err) {
      setVerifyResult(`Verification error: ${err.message}`);
    } finally {
      setVerifyingContacts(false);
    }
  };

  const fetchCampaign = () => {
    fetch(`/api/outbounds/${encodeURIComponent(outboundname)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Campaign fetch failed");
        return res.json();
      })
      .then((data) => {
        setCampaign(data);
        setDefaultSendTime(data.defaultSendTime || "09:00");

        // Initialize persona settings state
        const p = data.persona || {};
        setPersonaForm({
          name: p.name || "",
          position: p.position || "",
          email: p.email || "",
          reply_to_email: p.reply_to_email || p.replyToEmail || p.email || "",
          tone: p.tone || "Professional"
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load campaign:", err);
        setCampaign(null);
        setLoading(false);
      });
  };

  // Dispatch single sequence task message to all eligible contacts
  const handleSendTaskToAllContacts = async (task) => {
    if (!campaign) return;
    setSendingTaskId(task.task_id);
    setSendTaskResult(null);

    try {
      const res = await fetch("/api/outbounds/send-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: campaign.domain,
          taskId: task.task_id,
          taskSubject: task.task_subject,
          taskMessage: task.task_message,
          persona: personaForm
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setSendTaskResult({ success: false, message: data.error || "Failed to dispatch task email" });
      } else {
        setSendTaskResult({
          success: true,
          message: data.message || `Dispatched to ${data.sentCount} contact(s). Replies will route to ${data.replyTo}.`,
          sentCount: data.sentCount,
          replyTo: data.replyTo
        });
        fetchCampaign();
      }
    } catch (err) {
      setSendTaskResult({ success: false, message: err.message });
    } finally {
      setSendingTaskId(null);
    }
  };

  useEffect(() => {
    fetchCampaign();

    // Fetch templates from database
    fetch("/api/templates")
      .then((res) => {
        if (!res.ok) throw new Error("Templates fetch failed");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setDbTemplates(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load templates:", err);
      });
  }, [outboundname]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Campaign Not Found</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          Could not locate outbound metrics logs for <strong>&quot;{outboundname}&quot;</strong>.
        </p>
        <Link
          href="/admin/dashboard/outbounds"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3 shadow-md"
        >
          Back to Outbounds List
        </Link>
      </div>
    );
  }

  // Date Calculator Helper
  const calculateTaskDate = (launchDateStr, daysToAdd) => {
    try {
      const date = new Date(launchDateStr);
      date.setDate(date.getDate() + daysToAdd);
      return date.toISOString().split("T")[0];
    } catch (err) {
      return launchDateStr;
    }
  };

  // Helper to persist campaign updates to Neon database
  const saveCampaign = (updatedCampaign) => {
    fetch(`/api/outbounds/${encodeURIComponent(outboundname)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedCampaign)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save campaign changes");
        return res.json();
      })
      .then(() => {
        setCampaign(updatedCampaign);
      })
      .catch((err) => {
        console.error("Error saving campaign:", err);
        alert("Failed to save changes to the database.");
      });
  };

  // Handle email changes to automatically extract and populate businessDomain
  const handleEmailChange = (e) => {
    const emailVal = e.target.value;
    let domainVal = newContact.businessDomain;
    if (emailVal.includes("@")) {
      const parts = emailVal.split("@");
      if (parts[1]) {
        domainVal = parts[1];
      }
    }
    setNewContact((prev) => ({ ...prev, email: emailVal, businessDomain: domainVal }));
  };

  // Add Contact Submit
  const handleAddContactSubmit = (e) => {
    e.preventDefault();
    if (!newContact.email || !newContact.businessDomain) return;

    const newContactObj = {
      email: newContact.email.trim(),
      businessDomain: newContact.businessDomain.trim(),
      deliveryStatus: newContact.status
    };

    const updatedContacts = [...(campaign.contacts || []), newContactObj];

    // Determine overall campaign status dynamically
    let newStatus = campaign.status;
    if (newContact.status === "Replied") {
      newStatus = "Replied";
    } else if (newContact.status === "Bounced" && campaign.status === "Sent") {
      newStatus = "Bounced";
    } else if (newContact.status === "Opened" && campaign.status === "Sent") {
      newStatus = "Opened";
    }

    const updatedCampaign = { ...campaign, contacts: updatedContacts, status: newStatus };
    saveCampaign(updatedCampaign);

    // Reset Form
    setNewContact({ email: "", businessDomain: "", status: "Sent" });
    setShowAddContactForm(false);
  };

  // Remove Contact
  const handleRemoveContact = (email) => {
    if (window.confirm(`Are you sure you want to remove the contact "${email}"?`)) {
      const updatedContacts = (campaign.contacts || []).filter((c) => c.email !== email);
      const updatedCampaign = { ...campaign, contacts: updatedContacts };
      saveCampaign(updatedCampaign);
    }
  };

  // Handle send time change
  const handleSendTimeChange = (e) => {
    const newTime = e.target.value;
    setDefaultSendTime(newTime);

    if (campaign) {
      const updatedCampaign = { ...campaign, defaultSendTime: newTime };
      saveCampaign(updatedCampaign);
    }
  };

  const handleTriggerScraper = () => {
    setScraping(true);
    fetch("/api/trigger-scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        location: "Milwaukee",
        niche: "dental clinics"
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to trigger scraper task");
        return res.json();
      })
      .then((data) => {
        if (data.results && Array.isArray(data.results.data)) {
          const names = data.results.data.map(b => `- ${b.name} (${b.website_url || "No website"})`).join("\n");
          alert(`${data.message}\n\nScraped ${data.results.resultsCount} clinics:\n${names}`);
        } else {
          alert(`${data.message}\n\nRun ID: ${data.runId}\nTarget: ${data.niche} in ${data.location}`);
        }
      })
      .catch((err) => {
        alert(err.message || "An error occurred while launching scraper.");
      })
      .finally(() => {
        setScraping(false);
      });
  };

  const handleSavePersona = (e) => {
    e.preventDefault();
    setPersonaSaving(true);
    setPersonaSuccess(false);

    const updatedCampaign = {
      ...campaign,
      persona: {
        name: personaForm.name.trim(),
        position: personaForm.position.trim(),
        email: personaForm.email.trim(),
        tone: personaForm.tone
      }
    };

    fetch(`/api/outbounds/${encodeURIComponent(outboundname)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedCampaign)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save persona changes");
        return res.json();
      })
      .then(() => {
        setCampaign(updatedCampaign);
        setPersonaSuccess(true);
        setTimeout(() => setPersonaSuccess(false), 3000);
      })
      .catch((err) => {
        console.error("Error saving persona:", err);
        alert("Failed to save persona settings.");
      })
      .finally(() => {
        setPersonaSaving(false);
      });
  };

  const handleResetPersona = () => {
    if (window.confirm("Are you sure you want to reset sender persona configuration?")) {
      setPersonaForm({
        name: "",
        position: "",
        email: "",
        tone: "Professional"
      });
    }
  };

  const compileTemplateText = (text, priceValue, isBody = false) => {
    if (!text) return "";
    const personaName = campaign?.persona?.name || "Portfolio Manager";
    const domain = campaign?.domain || "";
    const city  = campaign?.city  || "";
    const niche = campaign?.niche || "";
    // Use the geo modal fields when open (initialized from campaign.city/niche;
    // user can override them). Fall back to campaign values for non-modal calls.
    const location = geoLocation || city;
    const service  = geoService  || niche;

    let processed = text
      .replaceAll("[domain]",      domain)
      .replaceAll("[personaName]", personaName)
      .replaceAll("[price]",       priceValue ? `$${priceValue}` : "[price]")
      .replaceAll("[City]",        city)
      .replaceAll("[city]",        city.toLowerCase())
      .replaceAll("[niche]",       niche.toLowerCase())
      .replaceAll("[Niche]",       niche ? (niche.charAt(0).toUpperCase() + niche.slice(1)) : "")
      .replaceAll("[location]",    location)
      .replaceAll("[service]",     service)
      .replaceAll("\\n", "\n");

    if (isBody && processed.toLowerCase().startsWith("subject:")) {
      const doubleNewlineIdx = processed.indexOf("\n\n");
      if (doubleNewlineIdx !== -1) {
        processed = processed.substring(doubleNewlineIdx + 2);
      }
    }
    return processed;
  };

  // ── Sequence defaults keyed by domain type & stage index ────────────────
  // stage = campaign.tasks.length (0 = first email, 1 = follow-up 1, …)
  const getSequenceDefaults = (stage) => {
    const d    = campaign.domain;
    const loc  = campaign.city  || "[location]";
    const svc  = campaign.niche || "[service]";
    const name = campaign.persona?.name || "Portfolio Manager";
    const type = campaign.domainType || "Brandable Domain";

    const isGeo = type === "Geo Domain";
    const isEMD = type === "ExactMatch Domain (EMD)";

    if (isGeo) {
      // ── Geo Domain sequence (geo-domain-cold-outbound-campaign.md) ────────
      const stages = [
        // Stage 1 — Day 0
        {
          subject: `Domain for ${loc} ${svc} businesses`,
          message: `Hi,\n\nI own ${d} and thought it could be a strong fit for a ${loc}-based ${svc} business like yours — exact-match local domains like this tend to help with both direct-navigation online traffic and local search relevance.\n\nWanted to check if it's something you'd have interest in before offering it elsewhere.\n\nWorth a quick reply?\n\n${name}`
        },
        // Stage 2 — Day 4
        {
          subject: `Re: Domain for ${loc} ${svc} businesses`,
          message: `Hi,\n\nFollowing up briefly. A few reasons a domain like this tends to help local businesses specifically:\n\n- Exact-match location + service names still carry meaningful local SEO weight\n- Easy for customers to remember and type directly (reduces reliance on ads)\n- Can be pointed to a dedicated landing page to capture ${loc}-specific leads separately from your main site\n\nHappy to share what similar location-service domains have gone for if that's useful context.\n\n${name}`
        },
        // Stage 3 — Day 9
        {
          subject: `What domains like this typically go for`,
          message: `Hi,\n\nFor context — geo-match domains in mid-size markets for ${svc} have generally sold in the [$X–$Y] range, with larger metro areas trending higher. Not pushing a number on you, just want you to have a realistic sense before deciding.\n\nIf it's not the right time, understood — I'll likely list it more broadly after this week, which usually opens it up to competitors in the space too.\n\n${name}`
        },
        // Stage 4 — Day 14
        {
          subject: `Closing this out — ${d}`,
          message: `Hi,\n\nWanted to close the loop on this — I'll be moving ${d} to a broader listing this week unless there's interest on your end.\n\nIf timing's just off, no worries — happy to reconnect down the line if things change.\n\nAll the best,\n${name}`
        },
        // Stage 5 — Day 30+
        {
          subject: `Still available if useful later`,
          message: `Hi,\n\nNo response needed — just flagging ${d} is still available if plans change. This'll be my last note on it.\n\n${name}`
        },
      ];
      return stages[Math.min(stage, stages.length - 1)];
    }

    if (isEMD) {
      // ── EMD sequence (Cold_Outbound_Campaign_EMDs.md) ─────────────────────
      const industry = svc || "[industry]";
      const stages = [
        // Stage 1 — Day 0
        {
          subject: `Question about ${d}`,
          message: `Hi,\n\nI own ${d} and thought it could be a strong fit given what you're building in ${industry} — exact-match domains like this tend to carry meaningful direct-navigation traffic (people just typing it in) and instant category recognition.\n\nWanted to check if it's something you'd have interest in before offering it elsewhere.\n\nWorth a quick reply?\n\n${name}`
        },
        // Stage 2 — Day 4
        {
          subject: `Re: ${d}`,
          message: `Hi,\n\nFollowing up briefly. A few reasons domains like this tend to matter more as a company scales:\n\n- Exact-match category domains still carry real type-in and referral traffic, independent of any ad spend\n- Instantly communicates what you do — no explaining the brand name\n- Becomes a durable asset that compounds in value as the category grows, unlike a domain tied to a sub-brand or campaign name\n\nHappy to share what comparable category-defining domains have sold for if useful.\n\n${name}`
        },
        // Stage 3 — Day 9
        {
          subject: `What domains like this typically go for`,
          message: `Hi,\n\nFor context — exact-match category domains in ${industry} have generally traded in the [$X–$Y] range, with premium categories (finance, insurance, legal, high-CPC verticals) trending well above that. Not pushing a number on you, just want you to have a realistic sense before deciding.\n\nIf it's not the right time, understood — I'll likely list it more broadly after this week, which usually brings in interest from direct competitors too.\n\n${name}`
        },
        // Stage 4 — Day 14
        {
          subject: `Closing this out — ${d}`,
          message: `Hi,\n\nWanted to close the loop on this — I'll be moving ${d} to a broader listing this week unless there's interest on your end.\n\nIf timing's just off, no worries — happy to reconnect down the line if things change.\n\nAll the best,\n${name}`
        },
        // Stage 5 — Day 30+
        {
          subject: `Still available if useful later`,
          message: `Hi,\n\nNo response needed — just flagging ${d} is still available if plans change. This'll be my last note on it.\n\n${name}`
        },
      ];
      return stages[Math.min(stage, stages.length - 1)];
    }

    // ── Brandable Domain sequence (domain-sales-cold-outbound-campaign.md) ──
    const industry = svc || "[industry]";
    const stages = [
      // Stage 1 — Day 0
      {
        subject: `Quick question about ${d}`,
        message: `Hi,\n\nI own ${d} and it seemed like a strong match for your brand. Before doing anything else with it, I wanted to check whether it's of interest to your team.\n\nNo pressure either way — just didn't want to offer it elsewhere without asking first.\n\nWorth a quick reply?\n\n${name}`
      },
      // Stage 2 — Day 4
      {
        subject: `Re: Quick question about ${d}`,
        message: `Hi,\n\nFollowing up briefly. A few reasons this could be worth a look:\n\n- Exact match to your brand name — helps with direct-navigation traffic and brand trust\n- Cleaner/shorter than a longer or hyphenated alternative\n- Keeps competitors or unrelated buyers from acquiring it later\n\nHappy to share what similar domains have sold for recently if useful context.\n\n${name}`
      },
      // Stage 3 — Day 9
      {
        subject: `How other brands have priced domains like this`,
        message: `Hi,\n\nJust to give you a sense of scale — exact-match domains in ${industry} have sold in the [$X–$Y] range depending on brand fit and length of use. Not trying to push a number on you, just want you to have real context.\n\nIf it's not a fit right now, understood — I'll likely move it to public listing after this week.\n\n${name}`
      },
      // Stage 4 — Day 14
      {
        subject: `Closing this out — ${d}`,
        message: `Hi,\n\nWanted to close the loop — I'll be moving ${d} to active public listing this week unless there's interest from your side.\n\nIf timing's just off, no worries — feel free to reach out down the line if things change.\n\nAll the best,\n${name}`
      },
      // Stage 5 — Day 30+
      {
        subject: `Still available if it's useful later`,
        message: `Hi,\n\nNo response needed — just flagging that ${d} is still available if plans change on your end. This'll be my last note on it.\n\n${name}`
      },
    ];
    return stages[Math.min(stage, stages.length - 1)];
  };

  // Live-update subject + message when geo location/service fields change
  const handleGeoFieldChange = (field, value) => {
    const loc = field === "location" ? value : geoLocation;
    const svc = field === "service"  ? value : geoService;
    if (field === "location") setGeoLocation(value);
    if (field === "service")  setGeoService(value);

    // Determine current stage index the same way openAddTaskModal does
    const stageIndex = editingTaskId
      ? campaign.tasks.findIndex((t) => t.task_id === editingTaskId)
      : campaign.tasks.length;

    const d    = campaign.domain;
    const name = campaign.persona?.name || "Portfolio Manager";
    const stageTemplates = [
      {
        subject: `Domain for ${loc} ${svc} businesses`,
        message: `Hi,\n\nI own ${d} and thought it could be a strong fit for a ${loc}-based ${svc} business like yours — exact-match local domains like this tend to help with both direct-navigation online traffic and local search relevance.\n\nWanted to check if it's something you'd have interest in before offering it elsewhere.\n\nWorth a quick reply?\n\n${name}`
      },
      {
        subject: `Re: Domain for ${loc} ${svc} businesses`,
        message: `Hi,\n\nFollowing up briefly. A few reasons a domain like this tends to help local businesses specifically:\n\n- Exact-match location + service names still carry meaningful local SEO weight\n- Easy for customers to remember and type directly (reduces reliance on ads)\n- Can be pointed to a dedicated landing page to capture ${loc}-specific leads separately from your main site\n\nHappy to share what similar location-service domains have gone for if that's useful context.\n\n${name}`
      },
      {
        subject: `What domains like this typically go for`,
        message: `Hi,\n\nFor context — geo-match domains in mid-size markets for ${svc} have generally sold in the [$X–$Y] range, with larger metro areas trending higher. Not pushing a number on you, just want you to have a realistic sense before deciding.\n\nIf it's not the right time, understood — I'll likely list it more broadly after this week, which usually opens it up to competitors in the space too.\n\n${name}`
      },
      {
        subject: `Closing this out — ${d}`,
        message: `Hi,\n\nWanted to close the loop on this — I'll be moving ${d} to a broader listing this week unless there's interest on your end.\n\nIf timing's just off, no worries — happy to reconnect down the line if things change.\n\nAll the best,\n${name}`
      },
      {
        subject: `Still available if useful later`,
        message: `Hi,\n\nNo response needed — just flagging ${d} is still available if plans change. This'll be my last note on it.\n\n${name}`
      },
    ];
    const tpl = stageTemplates[Math.min(stageIndex, stageTemplates.length - 1)];
    setAddTaskForm((prev) => ({
      ...prev,
      subject: tpl.subject,
      message: tpl.message
    }));
  };

  // Open Add Task Modal & populate form parameters
  const openAddTaskModal = () => {
    if (!campaign) return;

    const lastTask = campaign.tasks[campaign.tasks.length - 1];
    const defaultDate = lastTask ? calculateTaskDate(lastTask.schedule_date, 3) : todayStr;
    const resolvedDate = defaultDate < todayStr ? todayStr : defaultDate;

    const isFirst = campaign.tasks.length === 0;
    setNewPriceValue("");
    setActiveTemplateSubject("");
    setActiveTemplateBody("");
    setEditingTaskId(null);

    // Seed geo fields from campaign data
    setGeoLocation(campaign.city || "");
    setGeoService(campaign.niche || "");

    if (isFirst) {
      const domainType = campaign.domainType || "Brandable Domain";
      const isGeoOrEMD = domainType === "Geo Domain" || domainType === "ExactMatch Domain (EMD)";

      // Geo and EMD domains always use their own type-specific script.
      // Only Brandable Domains fall back to the generic DB FirstOutbound template.
      if (!isGeoOrEMD) {
        const firstOutboundTemplates = dbTemplates.filter((t) => t.category === "FirstOutbound");
        const defaultTpl = firstOutboundTemplates[0];

        if (defaultTpl) {
          setSelectedTemplateId(defaultTpl.id);
          setActiveTemplateSubject(defaultTpl.subject);
          setActiveTemplateBody(defaultTpl.message);
          setAddTaskForm({
            type: "FirstOutbound",
            status: "draft",
            date: resolvedDate,
            subject: compileTemplateText(defaultTpl.subject, ""),
            message: compileTemplateText(defaultTpl.message, "", true)
          });
        } else {
          const defaults = getSequenceDefaults(0);
          setSelectedTemplateId("");
          setAddTaskForm({
            type: "FirstOutbound",
            status: "draft",
            date: resolvedDate,
            subject: defaults.subject,
            message: defaults.message
          });
        }
      } else {
        // Geo / EMD — always use the campaign-type-specific Stage 1 script
        const defaults = getSequenceDefaults(0);
        setSelectedTemplateId("");
        setAddTaskForm({
          type: "FirstOutbound",
          status: "draft",
          date: resolvedDate,
          subject: defaults.subject,
          message: defaults.message
        });
      }
    } else {
      // Follow-up: pick the right stage script based on how many tasks already exist
      const stageIndex = campaign.tasks.length; // 0-based; 1 task done → stage 2
      const defaults = getSequenceDefaults(stageIndex);
      setSelectedTemplateId("");
      setAddTaskForm({
        type: "follow up",
        status: "draft",
        date: resolvedDate,
        subject: defaults.subject,
        message: defaults.message
      });
    }
    setShowAddTaskModal(true);
  };

  // Open Edit Task Modal
  const openEditTaskModal = (task) => {
    setSelectedTemplateId("");
    setNewPriceValue("");
    setActiveTemplateSubject("");
    setActiveTemplateBody("");
    setAddTaskForm({
      type: task.task_type,
      status: task.task_status,
      date: task.schedule_date,
      subject: task.task_subject,
      message: task.task_message
    });
    setEditingTaskId(task.task_id);
    setShowAddTaskModal(true);
  };

  // Handle Template selection change
  const handleTemplateChange = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setActiveTemplateSubject("");
      setActiveTemplateBody("");
      return;
    }

    const template = dbTemplates.find((t) => t.id === templateId);
    if (template && campaign) {
      setActiveTemplateSubject(template.subject);
      setActiveTemplateBody(template.message);

      setAddTaskForm((prev) => ({
        ...prev,
        subject: compileTemplateText(template.subject, newPriceValue),
        message: compileTemplateText(template.message, newPriceValue, true)
      }));
    }
  };

  // Handle price changes reactively compiling variables
  const handlePriceChange = (val) => {
    setNewPriceValue(val);
    if (activeTemplateBody || activeTemplateSubject) {
      setAddTaskForm((prev) => ({
        ...prev,
        subject: compileTemplateText(activeTemplateSubject, val),
        message: compileTemplateText(activeTemplateBody, val, true)
      }));
    }
  };

  // Handle Add Task Form state modification
  const handleAddTaskFormChange = (field, value) => {
    setAddTaskForm((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "type") {
        if (value === "new offer") {
          updated.subject = "NEW OFFER";
        } else if (value === "follow up" && campaign) {
          const currentIdx = campaign.tasks.findIndex(t => t.task_id === editingTaskId);
          const prevTask = currentIdx > 0 ? campaign.tasks[currentIdx - 1] : campaign.tasks[campaign.tasks.length - 1];
          updated.subject = prevTask ? (prevTask.task_subject.startsWith("Re: ") ? prevTask.task_subject : `Re: ${prevTask.task_subject}`) : "";
        }
      }
      return updated;
    });
  };

  // Save Task from modal form to Sequence array
  const handleSaveNewTask = (e) => {
    e.preventDefault();
    if (!campaign) return;

    if (addTaskForm.date < campaign.date) {
      alert("Task scheduled date cannot be set before the campaign launch date!");
      return;
    }

    let finalStatus = addTaskForm.status;
    if (addTaskForm.date > todayStr && (finalStatus === "draft" || finalStatus === "scheduled")) {
      finalStatus = "scheduled";
    }

    let finalTasks = [];

    if (editingTaskId) {
      // Edit Mode
      const updatedTasks = campaign.tasks.map((t) => {
        if (t.task_id === editingTaskId) {
          return {
            ...t,
            task_type: addTaskForm.type,
            task_subject: addTaskForm.subject.trim() || (addTaskForm.type === "new offer" ? "NEW OFFER" : "Follow-up"),
            task_message: addTaskForm.message.trim(),
            schedule_date: addTaskForm.date,
            task_status: finalStatus
          };
        }
        return t;
      });

      // Cascade subject updates for all downstream follow ups
      finalTasks = updatedTasks.map((task, index) => {
        if (index > 0 && task.task_type === "follow up") {
          const prev = updatedTasks[index - 1];
          const targetSubject = prev ? (prev.task_subject.startsWith("Re: ") ? prev.task_subject : `Re: ${prev.task_subject}`) : "";
          return { ...task, task_subject: targetSubject };
        }
        return task;
      });
    } else {
      // Create Mode
      const newTask = {
        task_id: "task-" + Date.now(),
        task_type: addTaskForm.type,
        task_status: finalStatus,
        task_subject: addTaskForm.subject.trim() || (addTaskForm.type === "new offer" ? "NEW OFFER" : "Follow-up"),
        task_message: addTaskForm.message.trim(),
        schedule_date: addTaskForm.date,
        created_at: new Date().toISOString()
      };
      finalTasks = [...campaign.tasks, newTask];
    }

    const updatedCampaign = { ...campaign, tasks: finalTasks };
    saveCampaign(updatedCampaign);

    setShowAddTaskModal(false);
    setEditingTaskId(null);
  };

  // Delete Task from Sequence
  const handleDeleteTask = (taskId) => {
    if (!campaign) return;

    const targetTask = campaign.tasks.find((t) => t.task_id === taskId);
    if (!targetTask) return;

    if (targetTask.task_status === "completed") {
      alert("Completed tasks have already been sent and cannot be deleted.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this follow-up/offer task from the campaign sequence?")) {
      let updatedTasks = campaign.tasks.filter((t) => t.task_id !== taskId);

      // Re-apply follow-up cascade subjects since index mapping shifted!
      updatedTasks = updatedTasks.map((task, index) => {
        if (index > 0 && task.task_type === "follow up") {
          const prev = updatedTasks[index - 1];
          const targetSubject = prev ? (prev.task_subject.startsWith("Re: ") ? prev.task_subject : `Re: ${prev.task_subject}`) : "";
          return { ...task, task_subject: targetSubject };
        }
        return task;
      });

      const updatedCampaign = { ...campaign, tasks: updatedTasks };
      saveCampaign(updatedCampaign);
    }
  };

  // Dynamic calculations based on contacts list
  const activeContacts = campaign.contacts || [];
  const totalProspects = activeContacts.length;
  const bouncesCount = activeContacts.filter((c) => c.deliveryStatus === "Bounced").length;
  const repliesCount = activeContacts.filter((c) => c.deliveryStatus === "Replied").length;
  const openedCount = activeContacts.filter((c) => c.deliveryStatus === "Opened" || c.deliveryStatus === "Replied").length;

  const deliverabilityPercentage = totalProspects > 0 ? Math.round(((totalProspects - bouncesCount) / totalProspects) * 100) : 100;
  const openPercentage = (totalProspects - bouncesCount) > 0 ? Math.round((openedCount / (totalProspects - bouncesCount)) * 100) : 0;

  // Build Chronological Chat Thread from ALL sequence tasks
  const chatThread = [];

  if (campaign.tasks && campaign.tasks.length > 0) {
    campaign.tasks.forEach((task, index) => {
      chatThread.push({
        id: task.task_id,
        type: "outbound",
        sender: campaign.persona?.name || "Genius Outbound Bot",
        date: task.schedule_date,
        time: defaultSendTime,
        subject: task.task_subject,
        message: task.task_message,
        status: task.task_status.charAt(0).toUpperCase() + task.task_status.slice(1),
        info: task.task_status === "scheduled" ? "Scheduled outreach touchpoint." : task.task_status === "completed" ? "Sequence message sent." : "Outbound step configuration.",
        originalTask: task,
        isFirstTask: index === 0
      });

      // Inject reply bubble chronologically after the first outbound task
      if (index === 0 && campaign.status === "Replied") {
        const repliedContact = activeContacts.find((c) => c.deliveryStatus === "Replied")?.email || "Sarah Jenkins";
        chatThread.push({
          id: "reply-msg",
          type: "inbound",
          sender: repliedContact,
          date: task.schedule_date,
          time: "15:42",
          subject: `Re: ${task.task_subject}`,
          message: `Hi Team,\n\nThanks for reaching out. We are currently scaling our product suite and would be open to acquiring ${campaign.domain} to consolidate our brand identity.

Could you let us know what your current asking price is, and whether you facilitate payments directly via Escrow.com or Dan?

Looking forward to hearing from you.

Best,
Sarah Jenkins
CEO | Aether Labs`,
          status: "Replied",
          info: "Inbound negotiation message received.",
          originalTask: null
        });
      }
    });
  }

  const validCount = activeContacts.filter((c) => c.verificationStatus === "valid").length;
  const riskyCount = activeContacts.filter((c) => c.verificationStatus === "risky" || (!c.verificationStatus && c.deliveryStatus !== "Bounced")).length;
  const invalidCount = activeContacts.filter((c) => c.verificationStatus === "invalid" || c.deliveryStatus === "Bounced").length;

  const filteredContacts = activeContacts.filter((c) => {
    const searchMatch =
      c.email.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
      c.businessDomain.toLowerCase().includes(contactSearchTerm.toLowerCase());
    
    if (!searchMatch) return false;

    if (verificationFilter === "valid") {
      return c.verificationStatus === "valid";
    } else if (verificationFilter === "risky") {
      return c.verificationStatus === "risky" || (!c.verificationStatus && c.deliveryStatus !== "Bounced");
    } else if (verificationFilter === "invalid") {
      return c.verificationStatus === "invalid" || c.deliveryStatus === "Bounced";
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back link */}
      <div>
        <Link
          href="/admin/dashboard/outbounds"
          className="text-xs font-semibold text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 flex items-center gap-1 group"
        >
          <span>&larr;</span> Back to Outbound Mail Desk
        </Link>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-200/40 dark:border-zinc-800/30 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {campaign.domain}
            </h1>
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${campaign.status === "Sent"
                  ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                  : campaign.status === "Opened"
                    ? "bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400"
                    : campaign.status === "Replied"
                      ? "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400"
                }`}
            >
              {campaign.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-1.5">
            Outreach campaign targeted at <strong>{campaign.industry}</strong>, launched on {campaign.date}.
            {campaign.selling_price && (
              <>
                <span>&bull;</span>
                Selling Price: <span className="font-bold text-zinc-700 dark:text-zinc-300 font-mono">${campaign.selling_price}</span>
              </>
            )}
          </p>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setShowContactsModal(true);
              setContactSearchTerm("");
              setShowAddContactForm(false);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/25 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 font-semibold text-xs px-4 py-2.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Target Contacts ({totalProspects})
          </button>

          <button
            onClick={handleTriggerScraper}
            disabled={scraping}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200/50 dark:border-indigo-850/20 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-955/40 dark:hover:bg-indigo-955/60 text-indigo-650 dark:text-indigo-400 font-semibold text-xs px-4 py-2.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scraping ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                Scraping...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Trigger Business Scraper
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Deliverability</div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">{deliverabilityPercentage}%</div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${bouncesCount > 0 ? "bg-rose-500" : "bg-indigo-600"}`}
              style={{ width: `${deliverabilityPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Open Rate</div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">{openPercentage}%</div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${openPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Replies Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Replies Count</div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">{repliesCount}</div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800/40 pt-2 flex-wrap">
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {repliesCount > 0 ? "✓ Response received" : "Waiting for response"}
            </span>
            {repliesCount > 0 && (
              <Link
                href={`/admin/dashboard/outbounds/${campaign.domain}/replies`}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-305 flex items-center gap-0.5 cursor-pointer hover:underline"
              >
                Open Replies &rarr;
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Bounces Count</div>
          <div className={`text-3xl font-extrabold ${bouncesCount > 0 ? "text-rose-600" : "text-zinc-900 dark:text-white"}`}>{bouncesCount}</div>
          <div className={`text-[10px] mt-3 font-semibold ${bouncesCount > 0 ? "text-rose-500" : "text-zinc-400"}`}>
            {bouncesCount > 0 ? "⚠ Bounced address detected" : "All emails delivered"}
          </div>
        </div>
      </div>

      <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl shadow-sm flex flex-col overflow-hidden">

        {/* Chat Window Title Bar */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/30 dark:border-zinc-800/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Campaign Outbound Conversation thread</h3>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500">History of active/sent sequence emails and replies</p>
            </div>
          </div>

          {/* Right Header actions */}
          <div className="flex items-center gap-3.5 flex-wrap self-start sm:self-auto">
            {/* Add Task Button */}
            <button
              onClick={openAddTaskModal}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>

            {/* Send hour configuration */}
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200/40 dark:border-zinc-800/25 focus-within:ring-2 focus-within:ring-indigo-500/20">
              <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">
                Send Hour:
              </span>
              <input
                type="time"
                value={defaultSendTime}
                onChange={handleSendTimeChange}
                className="bg-transparent border-none outline-none text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:ring-0 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Dispatch Result Banner */}
        {sendTaskResult && (
          <div
            className={`px-6 py-3 border-b text-xs flex items-center justify-between ${
              sendTaskResult.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold">{sendTaskResult.success ? "✓ Task Dispatched:" : "⚠ Dispatch Failed:"}</span>
              <span>{sendTaskResult.message}</span>
            </div>
            <button
              onClick={() => setSendTaskResult(null)}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer ml-3"
            >
              &times;
            </button>
          </div>
        )}

        {/* Chat Conversation View Area */}
        <div className="p-6 bg-zinc-50/50 dark:bg-zinc-950/25 space-y-6 max-h-[600px] overflow-y-auto">
          {chatThread.length > 0 ? (
            chatThread.map((msg, idx) => {
              const isInbound = msg.type === "inbound";
              const taskStatus = msg.status.toLowerCase();
              const isSendingThisTask = sendingTaskId === msg.originalTask?.task_id;

              return (
                <div
                  key={msg.id || idx}
                  className={`flex gap-3.5 max-w-[85%] ${isInbound ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {isInbound ? (
                      <div className="h-8.5 w-8.5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-705 dark:text-emerald-400 flex items-center justify-center font-extrabold text-xs border border-emerald-200/30">
                        {msg.sender.charAt(0).toUpperCase()}
                      </div>
                    ) : campaign.persona?.imageUrl || campaign.persona?.image_url ? (
                      <img
                        src={campaign.persona.imageUrl || campaign.persona.image_url}
                        alt={campaign.persona.name || "Sender Persona"}
                        className="h-8.5 w-8.5 rounded-full object-cover border border-indigo-200/30"
                      />
                    ) : (
                      <div className="h-8.5 w-8.5 rounded-full bg-indigo-100 dark:bg-indigo-955/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-extrabold text-xs border border-indigo-200/30">
                        {campaign.persona?.name ? campaign.persona.name.charAt(0).toUpperCase() : "🤖"}
                      </div>
                    )}
                  </div>

                  {/* Message Bubble Container */}
                  <div className="space-y-1.5 text-right">
                    {/* Sender Name & Meta */}
                    <div className={`flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 ${isInbound ? "justify-start" : "justify-end"}`}>
                      <span className="font-bold text-zinc-700 dark:text-zinc-350">{msg.sender}</span>
                      <span>&bull;</span>
                      <span className="font-semibold">{msg.date} at {msg.time}</span>
                    </div>

                    {/* Chat bubble body */}
                    <div
                      className={`rounded-2xl px-4 py-3.5 shadow-sm text-xs border leading-relaxed whitespace-pre-wrap text-left ${isInbound
                          ? "bg-white dark:bg-zinc-900 border-zinc-200/40 dark:border-zinc-800 text-zinc-850 dark:text-zinc-250 rounded-tl-none"
                          : taskStatus === "draft"
                            ? "bg-zinc-100 dark:bg-zinc-950 border-zinc-200/50 dark:border-zinc-800 text-zinc-600 dark:text-zinc-355 rounded-tr-none border-dashed"
                            : "bg-indigo-600 dark:bg-indigo-900/60 border-indigo-500/10 text-white dark:text-zinc-100 rounded-tr-none"
                        }`}
                    >
                      {/* Subject Line display */}
                      <div
                        className={`border-b pb-2 mb-3 font-semibold font-mono text-[10px] ${isInbound
                            ? "border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400"
                            : taskStatus === "draft"
                              ? "border-zinc-200/30 dark:border-zinc-800 text-zinc-500 dark:text-zinc-450"
                              : "border-indigo-500/15 dark:border-indigo-800/20 text-indigo-100/90"
                          }`}
                      >
                        Subject: {msg.subject}
                      </div>

                      {/* Email Message */}
                      {msg.message}
                    </div>

                    {/* Bubble Status/Info Footer */}
                    <div className={`flex items-center gap-2 text-[9px] flex-wrap ${isInbound ? "justify-start text-zinc-450" : "justify-end text-zinc-450"}`}>
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-bold ${taskStatus === "completed"
                            ? "bg-emerald-50/55 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                            : taskStatus === "draft"
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                              : taskStatus === "scheduled"
                                ? "bg-blue-50/55 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                                : taskStatus === "executing"
                                  ? "bg-indigo-50/55 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                                  : taskStatus === "failed"
                                    ? "bg-rose-50/55 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-450"
                          }`}
                      >
                        {msg.status}
                      </span>
                      <span>{msg.info}</span>

                      {/* Inline Actions */}
                      {msg.originalTask && (
                        <div className="flex items-center gap-2 border-l border-zinc-200/40 dark:border-zinc-800/25 pl-2 ml-1">
                          <button
                            onClick={() => handleSendTaskToAllContacts(msg.originalTask)}
                            disabled={isSendingThisTask}
                            className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 dark:text-indigo-300 font-bold px-2 py-0.5 rounded transition-all cursor-pointer disabled:opacity-50"
                            title={`Send message to all ${totalProspects} contact(s). Replies route to ${personaForm.reply_to_email || personaForm.email || "persona email"}`}
                          >
                            {isSendingThisTask ? (
                              <>
                                <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                                Dispatching...
                              </>
                            ) : (
                              <>
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Send to All ({totalProspects})
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => openEditTaskModal(msg.originalTask)}
                            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold cursor-pointer hover:underline"
                          >
                            Edit
                          </button>
                          {taskStatus !== "completed" && (
                            <button
                              onClick={() => handleDeleteTask(msg.originalTask.task_id)}
                              className="text-rose-600 hover:text-rose-500 font-bold cursor-pointer hover:underline"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-zinc-400 dark:text-zinc-650 text-xs italic">
              No tasks have been executed yet. Click &quot;Add Task&quot; above to schedule.
            </div>
          )}
        </div>
      </div>

      {/* Target Contacts Manager Modal */}
      {showContactsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/30 dark:border-zinc-800/25 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  Target Contacts List ({totalProspects})
                </h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Campaign: <strong>{campaign.domain}</strong> &bull; Prospects for {campaign.industry}
                </p>
              </div>
              <button
                onClick={() => setShowContactsModal(false)}
                className="text-zinc-450 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Search Bar & Action Controls */}
            <div className="px-6 py-3 bg-zinc-50/30 dark:bg-zinc-900/30 border-b border-zinc-200/30 dark:border-zinc-800/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 flex items-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-800/30 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20">
                  <svg className="h-3.5 w-3.5 text-zinc-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={contactSearchTerm}
                    onChange={(e) => setContactSearchTerm(e.target.value)}
                    placeholder="Search contacts..."
                    className="w-full bg-transparent border-0 outline-none text-xs text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVerifyCampaignContacts}
                  disabled={verifyingContacts}
                  className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                  title="Verify all emails using Trigger.dev email verifier task"
                >
                  {verifyingContacts ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verify Emails
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowAddContactForm(!showAddContactForm)}
                  className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-955/30 dark:hover:bg-indigo-955/50 text-indigo-600 dark:text-indigo-400 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  {showAddContactForm ? "Close Form" : "+ Add Contact"}
                </button>
              </div>
            </div>

            {/* Segmented Filter Pills */}
            <div className="px-6 py-2 bg-zinc-100/50 dark:bg-zinc-950/40 border-b border-zinc-200/20 dark:border-zinc-800/20 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                {[
                  { id: "all", label: `All (${totalProspects})` },
                  { id: "valid", label: `Valid (${validCount})`, color: "emerald" },
                  { id: "risky", label: `Risky (${riskyCount})`, color: "amber" },
                  { id: "invalid", label: `Invalid (${invalidCount})`, color: "rose" }
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setVerificationFilter(pill.id)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      verificationFilter === pill.id
                        ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {verifyResult && (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[260px]">
                  {verifyResult}
                </span>
              )}
            </div>

            {/* Scrollable prospects list */}
            <div className="p-6 overflow-y-auto flex-grow space-y-4">
              {showAddContactForm && (
                <form onSubmit={handleAddContactSubmit} className="p-4 border border-indigo-100/50 dark:border-indigo-950/30 rounded-xl bg-indigo-50/10 dark:bg-indigo-950/10 space-y-3.5 animate-scale-up">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Register Target Profile</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="modal-email" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Email Address *</label>
                      <input
                        type="email"
                        id="modal-email"
                        required
                        placeholder="e.g. s.jenkins@aethercloud.io"
                        value={newContact.email}
                        onChange={handleEmailChange}
                        className="w-full rounded-lg bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="modal-domain" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Business Domain *</label>
                      <input
                        type="text"
                        id="modal-domain"
                        required
                        placeholder="e.g. aethercloud.io"
                        value={newContact.businessDomain}
                        onChange={(e) => setNewContact(prev => ({ ...prev, businessDomain: e.target.value }))}
                        className="w-full rounded-lg bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="modal-status" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Delivery Status</label>
                    <select
                      id="modal-status"
                      value={newContact.status}
                      onChange={(e) => setNewContact(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full rounded-lg bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Sent">Sent</option>
                      <option value="Opened">Opened</option>
                      <option value="Replied">Replied</option>
                      <option value="Bounced">Bounced</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-xs font-semibold shadow active:scale-98 transition-all cursor-pointer text-center"
                  >
                    Add Recipient to Sequence
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact, idx) => (
                    <div
                      key={contact.email || idx}
                      className="p-4 rounded-xl border border-zinc-200/20 dark:border-zinc-800/20 bg-zinc-50/10 dark:bg-zinc-950/10 flex items-center justify-between gap-4 group/modalitem"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-tight font-mono">
                          {contact.email}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1.5 font-sans">
                          <svg className="h-3 w-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.657-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.657-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          Domain: <span className="font-semibold text-zinc-600 dark:text-zinc-400">{contact.businessDomain}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {/* Verification Status Badge */}
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold ${
                            contact.verificationStatus === "valid"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40"
                              : contact.verificationStatus === "invalid" || contact.deliveryStatus === "Bounced"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/40"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/40"
                          }`}
                        >
                          {contact.verificationStatus
                            ? contact.verificationStatus.toUpperCase()
                            : contact.deliveryStatus === "Bounced"
                            ? "INVALID"
                            : "UNVERIFIED"}
                        </span>

                        {/* Delivery Status Badge */}
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold ${contact.deliveryStatus === "Sent"
                              ? "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                              : contact.deliveryStatus === "Opened"
                                ? "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                                : contact.deliveryStatus === "Replied"
                                  ? "bg-emerald-50/55 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
                            }`}
                        >
                          {contact.deliveryStatus}
                        </span>

                        <button
                          onClick={() => handleRemoveContact(contact.email)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer"
                          title="Delete prospect"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-zinc-400 dark:text-zinc-550">
                    No prospects match your search criteria.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-200/30 dark:border-zinc-800/25 flex justify-end flex-shrink-0 bg-zinc-50/50 dark:bg-zinc-950/20">
              <button
                onClick={() => setShowContactsModal(false)}
                className="rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-750 dark:text-zinc-300 font-semibold text-xs px-5 py-2.5 cursor-pointer"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Sequence Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm transition-all animate-fade-in">
          <form onSubmit={handleSaveNewTask} className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/30 dark:border-zinc-800/25 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {editingTaskId ? "Edit Sequence Task" : "Add New Sequence Task"}
                </h3>
                <p className="text-[10px] text-zinc-455 dark:text-zinc-500 mt-0.5">
                  {editingTaskId ? "Modify existing outbound step values" : "Design a single step to append to the outreach campaign sequence"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddTaskModal(false);
                  setEditingTaskId(null);
                }}
                className="text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-200 cursor-pointer text-xl font-bold font-sans"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {(() => {
                const isFirst = editingTaskId
                  ? campaign.tasks.findIndex((t) => t.task_id === editingTaskId) === 0
                  : campaign.tasks.length === 0;
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="form-type" className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Outreach Type</label>
                        <select
                          id="form-type"
                          disabled={isFirst}
                          value={addTaskForm.type}
                          onChange={(e) => handleAddTaskFormChange("type", e.target.value)}
                          className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 disabled:bg-zinc-100 dark:disabled:bg-zinc-950/45 disabled:cursor-not-allowed"
                        >
                          {isFirst ? (
                            <option value="FirstOutbound">FirstOutbound</option>
                          ) : (
                            <>
                              <option value="follow up">follow up</option>
                              <option value="new offer">new offer</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="form-status" className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Execution Status</label>
                        <select
                          id="form-status"
                          value={addTaskForm.status}
                          onChange={(e) => handleAddTaskFormChange("status", e.target.value)}
                          className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                        >
                          {["draft", "scheduled", "executing", "completed", "failed"].map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="form-date" className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Send Date</label>
                        <input
                          type="date"
                          id="form-date"
                          required
                          min={todayStr}
                          value={addTaskForm.date}
                          onChange={(e) => handleAddTaskFormChange("date", e.target.value)}
                          className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="form-template" className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                        Outreach Template
                      </label>
                      <select
                        id="form-template"
                        value={selectedTemplateId}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer text-zinc-850 dark:text-zinc-250"
                      >
                        <option value="">{editingTaskId ? "-- Keep Current Message --" : "-- Select Template --"}</option>
                        {dbTemplates
                          .filter((t) => isFirst ? t.category === "FirstOutbound" : (t.category === "FollowUp" || t.category === "PriceChange"))
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              [{t.category === "PriceChange" ? "Price Change" : t.category === "FollowUp" ? "Follow Up" : "FirstOutbound"}] {t.name}
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    {(() => {
                      const activeTpl = dbTemplates.find((t) => t.id === selectedTemplateId);
                      if (activeTpl?.category === "PriceChange") {
                        return (
                          <div className="pt-1">
                            <label htmlFor="form-newprice" className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                              New Price ($) *
                            </label>
                            <input
                              type="text"
                              id="form-newprice"
                              required
                              value={newPriceValue}
                              onChange={(e) => handlePriceChange(e.target.value)}
                              placeholder="e.g. 12,000"
                              className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-955 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                            />
                            <p className="text-[9px] text-zinc-400 mt-1 italic">
                              Note: The price entered will dynamically replace the [price] placeholder inside the email message.
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Geo Domain — Location & Service fields */}
                    {campaign.domainType === "Geo Domain" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20">
                        <div className="col-span-2">
                          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Geo Domain — Fill Location &amp; Service
                          </p>
                          <p className="text-[9px] text-indigo-400 dark:text-indigo-500 mt-0.5">Updating these fields instantly rewrites the subject and message below.</p>
                        </div>
                        <div>
                          <label htmlFor="geo-location" className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Location *</label>
                          <input
                            type="text"
                            id="geo-location"
                            value={geoLocation}
                            onChange={(e) => handleGeoFieldChange("location", e.target.value)}
                            placeholder="e.g. Long Island"
                            className="w-full rounded-xl bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 border border-indigo-200/50 dark:border-indigo-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div>
                          <label htmlFor="geo-service" className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Service / Niche *</label>
                          <input
                            type="text"
                            id="geo-service"
                            value={geoService}
                            onChange={(e) => handleGeoFieldChange("service", e.target.value)}
                            placeholder="e.g. Real Estate Agents"
                            className="w-full rounded-xl bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 border border-indigo-200/50 dark:border-indigo-800/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              <div>
                <label htmlFor="form-subject" className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Email Subject Line</label>
                <input
                  type="text"
                  id="form-subject"
                  required
                  disabled={addTaskForm.type === "follow up"}
                  value={addTaskForm.subject}
                  onChange={(e) => handleAddTaskFormChange("subject", e.target.value)}
                  placeholder="e.g. SPECIAL OFFER: quantumflow.ai"
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 disabled:bg-zinc-100 dark:disabled:bg-zinc-950/45 disabled:text-zinc-500 disabled:cursor-not-allowed font-sans"
                />
                {addTaskForm.type === "follow up" && (
                  <p className="text-[9px] text-zinc-400 mt-1 italic">
                    Note: Follow-up messages automatically inherit the subject line of the preceding task to keep replies threaded.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="form-message" className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Email Message Content</label>
                <textarea
                  id="form-message"
                  required
                  rows="10"
                  value={addTaskForm.message}
                  onChange={(e) => handleAddTaskFormChange("message", e.target.value)}
                  placeholder="Enter email pitch message here..."
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-905 px-3.5 py-3 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/40 dark:border-zinc-800/30 focus:outline-none focus:border-indigo-500 font-mono resize-none leading-relaxed"
                ></textarea>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-200/30 dark:border-zinc-800/25 flex justify-end gap-2.5 flex-shrink-0 bg-zinc-50/50 dark:bg-zinc-955/20">
              <button
                type="button"
                onClick={() => {
                  setShowAddTaskModal(false);
                  setEditingTaskId(null);
                }}
                className="rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs px-4 py-2.5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 shadow active:scale-95 transition-all cursor-pointer"
              >
                {editingTaskId ? "Save Changes" : "Create Task"}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}
