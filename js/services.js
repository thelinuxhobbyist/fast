const SERVICES = [
  {
    "id": "logo-basic",
    "title": "Logo \u2014 Basic",
    "price": "\u00a349",
    "meta": {
      "revisions": "1 revision",
      "format": "PNG & JPG",
      "turnaround": "2 days"
    },
    "shortDescription": "A quick, affordable logo design perfect for startups and freelancers.",
    "longDescription": "Our Basic Logo Design package gives you a polished, professional logo built from one creative concept and one revision. Delivered in high-quality PNG and JPG formats. Ideal for clients needing a simple but distinct brand mark.",
    "features": [
      "1 concept, 1 revision",
      "Delivered as PNG & JPG",
      "Full commercial use rights"
    ],
    "stripe": "https://buy.stripe.com/placeholder1"
  },
  {
    "id": "logo-premium",
    "title": "Logo \u2014 Premium Brand Kit",
    "price": "\u00a399",
    "meta": {
      "revisions": "3 revisions",
      "format": "AI, SVG, PNG, JPG",
      "turnaround": "3 days"
    },
    "shortDescription": "Professional logo design with full source files and multiple revisions.",
    "longDescription": "The Premium Logo Design package includes multiple design concepts, up to three revisions, and delivery in AI, SVG, PNG, and JPG formats. Perfect for businesses ready to elevate their visual identity.",
    "features": [
      "3 unique concepts",
      "Full source files (AI, SVG)",
      "Up to 3 revisions"
    ],
    "stripe": "https://buy.stripe.com/placeholder2"
  },
  {
    "id": "flyer",
    "title": "Flyer / Poster Design",
    "price": "\u00a335",
    "meta": {
      "size": "A4 or A5",
      "turnaround": "2 days",
      "format": "Print-ready PDF, JPG"
    },
    "shortDescription": "Eye-catching promotional flyers or posters to promote your business or events.",
    "longDescription": "Get beautifully designed flyers or posters that make your message stand out. Whether you\u2019re advertising a sale, event, or new product, our designs are bold, clear, and professional \u2014 optimized for both print and online use.",
    "features": [
      "1\u20132 design concepts",
      "Print-ready files included",
      "Social-media-ready exports"
    ],
    "stripe": "https://buy.stripe.com/placeholder3"
  },
  {
    "id": "business-card",
    "title": "Business Card Design",
    "price": "\u00a325",
    "meta": {
      "size": "85\u00d755mm",
      "format": "PDF, PNG"
    },
    "shortDescription": "Professional business card designs to make a great first impression.",
    "longDescription": "Get a sleek, branded business card design tailored to your identity. Delivered in print-ready and digital formats, perfect for networking and corporate events.",
    "features": [
      "Double or single-sided design",
      "Print and digital formats",
      "Optional QR code integration"
    ],
    "stripe": "https://buy.stripe.com/placeholder4"
  },
  {
    "id": "social-templates",
    "title": "Social Media Templates",
    "price": "\u00a375",
    "meta": {
      "platforms": "FB, IG, LinkedIn, Twitter",
      "count": "10 templates"
    },
    "shortDescription": "Branded templates to keep your social media consistent and professional.",
    "longDescription": "We\u2019ll create a pack of editable templates for your social media platforms. Stay visually consistent with your brand across all channels, save time, and keep your audience engaged.",
    "features": [
      "10 editable templates",
      "Optimized for major platforms",
      "Custom color and typography setup"
    ],
    "stripe": "https://buy.stripe.com/placeholder5"
  },
  {
    "id": "website-starter",
    "title": "Website \u2014 Starter",
    "price": "\u00a3149",
    "meta": {
      "platform": "HTML or WordPress",
      "pages": "Up to 3 pages",
      "turnaround": "5 days"
    },
    "shortDescription": "Launch your online presence with a simple, professional website setup.",
    "longDescription": "Our Website Setup package includes full configuration of a 3-page website (Home, About, Contact), responsive design, and basic SEO setup. Perfect for small businesses starting online.",
    "features": [
      "3 responsive pages",
      "Basic SEO and analytics setup",
      "Contact form included"
    ],
    "stripe": "https://buy.stripe.com/placeholder6"
  },
  {
    "id": "website-business",
    "title": "Website \u2014 Business",
    "price": "\u00a3249",
    "meta": {
      "platform": "WordPress",
      "pages": "Up to 6 pages",
      "turnaround": "7 days"
    },
    "shortDescription": "A larger multi-page website with basic SEO setup.",
    "longDescription": "A multi-page business site with SEO basics, structured navigation, and responsive templates suitable for service businesses and small companies.",
    "features": [
      "Up to 6 pages",
      "SEO basics",
      "CMS training (handbook)"
    ],
    "stripe": "https://buy.stripe.com/placeholder7"
  },
  {
    "id": "online-shop",
    "title": "Online Shop (eCommerce)",
    "price": "\u00a3399",
    "meta": {
      "platform": "Shopify or WooCommerce",
      "products": "Up to 20 products"
    },
    "shortDescription": "Set up a simple online shop with payments and product pages.",
    "longDescription": "We build your eCommerce store, configure Stripe payments, set up product categories, and prepare the store for launch with 20 product listings included.",
    "features": [
      "Up to 20 products",
      "Stripe integration",
      "Shop setup"
    ],
    "stripe": "https://buy.stripe.com/placeholder8"
  },
  {
    "id": "stripe-setup",
    "title": "Website Setup with Stripe",
    "price": "\u00a3129",
    "meta": {
      "service": "Stripe integration",
      "turnaround": "2 days"
    },
    "shortDescription": "Add Stripe payments to your website so you can accept card payments.",
    "longDescription": "We integrate Stripe Checkout into your website, set up products, and test transactions so your site can accept payments securely.",
    "features": [
      "Stripe setup",
      "Test transactions",
      "Payment link creation"
    ],
    "stripe": "https://buy.stripe.com/placeholder9"
  },
  {
    "id": "shopify",
    "title": "Shopify Setup",
    "price": "\u00a3299",
    "meta": {
      "service": "Shopify store",
      "products": "Up to 50 products"
    },
    "shortDescription": "Full Shopify store setup and theme installation.",
    "longDescription": "Complete Shopify store setup including theme install, basic customisation and up to 50 product imports to get your store selling fast.",
    "features": [
      "Theme install",
      "50 products import",
      "Payment setup"
    ],
    "stripe": "https://buy.stripe.com/placeholder10"
  },
  {
    "id": "birthday-banner",
    "title": "Birthday Banner Design",
    "price": "\u00a330",
    "meta": {
      "size": "Custom",
      "format": "PNG, PDF"
    },
    "shortDescription": "Personalised birthday banners for print or digital use.",
    "longDescription": "Design custom birthday banners for events \u2014 print-ready and digital formats provided, tailored to your colour and style preferences.",
    "features": [
      "Print-ready",
      "Digital versions",
      "Fast turnaround"
    ],
    "stripe": "https://buy.stripe.com/placeholder11"
  },
  {
    "id": "greeting-card",
    "title": "Greeting Card Design",
    "price": "\u00a335",
    "meta": {
      "format": "Print or Digital"
    },
    "shortDescription": "Custom greeting card designs for any occasion.",
    "longDescription": "Designs suitable for birthdays, weddings, thank-you cards and more. Delivered as print-ready PDFs or digital files for sharing.",
    "features": [
      "Print or digital",
      "Custom message",
      "Folded or flat formats"
    ],
    "stripe": "https://buy.stripe.com/placeholder12"
  },
  {
    "id": "brochure",
    "title": "Brochure Design",
    "price": "\u00a379",
    "meta": {
      "type": "Tri-fold or Bi-fold",
      "format": "Print-ready PDF"
    },
    "shortDescription": "Professional brochures to showcase products or services.",
    "longDescription": "We design informative tri-fold or bi-fold brochures ready for print and distribution. Includes layout and export-ready files.",
    "features": [
      "Tri/bi-fold",
      "Print-ready PDF",
      "High-res images"
    ],
    "stripe": "https://buy.stripe.com/placeholder13"
  },
  {
    "id": "amend-flyer",
    "title": "Amending Existing Flyers",
    "price": "\u00a325",
    "meta": {
      "edits": "Minor text/image edits",
      "turnaround": "24 hours"
    },
    "shortDescription": "Quick edits to existing flyers and posters.",
    "longDescription": "Quickly update text, swap images, or adjust layouts on your existing flyers with fast turnaround.",
    "features": [
      "Text/image edits",
      "Fast turnaround",
      "Supports PSD/AI/PDF"
    ],
    "stripe": "https://buy.stripe.com/placeholder14"
  },
  {
    "id": "amend-logo",
    "title": "Amending Existing Logos",
    "price": "\u00a330",
    "meta": {
      "service": "Logo tweaks",
      "format": "Vector/PNG"
    },
    "shortDescription": "Refresh or tweak your current logo.",
    "longDescription": "Small updates to colour, font, or layout. Delivered with updated vector and web formats.",
    "features": [
      "Vector exports",
      "High-res files",
      "Color adjustments"
    ],
    "stripe": "https://buy.stripe.com/placeholder15"
  },
  {
    "id": "photo-editing",
    "title": "Product Photo Editing",
    "price": "\u00a340",
    "meta": {
      "count": "Up to 10 photos",
      "service": "Background cleanup"
    },
    "shortDescription": "Improve product photos with background removal and retouching.",
    "longDescription": "We edit product photos for eCommerce with background removal, colour correction and basic retouching for up to 10 images.",
    "features": [
      "Up to 10 photos",
      "Background removal",
      "Basic retouching"
    ],
    "stripe": "https://buy.stripe.com/placeholder16"
  },
  {
    "id": "seo-basics",
    "title": "SEO Basics",
    "price": "\u00a389",
    "meta": {
      "pages": "Up to 6 pages",
      "service": "On-page SEO"
    },
    "shortDescription": "Basic SEO setup for your website to improve discoverability.",
    "longDescription": "Meta tags, sitemaps, and on-page optimisation for up to 6 pages to help search engines find your site.",
    "features": [
      "Meta tags",
      "Sitemap",
      "Basic optimisation"
    ],
    "stripe": "https://buy.stripe.com/placeholder17"
  },
  {
    "id": "google-profile",
    "title": "Google Business Profile Setup",
    "price": "\u00a349",
    "meta": {
      "service": "GBP setup",
      "photos": "3 photos"
    },
    "shortDescription": "Set up and optimise your Google Business Profile for local search.",
    "longDescription": "We create and optimise your Google Business Profile (GBP) including basic verification steps and optimised descriptions.",
    "features": [
      "GBP creation",
      "Photos and description",
      "Local optimisation"
    ],
    "stripe": "https://buy.stripe.com/placeholder18"
  },
  {
    "id": "analytics",
    "title": "Analytics & Tracking Setup",
    "price": "\u00a339",
    "meta": {
      "tools": "GA4, Search Console, GTM",
      "service": "Tracking setup"
    },
    "shortDescription": "Set up Google Analytics, Search Console and Tag Manager for tracking.",
    "longDescription": "Connect GA4, verify Search Console, and install basic tags in Google Tag Manager so you can measure traffic and conversions.",
    "features": [
      "GA4 setup",
      "Search Console",
      "GTM"
    ],
    "stripe": "https://buy.stripe.com/placeholder19"
  },
  {
    "id": "content-updates",
    "title": "Content Upload & Page Updates",
    "price": "\u00a329",
    "meta": {
      "edits": "Up to 5 edits",
      "service": "Content updates"
    },
    "shortDescription": "Small updates to site content, images or pages.",
    "longDescription": "Add or replace text, images, or pages on your existing site for quick content refreshes.",
    "features": [
      "Up to 5 edits",
      "CMS or HTML updates",
      "Quick turnaround"
    ],
    "stripe": "https://buy.stripe.com/placeholder20"
  }
];

function findService(id){ return SERVICES.find(s => s.id === id); }
