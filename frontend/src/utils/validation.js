const profileValidation = (values) => {
  const errors = {};

  if (!values.fullName) {
    errors.fullName = 'Full Name is required';
  } else if (!/^[A-Za-z\s]+$/.test(values.fullName)) {
    errors.fullName = 'Full name should contain only alphabets and spaces.';
  }

  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Email is invalid.';
  }

  if (!values.mobileNo) {
    errors.mobileNo = 'Mobile Number is required';
  } else if (!/^\d{10}$/.test(values.mobileNo)) {
    errors.mobileNo = 'Mobile number should contain exactly 10 digits.';
  }

  if (!values.address) {
    errors.address = 'Address is required';
  } else if (!/\d/.test(values.address) || !/[A-Za-z]/.test(values.address)) {
    errors.address = 'Address should contain both numbers and text.';
  }

  return errors;
};

export default profileValidation;
