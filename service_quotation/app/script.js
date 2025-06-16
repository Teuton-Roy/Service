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

  // -- Fetching all ESN records from the "All_ESN"
  let paging = [1,2,3,4,5,6,7,8,9,10];
  let allRecords = [];
  let requests = [];
  for (let i = 0; i < paging.length; i++) {
    let config1 = {
      appName: "service-management",
      reportName: "All_ESN",
      page: paging[i],
      perPage: 200,
    }
    requests.push(
      ZOHO.CREATOR.API.getAllRecords(config1)
        .then(function (response) {
          if (response && response.data) {
            return response.data;
          } else {
            return [];
          }
        })
        .catch(function (err) {
          // If error is "No Data Available", just return empty array
          if (
            err &&
            err.responseText &&
            err.responseText.includes("No Data Available")
          ) {
            return [];
          } else {
            console.error("API error:", err);
            return [];
          }
        })
    );
  }
  Promise.all(requests).then(function (results) {
    // Flatten all records into one array
    results.forEach(function (records) {
      allRecords = allRecords.concat(records);
    });
    console.log('All ESN Records:', allRecords);
    
    //Find distinct Parent ESN Numbers
    let visited = []
    let distinctParentESN = []
    for (let i = 0; i < allRecords.length; i++){
      let parentESN = allRecords[i].Parent_ESN_Number;
      if(parentESN && visited.indexOf(parentESN) === -1){
        visited.push(parentESN);
        distinctParentESN.push(parentESN);
      }
    }
    console.log('Distinct Parent ESN Numbers:', distinctParentESN);
    populateParentEsnDropdown(distinctParentESN); // Populate the dropdown with distinct Parent ESN Numbers
    // Add event listener to the Parent ESN dropdown
    const parentEsnSelect = document.getElementById('parentESN');
    if (parentEsnSelect) {
      parentEsnSelect.addEventListener('change', function () {
        populateChildEsnTable(this.value, allRecords);
      });
    }
    console.log(populateChildEsnTable);
  });
});
// function to populate the dropdown
function populateParentEsnDropdown(distinctParentESN) {
  const select = document.getElementById('parentESN');
  if (!select) return;
  // Remove existing options except the first
  select.length = 1;
  distinctParentESN.forEach(function(esn) {
    const option = document.createElement('option');
    option.value = esn;
    option.textContent = esn;
    select.appendChild(option);
  });
}
// script to populate the Child ESN table
function populateChildEsnTable(parentEsn, allRecords) {
  const tbody = document.getElementById('childEsnTableBody');
  tbody.innerHTML = '';
  if (!parentEsn) {
    // If nothing selected, show a blank row
    addBlankChildEsnRow();
    refreshChildEsnPagination();
    return;
  }
  // Filter records for the selected Parent ESN
  const filtered = allRecords.filter(r => r.Parent_ESN_Number === parentEsn);
  if (filtered.length === 0) {
    addBlankChildEsnRow();
  } else {
    filtered.forEach(function (rec) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="text" name="childParentEsn[]" class="form-control" value="${rec.Parent_ESN_Number || ''}" readonly></td>
        <td><input type="text" name="childEsnNumber[]" class="form-control" value="${rec.Child_ESN_Number || ''}" readonly></td>
        <td><input type="text" name="irnNo[]" class="form-control" value="${rec.IRN_Number || ''}" readonly></td>
        <td><input type="datetime-local" name="createdTime[]" class="form-control" value="${rec.Added_Time ? new Date(rec.Added_Time).toISOString().slice(0,16) : ''}" readonly></td>
        <td><button type="button" class="remove-row-btn" onclick="removeChildEsnRow(this)">Remove</button></td>
      `;
      tbody.appendChild(tr);
    });
  }
  refreshChildEsnPagination();
}

function addBlankChildEsnRow() {
  const tbody = document.getElementById('childEsnTableBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" name="childParentEsn[]" class="form-control"></td>
    <td><input type="text" name="childEsnNumber[]" class="form-control"></td>
    <td><input type="text" name="irnNo[]" class="form-control"></td>
    <td><input type="datetime-local" name="createdTime[]" class="form-control"></td>
    <td><button type="button" class="remove-row-btn" onclick="removeChildEsnRow(this)">Remove</button></td>
  `;
  tbody.appendChild(tr);
}