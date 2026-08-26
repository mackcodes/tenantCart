import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import "./LandingPage.css";

function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="minimal-landing">
      <header className="site-header">
        <nav className="site-nav">
          <Link to="/" className="site-logo">
            Tenant<span>Cart</span>
          </Link>

          <div className="site-nav-links">
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#how-it-works">Process</a>
          </div>

          <div className="site-nav-actions">
            {user ? (
              <button
                type="button"
                onClick={goToDashboard}
                className="outline-button"
              >
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="text-button">
                  Log in
                </Link>

                <Link to="/register-account" className="dark-button">
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        <section className="minimal-hero">
          <div className="hero-copy">
            <p className="eyebrow">A calmer way to sell online</p>

            <h1>
              Your shop,
              <br />
              <em>beautifully managed.</em>
            </h1>

            <p className="hero-description">
              TenantCart helps independent merchants create a thoughtful online
              store, manage daily operations, and understand their business
              without unnecessary complexity.
            </p>

            <div className="hero-buttons">
              {user ? (
                <button
                  type="button"
                  onClick={goToDashboard}
                  className="dark-button large-button"
                >
                  Open dashboard
                </button>
              ) : (
                <>
                  <Link
                    to="/register-account"
                    className="dark-button large-button"
                  >
                    Create your store
                  </Link>

                  <a href="#about" className="underlined-button">
                    Learn more <span>↓</span>
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="hero-art">
            <div className="art-circle art-circle-large" />
            <div className="art-circle art-circle-small" />

            <div className="store-note">
              <span className="note-label">YOUR STORE</span>
              <h2>Made with care.</h2>
              <p>
                A simple home for the things you make, choose, and believe in.
              </p>
              <span className="note-line" />
              <span className="note-link">Explore collection →</span>
            </div>

            <div className="art-caption">
              <span>01</span>
              <span>Independent commerce</span>
            </div>
          </div>
        </section>

        <section id="about" className="statement-section">
          <div className="section-container statement-grid">
            <p className="section-number">01 / ABOUT</p>

            <div className="statement-content">
              <h2>
                Built for people who care about what they sell.
              </h2>

              <p>
                TenantCart is a multi-tenant commerce platform for independent
                merchants. It gives every store its own identity while keeping
                the complicated parts of selling online in one manageable
                place.
              </p>
            </div>
          </div>
        </section>

        <section id="features" className="features-section">
          <div className="section-container">
            <div className="section-introduction">
              <p className="section-number">02 / FEATURES</p>

              <h2>Everything in its right place.</h2>

              <p>
                The tools you need to run your store, without the noise you
                do not.
              </p>
            </div>

            <div className="minimal-feature-list">
              <MinimalFeature
                number="01"
                title="Your own storefront"
                description="A distinct, branded space for your products, your story, and your customers."
              />

              <MinimalFeature
                number="02"
                title="Simple daily operations"
                description="Keep products, stock, and orders organized from one quiet workspace."
              />

              <MinimalFeature
                number="03"
                title="Clear business insight"
                description="Understand what is working through useful analytics and natural-language questions."
              />

              <MinimalFeature
                number="04"
                title="Room to grow"
                description="Start with the essentials and add payments, automation, and intelligent tools as you grow."
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="process-section">
          <div className="section-container">
            <p className="section-number">03 / PROCESS</p>

            <div className="process-heading">
              <h2>A small beginning can become something lasting.</h2>
            </div>

            <div className="process-list">
              <ProcessStep
                number="01"
                title="Create an account"
                description="Tell us who you are and create your merchant account."
              />

              <ProcessStep
                number="02"
                title="Name your store"
                description="Choose a name and a simple web address for your storefront."
              />

              <ProcessStep
                number="03"
                title="Make it yours"
                description="Add your products, shape your presentation, and begin selling."
              />
            </div>
          </div>
        </section>

        <section className="closing-section">
          <div className="section-container closing-content">
            <p className="eyebrow">Start somewhere</p>

            <h2>
              There is room for your
              <br />
              <em>kind of store.</em>
            </h2>

            {user ? (
              <button
                type="button"
                onClick={goToDashboard}
                className="cream-button"
              >
                Go to dashboard
              </button>
            ) : (
              <Link to="/register-account" className="cream-button">
                Begin your store
              </Link>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-container footer-content">
          <span>TenantCart © {new Date().getFullYear()}</span>

          <div>
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#how-it-works">Process</a>
          </div>

          <span>Made for independent merchants.</span>
        </div>
      </footer>
    </div>
  );
}

function MinimalFeature({ number, title, description }) {
  return (
    <article className="minimal-feature">
      <span className="feature-number">{number}</span>

      <h3>{title}</h3>

      <p>{description}</p>

      <span className="feature-arrow">↗</span>
    </article>
  );
}

function ProcessStep({ number, title, description }) {
  return (
    <article className="process-step">
      <span className="process-number">{number}</span>

      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}

export default LandingPage;
