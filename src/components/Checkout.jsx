import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import './Checkout.css';
import { createPaymentOrder, getPaymentConfig } from '../services/paymentService';

const Checkout = ({ plan, onBack }) => {
  const isPro = plan === 'pro';
  const [pricing, setPricing] = useState({ proPriceInr: 159, proMonthlyCredits: 1000, boosterPriceInr: 49, boosterCredits: 300 });
  useEffect(() => { getDoc(doc(db, 'creditConfig', 'default')).then(s => { if (s.exists()) setPricing(v => ({ ...v, ...s.data() })); }).catch(() => {}); }, []);
  const price = isPro ? pricing.proPriceInr : pricing.boosterPriceInr;
  const credits = isPro ? `${pricing.proMonthlyCredits} AI Credits / month` : `${pricing.boosterCredits} Extra AI Credits`;
  const planName = isPro ? 'RankWorld Pro' : 'Credit Booster';
  const payment = getPaymentConfig();
  const [message, setMessage] = useState('');

  const handlePayment = async () => {
    setMessage('');
    try {
      const order = await createPaymentOrder(isPro ? 'pro' : 'booster');
      setMessage(`Order created: ${order.orderId}. Complete payment in Razorpay. Credits are added only after the server webhook verifies payment.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="sub-dashboard checkout-dashboard">
      <button className="back-home-tab-btn" onClick={onBack}>← Back to Pricing</button>

      <h2>Secure <span className="highlight-blue">Checkout</span></h2>
      <p>Complete your payment to unlock the power of RankWorld AI.</p>

      <div className="checkout-container">
        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="order-item">
            <span>{planName}</span>
            <span>₹{price}</span>
          </div>
          <div className="order-item details">
            <span>Access:</span>
            <span className="highlight-purple">{credits}</span>
          </div>
          <hr className="divider" />
          <div className="order-total">
            <span>Total Amount</span>
            <span>₹{price}</span>
          </div>
        </div>

        <div className="payment-methods">
          <h3>Select Payment Method</h3>
          <p>Payment is not production-ready. Pricing, packages, and fulfillment are intentionally pending.</p>

          {!payment.configured && (
            <p>Razorpay public key is also not configured in the frontend environment.</p>
          )}

          <button className="pay-btn upi-btn" onClick={handlePayment} disabled>
            <span className="icon">📱</span> Pay via UPI (GPay / PhonePe)
          </button>

          <button className="pay-btn card-btn" onClick={handlePayment} disabled>
            <span className="icon">💳</span> Pay via Card / Netbanking
          </button>

          {message && <p>{message}</p>}
          <p className="secure-badge">Payment fulfillment is disabled until business rules are decided</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
