import { useEffect, useRef, useState, type FormEvent } from 'react';
import QRCode from 'qrcode';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';
import { scopeLabels, type TrainingScope } from '../api/_lib/mcp/config';
import './styles.css';
import './ai-assistants.css';

type Connection={id:string;clientName:string;scopes:string[];createdAt:string;lastUsedAt:string|null;expiresAt:string;revokedAt:string|null};
type Interaction={uid:string;challenge:string;csrf:string;clientName:string;scopes:string[];expiresAt:string;status:string;deepLink:string;returnTo?:string};
const endpoint='https://www.traeningsmester.dk/mcp';
const label=(scope:string)=>scopeLabels[scope as TrainingScope]||scope;
const date=(value:string|null)=>value?new Date(value).toLocaleString('da-DK'):'Endnu ikke brugt';
export default function AiAssistants(){
  const client=getSupabaseClient();
  const [session,setSession]=useState<Session|null>(null);const account=useRef<string|null>(null);
  const [ready,setReady]=useState(false);const [email,setEmail]=useState('');const [password,setPassword]=useState('');
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [connections,setConnections]=useState<Connection[]|null>(null);
  const [interaction,setInteraction]=useState<Interaction|null>(null);const [qr,setQr]=useState('');
  const params=new URLSearchParams(window.location.search);const uid=params.get('uid');
  const help=window.location.pathname==='/ai/help';
  useEffect(()=>{document.title=help?'Forbind din AI-assistent · Træningsmester':'Forbundne AI-assistenter · Træningsmester';
    const meta=document.querySelector<HTMLMetaElement>('meta[name="robots"]');if(meta)meta.content='noindex, nofollow';
    if(!client){setReady(true);return;}
    let eventSeen=false;let active=true;
    const change=(s:Session|null)=>{if(!active)return;const next=s?.user.id||null;if(account.current!==next)setConnections(null);account.current=next;setSession(s);setReady(true);};
    const sub=client.auth.onAuthStateChange((_event,s)=>{eventSeen=true;change(s);});
    void client.auth.getSession().then(({data})=>{if(!eventSeen)change(data.session);});
    return()=>{active=false;sub.data.subscription.unsubscribe();};
  },[client,help]);
  async function api(action:string,method='GET',payload?:unknown,authenticated=false){
    const owner=account.current;const token=session?.access_token;
    if(authenticated&&(!owner||!token))throw new Error('Log ind på din Træningsmester-konto først.');
    const response=await fetch(`/api/ai-connect?action=${action}`,{method,credentials:'same-origin',headers:{...(payload?{'Content-Type':'application/json'}:{}),...(authenticated?{Authorization:`Bearer ${token}`}:{})},...(payload?{body:JSON.stringify(payload)}:{})});
    if(authenticated&&account.current!==owner)throw new Error('Kontoen er skiftet. Prøv igen med den aktuelle konto.');
    const data=await response.json();if(!response.ok)throw new Error(response.status===401?'Din session er udløbet. Log ind igen.':response.status===429?'Der er kommet mange forsøg. Vent lidt og prøv igen.':'Forbindelsen kunne ikke hentes. Prøv igen eller start forbindelsen fra assistenten på ny.');return data;
  }
  useEffect(()=>{if(!session||uid||help)return;let active=true;void api('connections','GET',undefined,true).then(data=>{if(active)setConnections(data.connections);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[session?.user.id,uid,help]); // Account boundary is also checked inside api.
  useEffect(()=>{
    if(!uid||help)return;let active=true;let timer:ReturnType<typeof setTimeout>;
    const poll=async()=>{try{const data=await api(`interaction&uid=${encodeURIComponent(uid)}`) as Interaction;if(!active)return;
      if(data.status==='finished'&&data.returnTo){window.location.assign(data.returnTo);return;}
      setInteraction(data);setError('');
      if(data.status==='approve'||data.status==='deny'){const final=await api('finish','POST',{uid:data.uid,csrf:data.csrf});if(active)window.location.assign(final.returnTo);return;}
      timer=setTimeout(poll,2000);
    }catch(e){if(active)setError(e instanceof Error?e.message:'Forbindelsen kunne ikke godkendes.');}};
    void poll();return()=>{active=false;clearTimeout(timer);};
  },[uid,help]);
  useEffect(()=>{let active=true;if(interaction?.deepLink)void QRCode.toDataURL(interaction.deepLink,{width:224,margin:2,errorCorrectionLevel:'M'}).then(value=>{if(active)setQr(value);});return()=>{active=false;};},[interaction?.deepLink]);
  async function login(event:FormEvent){event.preventDefault();if(!client)return;setBusy(true);setError('');try{const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;setPassword('');}catch{setError('Login blev ikke godkendt. Kontrollér email og adgangskode.');}finally{setBusy(false);}}
  async function decide(decision:'approve'|'deny'){if(!interaction)return;setBusy(true);setError('');try{await api(decision,'POST',{challenge:interaction.challenge},true);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function revoke(id:string){setBusy(true);setError('');try{await api('revoke','POST',{connectionId:id},true);const data=await api('connections','GET',undefined,true);setConnections(data.connections);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  const loginForm=ready&&!session&&<form className="ai-login" onSubmit={login}><h2>Log ind på Træningsmester</h2><label>Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Adgangskode<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="ai-primary" disabled={busy||!client}>Log ind</button>{!client&&<p>Web-login er ikke konfigureret på denne installation.</p>}</form>;
  return <main className="ai-page"><header><a href="/" aria-label="Træningsmester forside"><img src="/brand/tm-logo-mark.svg" alt="Træningsmester" width="48" height="48"/></a><a href={help?'/ai/connections':'/ai/help'}>{help?'Dine forbindelser':'Tilslutningsvejledning'}</a></header>
    {help?<><h1>Din træning. Din assistent.</h1><p>Forbind din Træningsmester-konto, og arbejd med programmer, træning og historik i din AI-assistent.</p><p className="ai-endpoint">Serveradresse <code>{endpoint}</code></p>
      <section><h2>ChatGPT</h2><ol><li>Åbn Plugins i ChatGPT på web, vælg plus og derefter <strong>Add custom MCP server</strong>.</li><li>Angiv Træningsmester og serveradressen ovenfor. Vælg OAuth.</li><li>Godkend din konto gennem web-login eller mobilappen, og vælg forbindelsen i samtalen.</li></ol><p>Adgangen til egne MCP-forbindelser afhænger af din ChatGPT-plan og arbejdsområdets tilladelser. <a href="https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt" target="_blank" rel="noreferrer">Se OpenAI’s aktuelle krav</a>.</p></section>
      <section><h2>Claude</h2><ol><li>Åbn <strong>Settings → Customize → Connectors → Add connector → Add custom connector</strong>.</li><li>Indsæt serveradressen ovenfor. Vælg <strong>Sign in now</strong> og <strong>Register automatically (DCR)</strong>, og tilføj forbindelsen.</li><li>Godkend Træningsmester-kontoen, og aktivér forbindelsen i din samtale.</li></ol><p><a href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" target="_blank" rel="noreferrer">Claude’s tilslutningsvejledning</a>.</p></section>
      <section><h2>Codex</h2><p>Tilføj serveren i Codex’ MCP-indstillinger, eller brug terminalen:</p><pre><code>{`codex mcp add traeningsmester --url ${endpoint}\ncodex mcp login traeningsmester --scopes training:read,plans:write,exercises:write,workouts:write,history:write,preferences:write,data:transfer`}</code></pre><p>Godkend kontoen i den åbnede browser. Åbn derefter en ny Codex-samtale, så værktøjerne indlæses.</p></section>
      <section><h2>Det giver du adgang til</h2><p>Du vælger rettigheder ved tilslutningen. Med skriverettigheder kan assistenten også ændre og slette det tilknyttede træningsindhold uden en ekstra godkendelse fra Træningsmester. Assistenten kan selv bede dig bekræfte.</p><p>Appens gratis- og premiumregler gælder fortsat. Kun synkroniserede data er med; kladder på en offline telefon følger først med efter synkronisering.</p><p>Du kan altid tilbagekalde adgangen her eller under <strong>Forbundne AI-assistenter</strong> i appen.</p></section></>:
    uid?<><h1>Forbind din AI-assistent</h1>{interaction&&<><h2>{interaction.clientName}</h2><p>Kontrollér klientnavnet og rettighederne. Klientnavnet er angivet af assistenten.</p><ul className="ai-scopes">{interaction.scopes.map(s=><li key={s}>{label(s)}</li>)}</ul><p>Rettigheder til at skrive omfatter ændring og sletning uden en ekstra godkendelse fra Træningsmester. Du kan tilbagekalde forbindelsen senere.</p><div className="ai-approval"><section><h2>Godkend i mobilappen</h2>{qr&&<img className="ai-qr" src={qr} alt="Scan koden med telefonens kamera for at åbne godkendelsen i Træningsmester" width="224" height="224"/>}<a className="ai-primary ai-link-button" href={interaction.deepLink}>Åbn Træningsmester</a><p>Koden udløber {new Date(interaction.expiresAt).toLocaleTimeString('da-DK')}. Den indeholder ingen adgangskode eller kontotoken.</p></section><section>{session?<><h2>Godkend på sitet</h2><p>Logget ind som <strong>{session.user.email}</strong></p><button className="ai-primary" disabled={busy} onClick={()=>void decide('approve')}>Giv den viste adgang</button><button disabled={busy} onClick={()=>void decide('deny')}>Afvis forbindelse</button><button disabled={busy} onClick={()=>void client?.auth.signOut()}>Brug en anden konto</button></>:loginForm}</section></div></>}{!interaction&&!error&&<p role="status">Henter forbindelsen…</p>}</>:
    <><h1>Forbundne AI-assistenter</h1><p>Se, hvilken adgang du har givet, og tilbagekald den, når du ønsker det.</p>{loginForm}{session&&<><p>Logget ind som <strong>{session.user.email}</strong> <button onClick={()=>void client?.auth.signOut()}>Log ud</button></p>{connections===null&&!error&&<p role="status">Henter forbindelser…</p>}{connections?.length===0&&<p>Du har ingen forbundne AI-assistenter endnu. <a href="/ai/help">Se, hvordan du forbinder en assistent</a>.</p>}{connections?.map(item=><section className="ai-connection" key={item.id}><h2>{item.clientName}</h2><p>{item.revokedAt?'Adgang tilbagekaldt':new Date(item.expiresAt)<new Date()?'Adgang udløbet':'Aktiv forbindelse'}</p><ul>{item.scopes.map(s=><li key={s}>{label(s)}</li>)}</ul><p>Senest brugt: {date(item.lastUsedAt)}<br/>Oprettet: {date(item.createdAt)}<br/>Udløber: {date(item.expiresAt)}</p>{!item.revokedAt&&<button disabled={busy} onClick={()=>void revoke(item.id)}>Tilbagekald adgang</button>}</section>)}</>}</>}
    {error&&<p className="ai-error" role="alert">{error}</p>}<footer><a href="/privatliv">Privatliv</a><a href="/support">Support</a></footer></main>;
}
