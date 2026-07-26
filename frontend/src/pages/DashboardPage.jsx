import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell, CalendarDays, CheckCircle2, ChevronRight, ClipboardList,
  CreditCard, DollarSign, FileHeart, HeartPulse, LayoutDashboard, LogOut, Menu, MessageSquare,
  Camera, Pill, RefreshCw, Search, Settings, ShieldCheck, Stethoscope, Trash2, UserPlus, UserRound, Users, X,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import './DashboardPage.css';
import './ProfilePhoto.css';
import './SyncAppointments.css';
import './DashboardModules.css';
import './HealthRecordsOverrides.css';
import './PatientActions.css';
import './CalendarStatus.css';
import { DoctorAppointmentCalendar, DoctorAppointmentsPanel, DoctorPatientsPanel, normalizeAppointment, PatientDashboardModule } from './DashboardModules.jsx';
import MedicationPanel, { HealthSummaryPanel, PrescriptionPanel } from './MedicationPanel.jsx';

const roleMeta = {
  patient: { label: 'Patient portal', icon: UserRound, greeting: 'Your health journey, clearly organized.' },
  doctor: { label: 'Doctor workspace', icon: Stethoscope, greeting: 'Your clinical day, thoughtfully arranged.' },
  admin: { label: 'Clinic administration', icon: ShieldCheck, greeting: 'People, approvals, and clinic performance.' },
};

const menuByRole = {
  patient: [
    ['overview', 'Overview', LayoutDashboard], ['appointments', 'Appointments', CalendarDays],
    ['records', 'Health records', FileHeart], ['prescriptions', 'Prescriptions', ClipboardList], ['medications', 'Medication manager', Pill], ['summary', 'Health summary', HeartPulse], ['billing', 'Billing & receipts', CreditCard],
    ['profile', 'Profile settings', Settings],
  ],
  doctor: [
    ['overview', 'Overview', LayoutDashboard], ['appointments', 'Appointments', CalendarDays],
    ['patients', 'Patients', Users], ['messages', 'Messages', MessageSquare],
    ['profile', 'Profile settings', Settings],
  ],
  admin: [
    ['overview', 'Overview', LayoutDashboard], ['patients', 'Patients', Users], ['doctors', 'Doctors', Stethoscope],
    ['approvals', 'Doctor approvals', CheckCircle2], ['administrators', 'Administrators', ShieldCheck],
    ['finance', 'Revenue & analytics', DollarSign], ['appointments', 'Appointments', CalendarDays],
    ['profile', 'Profile settings', Settings],
  ],
};

const roleStats = {
  patient: [
    ['All visits', '02', CalendarDays, 'Past and upcoming appointments'], ['Prescriptions', '00', Pill, 'Medicine schedule'],
    ['Health records', '00', FileHeart, 'Open or upload records'], ['Health summary', 'AI', HeartPulse, 'Report insights'],
  ],
  doctor: [
    ['Today’s visits', '08', CalendarDays, 'Next at 10:30 AM'], ['Patients this week', '34', Users, '+12% from last week'],
    ['Pending notes', '03', ClipboardList, 'Needs your review'], ['Messages', '06', MessageSquare, '2 marked urgent'],
  ],
};

function StatCard({ item }) {
  const [label, value, Icon, note] = item;
  const [liveValue,setLiveValue]=useState(value);
  const targets={"All visits":'appointments',Prescriptions:'prescriptions',"Health records":'records',"Health summary":'summary'};
  useEffect(()=>{if(label==='All visits'){apiRequest('/appointments').then(data=>setLiveValue(String(data.appointments?.length||0).padStart(2,'0'))).catch(()=>{})}if(label==='Prescriptions'){apiRequest('/medications').then(data=>setLiveValue(String(data.medications?.filter(item=>item.active).length||0).padStart(2,'0'))).catch(()=>{})}if(label==='Health records'){apiRequest('/medical-reports').then(data=>setLiveValue(String(data.reports?.length||0).padStart(2,'0'))).catch(()=>{})}},[label]);
  const open=()=>targets[label]&&window.dispatchEvent(new CustomEvent('patient-dashboard-open',{detail:targets[label]}));
  return <article className={`dash-stat ${targets[label]?'dash-stat--action':''}`} onClick={open} onKeyDown={event=>{if((event.key==='Enter'||event.key===' ')&&targets[label])open()}} role={targets[label]?'button':undefined} tabIndex={targets[label]?0:undefined}><span><Icon/></span><div><small>{label}</small><strong>{liveValue}</strong><p>{note}</p></div><ChevronRight className="dash-stat__arrow"/></article>;
}

function AnalyticsChart({ role }) {
  const values = role === 'admin' ? [42, 56, 48, 72, 64, 86, 78] : role === 'doctor' ? [36, 58, 44, 70, 62, 82, 67] : [30, 48, 62, 44, 76, 58, 84];
  return <article className="dash-panel dash-analytics"><div className="dash-panel__head"><div><h2>{role === 'admin' ? 'Patient registrations' : role === 'doctor' ? 'Weekly appointments' : 'Health activity'}</h2><p>Activity over the last seven days</p></div><select aria-label="Analytics period"><option>This week</option><option>This month</option></select></div><div className="dash-chart" aria-label="Seven-day activity bar chart">{values.map((value,index)=><span key={index} style={{'--bar':`${value}%`}}><i/><small>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][index]}</small></span>)}</div></article>;
}

function PatientAppointmentCalendar({ appointments }) {
  const firstDate=appointments.find(item=>/^\d{4}-\d{2}-\d{2}$/.test(item.date||''))?.date;
  const initial=firstDate?new Date(`${firstDate}T00:00:00`):new Date();
  const [visibleMonth,setVisibleMonth]=useState(()=>new Date(initial.getFullYear(),initial.getMonth(),1));
  const [selectedDate,setSelectedDate]=useState(firstDate||'');
  const year=visibleMonth.getFullYear(),month=visibleMonth.getMonth();
  const daysInMonth=new Date(year,month+1,0).getDate(),firstDay=new Date(year,month,1).getDay();
  const dateKey=day=>`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const visitsByDate=appointments.reduce((map,item)=>{if(/^\d{4}-\d{2}-\d{2}$/.test(item.date||''))(map[item.date]??=[]).push(item);return map},{});
  const selectedVisits=visitsByDate[selectedDate]||[];
  const moveMonth=offset=>{setVisibleMonth(new Date(year,month+offset,1));setSelectedDate('')};
  useEffect(()=>{document.querySelectorAll('.patient-calendar .calendar-grid>button').forEach((button,index)=>{const key=dateKey(index+1);button.classList.remove('past-appointment','upcoming-appointment');if(visitsByDate[key]?.length)button.classList.add(key<new Date().toISOString().slice(0,10)?'past-appointment':'upcoming-appointment')})},[year,month,appointments]);
  return <aside className="dash-panel doctor-calendar patient-calendar"><div className="dash-panel__head"><div><h2>Appointment calendar</h2><p>Your confirmed and previous clinic visits</p></div><CalendarDays/></div><div className="calendar-toolbar"><button type="button" onClick={()=>moveMonth(-1)} aria-label="Previous month">‹</button><strong>{visibleMonth.toLocaleString('en',{month:'long',year:'numeric'})}</strong><button type="button" onClick={()=>moveMonth(1)} aria-label="Next month">›</button></div><div className="calendar-weekdays">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=><span key={day}>{day}</span>)}</div><div className="calendar-grid">{Array.from({length:firstDay},(_,index)=><span className="calendar-blank" key={`blank-${index}`}/>)}{Array.from({length:daysInMonth},(_,index)=>{const day=index+1,key=dateKey(day),count=visitsByDate[key]?.length||0;return <button type="button" key={key} className={`${count?'has-appointment':''} ${selectedDate===key?'selected':''}`} onClick={()=>setSelectedDate(key)}><span>{day}</span>{count>0&&<small>{count}</small>}</button>})}</div><div className="calendar-legend"><i/> Appointment date</div>{selectedDate&&<div className="calendar-selection"><b>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</b>{selectedVisits.length?selectedVisits.map(item=><span key={item.bookingId} className={item.status==='visited'?'visit-completed':''}><strong>{item.time}</strong> {item.doctorName}<small>{item.bookingId} · {item.status==='visited'?'Visited':item.status}</small></span>):<p>No appointments on this date.</p>}</div>}</aside>;
}

function PatientOverview() {
  const [appointments,setAppointments]=useState([]), [appointmentsError,setAppointmentsError]=useState(''), [syncing,setSyncing]=useState(false), [syncMessage,setSyncMessage]=useState('');
  const synchronize=useCallback(async()=>{setSyncing(true);setAppointmentsError('');setSyncMessage('');try{const data=await apiRequest('/appointments');const visits=(data.appointments||[]).map(normalizeAppointment);setAppointments(visits);setSyncMessage(visits.length?`${visits.length} appointment${visits.length===1?'':'s'} synchronized with your account email.`:'Synchronization complete. No booking was found for your account email.')}catch(error){setAppointmentsError(error.message)}finally{setSyncing(false)}},[]);
  useEffect(()=>{synchronize();const timer=window.setInterval(synchronize,30000);return()=>window.clearInterval(timer)},[synchronize]);
  const futureAppointments=appointments.filter(item=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date||''))return false;const match=String(item.time||'').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);if(!match)return new Date(`${item.date}T23:59:59`)>=new Date();let hours=Number(match[1])%12;if(match[3].toUpperCase()==='PM')hours+=12;return new Date(`${item.date}T${String(hours).padStart(2,'0')}:${match[2]}:00`)>=new Date()}).filter(item=>!['cancelled','visited','completed'].includes(String(item.status||'').toLowerCase()));
  async function cancelVisit(item){if(!window.confirm(`Cancel appointment ${item.bookingId}?`))return;try{const result=await apiRequest(`/appointments/${encodeURIComponent(item.bookingId)}/cancel`,{method:'POST'});setSyncMessage(result.message||'Appointment cancelled');await synchronize()}catch(error){setAppointmentsError(error.message)}}
  async function rescheduleVisit(item){const date=window.prompt('Enter the new date (YYYY-MM-DD)',item.date);if(!date)return;const time=window.prompt('Enter the new time (for example 10:30 AM)',item.time);if(!time)return;try{const result=await apiRequest(`/appointments/${encodeURIComponent(item.bookingId)}/reschedule`,{method:'PATCH',body:JSON.stringify({date,time})});setSyncMessage(result.message||'Appointment rescheduled');await synchronize()}catch(error){setAppointmentsError(error.message)}}
  if (appointments) {
    const appointmentStats = roleStats.patient.map((item,index)=>index===0?[item[0],String(appointments.length).padStart(2,'0'),item[2],appointments.length?'Synced from Google Sheets':'No confirmed visits']:item);
    return <><section className="dash-stats">{appointmentStats.map(item=><StatCard item={item} key={item[0]}/>)}</section><section className="dash-content-grid"><article className="dash-panel dash-appointments"><div className="dash-panel__head"><div><h2>Upcoming appointments</h2><p>Only visits at or after the current date and time are shown.</p></div><button className="dash-sync" type="button" onClick={synchronize} disabled={syncing}><RefreshCw className={syncing?'spinning':''}/>{syncing?'Synchronizing…':'Synchronize appointments'}</button></div>{syncMessage&&<p className="dash-sync-message"><CheckCircle2/>{syncMessage}</p>}{appointmentsError&&<div className="dash-empty"><b>Appointment action unavailable</b><p>{appointmentsError}</p><button type="button" onClick={synchronize}>Try again</button></div>}{!appointmentsError&&!futureAppointments.length&&<div className="dash-empty"><CalendarDays/><b>No upcoming appointments</b><p>Past visits remain available under All visits.</p></div>}{futureAppointments.map(item=>{const date=new Date(`${item.date}T00:00:00`);return <div className="appointment-item" key={item.bookingId}><span className="date-chip"><b>{String(date.getDate()).padStart(2,'0')}</b><small>{date.toLocaleString('en',{month:'short'}).toUpperCase()}</small></span><div><strong>{item.doctorName}</strong><p>{item.time} · {item.status||'Confirmed'}</p><small>{item.bookingId}</small></div><div className="appointment-actions"><button type="button" onClick={()=>rescheduleVisit(item)}>Reschedule</button><button type="button" className="appointment-cancel" onClick={()=>cancelVisit(item)}>Cancel</button></div></div>})}</article><PatientAppointmentCalendar appointments={appointments}/></section><section className="dash-content-grid"><AnalyticsChart role="patient"/></section></>;
  }
  if (Array.isArray(appointments)) {
    const appointmentStats = roleStats.patient.map((item,index)=>index===0?[item[0],String(appointments.length).padStart(2,'0'),item[2],appointments.length?'Synced from Google Sheets':'No confirmed visits']:item);
    return <><section className="dash-stats">{appointmentStats.map(item=><StatCard item={item} key={item[0]}/>)}</section><section className="dash-content-grid"><article className="dash-panel dash-appointments"><div className="dash-panel__head"><div><h2>Upcoming appointments</h2><p>Only visits at or after the current date and time are shown.</p></div><button className="dash-sync" type="button" onClick={synchronize} disabled={syncing}><RefreshCw className={syncing?'spinning':''}/>{syncing?'Synchronizing…':'Synchronize appointments'}</button></div>{syncMessage&&<p className="dash-sync-message"><CheckCircle2/>{syncMessage}</p>}{appointmentsError&&<div className="dash-empty"><b>Appointment action unavailable</b><p>{appointmentsError}</p><button type="button" onClick={synchronize}>Try again</button></div>}{!appointmentsError&&!futureAppointments.length&&<div className="dash-empty"><CalendarDays/><b>No upcoming appointments</b><p>Past visits remain available under All visits.</p></div>}{futureAppointments.map(item=>{const date=new Date(`${item.date}T00:00:00`);return <div className="appointment-item" key={item.bookingId}><span className="date-chip"><b>{String(date.getDate()).padStart(2,'0')}</b><small>{date.toLocaleString('en',{month:'short'}).toUpperCase()}</small></span><div><strong>{item.doctorName}</strong><p>{item.time} · {item.status||'Confirmed'}</p><small>{item.bookingId}</small></div><div className="appointment-actions"><button type="button" onClick={()=>rescheduleVisit(item)}>Reschedule</button><button type="button" className="appointment-cancel" onClick={()=>cancelVisit(item)}>Cancel</button></div></div>})}</article><aside className="dash-panel health-score"><div className="score-ring"><strong>82</strong><small>/100</small></div><h2>Health score</h2><p>Your wellness activity improved by 8% this month.</p><ul><li>Stay hydrated</li><li>Complete daily walk</li><li>Take medicine at 8 PM</li></ul></aside></section><section className="dash-content-grid"><AnalyticsChart role="patient"/></section></>;
  }
  return <><section className="dash-stats">{roleStats.patient.map(item=><StatCard item={item} key={item[0]}/>)}</section><section className="dash-content-grid"><article className="dash-panel dash-appointments"><div className="dash-panel__head"><div><h2>Upcoming appointments</h2><p>Your confirmed clinic visits</p></div><button className="dash-link">View all</button></div><div className="appointment-item"><span className="date-chip"><b>16</b><small>JUL</small></span><div><strong>General consultation</strong><p>Dr. Ananya Sharma · 10:30–11:00 AM</p></div><button>View details</button></div><div className="appointment-item"><span className="date-chip"><b>24</b><small>JUL</small></span><div><strong>Dental follow-up</strong><p>Dr. Rahul Mehta · 3:30–4:00 PM</p></div><button>Reschedule</button></div></article><aside className="dash-panel health-score"><div className="score-ring"><strong>82</strong><small>/100</small></div><h2>Health score</h2><p>Your wellness activity improved by 8% this month.</p><ul><li>Stay hydrated</li><li>Complete daily walk</li><li>Take medicine at 8 PM</li></ul></aside></section><section className="dash-content-grid"><AnalyticsChart role="patient"/><article className="dash-panel"><div className="dash-panel__head"><div><h2>Recent records</h2><p>Reports and prescriptions</p></div></div><div className="record-row"><FileHeart/><span><b>Blood test report</b><small>12 July 2026 · PDF</small></span><button>Open</button></div><div className="record-row"><Pill/><span><b>Digital prescription</b><small>08 July 2026 · Dr. Sharma</small></span><button>Open</button></div><div className="record-row"><CreditCard/><span><b>Consultation receipt</b><small>08 July 2026 · Paid</small></span><button>Open</button></div></article></section></>;
}

function DoctorOverview() {
  const [appointments,setAppointments]=useState([]),[consultations,setConsultations]=useState([]);
  useEffect(()=>{Promise.all([apiRequest('/appointments'),apiRequest('/consultations/doctor')]).then(([visits,notes])=>{setAppointments((visits.appointments||[]).map(normalizeAppointment));setConsultations(notes.consultations||[])}).catch(()=>{})},[]);
  const today=new Date(),todayKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const todayVisits=appointments.filter(item=>item.date===todayKey&&String(item.status).toLowerCase()!=='cancelled');
  const patients=new Set(appointments.map(item=>item.patientEmail||item.patientName).filter(Boolean)).size;
  const completed=new Set(consultations.filter(item=>item.status==='completed').map(item=>item.bookingId));
  const pendingNotes=todayVisits.filter(item=>!completed.has(item.bookingId)).length;
  const next=todayVisits.sort((a,b)=>String(a.time).localeCompare(String(b.time)))[0]?.time||'No visit pending';
  const cards=[['Today’s visits',String(todayVisits.length).padStart(2,'0'),CalendarDays,`Next: ${next}`],['All patients',String(patients).padStart(2,'0'),Users,'Synchronized patient directory'],['Pending notes',String(pendingNotes).padStart(2,'0'),ClipboardList,'Current-day consultations'],['Completed today',String(todayVisits.length-pendingNotes).padStart(2,'0'),CheckCircle2,'Finished consultations']];
  return <><section className="dash-stats">{cards.map(item=><StatCard item={item} key={item[0]}/>)}</section><section className="dash-content-grid"><DoctorAppointmentsPanel overview/><DoctorAppointmentCalendar/></section><section className="dash-content-grid"><AnalyticsChart role="doctor"/><article className="dash-panel"><div className="dash-panel__head"><div><h2>Patient overview</h2><p>Live appointment synchronization is active.</p></div></div><div className="metric-line"><span>Known patient files</span><b>{patients}</b><i style={{width:`${Math.min(100,patients*5)}%`}}/></div></article></section></>;
}

function AdminOverview({ summary, pending, approve }) {
  const [appointments,setAppointments]=useState([]);
  useEffect(()=>{apiRequest('/appointments').then(data=>setAppointments((data.appointments||[]).map(normalizeAppointment))).catch(()=>{})},[]);
  const revenue=appointments.filter(item=>String(item.paymentStatus).toLowerCase()==='paid').reduce((total,item)=>total+(item.fee||0),0);
  const cards = summary ? [['Total patients',summary.patients,Users,'Registered accounts'],['Approved doctors',summary.approvedDoctors,Stethoscope,'Active clinicians'],['Pending approvals',summary.pendingDoctors,CheckCircle2,'Needs review'],['Revenue',`₹${revenue.toLocaleString('en-IN')}`,DollarSign,`${appointments.length} synchronized bookings`]] : [];
  return <><section className="dash-stats">{cards.map(item=><StatCard item={item} key={item[0]}/>)}</section><section className="dash-content-grid"><RevenueAnalytics appointments={appointments}/><article className="dash-panel"><div className="dash-panel__head"><div><h2>Clinic operations</h2><p>Live synchronized performance</p></div></div><div className="metric-line"><span>Paid appointments</span><b>{appointments.filter(item=>item.paymentStatus==='paid').length}</b><i style={{width:`${appointments.length?appointments.filter(item=>item.paymentStatus==='paid').length/appointments.length*100:0}%`}}/></div><div className="metric-line"><span>Approved doctors</span><b>{summary?.approvedDoctors||0}</b><i style={{width:`${Math.min(100,(summary?.approvedDoctors||0)*20)}%`}}/></div></article></section><ApprovalPanel pending={pending} approve={approve}/></>;
}

function RevenueAnalytics({appointments}) {
  const paid=appointments.filter(item=>String(item.paymentStatus).toLowerCase()==='paid');
  const totals=paid.reduce((map,item)=>{map[item.doctorName]=(map[item.doctorName]||0)+(item.fee||0);return map},{});
  const maximum=Math.max(1,...Object.values(totals));
  return <article className="dash-panel admin-revenue"><div className="dash-panel__head"><div><h2>Revenue by doctor</h2><p>Calculated from synchronized paid appointments</p></div></div>{Object.entries(totals).map(([doctor,total])=><div className="revenue-row" key={doctor}><span><b>{doctor}</b><small>₹{total.toLocaleString('en-IN')}</small></span><i><b style={{width:`${total/maximum*100}%`}}/></i></div>)}{!paid.length&&<div className="dash-empty"><DollarSign/><b>No paid appointments synchronized</b></div>}</article>;
}

function AdminDirectory({role,title}) {
  const [users,setUsers]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const load=useCallback(()=>{setLoading(true);apiRequest(`/admin/users?role=${role}`).then(data=>setUsers(data.users||[])).catch(err=>setError(err.message)).finally(()=>setLoading(false))},[role]);
  useEffect(()=>{const timer=window.setTimeout(load,0);return()=>window.clearTimeout(timer)},[load]);
  return <article className="dash-panel module-live admin-directory"><div className="dash-panel__head"><div><h2>{title}</h2><p>Live registered account directory</p></div><button className="dash-sync" onClick={load}><RefreshCw className={loading?'spinning':''}/>Refresh</button></div>{error&&<p className="report-error">{error}</p>}{users.map(user=><div className="approval-row" key={user._id}><span className="patient-avatar">{role==='doctor'?<Stethoscope/>:role==='admin'?<ShieldCheck/>:<UserRound/>}</span><div><strong>{user.fullName}</strong><p>{user.email}{user.phone?` · ${user.phone}`:''}</p></div><span className="status-chip">{user.isActive?'Active':'Pending'}</span><small>{new Date(user.createdAt).toLocaleDateString('en-IN')}</small></div>)}</article>;
}

function AdministratorPanel() {
  const [refresh,setRefresh]=useState(0),[message,setMessage]=useState(''),[error,setError]=useState('');
  async function add(event){event.preventDefault();const form=new FormData(event.currentTarget);try{const data=await apiRequest('/admin/administrators',{method:'POST',body:JSON.stringify(Object.fromEntries(form))});setMessage(data.message);event.currentTarget.reset();setRefresh(value=>value+1)}catch(err){setError(err.message)}}
  return <section className="admin-management"><article className="dash-panel settings-form"><div className="dash-panel__head"><div><h2>Add administrator</h2><p>Create a secure clinic administration account.</p></div><UserPlus/></div><form onSubmit={add}><label>Full name<input name="fullName" required/></label><label>Email<input name="email" type="email" required/></label><label>Password<input name="password" type="password" minLength="8" required/></label><button>Add administrator</button></form>{message&&<p className="settings-message">{message}</p>}{error&&<p className="report-error">{error}</p>}</article><div key={refresh}><AdminDirectory role="admin" title="Administrators"/></div></section>;
}

function AdminFinancePanel() {
  const [appointments,setAppointments]=useState([]);
  useEffect(()=>{apiRequest('/appointments').then(data=>setAppointments((data.appointments||[]).map(normalizeAppointment))).catch(()=>{})},[]);
  return <section className="admin-finance"><RevenueAnalytics appointments={appointments}/><article className="dash-panel"><h2>Cash flow summary</h2><div className="finance-summary"><div><small>Gross paid revenue</small><b>₹{appointments.filter(item=>item.paymentStatus==='paid').reduce((sum,item)=>sum+item.fee,0).toLocaleString('en-IN')}</b></div><div><small>Paid bookings</small><b>{appointments.filter(item=>item.paymentStatus==='paid').length}</b></div><div><small>Pending payments</small><b>{appointments.filter(item=>item.paymentStatus!=='paid').length}</b></div></div></article></section>;
}

function ApprovalPanel({ pending, approve }) {
  return <section className="dash-panel approval-panel"><div className="dash-panel__head"><div><h2>Pending doctor approvals</h2><p>Review new clinical accounts before granting access</p></div><span className="count-badge">{pending.length} pending</span></div>{pending.length ? pending.map(doctor=><div className="approval-row" key={doctor._id}><span className="patient-avatar"><Stethoscope/></span><div><strong>{doctor.fullName}</strong><p>{doctor.email} · {doctor.phone}</p></div><span className="status-chip">Awaiting review</span><button onClick={()=>approve(doctor._id)}><CheckCircle2/>Approve</button></div>) : <div className="dash-empty"><CheckCircle2/><b>All caught up</b><p>No doctor accounts are waiting for approval.</p></div>}</section>;
}

function ProfileSettings({ user, role, message, setMessage, changePassword }) {
  const photoInput = useRef(null);
  const photoStorageKey = `peoples-clinic-profile-photo-${user._id || user.email}`;
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem(photoStorageKey) || '');
  function selectPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setMessage('Please choose a JPG, PNG, or WebP image.'); event.target.value = ''; return; }
    if (file.size > 2 * 1024 * 1024) { setMessage('Profile image must be smaller than 2 MB.'); event.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => { const image = String(reader.result); setProfilePhoto(image); localStorage.setItem(photoStorageKey, image); setMessage('Profile image updated successfully.'); };
    reader.readAsDataURL(file);
  }
  function removePhoto() { setProfilePhoto(''); localStorage.removeItem(photoStorageKey); if (photoInput.current) photoInput.current.value = ''; setMessage('Profile image removed.'); }
  function saveProfile(event){event.preventDefault();setMessage('Profile preferences saved successfully.');}
return <section className="profile-layout"><article className="dash-panel profile-card"><div className="profile-photo-wrap"><span className={`profile-avatar ${profilePhoto ? 'has-photo' : ''}`}>{profilePhoto ? <img src={profilePhoto} alt={`${user.fullName}'s profile`}/> : <UserRound/>}</span><button className="profile-photo-camera" type="button" onClick={()=>photoInput.current?.click()} aria-label="Choose profile image"><Camera/></button></div><input ref={photoInput} className="profile-photo-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={selectPhoto}/><div className="profile-photo-actions"><button type="button" onClick={()=>photoInput.current?.click()}><Camera/>{profilePhoto ? 'Change photo' : 'Add photo'}</button>{profilePhoto&&<button type="button" className="remove-photo" onClick={removePhoto}><Trash2/>Remove</button>}</div><small className="profile-photo-help">JPG, PNG or WebP · Maximum 2 MB</small><h2>{user.fullName}</h2><p>{roleMeta[role].label}</p><span className="verified-pill"><CheckCircle2/>Verified account</span><div><small>Email address</small><b>{user.email}</b><small>Phone number</small><b>{user.phone || 'Not provided'}</b></div></article><div><article className="dash-panel settings-form"><div className="dash-panel__head"><div><h2>Personal information</h2><p>Manage how your profile appears in the clinic system</p></div></div><form onSubmit={saveProfile}><label>Full name<input defaultValue={user.fullName} required/></label><label>Email address<input value={user.email} disabled/></label><label>Phone number<input defaultValue={user.phone || ''}/></label><label>Preferred language<select defaultValue="English"><option>English</option><option>Hindi</option></select></label><label className="settings-wide">About<textarea placeholder={role==='doctor'?'Add your specialization and clinical experience':'Add optional profile information'}/></label><button>Save profile</button></form></article><article className="dash-panel settings-form"><div className="dash-panel__head"><div><h2>Password & security</h2><p>Use a strong, unique password for your account</p></div></div><form onSubmit={changePassword}><label>Current password<input name="currentPassword" type="password" placeholder="Enter password" required/></label><label>New password<input name="newPassword" type="password" placeholder="Enter password" minLength="8" required/></label><label>Confirm new password<input name="confirmPassword" type="password" placeholder="Confirm password" minLength="8" required/></label><button>Update password</button></form>{message&&<p className="settings-message">{message}</p>}</article></div></section>;
}

function SectionPlaceholder({ active, role, pending, approve }) {
  if(active==='approvals') return <ApprovalPanel pending={pending} approve={approve}/>;
  if(role==='patient'&&active==='prescriptions') return <PrescriptionPanel/>;
  if(role==='patient'&&active==='medications') return <MedicationPanel/>;
  if(role==='patient'&&active==='summary') return <HealthSummaryPanel/>;
  if(role==='patient'&&['appointments','records','billing'].includes(active)) return <PatientDashboardModule active={active}/>;
  if(role==='doctor'&&active==='appointments') return <DoctorAppointmentsPanel/>;
  if(role==='doctor'&&active==='patients') return <DoctorPatientsPanel/>;
  if(role==='admin'&&active==='patients') return <AdminDirectory role="patient" title="Patients"/>;
  if(role==='admin'&&active==='doctors') return <AdminDirectory role="doctor" title="Approved and pending doctors"/>;
  if(role==='admin'&&active==='administrators') return <AdministratorPanel/>;
  if(role==='admin'&&active==='finance') return <AdminFinancePanel/>;
  if(role==='admin'&&active==='appointments') return <AdminAppointmentsPanel/>;
  const labels={appointments:'Appointments',records:'Health records',billing:'Billing and receipts',patients:'Patient directory',messages:'Messages',users:'User management',reports:'Clinic reports'};
  return <section className="dash-panel module-panel"><span><ClipboardList/></span><h2>{labels[active] || 'Workspace'}</h2><p>This {role} workspace is ready for live clinic data. The complete module will populate as appointments, records, and activity are added.</p><button>Return to overview</button></section>;
}

function AdminAppointmentsPanel() {
  const [appointments,setAppointments]=useState([]),[error,setError]=useState('');
  useEffect(()=>{apiRequest('/appointments').then(data=>setAppointments((data.appointments||[]).map(normalizeAppointment))).catch(err=>setError(err.message))},[]);
  return <article className="dash-panel module-live admin-appointments"><div className="dash-panel__head"><div><h2>All appointments</h2><p>Complete synchronized clinic booking history</p></div><span className="count-badge">{appointments.length} bookings</span></div>{error&&<p className="report-error">{error}</p>}{appointments.map(item=><div className="patient-directory-row" key={item.bookingId}><span className="patient-avatar"><CalendarDays/></span><div><strong>{item.patientName}</strong><p>{item.bookingId} · {item.patientEmail}</p></div><span><small>Doctor</small><b>{item.doctorName}</b></span><span><small>Visit and payment</small><b>{item.date} · {item.time} · ₹{item.fee} {item.paymentStatus}</b></span></div>)}</article>;
}

export default function DashboardPage({ expectedRole }) {
  const [user,setUser]=useState(null), [error,setError]=useState(''), [summary,setSummary]=useState(null), [pending,setPending]=useState([]), [menu,setMenu]=useState(false), [message,setMessage]=useState(''), [active,setActive]=useState('overview');
  const load=useCallback(async()=>{try{const profile=await apiRequest('/auth/me');if(profile.user.role!==expectedRole)throw new Error('This dashboard does not match your account role');setUser(profile.user);if(expectedRole==='admin'){const data=await apiRequest('/admin/summary');setSummary(data.summary);setPending(data.pendingDoctors)}}catch(e){setError(e.message)}},[expectedRole]);
  useEffect(()=>{const timer=window.setTimeout(load,0);return()=>window.clearTimeout(timer)},[load]);
  useEffect(()=>{const open=event=>setActive(event.detail);window.addEventListener('patient-dashboard-open',open);return()=>window.removeEventListener('patient-dashboard-open',open)},[]);
  async function logout(){await apiRequest('/auth/logout',{method:'POST'});window.location.hash='home'}
  async function approve(id){try{const result=await apiRequest(`/admin/doctors/${id}/approve`,{method:'PATCH'});setMessage(result.message);await load()}catch(e){setMessage(e.message)}}
  async function changePassword(event){event.preventDefault();const data=new FormData(event.currentTarget);if(data.get('newPassword')!==data.get('confirmPassword')){setMessage('New passwords do not match');return}try{const result=await apiRequest('/auth/password',{method:'PATCH',body:JSON.stringify({currentPassword:data.get('currentPassword'),newPassword:data.get('newPassword')})});setMessage(result.message);event.currentTarget.reset()}catch(err){setMessage(err.message)}}
  if(error)return <main className="dashboard-state"><ShieldCheck/><h1>Access unavailable</h1><p>{error}</p><a href={`#${expectedRole}-login`}>Return to login</a></main>;
  if(!user)return <main className="dashboard-state"><HeartPulse className="dashboard-pulse"/><p>Loading your secure dashboard…</p></main>;
  const RoleIcon=roleMeta[expectedRole].icon;
  return <main className={`dashboard dashboard--${expectedRole}`}><aside className={menu?'open':''}><a href="#home" className="dashboard-brand"><span><HeartPulse/></span><div><strong>People’s Clinic</strong><small>AI-Powered Healthcare</small></div></a><div className="dash-search"><Search/><input placeholder="Search" aria-label="Search dashboard"/></div><nav>{menuByRole[expectedRole].map(([id,label,Icon])=><button key={id} className={active===id?'active':''} onClick={()=>{setActive(id);setMenu(false)}}><Icon/>{label}{active===id&&<ChevronRight/>}</button>)}</nav><div className="dash-support"><HeartPulse/><div><b>Need assistance?</b><small>Our support team is here.</small></div></div><button className="dashboard-logout" onClick={logout}><LogOut/>Logout</button></aside><section className="dashboard-main"><header><button className="dashboard-menu" onClick={()=>setMenu(value=>!value)}>{menu?<X/>:<Menu/>}</button><div><p>{roleMeta[expectedRole].label}</p><h1>{active==='overview'?`Welcome back, ${user.fullName.split(' ')[0]}`:menuByRole[expectedRole].find(item=>item[0]===active)?.[1]}</h1><small>{active==='overview'?roleMeta[expectedRole].greeting:'Manage your information securely.'}</small></div><button className="header-icon" aria-label="Notifications"><Bell/></button><button className="header-profile" onClick={()=>setActive('profile')}><span><RoleIcon/></span><div><b>{user.fullName}</b><small>{expectedRole}</small></div></button></header>{active==='profile'?<ProfileSettings user={user} role={expectedRole} message={message} setMessage={setMessage} changePassword={changePassword}/>:active==='overview'?(expectedRole==='patient'?<PatientOverview/>:expectedRole==='doctor'?<DoctorOverview/>:<AdminOverview summary={summary} pending={pending} approve={approve}/>):<SectionPlaceholder active={active} role={expectedRole} pending={pending} approve={approve}/>}</section></main>;
}
