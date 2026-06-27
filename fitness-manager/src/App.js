import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Package, AlertTriangle, Star, Gift } from 'lucide-react';
import * as XLSX from 'xlsx';

// ============= CUSTOM DATE PICKER =============
function DatePicker({ value, onChange, name }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [viewMonth, setViewMonth] = useState(selectedDate ? selectedDate.getMonth() : today.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate ? selectedDate.getFullYear() : today.getFullYear());
  const [showPicker, setShowPicker] = useState(false);

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

  const years = [];
  for (let y = today.getFullYear() + 10; y >= today.getFullYear() - 100; y--) {
    years.push(y);
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();

  const handleDateClick = (day) => {
    const newDate = new Date(viewYear, viewMonth, day);
    setSelectedDate(newDate);
    const dateString = newDate.toISOString().split('T')[0];
    onChange({ target: { name: name, value: dateString, type: 'text' } });
    setShowPicker(false);
  };

  const displayValue = selectedDate ? selectedDate.toLocaleDateString('en-GB') : 'Select date';

  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setShowPicker(!showPicker)} style={{
        padding: '12px 15px', border: '1px solid #ddd', borderRadius: '8px',
        fontSize: '14px', cursor: 'pointer', backgroundColor: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{ color: selectedDate ? '#333' : '#999' }}>{displayValue}</span>
        <span>📅</span>
      </div>

      {showPicker && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '5px',
          backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px',
          padding: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, width: '300px'
        }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <select value={viewMonth} onChange={(e) => setViewMonth(parseInt(e.target.value))}
              style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }}>
              {months.map((month, idx) => <option key={idx} value={idx}>{month}</option>)}
            </select>
            <select value={viewYear} onChange={(e) => setViewYear(parseInt(e.target.value))}
              style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }}>
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '5px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ textAlign: 'center', fontSize: '11px', color: '#999', padding: '5px', fontWeight: 'bold' }}>{day}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => <div key={`empty-${idx}`}></div>)}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected = selectedDate && selectedDate.getDate() === day &&
                selectedDate.getMonth() === viewMonth && selectedDate.getFullYear() === viewYear;
              const isToday = today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;

              return (
                <div key={day} onClick={() => handleDateClick(day)} style={{
                  textAlign: 'center', padding: '8px 4px', cursor: 'pointer', borderRadius: '5px',
                  fontSize: '13px', backgroundColor: isSelected ? '#667eea' : isToday ? '#f0f2f5' : 'transparent',
                  color: isSelected ? 'white' : '#333', fontWeight: isSelected || isToday ? 'bold' : 'normal'
                }}>{day}</div>
              );
            })}
          </div>

          <button onClick={() => setShowPicker(false)} style={{
            marginTop: '10px', width: '100%', padding: '8px', backgroundColor: '#667eea',
            color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
          }}>Close</button>
        </div>
      )}
    </div>
  );
}

// ============= MAIN APP =============
export default function FitnessBusinessManager() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [customers, setCustomers] = useState([]);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDailyTasks, setShowDailyTasks] = useState(false);

  const [formData, setFormData] = useState({
    name: '', dateOfBirth: '', weight: '', height: '', shippingAddress: '',
    dateOfJoining: '', productQuantity: '1', lastPurchaseDate: '',
    welcomeCallDone: false, welcomeCallDate: '', dailyAlertResponded: null,
    dailyAlertResponseDate: '', lastResponseDate: '',
    sevenDayPresentationInviteSent: false, sevenDayInviteDate: '',
    sevenDayWelcomeAlertDone: false, sevenDayWelcomeAlertDate: '',
    businessOpportunityAlertsHistory: [],
    notes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('customers');
    if (saved) {
      try { setCustomers(JSON.parse(saved)); }
      catch (error) { console.log('Loading failed'); }
    }
  }, []);

  const saveCustomers = (data) => localStorage.setItem('customers', JSON.stringify(data));

  const calculateAge = (dob) => {
    if (!dob) return '';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const calculateBMI = (weight, height) => {
    if (!weight || !height) return '';
    return (weight / (height * height)).toFixed(1);
  };

  const calculateDaysSinceJoining = (joiningDate) => {
    if (!joiningDate) return 0;
    return Math.ceil(Math.abs(new Date() - new Date(joiningDate)) / (1000 * 60 * 60 * 24));
  };

  const calculateDaysSincePurchase = (purchaseDate) => {
    if (!purchaseDate) return 0;
    return Math.ceil(Math.abs(new Date() - new Date(purchaseDate)) / (1000 * 60 * 60 * 24));
  };

  const calculateDaysSinceLastResponse = (lastResponseDate) => {
    if (!lastResponseDate) return 999;
    return Math.ceil(Math.abs(new Date() - new Date(lastResponseDate)) / (1000 * 60 * 60 * 24));
  };

  const isGoldCustomer = (productQuantity) => parseInt(productQuantity) >= 2;
  const getReorderDays = (productQuantity) => isGoldCustomer(productQuantity) ? 20 : 30;

  const getReorderDueDate = (purchaseDate, productQuantity) => {
    if (!purchaseDate) return '';
    const purchase = new Date(purchaseDate);
    purchase.setDate(purchase.getDate() + getReorderDays(productQuantity));
    return purchase.toISOString().split('T')[0];
  };

  const getDaysUntilReorder = (purchaseDate, productQuantity) => {
    if (!purchaseDate) return null;
    const today = new Date();
    const purchase = new Date(purchaseDate);
    const reorderDate = new Date(purchase);
    reorderDate.setDate(reorderDate.getDate() + getReorderDays(productQuantity));
    return Math.ceil((reorderDate - today) / (1000 * 60 * 60 * 24));
  };

  // NEW: Check if business opportunity alert is due
  const isBusinessOpportunityDue = (customer) => {
    const today = new Date();
    const daysSinceJoining = calculateDaysSinceJoining(customer.dateOfJoining);
    
    // Must be at least 30 days since joining
    if (daysSinceJoining < 30) return false;
    
    // Must be on or after 15th of current month
    if (today.getDate() < 15) return false;
    
    // Check if this month's alert is already done
    const currentMonth = today.toISOString().slice(0, 7); // "YYYY-MM"
    const alreadyDone = (customer.businessOpportunityAlertsHistory || []).some(
      alert => alert.month === currentMonth && alert.completed
    );
    
    return !alreadyDone;
  };

  const getCurrentMonthLabel = () => {
    const today = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[today.getMonth()]} ${today.getFullYear()}`;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveCustomer = () => {
    if (!formData.name || !formData.dateOfBirth || !formData.weight || !formData.height || !formData.shippingAddress || !formData.dateOfJoining) {
      alert('❌ Please fill all required fields');
      return;
    }

    let updatedCustomers;
    if (editingId) {
      updatedCustomers = customers.map(c => c.id === editingId ? { ...formData, id: editingId } : c);
    } else {
      updatedCustomers = [...customers, { 
        ...formData, 
        lastPurchaseDate: formData.dateOfJoining, 
        businessOpportunityAlertsHistory: [],
        id: Date.now().toString() 
      }];
    }

    setCustomers(updatedCustomers);
    saveCustomers(updatedCustomers);
    alert(editingId ? '✅ Customer updated!' : '✅ Customer added!');
    resetForm();
    setShowOnboardingForm(false);
  };

  const handleDeleteCustomer = (id) => {
    if (window.confirm('Are you sure?')) {
      const updated = customers.filter(c => c.id !== id);
      setCustomers(updated);
      saveCustomers(updated);
      alert('✅ Deleted!');
    }
  };

  const handleEditCustomer = (customer) => {
    setFormData(customer);
    setEditingId(customer.id);
    setShowOnboardingForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '', dateOfBirth: '', weight: '', height: '', shippingAddress: '',
      dateOfJoining: '', productQuantity: '1', lastPurchaseDate: '',
      welcomeCallDone: false, welcomeCallDate: '', dailyAlertResponded: null,
      dailyAlertResponseDate: '', lastResponseDate: '',
      sevenDayPresentationInviteSent: false, sevenDayInviteDate: '',
      sevenDayWelcomeAlertDone: false, sevenDayWelcomeAlertDate: '',
      businessOpportunityAlertsHistory: [],
      notes: ''
    });
    setEditingId(null);
  };

  const handleWelcomeCallDone = (id) => {
    const updated = customers.map(c => c.id === id ? { ...c, welcomeCallDone: true, welcomeCallDate: new Date().toISOString().split('T')[0] } : c);
    setCustomers(updated);
    saveCustomers(updated);
    alert('✅ Welcome call done!');
  };

  const handleDailyAlertResponse = (id, responded) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = customers.map(c => {
      if (c.id === id) {
        return { ...c, dailyAlertResponded: responded, dailyAlertResponseDate: today, lastResponseDate: responded ? today : c.lastResponseDate };
      }
      return c;
    });
    setCustomers(updated);
    saveCustomers(updated);
    alert(responded ? '✅ Response recorded!' : '✅ No response recorded!');
  };

  const handleSend7DayInvite = (id) => {
    const updated = customers.map(c => c.id === id ? { ...c, sevenDayPresentationInviteSent: true, sevenDayInviteDate: new Date().toISOString().split('T')[0] } : c);
    setCustomers(updated);
    saveCustomers(updated);
    alert('✅ Invite sent!');
  };

  const handleUpdatePurchaseDate = (id) => {
    const today = new Date().toISOString().split('T')[0];
    const customer = customers.find(c => c.id === id);
    const reorderDays = getReorderDays(customer.productQuantity);
    
    if (window.confirm(`Mark new purchase today? Reorder reminder set for ${reorderDays} days from now.`)) {
      const updated = customers.map(c => c.id === id ? { ...c, lastPurchaseDate: today } : c);
      setCustomers(updated);
      saveCustomers(updated);
      alert(`✅ Purchase updated! Reorder due in ${reorderDays} days.`);
    }
  };

  // NEW: Handle 7-day welcome alert
  const handle7DayWelcomeAlert = (id) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = customers.map(c => c.id === id ? { 
      ...c, 
      sevenDayWelcomeAlertDone: true, 
      sevenDayWelcomeAlertDate: today 
    } : c);
    setCustomers(updated);
    saveCustomers(updated);
    alert('✅ 7-Day welcome alert marked complete!');
  };

  // NEW: Handle business opportunity alert
  const handleBusinessOpportunityAlert = (id) => {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    const todayDate = today.toISOString().split('T')[0];
    
    const updated = customers.map(c => {
      if (c.id === id) {
        const history = c.businessOpportunityAlertsHistory || [];
        const existingIndex = history.findIndex(a => a.month === currentMonth);
        
        let newHistory;
        if (existingIndex >= 0) {
          newHistory = [...history];
          newHistory[existingIndex] = { month: currentMonth, completed: true, date: todayDate };
        } else {
          newHistory = [...history, { month: currentMonth, completed: true, date: todayDate }];
        }
        
        return { ...c, businessOpportunityAlertsHistory: newHistory };
      }
      return c;
    });
    
    setCustomers(updated);
    saveCustomers(updated);
    alert(`✅ Business opportunity alert for ${getCurrentMonthLabel()} marked complete!`);
  };

  const exportToExcel = () => {
    if (customers.length === 0) {
      alert('❌ No customers to export!');
      return;
    }

    const excelData = customers.map(customer => {
      const isGold = isGoldCustomer(customer.productQuantity);
      const businessOppHistory = customer.businessOpportunityAlertsHistory || [];
      const totalOppAlerts = businessOppHistory.filter(a => a.completed).length;
      
      return {
        'Name': customer.name,
        'Date of Birth': customer.dateOfBirth,
        'Age': calculateAge(customer.dateOfBirth),
        'Weight (kg)': customer.weight,
        'Height (m)': customer.height,
        'BMI': calculateBMI(customer.weight, customer.height),
        'Shipping Address': customer.shippingAddress,
        'Date of Joining': customer.dateOfJoining,
        'Product Quantity': customer.productQuantity,
        'Customer Status': isGold ? 'GOLD 👑' : 'Non-Gold',
        'Reorder Period (Days)': getReorderDays(customer.productQuantity),
        'Last Purchase Date': customer.lastPurchaseDate || 'N/A',
        'Next Reorder Due Date': getReorderDueDate(customer.lastPurchaseDate, customer.productQuantity) || 'N/A',
        'Days Until Reorder': customer.lastPurchaseDate ? getDaysUntilReorder(customer.lastPurchaseDate, customer.productQuantity) : 'N/A',
        'Welcome Call Status': customer.welcomeCallDone ? `Done (${customer.welcomeCallDate})` : 'Pending',
        '7-Day Welcome Alert': customer.sevenDayWelcomeAlertDone ? `Done (${customer.sevenDayWelcomeAlertDate})` : 'Pending',
        'Last Response Date': customer.lastResponseDate || 'Never',
        'Days Since Last Response': customer.lastResponseDate ? calculateDaysSinceLastResponse(customer.lastResponseDate) : 'N/A',
        '7-Day Presentation Sent': customer.sevenDayPresentationInviteSent ? `Yes (${customer.sevenDayInviteDate})` : 'No',
        'Business Opp Alerts Completed': totalOppAlerts,
        'Notes': customer.notes || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

    const colWidths = Object.keys(excelData[0]).map(key => ({ wch: Math.max(key.length, 15) }));
    worksheet['!cols'] = colWidths;

    const fileName = `Fitness_Customers_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    alert(`✅ Excel downloaded: ${fileName}`);
  };

  const getAlerts = () => {
    const alerts = {
      welcomeCallPending: [], 
      dailyAlertCheck: [], 
      sevenDayPresentationDue: [],
      reorderDueGold: [], 
      reorderDueNonGold: [], 
      noResponse3Days: [],
      sevenDayWelcomeDue: [],
      businessOpportunityDue: []
    };

    customers.forEach(customer => {
      if (!customer.welcomeCallDone) alerts.welcomeCallPending.push(customer);

      const today = new Date().toISOString().split('T')[0];
      if (!customer.dailyAlertResponseDate || customer.dailyAlertResponseDate !== today) {
        alerts.dailyAlertCheck.push(customer);
      }

      const daysSince = calculateDaysSinceJoining(customer.dateOfJoining);
      if (daysSince >= 7 && !customer.sevenDayPresentationInviteSent) {
        alerts.sevenDayPresentationDue.push(customer);
      }

      // NEW: 7-day welcome alert
      if (daysSince >= 7 && !customer.sevenDayWelcomeAlertDone) {
        alerts.sevenDayWelcomeDue.push(customer);
      }

      // NEW: Business opportunity alert
      if (isBusinessOpportunityDue(customer)) {
        alerts.businessOpportunityDue.push(customer);
      }

      if (customer.lastPurchaseDate) {
        const daysSincePurchase = calculateDaysSincePurchase(customer.lastPurchaseDate);
        const reorderDays = getReorderDays(customer.productQuantity);
        if (daysSincePurchase >= reorderDays) {
          if (isGoldCustomer(customer.productQuantity)) {
            alerts.reorderDueGold.push({ ...customer, daysSincePurchase });
          } else {
            alerts.reorderDueNonGold.push({ ...customer, daysSincePurchase });
          }
        }
      }

      const daysSinceResponse = calculateDaysSinceLastResponse(customer.lastResponseDate);
      if (daysSinceResponse >= 3 && daysSinceResponse < 999) {
        alerts.noResponse3Days.push({ ...customer, daysSinceResponse });
      }
    });

    return alerts;
  };

  const alerts = getAlerts();
  const totalReorders = alerts.reorderDueGold.length + alerts.reorderDueNonGold.length;
  const totalPendingTasks = alerts.welcomeCallPending.length + alerts.dailyAlertCheck.length +
                             alerts.sevenDayPresentationDue.length + totalReorders +
                             alerts.noResponse3Days.length + alerts.sevenDayWelcomeDue.length +
                             alerts.businessOpportunityDue.length;

  const goldCustomers = customers.filter(c => isGoldCustomer(c.productQuantity)).length;
  const nonGoldCustomers = customers.filter(c => !isGoldCustomer(c.productQuantity)).length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={styles.title}>💪 Fitness Business Manager</h1>
            <p style={styles.subtitle}>Gold: 20-day reorder | Non-Gold: 30-day reorder</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={exportToExcel} style={styles.excelBtn}>📊 Export to Excel</button>
            <button onClick={() => setShowDailyTasks(!showDailyTasks)} style={styles.tasksBtn}>
              🔔 Tasks ({totalPendingTasks})
            </button>
          </div>
        </div>
      </div>

      {showDailyTasks && (
        <div style={styles.tasksDropdown}>
          <h3 style={{ margin: '0 0 15px 0' }}>📋 Today's Pending Tasks</h3>
          {totalPendingTasks === 0 ? (
            <p style={{ color: '#27ae60', margin: 0 }}>✅ All tasks completed!</p>
          ) : (
            <>
              {alerts.noResponse3Days.map(c => (
                <div key={`nr-${c.id}`} style={styles.taskItem}>
                  <label style={styles.taskLabel}>
                    <input type="checkbox" onChange={() => handleDailyAlertResponse(c.id, true)} style={styles.checkbox} />
                    <span style={styles.taskBadgeDarkRed}>URGENT</span>
                    No response: <strong>{c.name}</strong> ({c.daysSinceResponse} days)
                  </label>
                </div>
              ))}
              {alerts.businessOpportunityDue.map(c => (
                <div key={`bo-${c.id}`} style={styles.taskItem}>
                  <label style={styles.taskLabel}>
                    <input type="checkbox" onChange={() => handleBusinessOpportunityAlert(c.id)} style={styles.checkbox} />
                    <span style={styles.taskBadgeBrightGold}>OPPORTUNITY</span>
                    Business opportunity ({getCurrentMonthLabel()}): <strong>{c.name}</strong>
                  </label>
                </div>
              ))}
              {alerts.sevenDayWelcomeDue.map(c => (
                <div key={`sw-${c.id}`} style={styles.taskItem}>
                  <label style={styles.taskLabel}>
                    <input type="checkbox" onChange={() => handle7DayWelcomeAlert(c.id)} style={styles.checkbox} />
                    <span style={styles.taskBadgeLavender}>7-DAY WELCOME</span>
                    7-Day milestone: <strong>{c.name}</strong>
                  </label>
                </div>
              ))}
              {alerts.welcomeCallPending.map(c => (
                <div key={`wc-${c.id}`} style={styles.taskItem}>
                  <label style={styles.taskLabel}>
                    <input type="checkbox" onChange={() => handleWelcomeCallDone(c.id)} style={styles.checkbox} />
                    <span style={styles.taskBadgeRed}>CALL</span>
                    Welcome call: <strong>{c.name}</strong>
                  </label>
                </div>
              ))}
              {alerts.dailyAlertCheck.map(c => (
                <div key={`da-${c.id}`} style={styles.taskItem}>
                  <label style={styles.taskLabel}>
                    <input type="checkbox" onChange={() => handleDailyAlertResponse(c.id, true)} style={styles.checkbox} />
                    <span style={styles.taskBadgeOrange}>DAILY</span>
                    Check response: <strong>{c.name}</strong>
                  </label>
                </div>
              ))}
              {alerts.sevenDayPresentationDue.map(c => (
                <div key={`pr-${c.id}`} style={styles.taskItem}>
                  <label style={styles.taskLabel}>
                    <input type="checkbox" onChange={() => handleSend7DayInvite(c.id)} style={styles.checkbox} />
                    <span style={styles.taskBadgeTeal}>PRESENT</span>
                    Presentation invite: <strong>{c.name}</strong>
                  </label>
                </div>
              ))}
              {alerts.reorderDueGold.map(c => (
                <div key={`rg-${c.id}`} style={styles.taskItem}>
                  <label style={styles.taskLabel}>
                    <input type="checkbox" onChange={() => handleUpdatePurchaseDate(c.id)} style={styles.checkbox} />
                    <span style={styles.taskBadgeGold}>GOLD REORDER</span>
                    <strong>{c.name}</strong> ({c.daysSincePurchase}d, 20d cycle)
                  </label>
                </div>
              ))}
              {alerts.reorderDueNonGold.map(c => (
                <div key={`rn-${c.id}`} style={styles.taskItem}>
                  <label style={styles.taskLabel}>
                    <input type="checkbox" onChange={() => handleUpdatePurchaseDate(c.id)} style={styles.checkbox} />
                    <span style={styles.taskBadgePurple}>REORDER</span>
                    <strong>{c.name}</strong> ({c.daysSincePurchase}d, 30d cycle)
                  </label>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <div style={styles.nav}>
        <button onClick={() => setActiveTab('dashboard')} style={{...styles.navBtn, ...(activeTab === 'dashboard' ? styles.navBtnActive : {})}}>📊 Dashboard</button>
        <button onClick={() => setActiveTab('customers')} style={{...styles.navBtn, ...(activeTab === 'customers' ? styles.navBtnActive : {})}}>👥 Customers ({customers.length})</button>
        <button onClick={() => setActiveTab('alerts')} style={{...styles.navBtn, ...(activeTab === 'alerts' ? styles.navBtnActive : {})}}>🔔 Alerts ({totalPendingTasks})</button>
      </div>

      <div style={styles.content}>
        {activeTab === 'dashboard' && (
          <div>
            <h2>📊 Dashboard Overview</h2>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color: '#667eea'}}>{customers.length}</div>
                <div style={styles.statLabel}>Total Customers</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color: '#f1c40f'}}>{goldCustomers}</div>
                <div style={styles.statLabel}>👑 Gold (20d reorder)</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color: '#3498db'}}>{nonGoldCustomers}</div>
                <div style={styles.statLabel}>👤 Non-Gold (30d reorder)</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color: '#c0392b'}}>{alerts.noResponse3Days.length}</div>
                <div style={styles.statLabel}>⚠️ No Response 3+ Days</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color: '#e74c3c'}}>{alerts.welcomeCallPending.length}</div>
                <div style={styles.statLabel}>Welcome Calls</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color: '#f39c12'}}>{alerts.dailyAlertCheck.length}</div>
                <div style={styles.statLabel}>Daily Responses</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color: '#b39ddb'}}>{alerts.sevenDayWelcomeDue.length}</div>
                <div style={styles.statLabel}>🎉 7-Day Welcome</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color: '#4ecdc4'}}>{alerts.sevenDayPresentationDue.length}</div>
                <div style={styles.statLabel}>Presentations Due</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color: '#ffc107'}}>{alerts.businessOpportunityDue.length}</div>
                <div style={styles.statLabel}>🌟 Business Opportunity</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color: '#f1c40f'}}>{alerts.reorderDueGold.length}</div>
                <div style={styles.statLabel}>👑 Gold Reorders</div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statNumber, color: '#9b59b6'}}>{alerts.reorderDueNonGold.length}</div>
                <div style={styles.statLabel}>📦 Non-Gold Reorders</div>
              </div>
            </div>
            <div style={{marginTop: '30px'}}>
              <h3>Quick Actions</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => {resetForm(); setShowOnboardingForm(true); setActiveTab('customers');}} style={styles.btnPrimary}>➕ Add Customer</button>
                <button onClick={exportToExcel} style={{...styles.btnPrimary, background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)'}}>📊 Excel Report</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div>
            <div style={styles.sectionHeader}>
              <h2>👥 Manage Customers</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={exportToExcel} style={{...styles.btnPrimary, background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)'}}>📊 Export Excel</button>
                <button onClick={() => {resetForm(); setShowOnboardingForm(!showOnboardingForm);}} style={styles.btnPrimary}>➕ Add Customer</button>
              </div>
            </div>

            {showOnboardingForm && (
              <div style={styles.formContainer}>
                <h3>{editingId ? '✏️ Edit Customer' : '📋 New Customer Onboarding'}</h3>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label>Full Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} style={styles.input} placeholder="Enter name" />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Date of Birth *</label>
                    <DatePicker value={formData.dateOfBirth} onChange={handleInputChange} name="dateOfBirth" />
                    {formData.dateOfBirth && <p style={styles.helperText}>Age: {calculateAge(formData.dateOfBirth)} years</p>}
                  </div>
                  <div style={styles.formGroup}>
                    <label>Weight (kg) *</label>
                    <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} step="0.1" style={styles.input} placeholder="Enter weight" />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Height (m) *</label>
                    <input type="number" name="height" value={formData.height} onChange={handleInputChange} step="0.01" style={styles.input} placeholder="e.g., 1.75" />
                    {formData.weight && formData.height && <p style={styles.helperText}>BMI: {calculateBMI(formData.weight, formData.height)}</p>}
                  </div>
                  <div style={styles.formGroup}>
                    <label>Shipping Address *</label>
                    <textarea name="shippingAddress" value={formData.shippingAddress} onChange={handleInputChange} style={{...styles.input, minHeight: '80px'}} placeholder="Enter address" />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Date of Joining *</label>
                    <DatePicker value={formData.dateOfJoining} onChange={handleInputChange} name="dateOfJoining" />
                    {formData.dateOfJoining && <p style={styles.helperText}>Days since: {calculateDaysSinceJoining(formData.dateOfJoining)}</p>}
                  </div>
                  <div style={styles.formGroup}>
                    <label>Product Quantity *</label>
                    <select name="productQuantity" value={formData.productQuantity} onChange={handleInputChange} style={styles.input}>
                      <option value="1">1 Product (Non-Gold - 30d reorder)</option>
                      <option value="2">2 Products (👑 Gold - 20d reorder)</option>
                      <option value="3">3 Products (👑 Gold - 20d reorder)</option>
                      <option value="4">4 Products (👑 Gold - 20d reorder)</option>
                      <option value="5">5 Products (👑 Gold - 20d reorder)</option>
                    </select>
                    {formData.productQuantity && (
                      <p style={styles.helperText}>
                        {isGoldCustomer(formData.productQuantity) 
                          ? '👑 GOLD - Reorder every 20 days' 
                          : '👤 Non-Gold - Reorder every 30 days'}
                      </p>
                    )}
                  </div>
                  <div style={styles.formGroup}>
                    <label>Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} style={{...styles.input, minHeight: '60px'}} placeholder="Add notes" />
                  </div>
                </div>
                <div style={styles.formActions}>
                  <button onClick={handleSaveCustomer} style={styles.btnSuccess}>{editingId ? '💾 Update' : '✅ Add Customer'}</button>
                  <button onClick={() => {resetForm(); setShowOnboardingForm(false);}} style={styles.btnCancel}>Cancel</button>
                </div>
              </div>
            )}

            {customers.length === 0 ? (
              <p style={styles.emptyState}>No customers yet. Click "Add Customer" to start!</p>
            ) : (
              <div style={styles.customersTable}>
                {customers.map(customer => {
                  const isGold = isGoldCustomer(customer.productQuantity);
                  const daysUntilReorder = getDaysUntilReorder(customer.lastPurchaseDate, customer.productQuantity);
                  const daysSinceResponse = calculateDaysSinceLastResponse(customer.lastResponseDate);
                  const noResponseAlert = daysSinceResponse >= 3 && daysSinceResponse < 999;
                  const reorderDays = getReorderDays(customer.productQuantity);
                  const daysSinceJoining = calculateDaysSinceJoining(customer.dateOfJoining);

                  return (
                    <div key={customer.id} style={{...styles.customerCard, ...(isGold ? styles.goldCard : {}), ...(noResponseAlert ? styles.urgentCard : {})}}>
                      <div style={styles.cardHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h4 style={styles.cardTitle}>{customer.name}</h4>
                          {isGold ? <span style={styles.goldBadge}>👑 GOLD (20d)</span> : <span style={styles.nonGoldBadge}>👤 NON-GOLD (30d)</span>}
                          {noResponseAlert && <span style={styles.urgentBadge}>⚠️ {daysSinceResponse}D NO RESPONSE</span>}
                        </div>
                        <div style={styles.cardMeta}>
                          <span style={styles.badge}>Age: {calculateAge(customer.dateOfBirth)}</span>
                          <span style={styles.badge}>BMI: {calculateBMI(customer.weight, customer.height)}</span>
                        </div>
                      </div>
                      <div style={styles.cardContent}>
                        <p><strong>📅 Joining:</strong> {customer.dateOfJoining} ({daysSinceJoining} days ago)</p>
                        <p><strong>⚖️ Weight:</strong> {customer.weight} kg</p>
                        <p><strong>📏 Height:</strong> {customer.height} m</p>
                        <p><strong>📦 Products:</strong> {customer.productQuantity}</p>
                        <p><strong>🏠 Address:</strong> {customer.shippingAddress}</p>
                        {customer.lastPurchaseDate && (
                          <p><strong>🛒 Last Purchase:</strong> {customer.lastPurchaseDate}
                            {daysUntilReorder !== null && (
                              <span style={{
                                marginLeft: '10px',
                                color: daysUntilReorder <= 0 ? '#e74c3c' : daysUntilReorder <= 3 ? '#f39c12' : '#27ae60',
                                fontWeight: 'bold'
                              }}>
                                {daysUntilReorder <= 0 ? `⚠️ REORDER NOW!` : `(${daysUntilReorder} days)`}
                              </span>
                            )}
                          </p>
                        )}
                        {customer.notes && <p><strong>📝 Notes:</strong> {customer.notes}</p>}
                      </div>
                      <div style={styles.cardActions}>
                        <button onClick={() => handleEditCustomer(customer)} style={styles.btnSmall}>✏️ Edit</button>
                        <button onClick={() => handleUpdatePurchaseDate(customer.id)} style={{...styles.btnSmall, backgroundColor: '#9b59b6'}}>🛒 New Purchase</button>
                        {!customer.welcomeCallDone && (
                          <button onClick={() => handleWelcomeCallDone(customer.id)} style={{...styles.btnSmall, backgroundColor: '#27ae60'}}>☎️ Call Done</button>
                        )}
                        <button onClick={() => handleDeleteCustomer(customer.id)} style={{...styles.btnSmall, backgroundColor: '#e74c3c'}}>🗑️ Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div>
            <h2>🔔 Action Required</h2>

            {alerts.noResponse3Days.length > 0 && (
              <div style={styles.alertSection}>
                <h3 style={{color: '#c0392b', display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <AlertTriangle size={24} /> URGENT: No Response 3+ Days ({alerts.noResponse3Days.length})
                </h3>
                <div style={styles.alertGrid}>
                  {alerts.noResponse3Days.map(c => (
                    <div key={c.id} style={{...styles.alertCard, borderLeft: '5px solid #c0392b'}}>
                      <h4>{c.name}</h4>
                      <p><strong>Last Response:</strong> {c.lastResponseDate}</p>
                      <p style={{color: '#c0392b', fontWeight: 'bold'}}>⚠️ No response for {c.daysSinceResponse} days!</p>
                      <button onClick={() => handleDailyAlertResponse(c.id, true)} style={{...styles.btnSuccess, width: '100%'}}>✅ Mark as Responded</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts.businessOpportunityDue.length > 0 && (
              <div style={styles.alertSection}>
                <h3 style={{color: '#ffc107', display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <Star size={24} /> 🌟 Business Opportunity - {getCurrentMonthLabel()} ({alerts.businessOpportunityDue.length})
                </h3>
                <p style={{ color: '#666', fontSize: '13px' }}>Inform these customers about the business opportunity this month</p>
                <div style={styles.alertGrid}>
                  {alerts.businessOpportunityDue.map(c => (
                    <div key={c.id} style={{...styles.alertCard, borderLeft: '5px solid #ffc107'}}>
                      <h4>{c.name}</h4>
                      <p><strong>Joined:</strong> {c.dateOfJoining}</p>
                      <p><strong>Customer for:</strong> {calculateDaysSinceJoining(c.dateOfJoining)} days</p>
                      <p style={{color: '#ffc107', fontWeight: 'bold'}}>🌟 Time to share business opportunity!</p>
                      <button onClick={() => handleBusinessOpportunityAlert(c.id)} style={{...styles.btnSuccess, width: '100%'}}>✅ Mark Done for {getCurrentMonthLabel()}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts.sevenDayWelcomeDue.length > 0 && (
              <div style={styles.alertSection}>
                <h3 style={{color: '#b39ddb', display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <Gift size={24} /> 🎉 7-Day Welcome Milestone ({alerts.sevenDayWelcomeDue.length})
                </h3>
                <p style={{ color: '#666', fontSize: '13px' }}>Customers who have completed 7 days - send them a welcome milestone message</p>
                <div style={styles.alertGrid}>
                  {alerts.sevenDayWelcomeDue.map(c => (
                    <div key={c.id} style={{...styles.alertCard, borderLeft: '5px solid #b39ddb'}}>
                      <h4>{c.name}</h4>
                      <p><strong>Joined:</strong> {c.dateOfJoining}</p>
                      <p><strong>Days completed:</strong> {calculateDaysSinceJoining(c.dateOfJoining)} days</p>
                      <p style={{color: '#9c88c4', fontWeight: 'bold'}}>🎉 7-day milestone reached!</p>
                      <button onClick={() => handle7DayWelcomeAlert(c.id)} style={{...styles.btnSuccess, width: '100%'}}>✅ Mark Complete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts.reorderDueGold.length > 0 && (
              <div style={styles.alertSection}>
                <h3 style={{color: '#f1c40f', display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <Package size={24} /> 👑 Gold Customer Reorders - 20 Day Cycle ({alerts.reorderDueGold.length})
                </h3>
                <div style={styles.alertGrid}>
                  {alerts.reorderDueGold.map(c => (
                    <div key={c.id} style={{...styles.alertCard, borderLeft: '5px solid #f1c40f'}}>
                      <h4>{c.name} 👑</h4>
                      <p><strong>Last Purchase:</strong> {c.lastPurchaseDate}</p>
                      <p><strong>Days Since:</strong> {c.daysSincePurchase} (Gold: 20 days)</p>
                      <button onClick={() => handleUpdatePurchaseDate(c.id)} style={{...styles.btnSuccess, width: '100%'}}>🛒 Mark New Purchase</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts.reorderDueNonGold.length > 0 && (
              <div style={styles.alertSection}>
                <h3 style={{color: '#9b59b6', display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <Package size={24} /> 👤 Non-Gold Customer Reorders - 30 Day Cycle ({alerts.reorderDueNonGold.length})
                </h3>
                <div style={styles.alertGrid}>
                  {alerts.reorderDueNonGold.map(c => (
                    <div key={c.id} style={styles.alertCard}>
                      <h4>{c.name}</h4>
                      <p><strong>Last Purchase:</strong> {c.lastPurchaseDate}</p>
                      <p><strong>Days Since:</strong> {c.daysSincePurchase} (Non-Gold: 30 days)</p>
                      <button onClick={() => handleUpdatePurchaseDate(c.id)} style={{...styles.btnSuccess, width: '100%'}}>🛒 Mark New Purchase</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts.welcomeCallPending.length > 0 && (
              <div style={styles.alertSection}>
                <h3 style={{color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <AlertCircle size={24} /> Welcome Calls ({alerts.welcomeCallPending.length})
                </h3>
                <div style={styles.alertGrid}>
                  {alerts.welcomeCallPending.map(c => (
                    <div key={c.id} style={styles.alertCard}>
                      <h4>{c.name}</h4>
                      <p><strong>Joined:</strong> {c.dateOfJoining}</p>
                      <button onClick={() => handleWelcomeCallDone(c.id)} style={{...styles.btnSuccess, width: '100%'}}>☎️ Mark Done</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts.dailyAlertCheck.length > 0 && (
              <div style={styles.alertSection}>
                <h3 style={{color: '#f39c12', display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <Clock size={24} /> Daily Responses ({alerts.dailyAlertCheck.length})
                </h3>
                <div style={styles.alertGrid}>
                  {alerts.dailyAlertCheck.map(c => (
                    <div key={c.id} style={styles.alertCard}>
                      <h4>{c.name}</h4>
                      <p><strong>Last Response:</strong> {c.lastResponseDate || 'Never'}</p>
                      <div style={{display: 'flex', gap: '10px'}}>
                        <button onClick={() => handleDailyAlertResponse(c.id, true)} style={{...styles.btnSuccess, flex: 1}}>✅ Yes</button>
                        <button onClick={() => handleDailyAlertResponse(c.id, false)} style={{...styles.btnCancel, flex: 1}}>❌ No</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts.sevenDayPresentationDue.length > 0 && (
              <div style={styles.alertSection}>
                <h3 style={{color: '#4ecdc4', display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <CheckCircle size={24} /> Healthy Family Presentation Invites ({alerts.sevenDayPresentationDue.length})
                </h3>
                <div style={styles.alertGrid}>
                  {alerts.sevenDayPresentationDue.map(c => (
                    <div key={c.id} style={styles.alertCard}>
                      <h4>{c.name}</h4>
                      <p><strong>Joined:</strong> {c.dateOfJoining}</p>
                      <button onClick={() => handleSend7DayInvite(c.id)} style={{...styles.btnSuccess, width: '100%'}}>🎤 Send Invite</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalPendingTasks === 0 && (
              <div style={styles.emptyState}>
                <p>✅ All caught up!</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <p>💾 All data saved locally. Gold: 20-day reorder cycle | Non-Gold: 30-day reorder cycle</p>
      </div>
    </div>
  );
}

const styles = {
  container: { fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' },
  header: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px 40px' },
  title: { margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold' },
  subtitle: { margin: 0, fontSize: '13px', opacity: 0.9 },
  excelBtn: { padding: '12px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  tasksBtn: { padding: '12px 20px', backgroundColor: 'white', color: '#667eea', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  tasksDropdown: { backgroundColor: 'white', margin: '0 40px', padding: '20px', borderRadius: '0 0 12px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderTop: '3px solid #667eea' },
  taskItem: { padding: '10px 0', borderBottom: '1px solid #f0f2f5' },
  taskLabel: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' },
  checkbox: { width: '18px', height: '18px', cursor: 'pointer' },
  taskBadgeRed: { backgroundColor: '#e74c3c', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  taskBadgeOrange: { backgroundColor: '#f39c12', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  taskBadgeTeal: { backgroundColor: '#4ecdc4', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  taskBadgePurple: { backgroundColor: '#9b59b6', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  taskBadgeGold: { backgroundColor: '#f1c40f', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  taskBadgeDarkRed: { backgroundColor: '#c0392b', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  taskBadgeLavender: { backgroundColor: '#b39ddb', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  taskBadgeBrightGold: { backgroundColor: '#ffc107', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  nav: { display: 'flex', gap: '10px', padding: '15px 40px', backgroundColor: 'white', borderBottom: '1px solid #ddd', flexWrap: 'wrap' },
  navBtn: { padding: '10px 20px', border: 'none', borderRadius: '8px', backgroundColor: '#f0f2f5', color: '#333', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  navBtnActive: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' },
  content: { padding: '30px 40px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' },
  statCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' },
  statNumber: { fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' },
  statLabel: { color: '#666', fontSize: '13px', fontWeight: '500' },
  formContainer: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', marginBottom: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' },
  helperText: { fontSize: '12px', color: '#667eea', fontWeight: '500', margin: '5px 0 0 0' },
  formActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  btnPrimary: { padding: '10px 20px', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  btnSuccess: { padding: '10px 20px', border: 'none', borderRadius: '8px', backgroundColor: '#27ae60', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  btnCancel: { padding: '10px 20px', border: '2px solid #ddd', borderRadius: '8px', backgroundColor: 'white', color: '#333', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  btnSmall: { padding: '6px 12px', border: 'none', borderRadius: '6px', backgroundColor: '#3498db', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  customersTable: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' },
  customerCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #eee' },
  goldCard: { border: '2px solid #f1c40f', boxShadow: '0 4px 15px rgba(241, 196, 15, 0.2)' },
  urgentCard: { border: '2px solid #c0392b', boxShadow: '0 4px 15px rgba(192, 57, 43, 0.2)' },
  cardHeader: { borderBottom: '2px solid #f0f2f5', paddingBottom: '12px', marginBottom: '12px' },
  cardTitle: { margin: 0, fontSize: '18px' },
  goldBadge: { backgroundColor: '#f1c40f', color: 'white', padding: '4px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold' },
  nonGoldBadge: { backgroundColor: '#95a5a6', color: 'white', padding: '4px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold' },
  urgentBadge: { backgroundColor: '#c0392b', color: 'white', padding: '4px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold' },
  cardMeta: { display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' },
  badge: { backgroundColor: '#f0f2f5', color: '#666', padding: '3px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: '500' },
  cardContent: { fontSize: '13px', color: '#555', lineHeight: '1.8', marginBottom: '12px' },
  cardStatus: { marginBottom: '12px' },
  statusItem: { padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '13px' },
  cardActions: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  alertSection: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  alertGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginTop: '15px' },
  alertCard: { backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '10px', border: '1px solid #e0e0e0' },
  emptyState: { backgroundColor: '#e8f4f8', padding: '25px', borderRadius: '12px', color: '#3498db', textAlign: 'center', fontSize: '15px' },
  footer: { backgroundColor: '#f8f9fa', padding: '15px 40px', borderTop: '1px solid #ddd', textAlign: 'center', fontSize: '12px', color: '#666' }
};
