import './Features.css';

const Features = () => {
  // यह आपके 6 फीचर्स का डेटा है 
  const featureData = [
    { icon: "📝", title: "AI Mock Tests", desc: "AI generated mock tests with real exam pattern" },
    { icon: "📄", title: "AI Notes", desc: "Smart, concise and exam oriented notes" },
    { icon: "📉", title: "Weak Topic Analysis", desc: "AI identifies your weak topics and helps you improve" },
    { icon: "🎯", title: "Rank Prediction", desc: "Get accurate rank prediction with AI" },
    { icon: "📊", title: "Smart Analytics", desc: "Detailed insights of your performance" },
    { icon: "📅", title: "Personalized Planner", desc: "Custom study plan tailored for you" }
  ];

  return (
    <div className="features-section">
      <h2 className="features-heading">
        Powerful <span className="highlight-blue">AI</span> features for <br />
        serious <span className="highlight-blue">JEE</span> & <span className="highlight-purple">NEET</span> aspirants
      </h2>
      
      <div className="features-grid">
        {/* यहाँ हम एक ही कार्ड को 6 बार लूप (Loop) चलाकर बना रहे हैं */}
        {featureData.map((feature, index) => (
          <div className="feature-card" key={index}>
            <div className="feature-icon">{feature.icon}</div>
            <div className="feature-content">
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Features;