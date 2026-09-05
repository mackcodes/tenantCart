import { useEffect, useState } from "react";

import DashboardLayout from "../components/dashboard/DashboardLayout.js";
import { useAuth } from "../context/AuthContext.js";
import { getContent, saveContent } from "../services/contentService.js";

const emptyBanner = { imageUrl: "", title: "", subtitle: "", link: "" };
const emptyFaq = { question: "", answer: "" };

const DashboardContent = () => {
  const { user, tenants } = useAuth();
  const currentTenant = user?.tenant;
  const currentMembership = tenants.find(
    ({ tenant }) => String(tenant?._id) === String(currentTenant?._id)
  );
  const canManage = ["owner", "admin"].includes(currentMembership?.role);

  const [banners, setBanners] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!currentTenant) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const data = await getContent();
        setBanners(data.content?.banners || []);
        setFaqs(data.content?.faqs || []);
      } catch (requestError) {
        setError(requestError.message || "Unable to load storefront content.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentTenant?._id]);

  const updateBanner = (index, field, value) => {
    setBanners((current) =>
      current.map((banner, i) => (i === index ? { ...banner, [field]: value } : banner))
    );
  };

  const updateFaq = (index, field, value) => {
    setFaqs((current) =>
      current.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq))
    );
  };

  const handleSave = async () => {
    setError("");
    setNotice("");
    setSaving(true);

    try {
      const data = await saveContent({ banners, faqs });
      setBanners(data.content?.banners || []);
      setFaqs(data.content?.faqs || []);
      setNotice("Storefront content saved successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to save storefront content.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="account-settings">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Manage</p>
            <h1>Content</h1>
            <p className="page-heading__description">
              Manage homepage banners and frequently asked questions shown on
              your storefront.
            </p>
          </div>
        </section>

        {!currentTenant ? (
          <section className="settings-panel">
            <h2>No active store</h2>
            <p>Create a store before editing content.</p>
          </section>
        ) : loading ? (
          <section className="settings-panel">
            <p>Loading content...</p>
          </section>
        ) : !canManage ? (
          <section className="settings-panel">
            <h2>Content</h2>
            <p>Only the store owner or admins can edit storefront content.</p>
          </section>
        ) : (
          <>
            <section className="settings-panel">
              <div className="settings-panel__header">
                <h2>Banners</h2>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setBanners((current) => [...current, { ...emptyBanner }])}
                >
                  Add banner
                </button>
              </div>
              {banners.length === 0 && <p>No banners yet.</p>}
              {banners.map((banner, index) => (
                <div key={index} className="settings-danger-form" style={{ flexWrap: "wrap", marginTop: 12 }}>
                  <input
                    placeholder="Image URL"
                    value={banner.imageUrl}
                    onChange={(event) => updateBanner(index, "imageUrl", event.target.value)}
                  />
                  <input
                    placeholder="Title"
                    value={banner.title}
                    onChange={(event) => updateBanner(index, "title", event.target.value)}
                  />
                  <input
                    placeholder="Subtitle"
                    value={banner.subtitle}
                    onChange={(event) => updateBanner(index, "subtitle", event.target.value)}
                  />
                  <input
                    placeholder="Link"
                    value={banner.link}
                    onChange={(event) => updateBanner(index, "link", event.target.value)}
                  />
                  <button
                    type="button"
                    className="button button--danger"
                    onClick={() => setBanners((current) => current.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </section>

            <section className="settings-panel">
              <div className="settings-panel__header">
                <h2>FAQs</h2>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setFaqs((current) => [...current, { ...emptyFaq }])}
                >
                  Add FAQ
                </button>
              </div>
              {faqs.length === 0 && <p>No FAQs yet.</p>}
              {faqs.map((faq, index) => (
                <div key={index} className="settings-danger-form" style={{ flexWrap: "wrap", marginTop: 12 }}>
                  <input
                    placeholder="Question"
                    value={faq.question}
                    onChange={(event) => updateFaq(index, "question", event.target.value)}
                  />
                  <input
                    placeholder="Answer"
                    value={faq.answer}
                    onChange={(event) => updateFaq(index, "answer", event.target.value)}
                  />
                  <button
                    type="button"
                    className="button button--danger"
                    onClick={() => setFaqs((current) => current.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </section>

            <button
              type="button"
              className="button button--secondary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save content"}
            </button>
          </>
        )}

        {notice && <p className="settings-notice">{notice}</p>}
        {error && (
          <p className="settings-error" role="alert">
            {error}
          </p>
        )}
      </main>
    </DashboardLayout>
  );
};

export default DashboardContent;
