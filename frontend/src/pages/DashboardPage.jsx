import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity, Bell, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, Clock3,
  CreditCard, FileHeart, HeartPulse, LayoutDashboard, LogOut, Menu, MessageSquare,
  Camera, Pill, Search, Settings, ShieldCheck, Stethoscope, Trash2, UserRound, Users, X,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import './DashboardPage.css';
import './ProfilePhoto.css';

const roleMeta = {
  patient: { label: 'Patient portal', icon: UserRound, greeting: 'Your health journey, clearly organized.' },
  doctor: { label: 'Doctor workspace', icon: Stethoscope, greeting: 'Your clinical day, thoughtfully arranged.' },
  admin: { label: 'Clinic administration', icon: ShieldCheck, greeting: 'People, approvals, and clinic performance.' },
};

const menuByRole = {
  patient: [
    ['overview', 'Overview', LayoutDashboard], ['appointments', 'Appointments', CalendarDays],
    ['records', 'Health records', FileHeart], ['billing', 'Billing & receipts', CreditCard],
    ['profile', 'Profile settings', Settings],
  ],
  doctor: [
    ['overview', 'Overview', LayoutDashboard], ['appointments', 'Appointments', CalendarDays],
    ['patients', 'Patients', Users], ['messages', 'Messages', MessageSquare],
    ['profile', 'Profile settings', Settings],
  ],
  admin: [
    ['overview', 'Overview', LayoutDashboard], ['approvals', 'Doctor approvals', CheckCircle2],
    ['users', 'Users', Users], ['reports', 'Reports', Activity],
    ['profile', 'Profile settings', Settings],
  ],
};

const roleStats = {
  patient: [
    ['Upcoming visits', '02', CalendarDays, '+1 this month'], ['Prescriptions', '04', Pill, '2 currently active'],
    ['Health records', '12', FileHeart, 'All records secured'], ['Outstanding bill', '₹1,250', CreditCard, 'Due 18 July'],
  ],
  doctor: [
    ['Today’s visits', '08', CalendarDays, 'Next at 10:30 AM'], ['Patients this week', '34', Users, '+12% from last week'],
    ['Pending notes', '03', ClipboardList, 'Needs your review'], ['Messages', '06', MessageSquare, '2 marked urgent'],
  ],
};

function StatCard({ item }) {
  const [label, value, Icon, note] = item;
  return <article className="dash-stat"><span><Icon/></span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div><ChevronRight className="dash-stat__arrow"/></article>;
}

function AnalyticsChart({ role }) {
  const values = role === 'admin' ? [42, 56, 48, 72, 64, 86, 78] : role === 'doctor' ? [36, 58, 44, 70, 62, 82, 67] : [30, 48, 62, 44, 76, 58, 84];
  return <article className="dash-panel dash-analytics"><div className="dash-panel__head"><div><h2>{role === 'admin' ? 'Patient registrations' : role === 'doctor' ? 'Weekly appointments' : 'Health activity'}</h2><p>Activity over the last seven days</p></div><select aria-label="Analytics period"><option>This week</option><option>This month</option></select></div><div className="dash-chart" aria-label="Seven-day activity bar chart">{values.map((value,index)=><span key={index} style={{'--bar':`${value}%`}}><i/><small>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][index]}</small></span>)}</div></article>;
}

function PatientOverview() {
  return <><section className="dash-stats">{roleStats.patient.map(item=><StatCard item={item} key={item[0]}/>)}</section><section className="dash-content-grid"><article className="dash-panel dash-appointments"><div className="dash-panel__head"><div><h2>Upcoming appointments</h2><p>Your confirmed clinic visits</p></div><button className="dash-link">View all</button></div><div className="appointment-item"><span className="date-chip"><b>16</b><small>JUL</small></span><div><strong>General consultation</strong><p>Dr. Ananya Sharma · 10:30–11:00 AM</p></div><button>View details</button></div><div className="appointment-item"><span className="date-chip"><b>24</b><small>JUL</small></span><div><strong>Dental follow-up</strong><p>Dr. Rahul Mehta · 3:30–4:00 PM</p></div><button>Reschedule</button></div></article><aside className="dash-panel health-score"><div className="score-ring"><strong>82</strong><small>/100</small></div><h2>Health score</h2><p>Your wellness activity improved by 8% this month.</p><ul><li>Stay hydrated</li><li>Complete daily walk</li><li>Take medicine at 8 PM</li></ul></aside></section><section className="dash-content-grid"><AnalyticsChart role="patient"/><article className="dash-panel"><div className="dash-panel__head"><div><h2>Recent records</h2><p>Reports and prescriptions</p></div></div><div className="record-row"><FileHeart/><span><b>Blood test report</b><small>12 July 2026 · PDF</small></span><button>Open</button></div><div className="record-row"><Pill/><span><b>Digital prescription</b><small>08 July 2026 · Dr. Sharma</small></span><button>Open</button></div><div className="record-row"><CreditCard/><span><b>Consultation receipt</b><small>08 July 2026 · Paid</small></span><button>Open</button></div></article></section></>;
}

function DoctorOverview() {
  return <><section className="dash-stats">{roleStats.doctor.map(item=><StatCard item={item} key={item[0]}/>)}</section><section className="dash-content-grid"><article className="dash-panel dash-appointments"><div className="dash-panel__head"><div><h2>Today’s schedule</h2><p>Monday, 13 July · 8 appointments</p></div><button className="dash-link">Full schedule</button></div>{[['10:30','Priya Verma','Routine consultation','Waiting'],['11:15','Arjun Singh','Follow-up visit','Confirmed'],['12:00','Meera Patel','Blood pressure review','Confirmed'],['03:30','Kabir Khan','Video consultation','Online']].map(row=><div className="patient-row" key={row[0]}><b>{row[0]}</b><span className="patient-avatar">{row[1].split(' ').map(word=>word[0]).join('')}</span><div><strong>{row[1]}</strong><p>{row[2]}</p></div><em>{row[3]}</em><button>Open</button></div>)}</article><aside className="dash-panel mini-calendar"><div className="dash-panel__head"><div><h2>July 2026</h2><p>Clinic calendar</p></div></div><div className="calendar-week"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>{[13,14,15,16,17,18,19].map(day=><b className={day===13?'today':''} key={day}>{day}</b>)}</div><div className="calendar-note"><Clock3/><span><b>Next: Priya Verma</b><small>10:30 AM · Room 204</small></span></div></aside></section><section className="dash-content-grid"><AnalyticsChart role="doctor"/><article className="dash-panel"><div className="dash-panel__head"><div><h2>Patient overview</h2><p>This week’s clinical progress</p></div></div><div className="metric-line"><span>Completed visits</span><b>28</b><i style={{width:'82%'}}/></div><div className="metric-line"><span>Follow-ups booked</span><b>16</b><i style={{width:'64%'}}/></div><div className="metric-line"><span>Reports reviewed</span><b>21</b><i style={{width:'72%'}}/></div></article></section></>;
}

function AdminOverview({ summary, pending, approve }) {
  const cards = summary ? [['Total patients',summary.patients,Users,'Registered accounts'],['Approved doctors',summary.approvedDoctors,Stethoscope,'Active clinicians'],['Pending approvals',summary.pendingDoctors,CheckCircle2,'Needs review'],['Administrators',summary.admins,ShieldCheck,'System access']] : [];
  return <><section className="dash-stats">{cards.map(item=><StatCard item={item} key={item[0]}/>)}</section><section className="dash-content-grid"><AnalyticsChart role="admin"/><article className="dash-panel"><div className="dash-panel__head"><div><h2>Clinic performance</h2><p>Current operational health</p></div></div><div className="metric-line"><span>Appointment capacity</span><b>86%</b><i style={{width:'86%'}}/></div><div className="metric-line"><span>Doctor availability</span><b>74%</b><i style={{width:'74%'}}/></div><div className="metric-line"><span>Patient satisfaction</span><b>92%</b><i style={{width:'92%'}}/></div></article></section><ApprovalPanel pending={pending} approve={approve}/></>;
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
  const labels={appointments:'Appointments',records:'Health records',billing:'Billing and receipts',patients:'Patient directory',messages:'Messages',users:'User management',reports:'Clinic reports'};
  return <section className="dash-panel module-panel"><span><ClipboardList/></span><h2>{labels[active] || 'Workspace'}</h2><p>This {role} workspace is ready for live clinic data. The complete module will populate as appointments, records, and activity are added.</p><button>Return to overview</button></section>;
}

export default function DashboardPage({ expectedRole }) {
  const [user,setUser]=useState(null), [error,setError]=useState(''), [summary,setSummary]=useState(null), [pending,setPending]=useState([]), [menu,setMenu]=useState(false), [message,setMessage]=useState(''), [active,setActive]=useState('overview');
  const load=useCallback(async()=>{try{const profile=await apiRequest('/auth/me');if(profile.user.role!==expectedRole)throw new Error('This dashboard does not match your account role');setUser(profile.user);if(expectedRole==='admin'){const data=await apiRequest('/admin/summary');setSummary(data.summary);setPending(data.pendingDoctors)}}catch(e){setError(e.message)}},[expectedRole]);
  useEffect(()=>{const timer=window.setTimeout(load,0);return()=>window.clearTimeout(timer)},[load]);
  async function logout(){await apiRequest('/auth/logout',{method:'POST'});window.location.hash='home'}
  async function approve(id){try{const result=await apiRequest(`/admin/doctors/${id}/approve`,{method:'PATCH'});setMessage(result.message);await load()}catch(e){setMessage(e.message)}}
  async function changePassword(event){event.preventDefault();const data=new FormData(event.currentTarget);if(data.get('newPassword')!==data.get('confirmPassword')){setMessage('New passwords do not match');return}try{const result=await apiRequest('/auth/password',{method:'PATCH',body:JSON.stringify({currentPassword:data.get('currentPassword'),newPassword:data.get('newPassword')})});setMessage(result.message);event.currentTarget.reset()}catch(err){setMessage(err.message)}}
  if(error)return <main className="dashboard-state"><ShieldCheck/><h1>Access unavailable</h1><p>{error}</p><a href={`#${expectedRole}-login`}>Return to login</a></main>;
  if(!user)return <main className="dashboard-state"><HeartPulse className="dashboard-pulse"/><p>Loading your secure dashboard…</p></main>;
  const RoleIcon=roleMeta[expectedRole].icon;
  return <main className={`dashboard dashboard--${expectedRole}`}><aside className={menu?'open':''}><a href="#home" className="dashboard-brand"><span><HeartPulse/></span><div><strong>People’s Clinic</strong><small>AI-Powered Healthcare</small></div></a><div className="dash-search"><Search/><input placeholder="Search" aria-label="Search dashboard"/></div><nav>{menuByRole[expectedRole].map(([id,label,Icon])=><button key={id} className={active===id?'active':''} onClick={()=>{setActive(id);setMenu(false)}}><Icon/>{label}{active===id&&<ChevronRight/>}</button>)}</nav><div className="dash-support"><HeartPulse/><div><b>Need assistance?</b><small>Our support team is here.</small></div></div><button className="dashboard-logout" onClick={logout}><LogOut/>Logout</button></aside><section className="dashboard-main"><header><button className="dashboard-menu" onClick={()=>setMenu(value=>!value)}>{menu?<X/>:<Menu/>}</button><div><p>{roleMeta[expectedRole].label}</p><h1>{active==='overview'?`Welcome back, ${user.fullName.split(' ')[0]}`:menuByRole[expectedRole].find(item=>item[0]===active)?.[1]}</h1><small>{active==='overview'?roleMeta[expectedRole].greeting:'Manage your information securely.'}</small></div><button className="header-icon" aria-label="Notifications"><Bell/></button><button className="header-profile" onClick={()=>setActive('profile')}><span><RoleIcon/></span><div><b>{user.fullName}</b><small>{expectedRole}</small></div></button></header>{active==='profile'?<ProfileSettings user={user} role={expectedRole} message={message} setMessage={setMessage} changePassword={changePassword}/>:active==='overview'?(expectedRole==='patient'?<PatientOverview/>:expectedRole==='doctor'?<DoctorOverview/>:<AdminOverview summary={summary} pending={pending} approve={approve}/>):<SectionPlaceholder active={active} role={expectedRole} pending={pending} approve={approve}/>}</section></main>;
}
