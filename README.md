# iQ SmartQueue - AI-Powered Customer Prioritization

An intelligent customer queue management system for car dealerships that uses AI to prioritize customers based on their intent and timeline.

## 🚀 Features

- **AI-Powered Scoring**: Calculates customer priority based on intent and timeframe
- **K-Nearest Neighbors Optimization**: Prevents clustering of similar high-priority customers
- **Real-time Queue Display**: Live updates with sorting and filtering options
- **Time-based Decay**: Priority scores adjust based on wait time
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 18 with Tailwind CSS
- **Icons**: Heroicons
- **State Management**: React Hooks
- **Styling**: Tailwind CSS with custom animations

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd iq-smartqueue
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 How It Works

### Customer Onboarding Flow

1. **Name Collection**: Customer enters their full name
2. **Visit Reason**: Free-text description of their visit
3. **Intent Classification**: Select primary reason (purchase, trade-in, service, etc.)
4. **Timeline Selection**: Choose preferred timeframe (today, this week, etc.)

### Scoring Algorithm

The system calculates priority scores using weighted factors:

- **Intent Weights**:

  - Purchase: 1.0
  - Trade-in: 0.8
  - Service: 0.6
  - Browsing: 0.2
  - Other: 0.1

- **Timeframe Weights**:
  - Today: 1.0
  - This week: 0.7
  - This month: 0.4
  - No rush: 0.2

### K-Nearest Neighbors Optimization

To prevent clustering of similar high-priority customers:

1. Separates customers into priority tiers
2. Interleaves high-priority customers with medium-priority ones
3. Places low-priority customers at the end
4. Ensures fair distribution of attention

## 📊 Queue Display Features

- **Real-time Updates**: Live queue with current wait times
- **Multiple Sort Options**: By score, wait time, or name
- **Priority Filtering**: Filter by priority level
- **Visual Indicators**: Color-coded priority badges and progress bars
- **Statistics Dashboard**: Overview of queue metrics

## 🔧 Customization

### Adding New Intent Types

Edit `src/utils/scoring.js`:

```javascript
const INTENT_WEIGHTS = {
  purchase: 1.0,
  "trade-in": 0.8,
  service: 0.6,
  browsing: 0.2,
  other: 0.1,
  "your-new-intent": 0.9, // Add new intent here
};
```

### Modifying Scoring Weights

Adjust the weights in `src/utils/scoring.js` to match your business priorities.

### Customizing the UI

The interface uses Tailwind CSS classes and can be easily customized by modifying the component files in `src/components/`.

## 🚀 Future Enhancements

- **AI Integration**: Connect to Google Gemini API for natural language processing
- **Database Integration**: Supabase backend for persistent storage
- **Real-time Notifications**: WebSocket integration for live updates
- **Analytics Dashboard**: Detailed reporting and insights
- **Mobile App**: React Native version for tablets and kiosks
- **Salesforce Integration**: Direct integration with CRM systems

## 📝 API Integration (Future)

When ready to integrate with AI and backend services:

```javascript
// Example Gemini API integration
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function analyzeCustomerIntent(customerInput) {
  const result = await model.generateContent(`
    You are a smart queue assistant for a car dealership.
    Analyze this customer input: "${customerInput}"
    
    Return JSON with:
    - intent_type: "purchase" | "trade-in" | "service" | "browsing" | "other"
    - preferred_timeframe: "today" | "this week" | "this month" | "no rush"
  `);

  return JSON.parse(result.response.text());
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@iqsmartqueue.com or create an issue in the repository.

---

**Built with ❤️ for modern car dealerships**
