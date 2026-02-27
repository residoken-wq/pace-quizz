### Agent Prompt: Multiple Choice Component
- **Component:** `MultipleChoiceResult.tsx`
- **Library:** `Recharts` for BarChart, `framer-motion` for layout animations, `lottie-react` for Confetti.
- **Data Structure:** `Array<{ optionId: string, text: string, voteCount: number, isCorrect: boolean }>`
- **Behavior:** Listen to `Socket.io` event `vote-update`. When data changes, the BarChart must animate smoothly (no page reload). If `isCorrect` exists and timer ends, trigger Lottie confetti and dim incorrect bars to opacity 30%.

### Agent Prompt: Word Cloud Component
- **Component:** `WordCloudResult.tsx`
- **Library:** `react-d3-cloud` or custom D3.js implementation.
- **Data Structure:** `Array<{ text: string, frequency: number }>`
- **Behavior:** Backend must sanitize inputs (lowercase, remove accents/spaces if configured). Frontend renders the cloud. Apply `framer-motion` to handle smooth scaling (`scale` prop) when `frequency` increments via WebSockets. Use a corporate color palette (e.g., shades of blue/teal).

### Agent Prompt: Rating Scale Result Component
- **Component:** `RadarChartResult.tsx`
- **Library:** `Recharts` (RadarChart, PolarGrid, PolarAngleAxis).
- **Data Structure:** `Array<{ category: string, averageScore: number, fullMark: number }>`
- **Behavior:** Calculate the mean score for each category dynamically. Draw a semi-transparent filled polygon. Animate the points of the polygon outward from the center when data arrives.

### Agent Prompt: Ranking Result Component
- **Component:** `RankingResult.tsx`
- **Library:** `framer-motion` (using `<AnimatePresence>` and `layout` props on list items).
- **Data Structure:** `Array<{ itemId: string, title: string, rankScore: number }>`
- **Behavior:** Sort array by `rankScore` descending. Render items as horizontal bars. Framer Motion's `layout` prop will automatically calculate transforms and animate the reordering smoothly without complex D3 math.

### Agent Prompt: Q&A Board Component
- **Component:** `QnABoard.tsx`
- **Library:** `Tailwind CSS` for masonry/flex layout, `framer-motion` for sorting animations.
- **Data Structure:** `Array<{ questionId: string, content: string, upvotes: number, isAnswered: boolean }>`
- **Behavior:** Card component must re-order based on `upvotes`. When Presenter clicks "Mark as Answered", apply a fade-out animation or move the card to an "Answered" column. Show a micro-interaction (bump scale) on the heart icon when an upvote event is received.

### Agent Prompt: Live Poll Input Component
- **Component:** `LivePollInput.tsx`
- **Library:** `framer-motion` for input focus animation, `Tailwind CSS` for responsive grid.
- **Data Structure:** `Array<{ optionId: string, text: string }>`
- **Behavior:** This is the participant's input view. It must display options in a grid. When a user clicks an option, the card should animate to a "selected" state (scale up slightly, change border color). The component should emit a `submit-vote` event to the socket with the `optionId` and `sessionId`.

### Agent Prompt: Leaderboard Component
- **Component:** `Leaderboard.tsx`
- **Library:** `framer-motion` for list reordering, `Tailwind CSS` for podium styling.
- **Data Structure:** `Array<{ userId: string, name: string, score: number, rank: number }>`
- **Behavior:** Render the top 3 users with distinct podium styling (Gold/Silver/Bronze). Use `AnimatePresence` to handle users entering or leaving the top 3. The list should be sorted by `rank`.

### Agent Prompt: Quadrant Matrix Component
- **Component:** `QuadrantScatterPlot.tsx`
- **Library:** `Recharts` (ScatterChart) or custom `D3.js`.
- **Data Structure:** `Array<{ userId: string, xValue: number, yValue: number }>`
- **Behavior:** Draw a crosshair axis at the center (0,0). Animate points fading in and moving to their (X,Y) coordinates. Use density clustering (change color opacity if points overlap) to visualize concentration.

### Agent Prompt: Open Ended Response Component
- **Component:** `OpenEndedResult.tsx`
- **Library:** `Tailwind CSS` for card layout, `framer-motion` for reveal animation.
- **Data Structure:** `Array<{ responseId: string, text: string, upvotes: number }>`
- **Behavior:** Display responses in a list. Implement a "Reveal" button for the presenter. When clicked, animate the `text` opacity from 0 to 1 and slide it up slightly. Sort list by `upvotes`.

### Agent Prompt: Rating Scale Input Component
- **Component:** `RatingScaleInput.tsx`
- **Library:** `Tailwind CSS` for slider/grid, `framer-motion` for hover effects.
- **Data Structure:** `Array<{ scaleId: string, label: string, value: number }>`
- **Behavior:** Display a horizontal slider or a grid of numbers (e.g., 1-10). When the user clicks a number, animate the background fill to that value. Emit `submit-rating` event with the score.