import { useCallback, useEffect, useState } from 'react';
import { ArrowUp, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, CreditCard, Download, ExternalLink, FileHeart, FileText, LoaderCircle, Pill, Plus, ReceiptText, RefreshCw, Save, Search, Send, Stethoscope, Trash2, UploadCloud, UserRound } from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { printPrescription } from '../utils/prescription-print.js';
import { printMedicalSummary } from '../utils/summary-print.js';
import MedicalSummary from '../components/MedicalSummary.jsx';
import './ConsultationEditor.css';
import './PrescriptionWorkspace.css';

export function normalizeAppointment(item={}) {
  const date=String(item.appointment_date||item.appointmentDate||item.date||item.Date||'').trim();
  return {
    bookingId:item.booking_id||item.bookingId||item.Booking_ID||'Not assigned',
    patientName:item.patient_name||item.patientName||item.Patient||'Patient',
    patientEmail:item.email||item.patient_email||item.patientEmail||item.email_address||item.emailAddress||item.patient_email_address||item.Email||item.Email_ID||item['Email Address']||item['Patient Email']||'',
    patientPhone:item.phone||item.patient_phone||item.patientPhone||item.Phone||'',
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

function localDateKey(date=new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function appointmentTimeMinutes(value) {
  const match=String(value||'').trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if(!match)return Number.MAX_SAFE_INTEGER;
  let hours=Number(match[1]);
  if(match[3]){hours%=12;if(match[3].toUpperCase()==='PM')hours+=12}
  return hours*60+Number(match[2]);
}

function sortAppointmentsChronologically(items) {
  return [...items].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||appointmentTimeMinutes(a.time)-appointmentTimeMinutes(b.time));
}

export function useSynchronizedAppointments() {
  const [appointments,setAppointments]=useState([]),[error,setError]=useState(''),[syncing,setSyncing]=useState(false),[message,setMessage]=useState('');
  const synchronize=useCallback(async()=>{setSyncing(true);setError('');setMessage('');try{const data=await apiRequest('/appointments');const visits=(data.appointments||[]).map(normalizeAppointment);setAppointments(visits);setMessage(`${visits.length} appointment${visits.length===1?'':'s'} synchronized.`)}catch(err){setError(err.message)}finally{setSyncing(false)}},[]);
  useEffect(()=>{synchronize()},[synchronize]);
  return {appointments,error,syncing,message,synchronize};
}

function SyncButton({syncing,onClick,label='Synchronize appointments'}) { return <button className="dash-sync" type="button" onClick={onClick} disabled={syncing}><RefreshCw className={syncing?'spinning':''}/>{syncing?'Synchronizing…':label}</button>; }

function AppointmentRowsBase({appointments,doctorView=false}) {
  const [selected,setSelected]=useState('');
  if(!appointments.length)return <div className="dash-empty"><CalendarDays/><b>No synchronized appointments</b><p>New confirmed bookings will appear here.</p></div>;
  return appointments.map(item=>{const parts=appointmentDateParts(item.date);const open=selected===item.bookingId;return <div className="appointment-entry" key={item.bookingId}><div className="appointment-item"><span className="date-chip"><b>{parts.day}</b><small>{parts.month}</small></span><div><strong>{doctorView?item.patientName:item.doctorName}</strong><p>{item.date||'Date pending'} · {item.time} · {item.status}</p><small>{item.bookingId}</small></div><button type="button" onClick={()=>setSelected(open?'':item.bookingId)}>{open?'Hide':'View details'}</button></div>{open&&<div className="appointment-details"><span><small>{doctorView?'Doctor':'Patient'}</small><b>{doctorView?item.doctorName:item.patientName}</b></span><span><small>Payment</small><b>{item.paymentStatus}{item.fee?` · ₹${item.fee}`:''}</b></span><span><small>Reference</small><b>{item.paymentId||item.bookingId}</b></span></div>}</div>});
}

function DoctorConsultationEditor({ appointment }) {
  const emptyMedicine={medicineName:'',dosage:'',times:['morning'],instructions:'',durationDays:7};
  const [form,setForm]=useState({clinicalNotes:'',recommendedTests:'',nextVisitDate:'',prescriptions:[emptyMedicine]}),[reports,setReports]=useState([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  useEffect(()=>{let live=true;Promise.all([apiRequest(`/consultations/${encodeURIComponent(appointment.bookingId)}`),appointment.patientEmail?apiRequest(`/consultations/patient-reports/${encodeURIComponent(appointment.patientEmail)}`):Promise.resolve({reports:[]})]).then(([consultationData,reportData])=>{if(!live)return;const saved=consultationData.consultation;if(saved)setForm({...saved,prescriptions:saved.prescriptions?.length?saved.prescriptions:[emptyMedicine]});setReports(reportData.reports||[])}).catch(err=>live&&setError(err.message)).finally(()=>live&&setLoading(false));return()=>{live=false}},[appointment.bookingId,appointment.patientEmail]);
  const update=(field,value)=>setForm(current=>({...current,[field]:value}));
  const updateMedicine=(index,field,value)=>setForm(current=>({...current,prescriptions:current.prescriptions.map((medicine,itemIndex)=>itemIndex===index?{...medicine,[field]:value}:medicine)}));
  const toggleTime=(index,time)=>setForm(current=>({...current,prescriptions:current.prescriptions.map((medicine,itemIndex)=>itemIndex===index?{...medicine,times:medicine.times.includes(time)?medicine.times.filter(item=>item!==time):[...medicine.times,time]}:medicine)}));
  async function save(status){setSaving(true);setError('');setMessage('');try{const data=await apiRequest(`/consultations/${encodeURIComponent(appointment.bookingId)}`,{method:'PUT',body:JSON.stringify({...form,status,patientEmail:appointment.patientEmail,patientName:appointment.patientName,appointmentDate:appointment.date})});setForm(current=>({...current,...data.consultation,prescriptions:data.consultation.prescriptions?.length?data.consultation.prescriptions:current.prescriptions}));setMessage(data.message);window.dispatchEvent(new CustomEvent('doctor-consultation-updated',{detail:{bookingId:appointment.bookingId,status}}));if(status==='completed')window.dispatchEvent(new Event('close-doctor-consultation'))}catch(err){setError(err.message)}finally{setSaving(false)}}
  useEffect(()=>{const actions=document.querySelector('.consultation-editor .consultation-actions'),header=document.querySelector('.consultation-editor .consultation-editor__head');if(!actions||!header)return;const printButton=document.createElement('button'),closeButton=document.createElement('button');printButton.type='button';printButton.className='print-prescription';printButton.textContent='Print / save PDF';printButton.onclick=()=>printPrescription({...form,bookingId:appointment.bookingId,patientName:appointment.patientName,patientEmail:appointment.patientEmail,doctorName:form.doctorName||appointment.doctorName,appointmentDate:appointment.date},appointment);closeButton.type='button';closeButton.className='consultation-close';closeButton.textContent='Close';closeButton.onclick=()=>window.dispatchEvent(new Event('close-doctor-consultation'));actions.prepend(printButton);header.append(closeButton);return()=>{printButton.remove();closeButton.remove()}},[form,appointment]);
  if(loading)return <div className="consultation-loading"><LoaderCircle className="spinning"/>Loading patient consultation…</div>;
  return <section className="consultation-editor"><div className="consultation-editor__head"><div><h3>Consultation workspace</h3><p>{appointment.patientEmail||'Patient email is missing from the appointment record'}</p></div><span>{form.status||'draft'}</span></div>{error&&<p className="report-error">{error}</p>}{message&&<p className="dash-sync-message"><CheckCircle2/>{message}</p>}<div className="consultation-fields"><label>Clinical notes<textarea value={form.clinicalNotes||''} onChange={event=>update('clinicalNotes',event.target.value)} placeholder="Symptoms, observations, diagnosis discussion and advice…"/></label><label>Recommended tests<textarea value={form.recommendedTests||''} onChange={event=>update('recommendedTests',event.target.value)} placeholder="Tests, scans or laboratory work to be completed…"/></label><label>Next appointment date<input type="date" value={form.nextVisitDate||''} onChange={event=>update('nextVisitDate',event.target.value)}/></label></div><div className="prescription-editor"><div className="prescription-editor__head"><div><h3>Prescription</h3><p>Add medicines that will appear in the patient’s medication schedule.</p></div><button type="button" onClick={()=>update('prescriptions',[...form.prescriptions,{...emptyMedicine}])}><Plus/>Add medicine</button></div>{form.prescriptions.map((medicine,index)=><div className="prescription-line" key={index}><input value={medicine.medicineName} onChange={event=>updateMedicine(index,'medicineName',event.target.value)} placeholder="Medicine name"/><input value={medicine.dosage} onChange={event=>updateMedicine(index,'dosage',event.target.value)} placeholder="Dosage"/><div className="prescription-times">{Object.keys({morning:1,afternoon:1,evening:1,night:1}).map(time=><label key={time}><input type="checkbox" checked={medicine.times?.includes(time)||false} onChange={()=>toggleTime(index,time)}/>{time}</label>)}</div><input value={medicine.instructions||''} onChange={event=>updateMedicine(index,'instructions',event.target.value)} placeholder="Instructions"/><label className="duration-field"><input type="number" min="1" max="365" value={medicine.durationDays||7} onChange={event=>updateMedicine(index,'durationDays',event.target.value)}/> days</label><button type="button" className="remove-prescription" onClick={()=>update('prescriptions',form.prescriptions.filter((_,itemIndex)=>itemIndex!==index))} aria-label="Remove medicine"><Trash2/></button></div>)}</div><div className="patient-report-preview"><div><h3>Patient health summaries</h3><p>Only AI summaries explicitly shared by the patient are shown. Original documents remain private.</p></div>{reports.map(report=><article key={report._id}><FileText/><span><b>{report.title}</b><small>{report.reportType?.replaceAll('-',' ')} · shared {new Date(report.sharedAt||report.createdAt).toLocaleDateString('en-IN')}</small><MedicalSummary summary={report.aiSummary} compact/></span></article>)}{!reports.length&&<p className="consultation-empty">The patient has not shared any AI health summaries.</p>}</div><div className="consultation-actions"><button type="button" disabled={saving} onClick={()=>save('draft')}><Save/>Save draft</button><button type="button" disabled={saving||!appointment.patientEmail} onClick={()=>save('sent')}><Send/>Send to patient</button><button type="button" disabled={saving||!appointment.patientEmail} onClick={()=>save('completed')}><CheckCircle2/>Complete visit</button></div></section>;
}

function DoctorAppointmentRows({ appointments }) {
  const [selected,setSelected]=useState('');
  useEffect(()=>{const close=()=>setSelected('');window.addEventListener('close-doctor-consultation',close);return()=>window.removeEventListener('close-doctor-consultation',close)},[]);
  if(!appointments.length)return <div className="dash-empty"><CalendarDays/><b>No synchronized appointments</b><p>New confirmed bookings will appear here.</p></div>;
  return appointments.map(item=>{const parts=appointmentDateParts(item.date),open=selected===item.bookingId;return <div className="appointment-entry doctor-appointment-entry" key={item.bookingId}><div className="appointment-item"><span className="date-chip"><b>{parts.day}</b><small>{parts.month}</small></span><div><strong>{item.patientName}</strong><p>{item.date||'Date pending'} · {item.time} · {item.status}</p><small>{item.bookingId}</small></div><button type="button" onClick={()=>setSelected(open?'':item.bookingId)}>{open?'Close details':'Show details'}</button></div>{open&&<DoctorConsultationEditor appointment={item}/>}</div>});
}

function AppointmentRows(props) {
  return props.doctorView?<DoctorAppointmentRows appointments={props.appointments}/>:<AppointmentRowsBase {...props}/>;
}

export function DoctorAppointmentsPanel({overview=false}) {
  const sync=useSynchronizedAppointments();
  const [consultationStatuses,setConsultationStatuses]=useState({});
  const loadStatuses=useCallback(async()=>{try{const data=await apiRequest('/consultations/doctor');setConsultationStatuses(Object.fromEntries((data.consultations||[]).map(item=>[item.bookingId,item.status])))}catch{/* Keep appointment history available when status synchronization is unavailable. */}},[]);
  useEffect(()=>{loadStatuses();const update=event=>setConsultationStatuses(current=>({...current,[event.detail.bookingId]:event.detail.status}));window.addEventListener('doctor-consultation-updated',update);return()=>window.removeEventListener('doctor-consultation-updated',update)},[loadStatuses]);
  const todayVisits=sortAppointmentsChronologically(sync.appointments.filter(item=>item.date===localDateKey()&&consultationStatuses[item.bookingId]!=='completed'));
  const shown=overview?todayVisits:sortAppointmentsChronologically(sync.appointments);
  return <article className={`dash-panel dash-appointments ${overview?'':'module-live'}`}><div className="dash-panel__head"><div><h2>{overview?'Today’s unfinished appointments':'All doctor appointments'}</h2><p>{overview?'Earliest scheduled visit appears first. Completed visits leave this queue automatically.':'Complete appointment history across every date.'}</p></div><SyncButton syncing={sync.syncing} onClick={()=>{sync.synchronize();loadStatuses()}}/></div>{sync.error&&<div className="dash-empty"><b>Synchronization unavailable</b><p>{sync.error}</p></div>}<AppointmentRows appointments={shown} doctorView/></article>;
}

export function DoctorPatientsPanel() {
  const sync=useSynchronizedAppointments();
  const [query,setQuery]=useState('');
  const filtered=sortAppointmentsChronologically(sync.appointments).filter(item=>`${item.patientName} ${item.bookingId}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <article className="dash-panel module-live doctor-patients"><div className="dash-panel__head"><div><h2>Patient directory</h2><p>Every synchronized patient appointment remains searchable.</p></div><SyncButton syncing={sync.syncing} onClick={sync.synchronize}/></div><label className="patient-directory-search"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search by patient name or appointment ID" aria-label="Search patients"/></label>{sync.error&&<div className="dash-empty"><b>Patient directory unavailable</b><p>{sync.error}</p></div>}{!sync.error&&!filtered.length&&<div className="dash-empty"><UserRound/><b>No matching patient found</b><p>Try a patient name or a complete appointment ID.</p></div>}{filtered.map(item=><div className="patient-directory-row" key={item.bookingId}><span className="patient-avatar"><UserRound/></span><div><strong>{item.patientName}</strong><p>{item.patientEmail||'Email unavailable'}{item.patientPhone?` · ${item.patientPhone}`:''}</p></div><span><small>Appointment</small><b>{item.bookingId}</b></span><span><small>Visit</small><b>{item.date||'Date pending'} · {item.time}</b></span></div>)}</article>;
}

export function DoctorAppointmentCalendar() {
  const sync=useSynchronizedAppointments();
  const [consultationStatuses,setConsultationStatuses]=useState({});
  const loadStatuses=useCallback(async()=>{try{const data=await apiRequest('/consultations/doctor');setConsultationStatuses(Object.fromEntries((data.consultations||[]).map(item=>[item.bookingId,item.status])))}catch{/* Calendar appointments remain available if consultation status cannot be refreshed. */}},[]);
  useEffect(()=>{const timer=window.setTimeout(loadStatuses,0);const update=event=>setConsultationStatuses(current=>({...current,[event.detail.bookingId]:event.detail.status}));window.addEventListener('doctor-consultation-updated',update);return()=>{window.clearTimeout(timer);window.removeEventListener('doctor-consultation-updated',update)}},[loadStatuses]);
  const visibleAppointments=sync.appointments.filter(item=>consultationStatuses[item.bookingId]!=='completed');
  const initialDate=visibleAppointments.find(item=>item.date)?.date;
  const initialMonth=initialDate&&/^\d{4}-\d{2}-\d{2}$/.test(initialDate)?new Date(`${initialDate}T00:00:00`):new Date();
  const [visibleMonth,setVisibleMonth]=useState(()=>new Date(initialMonth.getFullYear(),initialMonth.getMonth(),1));
  const [selectedDate,setSelectedDate]=useState('');
  const [calendarInitialized,setCalendarInitialized]=useState(false);
  useEffect(()=>{if(!calendarInitialized&&initialDate){setSelectedDate(initialDate);setVisibleMonth(new Date(`${initialDate}T00:00:00`));setCalendarInitialized(true)}},[calendarInitialized,initialDate]);
  const year=visibleMonth.getFullYear(),month=visibleMonth.getMonth();
  const daysInMonth=new Date(year,month+1,0).getDate(),firstDay=new Date(year,month,1).getDay();
  const dateKey=day=>`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const visitsByDate=visibleAppointments.reduce((map,item)=>{if(item.date)(map[item.date]??=[]).push(item);return map},{});
  const selectedVisits=visitsByDate[selectedDate]||[];
  const moveMonth=offset=>{setVisibleMonth(new Date(year,month+offset,1));setSelectedDate('')};
  useEffect(()=>{document.querySelectorAll('.dashboard--doctor .doctor-calendar .calendar-grid>button').forEach((button,index)=>{const key=dateKey(index+1);button.classList.remove('past-appointment','upcoming-appointment');if(visitsByDate[key]?.length)button.classList.add(key<localDateKey()?'past-appointment':'upcoming-appointment')})},[year,month,visibleAppointments]);
  return <aside className="dash-panel doctor-calendar"><div className="dash-panel__head"><div><h2>Shared appointment calendar</h2><p>Select a date, then open an appointment to begin the consultation.</p></div><button className="calendar-refresh" type="button" onClick={()=>{sync.synchronize();loadStatuses()}} disabled={sync.syncing} aria-label="Synchronize calendar"><RefreshCw className={sync.syncing?'spinning':''}/></button></div><div className="calendar-toolbar"><button type="button" onClick={()=>moveMonth(-1)} aria-label="Previous month"><ChevronLeft/></button><strong>{visibleMonth.toLocaleString('en',{month:'long',year:'numeric'})}</strong><button type="button" onClick={()=>moveMonth(1)} aria-label="Next month"><ChevronRight/></button></div><div className="calendar-weekdays">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=><span key={day}>{day}</span>)}</div><div className="calendar-grid">{Array.from({length:firstDay},(_,index)=><span className="calendar-blank" key={`blank-${index}`}/>)}{Array.from({length:daysInMonth},(_,index)=>{const day=index+1,key=dateKey(day),count=visitsByDate[key]?.length||0;return <button type="button" key={key} className={`${count?'has-appointment':''} ${selectedDate===key?'selected':''}`} onClick={()=>setSelectedDate(key)}><span>{day}</span>{count>0&&<small>{count}</small>}</button>})}</div><div className="calendar-legend"><i/> Unfinished appointment</div>{sync.error&&<p className="calendar-error">{sync.error}</p>}{selectedDate&&<div className="calendar-selection calendar-consultations"><b>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</b>{selectedVisits.length?<DoctorAppointmentRows appointments={sortAppointmentsChronologically(selectedVisits)}/>:<p>No unfinished appointments on this date.</p>}</div>}</aside>;
}

function MedicalRecordsPanel() {
  const [reports,setReports]=useState([]),[loading,setLoading]=useState(true),[uploading,setUploading]=useState(false),[,setSelectedFile]=useState(null),[message,setMessage]=useState(''),[error,setError]=useState('');
  const loadReports=useCallback(async()=>{setLoading(true);setError('');try{const data=await apiRequest('/medical-reports');setReports(data.reports||[])}catch(err){setError(err.message)}finally{setLoading(false)}},[]);
  useEffect(()=>{const timer=window.setTimeout(loadReports,0);return()=>window.clearTimeout(timer)},[loadReports]);
  useEffect(()=>{if(!reports.some(report=>report.summaryStatus==='pending'))return;const timer=window.setInterval(loadReports,5000);return()=>window.clearInterval(timer)},[reports,loadReports]);
  async function uploadReport(event){event.preventDefault();setUploading(true);setError('');setMessage('');const files=[...(event.currentTarget.elements.report.files||[])];try{if(!files.length)throw new Error('Select one or more medical reports');const supportedTypes=['application/pdf','image/jpeg','image/png','image/webp'];for(const file of files){if(file.size>15*1024*1024)throw new Error(`${file.name} must be smaller than 15 MB`);if(!supportedTypes.includes(file.type))throw new Error(`${file.name} must be a PDF, JPG, PNG or WEBP file`)}const uploaded=[];for(const file of files){const fileData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error(`${file.name} could not be read`));reader.readAsDataURL(file)});const data=await apiRequest('/medical-reports',{method:'POST',body:JSON.stringify({fileData,fileName:file.name,mimeType:file.type,size:file.size})});uploaded.push(data.report)}setReports(current=>[...uploaded.reverse(),...current.filter(item=>!uploaded.some(report=>report._id===item._id))]);setMessage(`${uploaded.length} medical report${uploaded.length===1?'':'s'} uploaded. AI processing continues in the background.`);event.currentTarget.reset();setSelectedFile(null)}catch(err){setError(err.message)}finally{setUploading(false)}}
  useEffect(()=>{const input=document.querySelector('.report-upload input[type="file"]');if(input)input.setAttribute('multiple','')},[]);
  async function summarizeReport(id){setError('');setMessage('Generating the AI health summary…');setReports(current=>current.map(report=>report._id===id?{...report,summaryStatus:'pending'}:report));try{const data=await apiRequest(`/medical-reports/${id}/summarize`,{method:'POST'});setReports(current=>current.map(report=>report._id===id?data.report:report));setMessage(data.message)}catch(err){setError(err.message);await loadReports()}}
  const formatSize=size=>size>=1024*1024?`${(size/(1024*1024)).toFixed(1)} MB`:`${Math.max(1,Math.round(size/1024))} KB`;
  async function shareReport(report){if(report.sharedWithDoctor)return;setError('');try{const data=await apiRequest(`/medical-reports/${report._id}/share`,{method:'PATCH'});setReports(current=>current.map(item=>item._id===report._id?data.report:item))}catch(err){setError(err.message)}}
  async function importPrescription(report){setError('');try{const data=await apiRequest(`/medical-reports/${report._id}/import-medications`,{method:'POST'});setMessage(data.message)}catch(err){setError(err.message)}}
  async function removeReport(report){if(!window.confirm(`Remove ${report.title} permanently?`))return;setError('');try{const data=await apiRequest(`/medical-reports/${report._id}`,{method:'DELETE'});setReports(current=>current.filter(item=>item._id!==report._id));setMessage(data.message)}catch(err){setError(err.message)}}
  return <article className="dash-panel module-live medical-records"><div className="dash-panel__head"><div><h2>Health records</h2><p>Upload a report directly. Its title and document type are detected automatically.</p></div><FileHeart/></div><form className="report-upload report-upload--simple" onSubmit={uploadReport}><label className="report-drop"><UploadCloud/><span><b>Select or drop a medical report</b><small>PDF, JPG, PNG or WEBP · Maximum 15 MB · Details are filled automatically</small></span><input name="report" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required/></label><button className="report-submit" disabled={uploading}>{uploading?<><LoaderCircle className="spinning"/>Uploading…</>:<><UploadCloud/>Upload report</>}</button></form>{message&&<p className="dash-sync-message"><CheckCircle2/>{message}</p>}{error&&<p className="report-error">{error}</p>}<div className="report-list"><div className="report-list__heading"><h3>My uploaded reports</h3><button type="button" onClick={loadReports} disabled={loading}><RefreshCw className={loading?'spinning':''}/>Refresh</button></div>{reports.map(report=><div className="report-row" key={report._id}><span className="report-row__icon"><FileText/></span><span><b>{report.title}</b><small>{report.originalName} · {report.reportType?.replaceAll('-',' ')} · {formatSize(report.size)} · {new Date(report.createdAt).toLocaleDateString('en-IN')}</small><em>{report.summaryStatus==='ready'?'AI summary ready':report.summaryStatus==='pending'?'Extracting and summarizing in background…':'AI summary needs a retry'}{report.sharedWithDoctor?' · Shared':''}</em>{report.summaryError&&report.summaryStatus==='failed'&&<small className="report-summary-error">{report.summaryError}</small>}{report.aiSummary&&<MedicalSummary summary={report.aiSummary}/>}</span><div className="report-row__actions"><a href={report.fileUrl} target="_blank" rel="noreferrer">Original<ExternalLink/></a>{report.summaryStatus==='ready'&&<button type="button" onClick={()=>printMedicalSummary(report)}><Download/>Summary PDF</button>}{report.reportType==='prescription'&&report.summaryStatus==='ready'&&<button type="button" onClick={()=>importPrescription(report)}><Pill/>Import medicines</button>}<button className="report-share-icon" type="button" disabled={report.summaryStatus!=='ready'||report.sharedWithDoctor} onClick={()=>shareReport(report)} title={report.sharedWithDoctor?'Shared with doctor':'Share summary with doctor'} aria-label={report.sharedWithDoctor?'Shared with doctor':'Share summary with doctor'}>{report.sharedWithDoctor?<Check/>:<ArrowUp/>}</button>{report.summaryStatus!=='ready'&&<button type="button" disabled={report.summaryStatus==='pending'} onClick={()=>summarizeReport(report._id)}>{report.summaryStatus==='pending'?'Processing…':'Retry summary'}</button>}<button type="button" className="report-delete" onClick={()=>removeReport(report)}><Trash2/>Remove</button></div></div>)}{!loading&&!reports.length&&<div className="dash-empty"><FileHeart/><b>No medical reports uploaded</b><p>Upload a report above; its details will be detected automatically.</p></div>}</div></article>;
}

export function PatientDashboardModule({active}) {
  const sync=useSynchronizedAppointments();
  if(active==='appointments')return <article className="dash-panel module-live"><div className="dash-panel__head"><div><h2>My appointments</h2><p>Confirmed visits matched with your account email.</p></div><SyncButton syncing={sync.syncing} onClick={sync.synchronize}/></div>{sync.message&&<p className="dash-sync-message"><CheckCircle2/>{sync.message}</p>}{sync.error&&<div className="dash-empty"><b>Synchronization unavailable</b><p>{sync.error}</p></div>}<AppointmentRows appointments={sync.appointments}/></article>;
  if(active==='records')return <MedicalRecordsPanel/>;
  return <article className="dash-panel module-live"><div className="dash-panel__head"><div><h2>Billing and receipts</h2><p>Payment references for synchronized bookings.</p></div><CreditCard/></div>{sync.appointments.filter(item=>item.paymentStatus==='paid').map(item=><div className="record-row" key={item.bookingId}><ReceiptText/><span><b>₹{item.fee||'—'} · {item.doctorName}</b><small>{item.bookingId} · {item.paymentId||'Payment reference pending'}</small></span><a className="dash-action-link" href="#ai-assistant">Refund enquiry</a></div>)}{!sync.appointments.some(item=>item.paymentStatus==='paid')&&<div className="dash-empty"><CreditCard/><b>No paid receipts found</b><p>Paid appointment receipts will appear after synchronization.</p></div>}<section className="refund-policy"><Stethoscope/><div><b>Refund policy</b><p>Duplicate or failed bookings are reviewed using the booking ID and payment reference. Approved refunds return to the original payment method according to the payment provider’s processing time.</p></div></section></article>;
}
