import './Testimonials.css';

const Testimonials = () => {
  const reviews = [
    {
      id: 1,
      name: "Rahul Verma",
      exam: "JEE Aspirant",
      text: "RankVault के AI मॉक टेस्ट बिल्कुल असली JEE मेन लेवल के हैं! Jarvis AI ने रात 2 बजे भी मेरे मैथ्स के डाउट्स सॉल्व किए। मेरी मॉक टेस्ट में रैंक 15000 से सीधे 4000 आ गई है!",
      stars: "⭐⭐⭐⭐⭐"
    },
    {
      id: 2,
      name: "Neha Sharma",
      exam: "NEET Aspirant",
      text: "मैं हमेशा Physics के न्यूमेरिकल्स में अटक जाती थी, लेकिन इसके 'Weak Topic Analyzer' ने मेरी बहुत मदद की। ₹159 में पूरे महीने के लिए पर्सनल AI ट्यूटर मिलना एक जादू जैसा है!",
      stars: "⭐⭐⭐⭐⭐"
    },
    {
      id: 3,
      name: "Aditya Singh",
      exam: "JEE Advanced Aspirant",
      text: "AI PDF नोट्स बहुत ही क्रिस्प (crisp) और टू-द-पॉइंट हैं। सबसे अच्छी बात ये है कि मैं 5-5 टेस्ट दे सकता हूँ और AI तुरंत मेरी गलतियाँ बता देता है। Best investment ever!",
      stars: "⭐⭐⭐⭐⭐"
    }
  ];

  return (
    <div className="testimonials-section">
      <div className="testi-header">
        <h2 className="testi-title">Trusted by <span className="highlight-blue">Future Toppers</span></h2>
        <p className="testi-subtitle">See how RankWorld AI is transforming JEE & NEET preparation.</p>
      </div>

      <div className="testi-cards">
        {reviews.map((review) => (
          <div key={review.id} className="testi-card">
            <div className="stars">{review.stars}</div>
            <p className="review-text">"{review.text}"</p>
            <div className="student-info">
              <div className="avatar">{review.name.charAt(0)}</div>
              <div>
                <h4 className="student-name">{review.name}</h4>
                <p className="student-exam">{review.exam}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;