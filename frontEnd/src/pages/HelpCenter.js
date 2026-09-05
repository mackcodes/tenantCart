import { useState } from "react";

import DashboardLayout from "../components/dashboard/DashboardLayout.js";

const faqs = [
  {
    question: "How do I create my online store?",
    answer:
      "Go to Dashboard and click 'Create your store'. Fill in your store name, address (URL slug), business details, and branding. Your store goes live after admin approval.",
  },
  {
    question: "How do I add products?",
    answer:
      "Go to Products in the sidebar. Click 'Add product', fill in name, description, price, stock, and upload an image. Products appear on your storefront immediately.",
  },
  {
    question: "How does checkout and payment work?",
    answer:
      "Customers add products to their cart and check out. We use Razorpay for payments — go to Settings > Payments and add your Razorpay Key ID and Secret to enable payments for your store.",
  },
  {
    question: "How do discount codes work?",
    answer:
      "Go to Discounts in the sidebar. Create a code with a percentage or fixed discount, minimum order amount, usage limit, and expiry. Share the code with your customers — they enter it at checkout.",
  },
  {
    question: "Can my team members access the dashboard?",
    answer:
      "Yes. Go to Settings > Team and invite team members by email. Assign them roles: Admin (full access), Manager (orders and products), or Staff (read-only).",
  },
  {
    question: "What is the free shipping threshold?",
    answer:
      "Go to Settings > Shipping. Set a flat rate for orders below the threshold and a minimum order amount above which shipping is free. You can also enable local pickup.",
  },
  {
    question: "How do I customise my storefront appearance?",
    answer:
      "Go to Templates in the sidebar. Choose from prebuilt templates or generate one with AI. Apply a template to instantly update your store's colors, fonts, and layout.",
  },
];

const HelpCenter = () => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <DashboardLayout>
      <main className="account-settings">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Support</p>
            <h1>Help center</h1>
            <p className="page-heading__description">
              Find answers to common questions or get in touch with support.
            </p>
          </div>
        </section>

        <section className="settings-panel">
          <h2>Getting started</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
            {faqs.map((faq, index) => (
              <div
                className="settings-panel"
                key={index}
                style={{ marginBottom: 0, cursor: "pointer" }}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <div
                  className="settings-panel__header"
                  style={{ justifyContent: "space-between" }}
                >
                  <h3 style={{ margin: 0, fontSize: "1rem" }}>{faq.question}</h3>
                  <span>{openIndex === index ? "▲" : "▼"}</span>
                </div>
                {openIndex === index && (
                  <p style={{ margin: "8px 0 0" }}>{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="settings-panel">
          <h2>Still need help?</h2>
          <p>Our support team is happy to help.</p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
            <a
              href="mailto:support@tenantcart.com"
              className="button button--secondary"
            >
              Email support
            </a>
            <a
              href="https://docs.tenantcart.com"
              target="_blank"
              rel="noopener noreferrer"
              className="button button--secondary"
            >
              Read docs
            </a>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
};

export default HelpCenter;
