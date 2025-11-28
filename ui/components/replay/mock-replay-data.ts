export interface ReplayEvent {
  timestamp: number
  type: "click" | "scroll" | "input" | "navigate" | "error" | "load"
  element: string
  value?: string
  x?: number
  y?: number
}

export interface ReplaySession {
  id: string
  persona: string
  startTime: string
  duration: number
  events: ReplayEvent[]
  platform: string
  successRate: number
}

export const mockReplaySessions: ReplaySession[] = [
  {
    id: "replay-1",
    persona: "New Shopper",
    startTime: "2024-01-10T14:30:00Z",
    duration: 145,
    platform: "Web",
    successRate: 92,
    events: [
      { timestamp: 0, type: "load", element: "landing-page", value: "Page loaded" },
      { timestamp: 3, type: "navigate", element: "landing-page", value: "Viewed hero section" },
      { timestamp: 8, type: "scroll", element: "window", value: "Scrolled to features" },
      { timestamp: 15, type: "click", element: "signup-button", x: 540, y: 320 },
      { timestamp: 16, type: "navigate", element: "signup-page", value: "Navigated to signup" },
      { timestamp: 22, type: "input", element: "email-field", value: "user@example.com" },
      { timestamp: 28, type: "input", element: "password-field", value: "••••••••" },
      { timestamp: 35, type: "click", element: "submit-button", x: 540, y: 420 },
      { timestamp: 38, type: "load", element: "verification-page", value: "Email verification" },
      { timestamp: 45, type: "navigate", element: "dashboard", value: "Verified and logged in" },
      { timestamp: 52, type: "scroll", element: "products-list", value: "Browsing products" },
      { timestamp: 65, type: "click", element: "filter-price", x: 250, y: 150 },
      { timestamp: 72, type: "scroll", element: "products-list", value: "Filtered results loaded" },
      { timestamp: 85, type: "click", element: "product-card", x: 540, y: 350 },
      { timestamp: 92, type: "navigate", element: "product-detail", value: "Product details" },
      { timestamp: 110, type: "click", element: "add-to-cart", x: 540, y: 420 },
      { timestamp: 115, type: "navigate", element: "cart-page", value: "Navigated to cart" },
      { timestamp: 130, type: "click", element: "checkout-button", x: 540, y: 380 },
      { timestamp: 140, type: "load", element: "checkout-complete", value: "Order placed successfully" },
    ],
  },
  {
    id: "replay-2",
    persona: "Returning User",
    startTime: "2024-01-10T16:20:00Z",
    duration: 89,
    platform: "Mobile",
    successRate: 85,
    events: [
      { timestamp: 0, type: "load", element: "dashboard", value: "App loaded" },
      { timestamp: 5, type: "navigate", element: "dashboard", value: "Logged in automatically" },
      { timestamp: 12, type: "scroll", element: "products-list", value: "Browsing recommendations" },
      { timestamp: 25, type: "click", element: "wishlist-filter", x: 180, y: 300 },
      { timestamp: 30, type: "load", element: "wishlist", value: "Wishlist loaded" },
      { timestamp: 40, type: "click", element: "product-card", x: 180, y: 350 },
      { timestamp: 50, type: "navigate", element: "product-detail", value: "Product details" },
      { timestamp: 65, type: "click", element: "add-to-cart", x: 180, y: 420 },
      { timestamp: 75, type: "navigate", element: "cart-page", value: "Cart updated" },
      { timestamp: 85, type: "click", element: "checkout-button", x: 180, y: 380 },
    ],
  },
  {
    id: "replay-3",
    persona: "Admin User",
    startTime: "2024-01-10T10:15:00Z",
    duration: 220,
    platform: "Web",
    successRate: 98,
    events: [
      { timestamp: 0, type: "load", element: "admin-login", value: "Admin page loaded" },
      { timestamp: 8, type: "input", element: "email-field", value: "admin@company.com" },
      { timestamp: 15, type: "input", element: "password-field", value: "••••••••" },
      { timestamp: 22, type: "click", element: "submit-button", x: 540, y: 420 },
      { timestamp: 28, type: "navigate", element: "admin-dashboard", value: "Admin dashboard loaded" },
      { timestamp: 35, type: "click", element: "analytics-menu", x: 250, y: 80 },
      { timestamp: 40, type: "navigate", element: "analytics-page", value: "Analytics view loaded" },
      { timestamp: 60, type: "scroll", element: "charts-section", value: "Reviewing metrics" },
      { timestamp: 85, type: "click", element: "export-button", x: 540, y: 200 },
      { timestamp: 95, type: "navigate", element: "export-dialog", value: "Export dialog opened" },
      { timestamp: 110, type: "click", element: "csv-format", x: 400, y: 300 },
      { timestamp: 120, type: "click", element: "export-confirm", x: 540, y: 420 },
      { timestamp: 130, type: "load", element: "export-complete", value: "Export started" },
    ],
  },
]
