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

document.addEventListener('DOMContentLoaded', function () {
  refreshChildEsnPagination();
  // Initialize Select2 for Parent ESN dropdown
  if (window.jQuery && $('#parentESN').length) {
    $('#parentESN').select2({
      placeholder: "Select or search Parent ESN Number",
      allowClear: true,
      width: 'resolve'
    });
  }
});

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
      let parentId = allRecords[i].ID;
      if(parentESN && visited.indexOf(parentESN) === -1){
        visited.push(parentESN);
        distinctParentESN.push(parentESN);
        // distinctParentESN.push(parentId);
      }
    }
    console.log('Distinct Parent ESN Numbers:', distinctParentESN);
    populateParentEsnDropdown(distinctParentESN); // Populate the dropdown with distinct Parent ESN Numbers
    // Add event listener to the Parent ESN dropdown
    const parentEsnSelect = document.getElementById('parentESN');
    // if (parentEsnSelect) {
    //   parentEsnSelect.addEventListener('change', function () {
    //     populateChildEsnTable(this.value, allRecords);
    //   });
    // }
    if (window.jQuery && $('#parentESN').length) {
      $('#parentESN').on('change', function () {
        populateChildEsnTable(this.value, allRecords);
      });
    }
  });

  window.distinctParentEsnWithIds = [];
  for (let i = 0; i < allRecords.length; i++) {
    let parentESN = allRecords[i].Parent_ESN_Number;
    let parentId = allRecords[i].ID;
    if (parentESN && !window.distinctParentEsnWithIds.some(e => e.Parent_ESN_Number === parentESN)) {
      window.distinctParentEsnWithIds.push({
        Parent_ESN_Number: parentESN,
        ID: parentId
      });
    }
  }

  let config2 = {
    appName: "service-management",
    reportName: "All_Service_Quotation",
  }
  ZOHO.CREATOR.API.getAllRecords(config2).then(function (response) {
    if (response && response.data) {
      console.log('Service Quotation Records:', response.data);
    }
  })

  document.getElementById('serviceQuotationForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent default form submission

    // AMC End Date validation
    const amcStartDate = document.getElementById('amcStartDate').value;
    const amcEndDate = document.getElementById('amcEndDate').value;
    if (amcStartDate && amcEndDate && amcEndDate <= amcStartDate) {
      alert('AMC End Date must be after the AMC Start Date.');
      document.getElementById('amcEndDate').value = '';
      return;
    }

    // Clear previous error message
    const errorDiv = document.getElementById('formErrorMsg');
    if (errorDiv) errorDiv.textContent = '';

    const formData = buildFormData();
    console.log("Submit Data: ",formData);

    var config = {
      appName: "service-management",
      formName: "Service_Quotation", // Replace with your actual form name
      data: formData
    };

    ZOHO.CREATOR.API.addRecord(config).then(function(response){
      if(response.code == 3000){
        console.log();
        console.log("Record added successfully");
        // Optionally, show a success message or reset the form here
        if (errorDiv) {
          errorDiv.style.color = 'green';
          errorDiv.textContent = "Record added successfully!";
        }
      } else {
        console.error("Failed to add record:", response);
        if (errorDiv) {
          errorDiv.style.color = 'red';
          errorDiv.textContent = "Failed to add record. Please check your input and try again.";
        }
      }
    }).catch(function(err) {
      console.error("API error:", err);
      if (errorDiv) {
        errorDiv.style.color = 'red';
        errorDiv.textContent = "API error occurred. Please try again later.";
      }
    });
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

  if (window.jQuery && $('#parentESN').data('select2')) {
    $('#parentESN').trigger('change.select2');
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
      // console.log(inspectionId);

      // Fetch full record details using the ID
      ZOHO.CREATOR.API.getRecordById({
        appName: "service-management",
        reportName: "All_Quality_Inspections",
        id: inspectionId,
      }).then(function(detailResponse) {
        if (detailResponse && detailResponse.data) {   
          // Use detailResponse.data as needed  
          console.log("Quality Inspection data: ",detailResponse.data)
          let ID = detailResponse.data.ID;
          console.log(ID);
          
          const productInfoArr = detailResponse.data.Product_Information;           
          if (Array.isArray(productInfoArr)) {
            productInfoArr.forEach(function(product, idx) {
              const displayValue = product.display_value;
              const productId = product.ID; // Fetch the product ID
              console.log(`Product ${idx + 1} ID:`, productId);
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

          // const formData = getParentEsnFormData();
          // console.log('All Form Data:', formData);
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

  const apsParkingInput = document.getElementById('apsParking');
  if (apsParkingInput) {
    const parentRecord = allRecords.find(r => r.Parent_ESN_Number === parentEsn);
    // If APS_PS_Parking_Number is a lookup, use its ID
    if (parentRecord && parentRecord.APS_PS_Parking_Number && typeof parentRecord.APS_PS_Parking_Number === 'object') {
      apsParkingInput.value = parentRecord.APS_PS_Parking_Number.ID || '';
    } else if (parentRecord && parentRecord.APS_PS_Parking_Number) {
      // Fallback to value if not an object
      apsParkingInput.value = parentRecord.APS_PS_Parking_Number;
    } else {
      apsParkingInput.value = '';
    }
    console.log(apsParkingInput);
  }

  if (!parentEsn) {
    clearAllInfoSections();
    addBlankChildEsnRow();
    refreshChildEsnPagination();
    return;
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
        <td><input type="checkbox" class="childEsnCheckbox" name="childEsnCheckbox"></td>
        <td><input type="text" name="childParentEsn[]" class="form-control" value="${rec.Parent_ESN_Number || ''}" readonly></td>
        <td><input type="text" name="childEsnNumber[]" class="form-control" value="${rec.Child_ESN_Number || ''}" readonly></td>
        <td><input type="text" name="irnNo[]" class="form-control" value="${rec.IRN_Number || ''}" readonly></td>
        <td><input type="datetime-local" name="createdTime[]" class="form-control" value="${rec.Added_Time ? new Date(rec.Added_Time).toISOString().slice(0,16) : ''}" readonly></td>
      `;
      // <td><button type="button" class="select-row-btn" onclick="onChildEsnRowSelect(this)">Select</button></td>
      // <td><input type="checkbox" id="childEsnCheckbox" name="childEsnCheckbox"></td>
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
    <td><input type="checkbox" class="childEsnCheckbox" name="childEsnCheckbox"></td>
    <td><input type="text" name="childParentEsn[]" class="form-control"></td>
    <td><input type="text" name="childEsnNumber[]" class="form-control"></td>
    <td><input type="text" name="irnNo[]" class="form-control"></td>
    <td><input type="datetime-local" name="createdTime[]" class="form-control"></td>
  `;
  // <td><input type="checkbox" id="childEsnCheckbox" name="childEsnCheckbox"></td>
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
  let code = value;
  if (typeof value === 'string' && value.includes('(')) {
    code = value.split(' ')[0];
  }
  if (select && Array.from(select.options).some(opt => opt.value === code)) {
    select.value = code;
    select.disabled = true;
    console.log(`Set ${selectId} to`, code);
  } else if (select) {
    select.value = '';
    select.disabled = true;
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

// auto-fetch the AMC Rate based on the selected System Type and AMC Type
document.addEventListener('DOMContentLoaded', function () {
  const systemType = document.getElementById('systemType');
  const amcType = document.getElementById('amcType');
  const amcRate = document.getElementById('amcRate');

  function fetchAmcRate() {
    const systemTypeVal = systemType.value;
    const amcTypeVal = amcType.value;
    if (!systemTypeVal || !amcTypeVal) {
      amcRate.value = '';
      return;
    }
    console.log(systemTypeVal, amcTypeVal);
    
    // Adjust field names below to match your Pricebook Master API field names
    const config = {
      appName: "service-management",
      reportName: "All_Pricebook_Masters",
      criteria: `(System_Type == "${systemTypeVal}")`,
      page: 1,
      perPage: 1
    };

    ZOHO.CREATOR.API.getAllRecords(config).then(function (response) {   
      console.log('API Response:', response);
      if (response && response.data && response.data.length > 0) {
        const record = response.data[0];
        console.log(record);
        let rate = '';
        if (amcTypeVal === 'Gold') {
          rate = record.Minimum_AMC_Rate_For_Gold_Contract;
        } else if (amcTypeVal === 'Silver') {
          rate = record.Minimum_AMC_Rate_For_Silver_Contract;
        } else if (amcTypeVal === 'Platinum') {
          rate = record.Minimum_AMC_Rate_For_Platinum_Contract;
        }
        amcRate.value = rate || '';
        console.log(`AMC Rate for ${amcTypeVal}:`, rate);
      } else {
        amcRate.value = '';
      }
    }).catch(function (err) {
      amcRate.value = '';
      console.error('Error fetching AMC Rate:', err);
    });
  }

  if (systemType && amcType) {
    systemType.addEventListener('change', fetchAmcRate);
    amcType.addEventListener('change', fetchAmcRate);
  }
});

// prevent users from selecting a date before today in the AMC Start Date field
document.addEventListener('DOMContentLoaded', function () {
  const amcStartDate = document.getElementById('amcStartDate');
  if (amcStartDate) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const minDate = `${yyyy}-${mm}-${dd}`;
    amcStartDate.setAttribute('min', minDate);
  }
});


// clear the Information section, Product Information, Grand Total, and Customer Address Information when the Parent ESN Number is not selected
function clearAllInfoSections() {
  // Information Section
  document.getElementById('customerName').value = '';
  document.getElementById('subApsNumber').value = '';
  document.getElementById('projectName').value = '';
  document.getElementById('invoiceNumber').value = '';

  // Product Information Table
  const productTableBody = document.getElementById('productTableBody');
  if (productTableBody) productTableBody.innerHTML = '';

  // Grand Total
  document.getElementById('grandTotal').value = '';

  // Customer Address Information
  document.getElementById('billingStreet1').value = '';
  document.getElementById('billingStreet2').value = '';
  document.getElementById('billingStreet3').value = '';
  document.getElementById('billingCity').value = '';
  document.getElementById('billingPostalCode').value = '';
  document.getElementById('billingCountry').value = 'India';
  setDropdownValue('billingState', '');

  document.getElementById('shippingStreet1').value = '';
  document.getElementById('shippingStreet2').value = '';
  document.getElementById('shippingStreet3').value = '';
  document.getElementById('shippingCity').value = '';
  document.getElementById('shippingPostalCode').value = '';
  document.getElementById('shippingCountry').value = 'India';
  setDropdownValue('shippingState', '');
}

function resetFormAndTables() {
  // Reset the form
  document.getElementById('serviceQuotationForm').reset();

  // Clear Child ESN Numbers table
  const childEsnTableBody = document.getElementById('childEsnTableBody');
  if (childEsnTableBody) childEsnTableBody.innerHTML = '';

  // Clear Parent ESN dropdown
  const parentEsnSelect = document.getElementById('parentESN');
  if (parentEsnSelect) {
    parentEsnSelect.value = '';
    if (window.jQuery && $(parentEsnSelect).data('select2')) {
      $(parentEsnSelect).val('').trigger('change');
    }
  }
  console.log('Form and tables reset');

  // Optionally, add a blank row if needed
  addBlankChildEsnRow();

  // Reset pagination
  refreshChildEsnPagination();

  // Clear other sections if needed
  clearAllInfoSections();
}

// Attach to your Reset button
document.addEventListener('DOMContentLoaded', function () {
  const resetBtn = document.getElementById('resetBtn'); // Use your actual Reset button ID
  if (resetBtn) {
    resetBtn.addEventListener('click', function (e) {
      e.preventDefault(); // Prevent default form reset if needed
      resetFormAndTables();
    });
  }
});

// Select Child ESN Number from the table on click of checkbox
document.addEventListener('DOMContentLoaded', function () {
  const childEsnTableBody = document.getElementById('childEsnTableBody');
  if (childEsnTableBody) {
    childEsnTableBody.addEventListener('change', function(e) {
      if (e.target && e.target.classList.contains('childEsnCheckbox')) {
        const row = e.target.closest('tr');
        if (row) {
          const childEsnInput = row.querySelector('input[name="childEsnNumber[]"]');
          if (childEsnInput) {
            console.log('Selected Child ESN Number:', childEsnInput.value);
          }
        }
      }
    });
  }
});


// fetch all data from the form fields
// function getParentEsnFormData() {
//   const products = [];
//   document.querySelectorAll('#productTableBody tr').forEach(row => {
//     const productNameInput = row.querySelector('select[name="productName[]"]');
//     const quantityInput = row.querySelector('input[name="quantity[]"]');
//     if (productNameInput && quantityInput) {
//       products.push({
//         Product_Name: productNameInput.value,
//         Quantity: quantityInput.value
//       });
//     }
//   });
//   // Get selected Child ESN Numbers
//   const selectedChildEsnNumbers = getSelectedChildEsnNumbers();

//   return {
//     Customer_Name: document.getElementById('customerName').value,
//     Sub_APS_PS_Number: document.getElementById('subApsNumber').value,
//     Project_Name: document.getElementById('projectName').value,
//     Invoice_Number: document.getElementById('invoiceNumber').value,
//     APS_PS_Parking_Number: document.getElementById('apsParking') ? document.getElementById('apsParking').value : '',
//     Billing_Street_1: document.getElementById('billingStreet1').value,
//     Billing_Street_2: document.getElementById('billingStreet2').value,
//     Billing_Street_3: document.getElementById('billingStreet3').value,
//     Billing_City: document.getElementById('billingCity').value,
//     Billing_Postal_Code: document.getElementById('billingPostalCode').value,
//     Billing_Country: document.getElementById('billingCountry').value,
//     Billing_State: document.getElementById('billingState').value,
//     Shipping_Street_1: document.getElementById('shippingStreet1').value,
//     Shipping_Street_2: document.getElementById('shippingStreet2').value,
//     Shipping_Street_3: document.getElementById('shippingStreet3').value,
//     Shipping_City: document.getElementById('shippingCity').value,
//     Shipping_Postal_Code: document.getElementById('shippingPostalCode').value,
//     Shipping_Country: document.getElementById('shippingCountry').value,
//     Shipping_State: document.getElementById('shippingState').value,
//     Grand_Total: document.getElementById('grandTotal').value,
//     // Add more fields as needed, except Child_ESN_Number

//     System_Type: document.getElementById('systemType') ? document.getElementById('systemType').value : '',
//     AMC_Type: document.getElementById('amcType') ? document.getElementById('amcType').value : '',
//     AMC_Rate: document.getElementById('amcRate') ? document.getElementById('amcRate').value : '',
//     System_Quantity: document.getElementById('systemQuantity') ? document.getElementById('systemQuantity').value : '',
//     AMC_Start_Date: document.getElementById('amcStartDate') ? document.getElementById('amcStartDate').value : '',
//     AMC_End_Date: document.getElementById('amcEndDate') ? document.getElementById('amcEndDate').value : '',
//     Billing_Schedule: document.getElementById('billingSchedule') ? document.getElementById('billingSchedule').value : '',
//     Sales_Person_Name: document.getElementById('salesPersonName') ? document.getElementById('salesPersonName').value : '',
//     Payment_Term: document.getElementById('paymentTerm') ? document.getElementById('paymentTerm').value : '',
//     Last_AMC_Contract_Date: document.getElementById('lastAmcContractDate') ? document.getElementById('lastAmcContractDate').value : '',
//     Installation_Date: document.getElementById('installationDate') ? document.getElementById('installationDate').value : '',
//     Last_Contract_Date: document.getElementById('lastContractDate') ? document.getElementById('lastContractDate').value : '',
//     Last_AMC_Order_Rate: document.getElementById('lastAmcOrderRate') ? document.getElementById('lastAmcOrderRate').value : '',

//     Product_Information: products,
//     Selected_Child_ESN_Numbers: selectedChildEsnNumbers
//   };
// }
// function getSelectedChildEsnNumbers() {
//   const selected = [];
//   document.querySelectorAll('#childEsnTableBody .childEsnCheckbox:checked').forEach(checkbox => {
//     const row = checkbox.closest('tr');
//     if (row) {
//       const esnInput = row.querySelector('input[name="childEsnNumber[]"]');
//       if (esnInput) {
//         selected.push(esnInput.value);
//       }
//     }
//   });
//   return selected;
// }
//   document.getElementById('serviceQuotationForm').addEventListener('submit', function(e) {
//     e.preventDefault(); // Prevent default form submission
//     const formData = getParentEsnFormData();
//     console.log('Form Data to submit:', formData);
//       // Now you can use formData for your API call or further processing
// });


function buildFormData() {
  const parentEsnSelect1 = document.getElementById('parentESN');
  let apsParkingId = '';
  if (parentEsnSelect1 && window.allRecords) {
    const parentRecord = window.allRecords.find(r => r.Parent_ESN_Number === parentEsnSelect1.value);
    if (parentRecord && parentRecord.APS_PS_Parking_Number) {
      if (typeof parentRecord.APS_PS_Parking_Number === 'object') {
        apsParkingId = parentRecord.APS_PS_Parking_Number.ID || '';
      } else {
        apsParkingId = parentRecord.APS_PS_Parking_Number;
      }
    }
  }

  const parentEsnSelect = document.getElementById('parentESN');
  let parentEsnObj = '';
  if (parentEsnSelect && window.distinctParentEsnWithIds) {
    const selectedDisplayValue = parentEsnSelect.value;
    const found = window.distinctParentEsnWithIds.find(
      esn => esn.Parent_ESN_Number === selectedDisplayValue
    );
    if (found) {
      parentEsnObj = {
        ID: found.ID,
        display_value: found.Parent_ESN_Number
      };
    }
  }

  // Product Information
  const products = [];
  document.querySelectorAll('#productTableBody tr').forEach(row => {
    const productNameInput = row.querySelector('select[name="productName[]"]');
    const quantityInput = row.querySelector('input[name="quantity[]"]');
    if (productNameInput && quantityInput) {
      products.push({
        Product_Name: productNameInput.value,
        Quantity: quantityInput.value
      });
    }
  });

  // Selected Child ESN Numbers
  const selectedChildEsnNumbers = [];
  document.querySelectorAll('#childEsnTableBody .childEsnCheckbox:checked').forEach(checkbox => {
    const row = checkbox.closest('tr');
    if (row) {
      const esnInput = row.querySelector('input[name="childEsnNumber[]"]');
      if (esnInput) {
        selectedChildEsnNumbers.push(esnInput.value);
      }
    }
  });

  // Build the formData object
  const formData = {
    data: {
      // Parent_ESN_Number: document.getElementById('parentESN') ? document.getElementById('parentESN').value : '',
      Parent_ESN_Number: parentEsnObj,
      // APS_PS_Parking_Number: document.getElementById('apsParking') ? document.getElementById('apsParking').value : '',
      APS_PS_Parking_Number: apsParkingId,
      System_Type: document.getElementById('systemType') ? document.getElementById('systemType').value : '',
      AMC_Type: document.getElementById('amcType') ? document.getElementById('amcType').value : '',
      AMC_Rate: document.getElementById('amcRate') ? document.getElementById('amcRate').value : '',
      System_Quantity: document.getElementById('systemQuantity') ? document.getElementById('systemQuantity').value : '',
      AMC_Start_Date: document.getElementById('amcStartDate') ? document.getElementById('amcStartDate').value : '',
      AMC_End_Date: document.getElementById('amcEndDate') ? document.getElementById('amcEndDate').value : '',
      Billing_Schedule: document.getElementById('billingSchedule') ? document.getElementById('billingSchedule').value : '',
      AMC_Quotation_Status: document.getElementById('amcQuotationStatus') ? document.getElementById('amcQuotationStatus').value : '',
      Sales_Person_Name: document.getElementById('salesPersonName') ? document.getElementById('salesPersonName').value : '',
      Payment_Term: document.getElementById('paymentTerm') ? document.getElementById('paymentTerm').value : '',
      Last_AMC_Contract_Date: document.getElementById('lastAmcContractDate') ? document.getElementById('lastAmcContractDate').value : '',
      Installation_Date: document.getElementById('installationDate') ? document.getElementById('installationDate').value : '',
      Last_Contract_Date: document.getElementById('lastContractDate') ? document.getElementById('lastContractDate').value : '',
      Last_AMC_Order_Rate: document.getElementById('lastAmcOrderRate') ? document.getElementById('lastAmcOrderRate').value : '',
      
      Customer_Name: document.getElementById('customerName').value,
      Sub_APS_PS_Number: document.getElementById('subApsNumber').value,
      Project_Name: document.getElementById('projectName').value,
      Invoice_Number: document.getElementById('invoiceNumber').value,

      Child_ESN_Numbers: selectedChildEsnNumbers, 
      Product_Information: products,
      
      Billing_Street_1: document.getElementById('billingStreet1').value,
      Billing_Street_2: document.getElementById('billingStreet2').value,
      Billing_Street_3: document.getElementById('billingStreet3').value,
      Billing_City: document.getElementById('billingCity').value,
      Billing_State: document.getElementById('billingState').value,
      Billing_Postal_Code: document.getElementById('billingPostalCode').value,
      Billing_Country: document.getElementById('billingCountry').value,

      Shipping_Street_1: document.getElementById('shippingStreet1').value,
      Shipping_Street_2: document.getElementById('shippingStreet2').value,
      Shipping_Street_3: document.getElementById('shippingStreet3').value,
      Shipping_City: document.getElementById('shippingCity').value,
      Shipping_State: document.getElementById('shippingState').value,
      Shipping_Postal_Code: document.getElementById('shippingPostalCode').value,
      Shipping_Country: document.getElementById('shippingCountry').value,
    }
  };
  return formData;
}
