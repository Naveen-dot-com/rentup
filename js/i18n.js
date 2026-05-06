// ============================================================
// RentUp — i18n (Internationalization) System
// English (en) + Hindi (hi)
// ============================================================

const I18N = {
  en: {
    // App
    app_name: 'RentUp',
    app_tagline: 'Rental Property Management',

    // Nav
    nav_dashboard: 'Dashboard',
    nav_properties: 'Properties',
    nav_rooms: 'Rooms',
    nav_billing: 'Billing',
    nav_settings: 'Settings',
    nav_signout: 'Sign Out',

    // Auth
    auth_signin: 'Sign In',
    auth_create_account: 'Create Account',
    auth_email: 'Email Address',
    auth_password: 'Password',
    auth_confirm_password: 'Confirm Password',
    auth_name: 'Full Name',
    auth_signing_in: 'Signing in...',
    auth_creating: 'Creating account...',
    auth_welcome_back: 'Welcome back',
    auth_account_created: 'Account created! Welcome!',
    auth_passwords_mismatch: 'Passwords do not match',

    // Dashboard
    dash_title: 'Dashboard',
    dash_subtitle: 'Welcome back! Here\'s your overview.',
    dash_properties: 'Properties',
    dash_rooms: 'Rooms',
    dash_monthly_revenue: 'Monthly Revenue',
    dash_unpaid_bills: 'Unpaid Bills',
    dash_billing: 'Billing',
    dash_billing_subtitle: 'Generate and manage monthly bills',
    dash_no_bills: 'No bills found',
    dash_no_bills_yet: 'No bills yet. Create your first bill!',
    dash_recent_bills: 'Recent Activity',

    // Table headers
    th_property: 'Property',
    th_room: 'Room',
    th_tenant: 'Tenant',
    th_month: 'Month',
    th_rent: 'Rent',
    th_elec_units: 'Elec Units',
    th_elec_amount: 'Elec Amount',
    th_gas: 'Gas',
    th_total: 'Total',
    th_status: 'Status',
    th_actions: 'Actions',

    // Properties
    prop_title: 'Properties',
    prop_subtitle: 'Manage your rental properties',
    prop_add: 'Add Property',
    prop_edit: 'Edit Property',
    prop_add_title: 'Add Property',
    prop_name: 'Property Name',
    prop_name_ph: 'e.g. Sunset Apartments',
    prop_address: 'Address',
    prop_address_ph: 'e.g. 123 Main Street',
    prop_elec_rate: 'Electricity Rate (per unit)',
    prop_elec_rate_ph: 'e.g. 35',
    prop_rooms_count: 'rooms',
    prop_no_properties: 'No properties yet',
    prop_no_properties_desc: 'Add your first property to get started',
    prop_created: 'Property created',
    prop_updated: 'Property updated',
    prop_deleted: 'Property deleted',
    prop_delete_confirm: 'Delete property "{name}"? This will also delete all rooms and bills under it.',
    prop_added: 'Added',

    // Rooms
    room_title: 'Rooms',
    room_subtitle: 'Manage rooms across your properties',
    room_add: 'Add Room',
    room_edit: 'Edit Room',
    room_add_title: 'Add Room',
    room_property: 'Property',
    room_name: 'Room Name / Number',
    room_name_ph: 'e.g. Room 101',
    room_rent: 'Monthly Rent',
    room_rent_ph: 'e.g. 15000',
    room_tenant: 'Tenant Name',
    room_tenant_ph: 'e.g. Rajesh Kumar',
    room_no_rooms: 'No rooms found',
    room_no_rooms_desc: 'Add rooms to your properties',
    room_created: 'Room created',
    room_updated: 'Room updated',
    room_deleted: 'Room deleted',
    room_delete_confirm: 'Delete room "{name}"? All bills for this room will be deleted.',
    room_per_month: '/ month',
    room_no_tenant: 'No tenant',
    room_select_property: 'Select a property',
    room_create_property_first: 'Create a property first',
    room_all_properties: 'All Properties',

    // Billing
    bill_new: 'New Bill',
    bill_new_title: 'New Bill',
    bill_edit_title: 'Edit Bill',
    bill_export_excel: 'Export Excel',
    bill_month: 'Month',
    bill_rent_override: 'Rent Amount',
    bill_rent_override_ph: 'Leave empty for room default',
    bill_export_all_pdf: 'Export All PDF',
    bill_export_all_excel: 'Export All Excel',
    bill_consolidated_title: 'Consolidated Monthly Bill',
    bill_elec_units: 'Electricity Units',
    bill_gas_units: 'Gas Units',
    bill_gas_amount: 'Gas Amount',
    bill_notes: 'Notes',
    bill_notes_ph: 'Optional notes',
    bill_save: 'Save Bill',
    bill_created: 'Bill created',
    bill_updated: 'Bill updated',
    bill_status_updated: 'Status updated',
    bill_select_room: 'Please select a room',
    bill_select_property: 'Select property',
    bill_select_room_opt: 'Select room',
    bill_no_bills_export: 'No bills to export',
    bill_pdf_downloaded: 'PDF downloaded',
    bill_excel_downloaded: 'Excel downloaded',

    // Status
    status_paid: 'Paid',
    status_unpaid: 'Unpaid',
    status_partial: 'Partial',

    // Settings
    settings_title: 'Settings',
    settings_subtitle: 'Configure your app preferences',
    settings_billing: 'Billing',
    settings_currency: 'Currency',
    settings_currency_desc: 'Display currency symbol',
    settings_data: 'Data',
    settings_export: 'Export All Data',
    settings_export_desc: 'Download a full JSON backup of your data',
    settings_download_backup: 'Download Backup',
    settings_save: 'Save Settings',
    settings_saved: 'Settings saved',
    settings_backup_downloaded: 'Backup downloaded',

    // PDF
    pdf_title: 'Monthly Bill Invoice',
    pdf_property: 'Property',
    pdf_room: 'Room',
    pdf_tenant: 'Tenant',
    pdf_month: 'Month',
    pdf_status: 'Status',
    pdf_generated: 'Generated',
    pdf_item: 'Item',
    pdf_details: 'Details',
    pdf_amount: 'Amount',
    pdf_rent: 'Rent',
    pdf_rent_detail: 'Monthly rent (for {month})',
    pdf_electricity: 'Electricity',
    pdf_elec_detail: '{units} units × {rate}/unit (for {month})',
    pdf_gas: 'Gas',
    pdf_gas_detail: '{units} units (for {month})',
    pdf_total: 'TOTAL',
    pdf_notes: 'Notes',
    pdf_elec_gas_note: 'Electricity & Gas charges are for {prevMonth}',
    pdf_rent_note: 'Rent is for {currentMonth}',

    // Dashboard charts
    dash_charts: 'Revenue Overview',
    dash_revenue_chart: 'Monthly Breakdown',
    chart_rent: 'Rent',
    chart_electricity: 'Electricity',
    chart_gas: 'Gas',
    dash_download_pdf: 'Download Report',

    // Common
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    close: 'Close',
    loading: 'Loading...',
    per_unit: 'per unit',
  },

  hi: {
    // App
    app_name: 'RentUp',
    app_tagline: 'किराया संपत्ति प्रबंधन',

    // Nav
    nav_dashboard: 'डैशबोर्ड',
    nav_properties: 'संपत्तियाँ',
    nav_rooms: 'कमरे',
    nav_billing: 'बिलिंग',
    nav_settings: 'सेटिंग्स',
    nav_signout: 'साइन आउट',

    // Auth
    auth_signin: 'साइन इन',
    auth_create_account: 'खाता बनाएं',
    auth_email: 'ईमेल पता',
    auth_password: 'पासवर्ड',
    auth_confirm_password: 'पासवर्ड की पुष्टि करें',
    auth_name: 'पूरा नाम',
    auth_signing_in: 'साइन इन हो रहा है...',
    auth_creating: 'खाता बन रहा है...',
    auth_welcome_back: 'वापसी पर स्वागत है',
    auth_account_created: 'खाता बन गया! स्वागत है!',
    auth_passwords_mismatch: 'पासवर्ड मेल नहीं खाते',

    // Dashboard
    dash_title: 'डैशबोर्ड',
    dash_subtitle: 'वापसी पर स्वागत है! यहाँ आपका अवलोकन है।',
    dash_properties: 'संपत्तियाँ',
    dash_rooms: 'कमरे',
    dash_monthly_revenue: 'मासिक आय',
    dash_unpaid_bills: 'बकाया बिल',
    dash_billing: 'बिलिंग',
    dash_billing_subtitle: 'मासिक बिल बनाएं और प्रबंधित करें',
    dash_no_bills: 'कोई बिल नहीं मिला',
    dash_no_bills_yet: 'अभी तक कोई बिल नहीं। अपना पहला बिल बनाएं!',
    dash_recent_bills: 'हाल की गतिविधि',

    // Table headers
    th_property: 'संपत्ति',
    th_room: 'कमरा',
    th_tenant: 'किरायेदार',
    th_month: 'महीना',
    th_rent: 'किराया',
    th_elec_units: 'बिजली यूनिट',
    th_elec_amount: 'बिजली राशि',
    th_gas: 'गैस',
    th_total: 'कुल',
    th_status: 'स्थिति',
    th_actions: 'कार्रवाई',

    // Properties
    prop_title: 'संपत्तियाँ',
    prop_subtitle: 'अपनी किराये की संपत्तियाँ प्रबंधित करें',
    prop_add: 'संपत्ति जोड़ें',
    prop_edit: 'संपत्ति संपादित करें',
    prop_add_title: 'संपत्ति जोड़ें',
    prop_name: 'संपत्ति का नाम',
    prop_name_ph: 'उदा. सनसेट अपार्टमेंट',
    prop_address: 'पता',
    prop_address_ph: 'उदा. 123 मेन स्ट्रीट',
    prop_elec_rate: 'बिजली दर (प्रति यूनिट)',
    prop_elec_rate_ph: 'उदा. 35',
    prop_rooms_count: 'कमरे',
    prop_no_properties: 'अभी कोई संपत्ति नहीं',
    prop_no_properties_desc: 'शुरू करने के लिए अपनी पहली संपत्ति जोड़ें',
    prop_created: 'संपत्ति बनाई गई',
    prop_updated: 'संपत्ति अपडेट की गई',
    prop_deleted: 'संपत्ति हटाई गई',
    prop_delete_confirm: 'क्या आप संपत्ति "{name}" हटाना चाहते हैं? इसके सभी कमरे और बिल भी हट जाएंगे।',
    prop_added: 'जोड़ा गया',

    // Rooms
    room_title: 'कमरे',
    room_subtitle: 'अपनी संपत्तियों में कमरे प्रबंधित करें',
    room_add: 'कमरा जोड़ें',
    room_edit: 'कमरा संपादित करें',
    room_add_title: 'कमरा जोड़ें',
    room_property: 'संपत्ति',
    room_name: 'कमरे का नाम / नंबर',
    room_name_ph: 'उदा. कमरा 101',
    room_rent: 'मासिक किराया',
    room_rent_ph: 'उदा. 15000',
    room_tenant: 'किरायेदार का नाम',
    room_tenant_ph: 'उदा. राजेश कुमार',
    room_no_rooms: 'कोई कमरे नहीं मिले',
    room_no_rooms_desc: 'अपनी संपत्तियों में कमरे जोड़ें',
    room_created: 'कमरा बनाया गया',
    room_updated: 'कमरा अपडेट किया गया',
    room_deleted: 'कमरा हटाया गया',
    room_delete_confirm: 'क्या आप कमरा "{name}" हटाना चाहते हैं? इस कमरे के सभी बिल भी हट जाएंगे।',
    room_per_month: '/ माह',
    room_no_tenant: 'कोई किरायेदार नहीं',
    room_select_property: 'संपत्ति चुनें',
    room_create_property_first: 'पहले एक संपत्ति बनाएं',
    room_all_properties: 'सभी संपत्तियाँ',

    // Billing
    bill_new: 'नया बिल',
    bill_new_title: 'नया बिल',
    bill_edit_title: 'बिल संपादित करें',
    bill_export_excel: 'एक्सेल निर्यात',
    bill_month: 'महीना',
    bill_rent_override: 'किराया राशि',
    bill_rent_override_ph: 'कमरे का डिफ़ॉल्ट किराया',
    bill_export_all_pdf: 'सभी PDF निर्यात',
    bill_export_all_excel: 'सभी एक्सेल निर्यात',
    bill_consolidated_title: 'समेकित मासिक बिल',
    bill_elec_units: 'बिजली यूनिट',
    bill_gas_units: 'गैस यूनिट',
    bill_gas_amount: 'गैस राशि',
    bill_notes: 'नोट्स',
    bill_notes_ph: 'वैकल्पिक नोट्स',
    bill_save: 'बिल सहेजें',
    bill_created: 'बिल बनाया गया',
    bill_updated: 'बिल अपडेट किया गया',
    bill_status_updated: 'स्थिति अपडेट की गई',
    bill_select_room: 'कृपया एक कमरा चुनें',
    bill_select_property: 'संपत्ति चुनें',
    bill_select_room_opt: 'कमरा चुनें',
    bill_no_bills_export: 'निर्यात के लिए कोई बिल नहीं',
    bill_pdf_downloaded: 'PDF डाउनलोड हो गया',
    bill_excel_downloaded: 'एक्सेल डाउनलोड हो गया',

    // Status
    status_paid: 'भुगतान हुआ',
    status_unpaid: 'बकाया',
    status_partial: 'आंशिक',

    // Settings
    settings_title: 'सेटिंग्स',
    settings_subtitle: 'अपनी ऐप प्राथमिकताएं कॉन्फ़िगर करें',
    settings_billing: 'बिलिंग',
    settings_currency: 'मुद्रा',
    settings_currency_desc: 'मुद्रा चिह्न प्रदर्शित करें',
    settings_data: 'डेटा',
    settings_export: 'सभी डेटा निर्यात करें',
    settings_export_desc: 'अपने डेटा का पूरा JSON बैकअप डाउनलोड करें',
    settings_download_backup: 'बैकअप डाउनलोड करें',
    settings_save: 'सेटिंग्स सहेजें',
    settings_saved: 'सेटिंग्स सहेजी गईं',
    settings_backup_downloaded: 'बैकअप डाउनलोड हो गया',

    // PDF
    pdf_title: 'मासिक बिल चालान',
    pdf_property: 'संपत्ति',
    pdf_room: 'कमरा',
    pdf_tenant: 'किरायेदार',
    pdf_month: 'महीना',
    pdf_status: 'स्थिति',
    pdf_generated: 'तिथि',
    pdf_item: 'मद',
    pdf_details: 'विवरण',
    pdf_amount: 'राशि',
    pdf_rent: 'किराया',
    pdf_rent_detail: 'मासिक किराया ({month} के लिए)',
    pdf_electricity: 'बिजली',
    pdf_elec_detail: '{units} यूनिट × {rate}/यूनिट ({month} के लिए)',
    pdf_gas: 'गैस',
    pdf_gas_detail: '{units} यूनिट ({month} के लिए)',
    pdf_total: 'कुल',
    pdf_notes: 'नोट्स',
    pdf_elec_gas_note: 'बिजली और गैस शुल्क {prevMonth} के लिए हैं',
    pdf_rent_note: 'किराया {currentMonth} के लिए है',

    // Dashboard charts
    dash_charts: 'आय अवलोकन',
    dash_revenue_chart: 'मासिक विवरण',
    chart_rent: 'किराया',
    chart_electricity: 'बिजली',
    chart_gas: 'गैस',
    dash_download_pdf: 'रिपोर्ट डाउनलोड',

    // Common
    cancel: 'रद्द करें',
    save: 'सहेजें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    close: 'बंद करें',
    loading: 'लोड हो रहा है...',
    per_unit: 'प्रति यूनिट',
  }
};

// Translation function
function t(key, replacements) {
  const lang = localStorage.getItem('rentup_lang') || 'en';
  let text = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  if (replacements) {
    Object.keys(replacements).forEach(k => {
      text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), replacements[k]);
    });
  }
  return text;
}

function getLang() {
  return localStorage.getItem('rentup_lang') || 'en';
}

function setLang(lang) {
  localStorage.setItem('rentup_lang', lang);
}
