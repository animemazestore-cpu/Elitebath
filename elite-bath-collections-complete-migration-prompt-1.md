# ELITE BATH COLLECTIONS — COMPLETE E-COMMERCE MIGRATION PROMPT

## ROLE

Act as a senior full-stack engineer, UI/UX designer, database architect, security engineer, and QA engineer.

You are working inside an existing fully functional project currently branded as **AnimeMaze**.

Your task is to transform the existing AnimeMaze source code into a complete, professional sanitary and bathroom-products e-commerce website named:

# ELITE BATH COLLECTIONS

This is a complete business transformation:

**AnimeMaze — anime store, purple theme, existing normal payment flow**
➡️
**Elite Bath Collections — sanitary store, green/white professional theme, ShopCart-inspired UI, Razorpay payments, product variants, and connected backend**

Do not create a disconnected demo. Inspect the existing source code first, reuse useful infrastructure, and make the frontend, backend, database, admin panel, and payment flow work together correctly.

---

# 1. PRIMARY OBJECTIVES

Transform the application into a sanitary-products store selling products such as:

- Bathroom fittings
- Faucets and taps
- Shower systems
- Wash basins
- Toilets and commodes
- Bathroom accessories
- Drains and waste fittings
- Health faucets
- Pipes and plumbing accessories
- Other sanitary and bathroom products

The final application must have:

- Professional green-and-white visual identity
- ShopCart-inspired e-commerce layout
- Product variants such as color, size, finish, model, and configuration
- Real inventory tracking
- Real cart and checkout behavior
- Secure Razorpay integration
- Connected Supabase backend
- Admin product and order management
- Legal and customer-support pages
- Responsive mobile and desktop UI
- No AnimeMaze branding or anime-themed content remaining in the visible production UI

Do not copy ShopCart branding, assets, text, or exact design. Use the screenshots as inspiration for layout, spacing, product cards, filters, and overall e-commerce polish.

---

# 2. NON-NEGOTIABLE PRE-CODING WORKFLOW

Before changing code:

1. Inspect the complete repository structure.
2. Identify the frontend framework and build system.
3. Inspect all routes and pages.
4. Inspect reusable components.
5. Inspect Supabase schema, queries, policies, hooks, and storage.
6. Inspect authentication and role-based authorization.
7. Inspect cart and wishlist logic.
8. Inspect checkout and existing payment logic.
9. Inspect admin dashboard functionality.
10. Inspect product, category, order, review, and promo-code models.
11. Identify what can be safely reused.
12. Identify AnimeMaze-specific content and logic that must be replaced.
13. Create a migration plan before implementing.
14. Do not delete working functionality without confirming its replacement works.

Maintain a safe, incremental workflow. Make changes in logical phases and test after each major phase.

---

# 3. COMPLETE BRAND TRANSFORMATION

Replace the visible brand with:

## Elite Bath Collections

The final website must look like a sanitary-products business, not a renamed anime store.

Replace all visible instances of:

- AnimeMaze
- Anime-specific slogans
- Anime-specific category names
- Anime references
- Purple anime promotional copy
- Anime-themed illustrations and decorative assets
- Anime-related metadata
- Anime-specific homepage sections

Update branding across:

- Header
- Logo and wordmark
- Homepage
- Product pages
- Shop page
- Cart
- Checkout
- Authentication screens
- Order confirmation
- Order tracking
- Footer
- Admin dashboard
- Browser title
- Favicon
- SEO metadata
- Open Graph metadata
- Social preview metadata
- Any email-style templates
- Empty states
- Loading states
- Error messages
- Legal pages

Use the exact brand name:

**Elite Bath Collections**

Do not invent:

- Business address
- Phone number
- Email address
- GST number
- Company registration information
- Certifications
- Product guarantees
- Delivery promises
- Social media handles

Use clearly marked editable placeholders for missing business information.

Do not rename internal tables, columns, routes, or variables unless it is safe and necessary. Avoid breaking existing functionality.

---

# 4. VISUAL DESIGN SYSTEM

## Design Direction

Create a premium, professional sanitary-store interface inspired by the supplied ShopCart screenshots.

The design should be:

- White and clean
- Professional
- Trustworthy
- Spacious but not wasteful
- Elegant
- Conversion-focused
- Fast and responsive
- Easy to navigate
- Suitable for bathroom and sanitary products

Avoid:

- Purple anime styling
- Neon effects
- Excessive gradients
- Excessive glassmorphism
- Overly rounded childish cards
- Unnecessary animations
- Generic AI-generated layouts
- Cluttered interfaces

## Color Palette

Use green and white as the primary identity.

Suggested CSS variables:

```css
:root {
  --background: #ffffff;
  --surface: #f8faf9;
  --surface-muted: #f1f5f2;
  --border: #e2e8e4;
  --text-primary: #17211b;
  --text-secondary: #647067;
  --text-muted: #94a19a;

  --primary: #166534;
  --primary-hover: #14532d;
  --primary-soft: #dcfce7;

  --secondary: #4d7c5a;
  --success: #15803d;
  --warning: #d97706;
  --danger: #dc2626;
}
```

Use green accents carefully. The interface should remain mostly white and neutral.

## Typography

Use the existing font if appropriate, or use a clean modern font such as:

- Inter
- Manrope
- Plus Jakarta Sans

Use consistent typography for:

- Headings
- Product names
- Prices
- Labels
- Buttons
- Forms
- Legal content
- Admin tables

---

# 5. SHOPCART-INSPIRED GLOBAL LAYOUT

Use the supplied ShopCart screenshots as inspiration for:

- Header structure
- Spacious homepage layout
- Category chips
- Product grid
- Filter sidebar
- Product card hierarchy
- White surfaces
- Subtle borders
- Professional spacing
- Footer structure
- Mobile responsiveness

Do not reproduce ShopCart's brand or copy its exact visual design.

The result must have an original Elite Bath Collections identity.

---

# 6. HEADER AND NAVIGATION

Redesign the header with the following structure.

## Desktop Header

Include:

- Elite Bath Collections logo/wordmark
- Home
- Shop
- Categories
- New Arrivals
- Offers/Deals, only if supported
- Search
- Wishlist
- Cart with item count
- Login/profile

Requirements:

- White background
- Subtle bottom border
- Clear active navigation state
- Sticky header only if it improves UX
- Accessible icon buttons
- Tooltips for icon-only actions
- Proper hover and focus states
- No horizontal overflow

## Mobile Header

Include:

- Hamburger menu
- Brand logo
- Search button
- Cart button
- Account button if available

Implement a polished drawer or sheet using existing navigation logic.

Ensure:

- Touch-friendly controls
- Correct overlay behavior
- Close button and Escape support
- No content overflow
- Smooth but quick transitions

---

# 7. HOMEPAGE

Create a professional sanitary-store homepage while preserving or adapting existing working data functionality.

Suggested sections:

1. Header
2. Hero banner
3. Category chips
4. Featured products
5. Popular sanitary products
6. New arrivals
7. Promotional banner
8. Shop by category
9. Product collections
10. Service/benefits strip
11. Customer-support section
12. Footer

Only show sections with real data or meaningful content.

## Hero Section

Use:

- Clean white or soft green background
- Professional bathroom/sanitary imagery
- Strong headline
- Supporting copy
- Primary CTA: Shop Now
- Secondary CTA: Explore Categories
- Responsive layout
- Optimized images
- Readable mobile layout

Possible editable copy:

> Elevate Your Bathroom with Premium Sanitary Collections

Do not make unsupported quality, warranty, delivery, or certification claims.

---

# 8. CATEGORY SYSTEM

Replace anime categories with sanitary-store categories.

Possible categories:

- Faucets & Taps
- Showers
- Wash Basins
- Toilets & Commodes
- Bathroom Accessories
- Health Faucets
- Drains & Waste Fittings
- Plumbing Accessories
- New Arrivals
- Offers

Use database-driven categories wherever possible.

Category functionality must support:

- Category listing
- Category filtering
- Category pages
- Category images
- Category ordering
- Admin category management
- Mobile horizontal scrolling chips
- Active category states

Do not hardcode category data if the existing system supports database-driven categories.

---

# 9. PRODUCT DATA MODEL AND VARIANTS

Implement or adapt the backend to support sanitary-product variants.

Products may have:

- Name
- Slug
- Description
- Short description
- Category
- Brand
- SKU
- Base price
- Sale price
- Tax information if applicable
- Product images
- Featured status
- New-arrival status
- Active/inactive status
- Weight/dimensions where applicable
- Material
- Finish
- Warranty information only when verified
- Stock status

## Variant Support

Support selectable options such as:

- Color
- Size
- Finish
- Material
- Model
- Capacity
- Pack size
- Installation type
- Other product-specific options

Examples:

- Color: Chrome, Matte Black, Gold, White
- Finish: Glossy, Matte, Brushed
- Size: Small, Medium, Large
- Configuration: Single Lever, Mixer, Wall Mounted
- Pack size: 1 piece, 2 pieces, 4 pieces

Do not show irrelevant options for every product.

Each variant should be able to have:

- Variant ID
- Product ID
- SKU
- Option values
- Price adjustment or exact price
- Stock quantity
- Image if applicable
- Active/inactive status

Do not assume every category uses the same options.

## Admin-Controlled Variant Configuration (MANDATORY)

Variant options must be configured from the admin panel when creating or editing a product. Do not automatically display every option (Color, Size, Finish, Material, Model, etc.) on every product.

In the admin product form, provide clear controls such as:

- **Has multiple colors?** Yes/No
  - If Yes, show a color-option manager where the admin can add the available colors.
  - If No, do not show the color selector on the customer-facing product page.
- **Has multiple sizes?** Yes/No
  - If Yes, show a size-option manager where the admin can add the available sizes.
  - If No, do not show the size selector on the customer-facing product page.
- **Has multiple finishes?** Yes/No
  - If Yes, allow the admin to configure available finishes.
- **Has multiple materials?** Yes/No
  - If Yes, allow the admin to configure available materials.
- **Has multiple models?** Yes/No
  - If Yes, allow the admin to configure available models.

Apply the same conditional configuration pattern to other relevant options, including capacity, pack size, installation type, and product-specific attributes.

Admin requirements:

1. The admin must explicitly enable an option before it appears on the product information page.
2. The admin must be able to add, edit, reorder, deactivate, and delete option values.
3. The admin must be able to define required and optional selections.
4. If combinations are used, allow the admin to create or manage valid combinations (for example, Black + Large).
5. Each valid combination must support its own SKU, price, stock, and optional image.
6. Do not create irrelevant or empty selectors.
7. Validate the configuration before publishing the product.
8. Preserve existing product data and avoid breaking products that have no variants.

Customer-facing behavior:

- Show only the options enabled and configured by the admin for that specific product.
- Example: if the admin selects **Multiple Colors = Yes**, display a color selector on the product information page; if **No**, hide it completely.
- Example: if the admin selects **Multiple Sizes = Yes**, display a size selector on the product information page; if **No**, hide it completely.
- Require customers to select all admin-marked required options before adding the item to cart.
- Update the selected variant's price, image, SKU, availability, and stock where applicable.
- Store the selected option values and exact variant ID in the cart and order records.

## Variant UI

On the product page:

- Show only options configured for that product.
- Use color swatches for colors when appropriate.
- Use buttons/dropdowns for size and finish.
- Clearly show selected state.
- Clearly show unavailable combinations.
- Prevent adding a product without required selections.
- Update price, image, SKU, and stock when the selected variant changes.
- Preserve selections in cart and order records.

---

# 10. PRODUCT CARD DESIGN

Redesign product cards in a clean ShopCart-inspired style.

Display existing real data for:

- Product image
- Product name
- Category
- Price
- Original price
- Discount
- Rating only when real
- Stock status
- New/sale badge
- Wishlist action
- Add to Cart or View Product

Requirements:

- Consistent card heights
- Proper image container
- Use object-fit: contain where appropriate
- No stretching or zooming
- Clear pricing hierarchy
- Subtle hover effect
- Responsive card grid
- Mobile-friendly controls
- Loading skeletons
- Empty states
- Disabled state for unavailable products

If variants are available, show a small indication such as “Multiple options” without cluttering the card.

Do not hardcode product data.

---

# 11. SHOP PAGE

Create a professional catalog page.

## Desktop

Use:

- Breadcrumbs
- Page heading
- Product count based on real data
- Filter sidebar
- Sort dropdown
- Product grid
- Pagination or load more

## Filters

Support where relevant:

- Category
- Price range
- Color
- Size
- Finish
- Material
- Brand
- Availability
- Rating
- Discount

## Mobile

Use:

- Filter button
- Sort button
- Slide-over or bottom-sheet filters
- Active filter chips
- Clear filters action

Preserve existing search and filtering logic, improving backend queries only where required.

Use URL query parameters where practical so filters can be shared and restored.

---

# 12. PRODUCT DETAILS PAGE

Create a premium product details layout.

Include:

- Image gallery
- Thumbnail gallery
- Image zoom/lightbox
- Product title
- Brand/category
- SKU where appropriate
- Rating and reviews only from real data
- Price
- Discount
- Variant selectors
- Stock availability
- Quantity selector
- Add to Cart
- Buy Now
- Wishlist
- Product description
- Specifications
- Material/finish information
- Installation information if available
- Delivery information
- Return policy link
- Related products
- Reviews

Rules:

- Required options must be selected.
- Invalid combinations must be disabled.
- Stock must be validated server-side.
- Product price must be trusted from the backend.
- Cart must preserve variant information.
- Do not claim unsupported product specifications.

---

# 13. CART

Redesign the cart page or drawer.

Each item should show:

- Product image
- Product name
- Selected variant options
- SKU if useful
- Quantity controls
- Unit price
- Item total
- Remove action
- Availability warnings

Summary should show:

- Subtotal
- Discount
- Delivery charges
- Tax if applicable
- Final total
- Checkout button

Requirements:

- Prevent invalid quantities.
- Revalidate product and variant availability.
- Recalculate totals safely.
- Preserve cart after refresh and login where supported.
- Handle empty cart and error states.
- Do not trust frontend totals for payment creation.

---

# 14. CHECKOUT AND RAZORPAY IMPLEMENTATION

Implement a secure Razorpay payment flow integrated with the existing backend.

## Checkout UI

Include:

- Customer name
- Email
- Phone number
- Full delivery address
- Address line
- City
- State
- Pincode
- Country if required
- Order summary
- Selected variants
- Delivery charge
- Discount
- Final total
- Razorpay payment button
- Terms/policy links
- Payment status feedback

## Secure Payment Flow

Use a secure backend function or server-side endpoint, such as Supabase Edge Functions.

Required flow:

1. Validate authenticated user or guest checkout rules.
2. Receive cart items from the frontend.
3. Fetch product and variant details from the database.
4. Validate active status and stock.
5. Calculate prices server-side.
6. Calculate discounts and delivery charges server-side.
7. Create a pending order or payment intent safely.
8. Create the Razorpay order using the secret key only on the server.
9. Return only safe information to the frontend.
10. Open Razorpay Checkout.
11. Receive payment response.
12. Verify the Razorpay signature server-side.
13. Confirm payment status through secure verification.
14. Update order and payment records transactionally.
15. Reduce stock safely and prevent overselling.
16. Prevent duplicate order creation.
17. Handle failed, cancelled, pending, and timed-out payments.
18. Show the correct result to the customer.
19. Support webhook verification if implemented.
20. Make payment verification idempotent.

## Security Rules

Never expose:

- Razorpay key secret
- Supabase service-role key
- Admin secrets
- Private API credentials

Never mark an order as paid only because the frontend reports success.

Use environment variables and secure server-side configuration.

Check Razorpay's current onboarding, KYC, age, business, and payment requirements before production deployment.

---

# 15. DATABASE AND BACKEND

Use the existing Supabase project where practical.

Adapt or create database structures for:

- Products
- Categories
- Product images
- Product variants
- Variant options
- Inventory
- Users/profiles
- Cart items
- Wishlist items
- Orders
- Order items
- Order item variants
- Payments
- Promo codes
- Reviews
- Addresses
- Delivery information
- Admin roles

## Backend Requirements

- Preserve existing authentication.
- Use proper foreign keys and constraints.
- Add indexes for frequent queries.
- Validate input.
- Use secure Supabase RLS policies.
- Separate public product data from private customer/order data.
- Prevent normal users from reading other users' orders.
- Restrict admin actions to authorized users.
- Use server-side validation for prices, stock, discounts, and payment states.
- Create safe migrations and document schema changes.
- Do not destroy existing production data without explicit confirmation.

If existing tables can be adapted safely, prefer migration over unnecessary duplication.

---

# 16. ADMIN PANEL

Redesign and extend the admin dashboard for Elite Bath Collections.

Include:

- Dashboard overview using real data
- Product CRUD
- Category CRUD
- Product image management
- Variant management
- Option management
- SKU management
- Stock management
- Price and sale price management
- Featured products
- New arrivals
- Order management
- Payment status
- Refund/cancellation status
- Customer delivery information
- Expected arrival date
- Promo-code management
- Review moderation
- Customer support details

## Variant Admin UI

Admin must be able to:

- Enable or disable variants per product
- Configure option types
- Add values such as color, size, and finish
- Set variant-specific SKU
- Set variant stock
- Set variant price
- Assign variant images
- Disable unavailable variants

## Admin Security

- Enforce permissions server-side.
- Use Supabase RLS.
- Never rely only on hiding frontend buttons.
- Prevent unauthorized data access.
- Validate all admin mutations.

---

# 17. ORDERS AND ORDER TRACKING

Preserve and redesign the order tracking experience.

Show:

- Order ID
- Order date
- Payment status
- Order status
- Product and variant details
- Quantity
- Total
- Delivery address for the authorized customer
- Expected delivery date
- Status timeline
- Cancellation/refund status when applicable

Possible statuses:

- Pending Payment
- Payment Failed
- Confirmed
- Processing
- Packed
- Shipped
- Out for Delivery
- Delivered
- Cancelled
- Refund Initiated
- Refunded

Make statuses configurable only if the existing backend supports it safely.

---

# 18. LEGAL AND CUSTOMER INFORMATION PAGES

Create polished, responsive pages linked from the footer and checkout.

Required pages:

1. Privacy Policy
2. Terms and Conditions
3. Refund and Cancellation Policy
4. Return and Replacement Policy
5. Shipping and Delivery Policy
6. Contact Us
7. About Us

The pages should include editable placeholders for:

- Business legal name
- Business address
- Support email
- Support phone
- Effective date
- Refund timelines
- Return window
- Shipping locations
- Processing time

Do not invent legal information.

Policies must reflect the actual business process and be reviewed by the business owner before publishing.

Ensure the website visibly provides relevant information for Razorpay onboarding, but do not claim guaranteed approval or legal compliance.

---

# 19. SEO AND BRAND METADATA

Update:

- Browser title
- Meta description
- Open Graph title
- Open Graph description
- Favicon
- Canonical URLs where appropriate
- Product metadata
- Sitemap if supported
- Robots configuration if supported
- Semantic headings
- Image alt text

Use Elite Bath Collections branding throughout.

Do not leave AnimeMaze-related SEO metadata.

---

# 20. RESPONSIVE DESIGN

Test the full application at:

- 320px
- 360px
- 375px
- 390px
- 414px
- 768px
- 1024px
- 1280px
- 1440px

Check:

- Header
- Hero
- Category chips
- Product cards
- Filters
- Variant selectors
- Product details
- Cart
- Checkout
- Razorpay flow
- Authentication
- Order tracking
- Admin dashboard
- Legal pages
- Footer

Fix:

- Horizontal scrolling
- Overflow
- Clipped text
- Overlapping elements
- Broken grids
- Unusable buttons
- Poor tap targets
- Distorted images
- Incorrect modal sizing

---

# 21. PERFORMANCE

- Reuse existing components.
- Avoid unnecessary dependencies.
- Use efficient database queries.
- Add pagination or limited fetching.
- Use lazy loading for below-the-fold images.
- Optimize image sizes.
- Avoid artificial delays.
- Use skeleton loaders where appropriate.
- Avoid unnecessary React re-renders.
- Preserve existing caching where useful.
- Do not load the entire catalog unnecessarily.
- Keep checkout and payment interactions reliable.

---

# 22. ACCESSIBILITY

Implement:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Accessible form labels
- Accessible dialogs and drawers
- Alt text
- Good contrast
- Clear validation messages
- Screen-reader-friendly status updates
- Accessible color swatches with labels
- Proper disabled states
- Reduced-motion support where practical

---

# 23. FILE AND COMPONENT ORGANIZATION

Adapt the existing project structure instead of blindly replacing it.

Use reusable components where appropriate:

```text
components/
├── layout/
├── header/
├── footer/
├── product/
├── product-variants/
├── category/
├── filters/
├── cart/
├── checkout/
├── payment/
├── auth/
├── orders/
├── legal/
├── ui/
└── admin/
```

Keep code:

- Modular
- Typed
- Reusable
- Maintainable
- Secure
- Free from unnecessary duplication

---

# 24. TESTING REQUIREMENTS

Test all existing and newly adapted flows:

- Homepage navigation
- Category navigation
- Search
- Filters
- Sorting
- Product details
- Color selection
- Size selection
- Finish selection
- Variant availability
- Variant-specific price
- Variant-specific stock
- Add to cart
- Cart quantity updates
- Wishlist
- Promo codes
- Address validation
- Razorpay order creation
- Payment success
- Payment failure
- Payment cancellation
- Payment signature verification
- Duplicate payment handling
- Order creation
- Order tracking
- Refund/cancellation states
- Login/signup
- Admin authorization
- Product CRUD
- Variant CRUD
- Stock updates
- Legal page links
- Mobile layout
- Production build

Run:

- TypeScript checks
- Lint checks if configured
- Production build
- Browser console checks
- Responsive testing

Do not finish while known errors remain.

---

# 25. DO NOT DO

Do not:

- Leave AnimeMaze branding visible.
- Leave anime categories or anime promotional text.
- Keep the purple anime theme.
- Create a static mockup instead of integrating the real app.
- Replace real database data with fake data.
- Break existing authentication.
- Break cart or wishlist logic.
- Expose Razorpay secrets.
- Trust frontend prices.
- Mark payments successful without secure verification.
- Remove RLS or authorization.
- Invent legal or business information.
- Delete production data without confirmation.
- Copy ShopCart assets or branding.
- Add unnecessary libraries.
- Rewrite the backend without inspecting it first.

---

# 26. FINAL ACCEPTANCE CRITERIA

The project is complete only when:

- [ ] The visible brand is Elite Bath Collections.
- [ ] AnimeMaze branding and anime content are removed from the production UI.
- [ ] The UI uses a professional green-and-white theme.
- [ ] The UI is inspired by the supplied ShopCart screenshots.
- [ ] The homepage is polished and responsive.
- [ ] The shop page has a professional product grid and filters.
- [ ] Product cards are consistent and responsive.
- [ ] Product details support configured color, size, finish, and other options.
- [ ] Variant price and stock work correctly.
- [ ] Cart stores the selected variant correctly.
- [ ] Supabase backend is connected correctly.
- [ ] Admin can manage products and variants.
- [ ] Orders preserve product and variant information.
- [ ] Razorpay uses secure server-side order creation and signature verification.
- [ ] Payment failures and duplicate payments are handled.
- [ ] Legal pages exist and are linked.
- [ ] SEO metadata uses Elite Bath Collections.
- [ ] Mobile and desktop layouts work.
- [ ] No fake data has been introduced.
- [ ] Existing important functionality is preserved or safely adapted.
- [ ] TypeScript and production build pass.
- [ ] No known critical console errors remain.

# FINAL COMMAND

First inspect the existing AnimeMaze source code and produce a clear migration plan.

Then execute the transformation in safe phases:

1. Audit existing application
2. Plan database and backend changes
3. Apply safe schema migrations if required
4. Replace branding and content
5. Build the green-and-white Elite Bath Collections design system
6. Redesign all frontend pages
7. Implement product variants
8. Connect and validate backend data
9. Implement secure Razorpay payment flow
10. Update admin functionality
11. Add legal pages
12. Test all user and admin workflows
13. Fix errors
14. Run the production build

The final result must be a complete, production-oriented sanitary e-commerce website called **Elite Bath Collections**, with a professional ShopCart-inspired UI, product selections such as color and size, a connected Supabase backend, and secure Razorpay payments.
