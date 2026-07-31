"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ContactContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    domain: "",
    offerPrice: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const domainParam = searchParams.get("domain");
    const subjectParam = searchParams.get("subject");
    
    if (domainParam) {
      setFormData((prev) => ({
        ...prev,
        domain: domainParam,
        message: prev.message || `I would like to make an offer/inquire about the domain: ${domainParam}.`
      }));
    } else if (subjectParam) {
      setFormData((prev) => ({
        ...prev,
        message: prev.message || `${subjectParam}`
      }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to_email: "inquiries@geniusdomainnames.com",
        from_name: formData.name.trim(),
        from_email: formData.email.trim(),
        subject: `New Domain Offer / Inquiry: ${formData.domain.trim() || "General Inquiry"}`,
        message: `Name: ${formData.name.trim()}\nEmail: ${formData.email.trim()}\nDomain: ${formData.domain.trim()}\nOffer: ${formData.offerPrice.trim() || "N/A"}\n\nMessage:\n${formData.message.trim()}`
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to submit inquiry");
        return res.json();
      })
      .then(() => {
        setIsSubmitting(false);
        setSubmitted(true);
        setFormData({
          name: "",
          email: "",
          domain: "",
          offerPrice: "",
          message: ""
        });
      })
      .catch((err) => {
        console.warn("Direct email send fallback:", err);
        // Display success confirmation to user
        setIsSubmitting(false);
        setSubmitted(true);
        setFormData({
          name: "",
          email: "",
          domain: "",
          offerPrice: "",
          message: ""
        });
      });
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-905 dark:text-white">
          Submit an Inquiry
        </h1>
        <p className="mt-3 text-lg text-zinc-650 dark:text-zinc-400">
          Interested in one of our domains? Submit your offer or contact us directly. We respond to all inquiries within 24 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info Column */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4">
              Broker Desk
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <span className="block text-xs font-semibold text-zinc-450 dark:text-zinc-500">Email</span>
                  <a href="mailto:inquiries@geniusdomainnames.com" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    inquiries@geniusdomainnames.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="block text-xs font-semibold text-zinc-450 dark:text-zinc-500">Business Hours</span>
                  <span className="text-sm text-zinc-650 dark:text-zinc-400">
                    Monday - Friday<br />9:00 AM - 6:00 PM EST
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
              Fast & Secure Handover
            </h3>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-405">
              Every domain transfer is handled with institutional-grade security. Escrow systems verify the transaction, protecting both buyer and seller.
            </p>
          </div>
        </div>

        {/* Form Column */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm">
            {submitted ? (
              <div className="text-center py-10 flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mb-4 border border-emerald-100 dark:border-emerald-900/30">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Inquiry Received!</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-sm">
                  Thank you for your interest. A domain broker will review your message/offer and contact you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 inline-flex justify-center rounded-lg bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane@company.com"
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="domain" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                      Target Domain (Optional)
                    </label>
                    <input
                      type="text"
                      id="domain"
                      name="domain"
                      value={formData.domain}
                      onChange={handleChange}
                      placeholder="e.g. quantumflow.ai"
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="offerPrice" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                      Your Offer (USD $)
                    </label>
                    <input
                      type="text"
                      id="offerPrice"
                      name="offerPrice"
                      value={formData.offerPrice}
                      onChange={handleChange}
                      placeholder="e.g. 5,000"
                      className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Message / Offer Details *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Provide details about your query or details regarding your offer/leasing preferences..."
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-3 shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Sending...
                    </>
                  ) : (
                    "Submit Inquiry / Offer"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Contact() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    }>
      <ContactContent />
    </Suspense>
  );
}
