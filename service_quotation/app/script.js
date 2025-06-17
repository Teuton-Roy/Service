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

// data populate based on Parking Number
function findQualityInspectionByParkingNumber(parkingNumber) {
  console.log(parkingNumber)
  if (!parkingNumber) {
    console.warn('No Parking Number provided for Quality Inspection');
    return;
  }
  const config2 = {
    appName: "service-management",
    reportName: "All_Quality_Inspections",
    criteria: `(APS_PS_Parking_Number == "${parkingNumber}")`,
    page: 1,
    perPage: 1
  };
  ZOHO.CREATOR.API.getAllRecords(config2).then(function(response) {
    if (response && response.data && response.data.length > 0) {
      const inspectionRecord = response.data[0];
      const inspectionId = inspectionRecord.ID;
      console.log(inspectionId);

      // Fetch full record details using the ID
      ZOHO.CREATOR.API.getRecordById({
        appName: "service-management",
        reportName: "All_Quality_Inspections",
        id: inspectionId,
      }).then(function(detailResponse) {
        if (detailResponse && detailResponse.data) {   
          // Use detailResponse.data as needed  
          console.log(detailResponse.data)
          const productInfoArr = detailResponse.data.Product_Information;           
          if (Array.isArray(productInfoArr)) {
            productInfoArr.forEach(function(product, idx) {
              const displayValue = product.display_value;
              console.log(`Product ${idx + 1} Display Value:`, displayValue);
              const displayParts = displayValue.split(' ');
              console.log(`Product ${idx + 1} Parts:`, displayParts);
              populateProductTable(productInfoArr);
            });
          } else {
            console.log('No Product Information found.');
          }
          // Populate Information Section
          document.getElementById('customerName').value = detailResponse.data.Customer_Name || '';
          document.getElementById('subApsNumber').value = detailResponse.data.Sub_APS_PS_Number ||'';
          document.getElementById('projectName').value = detailResponse.data.Project_Name || '';
          document.getElementById('invoiceNumber').value = detailResponse.data.Invoice_Number || '';
          // Populate Address Fields
          populateAddressFields(detailResponse.data);

        } else {
          console.log('No details found for Quality Inspection ID:', inspectionId);
        }
      }).catch(function(err) {
        console.error('Error fetching Quality Inspection record details:', err);
      });

    } else {
      console.log('No Quality Inspection record found for Parking Number:', parkingNumber);
    }
  }).catch(function(err) {
    console.error('Error fetching Quality Inspection record:', err);
  });
}

// script to populate the Child ESN table
function populateChildEsnTable(parentEsn, allRecords) {
  const tbody = document.getElementById('childEsnTableBody');
  tbody.innerHTML = '';

  // Set APS/PS Parking Number for the first matching record
  const apsParkingInput = document.getElementById('apsParking');
  if (apsParkingInput) {
    const parentRecord = allRecords.find(r => r.Parent_ESN_Number === parentEsn);
    apsParkingInput.value = parentRecord && parentRecord.APS_PS_Parking_Number ? parentRecord.APS_PS_Parking_Number : '';
  }

  findQualityInspectionByParkingNumber(apsParkingInput ? apsParkingInput.value : '');

  if (!parentEsn) {
    addBlankChildEsnRow();
    refreshChildEsnPagination();
    return;
  }
  // Filter records for the selected Parent ESN
  const filtered = allRecords.filter(r => r.Parent_ESN_Number === parentEsn);
  if (filtered.length === 0) {
    addBlankChildEsnRow();
  } else {
    // Get all unique Child ESN Numbers for dropdown
    const childEsnNumbers = [...new Set(filtered.map(rec => rec.Child_ESN_Number))];
    filtered.forEach(function (rec, idx) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="text" name="childParentEsn[]" class="form-control" value="${rec.Parent_ESN_Number || ''}" readonly></td>
        <td>
          <select name="childEsnNumber[]" class="form-control child-esn-select" data-row="${idx}">
            <option value="">Select</option>
            ${childEsnNumbers.map(esn => `<option value="${esn}" ${esn === rec.Child_ESN_Number ? 'selected' : ''}>${esn}</option>`).join('')}
          </select>
        </td>
        <td><input type="text" name="irnNo[]" class="form-control" value="${rec.IRN_Number || ''}" readonly></td>
        <td><input type="datetime-local" name="createdTime[]" class="form-control" value="${rec.Added_Time ? new Date(rec.Added_Time).toISOString().slice(0,16) : ''}" readonly></td>
        <td><input type="checkbox" id="childEsnCheckbox" name="childEsnCheckbox"></td>
      `;
      // <td><button type="button" class="select-row-btn" onclick="onChildEsnRowSelect(this)">Select</button></td>
      tbody.appendChild(tr);
    });
    // Add event listeners to all child ESN selects
    setTimeout(() => {
      document.querySelectorAll('.child-esn-select').forEach(select => {
        select.addEventListener('change', function () {
          onChildEsnRowSelect(this.value, allRecords);
        });
      });
    }, 0);
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
    <td><input type="checkbox" id="childEsnCheckbox" name="childEsnCheckbox"></td>
  `;
  // <td><button type="button" class="select-row-btn" onclick="onChildEsnRowSelect(this)">Select</button></td>
  tbody.appendChild(tr);
}

// Product Information Table Population
function populateProductTable(productInfoArr) {
  const tbody = document.getElementById('productTableBody');
  tbody.innerHTML = ''; // Clear existing rows

  productInfoArr.forEach(function(product) {
    const displayValue = product.display_value;
    const displayParts = displayValue.split(' ');

    // Defensive: check if we have at least 3 parts
    const productName = displayParts[0] || '';
    const quantity = displayParts[1] || '';
    const listPrice = displayParts[2] || '';
    const totalAmount = (parseFloat(quantity) * parseFloat(listPrice)) || 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <select name="productName[]" class="product-lookup">
          <option value="${productName}" selected>${productName}</option>
        </select>
      </td>
      <td><input type="number" name="quantity[]" class="quantity" value="${quantity}" readonly step="0.01"></td>
      <td><input type="number" name="listPrice[]" class="list-price" value="${listPrice}" readonly step="0.01"></td>
      <td><input type="number" name="totalAmount[]" class="total-amount" value="${totalAmount.toFixed(2)}" readonly step="0.01"></td>
    `;
    tbody.appendChild(tr);
  });
  // Update grand total after populating the table
  updateGrandTotal();
}

//Grand Total Calculation
function updateGrandTotal() {
  let grandTotal = 0;
  document.querySelectorAll('input.total-amount').forEach(input => {
    const val = parseFloat(input.value) || 0;
    grandTotal += val;
  });
  document.getElementById('grandTotal').value = grandTotal.toFixed(2);
}

// populate Customer Address Information
function populateAddressFields(data) {
  // Billing Address
  document.getElementById('billingStreet1').value = data.Billing_Street_1 || '';
  document.getElementById('billingStreet2').value = data.Billing_Street_2 || '';
  document.getElementById('billingStreet3').value = data.Billing_Street_3 || '';
  document.getElementById('billingCity').value = data.Billing_City || '';
  document.getElementById('billingPostalCode').value = data.Billing_Postal_Code || '';
  document.getElementById('billingCountry').value = data.Billing_Country || 'India';
  setDropdownValue('billingState', data.Billing_State || '');

  // Shipping Address
  document.getElementById('shippingStreet1').value = data.Shipping_Street_1 || '';
  document.getElementById('shippingStreet2').value = data.Shipping_Street_2 || '';
  document.getElementById('shippingStreet3').value = data.Shipping_Street_3 || '';
  document.getElementById('shippingCity').value = data.Shipping_City || '';
  document.getElementById('shippingPostalCode').value = data.Shipping_Postal_Code || '';
  document.getElementById('shippingCountry').value = data.Shipping_Country || 'India';
  setDropdownValue('shippingState', data.Shipping_State || '');
}

//ensure the dropdown is set only if the value exists
function setDropdownValue(selectId, value) {
  const select = document.getElementById(selectId);
  // Extract code if value is like "MH (Maharashtra)"
  let code = value;
  if (typeof value === 'string' && value.includes('(')) {
    code = value.split(' ')[0];
  }
  if (select && Array.from(select.options).some(opt => opt.value === code)) {
    select.value = code;
    console.log(`Set ${selectId} to`, code);
  } else if (select) {
    select.value = '';
    console.log(`Reset ${selectId} (value not found):`, code);
  }
  if (select) {
    console.log('Available options for', selectId, Array.from(select.options).map(opt => opt.value));
  }
}

// The Reason field will only be visible when "AMC Quotation Status" is set to "Lost".
document.addEventListener('DOMContentLoaded', function () {
  const amcStatus = document.getElementById('amcQuotationStatus');
  const reasonContainer = document.getElementById('reasonContainer');
  if (amcStatus && reasonContainer) {
    amcStatus.addEventListener('change', function () {
      if (this.value === 'Lost') {
        reasonContainer.style.display = '';
      } else {
        reasonContainer.style.display = 'none';
      }
    });
    // Initial check in case of pre-filled value
    if (amcStatus.value === 'Lost') {
      reasonContainer.style.display = '';
    } else {
      reasonContainer.style.display = 'none';
    }
  }
});

