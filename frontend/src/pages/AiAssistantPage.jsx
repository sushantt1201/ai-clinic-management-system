import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Bot, CalendarDays, ChevronRight, CircleHelp, Clock3, HeartPulse,
  MapPin, Menu, Mic, Paperclip, PhoneCall, RotateCcw, Send, ShieldCheck,
  Sparkles, Stethoscope, UserRound, X,
} from 'lucide-react';
import './AiAssistantPage.css';
import './ChatActions.css';
import { apiRequest } from '../services/api.js';

const suggestions = [
  { icon: CalendarDays, label: 'Book an appointment', prompt: 'I want to book an appointment' },
  { icon: Stethoscope, label: 'Find a specialist', prompt: 'Help me find the right specialist' },
  { icon: Clock3, label: 'Clinic hours', prompt: 'What are the clinic opening hours?' },
  { icon: MapPin, label: 'Location & directions', prompt: 'Where is the clinic located?' },
];

const doctorGuide = `Our currently bookable doctors are:

• Dr. Ananya Sharma — General Medicine (₹400): fever, cold, infections, headaches, diabetes, blood-pressure monitoring, routine checkups, and general adult health concerns.
• Dr. Rahul Mehta — Dental Care (₹500): toothache, cavities, gum problems, dental cleaning, mouth discomfort, and routine dental examinations.
• Dr. Priya Verma — Cardiology (₹600): heart-health consultations, high blood pressure, palpitations, cholesterol concerns, and follow-up care for known cardiac conditions.

For diet and lifestyle guidance, begin with General Medicine. The doctor can assess your needs and recommend an appropriate nutrition or specialist consultation. This guide helps select a department; it is not a diagnosis. For severe chest pain, breathing difficulty, unconsciousness, or another emergency, call 112 immediately.`;

const initialMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hello! I’m People’s Clinic AI Assistant. I can help with appointments, doctors, services, clinic hours, and general hospital information. How may I help you today?',
  time: 'Now',
};

function ChatMessage({ message }) {
  const isAssistant = message.role === 'assistant';
  return <article className={`clinic-message clinic-message--${message.role}`}><span className="clinic-message__avatar">{isAssistant?<Bot/>:<UserRound/>}</span><div><div className="clinic-message__meta"><b>{isAssistant?'People’s Clinic AI':'You'}</b><small>{message.time}</small></div><div className="clinic-message__bubble">{message.text}</div></div></article>;
}

export default function AiAssistantPage() {
  const [messages,setMessages]=useState([initialMessage]);
  const [input,setInput]=useState('');
  const [sidebar,setSidebar]=useState(false);
  const [isTyping,setIsTyping]=useState(false);
  const conversationRef=useRef(null);
  const sessionRef=useRef(localStorage.getItem('peoples-clinic-chat-session')||crypto.randomUUID());

  useEffect(()=>{localStorage.setItem('peoples-clinic-chat-session',sessionRef.current)},[]);
  useEffect(()=>{conversationRef.current?.scrollTo({top:conversationRef.current.scrollHeight,behavior:'smooth'})},[messages,isTyping]);

  async function sendMessage(text=input){
    const clean=text.trim();
    if(!clean)return;
    const now=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    setMessages(current=>[...current,{id:crypto.randomUUID(),role:'user',text:clean,time:now}]);
    setInput('');
    setIsTyping(true);
    try{
      const result=await apiRequest('/assistant/chat',{method:'POST',body:JSON.stringify({message:clean,sessionId:sessionRef.current})});
      setMessages(current=>[...current,{id:crypto.randomUUID(),role:'assistant',text:result.answer,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);
    }catch(error){
      setMessages(current=>[...current,{id:crypto.randomUUID(),role:'assistant',text:error.message||'The clinic assistant is temporarily unavailable. Please try again.',time:'Now'}]);
    }finally{setIsTyping(false)}
  }

  function submit(event){event.preventDefault();sendMessage()}
  function reset(){sessionRef.current=crypto.randomUUID();localStorage.setItem('peoples-clinic-chat-session',sessionRef.current);setMessages([initialMessage]);setInput('')}
  function showDoctorGuide(){setMessages(current=>[...current,{id:crypto.randomUUID(),role:'user',text:'Which doctor should I consult?',time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})},{id:crypto.randomUUID(),role:'assistant',text:doctorGuide,time:'Now'}]);setSidebar(false)}

  return <main className="clinic-chat-page">
    <header className="clinic-chat-header">
      <a href="#home" className="clinic-chat-brand"><span><HeartPulse/></span><div><strong>People’s Clinic</strong><small>AI Health Assistant</small></div></a>
      <div className="clinic-chat-status"><i/>AI assistant online</div>
      <div className="clinic-chat-header__actions"><a href="tel:+911234567890"><PhoneCall/>Call clinic</a><button onClick={reset} aria-label="Start a new conversation"><RotateCcw/></button></div>
    </header>

    <div className="clinic-chat-shell">
      <aside className={sidebar?'open':''}>
        <div className="clinic-chat-aside__head"><b>How can we help?</b><button onClick={()=>setSidebar(false)} aria-label="Close assistant menu"><X/></button></div>
        <p>Choose a common topic or type your own question.</p>
        <div className="clinic-topic-list">{suggestions.map(({icon:Icon,label,prompt})=><button key={label} onClick={()=>{sendMessage(prompt);setSidebar(false)}}><span><Icon/></span>{label}<ChevronRight/></button>)}</div>
        <div className="clinic-assurance"><ShieldCheck/><div><b>Your privacy matters</b><p>Please avoid sharing passwords, OTPs, or sensitive payment information.</p></div></div>
        <div className="clinic-emergency"><PhoneCall/><div><b>Medical emergency?</b><p>Do not wait for chat. Call emergency services immediately.</p><a href="tel:112">Call 112</a></div></div>
      </aside>

      <section className="clinic-conversation">
        <div className="clinic-conversation__top"><button className="clinic-chat-menu" onClick={()=>setSidebar(true)}><Menu/></button><div className="clinic-bot-mark"><Bot/></div><div><h1>Hospital Help Assistant</h1><p><span/>Online · Usually replies instantly</p></div><a href="#home"><ArrowLeft/>Back to website</a></div>
        <div className="clinic-conversation__body" ref={conversationRef} aria-live="polite">
          <div className="clinic-chat-intro"><span><Sparkles/></span><h2>Healthcare guidance, without the wait</h2><p>Ask about appointments, departments, doctors, timings, facilities, or visiting the clinic.</p></div>
          {messages.map(message=><ChatMessage message={message} key={message.id}/>)}
          {messages.length===1&&<div className="clinic-quick-prompts">{suggestions.slice(0,3).map(({label,prompt})=><button key={label} onClick={()=>sendMessage(prompt)}>{label}</button>)}</div>}
          <div className="clinic-chat-actions"><a href="#appointments"><CalendarDays/>Book my appointment</a><button type="button" onClick={showDoctorGuide}><Stethoscope/>Doctor guide</button><button type="button" onClick={()=>sendMessage('Explain the clinic refund rules and how I can check a refund status.')}><ShieldCheck/>Refund help</button></div>
          {isTyping&&<div className="clinic-typing"><span/><span/><span/><small>Assistant is preparing a response</small></div>}
        </div>
        <footer className="clinic-composer">
          <form onSubmit={submit}>
            <button type="button" aria-label="Attach a document"><Paperclip/></button>
            <textarea value={input} onChange={event=>setInput(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage()}}} placeholder="Ask a hospital-related question…" rows="1" aria-label="Message the clinic assistant"/>
            <button type="button" aria-label="Use voice input"><Mic/></button>
            <button className="clinic-send" disabled={!input.trim()||isTyping} aria-label="Send message"><Send/></button>
          </form>
          <p><CircleHelp/>AI provides general clinic information and does not replace a doctor’s diagnosis.</p>
        </footer>
      </section>
    </div>
  </main>;
}
