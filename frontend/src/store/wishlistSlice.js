import { createSlice } from '@reduxjs/toolkit';

const wishlistString = localStorage.getItem('hommey_wishlist');
let wishlistItems = [];
try {
  if (wishlistString) {
    wishlistItems = JSON.parse(wishlistString);
  }
} catch (e) {
  console.error('Failed to parse localStorage wishlist data:', e);
}

const initialState = {
  items: wishlistItems // Array of cake records
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist: (state, action) => {
      const cake = action.payload;
      const existsIndex = state.items.findIndex(item => item.id === cake.id);

      if (existsIndex > -1) {
        // Remove
        state.items = state.items.filter(item => item.id !== cake.id);
      } else {
        // Add
        state.items.push(cake);
      }

      localStorage.setItem('hommey_wishlist', JSON.stringify(state.items));
    },
    clearWishlist: (state) => {
      state.items = [];
      localStorage.removeItem('hommey_wishlist');
    }
  }
});

export const { toggleWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
