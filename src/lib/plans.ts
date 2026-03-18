export type Plan = {
  key: string;
  name: string;
  price: string;
  description: string;
  features: string[];
};

export const tiers: Record<string, Plan> = {
  starter: {
    key: 'starter',
    name: 'Starter',
    price: '৳15,000 / project',
    description: 'A professional 5-page website designed to kickstart your digital presence with speed and precision.',
    features: ['Up to 5 pages', 'Responsive design', 'Basic SEO optimization', 'Contact form', '1 month support'],
  },
  growth: {
    key: 'growth',
    name: 'Growth',
    price: '৳50,000 / project',
    description: 'A comprehensive 15-page solution with custom design and CMS integration, optimized for growth.',
    features: ['Up to 15 pages', 'Custom design system', 'CMS integration', 'Performance optimization', 'Analytics setup', '3 months support'],
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    price: '৳1,00,000+',
    description: 'Full-scale custom software/game systems with scalable backend, database design, and dedicated DevOps support.',
    features: ['Unlimited pages', 'Custom backend', 'Database design', 'CI/CD pipeline', 'Security audit', '6 months support'],
  },
};

export const availablePlans = Object.values(tiers);
