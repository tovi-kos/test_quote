export const products = [
  {
    image: '../images/Product1.jpg',
    description: {
      text: 'Network Rack 10U',
      comment: 'The rack, including its size, will be determined according to the on-site requirements.',
      logo: null
    },
    itemPrice: 1500.00,
    quantity: 1,
    total: 1500.00,
    category: 'Network Equipment'
  },
    {
    image: '../images/Product1.jpg',
    description: {
      text: 'Network Rack 10U',
      comment: 'The rack, including its size, will be determined according to the on-site requirements.',
      logo: null
    },
    itemPrice: 1500.00,
    quantity: 1,
    total: 1500.00,
    category: 'Network Equipment'
  },
    {
    image: '../images/Product1.jpg',
    description: {
      text: 'Network Rack 10U',
      comment: 'The rack, including its size, will be determined according to the on-site requirements.',
      logo: null
    },
    itemPrice: 1500.00,
    quantity: 1,
    total: 1500.00,
    category: 'Network Equipment'
  },
    {
    image: '../images/Product1.jpg',
    description: {
      text: 'Network Rack 10U',
      comment: 'The rack, including its size, will be determined according to the on-site requirements.',
      logo: null
    },
    itemPrice: 1500.00,
    quantity: 1,
    total: 1500.00,
    category: 'Network Equipment'
  },
    {
    image: '../images/Product1.jpg',
    description: {
      text: 'Network Rack 10U',
      comment: 'The rack, including its size, will be determined according to the on-site requirements.',
      logo: null
    },
    itemPrice: 1500.00,
    quantity: 1,
    total: 1500.00,
    category: 'Network Equipment'
  },
    {
    image: '../images/Product1.jpg',
    description: {
      text: 'Network Rack 10U',
      comment: 'The rack, including its size, will be determined according to the on-site requirements.',
      logo: null
    },
    itemPrice: 1500.00,
    quantity: 1,
    total: 1500.00,
    category: 'Network Equipment'
  },
  {
    image: '../images/Product2.jpg', 
    description: {
      text: 'ac infinity inline duct fans lite',
      comment: 'The exhaust fan, will be determined according to the on-site requirements.',
      logo: null
    },
    itemPrice: 1400.00,
    quantity: 1,
    total: 1400.00,
    category: 'Cooling & Ventilation'
  },
  {
    image: '../images/Product3.jpg',
    description: {
      text: 'Araknis Networks 220-Series Single-WAN Multi Gigabit VPN Router',
      comment: null,
      logo: 'logos/araknis.png'
    },
    itemPrice: 1950.00,
    quantity: 1,
    total: 1950.00,
    category: 'Network Equipment'
  },
  {
    image: '../images/Product4.jpg',
    description: {
      text: 'Instant On Switch 24G Class4 PoE 4SFP/SFP',
      comment: 'ARUBA-1930 24G 195W',
      logo: 'logos/aruba.png'
    },
    itemPrice: 2050.00,
    quantity: 2,
    total: 4100.00,
    category: 'Network Equipment'
  },
  {
    image: '../images/Product5.jpg',
    description: {
      text: 'Indoor Wireless Access Point WIFI 6',
      comment: 'aruba instant on ap22',
      logo: 'logos/aruba.png'
    },
    itemPrice: 1100.00,
    quantity: 4,
    total: 4400.00,
    category: 'Wireless Equipment'
  },
  {
    image: '../images/Product1.jpg',
    description: {
      text: 'Outdoor Wireless Access Point',
      comment: null,
      logo: 'logos/aruba.png'
    },
    itemPrice: 1400.00,
    quantity: 1,
    total: 1400.00,
    category: 'Wireless Equipment'
  },
  {
    image: '../images/Product2.jpg', 
    description: {
      text: 'Network socket',
      comment: null,
      logo: null
    },
    itemPrice: 300.00,
    quantity: 13,
    total: 3900.00,
    category: 'Network Equipment'
  },
  {
    image: '../images/Product3.jpg',
    description: {
      text: null,
      comment: 'CAT6-e',
      logo: null
    },
    itemPrice: 800.00,
    quantity: 1,
    total: 800.00,
    category: 'Network Equipment'
  },
  {
    image: '../images/Product4.jpg',
    description: {
      text: null,
      comment: null,
      logo: 'logos/cisco.png'
    },
    itemPrice: 2500.00,
    quantity: 1,
    total: 2500.00,
    category: 'Network Equipment'
  },
    {
    image: '../images/Product4.jpg',
    description: {
      text: 'Optical Fiber Installation',
      comment: 'Infrastructure • SFT Adapter • Setup',
      logo: null
    },
    itemPrice: 1800.00,
    quantity: 1,
    total: 1800.00,
    category: 'Installation Services'
  },
    {
    image: '../images/Product4.jpg',
    description: 'Smart Home Hub (Legacy Format)',
    itemPrice: 2200.00,
    quantity: 1,
    total: 2200.00,
    category: 'Smart Home'
  },
    {
    image: '../images/Product1.jpg',
    description: {
      text: 'Security Camera System',
      comment: 'Professional grade surveillance with night vision',
      logo: 'logos/hikvision.png'
    },
    itemPrice: 3200.00,
    quantity: 2,
    total: 6400.00,
    category: 'Security Equipment'
  },
    {
    image: '../images/Product1.jpg',
    description: {
      text: null,
      comment: 'Installation and Setup Service',
      logo: null
    },
    itemPrice: 500.00,
    quantity: 1,
    total: 500.00,
    category: 'Installation Services'
  },
    {
    image: '../images/Product1.jpg',
    description: {
      text: null,
      comment: null,
      logo: 'logos/ubiquiti.png'
    },
    itemPrice: 1800.00,
    quantity: 1,
    total: 1800.00,
    category: 'Network Equipment'
  },
  {
    image: '../images/Product5.jpg',
    description: {
      text: 'Enterprise Access Point',
      comment: 'High performance WiFi 6E with advanced features',
      logo: 'logos/ubiquiti.png'
    },
    itemPrice: 1600.00,
    quantity: 3,
    total: 4800.00,
    category: 'Wireless Equipment'
  }
];

export const getTotalForNetwork = () => {
  return products.reduce((sum, product) => sum + product.total, 0);
};

export const getProductsByCategory = (category) => {
  return products.filter(product => product.category === category);
};

export const getUniqueCategories = () => {
  return [...new Set(products.map(product => product.category))];
};

export const getCategoryTotal = (category) => {
  return products
    .filter(product => product.category === category)
    .reduce((sum, product) => sum + product.total, 0);
};