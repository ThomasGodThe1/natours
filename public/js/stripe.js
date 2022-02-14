/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51KRIa2ANObgZGC8NhPJzKTjSj6mt0h8DVfEDtm83T6GpymnTwa9OIOIM6glRHi7oy8LhG0GBjPWqM0Svj0NCJYXe003WyDXre6'
);

export const bookTour = async tourId => {
  try {
    // 1) Get checkout Session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    // 2) Create chechkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    // console.log(err);
    showAlert('error', err);
  }
};
