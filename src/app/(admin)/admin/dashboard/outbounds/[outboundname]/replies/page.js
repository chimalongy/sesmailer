"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OutboundRepliesPage({ params }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const outboundname = decodeURIComponent(unwrappedParams.outboundname);

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Thread Modal States
  const [selectedProspectEmail, setSelectedProspectEmail] = useState("");
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [replyText, setReplyText] = useState("");

  // Keyboard shortcut to close modal via Escape key
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        setShowThreadModal(false);
      }
    };
    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, []);

  const getExtendedProspectsList = (launchDate, domain) => {
    return [
      {
        email: "s.jenkins@aethercloud.io",
        businessDomain: "aethercloud.io",
        deliveryStatus: "Replied"
      },
      {
        email: "marcus.vance@cloudifysystems-error.com",
        businessDomain: "cloudifysystems-error.com",
        deliveryStatus: "Bounced"
      },
      {
        email: "dchen@cloudylydevops.com",
        businessDomain: "cloudylydevops.com",
        deliveryStatus: "Opened"
      },
      {
        email: "elena@vortexcloud.net",
        businessDomain: "vortexcloud.net",
        deliveryStatus: "Replied"
      },
      {
        email: "james@nimbusscale.com",
        businessDomain: "nimbusscale.com",
        deliveryStatus: "Sent"
      },
      {
        email: "t.miller@skylineops-error.com",
        businessDomain: "skylineops-error.com",
        deliveryStatus: "Bounced"
      },
      {
        email: "h.walter@stratuscompute-error.org",
        businessDomain: "stratuscompute-error.org",
        deliveryStatus: "Bounced"
      },
      {
        email: "r.patel@cumulusbrand.co",
        businessDomain: "cumulusbrand.co",
        deliveryStatus: "Replied"
      },
      {
        email: "a.novak@altuscloud.net",
        businessDomain: "altuscloud.net",
        deliveryStatus: "Opened"
      },
      {
        email: "k.sato@cirrusdev.io",
        businessDomain: "cirrusdev.io",
        deliveryStatus: "Sent"
      }
    ];
  };

  const fetchCampaign = () => {
    fetch(`/api/outbounds/${encodeURIComponent(outboundname)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load campaign replies");
        return res.json();
      })
      .then((data) => {
        let found = data;
        
        // Initialize contacts if they are empty or short
        if (!found.contacts || found.contacts.length === 0) {
          found.contacts = getExtendedProspectsList(found.date, found.domain);
        }

        // Make sure messages array exists for mock replied/bounced contacts
        found.contacts = found.contacts.map((c) => {
          if (!c.messages) {
            if (c.deliveryStatus === "Replied") {
              c.messages = [
                {
                  id: "msg-1",
                  sender: "outbound-system",
                  date: found.date,
                  time: found.defaultSendTime || "09:00",
                  subject: `Acquiring the premium brand identity ${found.domain}`,
                  body: `Hi there,\n\nI noticed your product development in the Cloud & Devops sector.\n\nI own the premium web address ${found.domain} and wanted to inquire if your team would be interested in acquiring it.\n\nSecuring ${found.domain} grants immediate brand recall, organic authority, and protects your positioning against competitors.\n\nWe facilitate transactions securely via Escrow.com or Dan.com.\n\nKind regards,\nDomain Broker Desk\nGenius Domain Names`
                },
                {
                  id: "msg-2",
                  sender: "prospect",
                  date: found.date,
                  time: "15:42",
                  subject: `Re: Acquiring the premium brand identity ${found.domain}`,
                  body: `Hi Team,\n\nThanks for reaching out. We are currently scaling our product suite and would be open to acquiring ${found.domain} to consolidate our brand identity.\n\nCould you let us know what your asking price is, and whether you facilitate payments directly via Escrow.com or Dan?\n\nLooking forward to hearing from you.\n\nBest,\nLead Representative`
                }
              ];
            } else if (c.deliveryStatus === "Bounced") {
              c.messages = [
                {
                  id: "msg-1",
                  sender: "outbound-system",
                  date: found.date,
                  time: found.defaultSendTime || "09:00",
                  subject: `Acquiring the premium brand identity ${found.domain}`,
                  body: `Hi there,\n\nI noticed your product development in the Cloud & Devops sector.\n\nI own the premium web address ${found.domain} and wanted to inquire if your team would be interested in acquiring it.\n\nKind regards,\nDomain Broker Desk\nGenius Domain Names`
                },
                {
                  id: "msg-bounce",
                  sender: "mailer-daemon",
                  date: found.date,
                  time: "09:04",
                  subject: `Delivery Status Notification (Failure) for recipient: ${c.email}`,
                  body: `This is an automatically generated Delivery Status Notification.\n\nDelivery to the following recipient failed permanently:\n  ${c.email}\n\nTechnical details of permanent failure:\nGoogle SMTP Server returned: 550 5.1.1 The email account that you tried to reach does not exist. Please verify the address format and spelling.`
                }
              ];
            }
          }
          return c;
        });

        // Sync initial mock configuration change back to Neon database
        fetch(`/api/outbounds/${encodeURIComponent(outboundname)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ contacts: found.contacts })
        })
          .then(() => {
            setCampaign(found);
            setLoading(false);
          })
          .catch((err) => {
            console.error("Failed to sync initialized contacts:", err);
            setCampaign(found);
            setLoading(false);
          });
      })
      .catch((err) => {
        console.error("Failed to fetch campaign replies:", err);
        setCampaign(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCampaign();
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
          Could not locate outbound metrics logs for replies relating to <strong>&quot;{outboundname}&quot;</strong>.
        </p>
        <Link
          href="/admin/dashboard/outbounds"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3 shadow-md"
        >
          Back to Outbounds
        </Link>
      </div>
    );
  }

  const saveCampaign = (updatedCampaign) => {
    fetch(`/api/outbounds/${encodeURIComponent(outboundname)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedCampaign)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save replies data");
        return res.json();
      })
      .then(() => {
        setCampaign(updatedCampaign);
      })
      .catch((err) => {
        console.error("Failed to save replies changes:", err);
        alert("Failed to persist changes to the database.");
      });
  };

  // Filter contacts list to extract up to 10 Replied & Bounced records for the inbox
  const inboxContacts = (campaign.contacts || [])
    .filter((c) => c.deliveryStatus === "Replied" || c.deliveryStatus === "Bounced")
    .slice(0, 10);

  const selectedProspect = inboxContacts.find((r) => r.email === selectedProspectEmail);
  const isBounced = selectedProspect?.deliveryStatus === "Bounced";

  // Open thread modal handler
  const handleOpenThread = (email) => {
    setSelectedProspectEmail(email);
    setShowThreadModal(true);
    setReplyText("");
  };

  // Send Negotiator response handler
  const handleSendBrokerReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedProspect || isBounced) return;

    const newReply = {
      id: "reply-" + Date.now(),
      sender: "broker",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      subject: selectedProspect.messages && selectedProspect.messages.length > 0 
        ? `Re: ${selectedProspect.messages[selectedProspect.messages.length - 1].subject}`
        : `Re: Strategic domain proposal: ${campaign.domain}`,
      body: replyText.trim()
    };

    const updatedContacts = campaign.contacts.map((c) => {
      if (c.email === selectedProspectEmail) {
        return {
          ...c,
          messages: [...(c.messages || []), newReply]
        };
      }
      return c;
    });

    const updatedCampaign = { ...campaign, contacts: updatedContacts };
    saveCampaign(updatedCampaign);
    setReplyText("");
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Navigation header */}
      <div>
        <Link
          href={`/admin/dashboard/outbounds/${campaign.domain}`}
          className="text-xs font-semibold text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 flex items-center gap-1 group"
        >
          <span>&larr;</span> Back to Campaign Details
        </Link>
      </div>

      <div className="border-b border-zinc-200/40 dark:border-zinc-800/30 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Inbound Lead Negotiation Desk
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Replies and deliverability logs for acquisition campaign: <strong>{campaign.domain}</strong>
        </p>
      </div>

      {inboxContacts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl p-12 text-center shadow-sm">
          <svg className="mx-auto h-12 w-12 text-zinc-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
          </svg>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">No Inbox Entries</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            No prospect replies or failure notices have been logged for this campaign yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {inboxContacts.map((prospect) => {
            const isEntryBounced = prospect.deliveryStatus === "Bounced";
            const lastMsg = prospect.messages && prospect.messages.length > 0 
              ? prospect.messages[prospect.messages.length - 1] 
              : null;
            
            return (
              <div
                key={prospect.email}
                onClick={() => handleOpenThread(prospect.email)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 hover:border-indigo-500/60 dark:hover:border-indigo-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between space-y-4 hover:translate-y-[-2px] duration-200"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold ${
                      isEntryBounced 
                        ? "bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400"
                        : "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {prospect.deliveryStatus}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {lastMsg ? lastMsg.time : ""}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate font-mono">
                    {prospect.email}
                  </h3>
                  
                  <p className="text-xs text-zinc-500 mt-1">
                    Domain: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{prospect.businessDomain}</span>
                  </p>

                  {lastMsg && (
                    <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-3 border border-zinc-200/20 dark:border-zinc-800/30 text-[11px] text-zinc-655 dark:text-zinc-400 mt-3.5 italic leading-relaxed line-clamp-2">
                      &quot;{lastMsg.body}&quot;
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/40 text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                  <span>View Negotiation thread</span>
                  <span>&rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Thread Conversation Modal */}
      {showThreadModal && selectedProspect && (
        <div
          onClick={() => setShowThreadModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm transition-all animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/25 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up flex flex-col max-h-[90vh] cursor-default"
          >
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-200/30 dark:border-zinc-800/25 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate font-mono max-w-md">
                  Negotiation: {selectedProspect.email}
                </h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-505 mt-0.5">
                  Target Domain: <span className="font-semibold">{selectedProspect.businessDomain}</span>
                </p>
              </div>
              <button
                onClick={() => setShowThreadModal(false)}
                className="text-zinc-455 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer text-xl font-bold font-sans"
              >
                &times;
              </button>
            </div>

            {/* Modal Scrollable conversation body */}
            <div className="p-6 overflow-y-auto space-y-6 bg-zinc-50/20 dark:bg-zinc-950/10 flex-grow">
              {selectedProspect.messages && selectedProspect.messages.map((msg, idx) => {
                const isProspect = msg.sender === "prospect";
                const isBroker = msg.sender === "broker";
                const isMailer = msg.sender === "mailer-daemon";

                let avatar = "🤖";
                let senderLabel = "Outbound Bot";
                let bubbleClass = "bg-indigo-600 dark:bg-indigo-900/60 border-indigo-500/10 text-white dark:text-zinc-100 rounded-tr-none";
                let containerClass = "ml-auto flex-row-reverse";

                if (isProspect) {
                  avatar = "📥";
                  senderLabel = "Lead reply message";
                  bubbleClass = "bg-white dark:bg-zinc-900 border-zinc-200/40 dark:border-zinc-800 text-zinc-850 dark:text-zinc-250 rounded-tl-none";
                  containerClass = "mr-auto";
                } else if (isBroker) {
                  avatar = "💼";
                  senderLabel = "Broker Desk Response";
                  bubbleClass = "bg-indigo-600 dark:bg-indigo-900/60 border-indigo-500/10 text-white dark:text-zinc-100 rounded-tr-none";
                  containerClass = "ml-auto flex-row-reverse";
                } else if (isMailer) {
                  avatar = "🚫";
                  senderLabel = "Mail Delivery Subsystem";
                  bubbleClass = "bg-rose-50/50 dark:bg-rose-955/10 border-rose-100/50 dark:border-rose-900/30 text-rose-800 dark:text-rose-250 rounded-tl-none border-dashed";
                  containerClass = "mr-auto";
                }

                return (
                  <div
                    key={msg.id || idx}
                    className={`flex gap-3.5 max-w-[85%] ${containerClass}`}
                  >
                    {/* Avatar */}
                    <div className="h-8 w-8 flex-shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center font-bold text-xs border border-zinc-200/30 dark:border-zinc-800">
                      {avatar}
                    </div>

                    {/* Bubble content */}
                    <div className="space-y-1">
                      <div className={`flex items-center gap-2 text-[9px] text-zinc-400 dark:text-zinc-500 ${isProspect || isMailer ? "justify-start" : "justify-end"}`}>
                        <span className="font-bold text-zinc-700 dark:text-zinc-350">{senderLabel}</span>
                        <span>&bull;</span>
                        <span>{msg.date} at {msg.time}</span>
                      </div>

                      <div className={`rounded-2xl px-4 py-3.5 shadow-sm text-xs border leading-relaxed whitespace-pre-wrap ${bubbleClass}`}>
                        <div className={`border-b pb-1.5 mb-2 font-mono text-[9px] font-semibold ${
                          isProspect || isMailer
                            ? "border-zinc-200/40 dark:border-zinc-800/45 text-zinc-500"
                            : "border-indigo-500/15 dark:border-indigo-850/20 text-indigo-100"
                        }`}>
                          Subject: {msg.subject}
                        </div>
                        {msg.body}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer: Composer box or block alert */}
            <div className="flex-shrink-0 bg-zinc-50/50 dark:bg-zinc-950/20 border-t border-zinc-200/30 dark:border-zinc-800/25">
              {isBounced ? (
                <div className="p-5 flex gap-2.5 items-start text-xs text-rose-700 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-955/10">
                  <svg className="h-5 w-5 text-rose-605 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <span className="font-bold block">Recipient Address Blocked</span>
                    This recipient has bounced permanently. Automatic re-sending and manual quick-replies are blocked to preserve domain delivery reputation.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendBrokerReply} className="p-4 space-y-3">
                  <textarea
                    rows="3"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${selectedProspect.email}...`}
                    className="w-full rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/40 dark:border-zinc-800/30 p-3 text-xs text-zinc-905 dark:text-zinc-100 focus:outline-none focus:border-indigo-600 resize-none font-sans"
                  ></textarea>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setShowThreadModal(false)}
                      className="rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs px-4 py-2 cursor-pointer"
                    >
                      Close Desk
                    </button>
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-505 text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Message Proposal
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
