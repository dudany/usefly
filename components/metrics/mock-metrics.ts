export type MetricCategory = "conversion" | "engagement" | "agent-behavior" | "activation" | "error-friction"

export type ChartType = "funnel" | "line" | "bar" | "pie" | "area" | "histogram"

export interface ChartConfig {
  type: ChartType
  title: string
  description: string
  whyItMatters: string
}

export interface Metric {
  id: string
  name: string
  description: string
  category: MetricCategory
  eventName: string
  priority: number
  charts: ChartConfig[]
}

export const METRIC_CATEGORIES: Record<MetricCategory, { label: string; color: string }> = {
  conversion: { label: "Conversion", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  engagement: { label: "Engagement", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  "agent-behavior": { label: "Agent Behavior", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  activation: { label: "Activation", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  "error-friction": { label: "Error/Friction", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
}

export const MOCK_METRICS: Metric[] = [
  // CONVERSION METRICS (Priority 1-7)
  {
    id: "purchase-completed",
    name: "Purchase Completed",
    description: "Track successful purchase transactions",
    category: "conversion",
    eventName: "purchase_completed",
    priority: 1,
    charts: [
      {
        type: "funnel",
        title: "Purchase Conversion Funnel",
        description: "Visualize the steps users take from product view to purchase completion",
        whyItMatters: "Identify exactly where users drop off in your purchase flow. Each step's conversion rate reveals friction points that need optimization.",
      },
      {
        type: "line",
        title: "Purchase Trend Over Time",
        description: "Track purchase volume and trends across days",
        whyItMatters: "Understand purchase patterns, identify successful campaigns, and spot anomalies in your conversion rate that need investigation.",
      },
      {
        type: "bar",
        title: "Purchases by User Segment",
        description: "Compare purchase rates across different user personas or locations",
        whyItMatters: "Discover which user segments convert best, allowing you to optimize targeting and personalization strategies for higher ROI.",
      },
    ],
  },
  {
    id: "subscription-purchased",
    name: "Subscription Purchased",
    description: "Track new subscription sign-ups",
    category: "conversion",
    eventName: "subscription_purchased",
    priority: 2,
    charts: [
      {
        type: "line",
        title: "Subscription Growth Over Time",
        description: "Monitor daily subscription acquisition trends",
        whyItMatters: "Track your recurring revenue growth trajectory and identify which marketing efforts drive the most subscription conversions.",
      },
      {
        type: "bar",
        title: "Subscriptions by Plan Type",
        description: "Compare subscription volume across different pricing tiers",
        whyItMatters: "Understand which plans resonate with users to optimize pricing strategy and product packaging for maximum revenue.",
      },
    ],
  },
  {
    id: "add-to-cart",
    name: "Add to Cart",
    description: "Track when users add items to their shopping cart",
    category: "conversion",
    eventName: "add_to_cart",
    priority: 3,
    charts: [
      {
        type: "funnel",
        title: "Cart to Purchase Funnel",
        description: "Track the journey from add to cart through checkout completion",
        whyItMatters: "Measure cart abandonment rate and identify where users hesitate. A 1% improvement in cart conversion can significantly impact revenue.",
      },
      {
        type: "line",
        title: "Add to Cart Rate Trend",
        description: "Monitor how often users add products to cart over time",
        whyItMatters: "Correlate cart additions with product changes, pricing adjustments, and marketing campaigns to understand what drives purchase intent.",
      },
    ],
  },
  {
    id: "checkout-started",
    name: "Checkout Started",
    description: "Track when users begin the checkout process",
    category: "conversion",
    eventName: "checkout_started",
    priority: 4,
    charts: [
      {
        type: "funnel",
        title: "Checkout Completion Funnel",
        description: "Visualize checkout flow from start to completion",
        whyItMatters: "Checkout abandonment costs businesses billions annually. This funnel shows exactly which checkout step loses the most customers.",
      },
      {
        type: "bar",
        title: "Checkout Drop-off by Step",
        description: "Compare abandonment rates at each checkout stage",
        whyItMatters: "Prioritize which checkout steps need UX improvements to maximize completion rate and revenue.",
      },
    ],
  },
  {
    id: "form-submitted",
    name: "Form Submitted",
    description: "Track successful form submissions (leads, contact, etc.)",
    category: "conversion",
    eventName: "form_submitted",
    priority: 5,
    charts: [
      {
        type: "line",
        title: "Form Submission Rate Over Time",
        description: "Monitor form completion trends",
        whyItMatters: "Forms are critical conversion points. Track how form changes and A/B tests impact submission rates.",
      },
      {
        type: "bar",
        title: "Submissions by Form Type",
        description: "Compare performance across different forms",
        whyItMatters: "Identify which forms convert best and which need redesign to reduce friction and increase lead generation.",
      },
    ],
  },
  {
    id: "trial-started",
    name: "Trial Started",
    description: "Track when users begin a free trial",
    category: "conversion",
    eventName: "trial_started",
    priority: 6,
    charts: [
      {
        type: "line",
        title: "Trial Starts Over Time",
        description: "Monitor trial sign-up trends",
        whyItMatters: "Trial starts are a leading indicator of future revenue. Track how acquisition efforts impact trial volume.",
      },
      {
        type: "funnel",
        title: "Trial to Paid Conversion",
        description: "Track the journey from trial start to paid subscription",
        whyItMatters: "This is your product's ultimate test. A low trial-to-paid rate indicates product-market fit issues or onboarding problems.",
      },
    ],
  },
  {
    id: "account-created",
    name: "Account Created",
    description: "Track new user account registrations",
    category: "conversion",
    eventName: "account_created",
    priority: 7,
    charts: [
      {
        type: "line",
        title: "User Registration Trend",
        description: "Monitor daily account creation volume",
        whyItMatters: "Track user acquisition effectiveness and identify growth trends or potential issues in your signup flow.",
      },
      {
        type: "bar",
        title: "Registrations by Source",
        description: "Compare account creation across traffic sources",
        whyItMatters: "Understand which acquisition channels drive the highest quality signups to optimize marketing spend.",
      },
    ],
  },

  // ENGAGEMENT METRICS (Priority 8-14)
  {
    id: "page-viewed",
    name: "Page Viewed",
    description: "Track page view events across the site",
    category: "engagement",
    eventName: "page_viewed",
    priority: 8,
    charts: [
      {
        type: "line",
        title: "Page Views Over Time",
        description: "Monitor overall traffic trends",
        whyItMatters: "Page views are the foundation of digital engagement. Sudden drops indicate technical issues or SEO problems.",
      },
      {
        type: "bar",
        title: "Top Pages by Views",
        description: "Identify most visited pages",
        whyItMatters: "Double down on content that attracts users and improve or remove low-traffic pages to streamline your site.",
      },
    ],
  },
  {
    id: "scrolled-to-bottom",
    name: "Scrolled to Bottom",
    description: "Track when users scroll to the bottom of a page",
    category: "engagement",
    eventName: "scrolled_to_bottom",
    priority: 9,
    charts: [
      {
        type: "bar",
        title: "Scroll Completion by Page",
        description: "Compare scroll-through rates across different pages",
        whyItMatters: "High scroll-through rates indicate engaging content. Low rates suggest users aren't finding what they need or content is too long.",
      },
      {
        type: "histogram",
        title: "Scroll Depth Distribution",
        description: "Visualize how far users typically scroll",
        whyItMatters: "Place important CTAs and content where users actually scroll. Don't bury key information below the fold if users aren't scrolling.",
      },
    ],
  },
  {
    id: "video-played",
    name: "Video Played",
    description: "Track video playback initiation",
    category: "engagement",
    eventName: "video_played",
    priority: 10,
    charts: [
      {
        type: "line",
        title: "Video Plays Over Time",
        description: "Monitor video engagement trends",
        whyItMatters: "Video content is expensive to produce. Track plays to understand ROI and which videos resonate with your audience.",
      },
      {
        type: "bar",
        title: "Play Rate by Video",
        description: "Compare engagement across different videos",
        whyItMatters: "Identify top-performing video content to inform your content strategy and improve low-performing videos.",
      },
    ],
  },
  {
    id: "content-shared",
    name: "Content Shared",
    description: "Track when users share content on social media",
    category: "engagement",
    eventName: "content_shared",
    priority: 11,
    charts: [
      {
        type: "bar",
        title: "Shares by Content Type",
        description: "Compare share rates across different content",
        whyItMatters: "Shares amplify your reach organically. Understand what content users value enough to share with their network.",
      },
      {
        type: "line",
        title: "Share Trend Over Time",
        description: "Monitor social sharing activity",
        whyItMatters: "Track whether your content is becoming more shareable and identify viral moments to replicate success.",
      },
    ],
  },
  {
    id: "cta-clicked",
    name: "CTA Clicked",
    description: "Track clicks on call-to-action buttons",
    category: "engagement",
    eventName: "cta_clicked",
    priority: 12,
    charts: [
      {
        type: "bar",
        title: "Click Rate by CTA",
        description: "Compare performance of different CTAs",
        whyItMatters: "CTAs drive conversions. Low click rates indicate poor copy, design, or placement that needs optimization.",
      },
      {
        type: "line",
        title: "CTA Engagement Over Time",
        description: "Monitor CTA effectiveness trends",
        whyItMatters: "Track how A/B tests and design changes impact CTA performance to continuously improve conversion rates.",
      },
    ],
  },
  {
    id: "feature-used",
    name: "Feature Used",
    description: "Track engagement with specific product features",
    category: "engagement",
    eventName: "feature_used",
    priority: 13,
    charts: [
      {
        type: "bar",
        title: "Feature Adoption by Type",
        description: "Compare usage across different features",
        whyItMatters: "Understand which features provide value and which go unused. Prioritize improving adopted features and fix or remove unused ones.",
      },
      {
        type: "line",
        title: "Feature Usage Trend",
        description: "Monitor feature engagement over time",
        whyItMatters: "Track whether new features gain traction or fade. Early adoption trends predict long-term feature success.",
      },
    ],
  },
  {
    id: "session-duration",
    name: "Session Duration",
    description: "Measure how long users spend in a session",
    category: "engagement",
    eventName: "session_duration",
    priority: 14,
    charts: [
      {
        type: "line",
        title: "Average Session Duration Trend",
        description: "Track session length over time",
        whyItMatters: "Longer sessions often correlate with higher engagement and conversion. Declining session duration signals problems.",
      },
      {
        type: "histogram",
        title: "Session Duration Distribution",
        description: "Visualize the range of session lengths",
        whyItMatters: "Understand typical user behavior. Very short sessions may indicate bounce issues; very long ones suggest strong engagement.",
      },
    ],
  },

  // AGENT BEHAVIOR METRICS (Priority 15-21)
  {
    id: "agent-task-completed",
    name: "Agent Task Completed",
    description: "Track successful completion of agent tasks",
    category: "agent-behavior",
    eventName: "agent_task_completed",
    priority: 15,
    charts: [
      {
        type: "line",
        title: "Task Success Rate Over Time",
        description: "Monitor agent task completion trends",
        whyItMatters: "This is your primary UX health metric for agentic experiences. Declining success rates indicate UX issues blocking agents.",
      },
      {
        type: "bar",
        title: "Success Rate by Task Type",
        description: "Compare completion rates across different agent tasks",
        whyItMatters: "Identify which tasks are agent-friendly and which need UX improvements to increase automation success.",
      },
      {
        type: "histogram",
        title: "Task Duration Distribution",
        description: "Visualize how long tasks take to complete",
        whyItMatters: "Understand task complexity. Long durations may indicate confusing flows that need simplification for both agents and humans.",
      },
    ],
  },
  {
    id: "agent-error-encountered",
    name: "Agent Error Encountered",
    description: "Track errors and failures experienced by agents",
    category: "agent-behavior",
    eventName: "agent_error_encountered",
    priority: 16,
    charts: [
      {
        type: "bar",
        title: "Error Rate by Type",
        description: "Compare frequency of different error types",
        whyItMatters: "Prioritize fixing the most common errors first. Each error represents both agent and human user frustration.",
      },
      {
        type: "line",
        title: "Error Rate Trend",
        description: "Monitor error frequency over time",
        whyItMatters: "Track whether UX improvements reduce errors. Increasing error rates signal regressions that need immediate attention.",
      },
    ],
  },
  {
    id: "agent-navigation-path",
    name: "Agent Navigation Path",
    description: "Track the navigation paths agents take through the site",
    category: "agent-behavior",
    eventName: "agent_navigation_path",
    priority: 17,
    charts: [
      {
        type: "funnel",
        title: "Common Navigation Paths",
        description: "Visualize the most frequent agent navigation sequences",
        whyItMatters: "Understand how agents navigate your site. Unexpected paths reveal UX issues or missing shortcuts.",
      },
      {
        type: "bar",
        title: "Path Length Distribution",
        description: "Compare the number of steps agents take",
        whyItMatters: "Shorter paths indicate better UX. Long paths to common goals suggest you need to streamline navigation.",
      },
    ],
  },
  {
    id: "agent-form-fill-success",
    name: "Agent Form Fill Success",
    description: "Track successful form completions by agents",
    category: "agent-behavior",
    eventName: "agent_form_fill_success",
    priority: 18,
    charts: [
      {
        type: "bar",
        title: "Form Success Rate by Type",
        description: "Compare agent success across different forms",
        whyItMatters: "Forms with low agent success rates likely have accessibility issues, poor labeling, or complex validation.",
      },
      {
        type: "line",
        title: "Form Success Trend",
        description: "Monitor form completion success over time",
        whyItMatters: "Track the impact of form improvements. Rising success rates validate your UX changes.",
      },
    ],
  },
  {
    id: "agent-button-click",
    name: "Agent Button Click",
    description: "Track button interactions by agents",
    category: "agent-behavior",
    eventName: "agent_button_click",
    priority: 19,
    charts: [
      {
        type: "bar",
        title: "Click Rate by Button",
        description: "Compare agent interaction rates across buttons",
        whyItMatters: "Buttons agents can't find or click indicate poor semantic HTML, missing labels, or confusing UI that affects all users.",
      },
    ],
  },
  {
    id: "agent-timeout",
    name: "Agent Timeout",
    description: "Track when agents exceed time limits on tasks",
    category: "agent-behavior",
    eventName: "agent_timeout",
    priority: 20,
    charts: [
      {
        type: "bar",
        title: "Timeout Rate by Task",
        description: "Compare timeout frequency across different tasks",
        whyItMatters: "Timeouts indicate tasks that are too complex or slow. These likely frustrate human users too.",
      },
      {
        type: "line",
        title: "Timeout Rate Trend",
        description: "Monitor timeout frequency over time",
        whyItMatters: "Increasing timeouts may indicate performance degradation or new UX complexity that needs addressing.",
      },
    ],
  },
  {
    id: "agent-abandoned-task",
    name: "Agent Abandoned Task",
    description: "Track when agents abandon tasks before completion",
    category: "agent-behavior",
    eventName: "agent_abandoned_task",
    priority: 21,
    charts: [
      {
        type: "bar",
        title: "Abandonment Rate by Task",
        description: "Compare abandonment across different tasks",
        whyItMatters: "High abandonment rates reveal broken flows or insurmountable UX barriers that prevent completion.",
      },
      {
        type: "funnel",
        title: "Abandonment Points in Flow",
        description: "Identify where in the flow agents give up",
        whyItMatters: "Pinpoint the exact step causing abandonment to focus your UX improvements where they matter most.",
      },
    ],
  },

  // ACTIVATION METRICS (Priority 22-24)
  {
    id: "first-action-completed",
    name: "First Action Completed",
    description: "Track when new users complete their first meaningful action",
    category: "activation",
    eventName: "first_action_completed",
    priority: 22,
    charts: [
      {
        type: "line",
        title: "Activation Rate Over Time",
        description: "Monitor what percentage of new users activate",
        whyItMatters: "Activated users are far more likely to retain. A low activation rate means your onboarding isn't driving users to value.",
      },
      {
        type: "histogram",
        title: "Time to First Action",
        description: "Visualize how long it takes users to activate",
        whyItMatters: "Faster activation predicts better retention. Long time-to-activation suggests onboarding friction.",
      },
    ],
  },
  {
    id: "onboarding-completed",
    name: "Onboarding Completed",
    description: "Track completion of onboarding flow",
    category: "activation",
    eventName: "onboarding_completed",
    priority: 23,
    charts: [
      {
        type: "funnel",
        title: "Onboarding Completion Funnel",
        description: "Visualize drop-off at each onboarding step",
        whyItMatters: "Onboarding sets the tone for the entire user relationship. High drop-off rates indicate where to simplify.",
      },
      {
        type: "line",
        title: "Completion Rate Trend",
        description: "Monitor onboarding success over time",
        whyItMatters: "Track the impact of onboarding improvements and identify whether new user quality is changing.",
      },
    ],
  },
  {
    id: "return-visit",
    name: "Return Visit",
    description: "Track when users come back after their first session",
    category: "activation",
    eventName: "return_visit",
    priority: 24,
    charts: [
      {
        type: "line",
        title: "Return Rate Over Time",
        description: "Monitor what percentage of users come back",
        whyItMatters: "Return visits are a leading indicator of retention. Users who don't return never experienced your product's value.",
      },
      {
        type: "bar",
        title: "Return Rate by Cohort",
        description: "Compare return rates across different user groups",
        whyItMatters: "Understand which user segments find value and which need better onboarding or feature education.",
      },
    ],
  },

  // ERROR/FRICTION METRICS (Priority 25-27)
  {
    id: "error-occurred",
    name: "Error Occurred",
    description: "Track application errors experienced by users",
    category: "error-friction",
    eventName: "error_occurred",
    priority: 25,
    charts: [
      {
        type: "bar",
        title: "Error Frequency by Type",
        description: "Compare occurrence of different error types",
        whyItMatters: "Errors destroy trust and drive churn. Prioritize fixing the most frequent errors first to improve user experience.",
      },
      {
        type: "line",
        title: "Error Rate Trend",
        description: "Monitor error frequency over time",
        whyItMatters: "Catch regressions early. Sudden spikes indicate new bugs that need immediate attention.",
      },
    ],
  },
  {
    id: "failed-payment",
    name: "Failed Payment",
    description: "Track payment transaction failures",
    category: "error-friction",
    eventName: "failed_payment",
    priority: 26,
    charts: [
      {
        type: "line",
        title: "Payment Failure Rate",
        description: "Monitor payment success rate over time",
        whyItMatters: "Failed payments directly impact revenue. Even small improvements in payment success can significantly increase income.",
      },
      {
        type: "bar",
        title: "Failure Reason Breakdown",
        description: "Compare frequency of different failure reasons",
        whyItMatters: "Understand why payments fail (declined cards, technical issues, etc.) to implement the right fixes.",
      },
    ],
  },
  {
    id: "validation-error",
    name: "Validation Error",
    description: "Track form validation errors",
    category: "error-friction",
    eventName: "validation_error",
    priority: 27,
    charts: [
      {
        type: "bar",
        title: "Validation Errors by Field",
        description: "Compare error rates across different form fields",
        whyItMatters: "Validation errors frustrate users and reduce completion rates. High error rates indicate unclear requirements or poor UX.",
      },
      {
        type: "line",
        title: "Validation Error Rate Trend",
        description: "Monitor validation error frequency over time",
        whyItMatters: "Track whether better instructions and inline validation reduce errors and improve form completion rates.",
      },
    ],
  },
]
