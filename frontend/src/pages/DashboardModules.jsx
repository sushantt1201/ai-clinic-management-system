import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CreditCard, FileHeart, ReceiptText, RefreshCw, Stethoscope } from 'lucide-react';
import { apiRequest } from '../services/api.js';

export function normalizeAppointment(item={}) {
  const date=String(item.appointment_date||item.appointmentDate||item.date||item.Date||'').trim();
  return {
    bookingId:item.booking_id||item.bookingId||item.Booking_ID||'Not assigned',
    patientName:item.patient_name||item.patientName||item.Patient||'Patient',
    doctorName:item.doctor_name||item.doctorName||item.Doctor||'Clinic doctor',
    date,
    time:item.appointment_time||item.appointmentTime||item.time||item.Time||'Time pending',
    status:item.booking_status||item.status||item.Status||'confirmed',
    paymentStatus:item.payment_status||item.paymentStatus||'pending',
    paymentId:item.payment_id||item.paymentId||'',
    fee:Number(item.fee_inr||item.feeInr||item.Fee||0),
  };
}

export function appointmentDateParts(dateValue) {
  const parsed=/^\d{4}-\d{2}-\d{2}$/.test(dateValue)?new Date(`${dateValue}T00:00:00`):null;
  if(!parsed||Number.isNaN(parsed.getTime())) return {day:'--',month:'DATE'};
  return {day:String(parsed.getDate()).padStart(2,'0'),month:parsed.toLocaleString('en',{month:'short'}).toUpperCase()};
}

export function useSynchronizedAppointments() {
  const [appointments,setAppointments]=useState([]),[error,setError]=useState(''),[syncing,setSyncing]=useState(false),[message,setMessage]=useState('');
  const synchronize=useCallback(async()=>{setSyncing(true);setError('');setMessage('');try{const data=await apiRequest('/appointments');const visits=(data.appointments||[]).map(normalizeAppointment);setAppointments(visits);setMessage(`${visits.length} appointment${visits.length===1?'':'s'} synchronized.`)}catch(err){setError(err.message)}finally{setSyncing(false)}},[]);
  useEffect(()=>{synchronize()},[synchronize]);
  return {appointments,error,syncing,message,synchronize};
}

function SyncButton({syncing,onClick,label='Synchronize appointments'}) { return <button className="dash-sync" type="button" onClick={onClick} disabled={syncing}><RefreshCw className={syncing?'spinning':''}/>{syncing?'Synchronizing…':label}</button>; }

function AppointmentRows({appointments,doctorView=false}) {
  const [selected,setSelected]=useState('');
  if(!appointments.length)return <div className="dash-empty"><CalendarDays/><b>No synchronized appointments</b><p>New confirmed bookings will appear here.</p></div>;
  return appointments.map(item=>{const parts=appointmentDateParts(item.date);const open=selected===item.bookingId;return <div className="appointment-entry" key={item.bookingId}><div className="appointment-item"><span className="date-chip"><b>{parts.day}</b><small>{parts.month}</small></span><div><strong>{doctorView?item.patientName:item.doctorName}</strong><p>{item.date||'Date pending'} · {item.time} · {item.status}</p><small>{item.bookingId}</small></div><button type="button" onClick={()=>setSelected(open?'':item.bookingId)}>{open?'Hide':'View details'}</button></div>{open&&<div className="appointment-details"><span><small>{doctorView?'Doctor':'Patient'}</small><b>{doctorView?item.doctorName:item.patientName}</b></span><span><small>Payment</small><b>{item.paymentStatus}{item.fee?` · ₹${item.fee}`:''}</b></span><span><small>Reference</small><b>{item.paymentId||item.bookingId}</b></span></div>}</div>});
}

export function DoctorAppointmentsPanel({overview=false}) {
  const sync=useSynchronizedAppointments();
  const today=new Date().toISOString().slice(0,10);const todayVisits=sync.appointments.filter(item=>item.date===today);const shown=overview?(todayVisits.length?todayVisits:sync.appointments.slice(0,5)):sync.appointments;
  return <article className={`dash-panel dash-appointments ${overview?'':'module-live'}`}><div className="dash-panel__head"><div><h2>{overview?'Today’s synchronized schedule':'Doctor appointments'}</h2><p>Shared doctor calendar account: sushantkumar07rewa@gmail.com</p></div><SyncButton syncing={sync.syncing} onClick={sync.synchronize}/></div>{sync.message&&<p className="dash-sync-message"><CheckCircle2/>{sync.message}</p>}{sync.error&&<div className="dash-empty"><b>Synchronization unavailable</b><p>{sync.error}</p></div>}<AppointmentRows appointments={shown} doctorView/></article>;
}

export function DoctorAppointmentCalendar() {
  const sync=useSynchronizedAppointments();
  const initialDate=sync.appointments.find(item=>item.date)?.date;
  const initialMonth=initialDate&&/^\d{4}-\d{2}-\d{2}$/.test(initialDate)?new Date(`${initialDate}T00:00:00`):new Date();
  const [visibleMonth,setVisibleMonth]=useState(()=>new Date(initialMonth.getFullYear(),initialMonth.getMonth(),1));
  const [selectedDate,setSelectedDate]=useState('');
  const [calendarInitialized,setCalendarInitialized]=useState(false);
  useEffect(()=>{if(!calendarInitialized&&initialDate){setSelectedDate(initialDate);setVisibleMonth(new Date(`${initialDate}T00:00:00`));setCalendarInitialized(true)}},[calendarInitialized,initialDate]);
  const year=visibleMonth.getFullYear(),month=visibleMonth.getMonth();
  const daysInMonth=new Date(year,month+1,0).getDate(),firstDay=new Date(year,month,1).getDay();
  const dateKey=day=>`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const visitsByDate=sync.appointments.reduce((map,item)=>{if(item.date)(map[item.date]??=[]).push(item);return map},{});
  const selectedVisits=visitsByDate[selectedDate]||[];
  const moveMonth=offset=>{setVisibleMonth(new Date(year,month+offset,1));setSelectedDate('')};
  return <aside className="dash-panel doctor-calendar"><div className="dash-panel__head"><div><h2>Shared appointment calendar</h2><p>Synced for sushantkumar07rewa@gmail.com</p></div><button className="calendar-refresh" type="button" onClick={sync.synchronize} disabled={sync.syncing} aria-label="Synchronize calendar"><RefreshCw className={sync.syncing?'spinning':''}/></button></div><div className="calendar-toolbar"><button type="button" onClick={()=>moveMonth(-1)} aria-label="Previous month"><ChevronLeft/></button><strong>{visibleMonth.toLocaleString('en',{month:'long',year:'numeric'})}</strong><button type="button" onClick={()=>moveMonth(1)} aria-label="Next month"><ChevronRight/></button></div><div className="calendar-weekdays">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=><span key={day}>{day}</span>)}</div><div className="calendar-grid">{Array.from({length:firstDay},(_,index)=><span className="calendar-blank" key={`blank-${index}`}/>)}{Array.from({length:daysInMonth},(_,index)=>{const day=index+1,key=dateKey(day),count=visitsByDate[key]?.length||0;return <button type="button" key={key} className={`${count?'has-appointment':''} ${selectedDate===key?'selected':''}`} onClick={()=>setSelectedDate(key)}><span>{day}</span>{count>0&&<small>{count}</small>}</button>})}</div><div className="calendar-legend"><i/> Appointment date</div>{sync.error&&<p className="calendar-error">{sync.error}</p>}{selectedDate&&<div className="calendar-selection"><b>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</b>{selectedVisits.length?selectedVisits.map(item=><span key={item.bookingId}><strong>{item.time}</strong> {item.patientName}<small>{item.bookingId}</small></span>):<p>No appointments on this date.</p>}</div>}</aside>;
}

export function PatientDashboardModule({active}) {
  const sync=useSynchronizedAppointments();
  if(active==='appointments')return <article className="dash-panel module-live"><div className="dash-panel__head"><div><h2>My appointments</h2><p>Confirmed visits matched with your account email.</p></div><SyncButton syncing={sync.syncing} onClick={sync.synchronize}/></div>{sync.message&&<p className="dash-sync-message"><CheckCircle2/>{sync.message}</p>}{sync.error&&<div className="dash-empty"><b>Synchronization unavailable</b><p>{sync.error}</p></div>}<AppointmentRows appointments={sync.appointments}/></article>;
  if(active==='records')return <article className="dash-panel module-live"><div className="dash-panel__head"><div><h2>Health records</h2><p>Clinical documents associated with your synchronized visits.</p></div><FileHeart/></div>{sync.appointments.length?<div className="dash-empty"><FileHeart/><b>No reports uploaded yet</b><p>Your doctor can attach prescriptions and reports after consultation.</p></div>:<div className="dash-empty"><FileHeart/><b>No appointment-linked records</b><p>Synchronize a confirmed appointment first.</p></div>}</article>;
  return <article className="dash-panel module-live"><div className="dash-panel__head"><div><h2>Billing and receipts</h2><p>Payment references for synchronized bookings.</p></div><CreditCard/></div>{sync.appointments.filter(item=>item.paymentStatus==='paid').map(item=><div className="record-row" key={item.bookingId}><ReceiptText/><span><b>₹{item.fee||'—'} · {item.doctorName}</b><small>{item.bookingId} · {item.paymentId||'Payment reference pending'}</small></span><a className="dash-action-link" href="#ai-assistant">Refund enquiry</a></div>)}{!sync.appointments.some(item=>item.paymentStatus==='paid')&&<div className="dash-empty"><CreditCard/><b>No paid receipts found</b><p>Paid appointment receipts will appear after synchronization.</p></div>}<section className="refund-policy"><Stethoscope/><div><b>Refund policy</b><p>Duplicate or failed bookings are reviewed using the booking ID and payment reference. Approved refunds return to the original payment method according to the payment provider’s processing time.</p></div></section></article>;
}
