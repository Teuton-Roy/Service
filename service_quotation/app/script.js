// function for copying billing address to shipping address
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
// Pagination for Child ESN Table
const CHILD_ESN_PAGE_SIZE = 50;
let childEsnCurrentPage = 1;
function getChildEsnRows() {
  return Array.from(document.querySelectorAll('#childEsnTableBody tr'));
}
function showChildEsnPage(page) {
  const rows = getChildEsnRows();
  const totalPages = Math.ceil(rows.length / CHILD_ESN_PAGE_SIZE);
  childEsnCurrentPage = Math.max(1, Math.min(page, totalPages || 1));
  rows.forEach((row, idx) => {
    row.style.display =
      idx >= (childEsnCurrentPage - 1) * CHILD_ESN_PAGE_SIZE &&
      idx < childEsnCurrentPage * CHILD_ESN_PAGE_SIZE
        ? ''
        : 'none';
  });
  document.getElementById('childEsnPageInfo').textContent =
    `Page ${childEsnCurrentPage} of ${totalPages || 1}`;
}
function prevChildEsnPage() {
  showChildEsnPage(childEsnCurrentPage - 1);
}
function nextChildEsnPage() {
  showChildEsnPage(childEsnCurrentPage + 1);
}
// Call this after adding/removing rows
function refreshChildEsnPagination() {
  showChildEsnPage(childEsnCurrentPage);
}
// Initial call on page load
document.addEventListener('DOMContentLoaded', function () {
  refreshChildEsnPagination();
});
// If you have addChildEsnRow/removeChildEsnRow, call refreshChildEsnPagination() after each change

// Initialize Zoho Creator
ZOHO.CREATOR.init().then(async function (data) {
  console.log('Zoho Creator initialized with data:', data);
  
  let QueryParams = ZOHO.CREATOR.UTIL.getQueryParams();
  console.log('Query Parameters:', QueryParams);

  // -- Fetching all ESN records from the "All_ESN" report
  let config1 = {
    appName: "service-management",
    reportName: "All_ESN",
    page: 1,
    perPage: 200,
  }

  ZOHO.CREATOR.API.getAllRecords(config1)
  .then(function (response) {
    let records = response.data
    console.log('All ESN Records:', records);
  })

})
