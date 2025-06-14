function copyBillingToShipping() {
  const checkbox = document.getElementById('sameAsBilling');
            
  if (checkbox.checked) {
    document.getElementById('shippingStreet1').value = document.getElementById('billingStreet1').value;
    document.getElementById('shippingStreet2').value = document.getElementById('billingStreet2').value;
    document.getElementById('shippingStreet3').value = document.getElementById('billingStreet3').value;
    document.getElementById('shippingCity').value = document.getElementById('billingCity').value;
    document.getElementById('shippingPostalCode').value = document.getElementById('billingPostalCode').value;
    document.getElementById('shippingState').value = document.getElementById('billingState').value;
    document.getElementById('shippingCountry').value = document.getElementById('billingCountry').value;
  } else {
    document.getElementById('shippingStreet1').value = '';
    document.getElementById('shippingStreet2').value = '';
    document.getElementById('shippingStreet3').value = '';
    document.getElementById('shippingCity').value = '';
    document.getElementById('shippingPostalCode').value = '';
    document.getElementById('shippingState').value = '';
    document.getElementById('shippingCountry').value = 'India';
  }
}

