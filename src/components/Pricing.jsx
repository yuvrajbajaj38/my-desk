import './Pricing.css';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// यहाँ हमने onCheckout और onOpenAuth props ऐड कर दिए हैं
const Pricing = ({ onCheckout, onOpenAuth }) => {
  const [config, setConfig] = useState({ freeSignupCredits: 50, proPriceInr: 159, proMonthlyCredits: 1000, boosterPriceInr: 49, boosterCredits: 300 });
  useEffect(() => { getDoc(doc(db, 'creditConfig', 'default')).then(s => { if (s.exists()) setConfig(v => ({ ...v, ...s.data() })); }).catch(() => {}); }, []);
  return (
    <div className="pricing-section">
      <div className="pricing-header">
        <h2>Simple, Transparent <span className="highlight-blue">Pricing</span></h2>
        <p>Affordable AI power for every JEE & NEET aspirant.</p>
      </div>

      <div className="pricing-cards">
        
        {/* 1. Starter Plan */}
        <div className="pricing-card">
          <h3>Starter</h3>
          <div className="price">
            <span className="currency">₹</span>0<span className="duration">/lifetime</span>
          </div>
          <p className="plan-desc">Experience the magic of RankWorld AI.</p>
          
          <ul className="plan-features">
            <li>✅ <span className="highlight-blue">{config.freeSignupCredits} AI Credits</span> (One-time; one free trial per device)</li>
            <li>✅ Create up to 3 Full Mock Tests</li>
            <li>✅ Basic Rank Prediction</li>
            <li className="disabled">❌ Detailed AI Solutions</li>
            <li className="disabled">❌ Jarvis Doubt Solver</li>
          </ul>
          
          {/* यहाँ क्लिक करने पर Login पेज खुलेगा */}
          <button className="btn-secondary w-100" onClick={onOpenAuth}>Sign Up Free</button>
        </div>

        {/* 2. RankWorld Pro (Most Popular) */}
        <div className="pricing-card popular">
          <div className="popular-badge">🔥 Most Popular</div>
          <h3>RankWorld Pro</h3>
          <div className="price">
            <span className="currency">₹</span>{config.proPriceInr}<span className="duration">/month</span>
          </div>
          <p className="plan-desc">Everything you need to crack the exam.</p>
          
          <ul className="plan-features">
            <li>✅ <span className="highlight-blue">{config.proMonthlyCredits} AI Credits</span> / month</li>
            <li>✅ ~100 Full Tests or PDF Notes</li>
            <li>✅ Detailed AI Step-by-Step Solutions</li>
            <li>✅ Deep Weak Topic Analyzer</li>
            <li>✅ 24/7 Jarvis AI Assistant</li>
          </ul>
          
          {/* यहाँ क्लिक करने पर Checkout पेज (Pro Plan) खुलेगा */}
          <button className="btn-primary w-100 glow-button" onClick={() => onCheckout('pro')}>Get Pro Access</button>
        </div>

        {/* 3. Credit Booster */}
        <div className="pricing-card">
          <h3>Credit Booster</h3>
          <div className="price">
            <span className="currency">₹</span>{config.boosterPriceInr}<span className="duration">/pack</span>
          </div>
          <p className="plan-desc">Ran out of credits? Top-up instantly.</p>
          
          <ul className="plan-features">
            <li>✅ <span className="highlight-blue">{config.boosterCredits} Extra AI Credits</span></li>
            <li>✅ Never expires (Carry forward)</li>
            <li>✅ Instant account update</li>
            <li>✅ Buy as many times as you want</li>
            <li>✅ Perfect for heavy users</li>
          </ul>
          
          {/* यहाँ क्लिक करने पर Checkout पेज (Booster Plan) खुलेगा */}
          <button className="btn-secondary w-100" onClick={() => onCheckout('booster')}>Buy Extra Credits</button>
        </div>

      </div>
    </div>
  );
}

export default Pricing;