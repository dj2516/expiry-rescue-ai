# Expiry Rescue AI (किराना एक्सपायरी रेस्क्यू)
> **AI for Business & Commerce — Hackathon MVP**  
> Built for small Indian kirana stores and local grocery retailers to eliminate expiry-related losses through deterministic financial forecasting and AI-guided rescue actions.

---

## 📌 Executive Summary

Small grocery retailers in India lose ₹15,000–₹50,000 monthly due to expired dairy, bread, and packaged foods. Traditional ERP software is too expensive, complex, or assumes Western multi-warehouse logistics. 

**Expiry Rescue AI** delivers:
1. **Deterministic Financial Engine:** 100% verified arithmetic calculating runway selling days, expected sales, and purchase-cost exposure. Never hallucinates numbers.
2. **Three-Way Strategy Arbitration:** Compares **Clearance Markdown** vs. **Partner Transfer** vs. **No Action (Status Quo)** to recommend the optimal net financial outcome.
3. **Kirana Realities Built-In:**
   - **No Expiry Protection:** Staple items like Tata Salt, pulses, and rice are never falsely flagged as expiring or discounted.
   - **Indian Rupee (₹) & DD/MM/YYYY formatting.**
   - **Single-Store Logic:** Never invents fake partner branches; transfer is disabled unless an actual partner store is configured.
4. **Three Strict Data Modes:**
   - **Mode A:** Real Shop Data via CSV upload.
   - **Mode B:** Public Dataset with honest source attribution.
   - **Mode C:** Synthetic Demo Data with permanent visible disclaimer: `"DEMO DATA — SYNTHETIC, NOT REAL SHOP RECORDS"`.
5. **Interactive Kirana AI Assistant:** Answers core storekeeper questions with zero arithmetic hallucinations.

---

## 🚀 Quick Start (Local Run)

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (verifies 10 core constraints)
node test-kirana-workflow.js

# 3. Start local dev server
npm run dev
```

Visit: `http://localhost:5173/`

---

## 🧮 Mathematical Forecasting & Decision Engine

### 1. Selling Runway
$$\text{Days Remaining} = \text{Expiry Date} - \text{Current Date}$$
*If item has no manufacturer expiry (e.g. Tata Salt), runway is $\text{null}$ and risk is `'No Expiry'`.*

### 2. Expected Sales Before Expiry
$$\text{Expected Sales} = \min(\text{Stock}, \lfloor \text{Daily Demand} \times \max(0, \text{Days}) \rfloor)$$

### 3. Projected Leftover & Cost Exposure
$$\text{Leftover Units} = \max(0, \text{Stock} - \text{Expected Sales})$$
$$\text{Purchase Cost Exposure} = \text{Leftover Units} \times \text{Unit Cost Price (₹)}$$

### 4. Rescue Strategy Arbitration
- **Strategy A: Clearance Markdown**  
  Applies price elasticity uplift ($1.6\times$ to $3.5\times$ velocity surge) at $15\%\text{--}50\%$ discount.
- **Strategy B: Partner Transfer**  
  Only eligible if partner branch exists, runway $\ge 2$ days, and quantity $\ge 5$. Subtracts auto-rickshaw fare (₹40 flat + ₹1.50/unit) to preserve full retail MRP.
- **Strategy C: No Action**  
  Measures baseline product write-off and disposal loss.

---

## 🎙️ 3-Minute Hackathon Demo Script

- **Minute 0:00 – The Hook & Kirana Problem**  
  *"Judges, every evening thousands of Indian kirana storekeepers discard unsold milk and bread. Meet Ramesh Gupta in Sector 14. He loses thousands of rupees because he doesn't know which batch will spoil before it sells, or whether to mark it down or move it to his brother's station shop."*

- **Minute 0:45 – Honest Data Integrity & Tata Salt**  
  *"Notice our top banner: We are in Mode C (Synthetic Demo) with permanent disclaimers. Look at row 11 in Inventory: Tata Salt Vacuum Evaporated. Pure mineral salt never expires. Our engine marks it 'No Expiry (N/A)'. We never invent fake expiry dates or force unnecessary markdowns."*

- **Minute 1:30 – The Decision Engine in Action**  
  *"Navigate to 'Rescue Decisions'. For Amul Taaza Milk (1 day left), the engine recommends a 30% Clearance Markdown, saving +₹280.00 vs. letting it spoil. For Mother Dairy Paneer, an auto-rickshaw transfer to the Station Road branch wins because high footfall preserves the full ₹95 MRP."*

- **Minute 2:15 – Kirana AI Assistant Grounding**  
  *"Click 'Ask AI'. Let's ask: 'Which 3 items should I discount today?' The assistant responds immediately with Amul Milk and Britannia Bread clearance prices and expected savings. Every number is grounded in our calculation engine—zero hallucinations."*

- **Minute 2:45 – Real Shop CSV Mode (Mode A)**  
  *"Click 'Import CSV'. Upload your shop's billing spreadsheet or click 'Load Sample CSV'. In 1 second, the entire dashboard and risk engine re-evaluates for your real store."*

---

## 💡 5 Tough Judge Q&A Preparations

### Q1: *"Why shouldn't a shopkeeper just use ChatGPT directly instead of your app?"*
> **Answer:** *"LLMs are notoriously bad at arithmetic, hallocinate financial margins, and have no live connection to batch inventory records. In our architecture, the deterministic TypeScript engine does 100% of the mathematical calculations. The AI assistant merely explains the verified numbers. If you ask our app how much you save by discounting Amul Milk by 20%, it calculates the exact formula against remaining selling days rather than guessing."*

### Q2: *"How do you handle items without expiry dates like salt or loose lentils?"*
> **Answer:** *"This was a critical design choice. Non-perishable staple goods (Tata Salt, Daawat Basmati Rice) have no batch expiry. Unlike generic systems that invent arbitrary dates, our engine checks `hasExpiryDate`. If absent, it assigns the `'No Expiry'` status with ₹0.00 waste liability. This prevents shopkeepers from making panic discounts on stock that will sell naturally at full price."*

### Q3: *"Kirana stores don't have multiple branches. Why do you have a transfer option?"*
> **Answer:** *"We enforce strict single-store constraints. The transfer strategy is only active IF the shopkeeper configures a partner store (like a family member's branch or partner grocer). In a single-store setup, the transfer option is automatically flagged as 'Ineligible: Single kirana store' and only local clearance discounts are recommended."*

### Q4: *"What if the shopkeeper has no historical sales data?"*
> **Answer:** *"Kirana stores often lack POS billing history. Our engine supports a two-tier fallback: first, the shopkeeper can enter their own estimated daily sales pace; if that is also absent, the engine falls back to transparent category baselines (e.g. 6 units/day for dairy, 5 for bakery) and visibly tags the recommendation with high uncertainty so the owner knows an assumption was made."*

### Q5: *"Is synthetic data being presented as real?"*
> **Answer:** *"Absolutely not. We maintain three isolated data modes. When demo data is loaded, a permanent amber disclaimer banner explicitly states 'DEMO DATA — SYNTHETIC, NOT REAL SHOP RECORDS'. Users can switch to Mode A (Real Shop Data) via CSV import or Mode B (Public Dataset with source attribution) anytime."*

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **State & Storage:** LocalStorage Persistence (zero external DB dependencies)
- **Engine:** Pure TypeScript Deterministic Forecasting & Optimization
- **Security:** Secret keys are never exposed in frontend code; transparent rule-based assistant fallback operates offline.
