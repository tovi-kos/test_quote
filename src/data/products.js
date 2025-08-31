export const products = [
  {
    image: '../images/Product1.jpg',
    description: 'Network Rack 10U\nThe rack, including its size, will be determined according to the on-site requirements.',
    itemPrice: 1500.00,
    quantity: 1,
    total: 1500.00,
    category: 'Network Equipment'
  },
  {
    image: '../images/Product2.jpg', 
    description: 'ac infinity inline duct fans lite\nIncludes Temperature and Speed Control\nThe exhaust fan, will be determined according to the on-site requirements.',
    itemPrice: 1400.00,
    quantity: 1,
    total: 1400.00,
    category: 'Cooling & Ventilation'
  },
  {
    image: '../images/Product3.jpg',
    description: 'Araknis Networks 220-Series Single-WAN Multi Gigabit VPN Router',
    itemPrice: 1950.00,
    quantity: 1,
    total: 1950.00,
    category: 'Network Equipment'
  },
  {
    image: '../images/Product4.jpg',
    description: 'Instant On Switch 24G Class4 PoE 4SFP/SFP\nARUBA-1930 24G 195W',
    itemPrice: 2050.00,
    quantity: 2,
    total: 4100.00,
    category: 'Network Equipment'
  },
  {
    image: '../images/Product5.jpg',
    description: 'Indoor Wireless Access Point WIFI 6\naruba instant on ap22',
    itemPrice: 1100.00,
    quantity: 4,
    total: 4400.00,
    category: 'Wireless Equipment'
  },
  {
    image: '../images/Product1.jpg',
    description: 'Network Rack 10U\nThe rack, including its size, will be determined according to the on-site requirements.',
    itemPrice: 1500.00,
    quantity: 1,
    total: 1500.00,
    category: 'Network Equipment'
  },
  {
    image: '../images/Product2.jpg', 
    description: 'ac infinity inline duct fans lite\nIncludes Temperature and Speed Control\nThe exhaust fan, will be determined according to the on-site requirements.',
    itemPrice: 1400.00,
    quantity: 1,
    total: 1400.00,
    category: 'Cooling & Ventilation'
  },
  {
    image: '../images/Product3.jpg',
    description: 'Araknis Networks 220-Series Single-WAN Multi Gigabit VPN Router',
    itemPrice: 1950.00,
    quantity: 1,
    total: 1950.00,
    category: 'Network Equipment'
  },
  {
    image: '../images/Product4.jpg',
    description: 'Instant On Switch 24G Class4 PoE 4SFP/SFP\nARUBA-1930 24G 195W',
    itemPrice: 2050.00,
    quantity: 2,
    total: 4100.00,
    category: 'Network Equipment'
  },
    {
    image: '../images/Product4.jpg',
    description: 'Instant On Switch 24G Class4 PoE 4SFP/SFP\nARUBA-1930 24G 195W',
    itemPrice: 2050.00,
    quantity: 2,
    total: 4100.00,
    category: 'Network Equipment'
  },
    {
    image: '../images/Product4.jpg',
    description: 'Instant On Switch 24G Class4 PoE 4SFP/SFP\nARUBA-1930 24G 195W',
    itemPrice: 2050.00,
    quantity: 2,
    total: 4100.00,
    category: 'Network Equipment'
  },
  {
    image: '../images/Product5.jpg',
    description: 'Indoor Wireless Access Point WIFI 6\naruba instant on ap22',
    itemPrice: 1100.00,
    quantity: 4,
    total: 4400.00,
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