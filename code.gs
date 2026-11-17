/**
 * House Management System - Final Complete Backend
 */

const SPREADSHEET_ID = '1jHR0qRDzWExgBmn47-sD4w4DlRYJlsUiaXe35NOocJY'; 
const USERS_SHEET = 'users';
const FLATS_SHEET = 'flat_information';
const TENANTS_SHEET = 'tenant_information';
const PAYMENTS_SHEET = 'rent_payment_history';

// ==========================================
// ১. ডেটাবেস সেটআপ
// ==========================================
function setupDatabase() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // users
  let usersSheet = ss.getSheetByName(USERS_SHEET);
  if (!usersSheet) usersSheet = ss.insertSheet(USERS_SHEET);
  usersSheet.clear();
  const usersHeaders = ['Username', 'Password', 'Name', 'Email', 'Type', 'Working'];
  usersSheet.getRange(1, 1, 1, usersHeaders.length).setValues([usersHeaders]);
  usersSheet.getRange(2, 1, 1, 6).setValues([['admin', 'admin123', 'Administrator', 'admin@example.com', 'admin', 'yes']]);
  formatSheet(usersSheet, usersHeaders.length);

  // flat_information
  let flatsSheet = ss.getSheetByName(FLATS_SHEET);
  if (!flatsSheet) flatsSheet = ss.insertSheet(FLATS_SHEET);
  flatsSheet.clear();
  const flatHeaders = ['Flat Number', 'Flat Name', 'Floor', 'Direction', 'Occupancy Status', 'Current Tenant ID'];
  flatsSheet.getRange(1, 1, 1, flatHeaders.length).setValues([flatHeaders]);
  const flatData = [
    ['101', '1st Floor South', '1st', 'South', 'Vacant', ''],
    ['102', '1st Floor North', '1st', 'North', 'Vacant', ''],
    ['201', '2nd Floor South', '2nd', 'South', 'Vacant', ''],
    ['202', '2nd Floor North', '2nd', 'North', 'Vacant', ''],
    ['301', '3rd Floor South', '3rd', 'South', 'Vacant', ''],
    ['302', '3rd Floor North', '3rd', 'North', 'Vacant', ''],
    ['401', '4th Floor South', '4th', 'South', 'Vacant', ''],
    ['402', '4th Floor North', '4th', 'North', 'Vacant', ''],
    ['501', '5th Floor South', '5th', 'South', 'Vacant', ''],
    ['502', '5th Floor North', '5th', 'North', 'Vacant', ''],
    ['601', '6th Floor South', '6th', 'South', 'Vacant', ''],
    ['602', '6th Floor North', '6th', 'North', 'Vacant', '']
  ];
  flatsSheet.getRange(2, 1, flatData.length, flatHeaders.length).setValues(flatData);
  formatSheet(flatsSheet, flatHeaders.length);

  // tenant_information
  let tenantsSheet = ss.getSheetByName(TENANTS_SHEET);
  if (!tenantsSheet) tenantsSheet = ss.insertSheet(TENANTS_SHEET);
  tenantsSheet.clear();
  const tenantHeaders = ['Tenant ID', 'Flat Number', 'Flat Name', 'Rent Person Name', 'Rent Person NID', 'Phone Number', 'Advanced Month', 'Monthly Rent', 'Move-in Date', 'Move-out Date', 'Status', 'Description'];
  tenantsSheet.getRange(1, 1, 1, tenantHeaders.length).setValues([tenantHeaders]);
  formatSheet(tenantsSheet, tenantHeaders.length);

  // rent_payment_history
  let paymentsSheet = ss.getSheetByName(PAYMENTS_SHEET);
  if (!paymentsSheet) paymentsSheet = ss.insertSheet(PAYMENTS_SHEET);
  paymentsSheet.clear();
  const paymentHeaders = ['Payment ID', 'Flat Number', 'Flat Name', 'Rent Person Name', 'Rent Person NID', 'Rent Month', 'Payment Date', 'Payment Amount', 'Payment Method', 'Transaction ID', 'Received From', 'Received By', 'Description', 'Status'];
  paymentsSheet.getRange(1, 1, 1, paymentHeaders.length).setValues([paymentHeaders]);
  formatSheet(paymentsSheet, paymentHeaders.length);

  SpreadsheetApp.getUi().alert('Database setup complete!');
}

function formatSheet(sheet, numCols) {
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setBackground('#0f766e').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  for (let i = 1; i <= numCols; i++) sheet.autoResizeColumn(i);
}

// ==========================================
// ২. API রাউটিং
// ==========================================
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return makeResponse(false, 'No data received');
    }

    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const payload = body.payload || {};

    if (action === 'login') return handleLogin(payload);
    if (action === 'getDashboardData') return handleGetDashboardData(payload);
    if (action === 'getFlats') return handleGetFlats(payload);
    if (action === 'getTenants') return handleGetTenants(payload);
    if (action === 'addTenant') return handleAddTenant(payload);
    
    // ⚠️ এই লাইনটি সবচেয়ে জরুরি (এটি ছাড়াই Move Out কাজ করছিল না)
    if (action === 'updateTenant') return handleUpdateTenant(payload); 
    
    if (action === 'getPayments') return handleGetPayments(payload);
    if (action === 'collectRent') return handleCollectRent(payload);

    return makeResponse(false, 'Unknown action: ' + action);

  } catch (error) {
    return makeResponse(false, 'Server Error: ' + error.message);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("House Management API is running.").setMimeType(ContentService.MimeType.TEXT);
}

function makeResponse(success, dataOrMessage) {
  let result = success ? { success: true, data: dataOrMessage } : { success: false, message: dataOrMessage };
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// ৩. হ্যান্ডলারস
// ==========================================
function handleLogin(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = ss.getSheetByName(USERS_SHEET).getDataRange().getValues();
  const username = String(payload.username || '').trim();
  const password = String(payload.password || '').trim();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[0]).trim() === username && String(row[1]).trim() === password) {
      if (String(row[5]).trim().toLowerCase() !== 'yes') return makeResponse(false, "Account is inactive.");
      return makeResponse(true, { token: Utilities.getUuid(), name: row[2], type: row[4], username: row[0] });
    }
  }
  return makeResponse(false, "Invalid username or password");
}

function handleGetDashboardData(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const flats = ss.getSheetByName(FLATS_SHEET).getDataRange().getValues().slice(1);
  const payments = ss.getSheetByName(PAYMENTS_SHEET).getDataRange().getValues().slice(1);

  let occupied = 0, vacant = 0;
  flats.forEach(f => { if (f[4] === 'Occupied') occupied++; else vacant++; });

  let collectedThisMonth = 0;
  const now = new Date();
  payments.forEach(p => {
    const pDate = new Date(p[6]);
    if (pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear()) {
      collectedThisMonth += Number(p[7]) || 0;
    }
  });

  return makeResponse(true, {
    totalFlats: flats.length, occupied, vacant, collectedThisMonth,
    chartData: { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov'], collections: [120000, 125000, 110000, 130000, collectedThisMonth] }
  });
}

function handleGetFlats(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const flats = ss.getSheetByName(FLATS_SHEET).getDataRange().getValues().slice(1);
  const tenants = ss.getSheetByName(TENANTS_SHEET).getDataRange().getValues().slice(1);
  
  const result = flats.map(f => {
    const tenant = tenants.find(t => t[0] === f[5]);
    return { flatNumber: f[0], flatName: f[1], floor: f[2], direction: f[3], status: f[4], tenantName: tenant ? tenant[3] : 'None', rent: tenant ? tenant[7] : 0 };
  });
  return makeResponse(true, result);
}

function handleGetTenants(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = ss.getSheetByName(TENANTS_SHEET).getDataRange().getValues().slice(1);
  const tenants = data.map(row => ({
    tenantId: row[0], flatNumber: row[1], flatName: row[2], name: row[3], nid: row[4], phone: row[5], advance: row[6], rent: row[7], moveIn: row[8], moveOut: row[9], status: row[10]
  }));
  return makeResponse(true, tenants);
}

function handleAddTenant(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tenantSheet = ss.getSheetByName(TENANTS_SHEET);
  const flatSheet = ss.getSheetByName(FLATS_SHEET);
  const flatsData = flatSheet.getDataRange().getValues();

  let flatRowIndex = -1;
  for (let i = 1; i < flatsData.length; i++) {
    if (String(flatsData[i][0]) === String(payload.data.flatNumber)) {
      if (flatsData[i][4] === 'Occupied') return makeResponse(false, "This flat is already occupied!");
      flatRowIndex = i + 1; break;
    }
  }
  if (flatRowIndex === -1) return makeResponse(false, "Flat not found!");

  const newId = "T-" + new Date().getTime().toString().slice(-6);
  const d = payload.data;
  tenantSheet.appendRow([newId, d.flatNumber, d.flatName, d.name, d.nid, d.phone, d.advance, d.rent, d.moveIn, '', 'Active', d.description]);
  
  // ফ্ল্যাট Occupied করা
  flatSheet.getRange(flatRowIndex, 5).setValue('Occupied');
  flatSheet.getRange(flatRowIndex, 6).setValue(newId);
  
  return makeResponse(true, { message: "Tenant added successfully", tenantId: newId });
}

// ⚠️ নতুন ফাংশন: Move Out / Edit এর জন্য
function handleUpdateTenant(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tenantSheet = ss.getSheetByName(TENANTS_SHEET);
  const flatSheet = ss.getSheetByName(FLATS_SHEET);
  
  const d = payload.data;
  const tenantData = tenantSheet.getDataRange().getValues();
  const flatsData = flatSheet.getDataRange().getValues();

  let tenantRowIndex = -1;
  let oldFlatNumber = "";
  let oldStatus = "";

  // ভাড়াটিয়া খোঁজা
  for (let i = 1; i < tenantData.length; i++) {
    if (String(tenantData[i][0]) === String(d.tenantId)) {
      tenantRowIndex = i + 1;
      oldFlatNumber = tenantData[i][1];
      oldStatus = String(tenantData[i][10]).trim(); // Status
      break;
    }
  }

  if (tenantRowIndex === -1) return makeResponse(false, "Tenant not found!");

  // ভাড়াটিয়ার তথ্য আপডেট
  tenantSheet.getRange(tenantRowIndex, 4).setValue(d.name); 
  tenantSheet.getRange(tenantRowIndex, 5).setValue(d.nid); 
  tenantSheet.getRange(tenantRowIndex, 6).setValue(d.phone); 
  tenantSheet.getRange(tenantRowIndex, 7).setValue(d.advance); 
  tenantSheet.getRange(tenantRowIndex, 8).setValue(d.rent); 
  tenantSheet.getRange(tenantRowIndex, 9).setValue(d.moveIn); 
  tenantSheet.getRange(tenantRowIndex, 11).setValue(d.status); 

  // যদি Move Out করা হয় (Status Inactive এবং আগে Active ছিল)
  if (String(d.status).trim() === 'Inactive' && oldStatus === 'Active') {
    tenantSheet.getRange(tenantRowIndex, 10).setValue(d.moveOut || new Date().toISOString().slice(0, 10)); 
    
    // ফ্ল্যাট খালি করা
    for (let i = 1; i < flatsData.length; i++) {
      if (String(flatsData[i][0]) === String(oldFlatNumber)) {
        flatSheet.getRange(i + 1, 5).setValue('Vacant'); // Occupancy Status
        flatSheet.getRange(i + 1, 6).setValue('');       // Current Tenant ID
        break;
      }
    }
  }

  return makeResponse(true, { message: "Tenant updated successfully" });
}

function handleGetPayments(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = ss.getSheetByName(PAYMENTS_SHEET).getDataRange().getValues().slice(1);
  const payments = data.map(row => ({
    paymentId: row[0], flatNumber: row[1], tenantName: row[3], rentMonth: row[5], date: row[6] ? new Date(row[6]).toISOString().slice(0, 10) : '', amount: row[7], method: row[8], status: row[13]
  })).reverse();
  return makeResponse(true, payments);
}

function handleCollectRent(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const paySheet = ss.getSheetByName(PAYMENTS_SHEET);
  const d = payload.data;
  const payId = "PAY-" + new Date().getTime().toString().slice(-6);

  paySheet.appendRow([payId, d.flatNumber, d.flatName, d.tenantName, d.nid, d.rentMonth, d.date, d.amount, d.method, d.trxId || '', d.receivedFrom || '', payload.user || 'Admin', d.description || '', d.status || 'Paid']);
  return makeResponse(true, { message: "Payment recorded successfully", paymentId: payId });
}