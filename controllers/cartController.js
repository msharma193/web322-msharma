const Rental = require('../model/rentals-db');
const express = require('express');
const Cart = require('../model/cart');
const router = express.Router();

function requireCustomer(req, res, next) {
  if (req.session?.userData?.userType === 'Customer') {
    next();
  } else {
    // res.status(401).send('Unauthorized');
    res.render("error-page", { ErrorMessage: "You are not allowed to access this page" });
  }
}


router.post('/add', requireCustomer, async (req, res) => {
  nights = 1;

  try {
    const { rentalId } = req.body;
    const cart = await Cart.findOne({ user: req.session.userData.id });


    if (!cart) {
      const newCart = new Cart({
        user: req.session.userData.id,
        rentals: [{ rental: rentalId, nights }]
      });
      await newCart.save();
      // return res.status(201).json({ message: 'Rental added to cart' });
      return res.redirect("rentals")

    }

    const rentalIndex = cart.rentals.findIndex(item => item.rental == rentalId);

    if (rentalIndex !== -1) {
      cart.rentals[rentalIndex].nights += nights;
    } else {
      cart.rentals.push({ rental: rentalId, nights });
    }

    await cart.save();
    // return res.status(200).json({ message: 'Rental added to cart' });
    return res.redirect("/rentals")
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/update/:id', requireCustomer, async (req, res) => {
  const { id } = req.params;
  const { nights } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.session.userData.id });
    if (!cart) {
      // return res.status(404).json({ message: 'Cart not found' });
      res.redirect("/cart");
    }

    const rentalIndex = cart.rentals.findIndex(item => item._id == id);
    if (rentalIndex === -1) {
      // return res.status(404).json({ message: 'Rental not found in cart' });
      res.redirect("/cart");

    }

    cart.rentals[rentalIndex].nights = nights;
    await cart.save();

    // return res.status(200).json({ message: 'Rental updated successfully' });
    res.redirect("/cart");

  } catch (error) {
    console.error(error);
    // return res.status(500).json({ message: 'Internal server error' });
    res.redirect("/cart");

  }
});


// Remove a rental from the cart
router.post('/remove/:id', requireCustomer, async (req, res) => {
  const { id } = req.params;

  try {
    let rentalId = id;
    const cart = await Cart.findOne({ user: req.session.userData.id });

    if (!cart) {
      // return res.status(404).json({ message: 'Cart not found' });
      res.redirect("/cart");

    }

    const rentalIndex = cart.rentals.findIndex(item => item.rental == rentalId);

    if (rentalIndex !== -1) {
      cart.rentals.splice(rentalIndex, 1);
      await cart.save();
      // return res.status(200).json({ message: 'Rental removed from cart' });
      return res.redirect("cart")

    } else {
      // return res.status(404).json({ message: 'Rental not found in cart' });
      res.redirect("/cart");

    }
  } catch (error) {
    console.error(error);
    // return res.status(500).json({ message: 'Internal server error' });
    res.redirect("/cart");

  }
});

// Get the user's cart
router.get('/', requireCustomer, async (req, res) => {
  try {
    // const cart = await Cart.find({});
    const cart = await Cart.find({ user: req.session.userData.id }).populate('rentals.rental');

    const allRentals = [];

    cart.forEach((item) => {
      item.rentals.forEach((rental) => {
        allRentals.push(rental);
      });
    });

    let rentals = JSON.parse(JSON.stringify(allRentals));

    // return res.status(200).json(cart);
    res.render("cart", { rentalsInCart: rentals });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;
