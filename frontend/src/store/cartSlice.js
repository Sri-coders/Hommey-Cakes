import { createSlice } from '@reduxjs/toolkit';

const cartItemsString = localStorage.getItem('hommey_cart');
let cartItems = [];
try {
  if (cartItemsString) {
    cartItems = JSON.parse(cartItemsString);
  }
} catch (e) {
  console.error('Failed to parse localStorage cart data:', e);
}

const initialState = {
  items: cartItems,
  coupon: null, // { code, discountType, discountValue }
  discount: 0.00
};

const calculateTotals = (items, coupon) => {
  let subtotal = 0.00;
  items.forEach(item => {
    const activePrice = item.discountPrice ? parseFloat(item.discountPrice) : parseFloat(item.price);
    subtotal += activePrice * item.quantity;
  });

  let discount = 0.00;
  if (coupon) {
    if (coupon.discountType === 'Percentage') {
      discount = (parseFloat(coupon.discountValue) / 100) * subtotal;
    } else {
      discount = parseFloat(coupon.discountValue);
    }
  }

  return {
    subtotal: subtotal.toFixed(2),
    discount: Math.min(subtotal, discount).toFixed(2),
    total: Math.max(0.00, subtotal - discount).toFixed(2)
  };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { cakeId, name, price, discountPrice, imageUrl, quantity, weight, eggless, shape, flavor, stockQuantity } = action.payload;
      
      // Match duplicate with exact weight, eggless, shape, and flavor parameters
      const existingIndex = state.items.findIndex(
        item => item.cakeId === cakeId && item.weight === weight && item.eggless === eggless && item.shape === shape && item.flavor === flavor
      );

      if (existingIndex > -1) {
        // Increment quantity up to stock limit
        const nextQty = state.items[existingIndex].quantity + quantity;
        state.items[existingIndex].quantity = Math.min(nextQty, stockQuantity || 99);
      } else {
        state.items.push({
          cakeId,
          name,
          price,
          discountPrice,
          imageUrl,
          quantity,
          weight: weight || 1.00,
          eggless: eggless !== undefined ? eggless : true,
          shape: shape || 'Round',
          flavor: flavor || 'Standard',
          stockLimit: stockQuantity || 99
        });
      }

      localStorage.setItem('hommey_cart', JSON.stringify(state.items));
      
      // Re-evaluate discount if coupon active
      const totals = calculateTotals(state.items, state.coupon);
      state.discount = parseFloat(totals.discount);
    },
    removeFromCart: (state, action) => {
      const { cakeId, weight, eggless, shape, flavor } = action.payload;
      state.items = state.items.filter(
        item => !(item.cakeId === cakeId && item.weight === weight && item.eggless === eggless && item.shape === shape && item.flavor === flavor)
      );
      localStorage.setItem('hommey_cart', JSON.stringify(state.items));
      
      // Re-evaluate totals
      if (state.items.length === 0) {
        state.coupon = null;
        state.discount = 0.00;
      } else {
        const totals = calculateTotals(state.items, state.coupon);
        state.discount = parseFloat(totals.discount);
      }
    },
    updateQuantity: (state, action) => {
      const { cakeId, weight, eggless, shape, flavor, quantity } = action.payload;
      const index = state.items.findIndex(
        item => item.cakeId === cakeId && item.weight === weight && item.eggless === eggless && item.shape === shape && item.flavor === flavor
      );

      if (index > -1) {
        state.items[index].quantity = Math.max(1, Math.min(quantity, state.items[index].stockLimit));
      }

      localStorage.setItem('hommey_cart', JSON.stringify(state.items));

      const totals = calculateTotals(state.items, state.coupon);
      state.discount = parseFloat(totals.discount);
    },
    applyCoupon: (state, action) => {
      state.coupon = action.payload; // action.payload = { code, discountType, discountValue }
      const totals = calculateTotals(state.items, state.coupon);
      state.discount = parseFloat(totals.discount);
    },
    removeCoupon: (state) => {
      state.coupon = null;
      state.discount = 0.00;
    },
    clearCart: (state) => {
      state.items = [];
      state.coupon = null;
      state.discount = 0.00;
      localStorage.removeItem('hommey_cart');
    }
  }
});

export const { addToCart, removeFromCart, updateQuantity, applyCoupon, removeCoupon, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
export { calculateTotals };
