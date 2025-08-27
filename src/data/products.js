export const products = [
  {
    image: '/images/Product1.jpg',
    description: 'Network Rack 10U\nThe rack, including its size, will be determined according to the on-site requirements.',
    itemPrice: 1500.00,
    quantity: 1,
    total: 1500.00
  },
  {
    image: '/images/Product2.jpg', 
    description: 'ac infinity inline duct fans lite\nIncludes Temperature and Speed Control\nThe exhaust fan, will be determined according to the on-site requirements.',
    itemPrice: 1400.00,
    quantity: 1,
    total: 1400.00
  },
  {
    image: '/images/Product3.jpg',
    description: 'Araknis Networks 220-Series Single-WAN Multi Gigabit VPN Router',
    itemPrice: 1950.00,
    quantity: 1,
    total: 1950.00
  },
  {
    image: '/images/Product4.jpg',
    description: 'Instant On Switch 24G Class4 PoE 4SFP/SFP\nARUBA-1930 24G 195W',
    itemPrice: 2050.00,
    quantity: 2,
    total: 4100.00
  },
  {
    image: '/images/Product5.jpg',
    description: 'Indoor Wireless Access Point WIFI 6\naruba instant on ap22',
    itemPrice: 1100.00,
    quantity: 4,
    total: 4400.00
  }
];

export const getTotalForNetwork = () => {
  return products.reduce((sum, product) => sum + product.total, 0);
};