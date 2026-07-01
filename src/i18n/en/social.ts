const social = {
  testimonials: {
    kicker: 'Testimonials',
    heading: 'What struck our customers most',
    items: [
      {
        text: 'I expected something generic. Instead there were several passages that described me in a way that was almost uncomfortable, they were so precise.',
        name: 'Giulia',
        age: 31,
      },
      {
        text: "You can really feel the difference compared to the free readings online. Here you don't get scattered sentences: there's a thread, a structure. By the end you genuinely have a fuller picture of how you work and what to do",
        name: 'Serena',
        age: 39,
      },
      {
        text: "I liked it because it doesn't try to predict everything. Instead it helps you understand what keeps repeating, where you get stuck, what kind of dynamic you're living through right now, and what to do.",
        name: 'Valentina',
        age: 33,
      },
      {
        text: 'I was afraid it would be a reading built to tell everyone nice things. But no: especially in the relationship section, I really felt seen.',
        name: 'Laura',
        age: 35,
      },
      {
        text: "The full report helped me understand the structure, which I partly already sensed but not with this much clarity... The rest helped me connect it all to what I'm going through right now. Worth buying.",
        name: 'Beatrice',
        age: 24,
      },
    ],
  },
  // NB: the carousel images (src/assets/report-preview/*) are screenshots
  // of the Italian report — per-language asset to be remade for each new market.
  reportPreview: {
    aria: 'Preview of the full report',
    slideAlts: [
      'Preview of the Full Codice Interiore Report',
      'Excerpt from the Core identity section',
      'Excerpt from the Emotional dynamics section',
      'Excerpt from the Relationships and love section',
      'Excerpt from the Work and direction section',
      'Excerpt from the Recurring patterns and blocks section',
      'Excerpt from the Practical advice section',
      'Excerpt from the Transformative poem',
    ],
    zoomAria: (alt: string) => `Zoom in: ${alt}`,
    prevSlide: 'Previous slide',
    nextSlide: 'Next slide',
    goToSlide: (n: number) => `Go to slide ${n}`,
    note: 'Demo excerpt. The full report you receive is personalized to your birth data and is about 10 pages long.',
    zoomedAria: 'Enlarged preview',
    closePreview: 'Close preview',
    prevImage: 'Previous image',
    nextImage: 'Next image',
    escHint: 'Tap outside or press ESC to close',
  },
};

export default social;
