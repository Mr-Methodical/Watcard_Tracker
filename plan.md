# WatCard Expense Tracker Spec

## Background
We are building a Chrome Extension to scrape the University of Waterloo WatCard transaction history table, and a Next.js dashboard to visualize the spending.

## Phase 1: The Chrome Extension (UPDATED)
1. `manifest.json`: Manifest V3, permissions for `activeTab` and `scripting`, matches `https://secure.touchnet.net/*`.
2. `content.js`: 
   - Handles pagination by clicking the "Next" button and waiting for loads.
   - Parses the "Amount" string. **CRITICAL FIX:** If the raw amount string does NOT contain a minus sign (`-`), it is a deposit. Add a boolean field `isDeposit: true` (or false) to the JSON output. Convert the amount to a positive float.
   - Categorizes the "Terminal" string using an expanded UW dictionary:
     - **Groceries:** "MARKET"
     - **Laundry:** "LAUNDRY", "WES"
     - **Academic:** "PRINT", "BROWSERS"
     - **Dining:** "MUDIES", "BRUBAKERS", "TH-", "TH ", "LIQUID", "TERIYAKI", "SUBWAY", "WILLIAMS", "FRESH", "JUGO", "PITA", "STARBUCKS", "QUESADA", "DC"
     - **Other:** Fallback
3. `popup.html` & `popup.js`: UI to trigger scraping and copy to clipboard.

## Phase 2/3: The Next.js Dashboard (UPDATED)
**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Recharts, `lucide-react`.

**Data Processing Rules:**
- Filter out ANY transaction where `isDeposit === true` before calculating Totals, Averages, or rendering charts. 

**UI Layout & Features:**
1. **Input State:** A `textarea` to paste JSON, with a "Generate" button.
2. **Dashboard State:**
   - **Header:** Title and "Clear Data" button.
   - **Top Cards (Grid of 4):**
     - Total Spent (excluding deposits)
     - Average Transaction
     - **NEW:** Daily Food Pace: Calculate the total spent *only* in "Groceries" and "Dining", divided by the number of unique days present in the dataset. Format as "$X.XX / day".
     - Top Category
   - **Main Content:**
     - **Top row (Visuals):** - Left: The existing Category Pie/Bar Chart.
       - **NEW** Right: A Recharts `LineChart` or `BarChart` showing "Daily Spend Trend". X-axis is the Date (grouped by day), Y-axis is the total amount spent that day.
     - **Bottom row:** The recent activity table (scrollable).
## Phase 4: The Advanced Insights Dashboard (Resume-Worthy UI)
**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Recharts, `lucide-react`.

**Data Processing Rules (CRITICAL):**
1. Filter out `isDeposit === true` for all expense calculations.
2. **Elapsed Days Calculation:** Find the absolute minimum date and maximum date in the dataset. Calculate the total elapsed days between them. Use THIS number for all daily averages, NOT the count of unique active days.
3. **Time of Day Grouping:** Parse the transaction time into 4 buckets: Morning (5am-11am), Lunch (11am-4pm), Dinner (4pm-9pm), Late Night (9pm-5am).

**UI Layout & Sizzle Features (Modern, SaaS-like, visually stunning):**
1. **Header:** Title, total active balance (if determinable from the latest row), and a subtle "Clear Data" button.
2. **The "Hero" KPI Grid (Top):**
   - **Total Spend** (Large font, emphasized).
   - **True Daily Burn Rate:** (Total Spend / Elapsed Days). 
   - **The "Coffee Tax":** Sum of amounts where terminal includes "STARBUCKS", "TH-", "TH ", or "WILLIAMS".
   - **Laundry Cadence:** Calculate the average number of days between transactions categorized as "Laundry". Display as "Every X days".
3. **Main Content - Row 1 (The Big Picture):**
   - **Left:** A beautiful, smooth `AreaChart` (Recharts) showing the Daily Spend Trend over time. Fill it with a subtle gradient.
   - **Right:** A `BarChart` or `PieChart` showing Total Spending by Category.
4. **Main Content - Row 2 (Behavioral Insights):**
   - **Left (Time of Day):** A `RadarChart` or horizontal `BarChart` showing total spending by the Time of Day buckets (Morning, Lunch, Dinner, Late Night).
   - **Right (Top Locations):** A sleek list of the Top 5 specific Terminals where the most money was spent (strip the "POS-FS-" junk from the names for a clean UI).
5. **Bottom:** The raw scrollable transaction table with clean typography and category badges.

## Phase 5: The 10X Predictive Dashboard
**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Recharts, `lucide-react`, `framer-motion` (for animations), `date-fns` (for date math).

**Core System Upgrades:**
1. **Local Storage:** On paste, save the JSON to `localStorage`. On page load, check `localStorage` and auto-hydrate the dashboard so the user doesn't have to re-paste data on refresh.
2. **Predictive Engine:** Add a simple input in the header for the user to type their "Current Balance" (e.g., $500). Use the `Elapsed Days` and `Total Spend` to calculate the True Daily Burn Rate. Divide the Current Balance by the Burn Rate to calculate the "Zero Dollar Date" (Runway).

**UI/UX Layout (SaaS-Grade with Framer Motion):**
- **Animations:** Stagger the entrance of the grid cards and charts using simple Framer Motion variants.
- **Header:** "WatCard Intelligence", Last updated timestamp, a "Clear Data" button, and a "Current Balance" input field.
- **Row 1: The Predictive KPIs (Bento Grid):**
  - Card 1: Total Spend & True Daily Burn Rate.
  - Card 2: **Runway Forecast:** "You have $X left. At your current pace, you will run out of money on [Date]." Change color to red if the date is before the end of the semester.
  - Card 3: The "Coffee Tax" (Starbucks, TH, Williams) & "Junk Food Tax" (Late night dining).
  - Card 4: **Persona Badge:** Evaluate the data and assign a dynamic title (e.g., "The Midnight Snacker" if Late Night spend > 20%, "The Caffeine Addict" if Coffee Tax > $100, etc.).
- **Row 2: Deep Behavioral Analytics:**
  - **Left:** AreaChart for Daily Spend Trend.
  - **Right:** A new RadialBarChart or horizontal BarChart comparing **Weekday vs. Weekend** spending averages.
- **Row 3: Categorization & Locations:**
  - **Left:** Time of Day spend (Morning, Lunch, Dinner, Late Night).
  - **Middle:** Top 5 Locations (Cleaned terminal names).
  - **Right:** Spending by Category (PieChart).
- **Row 4:** The Data Table.