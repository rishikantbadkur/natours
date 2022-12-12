/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
    'pk_test_51MChioSBiOYszpYHjZ7j673KPNVyEGzoLXBzKSDrTlXvWRO8u4nLCFSjf9v8HnZEXTZfCjwERKdVHDiLmXhCR6pj00sOBiLlT8'
  );

export const bookTour = async (tourId) => {
  
  try {
    console.log(stripe);
    // Get the checkout session from API..
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);

    // Create checkout form + chargen credit card

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
