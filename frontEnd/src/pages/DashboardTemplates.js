import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../components/dashboard/DashboardLayout.js";
import {
  applyTemplate,
  generateTemplate,
  getGenerationLimit,
  getTemplates,
} from "../services/templateService.js";

import "../styles/dashboard-templates.css";

const categories = ["all", "minimal", "bold", "elegant", "playful", "corporate", "custom"];

const DashboardTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [category, setCategory] = useState("all");
  const [description, setDescription] = useState("");
  const [generationCategory, setGenerationCategory] = useState("custom");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [generation, setGeneration] = useState({ limit: 3, used: 0, remaining: 3 });

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const [templatesData, generationData] = await Promise.all([
          getTemplates(),
          getGenerationLimit(),
        ]);
        const loadedTemplates = templatesData.templates || templatesData || [];
        setTemplates(loadedTemplates);
        setGeneration(generationData);
        if (loadedTemplates.length > 0) {
          setSelectedTemplate(loadedTemplates[0]);
        }
      } catch (requestError) {
        setError(requestError.message || "Unable to load templates");
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    if (category === "all") return templates;
    return templates.filter((template) => template.category === category);
  }, [category, templates]);

  const handleGenerate = async (event) => {
    event.preventDefault();

    if (description.trim().length < 10) {
      setError("Describe your store in at least 10 characters.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setNotice("");
      const data = await generateTemplate(description.trim(), generationCategory);
      const generatedTemplate = data.template;
      setTemplates((currentTemplates) => [generatedTemplate, ...currentTemplates]);
      setSelectedTemplate(generatedTemplate);
      setGeneration(data.generation);
      setDescription("");
      setNotice("Your AI template is ready to preview.");
    } catch (requestError) {
      setError(requestError.message || "Unable to generate a template");
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!selectedTemplate?._id) return;

    try {
      setApplying(true);
      setError("");
      setNotice("");
      await applyTemplate(selectedTemplate._id);
      setNotice(`${selectedTemplate.displayName || "Template"} is now applied to your store.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to apply this template");
    } finally {
      setApplying(false);
    }
  };

  const config = selectedTemplate?.config;

  return (
    <DashboardLayout>
      <main className="dashboard-templates">
        <section className="templates-hero">
          <div>
            <p className="eyebrow">Store design studio</p>
            <h1>Shape the storefront around your brand.</h1>
            <p className="templates-hero__description">
              Start with a proven layout or describe the atmosphere you want and let AI draft the direction.
            </p>
          </div>
          <div className="templates-hero__mark" aria-hidden="true">✦</div>
        </section>

        {error && <p className="form-message form-message--error" role="alert">{error}</p>}
        {notice && <p className="form-message form-message--success" role="status">{notice}</p>}

        <section className="template-studio">
          <div className="template-library">
            <div className="template-library__header">
              <div>
                <p className="eyebrow">Library</p>
                <h2>Find your starting point</h2>
              </div>
              <span>{filteredTemplates.length} styles</span>
            </div>

            <div className="template-filters" aria-label="Template categories">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={category === item ? "template-filter template-filter--active" : "template-filter"}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="template-empty">Loading the template library...</p>
            ) : filteredTemplates.length === 0 ? (
              <p className="template-empty">No templates in this category yet.</p>
            ) : (
              <div className="template-grid">
                {filteredTemplates.map((template) => (
                  <button
                    key={template._id || template.name}
                    type="button"
                    className={selectedTemplate?._id === template._id ? "template-card template-card--selected" : "template-card"}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div
                      className="template-card__swatch"
                      style={{
                        "--template-primary": template.config?.colors?.primary || "#24342d",
                        "--template-background": template.config?.colors?.background || "#f7f8f5",
                        "--template-accent": template.config?.colors?.accent || "#b4774b",
                      }}
                    >
                      <span>{template.config?.layout || "grid"}</span>
                      <strong>{template.config?.fonts?.heading || "Inter"}</strong>
                    </div>
                    <div className="template-card__body">
                      <span className="template-card__category">{template.category}</span>
                      <strong>{template.displayName || template.name}</strong>
                      <small>{template.isAIGenerated ? "AI generated" : template.description}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <form className="ai-template-form" onSubmit={handleGenerate}>
              <div className="ai-template-form__heading">
                <span className="ai-template-form__icon" aria-hidden="true">✦</span>
                <div>
                  <p className="eyebrow">AI direction</p>
                  <h2>Describe the feeling</h2>
                </div>
              </div>
              <p className="ai-template-form__quota">
                <strong>{generation.remaining}</strong> of {generation.limit} AI directions remaining this session
              </p>
              <label htmlFor="template-description">What should your store feel like?</label>
              <textarea
                id="template-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A quiet, editorial ceramics studio with warm neutrals and generous whitespace..."
                minLength={10}
                rows={4}
              />
              <div className="ai-template-form__footer">
                <select value={generationCategory} onChange={(event) => setGenerationCategory(event.target.value)} aria-label="AI template category">
                  {categories.filter((item) => item !== "all").map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <button type="submit" className="button button--primary" disabled={generating || generation.remaining === 0}>
                  {generating ? "Generating..." : generation.remaining === 0 ? "Session limit reached" : "Generate with AI"}
                </button>
              </div>
            </form>
          </div>

          <aside className="template-preview" aria-label="Selected template preview">
            <div className="template-preview__topline">
              <span>Live direction</span>
              <span className="template-preview__dot" aria-hidden="true" />
            </div>
            {selectedTemplate ? (
              <>
                <div
                  className="template-preview__canvas"
                  style={{
                    "--preview-primary": config?.colors?.primary || "#24342d",
                    "--preview-background": config?.colors?.background || "#f7f8f5",
                    "--preview-accent": config?.colors?.accent || "#b4774b",
                    "--preview-text": config?.colors?.text || "#24342d",
                  }}
                >
                  <div className="preview-nav"><strong>{selectedTemplate.displayName || "Your Store"}</strong><span>Shop&nbsp;&nbsp;About&nbsp;&nbsp;Journal</span></div>
                  <div className="preview-hero">
                    <span>New season</span>
                    <h2>Objects with a point of view.</h2>
                    <button type="button" onClick={handleApply} disabled={applying}>Apply this style</button>
                  </div>
                  <div className="preview-products"><span /><span /><span /></div>
                </div>
                <div className="template-preview__details">
                  <div>
                    <p className="eyebrow">Selected style</p>
                    <h2>{selectedTemplate.displayName || selectedTemplate.name}</h2>
                    <p>{selectedTemplate.description || "A considered starting point for your storefront."}</p>
                  </div>
                  <div className="template-specs">
                    <span><small>Layout</small><strong>{config?.layout || "grid"}</strong></span>
                    <span><small>Heading</small><strong>{config?.fonts?.heading || "Inter"}</strong></span>
                    <span><small>Accent</small><strong>{config?.colors?.accent || "Default"}</strong></span>
                  </div>
                  <button type="button" className="button button--primary template-apply-button" onClick={handleApply} disabled={applying}>
                    {applying ? "Applying..." : "Apply to storefront"}
                  </button>
                  <Link to="/store-preview" className="template-preview-link">Open storefront preview</Link>
                </div>
              </>
            ) : (
              <div className="template-empty template-empty--preview">Select a template to see its direction.</div>
            )}
          </aside>
        </section>
      </main>
    </DashboardLayout>
  );
};

export default DashboardTemplates;
