app.post("/checkout", csrfProtection, async (req, res) => {
  const { username, cartItems, totalAmount, couponCode } = req.body;
  const products = JSON.stringify(cartItems);
  const timestamp = new Date().toISOString();
  const method = "COD";

  const userSql = "SELECT username, email FROM users WHERE username = ?";
  db.query(userSql, [username], (userErr, userResult) => {
    if (userErr || userResult.length === 0) {
      return res.status(500).json({ Status: false, Error: "User not found" });
    }

    const { username: uname, email } = userResult[0];

    const applyCoupon = (callback) => {
      if (!couponCode) {
        return callback(null, totalAmount, 0);
      }

      const couponSql = `
        SELECT * FROM coupons
        WHERE code = ? AND username = ? AND is_used = FALSE AND (expiry_date IS NULL OR expiry_date > NOW())
      `;
      db.query(couponSql, [couponCode, uname], (couponErr, couponResults) => {
        if (couponErr) return callback(couponErr);
        if (couponResults.length === 0) {
          return callback(new Error("Invalid or expired coupon."));
        }

        const coupon = couponResults[0];
        let discount = 0;

        if (coupon.discount_type === "percent") {
          discount = (totalAmount * coupon.discount_value) / 100;
        } else {
          discount = coupon.discount_value;
        }

        const finalAmount = Math.max(0, totalAmount - discount);

        db.query("UPDATE coupons SET is_used = TRUE WHERE id = ?", [coupon.id]);

        callback(null, finalAmount, discount);
      });
    };

    applyCoupon((couponErr, finalAmount, discount) => {
      if (couponErr) {
        return res.status(400).json({ Error: couponErr.message });
      }

      const orderSql =
        "INSERT INTO orders (username, products, method, total, timestamp) VALUES (?, ?, ?, ?, ?)";
      const values = [uname, products, method, finalAmount, timestamp];

      db.query(orderSql, values, (err, result) => {
        if (err) {
          return res.json({ Status: false, Error: err });
        }

        logger.info(`User ${uname} has checked out successfully.`, {
          timestamp: new Date().toISOString(),
        });

        const transporter = nodemailer.createTransport({
          service: "gmail",
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
          },
        });

        const currentDate = new Date();
        const dateString = currentDate.toLocaleDateString();
        const timeString = currentDate.toLocaleTimeString();

        const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: "Order Confirmation",
          text: `Dear ${uname},
                  Your order has been placed successfully and is being prepared.

                  Order Details:
                  Date: ${dateString} ${timeString}
                  Payment Amount: ${finalAmount}K
                  Payment Method: Cash on Delivery (COD)

                  If you have questions, contact our support.

                  Thank you for shopping with us!`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
          } else {
            console.log("Email sent:", info.response);
          }
        });

        return res.json({
          status: "Success",
          message: "Order processed successfully",
          discount,
          finalAmount,
        });
      });
    });
  });
});
